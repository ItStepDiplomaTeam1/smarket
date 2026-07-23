## Context

Большая часть критических уязвимостей уже закрыта (CSRF, JWT, PII removal, rotaton, CORS, public endpoints auth, Vite secrets). Остались задачи по полной унификации безопасной прокси-схемы на Gateway, проверке окружения, миграциям БД с очисткой дубликатов и доведению ESLint до идеального состояния перед дипломом.

## Goals / Non-Goals

**Goals:**
- Полная зачистка заголовков `X-User-*` и `Cookie` во ВСЕХ роутерах API Gateway (`products`, `search`, `stores`, `reviews`, `admin`).
- Прохождение интеграционных тестов `gateway` и `cart_service` с обновленным контрактом public shared-cart.
- Проверка и наполнение обязательных продакшн-секретов в Doppler (`REDIS_PASSWORD`, `RABBITMQ_PASS`, `MONGO_PASS`, `MEILISEARCH_API_KEY`, `SEARCH_INTERNAL_API_TOKEN`, `ETL_ADMIN_KEY`).
- Применение Alembic миграций `auth` и `reviews` (с автоматическим удалением дубликатов отзывов до создания уникального индекса).
- Исправление рендеринга и эффектов в `SettingsContent` и `Sidebar` для устранения предупреждений ESLint.

**Non-Goals:**
- Изменение внешней логики поиска Meilisearch или Go ETL парсинга.
- Добавление новых пользовательских фич вне рамок безопасности и чистки техдолга.

## Decisions

### 1. Единая санитаризация заголовков в API Gateway
**Решение**: Применять функцию очистки заголовков и куки ко всем проксируемым запросам FastAPI Gateway (`services/gateway/app/routers/`). Перед отправкой запроса микросервисам удаляются любые внешние заголовки `X-User-Id` / `X-User-Role`, а заголовок `Cookie` очищается от `refresh_token`, чтобы внутренние сервисы получали только доверенные данные, установленные самим Gateway.

### 2. Дедупликация отзывов при миграции PostgreSQL
**Решение**: В миграции `reviews_service` добавить предварительный SQL-шаг перед выбором `op.create_unique_constraint`:
```sql
WITH duplicates AS (
    SELECT id, ROW_NUMBER() OVER (
        PARTITION BY user_id, product_id 
        ORDER BY created_at DESC
    ) AS row_num
    FROM reviews
)
DELETE FROM reviews WHERE id IN (SELECT id FROM duplicates WHERE row_num > 1);
```
 это гарантирует сохранность самого свежего отзыва и исключает ошибки `UniqueViolation` при миграции.

### 3. Исправление ESLint предупреждений компонентов
**Решение**: 
- Вынести встроенные субкомпоненты из `SettingsContent` и `Sidebar` на верхний уровень модуля или в отдельные файлы.
- Заменить синхронные вызовы `setState` внутри `useEffect` на вычисляемый стейт (derived state) или мемоизированные селекторы Zustand.

## Risks / Trade-offs

- **[Risk]** Возможное несовпадение названий переменных в Doppler и `docker-compose.yml`.
  → *Mitigation*: Проверить `doppler.yaml` и имена переменных в `.env.example` / `infra/.env`.
- **[Risk]** Удаление пользовательских данных при очистке дубликатов отзывов.
  → *Mitigation*: Сохраняется самый поздний по дате отзыв (`ORDER BY created_at DESC`).
