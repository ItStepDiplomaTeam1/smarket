## 1. Local Development Configuration Fix

- [x] 1.1 Змінити команду запуску `granian` для `audit_service` в [[docker-compose.local.yml](file:///c:/Users/ashfromsky/PycharmProjects/smarket/infra/docker-compose.local.yml)] з `app.main:app` на `src.main:app`

## 2. Dependency Verification

- [x] 2.1 Переконатися, що залежність `orjson` присутня та зафіксована у [[requirements.txt](file:///c:/Users/ashfromsky/PycharmProjects/smarket/services/audit_service/requirements.txt)]

## 3. Database & Migrations Verification

- [x] 3.1 Запустити локально або перевірити, що таблиця версій `alembic_version_audit` успішно оновлюється без конфліктів з іншими сервісами
