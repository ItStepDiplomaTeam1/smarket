## Why

The Smarket catalog currently stores store-specific category slugs (e.g., `fruits-and-vegetables-auchan`, `frozen-metro`) that cannot be used for cross-store filtering. The frontend catalog and search endpoint rely on a `category_slug` filter that must exactly match Meilisearch index values, making it impossible to browse or filter by a universal category like "Fruits & Vegetables" across all stores. This is a blocker for usable catalog UX.

## What Changes

- A deterministic mapping utility (`ResolveMainCategoryID`) is added to `services/products_etl/` that strips store-specific suffixes from raw category slugs and maps the normalized slug to one of 10 universal `main_category_id` integers (1–10).
- The `categories` table in PostgreSQL gains a `main_category_id INTEGER` column (nullable, default NULL). The ETL migration step creates this column if it doesn't exist.
- `SeedCategories` and `ResolveCategoryID` are updated to compute and persist `main_category_id` whenever a category row is inserted or updated.
- The Meilisearch indexing function (`indexProductsToSearch`) is updated to include a `main_category_id` field in each indexed document so the frontend can filter on it.

## Capabilities

### New Capabilities

- `main-category-mapping`: A Go utility function that normalizes any store-specific category slug and returns a fixed integer `main_category_id` (1–10) identifying which of the 10 universal top-level categories the product belongs to.

### Modified Capabilities

- (None — no existing spec-level capability contracts are being changed; this is a new internal ETL enrichment.)

## Impact

- **Files modified**: `services/products_etl/` only (per AGENTS.md scope rule).
  - New file: `services/products_etl/internal/service/category_mapping.go`
  - Modified: `services/products_etl/database/migrate.go` (add `main_category_id` column migration)
  - Modified: `services/products_etl/internal/service/seed.go` (`SeedCategories` upsert adds `main_category_id`)
  - Modified: `services/products_etl/internal/service/transformers.go` (`ResolveCategoryID`, `SearchProductDocument`, and Meilisearch indexing query)
- **Database**: `categories` table gains a nullable `main_category_id INTEGER` column.
- **Meilisearch index**: Each document gains `main_category_id` as a filterable numeric field.
- **No API contract changes**: No public endpoints are changed. This is purely an ETL enrichment.
- **Dependencies**: No new Go packages required (uses standard `strings` and `regexp`).
