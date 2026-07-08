## ADDED Requirements

### Requirement: System Events Publication
Усі мікросервіси MUST відправляти повідомлення в `audit_service` (через RabbitMQ `smarket_events`) під час свого запуску.

#### Scenario: Service startup
- **WHEN** мікросервіс (FastAPI або Go ETL) успішно стартує
- **THEN** він публікує подію типу `service_started` з інформацією про свій запуск у RabbitMQ

### Requirement: ETL Workflow Events
Воркер `products_etl` MUST надсилати події про початок та закінчення циклу збору даних.

#### Scenario: ETL data collection starts
- **WHEN** `products_etl` розпочинає новий цикл парсингу/синхронізації
- **THEN** він публікує подію `etl_started` (severity: info) у RabbitMQ

#### Scenario: ETL data collection finishes
- **WHEN** `products_etl` завершує цикл збору даних
- **THEN** він публікує подію `etl_finished` (severity: info, або error у разі збою) з результатами у `details` (наприклад, "Оновлено X товарів") у RabbitMQ

### Requirement: Dashboard Logs Display
Адмін-панель MUST відображати 5 останніх системних подій у компоненті System Logs на дашборді.

#### Scenario: Admin views dashboard
- **WHEN** адміністратор відкриває сторінку Dashboard
- **THEN** фронтенд викликає `GET /api/v1/admin/dashboard-summary`, який містить масив `systemLogs` з реальними останніми подіями аудиту (запуск сервісів, ETL статуси), і відображає їх у таблиці `SystemLogsTable`.
