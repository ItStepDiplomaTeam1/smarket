## Why

The `products_etl` service currently fails deployment on Hetzner because:
1. The container healthcheck relies on `curl`, which is missing in the older cached image pulled from GHCR (as the service files are rarely modified, skipping rebuilds).
2. The database seeding process queries all 67 active stores one-by-one, which exceeds the 120-second timeout on a clean database run, causing a loop of cancelled context database execution warnings and blocking startup.

## What Changes

- **Deploy Healthcheck Update**: Modify `infra/docker-compose.yml` to check the `products_etl` health status using `wget` (built into Alpine) instead of `curl`.
- **Seeding Query Optimization**: Optimize the category seed logic in `products_etl` to query only one store per retail chain (reducing API requests to Zakaz.ua from 67 to ~8).
- **Graceful Timeout Handling**: Add context cancellation checks `ctx.Err()` in `products_etl` loops to abort seeding immediately if the timeout is reached.

## Capabilities

### New Capabilities
- `etl-database-seeding`: Optimization and robustness of the Go ETL database seeding process and healthcheck status.

### Modified Capabilities
- None

## Impact

- `services/products_etl/internal/service/seed.go`
- `infra/docker-compose.yml`
