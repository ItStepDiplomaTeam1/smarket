## Why

Повышение безопасности, устойчивости и качества системы Smarket перед финальной защитой и развертыванием в production. 
Ранее был выполнен обширный комплекс мер по устранению уязвимостей (закрытие публічних POST/PATCH/DELETE-запросов поискового индекса, ротация токенов, CSRF-защита, Sanitize Cookie/Header, PII cleanup, Vite secrets cleanup). Для завершения аудита безопасности необходимо закрыть оставшиеся открытые задачи по очистке gateway-заголовков, проведению регрессионного тестирования, проверке секретов, миграциям БД и техническому долгу в коде фронтенда.

## What Changes

- **Gateway Header Sanitization**: Распространить принудительное удаление входных заголовков `X-User-Id`, `X-User-Role` и `Cookie` (`refresh_token`) на все остальные проксируемые роуты: `products`, `search`, `stores`, `reviews` и `admin`.
- **Regression Testing**: Прогнать и подтвердить проходимость полного пакета регрессионных тестов для `gateway` и `cart_service` после обновления схем shared-cart и внедрения верификации секретов.
- **CI & Build Validation**: Проверить сборку и тесты Rust-сервиса `search_service` в контексте Linux/CI.
- **Environment & Secrets Hardening**: Добавить и проверить валидность всех обязательных производственных секретов (`REDIS_PASSWORD`, `RABBITMQ_PASS`, `MONGO_PASS`, `MEILISEARCH_API_KEY`, `SEARCH_INTERNAL_API_TOKEN`, `ETL_ADMIN_KEY`) в конфигурации инфраструктуры / Doppler.
- **Database Migrations & Data Cleanup**: Выполнить миграции Alembic для `auth_service` и `reviews_service` (миграция отзывов производит предварительную очистку дубликатов, оставляя только самый свежий отзыв пользователя).
- **Frontend Code Health & ESLint Cleanup**: Устранить старый некритический ESLint-долг в компонентах `SettingsContent` и `Sidebar` (синхронные вызовы `setState` в эффектах, объявления компонентов внутри компонентов).

## Capabilities

### New Capabilities
- `gateway-security-hardening`: Принудительное удаление невалидных/поддельных `X-User-*` заголовков и `Cookie` из клиентских запросов ко всем проксируемым микросервисам (`products`, `search`, `stores`, `reviews`, `admin`).

### Modified Capabilities
- `cart-receipt`: Безопасная отдача shared-cart без раскрытия PII владельца (`user_id`) и внутренних ID корзины, со строгой валидацией наличия товаров в магазинах.
- `admin-panel-styling`: Очистка кодстайла и ESLint предупреждений в админ-панели и компонентах настроек.

## Impact

- **Services**: `gateway`, `cart_service`, `search_service`, `auth_service`, `reviews_service`, `products_etl`.
- **Frontend**: `apps/react` (storefront), `apps/admin`.
- **Infra/DevOps**: Doppler / `.env`, Docker Compose, CI workflows (Gitleaks, Trivy, GitHub token permissions).
- **Database**: PostgreSQL (миграции `auth` и `reviews` с дедупликацией).
