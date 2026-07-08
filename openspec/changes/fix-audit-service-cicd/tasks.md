## 1. Docker Compose — Production (infra/docker-compose.yml)

- [x] 1.1 Додати `audit_migration_job` сервіс перед `audit_service` (аналогічно `reviews_migration_job`), з образом `ghcr.io/itstepdiplomateam1/smarket/audit_service:${IMAGE_TAG:-develop}` та командою `alembic upgrade head`
- [x] 1.2 Додати `depends_on: audit_migration_job: condition: service_completed_successfully` до сервісу `audit_service`

## 2. Docker Compose — Local Development (infra/docker-compose.local.yml)

- [x] 2.1 Додати `audit_migration_job` сервіс після `reviews_migration_job`, з build від `services/audit_service/Dockerfile` та командою `alembic upgrade head`
- [x] 2.2 Додати `audit_service` сервіс після `reviews_service`, з build від `services/audit_service/Dockerfile`, командою `granian --interface asgi --host 0.0.0.0 --port 8006 --workers 1 app.main:app`, портом `8006:8006`, env_file та здоровим healthcheck
- [x] 2.3 Додати `audit_service` до `depends_on` в `gateway_service`

## 3. Dockerfile Cleanup

- [x] 3.1 Прибрати `alembic upgrade head &&` з CMD у `services/audit_service/Dockerfile` — залишити тільки `uvicorn src.main:app --host 0.0.0.0 --port 8006`

## 4. Build & Push Docker Image

- [ ] 4.1 Зібрати образ локально: `docker build -f services/audit_service/Dockerfile -t ghcr.io/itstepdiplomateam1/smarket/audit_service:develop .`
- [ ] 4.2 Залити образ до GHCR: `docker push ghcr.io/itstepdiplomateam1/smarket/audit_service:develop`

## 5. Verify

- [ ] 5.1 Запустити `docker compose -f infra/docker-compose.local.yml up --build audit_service` та переконатись що сервіс стартує та healthcheck проходить
- [ ] 5.2 Перевірити що CI workflow не падає з помилкою `image not found`
