## Context

Users encountered `AxiosError: timeout of 10000ms exceeded` across three separate user interactions on the frontend (`apps/react`):
1. Loading the product detail page (`ProductDetail.tsx`).
2. Rendering the similar products block (`SMProduct.tsx`).
3. Adding a product to favorites (`ProductHero.tsx` / `favoritesStore.ts`).

Analysis revealed four root causes:
1. **Gateway Request Stream forwarding bug**: Proxy routers in Gateway (`favorites.py`, `cart.py`, `search.py`, `agent.py`) pass `content=request.stream()` to `httpx.build_request(...)` for `GET` and `DELETE` requests. Downstream ASGI servers (Granian / Uvicorn) hang while waiting for non-existent request bodies to complete, triggering 10s request timeouts.
2. **N+1 parallel HTTP waterfall in `SMProduct.tsx`**: `SMProduct.tsx` fetches a category list, selects 4 items, and fires 4 separate `apiClient.get('/api/v1/products/${p.id}')` calls concurrently on page load.
3. **Database subquery bottleneck in `product_service`**: `get_product` runs a `max(recorded_at)` subquery on the `prices` table per product without indexed filtering, creating DB lock/latency under concurrent connections.
4. **Token Refresh Interceptor Guard**: In `apiClient.ts`, token refresh requests during 401/expiration could trigger recursive request interceptor execution under specific race conditions.

## Goals / Non-Goals

**Goals:**
- Fix API Gateway proxy handlers (`favorites.py`, `cart.py`, `search.py`, `agent.py`) to pass empty body (`b""`) for `GET`, `DELETE`, and `HEAD` requests.
- Eliminate N+1 requests in `SMProduct.tsx` by reusing product properties returned in category listing or using batch fetching.
- Ensure database queries in `get_product` run fast (<100ms) by optimizing SQL execution.
- Prevent `apiClient` from hanging or timing out when toggling favorites or loading product pages.

**Non-Goals:**
- Rewriting the database schema for `prices` or full microservice architecture refactoring.
- Replacing Axios with standard fetch across the entire codebase.

## Decisions

### Decision 1: Gateway Proxy Body Handling
- **Choice**: In `services/gateway/app/api/routes/` (`favorites.py`, `cart.py`, `search.py`, `agent.py`), compute `body_content = b"" if request.method in ["GET", "HEAD", "DELETE"] else request.stream()`.
- **Rationale**: Downstream ASGI services do not expect chunked streaming bodies on GET/DELETE. Passing `request.stream()` causes `httpx` to send stream headers that cause FastAPI/Granian in downstream services to block waiting for EOF.
- **Alternatives Considered**: Modifying downstream services to ignore request bodies on GET (less clean, doesn't fix gateway proxy stream behavior).

### Decision 2: Refactoring `SMProduct.tsx`
- **Choice**: Reuse items returned from `apiClient.get('/api/v1/products', { params: { category: categoryId } })` instead of firing 4 subsequent `apiClient.get('/api/v1/products/${p.id}')` calls.
- **Rationale**: The `/api/v1/products` endpoint already returns product details (title, price, image, brand, store_product_id). Fetching details 4 times in parallel is redundant and creates a query spike.
- **Alternatives Considered**: Using `POST /api/v1/products/batch-details` (unnecessary network call when list data is already complete).

### Decision 3: Frontend Resilience & Interceptor Guard
- **Choice**: Update `apiClient.ts` to ensure refresh requests do not trigger recursive interceptor checks, and extend timeout for heavy queries while providing proper UI error state handling.

## Risks / Trade-offs

- **[Risk]** If a GET request legitimately contains a body (non-standard HTTP), setting body to `b""` strips it. → **Mitigation**: Standard REST APIs in Smarket do not use request bodies for GET/DELETE/HEAD.
