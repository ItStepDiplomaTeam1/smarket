# Copilot Instructions for `smarket`

## Build, test, and lint (CI-parity commands)

Run commands from repo root unless noted.

### Python services (`services/auth_service`, `cart_service`, `email_worker`, `gateway`, `product_service`, `reviews_service`, `zephyros_agent`)

```bash
cd services/<service>
uv venv --python 3.11 .venv

# Install service deps
if [ -f pyproject.toml ]; then
  uv pip install --python .venv/bin/python -q .
elif [ -f requirements.txt ]; then
  uv pip install --python .venv/bin/python -q -r requirements.txt
fi

# Lint/type-check (same selectors as CI)
uv pip install --python .venv/bin/python -q ruff mypy
.venv/bin/ruff check . --select E,W,F401,F841
.venv/bin/ruff check . --select F --ignore F401,F841
.venv/bin/mypy .

# Tests
uv pip install --python .venv/bin/python -q pytest pytest-asyncio pytest-cov httpx
.venv/bin/pytest --cov=. --cov-report=xml --cov-report=term-missing -v --tb=short
```

Single test example (currently only `auth_service` has tests):

```bash
cd services/auth_service
.venv/bin/pytest tests/test_main.py::test_health -q
```

### React apps

`apps/react/frontend/my-react-app`:

```bash
cd apps/react/frontend/my-react-app
npm ci --prefer-offline --no-audit --no-fund
npm run lint
npm run build
```

`apps/admin`:

```bash
cd apps/admin
npm ci --prefer-offline --no-audit --no-fund
npm run lint
npm run build
```

No dedicated JS/TS test runner is configured in current app `package.json` files.

### Go ETL (`services/products_etl`)

```bash
cd services/products_etl
go mod download
go vet ./...
go test -v -race -coverprofile=coverage.out ./...
go build ./...
```

Single test pattern:

```bash
go test ./... -run TestName
```

### Rust search service (`services/search_service`)

```bash
cd services/search_service
cargo clippy -- -D warnings || cargo clippy
cargo test --verbose
```

Single test pattern:

```bash
cargo test test_name_substring --verbose
```

## High-level architecture

Smarket is a polyglot microservice monorepo with `gateway` as the only public API entrypoint (`/api/v1/*`), two React apps, and specialized backend services.

- **Request path:** frontend (`apps/react`, `apps/admin`) -> `gateway_service` -> internal services (`auth_service`, `product_service`, `cart_service`, `reviews_service`, `search_service`, `zephyros_agent`).
- **Catalog data path:** `products_etl` (Go) ingests Zakaz data -> writes PostgreSQL catalog tables + MongoDB raw pages -> pushes search docs to `search_service` -> indexed in Meilisearch.
- **Async messaging path:** `cart_service` / `auth_service` publish RabbitMQ events -> `email_worker` consumes `email_queue`.
- **Product service behavior:** `product_service` is read-only and listens to PostgreSQL `LISTEN/NOTIFY` (`products_updated`) via a background task.
- **Infra compose:** root `docker-compose.yml` includes `infra/docker-compose.yml`, which defines service containers, migration jobs, shared Redis/RabbitMQ/MongoDB/Meilisearch/ofelia, and health checks.

## Key repository conventions

- **Scope rule for changes:** default to editing only the requested service directory (`services/<name>/`) unless a cross-service change is explicitly requested.
- **Gateway contract:** new backend endpoints that must be public should be exposed through matching gateway proxy routes under `/api/v1/...`.
- **Auth propagation:** internal authenticated calls rely on `X-User-Id` forwarding from gateway after JWT verification.
- **Shared JWT contract:** gateway and auth service both depend on the same JWT secret/algorithm for token verification.
- **Frontend imports and state:** use `@` alias (`src`), Zustand for shared state (`store`), and TanStack Query via custom hooks instead of direct query logic in UI components.
- **Python service patterns:** FastAPI + async SQLAlchemy, `ORJSONResponse` defaults in API services, Alembic migrations per service (no schema bootstrap via `create_all` in runtime code).
- **OpenSpec usage in this repo:** OpenSpec is present both at repo root (`openspec/`) and in `services/zephyros_agent/openspec/`, both using `schema: spec-driven` with `changes/<change>/proposal.md`, `design.md`, `tasks.md`, and delta specs under `specs/`.
- **Agent workflow assets:** `.agent/skills` and `.agent/workflows` define OpenSpec-oriented flows (`opsx:propose`, `opsx:apply`, `opsx:sync`, `opsx:archive`) and should be treated as the source of truth for spec workflow behavior.
