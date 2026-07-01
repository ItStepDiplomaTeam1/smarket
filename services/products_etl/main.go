package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"smarket/services/products_etl/DTO"
	"syscall"
	"time"

	"smarket/services/products_etl/database"
	_ "smarket/services/products_etl/docs"
	"smarket/services/products_etl/internal/config"
	"smarket/services/products_etl/internal/service"
	"smarket/services/products_etl/usefulMethods"

	"github.com/jackc/pgx/v5/pgxpool"
	amqp "github.com/rabbitmq/amqp091-go"
	httpSwagger "github.com/swaggo/http-swagger/v2"
)

// @title           Products ETL Service API
// @version         1.0
// @description     ETL-сервіс для парсингу та синхронізації товарного каталогу з Zakaz.ua.
// @host            localhost:8082
// @BasePath        /

// healthHandler provides health check info
// @Summary     Перевірка стану сервісу
// @Description Повертає статус "ok" якщо сервіс запущений і доступний, а також перевіряє MongoDB
// @Tags        system
// @Produce     json
// @Success     200 {object} map[string]string "{"status":"ok","mongodb":"ok"}"
// @Router      /health [get]
func healthHandler(infra *database.Infrastructure) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()

		mongoStatus := "ok"
		if infra.MongoClient != nil {
			if err := infra.MongoClient.Ping(ctx, nil); err != nil {
				mongoStatus = "error"
			}
		} else {
			mongoStatus = "missing"
		}

		w.Header().Set("Content-Type", "application/json")
		if mongoStatus != "ok" {
			w.WriteHeader(http.StatusServiceUnavailable)
			_, _ = w.Write([]byte(fmt.Sprintf(`{"status":"error","mongodb":"%s"}`, mongoStatus)))
			return
		}

		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok","mongodb":"ok"}`))
	}
}


// getProductsHandler returns a list of products
// @Summary     Отримати список товарів з Zakaz.ua
// @Description Виконує запит до API Zakaz.ua та повертає список товарів для заданого магазину та категорії
// @Tags        products
// @Produce     json
// @Param       store_id     query string true "ID магазину (наприклад: 48215803)"
// @Param       category_id  query string true "ID категорії (наприклад: 4820000)"
// @Success     200 {object} DTO.ProductResponse "Список товарів"
// @Failure     502 {string} string "Помилка при запиті до Zakaz.ua"
// @Failure     500 {string} string "Помилка читання даних"
// @Router      /product/get [get]
func getProductsHandler(w http.ResponseWriter, r *http.Request) {
	storeID := r.URL.Query().Get("store_id")
	categoryID := r.URL.Query().Get("category_id")

	req := DTO.ProductRequest{
		StoreID:    storeID,
		CategoryID: categoryID,
	}

	offset := 0 // початкова сторінка (пагінейшн йопта)

	url := fmt.Sprintf("https://stores-api.zakaz.ua/stores/%s/categories/%s/products/?limit=100&offset=%d",
		req.StoreID, req.CategoryID, offset)

	resp, err := usefulMethods.MakeRequest("GET", url, nil, true)
	if err != nil {
		http.Error(w, "Ошибка при запросе к Zakaz.ua", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	// читається відповідь
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, "Ошибка чтения данных", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_, _ = w.Write(body)
}

// backfillHandler запускає повну реіндексацію товарів у Meilisearch
func backfillHandler(pgPool *pgxpool.Pool, searchServiceURL string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Println("[HTTP] Отримано запит на повний бекфілл індексу Meilisearch")
		
		go func() {
			_, err := service.RunFullBackfill(pgPool, searchServiceURL)
			if err != nil {
				log.Printf("[Backfill] Помилка асинхронного бекфіллу: %v", err)
			}
		}()

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusAccepted)
		_, _ = w.Write([]byte(`{"status":"started","message":"Процес повної реіндексації запустищено у фоні. Слідкуйте за логами products_etl."}`))
	}
}

func declareQueue(conn *amqp.Connection, name string) {
	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("[main] Не вдалось відкрити канал: %v", err)
	}
	defer ch.Close()
	_, err = ch.QueueDeclare(name, true, false, false, false, nil)
	if err != nil {
		log.Fatalf("[main] Не вдалось оголосити чергу: %v", err)
	}
	log.Printf("[main] Черга %q готова", name)
}

func main() {
	cfg := config.LoadConfig()

	// context.Background() без таймауту — InitInfrastructure сам керує
	// тривалістю кожної спроби (per-attempt 5s ping + retry loop 30 разів).
	infra, err := database.InitInfrastructure(context.Background(), cfg)
	if err != nil {
		log.Fatalf("Критична помилка ініціалізації інфраструктури: %v", err)
	}
	defer infra.Close(context.Background())

	log.Println("Усі підключення до БД та RabbitMQ успішно ініціалізовано!")

	var server *http.Server
	{
		mux := http.NewServeMux()

		if cfg.Environment == "development" {
			mux.Handle("/docs/", httpSwagger.Handler(
				httpSwagger.URL("/docs/doc.json"),
			))
			log.Println("[main] Swagger UI увімкнено (development mode)")
		}

		mux.HandleFunc("/health", healthHandler(infra))
		mux.HandleFunc("GET /product/get", getProductsHandler)
		mux.HandleFunc("POST /backfill", backfillHandler(infra.PgPool, cfg.SearchServiceURL))

		server = &http.Server{
			Addr:    ":8082",
			Handler: mux,
		}

		go func() {
			log.Println("HTTP сервер запущено на порті ", server.Addr)
			if cfg.Environment == "development" {
				log.Println("Swagger UI: http://localhost:8082/docs/index.html")
			}
			if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
				log.Fatalf("Помилка HTTP сервера: %v", err)
			}
		}()
	}

	migrateCtx, migrateCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer migrateCancel()
	if err := database.RunMigrations(migrateCtx, infra.PgPool); err != nil {
		log.Fatalf("Критична помилка міграції: %v", err)
	}

	seedCtx, seedCancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer seedCancel()
	if err := service.SeedStores(seedCtx, infra.PgPool); err != nil {
		log.Printf("WARN: не вдалось синхронізувати магазини: %v", err)
	}

	// SeedCategories запускається після SeedStores, оскільки потребує хоча б одного
	// активного магазину (слаги категорій глобальні — достатньо одного store).
	if err := service.SeedCategories(seedCtx, infra.PgPool); err != nil {
		log.Printf("WARN: не вдалось синхронізувати категорії: %v", err)
	}

	// Оголошується черга до старту горутин, щоб уникнути race condition
	declareQueue(infra.RabbitConn, cfg.ETLQueueName)

	// Горутина №1: Періодичне докачування устарілих даних (кожні 2 години)
	// Перевірка запускається ОДРАЗУ при старті, а потім кожні 2 години.
	go func() {
		ticker := time.NewTicker(2 * time.Hour)
		defer ticker.Stop()

		log.Println("[Scheduler] Горутина періодичного планувальника запущена (інтервал: 2 години)")

		// Функція перевірки застарілих магазинів
		runSchedulerCheck := func() {
			log.Println("[Scheduler] Перевірка застарілих даних магазинів...")
			rows, err := infra.PgPool.Query(context.Background(),
				// last_parsed_at — індексована колонка, яку TransformLoadWorker оновлює
				// після кожного успішного батчу. Це набагато швидше ніж GROUP BY на prices.
				// NULL означає: магазин ніколи не парсився (перший деплой або новий магазин).
				`SELECT external_id FROM stores
				 WHERE is_active = true
				   AND (last_parsed_at IS NULL
				        OR last_parsed_at < NOW() - INTERVAL '2 hours')
				 ORDER BY last_parsed_at ASC NULLS FIRST`)
			if err != nil {
				log.Printf("[Scheduler] Помилка запиту перевірки застарілих магазинів: %v", err)
				return
			}

			ch, err := infra.RabbitConn.Channel()
			if err != nil {
				log.Printf("[Scheduler] Помилка створення каналу RabbitMQ: %v", err)
				rows.Close()
				return
			}

			var count int
			for rows.Next() {
				var storeID string
				if err := rows.Scan(&storeID); err != nil {
					log.Printf("[Scheduler] Помилка сканування рядка: %v", err)
					continue
				}

				body, err := json.Marshal(service.ETLTask{StoreID: storeID})
				if err != nil {
					log.Printf("[Scheduler] Помилка маршалінгу store_id=%s: %v", storeID, err)
					continue
				}

				err = ch.Publish("", cfg.ETLQueueName, false, false, amqp.Publishing{
					DeliveryMode: amqp.Persistent,
					ContentType:  "application/json",
					Body:         body,
				})
				if err != nil {
					log.Printf("[Scheduler] Помилка публікації store_id=%s: %v", storeID, err)
					continue
				}
				log.Printf("[Scheduler] Поставлено у чергу store_id=%s (дані застаріли або відсутні)", storeID)
				count++
			}

			if err := rows.Err(); err != nil {
				log.Printf("[Scheduler] Помилка після читання рядків: %v", err)
			}
			ch.Close()
			rows.Close()
			log.Printf("[Scheduler] Перевірку застарілих даних завершено. Додано у чергу %d магазинів.", count)
		}

		// Запускаємо одразу при старті
		runSchedulerCheck()

		// Потім по тікеру
		for range ticker.C {
			runSchedulerCheck()
		}
	}()

	// Горутина №2: Extract & Load (Мережа → MongoDB)
	// Слухає чергу RabbitMQ, качає продукти по всіх категоріях та зберігає сирі JSON-сторінки в MongoDB.
	mongoDB := infra.MongoClient.Database(cfg.MongoDBName)
	go service.ExtractLoadWorker(infra.RabbitConn, mongoDB, cfg.ETLQueueName)
	log.Printf("[main] ExtractLoadWorker запущено (черга: %s, MongoDB: %s)", cfg.ETLQueueName, cfg.MongoDBName)

	// Горутина №3: Transform & Load (MongoDB → PostgreSQL → Meilisearch)
	// Опитує MongoDB на нові документи, трансформує їх та зберігає в Postgres.
	// Після кожного батчу надсилає оновлені товари в search_service для індексації.
	go service.TransformLoadWorker(infra.MongoClient, infra.PgPool, cfg.MongoDBName, cfg.SearchServiceURL)
	log.Printf("[main] TransformLoadWorker запущено (MongoDB: %s → PostgreSQL → Meilisearch via %s)", cfg.MongoDBName, cfg.SearchServiceURL)



	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	log.Println("Отримано сигнал зупинки. Завершення роботи...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("Помилка при зупинці HTTP сервера: %v", err)
	}
}
