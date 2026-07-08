# docker-doppler-cicd-integration Specification

## Purpose
TBD - created by archiving change docker-doppler-cicd-integration. Update Purpose after archive.
## Requirements
### Requirement: RabbitMQ Variable Injection
Контейнери `product_service` та `reviews_service` MUST отримувати змінну оточення `RABBITMQ_URL` при старті через Docker Compose.

#### Scenario: Verify environment variables in container
- **WHEN** контейнери запускаються через `docker compose`
- **THEN** змінна оточення `RABBITMQ_URL` присутня і налаштована на підключення до контейнера `rabbitmq`

### Requirement: Doppler Config Mapping
Утиліта Doppler CLI MUST мати мапінг для `services/audit_service` з конфігом `dev_audit_service`.

#### Scenario: Doppler setup run
- **WHEN** розробник запускає `doppler setup` у папці `services/audit_service`
- **THEN** Doppler автоматично підтягує конфіг `dev_audit_service` проєкту `smarket_services_secrets` згідно з `doppler.yaml`

### Requirement: CI/CD Pipeline for Audit Service
GitHub Actions workflow MUST збирати Docker-образ, тестувати та деплоїти `audit_service` при змінах у цій папці.

#### Scenario: Code pushed to services/audit_service
- **WHEN** відбувається пуш коду в папку `services/audit_service`
- **THEN** етап `detect` виявляє зміни та додає сервіс до матриці збірки Docker та тестування Python

