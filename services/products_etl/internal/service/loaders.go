package service

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"sync"
	"time"

	"smarket/services/products_etl/usefulMethods"

	amqp "github.com/rabbitmq/amqp091-go"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

// ---------------------------------------------------------------------------
// Типи задач та відповідей API
// ---------------------------------------------------------------------------

// ETLTask — повідомлення, яке горутина отримує з черги RabbitMQ.
// Приклад: {"store_id": "48201031"}
type ETLTask struct {
	StoreID string `json:"store_id"`
}

// categoryItem — один елемент масиву, що повертає /stores/{id}/categories/.
// API віддає голий масив: [{"id": "fresh-meat", ...}, ...].
// Поле називається "id", а не "slug" — саме воно використовується як slug у URL продуктів.
type categoryItem struct {
	Slug string `json:"id"` // в API це поле "id", але семантично — slug для URL
}

// productsPageMeta — мінімальні поля сторінки продуктів (для пагінації).
type productsPageMeta struct {
	Count   int             `json:"count"`
	Next    *string         `json:"next"`
	Results json.RawMessage `json:"results"`
}

// ---------------------------------------------------------------------------
// Константи
// ---------------------------------------------------------------------------

const productsPageLimit = 100

// ---------------------------------------------------------------------------
// Горутина №1: Extract & Load  (Мережа → MongoDB)
// ---------------------------------------------------------------------------

// ExtractLoadWorker слухає чергу RabbitMQ і для кожної задачі запускає повний
// цикл «скачати всі сторінки по всіх категоріях → зберегти сирі JSON у Mongo».
// Функція блокуюча; запускається в окремій горутині з main.go.
func ExtractLoadWorker(conn *amqp.Connection, mongoDB *mongo.Database, queueName string) {
	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("[ExtractLoad] Не вдалось відкрити канал RabbitMQ: %v", err)
	}
	defer ch.Close()

	// Оголошуємо чергу (idempotent — не страшно якщо вже існує).
	q, err := ch.QueueDeclare(
		queueName,
		true,  // durable  — черга переживає рестарт брокера
		false, // auto-delete
		false, // exclusive
		false, // no-wait
		nil,
	)
	if err != nil {
		log.Fatalf("[ExtractLoad] Не вдалось оголосити чергу %q: %v", queueName, err)
	}

	// prefetchCount=1: не брати наступну задачу, поки попередня не завершена.
	// Це гарантія, що один воркер не «з'їсть» всю чергу, якщо ETL повільний.
	if err := ch.Qos(1, 0, false); err != nil {
		log.Fatalf("[ExtractLoad] Помилка Qos: %v", err)
	}

	msgs, err := ch.Consume(
		q.Name,
		"",    // consumer tag — генерується автоматично
		false, // auto-ack=false: підтверджуємо вручну після успіху
		false, // exclusive
		false, // no-local
		false, // no-wait
		nil,
	)
	if err != nil {
		log.Fatalf("[ExtractLoad] Не вдалось зареєструвати споживача: %v", err)
	}

	log.Printf("[ExtractLoad] Очікування задач у черзі %q...", queueName)

	for msg := range msgs {
		processExtractTask(msg, mongoDB)
	}

	log.Println("[ExtractLoad] Канал RabbitMQ закрито, горутина завершена.")
}

// processExtractTask розбирає одне повідомлення з черги і запускає ETL для store_id.
// При помилці повертає повідомлення в чергу (nack + requeue), але не більше maxRetries разів.
const maxRetries = 3

func processExtractTask(msg amqp.Delivery, mongoDB *mongo.Database) {
	var task ETLTask
	if err := json.Unmarshal(msg.Body, &task); err != nil {
		log.Printf("[ExtractLoad] Помилка десеріалізації задачі: %v | body: %s", err, msg.Body)
		// Невалідний JSON — повторна спроба нічого не дасть, відкидаємо назавжди.
		_ = msg.Nack(false, false)
		return
	}

	if task.StoreID == "" {
		log.Printf("[ExtractLoad] Задача без store_id, пропускаємо. body: %s", msg.Body)
		_ = msg.Nack(false, false)
		return
	}

	log.Printf("[ExtractLoad] ▶ Починаємо ETL для store_id=%s", task.StoreID)

	if err := updatedRunExtractLoad(task.StoreID, mongoDB); err != nil {
		// Перевіряємо кількість повторних спроб
		retryCount := int64(0)
		if msg.Headers != nil {
			if rc, ok := msg.Headers["x-retry-count"]; ok {
				switch v := rc.(type) {
				case int64:
					retryCount = v
				case int32:
					retryCount = int64(v)
				}
			}
		}

		if retryCount >= int64(maxRetries) {
			log.Printf("[ExtractLoad] ✗ ETL для store_id=%s: вичерпано %d спроб, відкидаємо задачу: %v",
				task.StoreID, maxRetries, err)
			_ = msg.Nack(false, false) // дропаємо — більше не реквюїмо
		} else {
			log.Printf("[ExtractLoad] ✗ ETL для store_id=%s: спроба %d/%d, повертаємо у чергу: %v",
				task.StoreID, retryCount+1, maxRetries, err)
			_ = msg.Nack(false, true) // повертаємо в чергу
		}
		return
	}

	log.Printf("[ExtractLoad] ✓ ETL для store_id=%s успішно завершено.", task.StoreID)
	_ = msg.Ack(false)
}

//func runExtractLoad(storeID string, mongoDB *mongo.Database) error {
//	slugs, err := fetchCategorySlugs(storeID)
//	if err != nil {
//		return fmt.Errorf("сканування категорій: %w", err)
//	}
//	log.Printf("[ExtractLoad] store_id=%s: знайдено %d категорій", storeID, len(slugs))
//
//	collection := mongoDB.Collection("raw_pages")
//
//	for _, slug := range slugs {
//		if err := fetchAndStoreAllPages(storeID, slug, collection); err != nil {
//			// Логуємо помилку, але продовжуємо з наступною категорією.
//			// Вже збережені сторінки залишаються в Mongo — мережу не потрібно смикати повторно.
//			log.Printf("[ExtractLoad] store_id=%s slug=%s: помилка, пропускаємо: %v", storeID, slug, err)
//		}
//	}
//
//	return nil
//}

func updatedRunExtractLoad(storeID string, mongoDB *mongo.Database) error {
	// Фіксуємо час початку ETL для цього магазину.
	// TransformLoadWorker використовує цей час як межу:
	// товари, не оновлені після startTime, вважаються видаленими з каталогу.
	startTime := time.Now().UTC()

	slugs, err := fetchCategorySlugs(storeID)
	if err != nil {
		return fmt.Errorf("Сканування категорій: %w", err)
	}
	log.Printf("[ExtractLoad] store_id=%s: знайдено %d категорій", storeID, len(slugs))
	collection := mongoDB.Collection("raw_pages")

	jobs := make(chan string, len(slugs))

	var wg sync.WaitGroup
	var mu sync.Mutex
	var hasErrors bool // true якщо хоча б одна категорія завершилась з помилкою
	const workersNum = 5

	for w := 1; w <= workersNum; w++ {
		wg.Add(1)

		go func(workerID int) {
			defer wg.Done()

			for slug := range jobs {
				log.Printf("[Worker %d] ▶ Починаємо качати категорію: %s", workerID, slug)

				if err := fetchAndStoreAllPages(storeID, slug, collection); err != nil {
					log.Printf("[Worker %d] ✗ Помилка у категорії %s: %v", workerID, slug, err)
					mu.Lock()
					hasErrors = true
					mu.Unlock()
				} else {
					log.Printf("[Worker %d] ✓ Категорія %s повністю оброблена", workerID, slug)
				}
			}
		}(w)
	}

	for _, slug := range slugs {
		jobs <- slug
	}

	close(jobs)

	wg.Wait()

	// Якщо всі категорії успішно виконані — записуємо маркер завершення.
	// TransformLoadWorker знайде його і видалить товари, яких не було в цьому циклі.
	// Якщо були помилки — маркер НЕ пишемо, щоб не видалити товари помилково.
	if !hasErrors {
		if err := saveCompletionMarker(collection, storeID, startTime); err != nil {
			log.Printf("[ExtractLoad] WARN: не вдалось записати маркер завершення store=%s: %v", storeID, err)
			// Не фатально — cleanup просто не відбудеться цього разу
		} else {
			log.Printf("[ExtractLoad] ✔ Маркер завершення записано для store=%s", storeID)
		}
	} else {
		log.Printf("[ExtractLoad] WARN: store=%s завершено з помилками — маркер очищення не записано", storeID)
	}

	return nil
}

// saveCompletionMarker записує в MongoDB документ, який сигналізує TransformLoadWorker
// про успішне завершення повного ETL-циклу для магазину.
// started_at — час початку Extract, до якого все що старше вважається застарілим.
func saveCompletionMarker(collection *mongo.Collection, storeID string, startedAt time.Time) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_, err := collection.InsertOne(ctx, bson.D{
		{Key: "store_id", Value: storeID},
		{Key: "status", Value: "etl_complete"},
		{Key: "started_at", Value: startedAt},
		{Key: "saved_at", Value: time.Now().UTC()},
	})
	return err
}

// ---------------------------------------------------------------------------
// Допоміжні функції — HTTP-запити до Zakaz.ua API
// ---------------------------------------------------------------------------

// fetchCategorySlugs повертає плоский список slug-ів усіх категорій магазину.
// Zakaz.ua API повертає голий JSON-масив: [{"slug":"fruits",...}, ...]
func fetchCategorySlugs(storeID string) ([]string, error) {
	url := fmt.Sprintf("https://stores-api.zakaz.ua/stores/%s/categories/", storeID)

	resp, err := usefulMethods.MakeRequest("GET", url, nil, true)
	if err != nil {
		return nil, fmt.Errorf("HTTP запит до %s: %w", url, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("API повернув статус %d для %s", resp.StatusCode, url)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("читання тіла відповіді: %w", err)
	}

	// API повертає масив напряму, без обгортки {"results": [...]}
	var categories []categoryItem
	if err := json.Unmarshal(body, &categories); err != nil {
		return nil, fmt.Errorf("розбір JSON категорій: %w", err)
	}

	slugs := make([]string, 0, len(categories))
	for _, item := range categories {
		if item.Slug != "" {
			slugs = append(slugs, item.Slug)
		}
	}
	return slugs, nil
}

// fetchAndStoreAllPages пробігає всі сторінки однієї категорії та зберігає
// кожну сторінку як окремий документ у MongoDB.
// Якщо API відпаде на середині — вже збережені сторінки залишаться в Mongo.
func fetchAndStoreAllPages(storeID, slug string, collection *mongo.Collection) error {
	page := 1

	for {
		offset := (page - 1) * productsPageLimit
		url := fmt.Sprintf(
			"https://stores-api.zakaz.ua/stores/%s/categories/%s/products/?limit=%d&offset=%d",
			storeID, slug, productsPageLimit, offset,
		)

		rawBody, meta, err := fetchProductsPage(url)
		if err != nil {
			return fmt.Errorf("сторінка %d: %w", page, err)
		}

		if err := saveRawPageToMongo(collection, storeID, slug, page, rawBody); err != nil {
			// Помилка запису в Mongo — логуємо, але продовжуємо пагінацію.
			log.Printf("[ExtractLoad] store_id=%s slug=%s page=%d: помилка запису в Mongo: %v",
				storeID, slug, page, err)
		} else {
			log.Printf("[ExtractLoad] store_id=%s slug=%s page=%d: збережено (%d товарів, total=%d)",
				storeID, slug, page, len(meta.Results), meta.Count)
		}

		// Зупиняємось якщо немає наступної сторінки або повернулась порожня.
		if meta.Next == nil || len(meta.Results) == 0 {
			break
		}

		page++
	}

	return nil
}

func fetchProductsPage(url string) ([]byte, *productsPageMeta, error) {
	resp, err := usefulMethods.MakeRequest("GET", url, nil, true)
	if err != nil {
		return nil, nil, fmt.Errorf("HTTP запит: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return nil, nil, fmt.Errorf("API повернув статус %d для %s", resp.StatusCode, url)
	}

	rawBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, nil, fmt.Errorf("читання тіла: %w", err)
	}

	var meta productsPageMeta
	if err := json.Unmarshal(rawBody, &meta); err != nil {
		return nil, nil, fmt.Errorf("розбір мета-даних сторінки: %w", err)
	}

	return rawBody, &meta, nil
}

func saveRawPageToMongo(collection *mongo.Collection, storeID, slug string, page int, rawBody []byte) error {
	doc := bson.D{
		{Key: "store_id", Value: storeID},
		{Key: "category_slug", Value: slug},
		{Key: "page", Value: page},
		{Key: "fetched_at", Value: time.Now().UTC()},
		{Key: "status", Value: "new"},     // позначка для горутини №2
		{Key: "raw_data", Value: rawBody}, // повний JSON ритейлера
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	_, err := collection.InsertOne(ctx, doc)
	if err != nil {
		return fmt.Errorf("InsertOne: %w", err)
	}
	return nil
}
