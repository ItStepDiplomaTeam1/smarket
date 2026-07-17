package database

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

// RunMigrations створює всі таблиці ETL-сервісу, якщо вони ще не існують.
// Виклик ідемпотентний — безпечно запускати при кожному старті сервісу.
//
// Таблиці ETL-бази (окрема від основного додатку):
//   - stores                  — магазини з Zakaz.ua
//   - categories              — плоский список категорій верхнього рівня з Zakaz (slug + name)
//   - products                — глобальний каталог товарів (дедупліковано по EAN)
//   - prices                  — іммутабельний лог цін
//   - store_products          — зв'язок товарів з магазинами
func RunMigrations(ctx context.Context, pool *pgxpool.Pool) error {
	log.Println("[migrate] Запуск міграцій ETL-бази...")

	migrations := []struct {
		name string
		sql  string
	}{
		{
			name: "create stores",
			sql: `
				CREATE TABLE IF NOT EXISTS stores (
					external_id   TEXT        PRIMARY KEY,         -- ID магазину з Zakaz.ua (наприклад "48215610")
					name          TEXT        NOT NULL,            -- "Auchan Pochaina DRIVE"
					retail_chain  TEXT        NOT NULL,            -- "auchan", "novus", "metro" тощо
					city          TEXT,                            -- "kiev", "lviv", NULL якщо невідоме
					is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
					synced_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
					address       TEXT,
					lat           DOUBLE PRECISION,
					lng           DOUBLE PRECISION
				)`,
		},
		{
			name: "create categories",
			sql: `
				CREATE TABLE IF NOT EXISTS categories (
					id         SERIAL      PRIMARY KEY,
					slug       TEXT        UNIQUE NOT NULL,   -- slug верхнього рівня з API Zakaz (напр. "fresh-meat")
					name       TEXT        NOT NULL,          -- українська назва з поля title (напр. "Свіже м'ясо")
					created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
				)`,
		},
		{
			name: "create products",
			sql: `
				CREATE TABLE IF NOT EXISTS products (
					id                    BIGSERIAL   PRIMARY KEY,
					canonical_ean         TEXT        UNIQUE,        -- міжнародний EAN-13, ключ дедуплікації
					store_product_id      TEXT,                       -- внутрішній ID магазину з Zakaz.ua
					title                 TEXT        NOT NULL,
					brand                 TEXT,
					unit                  TEXT,
					weight                FLOAT,
					canonical_category_id INTEGER,
					created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
				)`,
		},
		{
			name: "migrate products schema for EAN",
			sql: `
				DO $$
				BEGIN
					IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='ean') THEN
						ALTER TABLE products RENAME COLUMN ean TO canonical_ean;
						ALTER TABLE products ALTER COLUMN canonical_ean DROP NOT NULL;
					END IF;

					IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='store_product_id') THEN
						ALTER TABLE products ADD COLUMN store_product_id TEXT;
					END IF;
				END $$;
			`,
		},
		{
			name: "create partial unique index store_product_id",
			sql: `
				-- Замінено на складений унікальний індекс у пізнішій міграції idx_products_store_product_id_store_id_null_ean.
				-- Старий глобальний індекс більше не потрібен та видаляється.
				SELECT 1;
			`,
		},
		{
			name: "create prices",
			sql: `
				CREATE TABLE IF NOT EXISTS prices (
					id          BIGSERIAL   PRIMARY KEY,
					product_id  BIGINT      NOT NULL REFERENCES products(id),
					store_id    TEXT        NOT NULL REFERENCES stores(external_id),
					price       FLOAT       NOT NULL,
					old_price   FLOAT,                -- NULL якщо знижки немає
					in_stock    BOOLEAN     NOT NULL DEFAULT TRUE,
					recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
				)`,
		},
		{
			// Індекс для швидкого пошуку актуальних цін по магазину
			name: "index prices_store_product",
			sql: `
				CREATE INDEX IF NOT EXISTS idx_prices_store_product
				ON prices (store_id, product_id, recorded_at DESC)`,
		},
		{
			name: "add image_url to products",
			sql:  `ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT`,
		},
		{
			name: "create store_products",
			sql: `
				CREATE TABLE IF NOT EXISTS store_products (
					product_id       BIGINT      NOT NULL REFERENCES products(id),
					store_id         TEXT        NOT NULL REFERENCES stores(external_id),
					store_product_id TEXT,
					first_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
					PRIMARY KEY (product_id, store_id)
				)`,
		},
		{
			name: "prices columns to numeric",
			sql: `
				DO $$
				BEGIN
					IF EXISTS (
						SELECT 1 FROM information_schema.columns
						WHERE table_name='prices' AND column_name='price' AND data_type='double precision'
					) THEN
						ALTER TABLE prices
							ALTER COLUMN price TYPE NUMERIC(10,2),
							ALTER COLUMN old_price TYPE NUMERIC(10,2);
					END IF;
				END $$;
			`,
		},
		{
			name: "fix kopeck prices",
			sql: `
				-- Замінено на SELECT 1, оскільки ця міграція не є безпечною для повторного запуску
				-- і псує реальні ціни товарів дорожчих за 1000 грн.
				SELECT 1;
			`,
		},
		// ---------------------------------------------------------------
		// Нові міграції: фіксуємо дедуплікацію товарів та відслідковуємо
		// час останнього оновлення магазину.
		// ---------------------------------------------------------------
		{
			// Колонка last_parsed_at дозволяє планувальнику швидко знайти
			// магазини, дані яких застаріли, без дорогого GROUP BY на prices.
			name: "add last_parsed_at to stores",
			sql: `
				ALTER TABLE stores
					ADD COLUMN IF NOT EXISTS last_parsed_at TIMESTAMPTZ
			`,
		},
		{
			// store_id у таблиці products прив'язує товари без EAN до конкретного
			// магазину, запобігаючи конфліктам між однойменними SKU різних мереж.
			name: "add store_id to products",
			sql: `
				ALTER TABLE products
					ADD COLUMN IF NOT EXISTS store_id TEXT REFERENCES stores(external_id)
			`,
		},
		{
			// Прибираємо старий глобальний індекс та замінюємо його
			// на store-scoped composite unique index.
			// Один і той самий SKU у різних мережах тепер не конфліктує.
			name: "replace global store_product_id index with store-scoped",
			sql: `
				DO $$
				BEGIN
					-- Видаляємо старий глобальний індекс (якщо ще існує)
					DROP INDEX IF EXISTS idx_products_store_product_id_null_ean;

					-- Створюємо новий composite unique index: SKU унікальний в межах одного магазину
					IF NOT EXISTS (
						SELECT 1 FROM pg_indexes
						WHERE indexname = 'idx_products_store_product_id_store_id_null_ean'
					) THEN
						CREATE UNIQUE INDEX idx_products_store_product_id_store_id_null_ean
						ON products (store_product_id, store_id)
						WHERE canonical_ean IS NULL;
					END IF;
				END $$
			`,
		},
		{
			// Індекс для швидкого пошуку застарілих магазинів планувальником.
			// Без нього планувальник буде робити full table scan кожні 2 години.
			name: "index stores_last_parsed_at",
			sql: `
				CREATE INDEX IF NOT EXISTS idx_stores_last_parsed_at
				ON stores (last_parsed_at ASC NULLS FIRST)
				WHERE is_active = true
			`,
		},
		{
			// last_seen_at в store_products дозволяє ETL-воркеру автоматично визначати,
			// які товари більше не повертаються АПІ Zakaz.ua і повинні бути видалені.
			// DEFAULT NOW() автоматично заповнює існуючі рядки.
			name: "add last_seen_at to store_products",
			sql: `
				ALTER TABLE store_products
					ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
			`,
		},
		// ---------------------------------------------------------------
		// Переробка системи категорій (див. docs/categories-reworking-plan.md).
		// ---------------------------------------------------------------
		{
			// Перетворюємо products.canonical_category_id на FK → categories(id).
			// Стара колонка була голим INTEGER зі значеннями-сміттям (999).
			// Охоронний блок: повторне додавання FK виконується лише якщо
			// FK-обмеження на categories ще відсутнє — завдяки цьому міграція
			// ідемпотентна і не затирає категорії товарів при кожному старті.
			name: "products.canonical_category_id FK to categories",
			sql: `
				DO $$
				BEGIN
					IF NOT EXISTS (
						SELECT 1
						FROM information_schema.table_constraints tc
						JOIN information_schema.key_column_usage kcu
						  ON tc.constraint_name = kcu.constraint_name
						 AND tc.table_schema  = kcu.table_schema
						JOIN information_schema.constraint_column_usage ccu
						  ON ccu.constraint_name = tc.constraint_name
						 AND ccu.table_schema   = tc.table_schema
						WHERE tc.table_name      = 'products'
						  AND tc.constraint_type = 'FOREIGN KEY'
						  AND kcu.column_name    = 'canonical_category_id'
						  AND ccu.table_name     = 'categories'
					) THEN
						-- Скидаємо сміття (999 та інші «привиди») перед DROP колонки.
						UPDATE products SET canonical_category_id = NULL
							WHERE canonical_category_id IS NOT NULL;
						ALTER TABLE products DROP COLUMN IF EXISTS canonical_category_id;
						ALTER TABLE products
							ADD COLUMN canonical_category_id INTEGER
							REFERENCES categories(id) ON DELETE SET NULL;
					END IF;
				END $$;
			`,
		},
		{
			// Стара таблиця-маппінг більше не потрібна: slug тепер живе у categories.slug,
			// а products.canonical_category_id — це FK на categories(id).
			name: "drop store_categories_mapping",
			sql:  `DROP TABLE IF EXISTS store_categories_mapping`,
		},
		{
			name: "add is_hidden to products",
			sql: `
				ALTER TABLE products
					ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE
			`,
		},
		{
			name: "add is_hidden to categories",
			sql: `
				ALTER TABLE categories
					ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE
			`,
		},
		{
			name: "add address lat lng to stores",
			sql: `
				ALTER TABLE stores
					ADD COLUMN IF NOT EXISTS address TEXT,
					ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
					ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION
			`,
		},
	}

	for _, m := range migrations {
		if _, err := pool.Exec(ctx, m.sql); err != nil {
			return fmt.Errorf("[migrate] %s: %w", m.name, err)
		}
		log.Printf("[migrate] ✓ %s", m.name)
	}

	log.Println("[migrate] Всі міграції успішно застосовано.")
	return nil
}
