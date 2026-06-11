package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

// резервний ID для категорій, яких ще нема в нашому маппінгу
const unknownCategoryID = 999

// ---------------------------------------------------------------------------
// Горутина №2: Transform & Load  (MongoDB → PostgreSQL)
// ---------------------------------------------------------------------------

// TransformLoadWorker — нескінченний цикл, що опитує MongoDB на нові документи
// та трансформує їх у PostgreSQL. Запускати в окремій горутині.
//
// Стратегія 3: після кожного успішного батчу надсилає pg_notify('products_updated', ...)
// щоб product_service (Python) міг моментально інвалідувати кеш.
func TransformLoadWorker(mongoClient *mongo.Client, pgPool *pgxpool.Pool, mongoDBName string) {
	collection := mongoClient.Database(mongoDBName).Collection("raw_pages")

	log.Println("[Transform] Воркер трансформації запущено.")

	for {
		time.Sleep(5 * time.Second)

		if err := runTransformBatch(context.Background(), collection, pgPool); err != nil {
			log.Printf("[Transform] Помилка обробки батчу: %v", err)
		}
	}
}

// runTransformBatch вичитує один батч «нових» документів і обробляє кожен.
// Після успішної обробки батчу надсилає pg_notify.
func runTransformBatch(ctx context.Context, collection *mongo.Collection, pgPool *pgxpool.Pool) error {
	docs, err := findNewDocuments(ctx, collection)
	if err != nil {
		return fmt.Errorf("читання з Mongo: %w", err)
	}

	if len(docs) == 0 {
		return nil // нічого нового — просто чекаємо
	}

	log.Printf("[Transform] Знайдено %d нових документів для обробки.", len(docs))

	processedStores := make(map[string]struct{}) // для pg_notify: які store_id оновились

	for _, doc := range docs {
		docID, _ := doc["_id"].(bson.ObjectID)
		storeID, _ := doc["store_id"].(string)

		if err := processDocument(ctx, doc, pgPool); err != nil {
			log.Printf("[Transform] ✗ Помилка обробки документа %s: %v", docID.Hex(), err)
			// Позначаємо як "failed" щоб документ не крутивсь вічно
			if markErr := markDocumentFailed(ctx, collection, docID, err.Error()); markErr != nil {
				log.Printf("[Transform] Не вдалось позначити документ %s як failed: %v", docID.Hex(), markErr)
			}
			continue
		}

		if err := markDocumentProcessed(ctx, collection, docID); err != nil {
			log.Printf("[Transform] Не вдалось позначити документ %s як оброблений: %v", docID.Hex(), err)
		}

		// Стратегія 3: збираємо унікальні store_id для pg_notify
		if storeID != "" {
			processedStores[storeID] = struct{}{}
		}
	}

	// Стратегія 3: надсилаємо pg_notify для кожного store_id, який оновився
	for storeID := range processedStores {
		notifyProductsUpdated(ctx, pgPool, storeID)
	}

	return nil
}

func findNewDocuments(ctx context.Context, collection *mongo.Collection) ([]bson.M, error) {
	filter := bson.M{"status": "new"}
	opts := options.Find().SetLimit(100)

	cursor, err := collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var docs []bson.M
	if err := cursor.All(ctx, &docs); err != nil {
		return nil, err
	}
	return docs, nil
}

// ---------------------------------------------------------------------------
// Типи для десеріалізації сирих даних
// ---------------------------------------------------------------------------

// rawProduct — мінімальна структура товару для десеріалізації з raw_data.
type rawProduct struct {
	ID       string   `json:"id"`
	Title    string   `json:"title"`
	EAN      string   `json:"ean"`
	Price    float64  `json:"price"`
	OldPrice *float64 `json:"old_price"`
	InStock  bool     `json:"in_stock"`
	Unit     string   `json:"unit"`
	Weight   float64  `json:"weight"`
	Brand    string   `json:"brand"`
}

// rawPage — структура сирої сторінки, що зберігається в MongoDB.
type rawPage struct {
	Results []rawProduct `json:"results"`
}

// ---------------------------------------------------------------------------
// Стратегія 2: Batch обробка одного MongoDB-документа
// ---------------------------------------------------------------------------

// processDocument — повна трансформація одного MongoDB-документа.
// Замість окремої транзакції на кожен товар, всі товари сторінки
// обробляються в одній транзакції (batch): значно менше round-trips до PG.
func processDocument(ctx context.Context, doc bson.M, pgPool *pgxpool.Pool) error {
	storeID, _ := doc["store_id"].(string)
	categorySlug, _ := doc["category_slug"].(string)

	// MongoDB зберігає []byte як BSON Binary-тип.
	var rawDataBytes []byte
	switch v := doc["raw_data"].(type) {
	case bson.Binary:
		rawDataBytes = v.Data
	case []byte:
		rawDataBytes = v
	}

	if storeID == "" || len(rawDataBytes) == 0 {
		return fmt.Errorf("документ не містить store_id або raw_data")
	}

	// Резолвимо slug → canonical_category_id
	categoryID, err := ResolveCategoryID(ctx, pgPool, categorySlug)
	if err != nil {
		return fmt.Errorf("резолв категорії %q: %w", categorySlug, err)
	}

	// Розбираємо масив товарів з сирого JSON
	var page rawPage
	if err := json.Unmarshal(rawDataBytes, &page); err != nil {
		return fmt.Errorf("розбір raw_data: %w", err)
	}

	if len(page.Results) == 0 {
		return nil // порожня сторінка — нічого робити
	}

	// Стратегія 2: одна транзакція на всю сторінку (100 товарів = 1 COMMIT замість 100)
	if err := batchUpsertPage(ctx, pgPool, storeID, categoryID, page.Results); err != nil {
		return fmt.Errorf("batch upsert для store=%s cat=%s: %w", storeID, categorySlug, err)
	}

	return nil
}

// ---------------------------------------------------------------------------
// Стратегія 2: batchUpsertPage — одна транзакція на всю сторінку
// ---------------------------------------------------------------------------

// batchUpsertPage виконує весь pipeline для одної сторінки (до 100 товарів)
// в межах однієї транзакції:
//  1. Bulk INSERT нових products (ON CONFLICT DO NOTHING)
//  2. Bulk SELECT product_id по EAN (щоб отримати ID всіх товарів)
//  3. Bulk INSERT prices для всієї сторінки
func batchUpsertPage(
	ctx context.Context,
	pgPool *pgxpool.Pool,
	storeID string,
	categoryID int,
	products []rawProduct,
) error {
	tx, err := pgPool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("BEGIN транзакції: %w", err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	// --- Крок 1: Batch INSERT нових товарів ---
	// ON CONFLICT DO NOTHING — безпечно при паралельних воркерах.
	// Товари, що вже існують, просто пропускаються.
	newCount := 0
	for _, p := range products {
		if p.EAN == "" {
			continue // Товар без EAN не можна дедублікувати
		}
		tag, err := tx.Exec(ctx, `
			INSERT INTO products (ean, title, brand, unit, weight, canonical_category_id, created_at)
			VALUES ($1, $2, $3, $4, $5, $6, NOW())
			ON CONFLICT (ean) DO NOTHING`,
			p.EAN, p.Title, p.Brand, p.Unit, p.Weight, categoryID,
		)
		if err != nil {
			log.Printf("[Transform] WARN: не вдалось INSERT product EAN=%s: %v", p.EAN, err)
			continue
		}
		if tag.RowsAffected() > 0 {
			newCount++
		}
	}
	if newCount > 0 {
		log.Printf("[Transform] ✚ Нових товарів у батчі: %d (store=%s cat_id=%d)", newCount, storeID, categoryID)
	}

	// --- Крок 2: Batch SELECT product_id по EAN ---
	// Збираємо EAN-и всіх товарів для масового SELECT
	eans := make([]string, 0, len(products))
	for _, p := range products {
		if p.EAN != "" {
			eans = append(eans, p.EAN)
		}
	}

	// Один SELECT для всіх EAN замість N окремих запитів
	rows, err := tx.Query(ctx,
		`SELECT id, ean FROM products WHERE ean = ANY($1)`,
		eans,
	)
	if err != nil {
		return fmt.Errorf("batch SELECT products: %w", err)
	}

	// Будуємо map: EAN → product_id
	eanToID := make(map[string]int64, len(products))
	for rows.Next() {
		var id int64
		var ean string
		if err := rows.Scan(&id, &ean); err != nil {
			rows.Close()
			return fmt.Errorf("scan product row: %w", err)
		}
		eanToID[ean] = id
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return fmt.Errorf("rows.Err після batch SELECT: %w", err)
	}

	// --- Крок 3: Batch INSERT prices ---
	// pgx.Batch дозволяє відправити всі INSERT в одному мережевому round-trip
	batch := &pgx.Batch{}
	priceCount := 0
	for _, p := range products {
		productID, ok := eanToID[p.EAN]
		if !ok {
			// Товар не знайшовся після INSERT — нестандартна ситуація, пропускаємо
			log.Printf("[Transform] WARN: product_id не знайдено для EAN=%s, пропускаємо ціну", p.EAN)
			continue
		}
		batch.Queue(`
			INSERT INTO prices (product_id, store_id, price, old_price, in_stock, recorded_at)
			VALUES ($1, $2, $3, $4, $5, NOW())`,
			productID, storeID, p.Price, p.OldPrice, p.InStock,
		)
		priceCount++
	}

	if priceCount > 0 {
		br := tx.SendBatch(ctx, batch)
		// Закриваємо батч (читаємо всі результати) — обов'язково перед Commit
		if err := br.Close(); err != nil {
			return fmt.Errorf("batch INSERT prices: %w", err)
		}
	}

	// Один COMMIT для всієї сторінки
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("COMMIT транзакції: %w", err)
	}

	log.Printf("[Transform] ✓ Батч завершено: store=%s cat_id=%d товарів=%d цін=%d",
		storeID, categoryID, len(products), priceCount)
	return nil
}

// ---------------------------------------------------------------------------
// ResolveCategoryID — резолв slug → canonical_category_id
// ---------------------------------------------------------------------------

// ResolveCategoryID шукає canonical_category_id для заданого slug у таблиці
// store_categories_mapping. Якщо слаг не знайдено — повертає unknownCategoryID.
func ResolveCategoryID(ctx context.Context, pgPool *pgxpool.Pool, categorySlug string) (int, error) {
	const query = `
		SELECT canonical_category_id
		FROM   store_categories_mapping
		WHERE  slug = $1
		LIMIT  1
	`

	var canonicalID int
	err := pgPool.QueryRow(ctx, query, categorySlug).Scan(&canonicalID)

	if err != nil {
		if err == pgx.ErrNoRows {
			log.Printf(
				"[Transform] WARN: category_slug %q не знайдено в store_categories_mapping. "+
					"Присвоєно тимчасовий ID=%d. Додайте маппинг до таблиці.",
				categorySlug, unknownCategoryID,
			)
			return unknownCategoryID, nil
		}
		return 0, fmt.Errorf("SELECT store_categories_mapping: %w", err)
	}

	return canonicalID, nil
}

// ---------------------------------------------------------------------------
// Стратегія 3: pg_notify — повідомляємо product_service про оновлення
// ---------------------------------------------------------------------------

// notifyProductsUpdated надсилає pg_notify на канал 'products_updated'.
// product_service (Python/asyncpg) слухає цей канал і інвалідує кеш.
// Помилка не є критичною — ETL продовжує роботу.
func notifyProductsUpdated(ctx context.Context, pgPool *pgxpool.Pool, storeID string) {
	payload := fmt.Sprintf(`{"store_id":"%s","ts":%d}`, storeID, time.Now().Unix())

	notifyCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	_, err := pgPool.Exec(notifyCtx,
		`SELECT pg_notify('products_updated', $1)`,
		payload,
	)
	if err != nil {
		log.Printf("[Transform] WARN: pg_notify для store_id=%s не вдалось: %v", storeID, err)
		return
	}
	log.Printf("[Transform] 📡 pg_notify надіслано: store_id=%s", storeID)
}

// ---------------------------------------------------------------------------
// Позначення документів у MongoDB
// ---------------------------------------------------------------------------

// markDocumentProcessed оновлює статус документа в MongoDB з "new" на "processed".
func markDocumentProcessed(ctx context.Context, collection *mongo.Collection, docID bson.ObjectID) error {
	filter := bson.M{"_id": docID}
	update := bson.M{
		"$set": bson.M{
			"status":       "processed",
			"processed_at": time.Now().UTC(),
		},
	}

	result, err := collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("UpdateOne: %w", err)
	}
	if result.ModifiedCount == 0 {
		return fmt.Errorf("документ %s не знайдено для оновлення", docID.Hex())
	}
	return nil
}

// markDocumentFailed позначає документ як "failed" щоб він більше не
// з'являвся в черзі обробки і не спамив логи.
func markDocumentFailed(ctx context.Context, collection *mongo.Collection, docID bson.ObjectID, reason string) error {
	filter := bson.M{"_id": docID}
	update := bson.M{
		"$set": bson.M{
			"status":    "failed",
			"error_msg": reason,
			"failed_at": time.Now().UTC(),
		},
	}

	_, err := collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("UpdateOne (failed): %w", err)
	}
	return nil
}

// ---------------------------------------------------------------------------
// FindActualProducts — публічний alias для сумісності/тестів
// ---------------------------------------------------------------------------

// FindActualProducts вичитує всі документи зі статусом "new" без ліміту.
// Використовується для одноразових запусків або тестів.
func FindActualProducts(ctx context.Context, collection *mongo.Collection) ([]bson.M, error) {
	filter := bson.M{"status": "new"}

	cursor, err := collection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var products []bson.M
	if err := cursor.All(ctx, &products); err != nil {
		return nil, err
	}
	return products, nil
}
