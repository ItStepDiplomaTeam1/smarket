package service

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"time"

	"smarket/services/products_etl/usefulMethods"

	amqp "github.com/rabbitmq/amqp091-go"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

// ETLTask - це типічна задача, яку отримає горутина з RabbitMQ
// приклад: {"store_id": "48201031"}
type ETLTask struct {
	StoreID string `json:"store_id"`
}

// відповідь API /stores/{store_id}/categories/
type categoriesResponse struct {
	Results []categoryItem `json:"results"`
}

type categoryItem struct {
	Slug string `json:"slug"`
}

// мінімальні поля сторінки для пагінації
type productsPageMeta struct {
	Count   int             `json:"count"`
	Next    *string         `json:"next"`
	Results json.RawMessage `json:"results"`
}

func ExtractLoadWorker(conn *amqp.Connection, mongoDB *mongo.Database, queueName string) {
	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("[ExtractLoad] Не вдалось відкрити канал RabbitMQ: %v", err)
	}
	defer ch.Close()

	q, err := ch.QueueDeclare(
		queueName, // name
		true,      // durable
		false,     // auto-delete
		false,     // exclusive
		false,     // no-wait
		nil,       // arguments
	)
	if err != nil {
		log.Fatalf("[ExtractLoad] Не вдалось оголосити чергу %q: %v", queueName, err)
	}

	// prefetchCount=1: не давати наступну задачу поки попередня не виконається
	if err := ch.Qos(1, 0, false); err != nil {
		log.Fatalf("[ExtractLoad] Помилка Qos: %v", err)
	}

	msgs, err := ch.Consume(
		q.Name, // queue
		"",     // consumer tag (авто)
		false,  // auto-ack — ставим false, ack вручную после успеха
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // args
	)
	if err != nil {
		log.Fatalf("[ExtractLoad] Не вдалось зареєструвати споживача: %v", err)
	}

	log.Printf("[ExtractLoad] Очікування задач у черзі %q...", queueName)

	for msg := range msgs {
		processTask(msg, mongoDB)
	}

	log.Println("[ExtractLoad] Канал RabbitMQ закрито, горутина завершена.")
}

func processTask(msg amqp.Delivery, mongoDB *mongo.Database) {
	var task ETLTask
	if err := json.Unmarshal(msg.Body, &task); err != nil {
		log.Printf("[ExtractLoad] Помилка розбору задачі: %v | body: %s", err, msg.Body)
		_ = msg.Nack(false, false) // відхилити без повторного надсилання
		return
	}

	if task.StoreID == "" {
		log.Printf("[ExtractLoad] Задача без store_id, пропускаємо. body: %s", msg.Body)
		_ = msg.Nack(false, false)
		return
	}

	log.Printf("[ExtractLoad] Отримано задачу: store_id=%s", task.StoreID)

	if err := runETL(task.StoreID, mongoDB); err != nil {
		log.Printf("[ExtractLoad] ETL для store_id=%s завершився з помилкою: %v", task.StoreID, err)
		// Возвращаем в очередь на повторную попытку (requeue=true)
		_ = msg.Nack(false, true)
		return
	}

	log.Printf("[ExtractLoad] ETL для store_id=%s успішно завершено. Підтверджуємо задачу.", task.StoreID)
	_ = msg.Ack(false)
}

// runETL — extract + load
func runETL(storeID string, mongoDB *mongo.Database) error {
	slugs, err := fetchCategorySlugs(storeID)
	if err != nil {
		return fmt.Errorf("сканування категорій: %w", err)
	}
	log.Printf("[ExtractLoad] store_id=%s: знайдено %d категорій", storeID, len(slugs))

	collection := mongoDB.Collection("raw_pages")

	for _, slug := range slugs {
		if err := fetchAndStoreCategory(storeID, slug, collection); err != nil {
			log.Printf("[ExtractLoad] store_id=%s slug=%s: помилка, продовжуємо: %v", storeID, slug, err)
		}
	}

	return nil
}

// GET /stores/{store_id}/categories/
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

	var catResp categoriesResponse
	if err := json.Unmarshal(body, &catResp); err != nil {
		return nil, fmt.Errorf("розбір JSON категорій: %w", err)
	}

	slugs := make([]string, 0, len(catResp.Results))
	for _, item := range catResp.Results {
		if item.Slug != "" {
			slugs = append(slugs, item.Slug)
		}
	}
	return slugs, nil
}

const (
	productsPageLimit = 100
)

// пробігає всі сторінки та зберігає по одній в mongo
func fetchAndStoreCategory(storeID, slug string, collection *mongo.Collection) error {
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
			log.Printf("[ExtractLoad] store_id=%s slug=%s page=%d: помилка запису в Mongo: %v",
				storeID, slug, page, err)
		} else {
			log.Printf("[ExtractLoad] store_id=%s slug=%s page=%d: збережено (%d товарів total=%d)",
				storeID, slug, page, len(meta.Results), meta.Count)
		}

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

type rawPageDocument struct {
	StoreID      string    `bson:"store_id"`
	CategorySlug string    `bson:"category_slug"`
	Page         int       `bson:"page"`
	FetchedAt    time.Time `bson:"fetched_at"`
	RawData      []byte    `bson:"raw_data"`
}

func saveRawPageToMongo(collection *mongo.Collection, storeID, slug string, page int, rawBody []byte) error {
	doc := bson.D{
		{Key: "store_id", Value: storeID},
		{Key: "category_slug", Value: slug},
		{Key: "page", Value: page},
		{Key: "fetched_at", Value: time.Now().UTC()},
		{Key: "raw_data", Value: rawBody}, // binary blob
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	_, err := collection.InsertOne(ctx, doc)
	if err != nil {
		return fmt.Errorf("InsertOne: %w", err)
	}
	return nil
}
