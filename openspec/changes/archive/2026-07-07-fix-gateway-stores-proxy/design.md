## Context

The API Gateway proxies requests to downstream services. The `stores` proxy router currently passes `content=request.stream()` to `httpx.AsyncClient`'s `build_request` for all requests, including GET requests. Standard GET requests do not contain a body, and passing an empty stream causes the downstream FastAPI/Uvicorn server (`product_service`) to fail with HTTP 422 (Unprocessable Entity).

## Goals / Non-Goals

**Goals:**
- Fix the gateway's `stores` router so it correctly proxies GET requests with an empty body (`b""`), matching the fix implemented in the `products` router.

**Non-Goals:**
- Fix the frontend shops component (`Mainpart.tsx`) to query real store IDs. The user requested this to be fixed by the frontend developer.
- Modify any other routing behavior in the gateway.

## Decisions

- **Set Body Content to Empty for GET Requests**: We will determine the request body content before building the HTTP client request:
  ```python
  body_content = b"" if request.method == "GET" else request.stream()
  ```
  This is clean, matches the style of the `products` router proxy code, and conforms to standard HTTP specifications.

## Risks / Trade-offs

- **Risk**: Potential drift between different router proxy files in the future.
- **Mitigation**: Standardizing on the `body_content` snippet across all gateway routes.
