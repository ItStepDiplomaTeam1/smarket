# Бекенд — технічна документація

> Проект: **smarket** — агрегатор цін для порівняння товарів у різних ритейлерів.
> Архітектура: мікросервіси (Python, FastAPI, Granian, PostgreSQL, Redis).

---

## Зміст

1. [Структура монорепозиторію](#структура-монорепозиторію)
2. [Загальна архітектура](#загальна-архітектура)
3. [Сервіс авторизації — `auth_service`](#сервіс-авторизації--auth_service)
4. [Сервіс бізнес-логіки — `business_logic_service`](#сервіс-бізнес-логіки--business_logic_service)
5. [Міграції та наповнення бази даних](#міграції-та-наповнення-бази-даних)
6. [Схема бази даних](#схема-бази-даних)
7. [Інфраструктура — Docker Compose](#інфраструктура--docker-compose)
8. [Змінні оточення](#змінні-оточення)
9. [Запуск локально](#запуск-локально)

---

## Структура монорепозиторію

```
smarket/
├── apps/
│   └── react/frontend/my-react-app/   # React + Vite фронтенд
├── docs/                               # Технічна документація (ця папка)
├── infra/
│   └── docker-compose.yml             # Оркестрація всіх сервісів
├── services/
│   ├── auth_service/                  # Мікросервіс авторизації (порт 8001)
│   └── api/                           # Сервіс бізнес-логіки (порт 8000)
│       ├── database/
│       │   └── services/
│       │       └── models.py          # SQLAlchemy моделі (всі таблиці)
│       ├── migrations/                # Alembic міграції
│       ├── seed_data.py               # Скрипт початкового наповнення БД
│       ├── main.py                    # FastAPI застосунок
│       ├── alembic.ini
│       ├── pyproject.toml
│       └── Dockerfile
└── .dockerignore
```

---

## Загальна архітектура

```
                        ┌─────────────────────────────────┐
                        │         Docker Compose          │
                        │                                 │
  ┌──────────┐          │  ┌─────────────────────────┐   │
  │          │  :8001   │  │     auth_service        │   │
  │  Client  │◄────────►│  │  FastAPI + Granian      │   │
  │ (React / │          │  │  JWT, bcrypt, SlowAPI   │   │
  │  Postman)│  :8000   │  └────────────┬────────────┘   │
  │          │◄────────►│               │                 │
  └──────────┘          │  ┌────────────▼────────────┐   │
                        │  │  business_logic_service  │   │
                        │  │  FastAPI + Granian       │   │
                        │  │  Products, Categories    │   │
                        │  └────────────┬────────────┘   │
                        │               │                 │
                        │  ┌────────────▼────────────┐   │
                        │  │       migration_job      │   │
                        │  │  alembic upgrade head    │   │
                        │  │  + seed_data.py (1 раз) │   │
                        │  └────────────┬────────────┘   │
                        │               │                 │
                        │  ┌────────────▼────────────┐   │
                        │  │           db             │   │
                        │  │   PostgreSQL 16-alpine   │   │
                        │  └─────────────────────────┘   │
                        └─────────────────────────────────┘
```

**Порядок запуску контейнерів:**

1. `db` — PostgreSQL стає `healthy` (healthcheck через `pg_isready`)
2. `auth_service` та `migration_job` запускаються паралельно після `db:healthy`
3. `business_logic_service` запускається тільки після `migration_job` завершився з кодом `0`

---

## Сервіс авторизації — `auth_service`

### Розташування

```
services/auth_service/
```

### Технологічний стек

| Компонент      | Бібліотека / версія       |
|----------------|---------------------------|
| Вебфреймворк   | FastAPI ≥ 0.136           |
| Вебсервер      | Granian ≥ 2.7 (ASGI)      |
| ORM            | SQLAlchemy ≥ 2.0 (async)  |
| Драйвер БД     | asyncpg ≥ 0.31            |
| JWT            | PyJWT ≥ 2.12              |
| Хешування      | bcrypt ≥ 5.0              |
| Rate limiting  | SlowAPI ≥ 0.1.9 + Redis   |
| Серіалізація   | orjson ≥ 3.10             |
| Логування      | loguru ≥ 0.7              |
| Валідація      | pydantic[email] ≥ 2.13    |

### Запуск

```bash
CMD ["python", "-m", "services.auth_service.main"]
```

Granian стартує з параметрами з `.env`: `APP_HOST`, `APP_PORT` (8001), `APP_WORKERS`.

### Lifecycle

При старті (`lifespan`) — попереднє прогрівання пулу з'єднань до PostgreSQL.  
При зупинці — коректне звільнення пулу (`engine.dispose()`).

### Модель бази даних

Сервіс має **власну модель** `User` (не залежить від `services/api`):

| Колонка           | Тип                      | Опис                          |
|-------------------|--------------------------|-------------------------------|
| `id`              | UUID (PK)                | Унікальний ідентифікатор      |
| `email`           | VARCHAR(255), UNIQUE      | Електронна пошта              |
| `hashed_password` | VARCHAR(255)             | Хеш паролю (bcrypt)           |
| `role`            | VARCHAR(255)             | Роль: `user` (за замовчуванням) |
| `is_active`       | BOOLEAN                  | Чи активний акаунт            |
| `created_at`      | TIMESTAMP WITH TIME ZONE | Дата реєстрації               |
| `updated_at`      | TIMESTAMP WITH TIME ZONE | Дата останнього оновлення     |

### Пул з'єднань

```python
pool_size=10,
max_overflow=20,
pool_pre_ping=True,
pool_timeout=30,
autoflush=False,
```

### JWT токени

| Параметр              | Значення           |
|-----------------------|--------------------|
| Алгоритм              | HS256              |
| Access token TTL      | 15 хвилин          |
| Refresh token TTL     | 7 днів             |
| Зберігання refresh    | HttpOnly Cookie    |

Payload токена:

```json
{
  "sub": "<user_uuid>",
  "role": "user",
  "type": "access",
  "iat": 1234567890,
  "jti": "<uuid4>",
  "exp": 1234568790
}
```

### Rate Limiting

Реалізований через `SlowAPI` + Redis з стратегією **moving-window**.  
Префікс ключів у Redis: `rl:auth`.

| Ендпоінт         | Ліміти                    |
|------------------|---------------------------|
| `POST /auth/register` | 3 / хвилину, 10 / годину |
| `POST /auth/login`    | 5 / хвилину, 20 / годину |

### API ендпоінти

**Базовий префікс:** `/auth`  
**Інтерактивна документація:** `http://localhost:8001/docs`

---

#### `POST /auth/register`

Реєстрація нового користувача.

**Request body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Валідація пароля:**
- Мінімум 8 символів
- Максимум 72 байти у кодуванні UTF-8 (обмеження bcrypt)

**Відповідь `201 Created`:**

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "email": "user@example.com"
}
```

Cookie: `refresh_token` (HttpOnly, Secure, SameSite=Lax, 7 днів)

**Помилки:**

| Код  | Опис                          |
|------|-------------------------------|
| 409  | Email вже зареєстрований      |
| 422  | Невалідний формат email / пароль |
| 429  | Rate limit перевищено          |

---

#### `POST /auth/login`

Авторизація існуючого користувача.

**Request body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Відповідь `200 OK`:**

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer"
}
```

Cookie: `refresh_token` (HttpOnly, Secure, SameSite=Lax, 7 днів)

**Помилки:**

| Код  | Опис                          |
|------|-------------------------------|
| 401  | Невірний email або пароль     |
| 429  | Rate limit перевищено          |

---

#### `POST /auth/refresh`

Оновлення access токена за допомогою refresh токена з cookie.

**Потрібно:** cookie `refresh_token`

**Відповідь `200 OK`:**

```json
{
  "access_token": "<new_jwt>",
  "token_type": "bearer"
}
```

**Помилки:**

| Код  | Опис                             |
|------|----------------------------------|
| 401  | Cookie відсутній або токен недійсний |

---

#### `GET /auth/me`

Отримання інформації про поточного авторизованого користувача.

**Потрібно:** `Authorization: Bearer <access_token>`

**Відповідь `200 OK`:**

```json
{
  "id": "<user_uuid>",
  "email": "user@example.com",
  "role": "user"
}
```

**Помилки:**

| Код  | Опис                              |
|------|-----------------------------------|
| 401  | Токен відсутній або недійсний     |
| 403  | Акаунт деактивований              |

---

#### `POST /auth/logout`

Видалення refresh token cookie.

**Відповідь:** `204 No Content`

---

#### `GET /health`

Перевірка стану сервісу.

**Відповідь `200 OK`:**

```json
{ "status": "ok" }
```

---

## Сервіс бізнес-логіки — `business_logic_service`

### Розташування

```
services/api/
```

> Фізична папка — `services/api`, логічна роль — бізнес-логіка (товари, категорії, ритейлери, кошики).

### Технологічний стек

| Компонент    | Бібліотека / версія       |
|--------------|---------------------------|
| Вебфреймворк | FastAPI ≥ 0.136           |
| Вебсервер    | Granian ≥ 2.7 (ASGI)      |
| ORM          | SQLAlchemy ≥ 2.0 (async)  |
| Драйвер БД   | asyncpg ≥ 0.31            |
| Серіалізація | orjson ≥ 3.10             |
| Логування    | loguru ≥ 0.7              |
| Міграції     | Alembic ≥ 1.18            |

### Запуск

```bash
cd /app && granian --interface asgi --host 0.0.0.0 --port 8000 --workers 4 services.api.main:app
```

### API ендпоінти

**Базовий URL:** `http://localhost:8000`  
**Інтерактивна документація:** `http://localhost:8000/docs`

---

#### `GET /health`

Перевірка стану сервісу.

**Відповідь `200 OK`:**

```json
{ "status": "ok" }
```

---

#### `POST /products`

Створення нового продукту.

**Request body:**

```json
{
  "name": "iPhone 16 Pro",
  "category_id": "<uuid категорії>",
  "external_id": "iph16pro-256",
  "general_description": "Флагманський смартфон Apple",
  "specifications": {
    "storage": "256GB",
    "color": "Black Titanium"
  }
}
```

> ⚠️ `category_id` повинен відповідати реально існуючій категорії в таблиці `Category`. Отримати список категорій можна запитом до БД або через майбутній ендпоінт `GET /categories`.

**Відповідь `201 Created`:**

```json
{
  "id": "<uuid>",
  "name": "iPhone 16 Pro",
  "category_id": "<uuid>",
  "external_id": "iph16pro-256"
}
```

**Помилки:**

| Код  | Опис                               |
|------|------------------------------------|
| 422  | Невалідні поля запиту              |
| 500  | FK violation або інша помилка БД   |

---

#### `DELETE /products/{product_id}`

Видалення продукту за UUID.

**Path parameter:** `product_id` — UUID продукту

**Відповідь:** `204 No Content`

**Помилки:**

| Код  | Опис                    |
|------|-------------------------|
| 404  | Продукт не знайдено     |

---

## Міграції та наповнення бази даних

### Alembic

Розташування: `services/api/migrations/`  
Конфіг: `services/api/alembic.ini`

Alembic використовує **асинхронний** рушій (asyncpg), URL бази даних береться з `DATABASE_URL` через `os.environ`.

Поточні міграції:

| Revision         | Назва          | Дата              |
|------------------|----------------|-------------------|
| `d7a15e45750f`   | init tables    | 2026-05-18        |

Таблиці, що створюються при `alembic upgrade head`:
`Category`, `Retailer`, `User`, `Cart`, `Product`, `CartItem`, `PriceHistory`, `ProductPrice`

**Запуск вручну (з директорії `services/api/`):**

```bash
alembic upgrade head
alembic downgrade base
alembic revision --autogenerate -m "назва міграції"
```

### Seed Data

Скрипт: `services/api/seed_data.py`

**Логіка (ідемпотентна):**

- Перевіряє наявність хоча б одного запису в `Category`. Якщо немає — створює три початкові категорії.
- Перевіряє наявність хоча б одного запису в `Retailer`. Якщо немає — створює одного ритейлера.

**Початкові категорії:**

| Назва              | Slug                |
|--------------------|---------------------|
| Електроніка        | `elektronika`       |
| Побутова техніка   | `pobutova-tekhnika` |
| Смартфони          | `smartfony`         |

**Початковий ритейлер:**

| Назва           | Logo URL                        |
|-----------------|---------------------------------|
| Smarket-Retail  | `https://example.com/logo.png`  |

**Запуск вручну (з директорії `services/api/`):**

```bash
python seed_data.py
```

---

## Схема бази даних

Єдина спільна база даних для всіх сервісів.

```
User
├── id (UUID, PK)
├── email (VARCHAR 255, UNIQUE)
├── hashed_password (VARCHAR 255)
├── role (VARCHAR 255)
├── is_active (BOOLEAN)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)

Category
├── id (UUID, PK)
├── name (VARCHAR 255, UNIQUE)
└── slug (VARCHAR 255, UNIQUE)

Retailer
├── id (UUID, PK)
├── name (VARCHAR 255, UNIQUE)
└── logo_url (VARCHAR 255)

Product
├── id (UUID, PK)
├── name (VARCHAR 255)
├── category_id (UUID, FK → Category.id)
├── external_id (VARCHAR 255)
├── general_description (VARCHAR 255)
└── specifications (JSONB)

ProductPrice
├── id (UUID, PK)
├── product_id (UUID, FK → Product.id)
├── retailer_id (UUID, FK → Retailer.id)
├── price (NUMERIC 10,2)
├── discount_price (NUMERIC 10,2, nullable)
├── in_stock (BOOLEAN)
└── updated_at (TIMESTAMPTZ)

PriceHistory
├── id (UUID, PK)
├── product_id (UUID, FK → Product.id)
├── retailer_id (UUID, FK → Retailer.id)
├── price (NUMERIC 10,2)
└── recorded_at (TIMESTAMPTZ)

Cart
├── id (UUID, PK)
├── user_id (UUID, FK → User.id, UNIQUE)
└── created_at (TIMESTAMPTZ)

CartItem
├── id (UUID, PK)
├── cart_id (UUID, FK → Cart.id)
├── product_id (UUID, FK → Product.id)
├── quantity (INTEGER)
└── added_at (TIMESTAMPTZ)
```

---

## Інфраструктура — Docker Compose

Файл: `infra/docker-compose.yml`  
Контекст збірки для всіх сервісів: корінь проекту (`..` від `infra/`).

### Сервіси

| Сервіс                   | Образ / Dockerfile           | Порт      | Опис                                      |
|--------------------------|------------------------------|-----------|-------------------------------------------|
| `db`                     | `postgres:16-alpine`         | `5432`    | PostgreSQL, дані у volume `postgres_data` |
| `auth_service`           | `services/auth_service/Dockerfile` | `8001` | Мікросервіс авторизації            |
| `migration_job`          | `services/api/Dockerfile`    | —         | One-shot: міграції + seed, потім зупиняється |
| `business_logic_service` | `services/api/Dockerfile`    | `8000`    | Основний API сервіс                       |

### Healthcheck бази даних

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U smarket -d smarket"]
  interval: 5s
  timeout: 5s
  retries: 10
  start_period: 10s
```

### Паттерн "один образ — дві ролі"

`services/api/Dockerfile` будує один образ без `CMD`. Роль задається через `command` у docker-compose:

```yaml
migration_job:
  command: ["sh", "-c", "alembic upgrade head && python seed_data.py"]

business_logic_service:
  command: ["sh", "-c", "cd /app && granian --interface asgi ..."]
```

### Залежності між сервісами

```
db (healthy)
    ├── auth_service
    └── migration_job (restart: no)
            └── business_logic_service (service_completed_successfully)
```

---

## Змінні оточення

### `services/auth_service/.env`

| Змінна         | Приклад значення                    | Опис                              |
|----------------|-------------------------------------|-----------------------------------|
| `DATABASE_URL` | `postgresql+asyncpg://user:pw@host/db` | URL підключення до PostgreSQL  |
| `REDIS_URL`    | `redis://localhost:6379`            | URL підключення до Redis          |
| `SECRET_KEY`   | `<256-bit hex string>`              | Ключ для підпису JWT токенів      |
| `APP_HOST`     | `0.0.0.0`                           | Адреса для прослуховування        |
| `APP_PORT`     | `8001`                              | Порт сервісу                      |
| `APP_WORKERS`  | `2`                                 | Кількість Granian воркерів        |
| `DEBUG`        | `False`                             | Якщо `True` — логує SQL запити    |
| `LOG_LEVEL`    | `INFO`                              | Рівень логування                  |
| `TELEGRAM_BOT_TOKEN` | `<bot_token_from_botfather>`  | Токен Telegram бота для перевірки підпису OAuth |


### `services/api/.env`

| Змінна         | Приклад значення                    | Опис                              |
|----------------|-------------------------------------|-----------------------------------|
| `DATABASE_URL` | `postgresql+asyncpg://user:pw@host/db` | URL підключення до PostgreSQL  |
| `REDIS_URL`    | `redis://localhost:6379`            | URL підключення до Redis          |
| `SECRET_KEY`   | `<256-bit hex string>`              | Ключ для підпису JWT токенів      |
| `APP_HOST`     | `0.0.0.0`                           | Адреса для прослуховування        |
| `APP_PORT`     | `8000`                              | Порт сервісу                      |
| `APP_WORKERS`  | `4`                                 | Кількість Granian воркерів        |
| `DEBUG`        | `False`                             | Якщо `True` — логує SQL запити    |

> Для підключення до локального `db`-контейнера у docker-compose використовуй:
> `postgresql+asyncpg://smarket:smarket@db:5432/smarket`

---

## Запуск локально

### Запуск через Docker Compose (рекомендований спосіб)

```bash
cd infra
docker compose up --build
```

Доступні URL після запуску:

| Сервіс                   | URL                              |
|--------------------------|----------------------------------|
| Auth Service API         | http://localhost:8001/docs       |
| Business Logic API       | http://localhost:8000/docs       |
| PostgreSQL               | localhost:5432                   |

### Запуск окремого сервісу без Docker

```bash
# auth_service
cd services/auth_service
uv pip install -e .
python -m services.auth_service.main

# business_logic_service
cd services/api
uv pip install -e .
# Спочатку запустити міграції:
alembic upgrade head
python seed_data.py
# Потім веб-сервер:
python -m services.api.main
```

### Створення нової міграції

```bash
cd services/api
alembic revision --autogenerate -m "короткий опис змін"
```

Після цього перевір згенерований файл у `migrations/versions/` та запусти:

```bash
alembic upgrade head
```
