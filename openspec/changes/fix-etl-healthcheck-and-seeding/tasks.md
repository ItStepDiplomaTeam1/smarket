## 1. Optimize Seeding Logic in products_etl

- [x] 1.1 Update the SQL query in `SeedCategories` inside `services/products_etl/internal/service/seed.go` to use `SELECT DISTINCT ON (retail_chain)` to fetch only one store per retail chain.
- [x] 1.2 Add checks for `ctx.Err() != nil` inside the outer store loop and the inner category saving loop in `SeedCategories` to abort immediately if the timeout is reached.

## 2. Update Docker Compose Healthcheck

- [x] 2.1 Modify the `products_etl` service healthcheck `test` command in `infra/docker-compose.yml` to use `wget -qO- http://127.0.0.1:8082/health || exit 1` instead of `curl`.

## 3. Verify Deployment

- [x] 3.1 Push the changes to trigger a CI/CD rebuild of the `products_etl` Docker image and deployment to Hetzner.
- [ ] 3.2 Verify on the server that `infra-products_etl-1` becomes `healthy` within 15 seconds of startup.
