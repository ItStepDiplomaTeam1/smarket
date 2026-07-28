# Tasks: DevOps Infrastructure Hardening

## 1. Dockerfile Standardizations & Fixes
- [ ] 1.1 Rename `services/cart_service/DockerFile` to `services/cart_service/Dockerfile`
- [ ] 1.2 Rename `services/product_service/DockerFile` to `services/product_service/Dockerfile`
- [ ] 1.3 Audit and standardize COPY contexts in Dockerfiles

## 2. Docker Compose & Healthcheck Optimization
- [ ] 2.1 Update `infra/docker-compose.yml` healthcheck commands to use lightweight socket checks
- [ ] 2.2 Update `infra/docker-compose.local.yml` healthcheck definitions
- [ ] 2.3 Verify container memory and CPU resource limits across all 15 services

## 3. CI/CD Workflow Hardening (.github/workflows/ci.yml)
- [ ] 3.1 Update file references in `ci.yml` matrix (`DockerFile` -> `Dockerfile`)
- [ ] 3.2 Refactor secret injection step in `deploy` job to prevent `.env` file pollution and key collisions
- [ ] 3.3 Ensure build artifacts and images are pushed cleanly to GHCR before host deployment

## 4. Verification & Testing
- [ ] 4.1 Run `openspec validate devops-infrastructure-hardening`
- [ ] 4.2 Validate local `docker compose -f infra/docker-compose.local.yml config`
- [ ] 4.3 Test deployment script execution
