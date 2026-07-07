## Context

The frontend client needs to render a store card containing active catalog stats (total products in stock, promo items count, and max discount). The backend doesn't have an endpoint for this, and client-side aggregation is blocked by pagination limits. We will add a statistics endpoint to the `product_service`.

## Goals / Non-Goals

**Goals:**
- Add `GET /api/v1/stores/{store_id}/stats` to the `product_service` API.
- Return `total_products` (in-stock), `promo_products` (in-stock with `old_price > price`), and `max_savings` (max discount percentage).
- Bypassing gateway route modifications by leveraging the existing catch-all proxy route.

**Non-Goals:**
- Implementing frontend UI changes or routing.
- Changing `gateway_service` config or router setup.

## Decisions

### Decision 1: Raw SQL via SQLAlchemy `text()` for data aggregation
- **Rationale**: PostgreSQL's `DISTINCT ON` query is highly optimized. Writing this via standard SQLAlchemy ORM results in verbose, hard-to-maintain code. Raw SQL keeps the logic clean and easy to test/modify directly.
- **Alternatives Considered**: SQLAlchemy Expression Builder (rejected due to excessive complexity and poor readability for this specific postgresql feature).

## Risks / Trade-offs

- **Risk**: Division by zero if `old_price` is 0 or negative.
  - **Mitigation**: The SQL calculation is wrapped in a conditional `CASE WHEN old_price > price AND old_price > 0` block.
- **Risk**: High query execution time on a large `prices` table.
  - **Mitigation**: The query filters on `store_id` first and uses the `idx_prices_store_product` composite index to execute `DISTINCT ON` efficiently via index scan.
