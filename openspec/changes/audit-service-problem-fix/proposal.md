## Why

При деплої у продакшн (Hetzner) виникає збій на кроці запуску контейнерів через відсутність необхідної бібліотеки `orjson` (потрібна для `FastAPI` `ORJSONResponse`), що викликає краш `audit_service` при старті. Крім того, локальний запуск сервісу в `docker-compose.local.yml` завершується помилкою через неправильний шлях точки входу (`app.main:app` замість `src.main:app`).

## What Changes

- Додано `orjson>=3.10.0` у список залежностей [[requirements.txt](file:///c:/Users/ashfromsky/PycharmProjects/smarket/services/audit_service/requirements.txt)].
- Виправлено запуск `audit_service` в [[docker-compose.local.yml](file:///c:/Users/ashfromsky/PycharmProjects/smarket/infra/docker-compose.local.yml)]: змінено шлях модуля з `app.main:app` на `src.main:app`.
- Верифіковано схему міграцій та коректність підключення до Neon DB.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
<!-- None -->

## Impact

- [[infra/docker-compose.local.yml](file:///c:/Users/ashfromsky/PycharmProjects/smarket/infra/docker-compose.local.yml)] — зміна команди запуску для `audit_service`.
- [[services/audit_service/requirements.txt](file:///c:/Users/ashfromsky/PycharmProjects/smarket/services/audit_service/requirements.txt)] — додавання залежності `orjson`.
- CI/CD пайплайн та локальне середовище розробки отримають стабільний запуск `audit_service`.
