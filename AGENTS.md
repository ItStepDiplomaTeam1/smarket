# 🛒 Smarket — Карта монорепозиторію для AI-агентів

> **Цей файл призначений для читання AI-кодувальниками (Claude Code, OpenSpec-агенти, Cursor, Copilot тощо).**  
> Він містить вичерпний опис архітектури, взаємозв'язків, специфікацій та конвенцій монорепозиторію Smarket. AI-агент повинен дотримуватися цих правил для забезпечення високої якості коду та запобігання порушення цілісності системи.

---

## 🚦 1. Правило скоупу та обмеження (Scope Rules)

1. **Ізоляція змін**: AI-агент може вносити зміни **виключно** у межах сервісу, над яким його безпосередньо попросили працювати (`services/<name>/`), або у відповідному застосунку (`apps/<name>/`).
2. **Крос-сервісні зміни**: Якщо задача вимагає модифікації спільних контрактів (наприклад, схеми БД, API Gateway проксі, RabbitMQ повідомлень), агент **зобов'язаний зупинитися** та запросити підтвердження у розробника перед внесенням крос-сервісних змін.
3. **DDL та міграції**: Будь-які зміни схем баз даних повинні виконуватися виключно через систему міграцій відповідного сервісу (Alembic для Python, Go DDL скрипти в `products_etl`).

---

## 🗺️ 2. Глобальна архітектура та потоки даних

Smarket — це агрегатор цін на продукти харчування (дані з Zakaz.ua) з мікросервісною архітектурою.

```text
                                Клієнт (React / Vite, apps/react)
                                                │
                                                ▼  :8080 (публічний порт)
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
         │   ┌──────────────────────────┘            │         │            │                        │
         ▼   ▼                                       ▼         ▼            ▼                        ▼
┌─────────────────┐                            ┌─────────────────┐  ┌────────────────┐      ┌─────────────────┐
│   PostgreSQL    │                            │   PostgreSQL    │  │ product_service│      │   Meilisearch   │
│ (shared catalog)│                            │ (private schemas│  │  cart_service  │      │     (:7700)     │
└────────▲────────┘                            └─────────────────┘  └────────────────┘      └─────────────────┘
         │                                               ▲
         │ (Bulk Upsert)                                 │ (Publish Events)
┌────────┴────────┐                                      │
│  products_etl   │ ─── (Consume tasks) ───> RabbitMQ ───┘
│   (Go Parser)   │                          (:5672)
└────────┬────────┘
         │ (Store Raw Pages)
         ▼
 ┌───────────────┐
 │    MongoDB    │
 │  (Datalake)   │
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
*   **Секрети**: `.env` (`CORS_ORIGINS`, `AUTH_SERVICE_URL`, `PRODUCT_SERVICE_URL`, etc.).

### 2. `auth_service` (Авторизація)
*   **Директорія**: `services/auth_service/`
*   **Стек**: Python, FastAPI, SQLAlchemy async, asyncpg, Granian
*   **Порт**: `8001` (внутрішній)
*   **Вхідна точка**: `services/auth_service/main.py`
*   **Роль**: Реєстрація, авторизація, JWT-токени (access + refresh), Google OAuth. Rate limiting через SlowAPI + Redis (префікс `rl:auth`).
*   **БД схема**: Власна ізольована схема в PostgreSQL (таблиця `User`). Міграції: `alembic upgrade head`.

### 3. `product_service` (Каталог продуктів — Read)
*   **Директорія**: `services/product_service/`
*   **Стек**: Python, FastAPI, SQLAlchemy async, Granian
*   **Порт**: `8000` (внутрішній)
*   **Вхідна точка**: `services/product_service/app/main.py`
*   **Роль**: Публічний Read-only каталог товарів, категорій, цін та магазинів.
*   **Специфіка**: Слухає канал `pg_notify` (`LISTEN products_updated` в `listeners/pg_listener.py`) для реактивної інвалідації кешу.
*   **БД схема**: Працює в режимі Read-only зі спільною PostgreSQL-схемою, яку наповнює `products_etl`.

### 4. `cart_service` (Кошик покупця)
*   **Директорія**: `services/cart_service/`
*   **Стек**: Python, FastAPI, SQLAlchemy async, Granian
*   **Порт**: `8002` (внутрішній)
*   **Вхідна точка**: `services/cart_service/app/main.py`
*   **Роль**: Управління кошиками (`carts`, `cart_items`) та розрахунок вартості товарів.
*   **Специфіка**: Публікує події чекауту та замовлень в RabbitMQ для `email_worker`.
*   **БД схема**: Власна ізольована схема в PostgreSQL.

### 5. `reviews_service` (Відгуки на товари)
*   **Директорія**: `services/reviews_service/`
*   **Стек**: Python, FastAPI, SQLAlchemy async, Granian
*   **Порт**: `8004` (внутрішній)
*   **Вхідна точка**: `services/reviews_service/app/main.py`
*   **Роль**: Створення, видалення та агрегація відгуків і рейтингів товарів.
*   **БД схема**: Власна ізольована схема в PostgreSQL.

### 6. `search_service` (Пошуковий проксі)
*   **Директорія**: `services/search_service/`
*   **Стек**: Rust, Axum, Meilisearch SDK
*   **Порт**: `8083` (внутрішній)
*   **Вхідна точка**: `services/search_service/src/main.rs`
*   **Роль**: Тонкий проксі-шар над Meilisearch. Оптимізує та розширює пошукові запити (наприклад, розгортає підкатегорії під мережеві суфікси) та кешує результати.

### 7. `zephyros_agent` (ШІ-асистент "Promin")
*   **Директорія**: `services/zephyros_agent/`
*   **Стек**: Python, FastAPI, pydantic-ai
*   **Порт**: `8005` (внутрішній)
*   **Вхідна точка**: `services/zephyros_agent/app/main.py`
*   **Роль**: Інтерактивний чат-асистент покупця.
*   **Специфіка**: Працює за схемою UI-блоків (`ZephyrosResponse`). Викликає внутрішні інструменти (`search_catalog`, `compare_product_offers`, `get_user_cart`, `add_product_to_cart`). Підтримує ланцюжок відкатості моделей (OpenRouter -> Gemini -> Groq -> Cerebras).

### 8. `products_etl` (Go ETL Воркер)
*   **Директорія**: `services/products_etl/`
*   **Стек**: Go (1.26), pgx/v5, mongo-driver/v2, amqp091-go
*   **Порт**: `8082` (внутрішній)
*   **Вхідна точка**: `services/products_etl/main.go`
*   **Роль**: Періодичний парсинг Zakaz.ua, збереження сирих даних у MongoDB, трансформація, масовий Upsert в Postgres та Meilisearch.

### 9. `email_worker` (Email Воркер)
*   **Директорія**: `services/email_worker/`
*   **Стек**: Python, FastStream, Jinja2
*   **Порт**: `8085` (тільки healthcheck)
*   **Вхідна точка**: `services/email_worker/src/main.py`
*   **Роль**: Consumer черги `email_queue` (RabbitMQ). Відправляє транзакційні листи користувачам.

---

## 🗄️ 4. Бази даних, міграції та кешування

### 🐘 PostgreSQL
Вся реляційна структура живе в єдиному інстансі PostgreSQL (наприклад, NeonDB у проді), але логічно розбита на схеми.
Кожен сервіс на Python має свою папку `migrations/` та файл `alembic.ini`.

**Виконання міграцій вручну:**
```bash
# Для auth_service
cd services/auth_service
alembic upgrade head

# Для product_service
cd services/product_service
alembic upgrade head
```

### 🍃 MongoDB Datalake
*   Колекція `smarket_datalake.raw_pages` містить сирі HTTP-відповіді категорій товарів від Zakaz.ua.
*   Контейнер `ofelia` (cron daemon) щодня о 03:00 очищує документи колекції зі статусом `processed` або `failed` старші за 24 години.

### ⚡ Redis & RabbitMQ
*   **Redis** (порт `6379`) — лімітування запитів, спільний кеш.
*   **RabbitMQ** (порт `5672`) — обмін повідомленнями. Черги: `email_queue`, `etl_queue`.

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
*   **Фільтрація (`filterable`)**: `category_id`, `category_slug`, `store_id`, `retail_chain`, `price`, `in_stock`, `is_hidden`.

При отриманні запиту `GET /api/v1/search/search` Rust-сервіс:
1.  Мапить спрощені слаги категорій фронтенду (наприклад, `drinks`, `zoo`) на `main_category_id`.
2.  Розгортає підкатегорії (наприклад, `molochni-produkty` перетворює на масив `["molochni-produkty", "molochni-produkty-novus", "molochni-produkty-silpo", ...]`).
3.  Формує гнучкий фільтр Meilisearch та повертає структуровану відповідь із масивом активних пропозицій (`offers`) з різних магазинів.

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
*   `table`: Таблиця порівняння цін. Найдешевша пропозиція обов'язково підсвічується (`highlight_row`).
*   `product_card`: Картка рекомендованого товару з ціною та посиланням.
*   `tabs`: Групування результатів по табах (наприклад, по супермаркетах).
*   `clarification`: Уточнюючі запитання з фіксованими варіантами відповіді (2–4 варіанти).
*   `action_button`: Кнопка дії (наприклад, пропозиція додати товар у кошик).
*   `badge`: Кольорова плашка (`savings`, `best_price`, `warning`, `info`).
*   `fallback`: Повідомлення про помилку чи відсутність результатів.
*   `divider`: Візуальний розділювач.

---

## 💻 8. Стандарти розробки Фронтенду (`apps/react`)

*   **Абсолютні імпорти**: Тільки через аліас `@/` (наприклад, `import { useAuth } from '@/store/auth'`). Відносні імпорти (`../../`) суворо заборонені.
*   **Глобальний стан**: Zustand, стори розташовані в `src/store/`.
*   **Фетчінг**: TanStack Query (React Query). Запити винесені у кастомні хуки в `src/hooks/api/`.
*   **Стилізація**: Tailwind CSS. Використовуються виключно утилітарні класи.
*   **Lazy Loading**: Веб-сторінки та великі модальні вікна повинні завантажуватися через `React.lazy()` та обгортатися в `Suspense`.

---

## 🛠️ 9. Корисні команди для розробки та дебагу

### Запуск інфраструктури локально:
```bash
cd infra
docker compose up --build
```

### Створення міграції Alembic (на прикладі auth_service):
```bash
cd services/auth_service
alembic revision --autogenerate -m "опис змін"
alembic upgrade head
```

### Windows/PowerShell обхід політики виконання скриптів (якщо npx або скрипти не запускаються):
```powershell
powershell -ExecutionPolicy Bypass -Command "<команда>"
```