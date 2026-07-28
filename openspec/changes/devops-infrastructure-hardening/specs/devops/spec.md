# DevOps & CI/CD Specification Delta

## MODIFIED Requirements

### Requirement: Microservice Environment & Secret Isolation
The CI/CD deployment pipeline MUST isolate environment variables per service and MUST NOT overwrite or combine `.env` files across services into a single un-scoped environment file.

#### Scenario: Multi-service Doppler deployment
- **Given** secrets are downloaded from Doppler for 10 microservices
- **When** deployment executes on the production server
- **Then** each microservice reads its own `.env` file from `services/<service_name>/.env`
- **And** variable names like `APP_PORT` or `DATABASE_URL` do not collide or overwrite each other

### Requirement: Dockerfile Naming Consistency
All Dockerfile filenames in microservice directories MUST be named exactly `Dockerfile` with standard case sensitivity.

#### Scenario: CI/CD matrix build execution
- **Given** GitHub Actions matrix checks service Dockerfiles
- **When** `cart_service` or `product_service` images are built
- **Then** Docker buildx finds `services/cart_service/Dockerfile` and `services/product_service/Dockerfile` without file-not-found errors

### Requirement: Lightweight Service Healthchecks
Container healthchecks in `docker-compose` MUST use low-overhead healthcheck execution commands to avoid excessive CPU/memory usage on resource-constrained hosts.

#### Scenario: Container health verification
- **Given** 15 Docker containers are running on the Hetzner host
- **When** healthchecks execute every 15 seconds
- **Then** health checks evaluate target ports via lightweight socket/urllib checks without spawning full interpreter suites
