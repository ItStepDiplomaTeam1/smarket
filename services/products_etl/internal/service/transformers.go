package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
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

	// --- Другий прохід: маркери завершення ETL ---
	// Маркер з'являється тільки якщо ВСІ категорії store скачані без помилок.
	// Повертаємо маркери лише якщо для цього store вже немає документів зі статусом "new".
	markers, err := findReadyCompletionMarkers(ctx, collection)
	if err != nil {
		log.Printf("[Transform] Помилка пошуку маркерів завершення: %v", err)
	} else {
		for _, marker := range markers {
			docID, _ := marker["_id"].(bson.ObjectID)
			storeID, _ := marker["store_id"].(string)
			startedAt, _ := marker["started_at"].(time.Time)

			if storeID == "" {
				_ = markDocumentProcessed(ctx, collection, docID)
				continue
			}

			deleted, err := cleanupStaleStoreProducts(ctx, pgPool, storeID, startedAt)
			if err != nil {
				log.Printf("[Transform] ✗ Помилка очищення застарілих товарів store=%s: %v", storeID, err)
				if markErr := markDocumentFailed(ctx, collection, docID, err.Error()); markErr != nil {
					log.Printf("[Transform] Не вдалось позначити маркер %s як failed: %v", docID.Hex(), markErr)
				}
				continue
			}

			if deleted > 0 {
				log.Printf("[Transform] 🗑 store=%s: видалено %d застарілих товарів з каталогу магазину", storeID, deleted)
			} else {
				log.Printf("[Transform] ✓ store=%s: застарілих товарів не виявлено", storeID)
			}

			_ = markDocumentProcessed(ctx, collection, docID)
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

// findReadyCompletionMarkers повертає маркери завершення ETL (status=etl_complete),
// для яких вже немає невідпрацьованих документів з status=new.
// Завдяки цьому cleanup відбувається ТІЛЬКИ після того, як весь батч трансформовано.
func findReadyCompletionMarkers(ctx context.Context, collection *mongo.Collection) ([]bson.M, error) {
	pipeline := mongo.Pipeline{
		// Беремо лише маркери завершення
		{{Key: "$match", Value: bson.M{"status": "etl_complete"}}},
		// Підтягуємо документи status=new для того самого store_id
		{{Key: "$lookup", Value: bson.D{
			{Key: "from", Value: "raw_pages"},
			{Key: "let", Value: bson.D{{Key: "sid", Value: "$store_id"}}},
			{Key: "pipeline", Value: mongo.Pipeline{
				{{Key: "$match", Value: bson.D{
					{Key: "$expr", Value: bson.D{
						{Key: "$and", Value: bson.A{
							bson.D{{Key: "$eq", Value: bson.A{"$store_id", "$$sid"}}},
							bson.D{{Key: "$eq", Value: bson.A{"$status", "new"}}},
						}},
					}},
				}}},
				{{Key: "$limit", Value: 1}},
			}},
			{Key: "as", Value: "pending"},
		}}},
		// Беремо лише ті маркери, де pending порожній (всі сторінки оброблені)
		{{Key: "$match", Value: bson.M{"pending": bson.M{"$size": 0}}}},
		{{Key: "$limit", Value: 10}},
	}

	cursor, err := collection.Aggregate(ctx, pipeline)
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

// cleanupStaleStoreProducts видаляє з таблиці store_products всі записи,
// де last_seen_at < startedAt. Це означає: товар не зустрічався в поточному
// ETL-циклі й був видалений з каталогу магазину на Zakaz.ua.
// Повертає кількість видалених рядків.
func cleanupStaleStoreProducts(ctx context.Context, pgPool *pgxpool.Pool, storeID string, startedAt time.Time) (int64, error) {
	tag, err := pgPool.Exec(ctx,
		`DELETE FROM store_products
		 WHERE store_id   = $1
		   AND last_seen_at < $2`,
		storeID, startedAt,
	)
	if err != nil {
		return 0, fmt.Errorf("DELETE stale store_products (store=%s): %w", storeID, err)
	}
	return tag.RowsAffected(), nil
}

// ---------------------------------------------------------------------------
// Типи для десеріалізації сирих даних
// ---------------------------------------------------------------------------

// rawProducer — вкладена структура виробника (API може повертати producer.trademark).
type rawProducer struct {
	Trademark string `json:"trademark"`
	Name      string `json:"name"`
}

// rawDiscount — вкладена структура знижки (API може повертати discount.old_price).
type rawDiscount struct {
	OldPrice   *float64 `json:"old_price"`
	Percentage int      `json:"percentage"`
}

// rawProduct — структура товару для десеріалізації з raw_data.
// Підтримує як плоскі поля (brand, old_price), так і вкладені (producer.trademark, discount.old_price).
type rawProduct struct {
	ID       string   `json:"id"`
	SKU      string   `json:"sku"`
	Title    string   `json:"title"`
	EAN      string   `json:"ean"`
	Price    float64  `json:"price"`     // ціна в КОПІЙКАХ (10890 = 108.90 грн)
	OldPrice *float64 `json:"old_price"` // стара ціна (плоске поле, fallback)
	InStock  bool     `json:"in_stock"`
	Unit     string   `json:"unit"`
	Weight   float64  `json:"weight"`
	Brand    string   `json:"brand"` // бренд (плоске поле, fallback)

	// Вкладені об'єкти — API Zakaz.ua може повертати дані у вкладених структурах
	Producer *rawProducer    `json:"producer"`
	Discount *rawDiscount    `json:"discount"`
	Img      json.RawMessage `json:"img"` // може бути рядком або об'єктом
}

// resolvedBrand повертає бренд: спочатку плоске поле, потім producer.trademark.
func (p rawProduct) resolvedBrand() string {
	if p.Brand != "" {
		return p.Brand
	}
	if p.Producer != nil && p.Producer.Trademark != "" {
		return p.Producer.Trademark
	}
	return ""
}

// resolvedOldPrice повертає стару ціну (в копійках): спочатку плоске поле, потім discount.old_price.
func (p rawProduct) resolvedOldPrice() *float64 {
	if p.OldPrice != nil {
		return p.OldPrice
	}
	if p.Discount != nil && p.Discount.OldPrice != nil {
		return p.Discount.OldPrice
	}
	return nil
}

// resolvedImageURL витягує URL зображення з поля img.
// img може бути рядком ("https://...") або об'єктом ({"s350x350": "https://..."}).
func (p rawProduct) resolvedImageURL() string {
	if len(p.Img) == 0 {
		return ""
	}
	// Спроба як рядок
	var imgStr string
	if err := json.Unmarshal(p.Img, &imgStr); err == nil && imgStr != "" {
		return imgStr
	}
	// Спроба як об'єкт — беремо найбільше зображення
	var imgObj map[string]string
	if err := json.Unmarshal(p.Img, &imgObj); err == nil {
		// Пріоритет: s1350x1350 > s350x350 > s150x150 > будь-яке
		for _, key := range []string{"s1350x1350", "s350x350", "s200x200", "s150x150"} {
			if url, ok := imgObj[key]; ok && url != "" {
				return url
			}
		}
		// Будь-яке перше значення
		for _, url := range imgObj {
			if url != "" {
				return url
			}
		}
	}
	return ""
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

// cleanEAN очищує штрих-код від лідируючих нулів (GTIN-14 формат)
func cleanEAN(ean string) string {
	if len(ean) == 14 && ean[0] == '0' {
		return ean[1:]
	}
	return ean
}

// isValidEAN13 перевіряє, чи є рядок валідним штрих-кодом EAN-13
func isValidEAN13(ean string) bool {
	if len(ean) != 13 {
		return false
	}
	for _, ch := range ean {
		if ch < '0' || ch > '9' {
			return false
		}
	}
	sum := 0
	for i, ch := range ean[:12] {
		d := int(ch - '0')
		if i%2 == 0 {
			sum += d
		} else {
			sum += d * 3
		}
	}
	check := (10 - (sum % 10)) % 10
	return check == int(ean[12]-'0')
}

// batchUpsertPage виконує весь pipeline для одної сторінки (до 100 товарів)
// в межах однієї транзакції:
//  1. Bulk UPSERT products (ON CONFLICT DO UPDATE — оновлює метадані)
//  2. Bulk SELECT product_id по EAN або по store_product_id
//  3. Bulk INSERT prices (ціни конвертуються з копійок у гривні: ÷100)
//  4. Bulk INSERT store_products (зв'язок товар↔магазин)
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

	// --- Крок 1: Batch UPSERT товарів ---
	// ON CONFLICT DO UPDATE — оновлює метадані (title, brand, image_url) при повторному парсингу.
	newCount := 0
	for _, p := range products {
		var canonicalEAN *string
		cleanedEAN := cleanEAN(p.EAN)
		if isValidEAN13(cleanedEAN) {
			canonicalEAN = &cleanedEAN
		}

		storeProductID := p.SKU
		if storeProductID == "" {
			storeProductID = p.ID
		}

		brand := p.resolvedBrand()
		imageURL := p.resolvedImageURL()

		var tag pgconn.CommandTag
		var err error

		if canonicalEAN != nil {
			// Товар з валідним EAN — conflict по canonical_ean.
			// EAN є глобальним ідентифікатором — один товар з різних мереж
			// відображається в одному рядку products.
			tag, err = tx.Exec(ctx, `
				INSERT INTO products
					(canonical_ean, store_product_id, title, brand, unit, weight, image_url, canonical_category_id, created_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
				ON CONFLICT (canonical_ean) DO UPDATE SET
					title     = EXCLUDED.title,
					brand     = COALESCE(NULLIF(EXCLUDED.brand, ''), products.brand),
					unit      = EXCLUDED.unit,
					weight    = EXCLUDED.weight,
					image_url = COALESCE(NULLIF(EXCLUDED.image_url, ''), products.image_url)`,
				canonicalEAN, storeProductID, p.Title, brand, p.Unit, p.Weight, imageURL, categoryID,
			)
		} else {
			// Товар без EAN — прив'язаний до конкретного магазину через store_id.
			// Conflict по composite unique index (store_product_id, store_id) WHERE canonical_ean IS NULL.
			// Це гарантує, що однойменні SKU різних мереж НЕ конфліктують між собою.
			tag, err = tx.Exec(ctx, `
				INSERT INTO products
					(store_product_id, store_id, title, brand, unit, weight, image_url, canonical_category_id, created_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
				ON CONFLICT (store_product_id, store_id) WHERE canonical_ean IS NULL DO UPDATE SET
					title     = EXCLUDED.title,
					brand     = COALESCE(NULLIF(EXCLUDED.brand, ''), products.brand),
					unit      = EXCLUDED.unit,
					weight    = EXCLUDED.weight,
					image_url = COALESCE(NULLIF(EXCLUDED.image_url, ''), products.image_url)`,
				storeProductID, storeID, p.Title, brand, p.Unit, p.Weight, imageURL, categoryID,
			)
		}

		if err != nil {
			log.Printf("[Transform] WARN: не вдалось UPSERT product store_product_id=%s, EAN=%s: %v", storeProductID, p.EAN, err)
			continue
		}
		if tag.RowsAffected() > 0 {
			newCount++
		}
	}
	if newCount > 0 {
		log.Printf("[Transform] ✚ Нових товарів у батчі: %d (store=%s cat_id=%d)", newCount, storeID, categoryID)
	}

	// --- Крок 2: Batch SELECT product_id ---
	// Збираємо EAN-и та store_product_id товарів для масового SELECT
	eans := make([]string, 0, len(products))
	storeProductIDs := make([]string, 0, len(products))
	for _, p := range products {
		storeProductID := p.SKU
		if storeProductID == "" {
			storeProductID = p.ID
		}

		cleanedEAN := cleanEAN(p.EAN)
		if isValidEAN13(cleanedEAN) {
			eans = append(eans, cleanedEAN)
		} else {
			storeProductIDs = append(storeProductIDs, storeProductID)
		}
	}

	// Один SELECT для всіх EAN та store_product_id замість N окремих запитів.
	// Для товарів без EAN додатково фільтруємо по store_id, щоб не підхопити
	// однойменний SKU з іншої мережі.
	rows, err := tx.Query(ctx,
		`SELECT id, canonical_ean, store_product_id 
		 FROM products 
		 WHERE canonical_ean = ANY($1) 
		    OR (canonical_ean IS NULL AND store_product_id = ANY($2) AND store_id = $3)`,
		eans,
		storeProductIDs,
		storeID,
	)
	if err != nil {
		return fmt.Errorf("batch SELECT products: %w", err)
	}

	// Будуємо map: EAN → product_id та store_product_id → product_id
	eanToID := make(map[string]int64)
	storeProductIDToID := make(map[string]int64)

	for rows.Next() {
		var id int64
		var canonicalEAN *string
		var storeProductID *string
		if err := rows.Scan(&id, &canonicalEAN, &storeProductID); err != nil {
			rows.Close()
			return fmt.Errorf("scan product row: %w", err)
		}
		if canonicalEAN != nil {
			eanToID[*canonicalEAN] = id
		}
		if storeProductID != nil {
			storeProductIDToID[*storeProductID] = id
		}
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return fmt.Errorf("rows.Err після batch SELECT: %w", err)
	}

	// --- Крок 3: Batch INSERT prices + store_products ---
	// pgx.Batch дозволяє відправити всі INSERT в одному мережевому round-trip.
	// Ціни конвертуються з копійок у гривні (÷100).
	batch := &pgx.Batch{}
	priceCount := 0
	for _, p := range products {
		var productID int64
		var ok bool

		storeProductID := p.SKU
		if storeProductID == "" {
			storeProductID = p.ID
		}

		cleanedEAN := cleanEAN(p.EAN)
		if isValidEAN13(cleanedEAN) {
			productID, ok = eanToID[cleanedEAN]
		} else {
			productID, ok = storeProductIDToID[storeProductID]
		}

		if !ok {
			log.Printf("[Transform] WARN: product_id не знайдено для store_product_id=%s (EAN=%s), пропускаємо", storeProductID, p.EAN)
			continue
		}

		// Конвертація цін з копійок у гривні (API повертає 10890 = 108.90 грн)
		priceUAH := p.Price / 100.0
		var oldPriceUAH *float64
		if resolved := p.resolvedOldPrice(); resolved != nil {
			v := *resolved / 100.0
			oldPriceUAH = &v
		}

		// Крок 3: INSERT ціни лише якщо вона змінилась з моменту останнього запису.
		// Порівнюємо: ціна, стара ціна та наявність. Якщо все однакове — пропускаємо.
		// Це запобігає безконтрольному зростанню таблиці prices при кожному перепарсингу.
		batch.Queue(`
			INSERT INTO prices (product_id, store_id, price, old_price, in_stock, recorded_at)
			SELECT $1, $2, $3, $4, $5, NOW()
			WHERE NOT EXISTS (
				SELECT 1 FROM prices
				WHERE product_id = $1
				  AND store_id   = $2
				  AND price      = $3
				  AND in_stock   = $5
				  AND (old_price IS NOT DISTINCT FROM $4)
				  AND recorded_at > NOW() - INTERVAL '3 hours'
			)`,
			productID, storeID, priceUAH, oldPriceUAH, p.InStock,
		)

		// Крок 4: зв'язок товар↔магазин — оновлюємо last_seen_at щоб відстежувати
		// які товари були в поточному ETL-циклі. Після cleanup старі зв'язки видаляються.
		batch.Queue(`
			INSERT INTO store_products (product_id, store_id, store_product_id, last_seen_at)
			VALUES ($1, $2, $3, NOW())
			ON CONFLICT (product_id, store_id) DO UPDATE SET
				last_seen_at = NOW()`,
			productID, storeID, storeProductID,
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

	// Крок 5: позначаємо магазин як щойно спарсений.
	// Планувальник використовує цю колонку замість дорогого GROUP BY на prices.
	if _, err := tx.Exec(ctx,
		`UPDATE stores SET last_parsed_at = NOW() WHERE external_id = $1`,
		storeID,
	); err != nil {
		log.Printf("[Transform] WARN: не вдалось оновити last_parsed_at для store=%s: %v", storeID, err)
		// Не фатально — продовжуємо commit
	}

	// One COMMIT for whole page
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
// store_categories_mapping. Якщо слаг не знайдено — автоматично додає його
// з тимчасовим canonical_category_id=999 (unknown) та повертає unknownCategoryID.
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
			// Автоматично додаємо новий slug з тимчасовим ID
			_, insertErr := pgPool.Exec(ctx, `
				INSERT INTO store_categories_mapping (slug, canonical_category_id)
				VALUES ($1, $2)
				ON CONFLICT (slug) DO NOTHING`,
				categorySlug, unknownCategoryID,
			)
			if insertErr != nil {
				log.Printf("[Transform] WARN: не вдалось додати slug %q в store_categories_mapping: %v",
					categorySlug, insertErr)
			} else {
				log.Printf("[Transform] ✚ Новий slug %q додано в store_categories_mapping (ID=%d). "+
					"Оновіть canonical_category_id для точної категоризації.",
					categorySlug, unknownCategoryID)
			}
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
