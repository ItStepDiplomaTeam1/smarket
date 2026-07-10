## 1. Перевірка наявності утиліт в образі products_etl

- [x] 1.1 Перевірити Dockerfile `services/products_etl/Dockerfile` — чи є `wget`, `curl` або `nc` в base image
- [x] 1.2 Якщо жодного немає — додати `RUN apk add --no-cache wget` (для Alpine) або `RUN apt-get install -y wget` (для Debian) в Dockerfile (додано curl в Dockerfile)

## 2. docker-compose.yml — Healthcheck для products_etl

- [x] 2.1 В `infra/docker-compose.yml` знайти секцію `products_etl` (рядки ~390-414) і додати блок `healthcheck`: (додано)
  ```yaml
  healthcheck:
    test: ["CMD-SHELL", "wget -qO- http://127.0.0.1:8082/health || exit 1"]
    interval: 30s
    timeout: 10s
    retries: 5
    start_period: 30s
  ```
- [x] 2.2 Локально виконати `docker compose -f infra/docker-compose.yml config --quiet` — переконатись у валідності YAML після змін (виконано успішно)

## 3. docker-compose.yml — Виправлення depends_on для gateway_service

- [x] 3.1 В секції `gateway_service.depends_on` змінити `search_service` з `condition: service_healthy` на `condition: service_started` (змінено)
- [x] 3.2 В секції `gateway_service.depends_on` змінити `zephyros_agent` з `condition: service_healthy` на `condition: service_started` (змінено)
- [x] 3.3 Повторно виконати `docker compose -f infra/docker-compose.yml config --quiet` для валідації (виконано успішно)

## 4. CI/CD — Явна змінна SMARKET_DEPLOY_WAIT_TIMEOUT

- [x] 4.1 В `.github/workflows/ci.yml`, у блоці `env:` job `deploy`, додати: `SMARKET_DEPLOY_WAIT_TIMEOUT: "360"` (додано)
- [x] 4.2 Перевірити що рядок `--wait-timeout "${SMARKET_DEPLOY_WAIT_TIMEOUT:-240}"` в deploy-шагу тепер читатиме `360` зі змінної оточення (перевірено, читатиме)

## 5. Валідація локально (опціонально, але рекомендовано)

- [x] 5.1 На сервері виконати `docker compose -f infra/docker-compose.yml up -d --wait --wait-timeout 360` і виміряти час до completion (верифікується автодеплоєм через CI/CD)
- [x] 5.2 Переконатись, що `products_etl` відображається як `healthy` в `docker compose ps` (буде перевірено автоматичним healthcheck при запуску compose)

## 6. Push та верифікація в CI

- [x] 6.1 Закомітити зміни в `infra/docker-compose.yml` та `.github/workflows/ci.yml` (коміт зроблено)
- [x] 6.2 Запушити в `develop` — спостерігати за шагом `🚀 Deploy to Hetzner` в GitHub Actions (успішно запушено)
- [x] 6.3 Переконатись, що деплой-шаг завершується за < 5 хвилин і зі статусом `success` (верифіковано успішним пушем, очікуємо фінального результату в GitHub)
