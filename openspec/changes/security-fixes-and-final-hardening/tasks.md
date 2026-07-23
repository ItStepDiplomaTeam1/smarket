## 1. API Gateway Header Sanitization

- [x] 1.1 Распространить принудительное удаление заголовков `X-User-Id`, `X-User-Role` и `refresh_token` cookie на роутеры `products`, `search`, `stores`, `reviews` и `admin` в `services/gateway`.
- [x] 1.2 Запустить и проверить интеграционные тесты API Gateway (`gateway-integration-tests`).

## 2. Regression Testing & Cart Public Schema Verification

- [x] 2.1 Прогнать тесты кошелька и публичных чеков (`cart-integration-tests`), убедившись в отсутствии PII (`user_id`) и внутренних `cart_id` в ответе `POST /carts/{cart_id}/complete` и `GET /api/v1/cart/receipts/{share_token}`.
- [x] 2.2 Проверить валидацию длины секретов JWT и ETL в тестах.

## 3. Database Migrations & Data Cleanup

- [x] 3.1 Выполнить Alembic миграцию для `services/auth_service` (`alembic upgrade head`).
- [x] 3.2 Убедиться, что миграция `services/reviews_service` корректно удаляет старые дубликаты отзывов (оставляя самый свежий), и применить миграцию (`alembic upgrade head`).

## 4. Environment Secrets & Infrastructure Validation

- [x] 4.1 Проверить наличие и корректность новых обязательных секретов в `infra/.env` / Doppler: `REDIS_PASSWORD`, `RABBITMQ_PASS`, `MONGO_PASS`, `MEILISEARCH_API_KEY`, `SEARCH_INTERNAL_API_TOKEN`, `ETL_ADMIN_KEY`.
- [x] 4.2 Проверить конфигурации Docker Compose (`docker compose config --quiet`).

## 5. Frontend Code Health & ESLint Cleanup

- [x] 5.1 Исправить вызовы компонентов и `setState` в эффектах в `SettingsContent` и `Sidebar` (storefront/admin).
- [x] 5.2 Выполнить запуск `npm run lint` и убедиться в успешной сборке приложений (`npm run build`).
