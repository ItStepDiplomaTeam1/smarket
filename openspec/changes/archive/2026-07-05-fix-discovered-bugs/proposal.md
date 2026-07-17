## Why

This change aims to resolve a series of critical bugs identified across the Smarket monorepository. Currently, core workflows such as product searching, store filtering, shared cart imports, and the ETL indexing process are broken or severely restricted, leading to a degraded user and administrator experience.

## What Changes

- **React Frontend**: Fix store filtering in `MainContent.tsx` by passing `retail_chain` instead of `store_id` in search query parameters when selecting retail chains.
- **Zephyros Agent (AI-помічник)**: Update the `search_catalog` tool in `tools.py` to route supermarket slugs (like `'atb'`, `'novus'`) to the `retail_chain` parameter rather than `store_id`.
- **Cart Service**: Fix the shared cart import endpoint in `cart.py` to call `crud.add_item` instead of the non-existent `crud.add_item_to_cart`.
- **Product Service**: Update the product catalog search query in `products.py` to filter offers/prices by joining the `stores` table and checking `retail_chain` instead of comparing raw chain slugs directly against `Price.store_id`.
- **Go ETL Service**:
  - Remove the `LIMIT 500` restriction from the search indexer (`indexProductsToSearch` in `transformers.go`) to ensure all store products are indexed in Meilisearch.
  - Fix the infinite RabbitMQ task retry loop in `loaders.go` by manually tracking/incrementing retry counters rather than doing a simple `Nack(requeue=true)`.

## Capabilities

### New Capabilities
- `search-filtering`: The system allows filtering product catalog and search results by supermarket chains and specific store IDs.

### Modified Capabilities
- None

## Impact

- **React Frontend**: Restores the ability to filter catalog search results by supermarket chain.
- **AI Agent**: Enables the agent to successfully filter products by store chain when calling search services.
- **Cart Service**: Restores the shared cart import function, preventing 500 errors.
- **Product Service**: Fixes missing prices/offers on the catalog page when filtering by store chain.
- **Go ETL Service**: Resolves indexing gaps in Meilisearch and prevents infinite loops on parsing failures.
