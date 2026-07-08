## Why

У зв'язку з впровадженням сповіщень реального часу та використанням RabbitMQ у мікросервісах `product_service` та `reviews_service`, а також для повноцінної роботи `audit_service` в інфраструктурі Docker, необхідно додати відповідні змінні оточення (зокрема `RABBITMQ_URL`), інтегрувати `audit_service` у процеси CI/CD (збірка, тестування, деплой) та Doppler (менеджмент секретів). Наразі `audit_service` повністю відсутній в конфігурації GitHub Actions та Doppler, а нові залежності мікросервісів від RabbitMQ не прокинуті через Docker Compose.

## What Changes

- **Doppler**:
  - Додавання мапінгу для `services/audit_service` у `doppler.yaml` (config `dev_audit_service`).
  
- **Docker Compose**:
  - Інжектування змінної `RABBITMQ_URL` для `product_service` та `reviews_service` в `infra/docker-compose.yml` (аналогічно до `cart_service` та `audit_service`).
  
- **GitHub Actions CI/CD (`.github/workflows/ci.yml`)**:
  - Додавання `services/audit_service` до списку Python-сервісів (`PYTHON_SERVICES`).
  - Налаштування детекції змін для `audit_service` на етапі `detect` (додавання до матриці збірки Docker та Python-тестів).
  - Інтеграція завантаження секретів Doppler для `audit_service` (конфіг `dev_audit_service`) на етапі деплою.
  - Копіювання `.env` для `audit_service` під час деплою на Hetzner.

## Capabilities

### New Capabilities
- `docker-doppler-cicd-integration`: Повна інтеграція нових сервісів та змінних оточення у Docker, Doppler та CI/CD.

### Modified Capabilities

## Impact

- **CI/CD Pipeline**: Збільшення покриття тестами та автоматична збірка образу для `audit_service`.
- **Infrastructure**: Гарантована наявність `RABBITMQ_URL` у контейнерах `product_service` та `reviews_service` для надсилання подій.
- **Secret Management**: Автоматичне стягування секретів для `audit_service` під час локальної розробки та деплою.
