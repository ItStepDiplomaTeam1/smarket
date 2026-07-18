# 🛒 Smarket — Карта монорепозиторію для AI-агентів

> **Цей файл призначений для читання AI-кодувальниками (Claude Code, OpenSpec-агенти, Cursor, Gemini, Copilot тощо).**  
> Він містить вичерпний опис архітектури, взаємозв'язків, специфікацій та конвенцій монорепозиторію Smarket. AI-агент повинен дотримуватися цих правил для забезпечення високої якості коду та запобігання порушення цілісності системи.

---

## 🚦 1. Правило скоупу та обмеження (Scope Rules)

1. **Ізоляція змін**: AI-агент може вносити зміни **виключно** у межах сервісу, над яким його безпосередньо попросили працювати (`services/<name>/`), або у відповідному застосунку (`apps/<name>/`).
2. **Крос-сервісні зміни**: Якщо задача вимагає модифікації спільних контрактів (наприклад, схеми БД, API Gateway проксі, RabbitMQ повідомлень), агент **зобов'язаний зупинитися** та запросити підтвердження у розробника перед внесенням крос-сервісних змін.
3. **DDL та міграції**: Будь-які зміни схем баз даних повинні виконуватися виключно через систему міграцій відповідного сервісу (Alembic для Python-сервісів, Go DDL скрипти в `products_etl`).
4. **Секрети**: Заборонено хардкодити паролі, токени, API-ключі. Використовуйте `.env` або Doppler для передачі секретів через змінні оточення.
5. **Лінтери та форматування**: Python-сервіси повинні відповідати конвенціям `ruff` та `mypy`. Go-сервіси мають форматуватися через `gofmt`. Код повинен проходити лінтинг перед фіналізацією завдання.

---

## 🗺️ 2. Глобальна архітектура та потоки даних

Smarket — це агрегатор цін на продукти харчування (дані з Zakaz.ua) з мікросервісною архітектурою.

```text
                                     Клієнт (React / Vite)
                        ┌──────────────────────┴──────────────────────┐
                        │                                             │
                        ▼ apps/react (:5173 / CDN)                    ▼ apps/admin (:5174 / CDN)
                (Магазин покупця)                               (Панель адміністратора)
                        │                                             │
                        └──────────────────────┬──────────────────────┘
                                               │
                                               ▼ :8080 (публічний порт)
                        ┌────────────────────────────────────────────────────────┐
                        │                     gateway_service                    │
                        │    (Проксіює всі запити до внутрішніх мікросервісів)    │
                        └──────┬────────┬────────┬────────┬────────┬────────┬────┘
                               │        │        │        │        │        │
         ┌─────────────────────┘        │        │        │        │        └──────────────────────┐
         ▼ :8001                        ▼ :8000  ▼ :8002  ▼ :8004  ▼ :8005                         ▼ :8083
┌─────────────────┐             ┌───────┴──────┐┌────────┐┌────────┐┌────────────────┐      ┌─────────────────┐
│  auth_service   │             │product_service││  cart_  ││reviews_││zephyros_agent  │      │ search_service  │
│  (Auth & JWT)   │             │(Read Catalog)││service ││service ││(AI Promin Agent)│     │  (Search Proxy) │
└────────┬────────┘             └───────┬──────┘└────┬───┘└────┬───┘└───────┬────────┘      └────────┬────────┘
         │                              │            │         │            │                        │
         │ (Events via smarket_events)  │            │         │            │                        │
         ▼                              ▼            ▼         ▼            ▼                        ▼
     RabbitMQ (:5672) ─────────> [ audit_queue ] ─────────────────────────> ┌──────────────────────────┐
         │                                                                  │      audit_service       │
         │ (Events via email_queue)                                         │  (Збір логів системи)    │
         ▼                                                                  └────────────┬─────────────┘
     [ email_queue ] ──────────> ┌──────────────────────────┐                            │
                                 │       email_worker       │                            │
                                 │ (Відправка Email-листів) │                            │
                                 └──────────────────────────┘                            │
                                                                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    База даних PostgreSQL                                       │
│                                (shared / private schemas)                                      │
│  ┌───────────────────────┬───────────────────────┬──────────────────────┬───────────────────┐  │
│  │   схема shared_cat    │   схема auth_service  │  схема cart_service  │ схема audit_logs  │  │
│  │ (products/stores/etc) │     (User table)      │  (carts, items, etc) │   (audit_logs)    │  │
│  └───────────────────────┴───────────────────────┴──────────────────────┴───────────────────┘  │
└───────────────────────────▲────────────────────────────────────────────────────────────────────┘
                            │ (Bulk Upsert)
                    ┌───────┴───────┐ (Store Raw Pages) ┌───────────────┐
                    │ products_etl  │ ────────────────> │    MongoDB    │
                    │  (Go Parser)  │                   │  (Datalake)   │
                    └────────┬──────┘                   └───────────────┘
                             │ (Index Updates)
                             ▼
                     ┌───────────────┐
                     │  Meilisearch  │
                     │    (:7700)    │
                     └───────────────┘
```

---

## 📂 3. Каталог сервісів (`services/` та `apps/`)

### 1. `gateway` (API Gateway)
*   **Директорія**: `services/gateway/`
*   **Стек**: Python, FastAPI, Granian (ASGI)
*   **Порт**: `8080` (зовнішній)
*   **Вхідна точка**: `services/gateway/app/main.py`
*   **Роль**: Єдина точка входу. Перевіряє JWT токени користувачів та проксіює HTTP-запити на внутрішні сервіси за допомогою `httpx.AsyncClient`. Збагачує проксі-запити заголовками `X-User-Id` та `X-User-Role`.
*   **Специфіка**: Перевіряє JWT токени доступу адміністраторів для захищених роутів `/api/v1/admin/*`, проксіює адмін-дії до `auth_service` та `audit_service`. Проксіює улюблені товари (`/api/v1/favorites/*`) до `cart_service` на роути `/favorites/*`.
*   **Секрети**: `.env` (`CORS_ORIGINS`, `AUTH_SERVICE_URL`, `PRODUCT_SERVICE_URL`, etc.).

### 2. `auth_service` (Авторизація)
*   **Директорія**: `services/auth_service/`
*   **Стек**: Python, FastAPI, SQLAlchemy async, asyncpg, Granian
*   **Порт**: `8001` (внутрішній)
*   **Вхідна точка**: `services/auth_service/main.py`
*   **Роль**: Реєстрація, авторизація, JWT-токени (access + refresh), Google OAuth, Telegram Login/OAuth. Rate limiting через SlowAPI + Redis (префікс `rl:auth`).
*   **БД схема**: Власна схема в PostgreSQL (таблиця `User` з UUID PK, email unique, hashed_password, role, is_active, telegram_id unique, created_at, settings JSONB, updated_at). Міграції: `alembic upgrade head`.

### 3. `product_service` (Каталог продуктів — Read)
*   **Директорія**: `services/product_service/`
*   **Стек**: Python, FastAPI, SQLAlchemy async, Granian
*   **Порт**: `8000` (внутрішній)
*   **Вхідна точка**: `services/product_service/app/main.py`
*   **Роль**: Публічний Read-only каталог товарів, категорій, цін та магазинів.
*   **Специфіка**: Слухає канал `pg_notify` (`LISTEN products_updated` в `listeners/pg_listener.py`) для реактивної інвалідації кешу. Надає приватний ендпоінт `/api/v1/internal/dashboard-stats` для збору метрик панелі адміністратора.
*   **БД схема**: Працює в режимі Read-only зі спільною PostgreSQL-схемою, яку наповнює `products_etl`.

### 4. `cart_service` (Кошик покупок, Улюблені та Чеки)
*   **Директорія**: `services/cart_service/`
*   **Стек**: Python, FastAPI, SQLAlchemy async, Granian
*   **Порт**: `8002` (внутрішній)
*   **Вхідна точка**: `services/cart_service/app/main.py`
*   **Роль**: Управління кошиками (`carts`, `cart_items`), збереження списку улюблених товарів (`favorites`), а також збереження і видалення публічних чеків користувача (`receipts` зі знімком цін товарів та описом від ШІ).
*   **Специфіка**: Публікує події чекауту та замовлень в RabbitMQ для `email_worker` через чергу `email_queue`.
*   **БД схема**: Власна ізольована схема в PostgreSQL з таблицями `carts`, `cart_items`, `favorites`, `receipts`.

### 5. `reviews_service` (Відгуки на товари)
*   **Директорія**: `services/reviews_service/`
*   **Стек**: Python, FastAPI, SQLAlchemy async, Granian
*   **Порт**: `8004` (внутрішній)
*   **Вхідна точка**: `services/reviews_service/app/main.py`
*   **Роль**: Створення, видалення та агрегація відгуків і рейтингів товарів.
*   **БД схема**: Власна ізольована схема в PostgreSQL (таблиця `reviews`).

### 6. `search_service` (Пошуковий проксі)
*   **Директорія**: `services/search_service/`
*   **Стек**: Rust, Axum, Meilisearch SDK
*   **Порт**: `8083` (внутрішній)
*   **Вхідна точка**: `services/search_service/src/main.rs`
*   **Роль**: Тонкий проксі-шар над Meilisearch. Оптимізує та розширює пошукові запити (наприклад, розгортає підкатегорії під мережеві суфіксы) та кешує результати.
*   **Специфіка**: Налаштовує індекс `products` при запуску (задає searchable, filterable та sortable атрибути).

### 7. `zephyros_agent` (ШІ-асистент "Promin")
*   **Директорія**: `services/zephyros_agent/`
*   **Стек**: Python, FastAPI, pydantic-ai
*   **Порт**: `8005` (внутрішній)
*   **Вхідна точка**: `services/zephyros_agent/app/main.py`
*   **Роль**: Інтерактивний чат-асистент покупця.
*   **Специфіка**: Працює за схемою UI-блоків (`ZephyrosResponse`). Підтримує ланцюжок відкатості моделей з механізмом Circuit Breaker (`groq` -> `gemini` -> `openrouter` -> `cerebras`).
*   **Інструменти (Tools)**:
    - `search_and_compare_offers` (пошук та порівняння цін)
    - `get_user_cart` (отримання кошика)
    - `add_product_to_cart` (додавання товару, вимагає підтвердження користувача)
    - `clear_user_cart` (очищення кошика)
    - `remove_item_from_cart` (видалення товару з кошика)
    - `compare_cart_stores` (порівняння повної вартості кошика по супермаркетах)
    - `get_product_reviews` (отримання відгуків)
    - `create_product_review` (створення відгуку)

### 8. `products_etl` (Go ETL Воркер)
*   **Директорія**: `services/products_etl/`
*   **Стек**: Go (1.26), pgx/v5, mongo-driver/v2, amqp091-go
*   **Порт**: `8082` (внутрішній)
*   **Вхідна точка**: `services/products_etl/main.go`
*   **Роль**: Періодичний парсинг Zakaz.ua, збереження сирих даних у MongoDB, трансформація, масовий Upsert в Postgres та Meilisearch.
*   **Ендпоінти**:
    - `GET /health` (перевірка стану планувальника та з'єднань з БД)
    - `POST /admin/etl/control` (керування станом планувальника: `start`/`stop`)
    - `POST /backfill` (запуск повного переіндексування товарів у Meilisearch у фоні)
    - `GET /product/get` (отримання товарів напряму з Zakaz API)

### 9. `email_worker` (Email Воркер)
*   **Директорія**: `services/email_worker/`
*   **Стек**: Python, FastStream, Jinja2
*   **Порт**: `8085` (тільки healthcheck)
*   **Вхідна точка**: `services/email_worker/src/main.py`
*   **Роль**: Consumer черги `email_queue` (RabbitMQ). Відправляє транзакційні листи користувачам. При збоях перенаправляє листи до DLQ (`email_dead_letter_queue`).

### 10. `audit_service` (Сервіс логів аудіювання)
*   **Директорія**: `services/audit_service/`
*   **Стек**: Python, FastAPI, SQLAlchemy async, FastStream, Granian (ASGI)
*   **Порт**: `8006` (внутрішній)
*   **Вхідна точка**: `services/audit_service/main.py`
*   **Роль**: Збір та агрегація логів і подій системи через RabbitMQ.
*   **Специфіка**: Слухає топік `smarket_events` в RabbitMQ (`audit_queue`) для запису логів у базу даних PostgreSQL. Надає адміністративний ендпоінт `/admin/audit` для отримання логів з пагінацією та пошуком.
*   **БД схема**: Власна ізольована схема `audit_logs` у PostgreSQL (таблиця `audit_logs`).

### 11. `apps/react` (Магазин покупця)
*   **Директорія**: `apps/react/frontend/my-react-app/`
*   **Стек**: React, Vite, TS, Tailwind CSS v4, `@cloudflare/vite-plugin`
*   **Порт**: `5173` (локальний dev)
*   **Роль**: Основний клієнтський веб-застосунок покупця. Хоститься на Cloudflare Pages, розгортання виконується через Wrangler.

### 12. `apps/admin` (Панель адміністратора)
*   **Директорія**: `apps/admin/`
*   **Стек**: React, Vite, TS, Tailwind CSS v3, Recharts
*   **Порт**: `5174` (локальний dev)
*   **Роль**: Панель адміністратора для перегляду метрик, списків товарів, логів аудиту системи, користувачів та налаштувань.

---

## 🗄️ 4. Бази даних, міграції та кешування

### 🐘 PostgreSQL
Вся реляційна структура живе в єдиному інстансі PostgreSQL, але логічно розбита на схеми:
*   `public` або спільна схема (таблиці `stores`, `categories`, `products`, `store_products`, `prices`) — наповнюється ETL-воркером.
*   `auth_service` (таблиця `User`).
*   `cart_service` (таблиці `carts`, `cart_items`, `favorites`, `receipts`).
*   `reviews_service` (таблиця `reviews`).
*   `audit_service` (таблиця `audit_logs`).

Кожен сервіс на Python має свою папку міграцій та файл `alembic.ini`.

**Виконання міграцій вручну:**
```bash
# Для auth_service
cd services/auth_service && alembic upgrade head

# Для product_service
cd services/product_service && alembic upgrade head

# Для cart_service
cd services/cart_service && alembic upgrade head

# Для reviews_service
cd services/reviews_service && alembic upgrade head

# Для audit_service
cd services/audit_service && alembic upgrade head
```

### 🍃 MongoDB Datalake
*   Колекція `smarket_datalake.raw_pages` містить сирі HTTP-відповіді категорій товарів від Zakaz.ua.
*   Контейнер `ofelia` (cron daemon) щодня о 03:00 очищує документи колекції зі статусом `processed` або `failed` старші за 24 години.

### ⚡ Redis & RabbitMQ
*   **Redis** (порт `6379`) — лімітування запитів, спільний кеш.
*   **RabbitMQ** (порт `5672`) — обмін повідомленнями. Черги: `email_queue` (з DLQ `email_dead_letter_queue`), `etl_queue`, а також обмінник `smarket_events` (topic) з чергою `audit_queue`.

---

## 🔄 5. Деталі Go ETL Пайплайну (`products_etl`)

Служба `products_etl` розбита на три паралельні асинхронні процеси (горутини):

1.  **Scheduler**: Кожні 2 години шукає в Postgres активні магазини, які не парсилися понад 2 години, та відправляє таски (`ETLTask`) в RabbitMQ чергу `etl_queue`.
2.  **ExtractLoadWorker**:
    *   Слухає `etl_queue`.
    *   Для кожного завдання завантажує список категорій Zakaz.ua.
    *   Викачує пагіновані списки товарів (по 100 шт).
    *   Зберігає сирі JSON-сторінки в MongoDB зі статусом `pending`.
3.  **TransformLoadWorker**:
    *   Постійно опитує MongoDB на наявність `pending` документів.
    *   Валідує штрихкоди (EAN-13), вилучає HTML з описів, конвертує ціни з копійок у гривні (`price / 100.0`).
    *   Мапить категорії на 10 глобальних категорій (`ResolveMainCategoryID`).
    *   Робить масовий `UPSERT` у PostgreSQL (`stores`, `categories`, `products`, `store_products`, `prices`).
    *   Надсилає оновлені документи до `search_service` для індексації у Meilisearch.
    *   Виконує команду `NOTIFY products_updated, '{"store_id": "..."}'` для сповіщення інших сервісів.

---

## 🔍 6. Налаштування пошуку (`search_service` & Meilisearch)

Meilisearch індексує документи товарів.
*   **Пошук (`searchable`)**: `title`, `brand`, `category_name`, `canonical_ean`.
*   **Фільтрація (`filterable`)**: `category_id`, `category_slug`, `store_id`, `retail_chain`, `price`, `in_stock`, `is_hidden`, `main_category_id`, `old_price`, `created_at_ts`, `discount_percent`.
*   **Сортування (`sortable`)**: `price`, `title`, `discount_percent`.

При отриманні запиту `GET /api/v1/search/search` Rust-сервіс:
1.  Мапить спрощені слаги категорій фронтенду (наприклад, `drinks`, `zoo`) на `main_category_id`.
2.  Розгортає підкатегорії (наприклад, `molochni-produkty` перетворює на масив `["molochni-produkty", "molochni-produkty-novus", "molochni-produkty-silpo", ...]`).
3.  Формує гнучкий фільтр Meilisearch та повертає structured відповідь із масивом активних пропозицій (`offers`) з різних магазинів.

---

## 🤖 7. Специфікація UI-блоків ШІ-Агента (Zephyros)

Zephyros (Promin) зобов'язаний відповідати виключно валідним JSON-об'єктом наступної структури:
```json
{
  "blocks": [
    { "type": "text", "content": "Текст повідомлення" },
    {
      "type": "table",
      "title": "Порівняння цін",
      "columns": ["Назва", "Магазин", "Ціна", "Наявність"],
      "rows": [["Молоко Селянське", "Novus", "41.50 UAH", "true"]],
      "highlight_row": 0
    }
  ]
}
```

### Доступні типи блоків (`type`):
*   `text`: Простий текст.
*   `table`: Таблиця порівняння цін (для продуктів: `["Назва", "Магазин", "Ціна", "Наявність"]`; для кошика: `["Супермаркет", "Сума кошика", "Знайдено товарів", "Статус"]`). Найдешевша пропозиція обов'язково підсвічується (`highlight_row`).
*   `product_card`: Картка рекомендованого товару з ціною та посиланням.
*   `tabs`: Групування результатів по табах (наприклад, по супермаркетах чи категоріях).
*   `clarification`: Уточнюючі запитання з фіксованими варіантами відповіді (2–4 варіанти).
*   `action_button`: Кнопка дії.
    - `"add_to_cart"`: payload `{ "product_id": <int>, "quantity": <int>, "store_id": "<string>" }` (пропозиція додати товар у кошик).
    - `"navigate"`: payload `{ "route": "<string>" }` (навігація до `/cart`, `/shops/metro`, `/products/123`, тощо).
    - `"apply_filters"`: payload `{ "retail_chain": "<string|null>", "query": "<string|null>", "category_slug": "<string|null>", "price_min": <float|null>, "price_max": <float|null> }`
*   `badge`: Кольорова плашка (`savings`, `best_price`, `warning`, `info`).
*   `fallback`: Повідомлення про помилку чи відсутність результатів.
*   `divider`: Візуальний розділювач.

---

## 💻 8. Стандарти розробки Фронтенду (`apps/react` та `apps/admin`)

*   **Абсолютні імпорти**: Тільки через аліас `@/` (наприклад, `import { useAuth } from '@/store/auth'`). Відносні імпорти (`../../`) суворо заборонені.
*   **Глобальний стан**: Zustand, стори розташовані в `src/store/` або `src/store/useAuthStore.ts`.
*   **Фетчінг**: TanStack Query (React Query). Запити винесені у кастомні хуки в `src/hooks/api/` або `src/hooks/`.
*   **Стилізація**: Tailwind CSS (Tailwind CSS v4 у `apps/react`, Tailwind CSS v3 у `apps/admin`). Використовуються виключно утилітарні класи.
*   **Lazy Loading**: Веб-сторінки та великі модальні вікна повинні завантажуватися через `React.lazy()` та обгортатися в `Suspense`.

---

## 🛠️ 9. Корисні команди для розробки та дебагу

### Запуск інфраструктури локально:
*   **Повний стейк (Production emulation)**:
    ```bash
    cd infra
    docker compose up --build
    ```
*   **Локальна розробка (з мапінгом портів та використанням Neon DB)**:
    ```bash
    cd infra
    docker compose -f docker-compose.local.yml up --build
    ```

### Робота з міграціями Alembic (на прикладі auth_service):
```bash
cd services/auth_service
alembic revision --autogenerate -m "опис змін"
alembic upgrade head
```

### Запуск фронтенду локально:
*   **Клієнтський застосунок**:
    ```bash
    cd apps/react/frontend/my-react-app
    npm install
    npm run dev
    ```
*   **Панель адміністратора**:
    ```bash
    cd apps/admin
    npm install
    npm run dev
    ```

### Windows/PowerShell обхід політики виконання скриптів (якщо npx або скрипти не запускаються):
```powershell
powershell -ExecutionPolicy Bypass -Command "<команда>"
```

### Тестування сервісів та Pre-commit хук:
Для забезпечення стабільності та якості коду в репозиторії налаштовано автоматичне тестування та pre-commit хук.

*   **Pre-commit хук**:
    При кожному комміті (`git commit`) автоматично запускається скрипт `scripts/run_service_tests.py`, який виявляє змінені сервіси у папці `services/` та запускає відповідні unit-тести за допомогою `pytest`. Якщо хоча б один тест падає, комміт блокується.
    Якщо зміни не стосуються коду сервісів (наприклад, документація), крок тестування автоматично пропускається.

*   **Команди для локального запуску тестів**:
    *   **Cart Service**:
        ```bash
        cd services/cart_service
        uv run pytest
        ```
    *   **Gateway Service**:
        ```bash
        cd services/gateway
        uv run pytest
        ```
    *   **Product Service**:
        ```bash
        cd services/product_service
        uv run pytest
        ```
    *   **Zephyros Agent**:
        ```bash
        cd services/zephyros_agent
        uv run pytest
        ```
    *   **Auth Service**:
        ```powershell
        cd services/auth_service
        $env:PYTHONPATH="../.."; uv run pytest
        ```
    *   **Reviews Service**:
        ```bash
        cd services/reviews_service
        uv run pytest
        ```
    *   **Audit Service**:
        ```powershell
        cd services/audit_service
        $env:DATABASE_URL="postgresql+asyncpg://test:test@localhost/test"; $env:RABBITMQ_URL="amqp://guest:guest@localhost:5672//"; uv run pytest
        ```
    *   **Email Worker**:
        ```powershell
        cd services/email_worker
        $env:RESEND_API_KEY="dummy-key"; uv run pytest
        ```
    *   **Products ETL (Go)**:
        ```bash
        cd services/products_etl
        go test -v ./...
        ```
    *   **Search Service (Rust)**:
        ```bash
        cd services/search_service
        cargo test
        ```