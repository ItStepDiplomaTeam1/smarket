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
					ean                   TEXT        UNIQUE NOT NULL, -- міжнародний штрихкод (ключ дедуплікації)
					title                 TEXT        NOT NULL,
					brand                 TEXT,
					unit                  TEXT,                        -- "pcs", "kg", "g"
					weight                FLOAT,
					canonical_category_id INTEGER,
					created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
				)`,
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
