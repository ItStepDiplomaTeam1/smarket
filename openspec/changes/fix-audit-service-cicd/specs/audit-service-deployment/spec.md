## ADDED Requirements

### Requirement: Local Docker Compose Inclusion
`audit_service` MUST бути присутнім у `infra/docker-compose.local.yml` з повною конфігурацією, аналогічною іншим API сервісам.

#### Scenario: Local compose up starts audit_service
- **WHEN** розробник виконує `docker compose -f infra/docker-compose.local.yml up --build`
- **THEN** контейнер `audit_service` запускається та стає здоровим на порту `8006`

### Requirement: Audit Service Migration Job
`audit_service` MUST мати окремий migration job (`audit_migration_job`) у обох Docker Compose файлах, який виконує `alembic upgrade head` перед запуском сервісу.

#### Scenario: Migration job runs before service
- **WHEN** Docker Compose стартує
- **THEN** `audit_migration_job` завершується успішно до запуску `audit_service`

### Requirement: Production depends_on migration
Сервіс `audit_service` у `infra/docker-compose.yml` MUST мати `depends_on: audit_migration_job` з `condition: service_completed_successfully`.

#### Scenario: Production deploy waits for migrations
- **WHEN** Docker Compose стартує в production режимі
- **THEN** `audit_service` не стартує доки `audit_migration_job` не завершиться успішно

### Requirement: Docker Image Available in GHCR
Docker-образ `ghcr.io/itstepdiplomateam1/smarket/audit_service:develop` MUST існувати в GitHub Container Registry.

#### Scenario: Image pull succeeds
- **WHEN** CI виконує `docker compose pull audit_service`
- **THEN** образ успішно завантажується без помилки `not found`
