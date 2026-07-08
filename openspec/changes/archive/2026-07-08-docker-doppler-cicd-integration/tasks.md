## 1. Docker Compose Configuration

- [x] 1.1 Додати `RABBITMQ_URL` до блоку `environment` для `product_service` у `infra/docker-compose.yml`.
- [x] 1.2 Додати `RABBITMQ_URL` до блоку `environment` для `reviews_service` у `infra/docker-compose.yml`.

## 2. Doppler Secret Management

- [x] 2.1 Додати мапінг для `services/audit_service` у `doppler.yaml`.

## 3. GitHub Actions CI/CD Configuration

- [x] 3.1 Оновити змінну `PYTHON_SERVICES` у `.github/workflows/ci.yml` — додати `services/audit_service`.
- [x] 3.2 Додати детекцію змін `audit_service` та мапінг у матрицю збірки Docker/Python в етапі `detect` у `.github/workflows/ci.yml`.
- [x] 3.3 Додати `audit_service` до списку `root_docker` збірок на випадок зміни `.dockerignore` у `.github/workflows/ci.yml`.
- [x] 3.4 Додати завантаження секретів Doppler (`dev_audit_service`) для `services/audit_service` на етапі `deploy` у `.github/workflows/ci.yml`.
- [x] 3.5 Оновити цикл копіювання `.env` файлів під час деплою — додати `services/audit_service` у `.github/workflows/ci.yml`.
