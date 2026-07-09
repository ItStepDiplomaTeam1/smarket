## Why

`audit_service` — це повністю реалізований мікросервіс з власним Dockerfile, міграціями та конфігурацією, але він відсутній у локальному Docker Compose та не має окремого migration job у production Compose. В результаті CI/CD падає з помилкою `image not found` при деплої, а локальний запуск неможливий без ручного додавання сервісу.

## What Changes

- Додати `audit_service` до `infra/docker-compose.local.yml` (сервіс + migration job)
- Додати `audit_migration_job` до `infra/docker-compose.yml` (production)
- Додати `depends_on: audit_migration_job` до `audit_service` в production Compose
- Зібрати та залити Docker-образ `ghcr.io/itstepdiplomateam1/smarket/audit_service:develop` до GHCR
- Гарантувати, що CI workflow правильно тригерить збірку образу при пушах у `develop`

## Capabilities

### New Capabilities
- `audit-service-deployment`: Повноцінна інтеграція audit_service у CI/CD пайплайн, локальне та production середовище

### Modified Capabilities
- `docker-doppler-cicd-integration`: Додати вимогу що audit_service повинен мати migration job, бути присутнім у local compose, та образ має бути доступний у реєстрі

## Impact

- `infra/docker-compose.yml` — додавання audit_migration_job та depends_on
- `infra/docker-compose.local.yml` — додавання audit_service + audit_migration_job
- GHCR — заливка образу audit_service:develop
- CI workflow — перевірка що образ збирається та пушиться при змінах у services/audit_service/
