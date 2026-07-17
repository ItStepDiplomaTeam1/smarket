## Context

The Smarket frontend catalog sidebar (`MainContent.tsx`) sends four filter parameters to `GET /api/v1/search/search` that are currently ignored by `search_service`:

- `offer_type` (values: `promo`, `save`, `new`) — no such query param exists in the Rust handler
- `subcategory_slug` (slug strings) — not supported; the proposal routes this use-case through `main_category_id` instead
- `discount_range` (e.g. `0-10`, `10-30`) — not supported; descoped from this change (requires a pre-computed `discount_percent` field in Meilisearch)
- `retail_chain` — accepted but as `Option<String>`, so multi-store selection silently drops all but one value

Additionally, `product_service` has no endpoint to load subcategories grouped under a `main_category_id`, so the sidebar subcategory list remains hardcoded on the frontend.

The `main_category_id` field is already present in:
- `categories` table (DB column, set by `products_etl`)
- `SearchProductDocument` Go struct (ETL sends it to Meilisearch)
- Meilisearch index (field exists but is not a filterable attribute yet — must be added via settings)

## Goals / Non-Goals

**Goals:**
- Multi-store `retail_chain` filter works correctly (OR logic across selected chains)
- `offer_type=promo` and `offer_type=save` filter to products with an active discount (`old_price IS NOT NULL`)
- `offer_type=new` filters to products created in the last 14 days (requires `created_at_ts` in Meilisearch)
- `main_category_id` query param enables cross-store top-level category browsing in search
- `GET /api/v1/products/categories/{main_category_id}/subcategories` provides live subcategory data to the sidebar

**Non-Goals:**
- `discount_range` filter (requires pre-computed `discount_percent` field — deferred)
- Frontend changes (connecting sidebar to new endpoints is a separate task)
- Meilisearch index settings management via API (done manually or via ETL startup routine)

## Decisions

### D1: `retail_chain` as repeated query params, not comma-separated

The frontend already sends `retail_chain=atb&retail_chain=silpo` (multiple params with the same key). Rust's `axum` + `serde` can deserialize this into `Vec<String>` with a custom deserializer. Comma-separation would require frontend changes — not needed.

**Alternative considered:** Single comma-separated string. Rejected because Axum/serde already handles repeated params natively and the frontend already produces them.

### D2: `offer_type=new` via Unix timestamp field `created_at_ts`

Meilisearch does not support date string comparisons — only numeric filters. We add `created_at_ts: i64` (Unix seconds) to `SearchProductDocument` (ETL) and `ProductDocument` (search_service). The filter becomes `created_at_ts >= <14_days_ago_timestamp>` computed at query time in the Rust handler.

**Alternative considered:** Filtering `new` in PostgreSQL (product_service). Rejected — catalog browsing is already routed through Meilisearch; mixing data sources for one filter would complicate the frontend.

### D3: `main_category_id` replaces `category_slug` for top-level browsing

The current `category_slug` filter breaks cross-store browsing because slugs are store-specific (e.g., `dairy-silpo` ≠ `dairy-atb`). `main_category_id` (integer 1–10) is a stable, store-agnostic identifier already in the index. Frontend sends `main_category_id=3` instead of `category_slug=...` for top-level category tabs.

### D4: Subcategories endpoint on `product_service`, not `search_service`

`search_service` is a thin Meilisearch proxy with no business logic. Returning a structured list of subcategories with product counts requires a SQL aggregation query — better placed in `product_service` alongside the existing `/categories` endpoint.

### D5: `main_category_id` must be added to Meilisearch filterable attributes

Meilisearch requires fields to be declared filterable before they can be used in filters. This is a one-time setup step against the Meilisearch instance (via `PATCH /indexes/products/settings`). We document this in the migration plan. ETL already sends the field; only the settings declaration is missing.

## Risks / Trade-offs

- **[Risk] `created_at_ts` absent in existing Meilisearch documents** → Documents indexed before this change lack `created_at_ts`; `offer_type=new` will return 0 results until a full re-index runs. *Mitigation*: trigger a full re-index after ETL deployment; the filter gracefully returns an empty set in the interim.
- **[Risk] Meilisearch filterable attribute settings must be updated manually** → If not applied, `main_category_id` filter silently returns all results. *Mitigation*: document exact `curl` command in migration steps; consider adding settings sync to ETL startup.
- **[Trade-off] `discount_range` descoped** → Frontend sends `discount_range` params that will still be ignored after this change. Acceptable because UI discount checkboxes are non-blocking UX (sidebar shows them but no results are lost; all products still appear).

## Migration Plan

1. Deploy `products_etl` with `created_at_ts` in `SearchProductDocument`.
2. Trigger full re-index (call ETL's `/product/save` for all stores, or run a manual Meilisearch batch upload).
3. Update Meilisearch filterable attributes:
   ```bash
   curl -X PATCH 'http://localhost:7700/indexes/products/settings/filterable-attributes' \
     -H 'Content-Type: application/json' \
     -d '["is_hidden","category_id","category_slug","store_id","retail_chain","price","old_price","in_stock","main_category_id","created_at_ts"]'
   ```
4. Deploy `search_service` with updated `SearchRequest` and filter logic.
5. Deploy `product_service` with new `/subcategories` endpoint and `Category.main_category_id` model field.
6. Verify with manual curl tests (see tasks.md).

**Rollback**: Each service is independently deployable. Rolling back `search_service` drops new params (frontend degrades gracefully to old behavior). Rolling back `products_etl` stops new `created_at_ts` from being indexed but does not break existing filters.
