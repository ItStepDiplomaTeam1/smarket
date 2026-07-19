## Why

Всі 10 бекенд-мікросервісів Smarket мають нульове або майже нульове покриття тестами. Єдиний сервіс з тестами — `auth_service` (24 тести). Решта сервісів — включаючи критичний ETL-пайплайн на Go, пошуковий сервіс на Rust та AI-агента — не мають жодного автоматичного тесту. Відсутній CI-пайплайн, який би запускав тести при деплої. Кожна зміна коду — ризик регресії без страхувальної сітки.

## What Changes

- Додати unit-тести для **сервісів з нульовим покриттям** за пріоритетністю: `products_etl` (Go), `search_service` (Rust), `cart_service`, `gateway`, `zephyros_agent`, `product_service`, `reviews_service`, `audit_service`, `email_worker`
- Додати integration-тести для критичних сценаріїв: чекаут через `cart_service`, proxy-роутинг через `gateway`, пошуковий фільтр через `search_service`
- Розширити існуючі тести `auth_service` для покриття OAuth flow (Google, Telegram) та password recovery
- Додати `pytest`/`go test`/`cargo test` конфігурації в CI-пайплайн (`.github/workflows/ci.yml`)
- Налаштувати pre-commit хук для запуску unit-тестів локально

## Capabilities

### New Capabilities

- `etl-unit-tests`: Unit-тести для Go ETL-воркера (`products_etl`) — трансформація даних, валідація EAN, мапінг категорій, конвертація цін
- `search-unit-tests`: Unit-тести для Rust search_service — побудова фільтрів Meilisearch, розгортання підкатегорій, пагінація
- `cart-integration-tests`: Integration-тести для cart_service — додавання товарів, порівняння цін по магазинах, чекаут, AI-опис чеку
- `gateway-integration-tests`: Integration-тести для gateway — проксі-роутинг, JWT-верифікація, перевірка admin-ролі, обробка помилок
- `agent-unit-tests`: Unit-тести для zephyros_agent — інструменти агента (add_to_cart, search_and_compare, compare_cart_stores), circuit breaker, форматування UI-блоків
- `product-integration-tests`: Integration-тести для product_service — фільтрація товарів, пагінація, отримання цін, кешування
- `backend-ci-tests`: Налаштування запуску тестів у CI-пайплайні для Python (pytest), Go (go test) та Rust (cargo test) сервісів
- `auth-test-expansion`: Розширення тестів auth_service — Google OAuth flow, Telegram OAuth callback, password recovery, refresh token ротація

### Modified Capabilities

Немає — це суто новий функціонал, який не змінює вимоги до існуючих можливостей.

## Impact

- **Код**: Всі 10 сервісів у `services/` отримають тестові файли (`tests/` для Python, `*_test.go` для Go, `#[cfg(test)]` для Rust)
- **CI/CD**: `.github/workflows/ci.yml` отримає новий етап `test` або розширення існуючого `lint & test`
- **Залежності**: Додавання `pytest`, `pytest-asyncio`, `httpx` у dev-залежності Python-сервісів; `testify` для Go; нативний `#[test]` для Rust
- **Фронтенд не зачіпається** — цей change охоплює лише бекенд-сервіси