package service

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// ---------------------------------------------------------------------------
// Структура магазину з Zakaz.ua API
// ---------------------------------------------------------------------------

// zakazStore — відповідь одного елементу GET /stores/
type zakazStore struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	RetailChain string  `json:"retail_chain"`
	City        *string `json:"city"` // nullable — деякі магазини не мають міста
	IsActive    bool    `json:"is_active"`
}

// ---------------------------------------------------------------------------
// SeedStores — завантажує всі магазини з Zakaz.ua та зберігає в БД
// ---------------------------------------------------------------------------

// SeedStores отримує повний список магазинів із Zakaz.ua API і виконує
// upsert у таблицю stores. Викликається один раз при старті сервісу.
//
// Логіка:
//   - INSERT ... ON CONFLICT (external_id) DO UPDATE — оновлює назву/місто якщо змінились.
//   - is_active синхронізується з API.
//   - Магазини, яких більше нема в API, не видаляються (м'який підхід).
func SeedStores(ctx context.Context, pool *pgxpool.Pool) error {
	log.Println("[seed] Синхронізація магазинів із Zakaz.ua...")

	stores, err := fetchAllStores()
	if err != nil {
		return fmt.Errorf("fetch stores: %w", err)
	}

	log.Printf("[seed] Отримано %d магазинів з API", len(stores))

	inserted, updated := 0, 0

	for _, s := range stores {
		city := ""
		if s.City != nil {
			city = *s.City
		}

		// UPSERT: якщо магазин вже є — оновити актуальні поля
		const query = `
			INSERT INTO stores (external_id, name, retail_chain, city, is_active, synced_at)
			VALUES ($1, $2, $3, $4, $5, NOW())
			ON CONFLICT (external_id) DO UPDATE SET
				name         = EXCLUDED.name,
				retail_chain = EXCLUDED.retail_chain,
				city         = EXCLUDED.city,
				is_active    = EXCLUDED.is_active,
				synced_at    = NOW()
		`
		tag, err := pool.Exec(ctx, query,
			s.ID,
			s.Name,
			s.RetailChain,
			city,
			s.IsActive,
		)
		if err != nil {
			log.Printf("[seed] WARN: не вдалось зберегти магазин %s (%s): %v", s.ID, s.Name, err)
			continue
		}

		// RowsAffected = 1 — insert, 2 — update (postgres UPSERT поведінка)
		if tag.RowsAffected() == 1 {
			inserted++
		} else {
			updated++
		}
	}

	log.Printf("[seed] ✓ Магазини синхронізовано: %d нових, %d оновлено.", inserted, updated)
	return nil
}

// ---------------------------------------------------------------------------
// fetchAllStores — HTTP-запит до GET /stores/
// ---------------------------------------------------------------------------

// fetchAllStores завантажує повний список магазинів з публічного API Zakaz.ua.
func fetchAllStores() ([]zakazStore, error) {
	const url = "https://stores-api.zakaz.ua/stores/"

	client := &http.Client{Timeout: 15 * time.Second}

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	// Заголовки як в реальному браузері — щоб API не блокував
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
	req.Header.Set("Accept-Language", "uk-UA,uk;q=0.9")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Referer", "https://zakaz.ua/")

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("HTTP GET %s: %w", url, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("API повернув статус %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("читання тіла відповіді: %w", err)
	}

	// API повертає голий масив: [{...}, {...}, ...]
	var stores []zakazStore
	if err := json.Unmarshal(body, &stores); err != nil {
		return nil, fmt.Errorf("розбір JSON: %w", err)
	}

	return stores, nil
}
