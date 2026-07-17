## Context

The `products_etl` Go service handles seeding of stores and categories from Zakaz.ua upon startup. 
When the database is empty, it runs database migrations and then performs a seeding operation. The seeding fetches categories sequentially for all active stores in the database. As the number of active stores has grown to 67, fetching categories takes more than 120 seconds. This exceeds the context deadline in `main.go`, causing subsequent database queries to fail and loop continuously, spamming warnings in the console and delaying the startup of workers.

Additionally, the deploy healthcheck in Docker Compose is configured to use `curl`. Since the `products_etl` codebase is rarely modified, CI/CD skips rebuilding its Docker image and pulls an older version from GHCR that lacks `curl` installed, causing the healthcheck to fail.

## Goals / Non-Goals

**Goals:**
- Reduce category seeding time on startup to under 15 seconds.
- Avoid console warning loops when the seeding context is cancelled or times out.
- Ensure the Docker Compose healthcheck succeeds without relying on `curl`.

**Non-Goals:**
- Implementing concurrent/parallel crawl loops for seeding.
- Altering healthcheck endpoints or logic in other microservices.

## Decisions

### 1. Group Seeding by Retail Chain
- **Decision**: Optimize `SeedCategories` to only query category slugs for one store per unique retail chain.
- **Rationale**: Category structures and slugs are network-wide (e.g. Auchan categories are identical for all Auchan stores). Querying 1 store per chain instead of 67 reduces network requests from 67 to ~8.
- **Alternatives**: Querying all 67 stores concurrently. This risks rate-limiting by Zakaz.ua and increases resource usage.

### 2. Context Cancellation Check in Seeding Loops
- **Decision**: Add checks for `ctx.Err() != nil` inside the store and category loops in `SeedCategories`.
- **Rationale**: If the seeding timeout is exceeded, the loop will exit immediately and return the error, avoiding thousands of useless execution attempts and log spam.
- **Alternatives**: Simply increasing the timeout limit. This does not address the underlying inefficiency and will still fail if Zakaz.ua is slow or down.

### 3. Use BusyBox Wget for Healthchecks
- **Decision**: Change the healthcheck test command in `infra/docker-compose.yml` to use `wget -qO-` instead of `curl`.
- **Rationale**: BusyBox `wget` is pre-installed in Alpine Linux by default. It removes the dependency on `curl` and allows healthchecks to pass on older pulled images.
- **Alternatives**: Force rebuilding of all Docker images in CI/CD on every push. This significantly increases build times.

## Risks / Trade-offs

- **[Risk]** A retail chain might have no active stores.
  - *Mitigation*: The query filters by `is_active = true`. If a chain has no active stores, we do not need to seed its categories.
- **[Risk]** Busybox `wget` exit codes differ from `curl`.
  - *Mitigation*: The command `wget -qO- <url> || exit 1` explicitly returns `1` if the request fails, matching the behavior of `curl -sf`.
