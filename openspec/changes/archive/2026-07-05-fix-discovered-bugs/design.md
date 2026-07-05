## Context

During a Monorepo Bug Hunt, five critical issues were discovered across multiple services (React Frontend, AI Agent, Cart Service, Product Service, and Go ETL). This design details the technical resolutions for each of them.

## Goals / Non-Goals

**Goals:**
- Fix search filter mismatch by changing the query parameter from `store_id` to `retail_chain` for chain slugs (frontend and AI agent).
- Fix `cart_service` AttributeError by calling `crud.add_item` instead of `add_item_to_cart` during shared cart imports.
- Fix missing prices in `product_service` catalog query when filtering by store chain.
- Ensure all store products are indexed in Meilisearch by removing the arbitrary `LIMIT 500` from the ETL indexing query.
- Prevent infinite RabbitMQ retry loops for failing ETL tasks.

**Non-Goals:**
- Upgrading databases or search engine versions.
- Refactoring the core architecture of the microservices.
- Adding new UI features.

## Decisions

### Decision 1: Rename search query parameter on React Frontend and AI Agent
- **Problem**: Selecting a store chain (e.g., ATБ, Silpo) filters search results by `store_id = "atb"`. But `store_id` in Meilisearch contains numeric store IDs (like `"48201011"`), while the chain name is stored in `retail_chain`.
- **Solution**:
  - React Frontend: change `url.searchParams.append('store_id', ...)` to `url.searchParams.append('retail_chain', ...)` in `MainContent.tsx`.
  - AI Agent: update `search_catalog` in `tools.py` to map known chain slugs (like `'atb'`, `'novus'`, `'metro'`, `'auchan'`) to the `retail_chain` parameter.

### Decision 2: Update shared cart import call in `cart_service`
- **Problem**: `cart.py` calls `crud.add_item_to_cart()`, which does not exist, causing 500 errors.
- **Solution**: Replace with `crud.add_item()`, which is already defined and takes the same parameters.

### Decision 3: Fix product catalog offers query in `product_service`
- **Problem**: The catalog endpoint filters product prices using `Price.store_id.in_(store_ids)`, where `store_ids` contains chain names like `['atb', 'novus']`. Since `Price.store_id` stores numeric IDs, this yields zero prices/offers.
- **Solution**: Update the query in `products.py` to join `Store` and filter by `Store.retail_chain.in_(store_ids)`.

### Decision 4: Remove indexing limit in `products_etl`
- **Problem**: `indexProductsToSearch` only loads and indexes 500 products per store.
- **Solution**: Remove `LIMIT 500` from the SQL query to allow all store products to be indexed.

### Decision 5: Fix RabbitMQ infinite retry loops in `products_etl`
- **Problem**: Rejecting and requeuing messages using `Nack(requeue=true)` does not increment `x-retry-count` in RabbitMQ, causing infinite retries when store parsing fails.
- **Solution**: Manually publish a new message with incremented `x-retry-count` header and ACK the old one, or drop the message if the retry limit is exceeded.

## Risks / Trade-offs

- **Risk**: Removing `LIMIT 500` might increase memory usage or time taken during indexing.
  - **Mitigation**: A typical store contains 5,000–15,000 products. This size is extremely small and safely handled by Go and Meilisearch.
- **Risk**: Publishing a new message manually in RabbitMQ might cause message loss if the connection fails midway.
  - **Mitigation**: Publish with safety checks and only ACK the original message after the new one is successfully published.
