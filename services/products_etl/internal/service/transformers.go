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

// нескінченний цикл, що опитує MongoDB на нові документи
// та трансформує їх у PostgreSQL. Запускати в окремій горутині
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
func runTransformBatch(ctx context.Context, collection *mongo.Collection, pgPool *pgxpool.Pool) error {
	docs, err := findNewDocuments(ctx, collection)
	if err != nil {
		return fmt.Errorf("читання з Mongo: %w", err)
	}

	if len(docs) == 0 {
		return nil // нічого нового — просто чекаємо
	}

	log.Printf("[Transform] Знайдено %d нових документів для обробки.", len(docs))

	for _, doc := range docs {
		docID, _ := doc["_id"].(bson.ObjectID)

		if err := processDocument(ctx, doc, pgPool); err != nil {
			log.Printf("[Transform] ✗ Помилка обробки документа %s: %v", docID.Hex(), err)
			// Позначаємо як "failed" щоб документ не крутивсь вічно в нескінченному циклі
			if markErr := markDocumentFailed(ctx, collection, docID, err.Error()); markErr != nil {
				log.Printf("[Transform] Не вдалось позначити документ %s як failed: %v", docID.Hex(), markErr)
			}
			continue
		}

		if err := markDocumentProcessed(ctx, collection, docID); err != nil {
			log.Printf("[Transform] Не вдалось позначити документ %s як оброблений: %v", docID.Hex(), err)
		}
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

// повна трансформація одного MongoDB-документа:
// категорія → EAN-дедублікація → запис ціни.
func processDocument(ctx context.Context, doc bson.M, pgPool *pgxpool.Pool) error {
	storeID, _ := doc["store_id"].(string)
	categorySlug, _ := doc["category_slug"].(string)

	// MongoDB зберігає []byte як BSON Binary-тип.
	// При читанні через bson.M він повертається як bson.Binary, а не []byte.
	// Type assertion .([]byte) завжди поверне nil — це і була причина помилки.
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

	// резолвимо slug → canonical_category_id
	categoryID, err := ResolveCategoryID(ctx, pgPool, categorySlug)
	if err != nil {
		return fmt.Errorf("резолв категорії %q: %w", categorySlug, err)
	}

	// розбираємо масив товарів з сирого JSON
	var page rawPage
	if err := json.Unmarshal(rawDataBytes, &page); err != nil {
		return fmt.Errorf("розбір raw_data: %w", err)
	}

	for _, product := range page.Results {
		if err := upsertProductAndPrice(ctx, pgPool, storeID, categoryID, product); err != nil {
			log.Printf("[Transform] Помилка при обробці товару EAN=%s: %v", product.EAN, err)
		}
	}

	return nil
}

// ResolveCategoryID шукає canonical_category_id для заданого slug у таблиці
// store_categories_mapping. Якщо слаг не знайдено — повертає unknownCategoryID
// і пише попередження в лог (щоб адмін міг додати маппинг).
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
// Крок 3: Дедублікація по EAN + Крок 4: Запис ціни
// ---------------------------------------------------------------------------

// upsertProductAndPrice — атомарна операція для одного товару:
// 1. Перевіряє чи існує товар з таким EAN у нашій БД.
// 2. Якщо ні — створює нову глобальну картку товару.
// 3. Записує актуальний зріз ціни в таблицю prices.
func upsertProductAndPrice(
	ctx context.Context,
	pgPool *pgxpool.Pool,
	storeID string,
	categoryID int,
	product rawProduct,
) error {
	// Всі три операції (знайти/створити товар + записати ціну) виконуємо
	// в одній транзакції — або всі успішно, або нічого.
	tx, err := pgPool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("BEGIN транзакції: %w", err)
	}
	// Rollback — безпечний, якщо транзакція вже закрита (Commit), поверне помилку яку ігноруємо.
	defer tx.Rollback(ctx) //nolint:errcheck

	// Крок 3: Знайти або створити глобальну картку товару
	productID, err := findOrCreateProduct(ctx, tx, categoryID, product)
	if err != nil {
		return fmt.Errorf("find or create product (EAN=%s): %w", product.EAN, err)
	}

	// Крок 4: Записати актуальну ціну
	if err := insertPrice(ctx, tx, productID, storeID, product); err != nil {
		return fmt.Errorf("insert price (product_id=%d): %w", productID, err)
	}

	// Фіксуємо транзакцію
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("COMMIT транзакції: %w", err)
	}

	return nil
}

// findOrCreateProduct перевіряє EAN у таблиці products і повертає product_id.
// Якщо товару ще нема — вставляє нову картку і повертає її ID.
//
// Використовуємо INSERT ... ON CONFLICT DO NOTHING + SELECT замість наївного
// SELECT → INSERT, щоб уникнути race condition при паралельних воркерах.
func findOrCreateProduct(ctx context.Context, tx pgx.Tx, categoryID int, p rawProduct) (int64, error) {
	// Спочатку спробуємо знайти вже існуючий товар по EAN
	const selectSQL = `
		SELECT id FROM products WHERE ean = $1 LIMIT 1
	`
	var productID int64
	err := tx.QueryRow(ctx, selectSQL, p.EAN).Scan(&productID)

	if err == nil {
		// Товар вже є — повертаємо його ID без зайвих запитів
		return productID, nil
	}

	if err != pgx.ErrNoRows {
		return 0, fmt.Errorf("SELECT products: %w", err)
	}

	// Товару немає — створюємо нову глобальну картку
	const insertSQL = `
		INSERT INTO products (ean, title, brand, unit, weight, canonical_category_id, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW())
		ON CONFLICT (ean) DO NOTHING
		RETURNING id
	`
	err = tx.QueryRow(ctx, insertSQL,
		p.EAN,
		p.Title,
		p.Brand,
		p.Unit,
		p.Weight,
		categoryID,
	).Scan(&productID)

	if err == pgx.ErrNoRows {
		// ON CONFLICT спрацював — інший воркер вже вставив цей товар. Читаємо його ID.
		err = tx.QueryRow(ctx, selectSQL, p.EAN).Scan(&productID)
		if err != nil {
			return 0, fmt.Errorf("SELECT після конфлікту: %w", err)
		}
		return productID, nil
	}

	if err != nil {
		return 0, fmt.Errorf("INSERT products: %w", err)
	}

	log.Printf("[Transform] ✚ Новий товар: EAN=%s, назва=%q, category_id=%d", p.EAN, p.Title, categoryID)
	return productID, nil
}

// insertPrice записує один рядок у транзакційну таблицю prices.
// Кожен запис — незмінний «зріз» ціни в конкретному магазині на конкретний момент.
func insertPrice(ctx context.Context, tx pgx.Tx, productID int64, storeID string, p rawProduct) error {
	const query = `
		INSERT INTO prices (product_id, store_id, price, old_price, in_stock, recorded_at)
		VALUES ($1, $2, $3, $4, $5, NOW())
	`
	_, err := tx.Exec(ctx, query,
		productID,
		storeID,
		p.Price,
		p.OldPrice, // nullable — pgx коректно конвертує *float64 → NULL
		p.InStock,
	)
	if err != nil {
		return fmt.Errorf("INSERT prices: %w", err)
	}
	return nil
}

// ---------------------------------------------------------------------------
// Крок 5: Позначення документа як оброблений
// ---------------------------------------------------------------------------

// markDocumentProcessed оновлює статус документа в MongoDB з "new" на "processed".
// Викликається лише після успішної обробки всіх товарів документа.
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
// з'являвся в черзі обробки і не спамив логи у нескінченному циклі.
// Зберігає текст помилки для подальшого аналізу адміном.
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
// Крок 1 (публічний alias) — для сумісності зі старими викликами
// ---------------------------------------------------------------------------

// FindActualProducts вичитує всі документи зі статусом "new" без ліміту.
// Використовується для одноразових запусків або тестів; для потокової обробки
// використовуйте findNewDocuments з лімітом всередині runTransformBatch.
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
