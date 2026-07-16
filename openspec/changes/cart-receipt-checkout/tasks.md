## 1. ETL — Geo-дані магазинів (products_etl)

- [x] 1.1 Розширити struct `zakazStore` у `internal/service/seed.go` полями `Address AddressDTO` і `Coords CoordsDTO` (за зразком вже наявного `DTO/SyncDTO.go`)
- [x] 1.2 Оновити SQL-запит у `SeedStores` (`seed.go`): включити `address`, `lat`, `lng` в INSERT і в `ON CONFLICT ... DO UPDATE SET`
- [x] 1.3 Додати міграцію у `database/migrate.go`: `ALTER TABLE stores ADD COLUMN IF NOT EXISTS address TEXT`, `ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION`, `ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION`
- [x] 1.4 Реалізувати форматування адреси: `fmt.Sprintf("%s %s, %s", s.Address.Street, s.Address.Building, s.Address.City)`. Якщо `Coords.Lat == 0 && Coords.Lng == 0` → зберігати `NULL` замість нулів
- [x] 1.5 Перевірити що `fetchAllStores()` JSON-декодує поля `address` і `coords` з відповіді Zakaz.ua (додати тестовий `log.Printf` або scratch-скрипт)

## 2. product_service — Оновлення моделі Store

- [x] 2.1 Додати поля до моделі `Store` у `services/product_service/app/database/models.py`: `address: Mapped[Optional[str]]`, `lat: Mapped[Optional[float]]`, `lng: Mapped[Optional[float]]`
- [x] 2.2 Згенерувати Alembic міграцію: `cd services/product_service && alembic revision --autogenerate -m "add address lat lng to stores"`
- [x] 2.3 Відкрити згенерований міграційний файл і вручну перевірити — упевнитись що є лише `ADD COLUMN IF NOT EXISTS`, видалити будь-які DROP операції якщо Alembic їх додав автоматично
- [x] 2.4 Перевірити що `/api/v1/stores/` ендпоінт у product_service повертає нові поля в JSON-відповіді (або що вони доступні через схему Pydantic)

## 3. cart_service — Модель Receipt і міграція

- [x] 3.1 Додати модель `Receipt` у `services/cart_service/app/database/models.py` з полями: `id UUID PK`, `user_id UUID (index)`, `cart_id UUID NULL`, `created_at TIMESTAMP server_default`, `total_price NUMERIC(10,2)`, `savings_amount NUMERIC(10,2)`, `share_token VARCHAR(32) UNIQUE (index)`, `ai_description TEXT NULL`, `snapshot JSONB`
- [x] 3.2 Згенерувати Alembic міграцію: `cd services/cart_service && alembic revision --autogenerate -m "add receipts table"`
- [x] 3.3 Перевірити згенерований файл міграції вручну, переконатися в коректності типів (UUID, JSONB, NUMERIC)

## 4. cart_service — Pydantic схеми

- [x] 4.1 Додати схеми у `services/cart_service/app/shared/schemas.py` (або окремий `receipt_schemas.py`):
  - `ReceiptSnapshotItem` — product_id, name, quantity, price, subtotal, in_stock
  - `ReceiptSnapshotStore` — store_id, store_name, retail_chain, address, lat, lng, is_complete, items, subtotal
  - `ReceiptResponse` — id, cart_id, created_at, total_price, savings_amount, share_token, ai_description (Optional[str]), snapshot
  - `ReceiptListItem` — id, share_token, created_at, total_price, savings_amount, store_name

## 5. cart_service — Рефакторинг compare логіки

- [x] 5.1 Винести логіку порівняння магазинів з `compare_cart_prices` у `services/cart_service/app/routers/cart.py` в окрему async-функцію `_build_stores_comparison(cart, http_client) -> list[dict]` (або в `crud.py`)
- [x] 5.2 Перевірити що існуючий `GET /{cart_id}/compare` продовжує працювати після рефакторингу (викликає ту саму логіку)

## 6. cart_service — Ендпоінт POST /cart/{cart_id}/complete

- [x] 6.1 Реалізувати ендпоінт `POST /{cart_id}/complete` у `cart.py`: аутентифікація через `X-User-Id`, перевірка власника, перевірка непорожнього кошика
- [x] 6.2 Викликати `_build_stores_comparison`, обрати перший `is_complete=True` магазин (або найближчий до повного)
- [x] 6.3 Розрахувати `savings_amount`: max(`total_price` серед is_complete=True) − обраний `total_price`. Якщо 1 або 0 complete магазинів — 0.00
- [x] 6.4 Побудувати `snapshot` у форматі `list[ReceiptSnapshotStore]` зі всіма товарами обраного магазину і цінами з offers_data на момент виклику
- [x] 6.5 Отримати адресу та координати обраного магазину — викликати `GET /api/v1/stores/{store_id}` з product_service або взяти зі store-об'єкта в offers_data (де доступно)
- [x] 6.6 Згенерувати `share_token` через `secrets.token_urlsafe(16)`, перевірити унікальність (retry у разі collision)
- [x] 6.7 Зберегти `Receipt` у БД: `db.add(receipt); await db.commit()`
- [x] 6.8 Зареєструвати `BackgroundTasks` виклик `_generate_ai_description(receipt_id, snapshot_store)` і повернути `ReceiptResponse` з `ai_description=null`
- [x] 6.9 Реалізувати `_generate_ai_description(receipt_id, ...)`: POST до `http://zephyros_agent:8005/agent/summarize-plan` через httpx, при успіху — UPDATE `receipts SET ai_description = ...`, весь код в try/except з `logger.error` при будь-якій помилці

## 7. cart_service — Ендпоінти GET /receipts та GET /receipts/{token}

- [x] 7.1 Створити новий файл `services/cart_service/app/routers/receipts.py`
- [x] 7.2 Реалізувати `GET /receipts` (requires `X-User-Id`): `SELECT * FROM receipts WHERE user_id = ... ORDER BY created_at DESC`, повернути `list[ReceiptListItem]`
- [x] 7.3 Реалізувати `GET /receipts/{share_token}` (public, без `X-User-Id`): `SELECT * FROM receipts WHERE share_token = ...`, 404 якщо не знайдено
- [x] 7.4 Підключити роутер у `app/main.py`: `app.include_router(receipts_router, prefix="/cart")`

## 8. zephyros_agent — Ендпоінт POST /agent/summarize-plan

- [x] 8.1 Додати Pydantic-схему вхідних даних у `app/schemas.py` (або `app/main.py`): `SummarizePlanRequest` — store_name, items_count, total_price, savings_amount
- [x] 8.2 Реалізувати ендпоінт `POST /agent/summarize-plan` у `app/main.py` (або новий `app/routes/summarize.py`): без `Agent`, прямий виклик моделі через pydantic-ai (наприклад `model.run(messages)` або `model.complete(...)`)
- [x] 8.3 Перевикористати `available_provider_chain()` і `build_model()` з `app/agent/zephyros.py`; реалізувати той самий circuit breaker з `_is_down`/`_mark_down` (або перемістити ці функції у `app/main.py` щоб не дублювати)
- [x] 8.4 Встановити timeout 4 секунди для кожного provider-виклику; якщо всі в cooldown — повернути 503 одразу
- [x] 8.5 Системний промпт: легкий тон, 2-3 речення, українська мова, без коментарів щодо конкретних товарів, без emoji
- [x] 8.6 Повернути `{"text": "<generated text>"}` при успіху

## 9. gateway — Прокси нових маршрутів

- [x] 9.1 Оновити `services/gateway/app/api/routes/cart.py`: додати прокси для `POST /{cart_id}/complete` і `GET /receipts` (обидва вимагають auth через `verify_jwt`) та `GET /receipts/{share_token}` (публічний, без verify_jwt)
- [x] 9.2 Оновити `services/gateway/app/api/routes/agent.py`: додати прокси для `POST /summarize-plan` (можна без auth — викликається лише з cart_service внутрішньо, але gateway може і обмежити, якщо потрібно)
- [x] 9.3 Переконатися що `target_url` для нових ендпоінтів cart коректно вказує на `CART_SERVICE_URL/cart/...`

## 10. Frontend — API хуки

- [x] 10.1 Додати у `src/hooks/api/useCartApi.ts` або новий файл `src/hooks/api/useReceiptsApi.ts` функцію-мутацію `useCompleteCart()`: POST `/api/v1/cart/{id}/complete`, повертає `ReceiptResponse`
- [x] 10.2 Додати `useGetReceipt(token: string)`: GET `/api/v1/cart/receipts/{token}` (публічний, без Authorization header)
- [x] 10.3 Додати `useGetMyReceipts()`: GET `/api/v1/cart/receipts` (з Authorization)
- [x] 10.4 Визначити TypeScript-типи: `ReceiptResponse`, `ReceiptListItem`, `ReceiptSnapshotStore`, `ReceiptSnapshotItem`

## 11. Frontend — Кнопка "Створити список покупок"

- [x] 11.1 Знайти компонент `CartSummary.tsx` у `src/modules/Cart/components/`
- [x] 11.2 Додати `onClick` до кнопки: викликати `useCompleteCart()`, при успіху — navigate до `/receipts/{share_token}`
- [x] 11.3 Додати стан завантаження (spinner або disabled-стан кнопки під час виклику)
- [x] 11.4 Додати обробку помилки (toast або inline повідомлення якщо complete повернув помилку)

## 12. Frontend — Сторінка /receipts/:token

- [x] 12.1 Створити директорію `src/pages/ReceiptPage/` і файл `ReceiptPage.tsx`
- [x] 12.2 Реалізувати верстку за мокапом: `eyebrow` (дата + "Архівовано"), `hero` (сума економії), AI note (вертикальна лінія + текст), receipt card (магазин, адреса, маршрут, список товарів, total), кнопки "Позначити як куплено" і "Поділитися"
- [x] 12.3 Реалізувати логіку AI description: якщо `ai_description == null` — показати skeleton, через 3-4 секунди зробити один retry GET; якщо і тоді null — приховати блок без повідомлення
- [x] 12.4 Реалізувати посилання "Прокласти маршрут": `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}`; якщо `lat/lng == null` — приховати посилання
- [x] 12.5 Кнопка "Поділитися": `navigator.share({ url: window.location.href })` або clipboard fallback
- [x] 12.6 Додати роут `/receipts/:token` у `src/app/routes/Router.tsx` (або відповідний файл роутингу) — сторінка доступна без авторизації, без `ProtectedRoute`
- [x] 12.7 Обернути компонент у `React.lazy()` + `<Suspense>` для lazy loading

## 13. Frontend — Модалка "Мої чеки"

- [x] 13.1 Створити `src/modules/Cart/components/MyReceiptsModal.tsx` за стилем `CreateCartModal.tsx`/`ReviewModal.tsx`
- [x] 13.2 Реалізувати список карток: дата, назва магазину, сума економії — клік по картці → navigate до `/receipts/{share_token}` + close modal
- [x] 13.3 Реалізувати empty state: "Ви ще не завершували жодного кошика"
- [x] 13.4 Додати точку входу в UI для відкриття модалки (наприклад кнопка "Мої чеки" в CartSummary або в шапці)

## 14. Верифікація end-to-end

- [x] 14.1 Перевірити що `GET /{cart_id}/compare`, `GET /shared/{cart_id}`, `POST /{cart_id}/share/email`, `POST /{cart_id}/duplicate`, `POST /import/{shared_cart_id}` — всі повертають ті ж відповіді що й до змін
- [x] 14.2 Перевірити повний flow: заповнити кошик → натиснути "Створити список покупок" → перейти на `/receipts/{token}` → переконатися в правильності цін та магазину
- [x] 14.3 Перевірити що `/receipts/{token}` відкривається без авторизації (відкрити у приватному вікні)
- [x] 14.4 Перевірити що через 3-4 секунди AI-опис з'являється (або блок тихо зникає якщо AI недоступний)
- [x] 14.5 Перевірити що адреси і координати магазинів заповнені після рестарту ETL (через scratch-скрипт або `/api/v1/stores/`)
