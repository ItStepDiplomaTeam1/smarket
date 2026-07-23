# 🚀 DevOps & Backend — Технічна Документація Специфікації Smarket

> **Дата актуалізації**: Липень 2026 н.е.  
> **Проєкт**: Smarket — Високонавантажений мікросервісний агрегатор продуктів харчування (Zakaz.ua, Novus, Сільпо, Ашан, Екомаркет, Varus тощо)  
> **Хостинг та Сервер**: Hetzner Cloud (`157.180.74.21`) + Cloudflare Pages (`smarket-7go.pages.dev`, `smarket-admin.pages.dev`)  
> **Загальний обсяг коду бекенду**: 10 мікросервісів | 159+ файлів | 20,316+ рядків коду  

---

## 📊 1. Сводний Огляд Метрик та Констант Проєкту (Executive Metrics)

### 📈 Кількісні Метрики Сервісів

| № | Сервіс | Мова / Стек | Порт | Файлів | Рядків коду (LOC) | RAM Ліміт | CPU Ліміт | PIDs Ліміт | ASGI / HTTP Сервер |
|---|---|---|---|---|---|---|---|---|---|
| **1** | `gateway` | Python 3.11 / FastAPI | `8080` (Ext) | 15 | 1,684 | 192 MB | 0.50 | 128 | Granian |
| **2** | `auth_service` | Python 3.11 / FastAPI | `8001` (Int) | 41 | 3,350 | 256 MB | 0.50 | 128 | Granian |
| **3** | `product_service` | Python 3.11 / FastAPI | `8000` (Int) | 16 | 2,359 | 256 MB | 0.50 | 128 | Granian |
| **4** | `cart_service` | Python 3.11 / FastAPI | `8002` (Int) | 23 | 2,141 | 256 MB | 0.50 | 128 | Granian |
| **5** | `reviews_service` | Python 3.11 / FastAPI | `8004` (Int) | 18 | 721 | 256 MB | 0.50 | 128 | Granian |
| **6** | `zephyros_agent` | Python 3.11 / Pydantic-AI | `8005` (Int) | 22 | 4,691 | 256 MB | 0.50 | 128 | Granian |
| **7** | `audit_service` | Python 3.11 / FastStream | `8006` (Int) | 9 | 518 | 256 MB | 0.50 | 128 | Granian |
| **8** | `email_worker` | Python 3.11 / FastStream | `8085` (Int) | 7 | 266 | 160 MB | 0.25 | 96 | FastStream ASGI |
| **9** | `products_etl` | Go 1.26 / pgx v5 | `8082` (Int) | 23 | 3,655 | 384 MB | 0.75 | 128 | Net/HTTP (Custom) |
| **10** | `search_service` | Rust 1.80+ / Axum | `8083` (Int) | 5 | 931 | 128 MB | 0.25 | 64 | Axum (Tokio) |
| **—** | **Всього коду** | **Multi-Stack** | **—** | **159** | **20,316** | **—** | **—** | **—** | **—** |

### 🐘 Інфраструктурні Бази Даних та Посередники Повідомлень

| Сутність | Технологія / Версія | Внутрішній Порт | Пам'ять (RAM Limit) | Обмеження / Налаштування | Роль у системі |
|---|---|---|---|---|---|
| **PostgreSQL** | PostgreSQL 16 Alpine | `5432` | Shared Host | Multi-Schema (Shared, Auth, Cart, Reviews, Audit) | Реляційна База Даних |
| **MongoDB** | MongoDB 7.0 | `27017` | 768 MB | WiredTiger Cache: `0.25 GB` | Data Lake (Сирі JSON сторінки Zakaz) |
| **Meilisearch** | Meilisearch v1.8 | `7700` | 512 MB | Index: `products` | Індексований швидкий пошук |
| **Redis** | Redis 7 Alpine | `6379` | 192 MB | Maxmemory: `128 MB`, LRU eviction (`allkeys-lru`) | Rate limiting, Кеш |
| **RabbitMQ** | RabbitMQ 3 Alpine | `5672` | 384 MB | Async Erlang flags (`+S 1:1 +sbwt none`) | AMQP Broker (ETL, Audit, Email) |
| **Ofelia** | Ofelia Cron Daemon | — | 64 MB | Schedule: `0 3 * * *` (Щодня о 03:00 UTC) | Ротація та очищення MongoDB Datalake |

> [!IMPORTANT]
> **Сумарні інфраструктурні ресурси Docker Compose**:
> - **Максимальний ліміт RAM**: **`4,064 MB`** (~4.06 GB)
> - **Максимальний сумарний ліміт CPU**: **`6.65 vCPUs`**
> - **Кількість одночасно працюючих контейнерів**: **15** (Включаючи 5 одноразових Alembic migration jobs)

---

## 🏗️ 2. Глобальна Архітектура та Потоки Даних (System Topography)

```text
                                  Світ Клієнтів
                     ┌──────────────────┴──────────────────┐
                     │                                     │
                     ▼ https://smarket-7go.pages.dev       ▼ https://smarket-admin.pages.dev
             (React / Vite Web App)               (Admin Dashboard Panel)
                     │                                     │
                     └──────────────────┬──────────────────┘
                                        │ (HTTPS / REST)
                                        ▼ :8080 (Публічний порт)
                     ┌───────────────────────────────────────────┐
                     │              gateway_service              │
                     │ (FastAPI + Granian, CORS & JWT Route Proxy)│
                     └──────┬────────┬────────┬────────┬─────────┘
                            │        │        │        │
        ┌───────────────────┘        │        │        └──────────────────────────┐
        ▼ :8001                      ▼ :8000  ▼ :8002                             ▼ :8083
┌─────────────────┐          ┌───────┴──────┐┌────────┐                         ┌─────────────────┐
│  auth_service   │          │product_service││  cart_ │                         │ search_service  │
│  (Auth & JWT)   │          │ (Read Catalog)││service │                         │  (Rust Axum)    │
└────────┬────────┘          └───────┬──────┘└────┬───┘                         └────────┬────────┘
         │                           │            │                                      │
         │ (Events via RabbitMQ)     │            │                                      │
         ▼                           ▼            ▼                                      ▼
    RabbitMQ (:5672) ───────> [ audit_queue ] ──────────────────────────────────> ┌──────────────────┐
         │                                                                       │  audit_service   │
         │ (Events via email_queue)                                              │ (Логи & Аудит)   │
         ▼                                                                       └──────────────────┘
    [ email_queue ] ────────> ┌──────────────────┐
                              │   email_worker   │
                              │ (FastStream Email)│
                              └──────────────────┘
                                       │
┌──────────────────────────────────────┴────────────────────────────────────────────────────────┐
│                                 База Даних PostgreSQL 16                                       │
│ ┌───────────────────────┬───────────────────────┬──────────────────────┬────────────────────┐ │
│ │   схема shared_cat    │   схема auth_service  │  схема cart_service  │  схема audit_logs  │ │
│ │ (products/stores/etc) │     (User table)      │ (carts, items, etc)  │    (audit_logs)    │ │
│ └───────────────────────┴───────────────────────┴──────────────────────┴────────────────────┘ │
└───────────────────────────▲───────────────────────────────────────────────────────────────────┘
                            │ Bulk Upsert
                    ┌───────┴───────┐ Store Raw Pages  ┌───────────────┐
                    │ products_etl  │ ───────────────> │    MongoDB    │
                    │  (Go 1.26)    │                  │  (Datalake)   │
                    └────────┬──────┘                  └───────────────┘
                             │ Index Sync
                             ▼
                     ┌───────────────┐
                     │  Meilisearch  │
                     │    (:7700)    │
                     └───────────────┘
```

---

## 🧩 3. Глибокий Розбір Мікросервісів Бэкенду (Service Deep-Dive)

### 1. API Gateway (`services/gateway`)
*   **Стек**: Python 3.11, FastAPI, Granian (ASGI), `httpx.AsyncClient`.
*   **Публічний порт**: `8080`.
*   **Вхідна точка**: `services/gateway/app/main.py`.
*   **Особливості оптимізації**:
    *   Використовує два окремих пули з'єднань HTTPX у `lifespan`:
        - `http_client`: `max_keepalive_connections=50`, `max_connections=100`, `timeout=10.0s`.
        - `auth_http_client`: `max_keepalive_connections=10`, `max_connections=20`, `timeout=10.0s`.
    *   **CORS Режими**: Автоматична валідаціяOrigin для `http://157.180.74.21`, `https://smarket-7go.pages.dev`, `https://smarket-admin.pages.dev` та локальних розробницьких портів (`3000`, `5173`, `5174`).
*   **Таблиця Роутингу Gateway**:

| Префікс Gateway | Цільовий Сервіс | Цільовий Порт | Опис / Захист                           |
|---|---|---|-----------------------------------------|
| `/api/v1/auth` | `auth_service` | `8001` | Авторизація, реєстрація, токени         |
| `/api/v1/products` | `product_service` | `8000` | Публічний каталог товарів               |
| `/api/v1/stores` | `product_service` | `8000` | Список супермаркетів та адрес           |
| `/api/v1/cart` | `cart_service` | `8002` | Операції з кошиком користувача          |
| `/api/v1/favorites` | `cart_service` | `8002` | Збережені улюблені товари               |
| `/api/v1/reviews` | `reviews_service` | `8004` | Відгуки та рейтинги товарів             |
| `/api/v1/search` | `search_service` | `8083` | Швидкий Meilisearch проксі-пошук        |
| `/api/v1/agent` | `zephyros_agent` | `8005` | Чат-асистент ШІ "Zephyros"              |
| `/api/v1/admin` | `auth_service` / `audit_service` | `8001`/`8006` | Адміністративні дії (Require Admin JWT) |

---

### 2. Auth Service (`services/auth_service`)
*   **Стек**: Python 3.11, FastAPI, Granian, SQLAlchemy 2.0 (asyncpg), SlowAPI, Redis.
*   **Порт**: `8001` (внутрішній).
*   **БД Модель**: `User` у власній PostgreSQL схемі:
    *   `id`: UUID (Primary Key).
    *   `email`: String(255), UNIQUE, NOT NULL.
    *   `hashed_password`: String(255) (Bcrypt).
    *   `role`: String(255) (default `"user"`, adm `"admin"`).
    *   `is_active`: Boolean (default `True`).
    *   `telegram_id`: BigInteger, UNIQUE, INDEX.
    *   `settings`: JSONB (default `{}`).
    *   `created_at`, `updated_at`: TIMESTAMPTZ.
*   **Rate Limiting Policy (SlowAPI + Redis `rl:auth`)**:
    *   Реєстрація: **3 запити / хвилину**, **10 запитів / годину**.
    *   Вхід (Login): **5 запитів / хвилину**, **20 запитів / годину**.
*   **Механізм токенів**:
    *   `access_token`: JWT з терміном дії 15 хвилин.
    *   `refresh_token`: Зберігається в `HttpOnly`, `Secure`, `SameSite=None` кукі (TTL 7 днів).

---

### 3. Product Catalog Service (`services/product_service`)
*   **Стек**: Python 3.11, FastAPI, Granian, SQLAlchemy 2.0 (asyncpg).
*   **Порт**: `8000` (внутрішній).
*   **Режим роботи**: **READ-ONLY**. Сервіс не робить жодних INSERT/UPDATE/DELETE дій над каталогом (все робить `products_etl`).
*   **Реактивність (PG LISTEN/NOTIFY)**:
    *   Внутрішній фоновий воркер `listeners/pg_listener.py` слухає PostgreSQL канал `products_updated`.
    *   При отриманні сповіщення інвалідується локальний іній-кеш категорій та магазинів.
*   **Метрики Адмінпанелі**: Надає приватний ендпоінт `/api/v1/internal/dashboard-stats` для збору кількості активних товарів, цін, категорій та статусу парсингу.

---

### 4. Cart & Receipt Service (`services/cart_service`)
*   **Стек**: Python 3.11, FastAPI, Granian, SQLAlchemy 2.0 (asyncpg).
*   **Порт**: `8002` (внутрішній).
*   **Таблиці в PostgreSQL**:
    *   `carts`: `id` (UUID), `user_id` (UUID), `name` (String), `updated_at`.
    *   `cart_items`: `id` (UUID), `cart_id` (FK), `product_id` (BigInteger), `quantity` (BigInteger).
    *   `favorites`: `id` (UUID), `user_id` (UUID), `product_id`, `product_title`, `product_image_url`, `product_price`.
    *   `receipts`: `id` (UUID), `user_id` (UUID), `total_price` (Numeric 10,2), `savings_amount` (Numeric 10,2), `share_token` (VARCHAR(32), UNIQUE), `ai_description` (Text), `snapshot` (JSONB).
*   **Асинхронні події**: При оформленні або збереженні публічного чека надсилає `EmailEvent` у RabbitMQ чергу `email_queue`.

---

### 5. Search Proxy Service (`services/search_service`)
*   **Стек**: **Rust 1.80+**, Axum framework, Meilisearch SDK, Tokio async runtime.
*   **Порт**: `8083` (внутрішній).
*   **Причина вибору Rust**: Низькі затримки (<2ms), мінімальне споживання пам'яті (всього 128 MB RAM limit).
*   **Алгоритм Розгортання Категорій (Category Expansion)**:
    *   Приймає універсальний слаг (наприклад `drinks` або `zoo`).
    *   Мапить його на `main_category_id` (1–10).
    *   Автоматично розгортає в масив підкатегорій ритейлерів (`["molochni-produkty-novus", "molochni-produkty-silpo", ...]`).
*   **Конфігурація Meilisearch Індексу `products`**:
    *   `searchable`: `title`, `brand`, `category_name`, `canonical_ean`.
    *   `filterable`: `category_id`, `category_slug`, `store_id`, `retail_chain`, `price`, `in_stock`, `is_hidden`, `main_category_id`, `old_price`, `discount_percent`.
    *   `sortable`: `price`, `title`, `discount_percent`.

---

### 6. AI Buyer Assistant "Zephyros" (`services/zephyros_agent`)
*   **Стек**: Python 3.11, FastAPI, Pydantic-AI, Granian.
*   **Порт**: `8005` (внутрішній).
*   **Оркестрація ШІ (Multi-LLM Fallback & Circuit Breaker)**:
    - Послідовність переключення моделей при збоях / rate limits:
      1. **Groq** (`llama-3.3-70b-versatile`)
      2. **Google Gemini** (`gemini-2.5-flash`)
      3. **OpenRouter** (`anthropic/claude-3.5-haiku` / `deepseek-r1`)
      4. **Cerebras** (`llama-3.1-70b`)
*   **Інструменти ШІ-агента (8 Tool-функцій)**:
    1. `search_and_compare_offers`: Пошук та порівняння цін між магазинами.
    2. `get_user_cart`: Читання кошика користувача.
    3. `add_product_to_cart`: Додавання товару в кошик (вимагає підтвердження користувача у UI).
    4. `clear_user_cart`: Очищення кошика.
    5. `remove_item_from_cart`: Видалення товару.
    6. `compare_cart_stores`: Порівняльний розрахунок кошика в 5 супермаркетах.
    7. `get_product_reviews`: Отримання відгуків.
    8. `create_product_review`: Створення відгуку.
*   **Формат Відповіді**: Повертає `ZephyrosResponse` з керованими UI-блоками (карточки товарів, порівняльні таблиці, інтерактивні кнопки дій).

---

### 7. Products ETL Worker (`services/products_etl`)
*   **Стек**: **Go 1.26**, `pgx/v5` (PostgreSQL), `mongo-driver/v2`, `amqp091-go` (RabbitMQ).
*   **Порт**: `8082` (внутрішній).
*   **3 Паралельні Горутини Пайплайну**:
    ```text
    ┌────────────────────────┐
    │     1. Scheduler       │  (Кожні 2 години шукає активні магазини без оновлень >2 год)
    └───────────┬────────────┘
                │ Pushes ETLTask
                ▼
    ┌────────────────────────┐
    │ 2. ExtractLoadWorker   │  (Слухає etl_queue, скачує Zakaz API по 100 товарів/стор)
    └───────────┬────────────┘
                │ Stores raw JSON (status: 'pending')
                ▼
    ┌────────────────────────┐
    │    MongoDB Datalake    │  (smarket_datalake.raw_pages)
    └───────────┬────────────┘
                │ Polls 'pending' documents
                ▼
    ┌────────────────────────┐
    │ 3. TransformLoadWorker │  (Очищає HTML, перевіряє EAN-13, конвертує копійки в UAH)
    └───────────┬────────────┘
                ├──► Bulk UPSERT → PostgreSQL (stores, categories, products, prices)
                ├──► Index Sync  → Meilisearch (search_service)
                └──► NOTIFY      → PostgreSQL LISTEN/NOTIFY ('products_updated')
    ```
*   **Трансформації даних**:
    *   **Конверсія цін**: Ціна Zakaz.ua в копійках ділиться на `100.0` (`price / 100.0` грн).
    *   **Штрихкоди**: Валідація за алгоритмом EAN-13 Checksum.
    *   **Мапінг категорій**: `ResolveMainCategoryID` конвертує специфічні слаги у 10 глобальних категорій.

---

### 8. Email Worker (`services/email_worker`)
*   **Стек**: Python 3.11, FastStream, RabbitMQ, Jinja2, Resend API.
*   **Порт**: `8085` (healthcheck).
*   **Логіка обробки**:
    *   Слухає чергу `email_queue`.
    *   При виникненні помилки (некоректний email, failure API) повертає `RejectMessage` і переміщає лист у DLQ `email_dead_letter_queue`.

---

### 9. Audit Log Service (`services/audit_service`)
*   **Стек**: Python 3.11, FastAPI, FastStream, Granian, SQLAlchemy 2.0.
*   **Порт**: `8006` (внутрішній).
*   **Логіка**:
    *   Підписаний на RabbitMQ topic exchange `smarket_events` через чергу `audit_queue`.
    *   Записує всі події безпеки, входу, змін товарів та адмін-дій у таблицю `audit_logs`.
    *   Надає адміністраторам API з пагінацією, фільтрацією за `severity`, `event_type` та датами.

---

## 🗄️ 4. Детальна Схема Бази Даних PostgreSQL (Database Schema Specs)

```text
  ┌──────────────────────────┐             ┌──────────────────────────┐
  │          stores          │             │        categories        │
  ├──────────────────────────┤             ├──────────────────────────┤
  │ PK external_id TEXT      │             │ PK id SERIAL             │
  │    name TEXT             │             │    slug TEXT UNIQUE      │
  │    retail_chain TEXT     │             │    name TEXT             │
  │    city TEXT             │             │    main_category_id INT  │
  │    is_active BOOL        │             └────────────┬─────────────┘
  │    synced_at TIMESTAMPTZ │                          │
  │    last_parsed_at TIME   │                          │
  └────────────┬─────────────┘                          │
               │                                        │
               │ 1:N                                    │ 1:N
               ▼                                        ▼
  ┌──────────────────────────┐             ┌──────────────────────────┐
  │      store_products      │             │         products         │
  ├──────────────────────────┤             ├──────────────────────────┤
  │ PK product_id BIGINT     │◄────────────┤ PK id BIGINT             │
  │ PK store_id TEXT         │             │    canonical_ean TEXT UNQ│
  │    first_seen_at TIME    │             │    title TEXT            │
  └──────────────────────────┘             │    brand TEXT            │
               ▲                           │ FK canonical_cat_id INT  │
               │                           └────────────┬─────────────┘
               │ 1:N                                    │
               │                                        │ 1:N
  ┌────────────┴─────────────┐                          │
  │          prices          │                          │
  ├──────────────────────────┤                          │
  │ PK id BIGSERIAL          │                          │
  │ FK product_id BIGINT     │◄─────────────────────────┘
  │ FK store_id TEXT         │
  │    price NUMERIC(10,2)   │
  │    old_price NUMERIC     │
  │    in_stock BOOL         │
  │    recorded_at TIME IDX  │
  └──────────────────────────┘
```

---

## 🐳 5. DevOps Інфраструктура та Специфікація Контейнерів (Docker Infra)

### Налаштування Безпеки та Ресурсів у `infra/docker-compose.yml`

всі сервіси мають строго обмежені ліміти ресурсів для запобігання OOM (Out Of Memory) на сервері Hetzner:

```yaml
x-api-defaults: &api-defaults
  init: true
  restart: unless-stopped
  stop_grace_period: 30s
  networks:
    - smarket-network
  logging:
    driver: json-file
    options:
      max-size: "10m"
      max-file: "2"
  mem_limit: 256m
  cpus: 0.50
  pids_limit: 128

x-healthcheck-defaults: &healthcheck-defaults
  interval: "15s"
  timeout: "5s"
  retries: 10
  start_period: "30s"
```

### Автоматичне очищення MongoDB (Ofelia Cron Daemon)

Для запобігання переповненню диска сирими сторінками Zakaz API, контейнер `mongodb` містить мітку для `ofelia`:
```yaml
labels:
  ofelia.enabled: "true"
  ofelia.job-exec.mongo-cleanup.schedule: "0 3 * * *"
  ofelia.job-exec.mongo-cleanup.command: >-
    mongosh "mongodb://$$MONGO_INITDB_ROOT_USERNAME:$$MONGO_INITDB_ROOT_PASSWORD@127.0.0.1:27017/?authSource=admin"
    --quiet
    --eval "db.getSiblingDB('smarket_datalake').raw_pages.deleteMany({status:{$in:['processed','failed']},fetched_at:{$lt:new Date(Date.now()-86400000)}})"
```

---

## 🔄 6. CI/CD Пайплайн автоматизації (GitHub Actions Workflow)

Файл `.github/workflows/ci.yml` реалізує 6-етапну конвеєрну збірку на **Self-Hosted Runner**:

```text
[ STAGE 1: Detect ] ──► Динамічний аналіз змінених файлів через jq та git diff
        │
        ├─► [ STAGE 2: Security ] ──► Gitleaks (пошук секретів) + Trivy (скан вразливостей)
        │
        ├─► [ STAGE 3: Lint & Test ] ─┬─► Python Quality (Ruff + mypy) & Pytest
        │                             ├─► Go ETL (go vet + go test -race)
        │                             ├─► Rust Search (cargo clippy + cargo test)
        │                             └─► React Frontend (npm type-check + npm test)
        │
        ├─► [ STAGE 4: Docker Build ] ──► Buildx з кешуванням шарів (/var/tmp/buildx-cache) → Push GHCR
        │
        ├─► [ STAGE 5: Hetzner Deploy] ─► Doppler CLI Sync → .env → docker compose up -d --wait (Zero Downtime)
        │
        └─► [ STAGE 6: CI Status ] ──► Фінальний агрегований чек якості
```

### Синхронізація Секретів (Doppler Secrets Management)
Під час розгортання Doppler CLI автоматично витягує секрети для всіх 10 сервісів з проєкту `smarket-services-secrets`:
*   `dev_gateway` → `services/gateway/.env`
*   `dev_auth_service` → `services/auth_service/.env`
*   `dev_product_service` → `services/product_service/.env`
*   `dev_cart_service` → `services/cart_service/.env`
*   `dev_email_worker` → `services/email_worker/.env`
*   `dev_reviews_service` → `services/reviews_service/.env`
*   `dev_products_etl` → `services/products_etl/.env`
*   `dev_search_service` → `services/search_service/.env` & `infra/.env`
*   `dev_zephyros_agent` → `services/zephyros_agent/.env`
*   `dev_audit_service` → `services/audit_service/.env`

---

## 🛠️ 7. Інструкція з Локального Та Продакшн Запуску

### Запуск у Продакшені (Hetzner Server)
```bash
# 1. Перевірка конфігурації
docker compose -f infra/docker-compose.yml config

# 2. Завантаження оновлених образів з GHCR
docker compose -f infra/docker-compose.yml pull

# 3. Запуск усіх 15 контейнерів у фоновому режимі з очікуванням healthcheck
docker compose -f infra/docker-compose.yml up -d --remove-orphans --wait --wait-timeout 360
```

### Ручний Запуск Alembic Міграцій
```bash
# Auth Service
cd services/auth_service && alembic upgrade head

# Product Service
cd services/product_service && alembic upgrade head

# Cart Service
cd services/cart_service && alembic upgrade head

# Reviews Service
cd services/reviews_service && alembic upgrade head

# Audit Service
cd services/audit_service && alembic upgrade head
```

---

> [!NOTE]
> Цей документ є офіційною технічною специфікацією бекенду та DevOps інфраструктури проєкту **Smarket**. При внесенні системних змін у конфігурацію Docker Compose, схем баз даних або CI/CD пайплайн, обов'язково оновлюйте відповідні розділи цієї специфікації.
