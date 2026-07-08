## ADDED Requirements

### Requirement: Audit Service Migration Job in Compose
`audit_service` MUST мати окремий migration job (`audit_migration_job`) у `infra/docker-compose.yml` (production) та `infra/docker-compose.local.yml` (local development).

#### Scenario: Migration job defined
- **WHEN** перевіряється `infra/docker-compose.yml` або `infra/docker-compose.local.yml`
- **THEN** знайдено сервіс `audit_migration_job`, який виконує `alembic upgrade head`

### Requirement: Local Compose Parity
`audit_service` MUST бути присутнім у `infra/docker-compose.local.yml` з аналогічною конфігурацією до інших API сервісів.

#### Scenario: Local compose file contains audit_service
- **WHEN** перевіряється `infra/docker-compose.local.yml`
- **THEN** знайдено повну конфігурацію сервісу `audit_service` (build, ports, env_file, healthcheck)

## MODIFIED Requirements

### Requirement: CI/CD Pipeline for Audit Service
GitHub Actions workflow MUST збирати Docker-образ, тестувати та деплоїти `audit_service` при змінах у цій папці. Крім того, образ `ghcr.io/itstepdiplomateam1/smarket/audit_service:develop` MUST існувати в GHCR для успішного деплою.

#### Scenario: Code pushed to services/audit_service
- **WHEN** відбувається пуш коду в папку `services/audit_service`
- **THEN** етап `detect` виявляє зміни та додає сервіс до матриці збірки Docker та тестування Python

#### Scenario: Docker image exists in registry
- **WHEN** деплой намагається виконати `docker compose pull`
- **THEN** образ `ghcr.io/itstepdiplomateam1/smarket/audit_service:develop` присутній у реєстрі та успішно завантажується
