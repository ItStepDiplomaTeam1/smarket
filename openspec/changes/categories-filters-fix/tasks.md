## 1. ETL — Add created_at_ts field (products_etl / Go)

- [x] 1.1 Add `CreatedAtTs int64` field to `SearchProductDocument` struct in `services/products_etl/internal/service/transformers.go`
- [x] 1.2 Add `p.created_at` to the indexing SQL SELECT in `indexProductsToSearch` and map it to `doc.CreatedAtTs` (convert `time.Time` to Unix seconds with `.Unix()`)
- [x] 1.3 Verify the JSON tag is `created_at_ts` to match `ProductDocument` in search_service

## 2. search_service — Extend ProductDocument (Rust, post_index.rs)

- [x] 2.1 Add `pub main_category_id: Option<i32>` field to `ProductDocument` struct in `services/search_service/src/handlers/post_index.rs`
- [x] 2.2 Add `pub created_at_ts: Option<i64>` field to `ProductDocument` struct

## 3. search_service — Extend SearchRequest and filter logic (Rust, get_search.rs)

- [x] 3.1 Change `retail_chain: Option<String>` to `retail_chain: Vec<String>` in `SearchRequest` — add a custom `deserialize_string_vec` that handles both repeated params and comma-separated values
- [x] 3.2 Add `offer_type: Vec<String>` field to `SearchRequest` with the same multi-value deserializer
- [x] 3.3 Add `main_category_id: Option<i32>` field to `SearchRequest` (reuse `deserialize_i32_opt`)
- [x] 3.4 Update `ProductFilters` struct to hold `retail_chains: Vec<String>`, `offer_types: Vec<String>`, `main_category_id: Option<i32>`
- [x] 3.5 Update filter builder: `retail_chain` OR-join → `(retail_chain = 'atb' OR retail_chain = 'silpo')`
- [x] 3.6 Update filter builder: `offer_type` mapping — `promo`/`save` → `old_price IS NOT NULL`; `new` → `created_at_ts >= <unix_14_days_ago>`; OR across offer_types
- [x] 3.7 Update filter builder: `main_category_id` → `main_category_id = {n}`
- [x] 3.8 Propagate `main_category_id` from `ProductDocument` to the JSON response hit (add it to the `json!({...})` block in the hits mapper)

## 4. product_service — Map main_category_id on Category model (Python)

- [x] 4.1 Add `main_category_id: Mapped[Optional[int]]` column to the `Category` SQLAlchemy model in `services/product_service/app/database/models.py`
- [x] 4.2 Add `main_category_id: Optional[int] = None` field to `CategoryResponse` Pydantic schema in `services/product_service/app/shared/schemas.py`
- [x] 4.3 Create `SubcategoryResponse` Pydantic schema with fields: `id`, `slug`, `name`, `main_category_id`, `product_count: int`

## 5. product_service — Add subcategories endpoint (Python)

- [x] 5.1 Add `GET /categories/{main_category_id}/subcategories` route to `services/product_service/app/routers/products.py`
- [x] 5.2 Implement query: `SELECT categories.*, COUNT(products.id) AS product_count FROM categories LEFT JOIN products ON products.canonical_category_id = categories.id AND products.is_hidden = false WHERE categories.main_category_id = :main_category_id AND categories.is_hidden = false GROUP BY categories.id ORDER BY categories.name`
- [x] 5.3 Return `list[SubcategoryResponse]` with HTTP 200

## 6. Meilisearch settings update (Infrastructure)

> **Post-deploy manual steps** — run against deployed Meilisearch instance.

- [ ] 6.1 Update Meilisearch filterable attributes to include `main_category_id` and `created_at_ts`:
  ```bash
  curl -X PATCH 'http://<MEILI_HOST>:7700/indexes/products/settings/filterable-attributes' \
    -H 'Content-Type: application/json' \
    -d '["is_hidden","category_id","category_slug","store_id","retail_chain","price","old_price","in_stock","main_category_id","created_at_ts"]'
  ```
- [ ] 6.2 Trigger a full re-index by running ETL parse for all active stores (or use bulk Meilisearch upload if available)

## 7. Verification

> **Post-deploy verification** — run after all services are deployed and Meilisearch re-indexed.

- [ ] 7.1 Test multi-store filter: `curl "http://localhost:8083/search?q=молоко&retail_chain=atb&retail_chain=silpo"` — response hits should include both ATB and Сільпо stores
- [ ] 7.2 Test promo filter: `curl "http://localhost:8083/search?q=&offer_type=promo"` — all hits should have `old_price` non-null
- [ ] 7.3 Test new filter: `curl "http://localhost:8083/search?q=&offer_type=new"` — all hits should have `created_at_ts` within last 14 days
- [ ] 7.4 Test main_category_id filter: `curl "http://localhost:8083/search?q=&main_category_id=1"` — all hits should belong to category with `main_category_id = 1`
- [ ] 7.5 Test subcategories endpoint: `curl "http://localhost:8000/api/v1/products/categories/1/subcategories"` — returns array with `id`, `slug`, `name`, `product_count`
- [ ] 7.6 Test empty subcategories: `curl "http://localhost:8000/api/v1/products/categories/99/subcategories"` — returns `[]`
