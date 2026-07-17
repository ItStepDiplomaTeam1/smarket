## Why

Кошик у Smarket зараз є нескінченним списком без завершення: кнопка "Створити список покупок" у `CartSummary.tsx` існує у вёрстці, але не має жодної логіки. Після того як користувач порівняв ціни між магазинами і прийняв рішення — він не може "зафіксувати" свій план покупок. Немає жодного документа, на який він міг би покластись у магазині або поділитись з іншими.

## What Changes

- **Новий ендпоінт** `POST /carts/{cart_id}/complete` у `cart_service` — завершує кошик і повертає заморожений "чек" (снімок цін на момент завершення).
- **Нова таблиця `receipts`** у БД `cart_service` — зберігає незмінний JSONB-знімок з магазином, товарами та цінами, незалежний від живої таблиці `prices`.
- **Нові ендпоінти списку та публічного доступу**: `GET /receipts` (авторизовані чеки користувача), `GET /receipts/{share_token}` (публічний, без авторизації).
- **Новий легкий ендпоінт** `POST /agent/summarize-plan` у `zephyros_agent` — один прямий виклик моделі без tool calling, генерує 2-3 речення коментаря до чека.
- **Оновлення `stores` у product_service + products_etl**: додати колонки `address TEXT`, `lat DOUBLE PRECISION`, `lng DOUBLE PRECISION`; ETL-воркер (`seed.go`) починає зберігати ці поля з Zakaz.ua API (вони вже є в DTO `SyncDTO.go`, але не пишуться в INSERT).
- **Фронтенд**: кнопка "Створити список покупок" отримує `onClick`, нова сторінка `/receipts/:token`, модалка "Мої чеки".
- **Gateway**: прокси-маршрут для нових ендпоінтів `/api/v1/cart/receipts/*` і `/api/v1/agent/summarize-plan`.

**Не змінюються:** `GET /{cart_id}/compare`, `GET /shared/{cart_id}`, `POST /{cart_id}/share/email`, `POST /{cart_id}/duplicate`, `POST /import/{shared_cart_id}` — всі існуючі ендпоінти залишаються без змін.

## Capabilities

### New Capabilities

- `cart-receipt`: Завершення кошика і збереження незмінного знімку (receipt/чек) з вибором оптимального магазину, сумою економії, share-токеном і AI-коментарем.
- `receipt-public-share`: Публічна сторінка чека за `share_token` — доступна без авторизації, відкривається за посиланням.
- `receipt-list`: Список збережених чеків поточного користувача (модалка "Мої чеки").
- `ai-receipt-summary`: Окремий легкий ендпоінт генерації AI-коментаря до чека — без tool calling, з коротким таймаутом, graceful degradation.
- `store-geo-data`: Зберігання адреси та координат магазинів з Zakaz.ua (address, lat, lng) — необхідно для посилання "Прокласти маршрут" на сторінці чека.

### Modified Capabilities

_(немає — існуючі специфікації не змінюються)_

## Impact

**cart_service:**
- `app/database/models.py` — нова модель `Receipt`
- `app/routers/cart.py` — новий ендпоінт `POST /{cart_id}/complete`, рефакторинг логіки compare у спільну функцію
- `app/routers/receipts.py` — новий роутер (NEW)
- `app/shared/schemas.py` — нові Pydantic-схеми `ReceiptResponse`, `ReceiptListItem`, `ReceiptSnapshotStore`
- `migrations/` — нова Alembic-міграція для таблиці `receipts`

**product_service:**
- `app/database/models.py` — колонки `address`, `lat`, `lng` у моделі `Store`
- `migrations/` — Alembic-міграція `ADD COLUMN IF NOT EXISTS`

**products_etl:**
- `database/migrate.go` — `ADD COLUMN IF NOT EXISTS address TEXT, lat DOUBLE PRECISION, lng DOUBLE PRECISION` до таблиці `stores`
- `internal/service/seed.go` — включити `address`, `lat`, `lng` у INSERT/ON CONFLICT UPDATE

**zephyros_agent:**
- `app/main.py` — новий ендпоінт `POST /agent/summarize-plan`

**gateway:**
- `app/api/routes/cart.py` — прокси для `/receipts/*` і нового `complete` ендпоінту
- `app/api/routes/agent.py` — прокси для `/summarize-plan`

**Frontend (apps/react/frontend/my-react-app):**
- `src/modules/Cart/components/CartSummary.tsx` — `onClick` на кнопку "Створити список покупок"
- `src/pages/ReceiptPage/` — нова сторінка (NEW)
- `src/modules/Cart/components/MyReceiptsModal.tsx` — нова модалка (NEW)
- `src/hooks/api/useReceiptsApi.ts` — нові хуки (NEW)
- `src/app/routes/` — новий роут `/receipts/:token`
