## Context

Smarket має 10 бекенд-сервісів з мінімальним тестовим покриттям. Єдиний сервіс з тестами — `auth_service` (24 тести, `pytest` з `AsyncMock` + `monkeypatch` + `app.dependency_overrides`). Решта 9 сервісів не мають жодного автоматичного тесту. Сервіси використовують 3 мови програмування (Python, Go, Rust) з різними DI-патернами, що вимагає адаптації підходу до тестування для кожного.

### Сервіси за патерном тестування

| Група | Сервіси | DI патерн | Проблема для тестів |
|---|---|---|---|
| Python/FastAPI з БД | auth, product, cart, reviews, audit | `app.dependency_overrides[get_db]` | Потребують AsyncMock БД + httpx мок для зовнішніх HTTP |
| Python/FastAPI без БД | gateway, zephyros_agent | `app.state.http_client`, module-level agent | gateway: мокати JWT + httpx; zephyros: agent створюється при імпорті |
| Python/FastStream | email_worker | RabbitMQ `@broker.subscriber` | Мокати broker subscriber task |
| Go | products_etl | Глобальний `Infrastructure` struct | Немає інтерфейсів — I/O захардкожений |
| Rust | search_service | Axum `State<Client>` | Meilisearch Client не абстрагований |

### Існуючі тестові патерни (auth_service)

```
TestClient(app) → HTTP-рівневі тести
@pytest.mark.asyncio + monkeypatch → мокати функції модулів
AsyncMock(spec=AsyncSession) → мокати БД
app.dependency_overrides[get_db] → інжектити мок БД
try...finally: app.dependency_overrides.clear() → очистка між тестами
auth_limiter._get().enabled = False → відключити rate limiter
```

## Goals / Non-Goals

**Goals:**
- Покрити unit-тестами чисту логіку кожного бекенд-сервісу (трансформації, валідації, мапінги)
- Покрити integration-тестами HTTP-endpoint'и критичних сервісів (cart, gateway, product)
- Додати тестові конфігурації в CI-пайплайн для всіх трьох мов
- Використовувати спільні патерни мокування в межах кожної мови (але адаптовані під специфіку сервісу)
- Досягти мінімального порогу: кожен сервіс має хоча б 3 тести на критичну функцію

**Non-Goals:**
- Не покриваємо фронтенд (`apps/react`, `apps/admin`) — тільки бекенд
- Не додаємо E2E тести — тільки unit + integration
- Не рефакторимо архітектуру сервісів (не виносимо інтерфейси в Go, не розбиваємо handler'и в Rust) — тести пишуться навколо існуючої архітектури
- Не вимагаємо 100% code coverage — фокус на критичних шляхах

## Decisions

### Decision 1: Тестовий стек для кожної мови

**Python сервіси (auth, product, cart, reviews, audit, gateway, zephyros, email_worker):**

| Інструмент | Призначення |
|---|---|
| `pytest` + `pytest-asyncio` | Тестовий раннер (вже використовується в auth_service) |
| `unittest.mock.AsyncMock` | Мокування async залежностей |
| `pytest.MonkeyPatch` | Підміна модульних констант та функцій |
| `fastapi.testclient.TestClient` | HTTP-рівневі тести без реального сервера |
| `httpx.MockTransport` / `respx` | Мокування HTTP-залежностей (cart→product, gateway→services) |

**Go сервіс (products_etl):**

| Інструмент | Призначення |
|---|---|
| `go test` (вбудований) | Тестовий раннер |
| `pgxmock` | Мокування PostgreSQL запитів |
| `httptest.NewServer` | Мокування HTTP-залежностей (Zakaz API, search_service) |
| `mongomock` або ручний mock `mongo.Client` | Мокування MongoDB |

**Rust сервіс (search_service):**

| Інструмент | Призначення |
|---|---|
| `cargo test` (вбудований) | Тестовий раннер |
| `#[cfg(test)]` + `#[test]` | Тестові модулі |
| Витяг чистого логіки в `pub fn` | Тестування фільтрів без I/O |
| `axum::test` / `axum_test_helper` | Інтеграційні тести роутингу |

**Rationale:** Не додаємо зовнішні тестові бібліотеки (testify для Go, mockall для Rust) без потреби — використовуємо вбудовані або вже наявні інструменти. `pgxmock` та `mongomock` розглядаються, але можуть бути замінені ручними mock-структурами при потребі.

### Decision 2: Підхід до тестування сервісів за групами

**Python/FastAPI з БД (product, cart, reviews, audit):**

Повторюємо патерн `auth_service`:
```
app.dependency_overrides[get_db] → AsyncMock(spec=AsyncSession)
monkeypatch.setattr(router_module, "external_func", AsyncMock())
httpx.MockTransport → мокати зовнішні HTTP виклики
```
Через спільний патерн `lifespan` (httpx client + RabbitMQ broker) для cart_service, потрібно також мокати `app.state.http_client` через `TestClient(app)` із кастомним transport.

**Python/FastAPI без БД (gateway, zephyros_agent):**

- **gateway**: `monkeypatch.setattr("jwt.decode", mock)` для токенів, `httpx.MockTransport` для проксі-відповідей. `app.dependency_overrides[verify_jwt]` для інжекції тестового payload.
- **zephyros_agent**: Мокати `agent.run = AsyncMock()` в модулі `services.zephyros_agent.app.agent.zephyros`. Для тестування інструментів окремо — мокати `ctx.deps.http_client` через `httpx.MockTransport`. Для тестування circuit breaker — `monkeypatch.setattr` на `_is_down`/`_mark_down`.

**Go (products_etl):**

Фокус на **чистих функціях без I/O**: валідація EAN, конвертація цін (копійки→грн), мапінг категорій (`ResolveMainCategoryID`), очистка HTML з описів. Це pure functions — не потребують моків.

Для I/O-залежних функцій (`SeedStores`, `SeedCategories`, backfill) використовуємо `httptest.NewServer` для Zakaz API та `search_service`.

**Rust (search_service):**

Витягаємо чисту логіку з `get_search.rs` handler'а в окремі `pub fn`:
- `pub fn map_slug_to_main_id(slug: &str) -> Option<i32>` — мапінг категорій
- `pub fn expand_subcategory_prefixes(sub_slug: &str) -> Vec<String>` — розгортання підкатегорій
- `pub fn build_price_filter(min: Option<f64>, max: Option<f64>) -> String` — побудова фільтрів

Це не потребує рефакторингу архітектури — просто виносимо існуючу логіку з тіла handler'а в окремі функції, які handler викликає. Тести пишемо через `#[cfg(test)] mod tests { ... }` в тому ж файлі.

### Decision 3: CI інтеграція

Розширюємо існуючий CI-пайплайн (`.github/workflows/ci.yml`) — етап 3 "Lint & Test":

- **Python Quality** (вже є): після `ruff check` → `pytest --cov` для сервісів де є `tests/`. Використовуємо існуючу матрицю `py-services`.
- **Go ETL** (вже є): після `go vet` → `go test -v -race ./...`
- **Rust Search** (вже є): після `cargo clippy` → `cargo test`

**НЕ додаємо новий GitHub Actions job** — розширюємо існуючі, бо `pytest` і `go test` вже місцями згадані в CI (Python Tests job виконує `pytest --cov` але пропускає якщо немає `tests/`).

### Decision 4: Порядок імплементації за ризиком

```
1. products_etl (Go) → pure functions без I/O, найвищий ризик багів
2. search_service (Rust) → filter logic, другий за ризиком
3. cart_service → найскладніші integration тести (3 DI залежності)
4. gateway → proxy + JWT, діра безпеки без тестів
5. product_service → read-only, відносно прості
6. zephyros_agent → 8 інструментів, circuit breaker
7. auth_service expansion → OAuth, password recovery
8. reviews_service → простий CRUD
9. audit_service → простий CRUD
10. email_worker → FastStream subscriber
```

### Decision 5: Dev-залежності

**Python сервіси** — додаємо в `[dependency-groups] dev` у `pyproject.toml` або в `requirements-dev.txt`:
```
pytest>=9.1.1
pytest-asyncio>=1.4.0
pytest-cov>=7.0.0
httpx>=0.28.0  # (MockTransport)
```

**Go сервіс** — не додаємо зовнішніх залежностей. `httptest` — стандартна бібліотека.

**Rust сервіс** — не додаємо зовнішніх залежностей. `#[test]` — вбудований.

## Risks / Trade-offs

| Ризик | Mitigation |
|---|---|
| **Mock-heavy тести дають false positives** — тест проходить, але реальний код зламаний через mismatch між моком і реальною поведінкою | Пишемо мінімальні моки (тільки I/O границі). Для integration тестів cart_service — використовуємо `httpx.MockTransport` з реальними JSON-відповідями (snapshot-підхід) |
| **Тести `products_etl` без реальної БД не ловлять SQL-баги** | Покриваємо тільки pure functions (EAN, ціни, категорії). SQL-запити залишаються непокритими — це прийнятно, бо DDL тестується міграціями Alembic |
| **zephyros_agent тести залежать від monkeypatch на module-level `agent`** | Це крихкий патерн, але без рефакторингу архітектури — єдиний варіант. При наступному change'і можна винести agent creation у `lifespan` FastAPI |
| **Тести сповільнюють CI** | Unit-тести (pure functions) швидкі. Integration-тести (HTTP через TestClient) теж швидкі (немає реальних мережевих викликів). `go test -race` може сповільнити — використовуємо тільки `go test -v` без `-race` на CI (race detection локально) |
| **Rust тести потребують витягу pure functions з handler'а** | Це мінімальний рефакторинг (перенести код 1:1 з handler'а в `pub fn`). Не змінює поведінку — handler викликає ті самі функції. Ризик регресії мінімальний, бо логіка не змінюється |