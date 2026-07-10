## Why

Deploy-шаг в CI/CD (`🚀 Deploy to Hetzner`) стабильно занимает ~3 часа и завершается ошибкой. Причина — `docker compose up --wait` блокируется на healthcheck-цепочке, в которой участвует `products_etl`, не имеющий собственного healthcheck, а также тем, что `gateway_service` ждёт всех зависимостей через `service_healthy`. ETL-воркер при старте немедленно запускает полный цикл парсинга (тысячи документов в Meilisearch каждые 6 минут), перегружая `meilisearch` и блокируя healthcheck `search_service`, который в свою очередь блокирует `gateway_service`. В итоге таймаут `--wait-timeout 240` истекает, деплой падает.

## What Changes

- **Добавить healthcheck для `products_etl`** — сервис должен экспонировать `/health` эндпоинт (уже существует на порту `8082`), который Docker опрашивает. Без этого `--wait` не может подтвердить готовность.
- **Разорвать жёсткую зависимость `gateway_service` от `search_service` через `service_healthy`** — заменить на `service_started`, т.к. `search_service` — вспомогательный, а не критический сервис для старта gateway.
- **Добавить `condition: service_started` для `products_etl` в зависимостях** — ETL-воркер не должен быть в цепочке `service_healthy` при деплое.
- **Увеличить `--wait-timeout` в CI** — с 240 до 360 секунд как запасная мера для компенсации времени старта MongoDB и Meilisearch на production-сервере.
- **Оптимизировать порядок `depends_on` в `gateway_service`** — убрать избыточные `service_healthy` для сервисов, которые не являются критическими для старта gateway.
- **Добавить `SMARKET_DEPLOY_WAIT_TIMEOUT` env variable явно в CI** — сейчас значение берётся из shell-умолчания `${SMARKET_DEPLOY_WAIT_TIMEOUT:-240}`, что означает оно нигде явно не задаётся.

## Capabilities

### New Capabilities
- `cicd-deploy-healthcheck`: Корректная healthcheck-цепочка для всех контейнеров при деплое через `docker compose up --wait`. Включает healthcheck для `products_etl`, настройку таймаутов и правильные `condition` для зависимостей.

### Modified Capabilities
- `docker-doppler-cicd-integration`: Изменяется конфигурация деплой-шага — таймаут `--wait-timeout` и переменная `SMARKET_DEPLOY_WAIT_TIMEOUT` в CI.

## Impact

- **`infra/docker-compose.yml`**: Добавить healthcheck для `products_etl`; изменить `condition` для `search_service` и `zephyros_agent` в `gateway_service` с `service_healthy` на `service_started`.
- **`.github/workflows/ci.yml`**: Явно задать `SMARKET_DEPLOY_WAIT_TIMEOUT=360` в деплой-шаге.
- **Нет изменений в коде сервисов** — `/health` эндпоинт в `products_etl` уже существует (порт 8082).
- **Нет breaking changes** — все изменения в конфигурации инфраструктуры.
