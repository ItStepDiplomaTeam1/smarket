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
//   - store_categories_mapping — маппинг slug категорії → internal ID
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
					synced_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
				)`,
		},
		{
			name: "create store_categories_mapping",
			sql: `
				CREATE TABLE IF NOT EXISTS store_categories_mapping (
					id                    SERIAL  PRIMARY KEY,
					slug                  TEXT    UNIQUE NOT NULL,  -- slug категорії з API (наприклад "fresh-meat")
					canonical_category_id INTEGER NOT NULL           -- наш внутрішній ID (наприклад 15)
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
				CREATE UNIQUE INDEX IF NOT EXISTS idx_products_store_product_id_null_ean
				ON products (store_product_id)
				WHERE canonical_ean IS NULL
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
				UPDATE prices SET
					price = price / 100.0,
					old_price = old_price / 100.0
				WHERE price > 1000
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
