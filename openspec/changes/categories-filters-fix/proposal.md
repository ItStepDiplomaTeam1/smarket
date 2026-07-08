## Why

The frontend catalog sidebar sends filter parameters (`offer_type`, `subcategory_slug`, `discount_range`, multiple `retail_chain` values) that the `search_service` currently ignores — they are silently dropped, making the UI controls non-functional. Additionally, `retail_chain` is deserialized as a single `Option<String>`, so multi-store selection always returns only one store's products.

## What Changes

- `search_service` (`get_search.rs`): deserialize `retail_chain` as `Vec<String>` and build an OR-joined Meilisearch filter (`retail_chain = 'atb' OR retail_chain = 'silpo'`).
- `search_service` (`get_search.rs` + `post_index.rs`): add `main_category_id: Option<i32>` to `ProductDocument` (field already present in Meilisearch index, just not deserialized) and expose `?main_category_id` query param for cross-store category filtering.
- `search_service` (`get_search.rs`): add `offer_type: Vec<String>` query param; map `promo` / `save` → `old_price IS NOT NULL`, `new` → `created_at_ts >= <14-days-ago-unix>` Meilisearch filter.
- `products_etl` (`transformers.go`): add `created_at_ts` (Unix timestamp of `product.created_at`) to `SearchProductDocument` and the indexing SQL query so Meilisearch can filter on it numerically.
- `search_service` (`post_index.rs`): add `created_at_ts: Option<i64>` to `ProductDocument` to accept the new field from ETL.
- `product_service` (`routers/products.py` + `shared/schemas.py`): add `GET /api/v1/products/categories/{main_category_id}/subcategories` endpoint returning all non-hidden categories with the given `main_category_id`, plus a `product_count` aggregate.
- `product_service` (`database/models.py`): expose `main_category_id` on the `Category` SQLAlchemy model (column already in DB, just unmapped).

## Capabilities

### New Capabilities

- `multi-store-filter`: Multi-value `retail_chain` filter in search — allows the user to select multiple supermarket chains and get results from all of them simultaneously.
- `offer-type-filter`: `offer_type` filter in search — allows filtering by promotional status (`promo`/`save`) and recency (`new`) via Meilisearch.
- `subcategories-by-main-category`: New `product_service` endpoint to retrieve subcategories (child categories) grouped under a `main_category_id`, used to populate the sidebar subcategory checklist dynamically.

### Modified Capabilities

- `search-filtering`: Existing search filtering capability — `main_category_id` param added as a cross-store category filter replacing store-specific `category_slug` for top-level browsing.

## Impact

- **`services/search_service/src/handlers/get_search.rs`** — SearchRequest struct and filter builder logic.
- **`services/search_service/src/handlers/post_index.rs`** — ProductDocument struct (`main_category_id`, `created_at_ts`).
- **`services/products_etl/internal/service/transformers.go`** — `SearchProductDocument` struct and `indexProductsToSearch` SQL query.
- **`services/product_service/app/database/models.py`** — `Category.main_category_id` mapped column.
- **`services/product_service/app/routers/products.py`** — new subcategories endpoint.
- **`services/product_service/app/shared/schemas.py`** — new `SubcategoryResponse` schema.
- **No gateway changes** — gateway proxies all `/products/*` paths transparently via `/{path:path}`.
- **No DB migrations** — `categories.main_category_id` column and `products_etl` SQL already in place.
- **Meilisearch re-index required** after ETL change to propagate `created_at_ts` to existing documents.
