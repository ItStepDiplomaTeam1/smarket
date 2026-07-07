## 1. Database Migration

- [x] 1.1 Open `services/products_etl/database/migrate.go` and add a new migration entry that runs `ALTER TABLE categories ADD COLUMN IF NOT EXISTS main_category_id INTEGER` (place it after the existing `is_hidden` migrations to maintain order)

## 2. Category Mapping Utility

- [x] 2.1 Create `services/products_etl/internal/service/category_mapping.go` with a package-level compiled `regexp.MustCompile` for the store-chain suffix pattern `-(novus|ultramarket|zaraz|alcohub|auchan|metro|tavriav|cosmos|vostorg|kharkiv|chudomarket|biotus|epicentr|ekomarket|torba|masterzoo|megamarket|grono|winetime|ideal|onde)$`
- [x] 2.2 In the same file, define the static `map[string]int` mapping all slugs from the 10 main categories (1 = Products, 2 = Drinks, 3 = Snacks, 4 = Alcohol & Tobacco, 5 = Household, 6 = Health & Beauty, 7 = Pets, 8 = Babies, 9 = Hobby & Rest, 10 = Promo) as specified in the proposal
- [x] 2.3 Implement `ResolveMainCategoryID(slug string) int` that lowercases the slug, strips the suffix via regex, looks up the normalized slug in the map, and returns the matched ID or `1` as fallback; add a `log.Printf` warning when falling back on an unrecognized slug
- [x] 2.4 Verify the mapping function compiles cleanly (`go build ./...` inside `services/products_etl/`)

## 3. SeedCategories Integration

- [x] 3.1 In `services/products_etl/internal/service/seed.go`, update the `SeedCategories` upsert SQL to include `main_category_id = $N` in the `INSERT` column list and `ON CONFLICT DO UPDATE SET` clause
- [x] 3.2 Before each `pool.Exec(ctx, query, ...)` call in `SeedCategories`, compute `mainCatID := ResolveMainCategoryID(slug)` and pass it as the new `$N` argument

## 4. ResolveCategoryID Integration

- [x] 4.1 In `services/products_etl/internal/service/transformers.go`, update the lazy-insert SQL inside `ResolveCategoryID` to include `main_category_id` in the `INSERT INTO categories (slug, name, main_category_id) VALUES ($1, '', $2)` statement
- [x] 4.2 Before executing the lazy insert, compute `mainCatID := ResolveMainCategoryID(categorySlug)` and pass it as the `$2` argument

## 5. Meilisearch Document Update

- [x] 5.1 In `services/products_etl/internal/service/transformers.go`, add `MainCategoryID *int` field to the `SearchProductDocument` struct with JSON tag `"main_category_id,omitempty"`
- [x] 5.2 Update the SQL query in `indexProductsToSearch` to `LEFT JOIN categories c ON c.id = p.canonical_category_id` and add `c.main_category_id` to the `SELECT` list
- [x] 5.3 In the row scan loop, declare a `var mainCatID *int`, scan `c.main_category_id` into it, and assign `doc.MainCategoryID = mainCatID`
- [x] 5.4 Repeat steps 5.2–5.3 for any secondary query in `indexProductsToSearch` that uses a similar pattern (check around line 897 in `transformers.go` for the second query block)

## 6. Verification

- [x] 6.1 Run `go build ./...` inside `services/products_etl/` to confirm no compilation errors
- [x] 6.2 Run `go vet ./...` inside `services/products_etl/` to check for common issues
- [x] 6.3 Manually verify the mapping logic covers the exact slug list from the proposal by reviewing the static map in `category_mapping.go`
