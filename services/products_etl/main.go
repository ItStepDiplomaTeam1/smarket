package main

import (
	"context"
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
	"smarket/services/products_etl/usefulMethods"

	httpSwagger "github.com/swaggo/http-swagger/v2"
)

// @title           Products ETL Service API
// @version         1.0
// @description     ETL-сервіс для парсингу та синхронізації товарного каталогу з Zakaz.ua.
// @host            localhost:8082
// @BasePath        /

// healthHandler godoc
// @Summary     Перевірка стану сервісу
// @Description Повертає статус "ok" якщо сервіс запущений і доступний
// @Tags        system
// @Produce     json
// @Success     200 {object} map[string]string "{"status":"ok"}"
// @Router      /health [get]
func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(`{"status":"ok"}`))
}

// getProductsHandler godoc
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
	w.Write(body)
}

func main() {
	cfg := config.LoadConfig()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	infra, err := database.InitInfrastructure(ctx, cfg)
	if err != nil {
		log.Fatalf("Критична помилка ініціалізації інфраструктури: %v", err)
	}
	defer infra.Close(context.Background())

	log.Println("Усі підключення до БД та RabbitMQ успішно ініціалізовано!")

	_ = infra

	mux := http.NewServeMux()

	mux.Handle("/docs/", httpSwagger.Handler(
		httpSwagger.URL("/docs/doc.json"),
	))

	mux.HandleFunc("/health", healthHandler)
	mux.HandleFunc("GET /product/get", getProductsHandler)

	server := &http.Server{
		Addr:    ":8082",
		Handler: mux,
	}

	go func() {
		log.Println("HTTP сервер запущено на порті ", server.Addr)
		log.Println("Swagger UI: http://localhost:8082/docs/index.html")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Помилка HTTP сервера: %v", err)
		}
	}()

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
