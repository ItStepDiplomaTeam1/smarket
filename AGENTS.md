# 🛒 Smarket — Карта монорепозиторію та Специфікація для AI-Агентів

> **Цей файл є головною інструкцією та технічною картою для AI-кодувальників (Gemini, Claude Code, Cursor, OpenSpec-агенти, Copilot тощо).**  
> Він містить вичерпний опис архітектури, взаємозв'язків, специфікацій, конвенцій коду, схем баз даних та метрик монорепозиторію Smarket. AI-агент зобов'язаний дотримуватися цих правил для забезпечення високої якості коду та запобігання порушенню цілісності системи.

---

## 📊 1. Сводний Огляд Метрик та Масштабу Проєкту

* **Загальний обсяг чистого коду (Backend + Frontend + Tests + CI)**: **`70,593` рядків коду** (у 159+ вихідних файлах)
* **Чистий бекенд-код (10 мікросервісів + тестування)**: **`20,500` рядків коду** (`~17,147` джерельний код + `~3,353` тести)
* **Фронтенд-код (`apps/react` + `apps/admin`)**: **`49,126` рядків коду** (React, TypeScript, Tailwind CSS)
* **Продакшн Хостинг & Сервери**:
  * **Бекенд та Інфраструктура**: Hetzner Cloud (`157.180.74.21`), Docker Compose (15 контейнерів)
  * **Фронтенд**: Cloudflare Pages (`https://smarket-7go.pages.dev`, `https://smarket-admin.pages.dev`)
* **Сумарний ресурсний ліміт контейнерів (Docker Compose)**:
  * **Максимальний RAM-ліміт**: **`4,064 MB`** (~4.06 GB)
  * **Максимальний CPU-ліміт**: **`6.65 vCPUs`**

### 📈 Кількісна Таблиця Мікросервісів

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
| **9** | `products_etl` | Go 1.26 / pgx v5 | `8082` (Int) | 23 | 3,655 | 384 MB | 0.75 | 128 | Custom Net/HTTP |
| **10** | `search_service` | Rust 1.80+ / Axum | `8083` (Int) | 5 | 931 | 128 MB | 0.25 | 64 | Axum (Tokio) |

---

## 🚦 2. Правила Скоупу та Обмеження для AI-Агентів (Scope Rules)

1. **Ізоляція змін**: AI-агент має право вносити зміни **виключно** у межах сервісу, над яким його безпосередньо попросили працювати (`services/<name>/`), або у відповідному застосунку (`apps/<name>/`).
2. **Крос-сервісні зміни**: Якщо задача вимагає модифікації спільних контрактів (схеми БД, API Gateway проксі, RabbitMQ повідомлення), агент **зобов'язаний зупинитися** та узгодити крос-сервісні зміни з розробником.
3. **DDL та міграції**: Зміни схем баз даних виконуються виключно через систему міграцій (Alembic для Python-сервісів, Go DDL скрипти у `products_etl`). Ніколи не викликайте `Base.metadata.create_all()`.
4. **Секрети**: Категорично заборонено хардкодити паролі, токени, API-ключі. Використовуйте `.env` або Doppler CLI.
5. **Лінтери та форматування**: Python-сервіси повинні відповідати конвенціям `ruff` та `mypy`. Go-сервіси мають форматуватися через `gofmt`. Rust-сервіси повинні проходити `cargo clippy`.
6. **Обов'язкова перевірка**: Після внесення будь-яких змін у код, AI-агент зобов'язаний запустити відповідні unit/integration тести сервісу!

---

## 🗺️ 3. Глобальна Архітектура та Потоки Даних

Smarket — це високонавантажений агрегатор цін на продукти харчування (данні з Zakaz.ua: Novus, Сільпо, Ашан, Екомаркет, Varus тощо) з мікросервісною архітектурою.

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

## 📂 4. Каталог Сервісів та Застосунків

### 1. `gateway` (API Gateway)
*   **Директорія**: `services/gateway/`
*   **Стек**: Python 3.11, FastAPI, Granian (ASGI), `httpx.AsyncClient`
*   **Порт**: `8080` (зовнішній)
*   **Вхідна точка**: `services/gateway/app/main.py`
*   **Роль**: Єдина точка входу. Маршрутизує запити, валідує CORS Origin, додає заголовки `X-User-Id` та `X-User-Role`.
*   **Пул з'єднань**:
    *   `http_client`: `max_keepalive_connections=50`, `max_connections=100`, `timeout=10.0s`.
    *   `auth_http_client`: `max_keepalive_connections=10`, `max_connections=20`, `timeout=10.0s`.
*   **Маршрути проксіювання**:

| Префікс Gateway | Цільовий Сервіс | Порт | Захист / Особливості |
|---|---|---|---|
| `/api/v1/auth` | `auth_service` | `8001` | Авторизація, реєстрація, токени |
| `/api/v1/products` | `product_service` | `8000` | Публічний каталог товарів |
| `/api/v1/stores` | `product_service` | `8000` | Список супермаркетів та адрес |
| `/api/v1/cart` | `cart_service` | `8002` | Операції з кошиком користувача |
| `/api/v1/favorites` | `cart_service` | `8002` | Улюблені товари (проксіює на `/favorites/*`) |
| `/api/v1/reviews` | `reviews_service` | `8004` | Відгуки та рейтинги товарів |
| `/api/v1/search` | `search_service` | `8083` | Пошук через Meilisearch |
| `/api/v1/agent` | `zephyros_agent` | `8005` | Чат-асистент ШІ "Promin" |
| `/api/v1/admin` | `auth_service` / `audit_service` | `8001`/`8006` | Захищено Admin JWT |

---

### 2. `auth_service` (Сервіс Авторизації)
*   **Директорія**: `services/auth_service/`
*   **Стек**: Python 3.11, FastAPI, SQLAlchemy async (asyncpg), SlowAPI, Redis, Granian
*   **Порт**: `8001` (внутрішній)
*   **Вхідна точка**: `services/auth_service/main.py`
*   **Роль**: Реєстрація, авторизація, JWT-токени (access 15хв + refresh 7д у HttpOnly cookie), Google OAuth, Telegram Login.
*   **Rate Limiting Policy (SlowAPI + Redis `rl:auth`)**:
    *   Реєстрація (`/register`): **3/хв**, **10/год**
    *   Авторизація (`/login`): **5/хв**, **20/год**
*   **БД Модель**: `User` у схематичній таблиці `User`: `id` (UUID PK), `email` (unique), `hashed_password`, `role`, `is_active`, `telegram_id` (unique index), `settings` (JSONB), `created_at`, `updated_at`.

---

### 3. `product_service` (Каталог Продуктів — Read Only)
*   **Директорія**: `services/product_service/`
*   **Стек**: Python 3.11, FastAPI, SQLAlchemy async, Granian
*   **Порт**: `8000` (внутрішній)
*   **Вхідна точка**: `services/product_service/app/main.py`
*   **Роль**: Публічний **READ-ONLY** каталог товарів, категорій, цін та магазинів.
*   **Реактивність**: Фоновий воркер `listeners/pg_listener.py` слухає PostgreSQL LISTEN/NOTIFY канал `products_updated` для реактивної інвалідації кешу категорій та магазинів.
*   **Адмін-метрики**: Надає ендпоінт `/api/v1/internal/dashboard-stats` для збору загальної кількості активних товарів, категорій та цін.

---

### 4. `cart_service` (Кошик, Улюблені та Чеки)
*   **Директорія**: `services/cart_service/`
*   **Стек**: Python 3.11, FastAPI, SQLAlchemy async, Granian
*   **Порт**: `8002` (внутрішній)
*   **Вхідна точка**: `services/cart_service/app/main.py`
*   **Роль**: Кошики (`carts`, `cart_items`), збережені товари (`favorites`), публічні чеки користувачів (`receipts` із токеном `share_token`, snapshot ціни у JSONB та асистентським описом `ai_description`).
*   **Події**: Публікує `EmailEvent` у RabbitMQ чергу `email_queue`.

---

### 5. `reviews_service` (Відгуки та Рейтинги)
*   **Директорія**: `services/reviews_service/`
*   **Стек**: Python 3.11, FastAPI, SQLAlchemy async, Granian
*   **Порт**: `8004` (внутрішній)
*   **Вхідна точка**: `services/reviews_service/app/main.py`
*   **БД схема**: Таблиця `reviews` (`id` UUID, `product_id` BigInteger, `user_id` UUID, `user_name`, `rating`, `text`, `created_at`).

---

### 6. `search_service` (Пошуковий Проксі на Rust)
*   **Директорія**: `services/search_service/`
*   **Стек**: **Rust 1.80+**, Axum framework, Meilisearch SDK, Tokio
*   **Порт**: `8083` (внутрішній)
*   **Вхідна точка**: `services/search_service/src/main.rs`
*   **Роль**: Тонкий, надшвидкий проксі над Meilisearch (<2ms затримка, 128 MB RAM).
*   **Внутрішня синхронізація індексу**: Захищений `X-Internal-Token` маршрут `DELETE /api/v1/index` очищає всі документи перед повним ETL backfill, щоб видалені або перенумеровані PostgreSQL товари не залишались у пошуку.
*   **Розгортання Категорій (Category Expansion)**: Мапить спрощені слаги (`drinks`, `zoo`) на `main_category_id` (1–10) та розгортає їх у мережеві підкатегорії (`["molochni-produkty-novus", "molochni-produkty-silpo", ...]`).

---

### 7. `zephyros_agent` (ШІ-Асистент "Promin")
*   **Директорія**: `services/zephyros_agent/`
*   **Стек**: Python 3.11, FastAPI, Pydantic-AI, Granian
*   **Порт**: `8005` (внутрішній)
*   **Вхідна точка**: `services/zephyros_agent/app/main.py`
*   **Multi-LLM Fallback & Circuit Breaker**:
    1. **Groq** (`llama-3.3-70b-versatile`)
    2. **Google Gemini** (`gemini-2.5-flash`)
    3. **OpenRouter** (`anthropic/claude-3.5-haiku` / `deepseek-r1`)
    4. **Cerebras** (`llama-3.1-70b`)
*   **Інструменти (8 Tools)**: `search_and_compare_offers`, `get_user_cart`, `add_product_to_cart`, `clear_user_cart`, `remove_item_from_cart`, `compare_cart_stores`, `get_product_reviews`, `create_product_review`.

---

### 8. `products_etl` (Go ETL Воркер)
*   **Директорія**: `services/products_etl/`
*   **Стек**: **Go 1.26**, `pgx/v5`, `mongo-driver/v2`, `amqp091-go`
*   **Порт**: `8082` (внутрішній)
*   **Вхідна точка**: `services/products_etl/main.go`
*   **Пайплайн (3 Горутини)**:
    1. **Scheduler**: Кожні 2 години шукає застарілі магазини та генерує `ETLTask` у `etl_queue`.
    2. **ExtractLoadWorker**: Слухає `etl_queue`, стягує Zakaz API (по 100 товарів), зберігає сирі JSON у MongoDB (`smarket_datalake.raw_pages`).
    3. **TransformLoadWorker**: Валідує EAN-13, конвертує копійки в гривні (`price / 100.0`), мапить на 10 глобальних категорій, робить масовий `UPSERT` у Postgres, надсилає оновлення в Meilisearch та викликає `NOTIFY products_updated`.

---

### 9. `email_worker` (Email Воркер)
*   **Директорія**: `services/email_worker/`
*   **Стек**: Python 3.11, FastStream, RabbitMQ, Jinja2, Resend API
*   **Порт**: `8085` (healthcheck)
*   **Роль**: Consumer черги `email_queue`. При помилках відправляє повідомлення у DLQ `email_dead_letter_queue`.

---

### 10. `audit_service` (Сервіс Логів Аудіювання)
*   **Директорія**: `services/audit_service/`
*   **Стек**: Python 3.11, FastAPI, FastStream, Granian
*   **Порт**: `8006` (внутрішній)
*   **Роль**: Слухає RabbitMQ topic `smarket_events` (`audit_queue`), зберігає симетричні логи дій системних користувачів та адмінів у схему `audit_logs`.

---

### 11. `apps/react` (Магазин Покупця)
*   **Директорія**: `apps/react/frontend/my-react-app/`
*   **Стек**: React, Vite, TypeScript, Tailwind CSS v4, Zustand, TanStack Query
*   **Деплой**: Cloudflare Pages (`https://smarket-7go.pages.dev`)

### 12. `apps/admin` (Панель Адміністратора)
*   **Директорія**: `apps/admin/`
*   **Стек**: React, Vite, TypeScript, Tailwind CSS v3, Recharts, Zustand
*   **Деплой**: Cloudflare Pages (`https://smarket-admin.pages.dev`)

---

## 🗄️ 5. Схема Бази Даних PostgreSQL та Кешування

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

### Команди виконання Alembic міграцій:
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

## 🤖 6. Специфікація Відповідей ШІ-Агента Zephyros (`ZephyrosResponse`)

AI-агент Zephyros зобов'язаний повертати відповіді виключно у форматі JSON з керованими UI-блоками:

```json
{
  "blocks": [
    { "type": "text", "content": "Ось порівняння цін на молоко:" },
    {
      "type": "table",
      "title": "Порівняння пропозицій",
      "columns": ["Назва", "Магазин", "Ціна", "Наявність"],
      "rows": [["Молоко Селянське 900г", "Novus", "41.50 UAH", "true"]],
      "highlight_row": 0
    },
    {
      "type": "action_button",
      "label": "Додати в кошик",
      "action": "add_to_cart",
      "payload": { "product_id": 1042, "quantity": 1, "store_id": "48215610" }
    }
  ]
}
```

---

## 🛠️ 7. Конвенції Розробки та Корисні Команди

### Фронтенд стандарти:
1. **Імпорти**: Використовувати виключно абсолютні імпорти через аліас `@/` (наприклад `import { Button } from '@/components/ui/Button'`).
2. **Стейт**: Zustand для глобального стану (папка `src/store/`).
3. **Запити**: TanStack Query (React Query) у хуках `src/hooks/api/`.

### Команди запуска тестів для перевірки коду:

```bash
# Запуск автоматичного тест-драйвера всіх сервісів
python scripts/run_service_tests.py

# Окремі unit-тести для Python сервісів:
cd services/auth_service && uv run pytest
cd services/product_service && uv run pytest
cd services/cart_service && uv run pytest
cd services/gateway && uv run pytest
cd services/zephyros_agent && uv run pytest
cd services/reviews_service && uv run pytest

# Go ETL тести:
cd services/products_etl && go test -v ./...

# Rust Search Service тести:
cd services/search_service && cargo test
```

---

> [!IMPORTANT]
> **Пам'ятайте**: Цей документ є головним джерелом правди для розробників та AI-агентів. При оновленні роутів, додаванні сервісів або зміні схем БД обов'язково актуалізуйте цей файл.
