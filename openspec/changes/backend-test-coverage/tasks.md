## 1. Test infrastructure setup

- [x] 1.1 Add `pytest`, `pytest-asyncio`, `pytest-cov`, `httpx` to dev dependencies in each Python service's `pyproject.toml` `[dependency-groups] dev` (or `requirements-dev.txt` where applicable): auth_service, product_service, cart_service, reviews_service, audit_service, gateway, zephyros_agent, email_worker
- [x] 1.2 Add `[tool.pytest.ini_options]` section with `asyncio_mode = "auto"`, `testpaths = ["tests"]`, `addopts = "--tb=short -q"` to each Python service's `pyproject.toml` that lacks it (mirror auth_service config)
- [x] 1.3 Create empty `tests/__init__.py` in each Python service that needs one (cart_service, product_service, reviews_service, audit_service, gateway, zephyros_agent, email_worker)
- [x] 1.4 Verify `go test ./...` runs (even with no test files) in `services/products_etl/`
- [x] 1.5 Verify `cargo test` runs in `services/search_service/`

## 2. ETL unit tests (products_etl, Go)

- [x] 2.1 Create `services/products_etl/internal/transform/barcode_test.go` with EAN-13 validation tests: valid checksum passes, invalid checksum fails, wrong-length barcode fails, non-digit barcode fails
- [x] 2.2 Create `services/products_etl/internal/transform/prices_test.go` with price conversion tests: integer kopecks -> decimal hryvnias, zero handling, null/missing handling
- [x] 2.3 Create `services/products_etl/internal/transform/categories_test.go` with `ResolveMainCategoryID` tests: known slug returns correct id, unknown slug returns deterministic fallback, boundary cases
- [x] 2.4 Create `services/products_etl/internal/transform/description_test.go` with HTML stripping tests: nested tags removed, empty description stays empty, whitespace normalized
- [x] 2.5 Verify `go test ./... -v` passes locally in `services/products_etl/`


## 3. Search service unit tests (search_service, Rust)

- [x] 3.1 Refactor `services/search_service/src/handlers/get_search.rs`: extract `pub fn map_slug_to_main_id(slug: &str) -> Option<i32>` from the inline mapping block (drinks->2, baby->8, chemistry->9, beauty->6, home->5, zoo->7)
- [x] 3.2 Refactor `services/search_service/src/handlers/get_search.rs`: extract `pub fn expand_subcategory_prefixes(sub_slug: &str) -> Vec<String>` from the inline suffix-expansion block
- [x] 3.3 Refactor `services/search_service/src/handlers/get_search.rs`: extract `pub fn build_discount_range_filter(range: &str) -> Option<String>` for `10`, `10-20`, `20-30`, `30+` ranges
- [x] 3.4 Refactor `services/search_service/src/handlers/get_search.rs`: extract `pub fn build_offer_type_filter(offer: &str) -> Option<String>` for `promo`, `save`, `new` offer types
- [x] 3.5 Add `#[cfg(test)] mod tests { ... }` in `handlers/get_search.rs` covering: known slug maps to Some(id), unknown slug returns None, dairy prefix expands to >= 21 slugs (base + 20 suffixes), discount range `10-20` yields both bounds, discount `30+` yields open upper bound, promo offer requires `old_price IS NOT NULL`, new offer uses 14-day window
- [x] 3.6 Verify `cargo test` passes locally in `services/search_service/`


## 4. Cart service integration tests (cart_service)

- [x] 4.1 Create `services/cart_service/tests/test_cart.py` with `TestClient(app)` setup, `app.dependency_overrides[get_db]` -> AsyncMock, and a fixture that clears overrides in `finally`
- [x] 4.2 Add test for POST `/cart/{cart_id}/items` happy path: returns 201, persists a new cart_items row
- [x] 4.3 Add test for adding item to non-owned cart: returns 404 or 403, no persistence
- [x] 4.4 Add test for invalid add item payload (missing product_id, quantity <= 0): returns 422
- [x] 4.5 Add test for GET `/cart/{cart_id}/compare` happy path: returns one entry per store sorted by total ascending, cheapest first
- [x] 4.6 Add test for compare with city filter: only stores in that city are returned
- [x] 4.7 Add test for compare city filter fallback: when city filter excludes all stores, the unfiltered result set is returned
- [x] 4.8 Add test for POST `/cart/{cart_id}/complete` happy path: creates a receipts row with share_token, triggers async AI description task, returns 201
- [x] 4.9 Add test for checkout of empty cart: returns 400 (or consistent error), no receipt created
- [x] 4.10 Verify `pytest services/cart_service/tests/` passes locally


## 5. Gateway integration tests (gateway)

- [x] 5.1 Create `services/gateway/tests/test_gateway.py` with `TestClient(app)` setup, `monkeypatch.setattr("jwt.decode", mock)` for token simulation, and `httpx.MockTransport` for downstream responses
- [x] 5.2 Add test for valid access token passes through: downstream receives `X-User-Id` and `X-User-Role` headers, response is streamed back
- [x] 5.3 Add test for expired token rejection: returns 401, downstream NOT called
- [x] 5.4 Add test for malformed/missing token rejection: returns 401, downstream NOT called
- [x] 5.5 Add test for public product listing without token: forwards to product service, no JWT required
- [x] 5.6 Add test for admin route with admin role: forwards to downstream admin endpoint
- [x] 5.7 Add test for admin route with regular user role: returns 403, downstream NOT called
- [x] 5.8 Add test for downstream service unreachable (`httpx.ConnectError`): returns 503, no raw exception propagates
- [x] 5.9 Verify `pytest services/gateway/tests/` passes locally


## 6. Product service integration tests (product_service)

- [x] 6.1 Create `services/product_service/tests/test_products.py` with `TestClient(create_app())` setup and `app.dependency_overrides[get_db]` -> AsyncMock returning canned Product/Price rows
- [x] 6.2 Add test for GET `/api/v1/products?stores=silpo,novus`: response only includes products whose store_id matches
- [x] 6.3 Add test for GET `/api/v1/products?category=molochni-produkty&max_price=50`: response only includes matching category with price <= 50
- [x] 6.4 Add test for GET `/api/v1/products?sort=price_asc`: response ordered by price ascending
- [x] 6.5 Add test for GET `/api/v1/products/{known_id}`: returns product metadata + prices ordered cheapest first
- [x] 6.6 Add test for GET `/api/v1/products/{unknown_id}`: returns 404, no internal leak
- [x] 6.7 Add test for GET `/api/v1/products?page=1&page_size=20`: returns consistent `total`, `page`, `page_size`, `items` fields with <= 20 items
- [x] 6.8 Add test for GET `/api/v1/products?page=9999`: returns empty `items` array with correct `total`
- [x] 6.9 Verify `pytest services/product_service/tests/` passes locally


## 7. Zephyros agent unit tests (zephyros_agent)

- [x] 7.1 Create `services/zephyros_agent/tests/test_tools.py` with `mock_ctx` setup using dummy `AgentDeps`
- [x] 7.2 Add test for `search_and_compare_offers` tool with multiple products: returns up to 3 products, cheapest offer per product highlighted
- [x] 7.3 Add test for `add_product_to_cart` tool confirmation flow: returns `action_button` response instead of mutating cart immediately
- [x] 7.4 Add test for `search_and_compare_offers` tool with no hits: returns fallback dictionary with message, does not raise exception
- [x] 7.5 Create `services/zephyros_agent/tests/test_circuit_breaker.py` with `client = TestClient(app)` and dynamic `monkeypatch` on provider availability
- [x] 7.6 Add test for primary provider fails: fails on first (e.g. `groq`), fallback is used, cooldown is recorded
- [x] 7.7 Add test for all providers in cooldown: rejects request with HTTP 503 without external calls
- [x] 7.8 Add test for cooldown expiry: restores provider (e.g. `groq`) when elapsed
- [x] 7.9 Add test for schema validation: invalid block types are rejected, table block with `highlight_row` matches the cheapest offer
- [x] 7.10 Verify `pytest services/zephyros_agent/tests/` passes locally


## 8. Auth service test expansion (auth_service)

- [x] 8.1 Create `services/auth_service/tests/test_oauth_recovery_rotation.py` with mock db, mock redis client, and custom environment setup
- [x] 8.2 Add test for Google OAuth login (new registration): creates active user, password set to placeholder, returns tokens
- [x] 8.3 Add test for Google OAuth login (existing user): returns tokens without duplication
- [x] 8.4 Add test for Google OAuth login (invalid token): returns 401
- [x] 8.5 Add test for Telegram OAuth login (valid): verify HMAC, finds/creates user, returns tokens
- [x] 8.6 Add test for Telegram OAuth login (expired/tampered): returns 401
- [x] 8.7 Add test for forgot password flow: generates secure token, stores in Redis (15m TTL), sends reset email
- [x] 8.8 Add test for reset password (valid token): verifies token matching email, updates password, deletes token, returns success
- [x] 8.9 Add test for reset password (invalid/expired token): returns 400
- [x] 8.10 Add test for refresh token rotation: old refresh token JTI blacklisted in Redis on refresh, new access/refresh issued
- [x] 8.11 Add test for blacklisted token rejection: returns 401 on refresh with blacklisted token
- [x] 8.12 Verify `pytest services/auth_service/tests/` passes locally


## 9. Reviews service tests (reviews_service)

- [x] 9.1 Create `services/reviews_service/tests/test_reviews.py` with `TestClient(app)`, `app.dependency_overrides[get_db]` -> AsyncMock, and `proxy_auth`-mocked user_id
- [x] 9.2 Add test for GET `/api/v1/reviews/product/{product_id}`: returns list of reviews for that product
- [x] 9.3 Add test for POST `/api/v1/reviews/`: creates a review for the authenticated user, returns 201
- [x] 9.4 Add test for PUT `/api/v1/reviews/{review_id}` by owner: updates the review, returns 200
- [x] 9.5 Add test for PUT by non-owner: returns 403, review not modified
- [x] 9.6 Add test for DELETE `/api/v1/reviews/{review_id}` by owner: deletes the review, returns 204
- [x] 9.7 Add test for invalid rating (not 1-5): returns 422
- [x] 9.8 Verify `pytest services/reviews_service/tests/` passes locally


## 10. Audit service tests (audit_service)

- [x] 10.1 Create `services/audit_service/tests/test_audit.py` with `TestClient(app)`, `app.dependency_overrides[get_db]` -> AsyncMock returning canned audit_logs rows
- [x] 10.2 Add test for GET `/admin/audit` happy path: returns paginated logs with `total`, `page`, `page_size`, `items` fields
- [x] 10.3 Add test for severity filter: only logs with matching severity are returned
- [x] 10.4 Add test for event_type filter: only logs with matching event_type are returned
- [x] 10.5 Add test for search query: logs whose message contains the query substring are returned
- [x] 10.6 Add test for pagination beyond result set: returns empty `items` array, correct `total`
- [x] 10.7 Verify `pytest services/audit_service/tests/` passes locally


## 11. Email worker tests (email_worker)

- [x] 11.1 Create `services/email_worker/tests/test_publisher.py` replacing the manual `src/test_publisher.py` with an actual pytest test using a local RabbitMQ `aiormq` mock or `faststream.TestApp`
- [x] 11.2 Add test for valid email event processing: `process_email_sending` is invoked with the EmailEvent payload, Resend API is called (mocked) with the expected payload
- [x] 11.3 Add test for failed processing triggers `RejectMessage`: the message is routed to the DLQ (`email_dead_letter_queue`)
- [x] 11.4 Add test that healthcheck endpoint on port 8085 returns `{"status": "ok"}`
- [x] 11.5 Verify `pytest services/email_worker/tests/` passes locally


## 12. CI pipeline integration

- [x] 12.1 Configure pre-commit unit test hook running `pytest` on modified Python services
- [x] 12.2 Configure pre-commit hook to skip execution when only non-service or docs paths are modified
- [x] 12.3 Verify pre-commit config installs and validates locally via `pre-commit run --all-files`
- [x] 12.4 Verify GitHub Actions CI config triggers and runs tests for modified Python services with coverage artifacts uploaded, Go tests for `products_etl`, and Rust tests for `search_service`

## 13. Pre-commit hook

- [x] 13.1 Update `.pre-commit-config.yaml` to add a local hook that detects staged files under `services/<name>/` and runs `pytest services/<name>/tests/` if a `tests/` directory exists for that service
- [x] 13.2 Ensure the pre-commit hook skips the test step when no service files are staged
- [x] 13.3 Document the new pre-commit hook behavior in `AGENTS.md` (a short note under section 9 about test hook behavior)
- [x] 13.4 Verify `pre-commit run --all-files` passes after the changes

## 14. Final verification

- [x] 14.1 Run `ruff check` and `mypy` across all modified Python services; fix any newly introduced lints/type errors
- [x] 14.2 Run `go vet` and `go build` in `services/products_etl/` after the refactor-light extractions
- [x] 14.3 Run `cargo clippy` and `cargo build` in `services/search_service/` after the pure-function extractions
- [x] 14.4 Trigger a CI run on a feature branch by pushing the change set; confirm all test stages pass
- [x] 14.5 Update `AGENTS.md` section 9 with a "Tests" subsection listing the test commands per service (pytest/go test/cargo test)

