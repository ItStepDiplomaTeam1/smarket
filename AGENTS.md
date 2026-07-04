# Smarket — карта проекту для AI-агентів

> Цей файл читають AI coding agents (Claude Code, OpenSpec-агенти, Cursor тощо)
> для розуміння **всього** монорепозиторію Smarket, незалежно від того,
> в якій підпапці відкрита сесія.
>
> **Правило скоупу:** ти можеш читати будь-що в репозиторії для контексту,
> але вносити зміни — тільки у межах сервісу, над яким тебе просять працювати
> (`services/<name>/`), якщо користувач явно не попросив крос-сервісну зміну
> (наприклад, зміну контракту між gateway і product_service). Якщо задача
> вимагає торкнутись іншого сервісу — зупинись і уточни, а не роби мовчки.

## Що таке Smarket

Агрегатор цін на продукти (аналог e-katalog, але для supermarket-товарів,
дані з Zakaz.ua). Дипломний проєкт команди ItStepDiplomaTeam1.

- Репозиторій: `github.com/ItStepDiplomaTeam1/smarket`
- Основні гілки: `main` (прод), `develop` (інтеграція), `feature/*`, `fix/*`
- CI/CD: GitHub Actions, self-hosted runner, монорепо-матриця
  (`.github/workflows/ci.yml`) — визначає змінені сервіси по diff і будує
  тільки їх (Python/Go/Rust/Node — окремо).
- Секрети: Doppler, проєкт `smarket-services-secrets`, конфіг на сервіс
  (`dev_gateway`, `dev_auth_service`, `dev_zephyros_agent`, …), див.
  `doppler.yaml` у корені.
- Деплой: Hetzner CX23, `docker compose` (`infra/docker-compose.yml`,
  підключається через `docker-compose.yml` в корені).

## Архітектура (звідки й куди йдуть запити)

```
Client (React/Vite, apps/react)
        │
        ▼  :8080
┌─────────────────────────────────────────────┐
│              gateway_service                 │  Python/FastAPI, /api/v1/*
│  proxies → auth / products / stores / cart /  │
│            reviews / admin / search / agent   │
└──────┬───────┬───────┬───────┬───────┬───────┘
       │       │       │       │       │
       ▼       ▼       ▼       ▼       ▼
   auth_    product_ cart_   reviews_ zephyros_
   service  service  service service  agent
   :8001    :8000    :8002   :8004    :8005
                                         │
                             ┌───────────┼────────────┐
                             ▼           ▼            ▼
                        search_service product_service cart_service
                        :8083 (proxy)   (read API)     (read/write)
                             │
                             ▼
                        Meilisearch :7700

products_etl (Go, окремо) --> MongoDB (сирі сторінки, datalake)
                          --> PostgreSQL (products/prices/stores/categories)
                          --> Meilisearch (індексація)
                          повідомлення через RabbitMQ

email_worker (Python, FastStream) <-- RabbitMQ (черга email_queue) <-- cart_service / auth_service
```

## Каталог сервісів (`services/`)

| Сервіс | Мова/стек | Порт | Призначення | Залежності |
|---|---|---|---|---|
| `gateway` | Python, FastAPI, Granian | 8080 (публічний) | Єдина точка входу, проксіює всі запити фронтенду до внутрішніх сервісів через `httpx.AsyncClient`, CORS, префікс `/api/v1` | всі нижче |
| `auth_service` | Python, FastAPI, SQLAlchemy async, asyncpg | 8001 | Реєстрація/логін/JWT (access+refresh), Google OAuth, rate-limit через SlowAPI+Redis | PostgreSQL (власна схема, таблиця `User`), Redis |
| `product_service` | Python, FastAPI | 8000 | READ-ONLY каталог товарів (`stores`, `categories`, `products` дедуп по EAN, `store_products`, `prices` append-only). Слухає `pg_notify` (`pg_listener.py`) | спільна PostgreSQL-схема з `products_etl` |
| `products_etl` | Go 1.26 | 8082 (внутр.) | Парсинг Zakaz.ua, наповнення каталогу, пише в PostgreSQL, сирі сторінки — в MongoDB (`smarket_datalake.raw_pages`, чиститься cron-джобою `ofelia` щодня о 03:00), індексує в Meilisearch | PostgreSQL, MongoDB, RabbitMQ, `search_service` |
| `cart_service` | Python, FastAPI, SQLAlchemy async | 8002 | Кошик користувача (`carts`, `cart_items`), публікує події в RabbitMQ | PostgreSQL (власна схема), RabbitMQ |
| `reviews_service` | Python, FastAPI | 8004 | Відгуки на товари (`reviews`: product_id, user_id, rating, text) | PostgreSQL (власна схема) |
| `search_service` | Rust | 8083 | Тонкий проксі-шар над Meilisearch (`handlers/get_search.rs`, `post_index.rs`) | Meilisearch |
| `email_worker` | Python, FastStream | 8085 (тільки health) | Consumer черги `email_queue` (RabbitMQ), відправка листів, dead-letter queue `email_dead_letter_queue` | RabbitMQ |
| `zephyros_agent` (продукт: **Promin**) | Python, FastAPI, pydantic-ai | 8005 | AI-агент покупок. `/agent/chat` з provider-chain (OpenRouter → Gemini → Groq → Cerebras) і circuit-breaker на cooldown при 401/429. Інструменти (`tools.py`): `search_catalog`, `compare_product_offers`, `get_user_cart`, `add_product_to_cart`. Відповідає структурованими UI-блоками (`schemas.py`: table, product_card, badge, action_button) | `search_service`, `product_service`, `cart_service` (виклики по внутрішній мережі docker), API-ключі провайдерів через Doppler/`.env` |

**PostgreSQL важливо:** окремого контейнера `db` в `infra/docker-compose.yml` немає — це керована/зовнішня інстанція (NeonDB чи аналог), URL приходить через `DATABASE_URL` з Doppler-секретів на кожен сервіс окремо. Кожен Python-сервіс має свою схему/таблиці (Alembic-міграції в кожному сервісі окремо), крім `product_service`, який лише читає таблиці, які пише `products_etl`.

## Інфраструктура (спільна, `infra/docker-compose.yml`)

- **Redis** — rate-limiting (`auth_service`, префікс ключів `rl:auth`), спільний кеш.
- **RabbitMQ** — черги для `cart_service` → `email_worker`, `products_etl`.
- **MongoDB** — datalake сирих сторінок ETL (`products_etl`), не використовується іншими сервісами.
- **Meilisearch** — повнотекстовий пошук товарів, наповнюється `products_etl`, читається через `search_service`.
- **ofelia** — cron-контейнер (зараз тільки чистка MongoDB datalake).
- Усі образи публікуються в `ghcr.io/itstepdiplomateam1/smarket/<service>:${IMAGE_TAG}`.

## Фронтенд (`apps/`)

- `apps/react` — клієнтський застосунок (React + Vite + Tailwind), дивись `Gemini.md` в корені для конвенцій (Zustand, TanStack Query, absolute imports `@/`, lazy loading).
- `apps/admin` — адмін-панель (React + Vite, окремий застосунок: `src/store`, `src/api`, `src/hooks`, `src/pages`).

## OpenSpec у цьому репозиторії

- OpenSpec (`@fission-ai/openspec`) наразі ініціалізований **тільки** в `services/zephyros_agent/openspec/`. В інших сервісах його ще немає.
- Формат: кожен сервіс, де стоїть OpenSpec, має власний `openspec/{specs,changes}` — спеки прив'язані до bounded context цього сервісу, а не до всього монорепо.
- Для крос-сервісних змін (контракти gateway ↔ сервіси, спільна схема БД, формат повідомлень RabbitMQ) — заводити окремо, не всередині одного сервісного `openspec/`, бо це не належить жодному сервісу одноосібно.
- `openspec/config.yaml → context` в кожному сервісі — місце для деталей саме цього сервісу (стек, конвенції, поточні особливості); цей кореневий `AGENTS.md` — для загальної картини екосистеми.

## Де шукати деталі глибше

- `docs/backend.md`, `docs/backend_endpoints.md`, `docs/zakaz_api.md` — детальна документація по бекенду (частково може відставати від коду — перевіряй по факту в `services/*/app`).
- `Gemini.md` (корінь) — конвенції фронтенду і загальний опис бекенд-стеку.
- `services/zephyros_agent/openspec/` — приклад робочого OpenSpec-флоу (proposal → design → tasks → specs).