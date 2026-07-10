## Context

The admin dashboard widget `PopularProductsWidget` receives its data from the `GET /admin/dashboard-summary` endpoint in the API Gateway. Currently, this endpoint returns an empty `popularProducts: []` array, causing the frontend to fall back to hardcoded mock data with fake product names and placeholder images.

The `reviews_service` does not have an aggregation endpoint to determine which products are truly most popular. Implementing it properly requires: a new internal endpoint in `reviews_service`, a new internal endpoint in `product_service` for bulk ID lookup, and orchestration in the Gateway — significant scope for a prototype feature.

The current frontend mock calculates `avg_rating` client-side from a full list of reviews, which is not scalable.

## Goals / Non-Goals

**Goals:**
- Display real products (with real names, categories, and images from DB) in the `PopularProductsWidget`.
- Assign realistic hardcoded rating and review count values to the first 5 fetched in-stock products.
- Require zero changes to `product_service`, `reviews_service`, or the frontend.

**Non-Goals:**
- Implementing real rating aggregation from `reviews_service` (deferred).
- Sorting products by actual popularity or review count.
- Pagination or dynamic product selection.

## Decisions

### Decision: Fetch first 5 in-stock products from product_service

**Chosen:** `GET /api/v1/products?limit=5&in_stock=true` called from within `get_dashboard_summary` in the Gateway.

**Rationale:** The `product_service` already exposes this endpoint and returns `title`, `image_url`, and `category`. No new endpoints are needed on any service. This gives us real data immediately.

**Alternative considered:** Fetching by specific hardcoded product IDs (e.g., `ids=[1,2,3,4,5]`). Rejected because specific IDs may not exist in all environments (dev/staging/prod), making the feature brittle.

### Decision: Hardcode ratings as a rotating list applied by index

**Chosen:** Define a fixed list of `(rating, review_count)` tuples and assign them to products by their position (index 0–4).

```python
MOCK_RATINGS = [
    {"rating": 4.8, "reviews": 412},
    {"rating": 4.6, "reviews": 287},
    {"rating": 4.9, "reviews": 193},
    {"rating": 4.3, "reviews": 156},
    {"rating": 4.7, "reviews": 98},
]
```

**Rationale:** Simple, deterministic, and requires no state. Values are realistic-looking and varied enough for a convincing prototype UI.

### Decision: Graceful fallback on product_service failure

If the call to `product_service` fails (timeout, 5xx, etc.), return `popularProducts: []` so the frontend falls back to its existing frontend mock. The dashboard summary request itself must not fail.

## Risks / Trade-offs

- **[Risk] Stale / irrelevant products shown** → The "first 5" products depend on DB insertion order, which may not be meaningful. Mitigation: This is explicitly a prototype; the real solution requires reviews aggregation (tracked separately).
- **[Risk] Mismatch between `image_url` and what the widget renders** → The widget already handles empty/null `image_url` gracefully with a placeholder SVG. Mitigation: No action needed.
- **[Risk] product_service unavailable increases dashboard-summary latency** → A 5-second timeout is already the convention in `admin.py`. The new call uses the same pattern with `asyncio.gather`. Mitigation: The call runs concurrently with existing calls, adding no extra wall-clock time.
