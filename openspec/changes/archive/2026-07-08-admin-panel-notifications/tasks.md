## 1. Gateway API Modifications

- [x] 1.1 Оновити ендпоінт `GET /admin/dashboard-summary` у `services/gateway/app/api/routes/admin.py` для виклику `audit_service` (`GET /admin/audit?limit=5`) паралельно з існуючими запитами.
- [x] 1.2 Мапити отримані з `audit_service` логи у формат масиву `systemLogs` (поля `id`, `time`, `event`, `details`, `status`), що очікується фронтендом, та повертати їх у загальній JSON-відповіді дашборду.

## 2. Python Microservices Events Publishing

- [x] 2.1 Налаштувати підключення до RabbitMQ та публікацію повідомлення типу `service_started` у топік `smarket_events` в блоці `lifespan` для `auth_service`.
- [x] 2.2 Аналогічно додати публікацію повідомлення `service_started` під час запуску для `product_service`.
- [x] 2.3 Аналогічно додати публікацію повідомлення `service_started` під час запуску для `cart_service`.
- [x] 2.4 Аналогічно додати публікацію повідомлення `service_started` під час запуску для `reviews_service`.

## 3. Go ETL Worker Events Publishing

- [x] 3.1 Оновити код запуску `products_etl` для підключення до RabbitMQ і публікації події `service_started` (якщо ще не налаштовано).
- [x] 3.2 Додати публікацію події `etl_started` (severity: info) на самому початку циклу парсингу даних в `products_etl`.
- [x] 3.3 Додати публікацію події `etl_finished` (з severity: info/error та деталями про кількість оновлених товарів) по завершенні або у разі фатального збою циклу в `products_etl`.

## 4. Frontend Integration

- [x] 4.1 Оновити хук `useDashboardData.ts` в `apps/admin/src/hooks/useDashboardData.ts`: прибрати `getMockDashboardData()` для `systemLogs` (або адаптувати його так, щоб він не перезаписував реальні логи).
- [x] 4.2 Перевірити відображення реальних логів у компоненті `SystemLogsTable.tsx` та переконатись, що мапінг статусів (info, warning, error, success) працює коректно з даними аудиту.
