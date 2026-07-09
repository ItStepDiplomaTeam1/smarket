## ADDED Requirements

### Requirement: ETL Worker Healthcheck
Сервіс `products_etl` SHALL мати налаштований healthcheck у Docker Compose, щоб `docker compose up --wait` міг коректно відстежувати його стан.

#### Scenario: ETL service health reported correctly
- **WHEN** `docker compose up --wait` виконується під час деплою
- **THEN** Docker опитує `http://127.0.0.1:8082/health` кожні 30 секунд, і після успішної відповіді позначає `products_etl` як `healthy`

#### Scenario: ETL healthcheck fails gracefully
- **WHEN** HTTP-запит на `/health` повертає non-2xx або таймаут
- **THEN** Docker повторює перевірку до 5 разів з інтервалом 30 секунд перед тим, як позначити контейнер `unhealthy`

### Requirement: Non-blocking Deploy Dependencies
`gateway_service` SHALL NOT блокувати свій старт на `service_healthy` допоміжних сервісів (`search_service`, `zephyros_agent`), які не є критичними для базового функціонування API.

#### Scenario: Gateway starts when search_service is not yet healthy
- **WHEN** `search_service` перебуває у стані `starting` або `unhealthy` під час деплою
- **THEN** `gateway_service` все одно стартує і стає `healthy`, повертаючи 503 тільки для пошукових запитів

#### Scenario: Gateway starts when zephyros_agent is not yet healthy
- **WHEN** `zephyros_agent` перебуває у стані `starting` під час деплою
- **THEN** `gateway_service` все одно стартує і стає `healthy`, повертаючи 503 тільки для AI-запитів

### Requirement: Explicit Deploy Timeout Configuration
CI/CD pipeline SHALL явно задавати змінну `SMARKET_DEPLOY_WAIT_TIMEOUT` у деплой-шагу без покладання на shell-дефолти.

#### Scenario: Deploy wait timeout is applied
- **WHEN** виконується `docker compose up -d --wait`
- **THEN** таймаут очікування healthcheck становить рівно 360 секунд згідно з явно заданою змінною `SMARKET_DEPLOY_WAIT_TIMEOUT`

## MODIFIED Requirements

### Requirement: CI/CD Pipeline for Audit Service
GitHub Actions workflow MUST збирати Docker-образ, тестувати та деплоїти `audit_service` при змінах у цій папці. Deploy-шаг MUST завершуватись за < 5 хвилин після початку запуску контейнерів.

#### Scenario: Code pushed to services/audit_service
- **WHEN** відбувається пуш коду в папку `services/audit_service`
- **THEN** етап `detect` виявляє зміни та додає сервіс до матриці збірки Docker та тестування Python

#### Scenario: Deploy completes without timeout
- **WHEN** деплой запускає `docker compose up --wait --wait-timeout 360`
- **THEN** всі сервіси стають `healthy` або `started` протягом 360 секунд без блокувань від ETL-навантаження на Meilisearch
