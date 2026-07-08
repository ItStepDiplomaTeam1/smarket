## Context

Для реалізації системних логів (System Logs) сервіси `product_service` та `reviews_service` тепер потребують підключення до RabbitMQ через змінну `RABBITMQ_URL`. Окрім цього, в інфраструктурі використовується `audit_service`, який повністю випав з налаштувань автоматизації (Doppler та CI/CD). Необхідно налаштувати ці елементи так, щоб деплой та локальний запуск працювали без збоїв.

## Goals / Non-Goals

**Goals:**
- Забезпечити передачу `RABBITMQ_URL` мікросервісам `product_service` та `reviews_service` в `infra/docker-compose.yml`.
- Налаштувати автоматичну ініціалізацію Doppler для `services/audit_service`.
- Налаштувати CI/CD для збірки Docker-образу та тестування `audit_service`.
- Додати `audit_service` до списку конфігурацій стягування секретів на етапі `deploy` у GitHub Actions.

**Non-Goals:**
- Створення нових мікросервісів.
- Зміна логіки роботи самих сервісів.

## Decisions

1. **Додавання RABBITMQ_URL в Docker Compose**:
   У файлі `infra/docker-compose.yml` під секціями `product_service` та `reviews_service` додаємо:
   ```yaml
   environment:
     RABBITMQ_URL: "amqp://${RABBITMQ_USER:-smarket}:${RABBITMQ_PASS:-secure_rmq_pass_123}@rabbitmq:5672/"
   ```
   Це дозволить обом сервісам успішно підключатися до брокера всередині docker-мережі.

2. **Інтеграція Doppler**:
   У файлі `doppler.yaml` додаємо мапінг для `audit_service`:
   ```yaml
   - project: smarket-services-secrets
     config: dev_audit_service
     path: services/audit_service
   ```

3. **Розширення CI/CD (GitHub Actions `ci.yml`)**:
   - Змінна `PYTHON_SERVICES` у верхній частині файлу повинна містити `services/audit_service`.
   - В етапі `detect` додаємо перевірку `python_service_changed "audit_service"` для збірки Docker та запуску тестів:
     ```bash
     if python_service_changed "audit_service"; then
       add_python_service "audit_service"
       add_docker_service "audit_service" "services/audit_service/Dockerfile" "."
     fi
     ```
   - Додаємо `services/audit_service` до списку `root_docker` збірок на випадок зміни `.dockerignore`.
   - В етапі `deploy` додаємо `"services/audit_service"="dev_audit_service"` у мапу `configs` для скачування секретів з Doppler.
   - Додаємо `services/audit_service` до циклу копіювання `.env` файлів на Hetzner.

## Risks / Trade-offs

- **Помилки при відсутності конфігурації dev_audit_service у Doppler**:
  Перед деплоєм адміністратор проекту має переконатися, що в Doppler створено конфіг `dev_audit_service`.
