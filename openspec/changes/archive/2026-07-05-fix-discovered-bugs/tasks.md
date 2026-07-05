## 1. Frontend & AI Agent Search Filter Fixes

- [x] 1.1 Update `MainContent.tsx` to pass `retail_chain` instead of `store_id` in search query parameters when selecting retail chains.
- [x] 1.2 Update `search_catalog` in `tools.py` to route supermarket slugs (like `'atb'`, `'novus'`, etc.) to the `retail_chain` parameter instead of `store_id`.

## 2. Backend Microservices Bug Fixes

- [x] 2.1 Replace `add_item_to_cart` with `add_item` in `cart_service`'s `cart.py` during shared cart imports.
- [x] 2.2 Update product catalog search query in `products.py` to join `Store` and filter `Price.store_id` by `Store.retail_chain` when store IDs are provided.

## 3. Go ETL Worker Fixes

- [x] 3.1 Remove the `LIMIT 500` restriction from the search indexer (`indexProductsToSearch` in `transformers.go`).
- [x] 3.2 Fix the infinite RabbitMQ task retry loop in `loaders.go` by manually tracking/incrementing retry counters rather than doing a simple `Nack(requeue=true)`.

## 4. Verification

- [x] 4.1 Verify frontend catalog filtering by store chain works.
- [x] 4.2 Verify AI agent search catalog filter works.
- [x] 4.3 Verify importing a shared cart works.
- [x] 4.4 Verify ETL worker indices more than 500 products per store.
- [x] 4.5 Verify ETL worker handles retries safely without infinite loops.
