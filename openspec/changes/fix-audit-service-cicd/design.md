## Context

`audit_service` — це мікросервіс для аудиту подій в системі Smarket. Він має:
- Повний Python/FastAPI код з RabbitMQ consumer та REST API
- Власний Dockerfile та Alembic міграції
- Інтеграцію в CI (detect, build, deploy) через `.github/workflows/ci.yml`
- Мапінг Doppler секретів у `doppler.yaml`
- Присутність у `infra/docker-compose.yml` (production)

Однак він відсутній у локальному Docker Compose (`infra/docker-compose.local.yml`) та не має окремого migration job у жодному з Compose файлів. Крім того, Docker-образ `ghcr.io/itstepdiplomateam1/smarket/audit_service:develop` ніколи не був залитий у GHCR, що викликає помилку CI при деплої.

## Goals / Non-Goals

**Goals:**
- Додати `audit_service` до `infra/docker-compose.local.yml` з конфігурацією, аналогічною іншим сервісам
- Додати `audit_migration_job` до обох Compose файлів
- Додати `depends_on: audit_migration_job` до `audit_service` в production Compose
- Зібрати Docker-образ та залити його в GHCR
- Гарантувати що CI збирає образ при наступному пуші в develop

**Non-Goals:**
- Зміна логіки самого `audit_service` (код, модель даних, API)
- Додавання нових сервісів або інфраструктури
- Зміна CI/CD логіки для інших сервісів

## Decisions

### Decision: Migration job замість запуску міграцій в CMD
**Рішення:** Використати окремий `audit_migration_job` (як у інших сервісів) замість запуску міграцій через `CMD alembic upgrade head && uvicorn...` в Dockerfile.

**Rationale:** Узгодженість з архітектурою інших сервісів — всі API сервіси мають окремі migration job. Це дозволяє:
- Переконатися що міграції завершені до запуску сервісу
- Легше відлагоджувати помилки міграцій
- Dockerfile залишається чистим (CMD тільки для запуску)

**Note:** Dockerfile audit_service вже має `CMD alembic upgrade head && uvicorn...`. Це не конфліктує з migration job — при окремому job міграції виконаються двічі (що безпечно для Alembic — він ідемпотентний). Але для чистоти варто прибрати `alembic upgrade head` з CMD після додавання migration job, щоб уникнути зайвого запуску.

### Decision: Структура migration job
**Рішення:** Ідентична до `reviews_migration_job` — використовує образ audit_service, запускає `cd /app/services/audit_service && alembic upgrade head`.

### Decision: Запуск audit_service через granian замість uvicorn
**Рішення:** У локальному Compose використовувати granian (як всі інші Python сервіси) замість uvicorn з Dockerfile.

**Rationale:** Узгодженість — всі API сервіси в локальному Compose використовують granian для продакшн-подібної поведінки. Dockerfile залишається з uvicorn як fallback.

## Risks / Trade-offs

- **[Duplicate migration run]** migration job + CMD в Dockerfile обидва запускають `alembic upgrade head`. → **Mitigation:** Alembic ідемпотентний; прибрати `alembic upgrade head` з CMD після додавання job.
- **[Image tag mismatch]** Якщо образ не залито вчасно, CI знову впаде. → **Mitigation:** Після мержу в develop CI автоматично збере та заллє образ. Якщо терміново — залити вручну.
- **[Local dev без audit_service]** Розробники не помітять що сервіс відсутній. → **Mitigation:** Додавання в local compose вирішує проблему.
