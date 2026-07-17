## Context

Наразі інфраструктура використовує RabbitMQ (топік `smarket_events`) та `audit_service` для збору подій аудиту. Адмін-панель отримує мокові дані для системних логів (System Logs) на сторінці `Dashboard.tsx`. Потрібно налаштувати відправку реальних подій (запуск сервісів, старт та кінець роботи ETL) від усіх мікросервісів та відображати їх на дашборді.

## Goals / Non-Goals

**Goals:**
- Усі Python-мікросервіси та `products_etl` повинні публікувати події в RabbitMQ під час старту.
- Воркер `products_etl` повинен публікувати події "Початок збору даних" та "Кінець збору даних".
- Адмін-панель повинна отримувати ці події через `GET /admin/dashboard-summary` (шляхом модифікації Gateway) та показувати їх у компоненті `SystemLogsTable`.

**Non-Goals:**
- Переробка структури існуючої таблиці `AuditLog` в базі даних `audit_service`.
- Впровадження WebSocket для логів на фронтенді (обійдемося наявним рефетчем `useDashboardData`).

## Decisions

1. **Відправка подій під час старту**: 
   - Додавання публікації події `service_started` в RabbitMQ у Python-сервісах (в блоці `lifespan` FastAPI) та Go-сервісі `products_etl` під час старту.
   - В `products_etl` додатково публікувати події `etl_started` та `etl_finished` на початку і в кінці пайплайну збору даних.
   
2. **Формат подій (згідно схеми AuditLogEventSchema)**: 
   - `actor`: "System" або назва відповідного сервісу.
   - `event_type`: `service_started`, `etl_started`, `etl_finished`.
   - `severity`: `info` (або `warning`/`error` у разі проблем з ETL).
   
3. **Відображення на Frontend**:
   - `API Gateway`: маршрут `/admin/dashboard-summary` наразі збирає дані з `product_service` та `auth_service`. Щоб фронтенд компонент `SystemLogsTable` відразу отримав реальні дані у полі `systemLogs`, найпростіше додати паралельний виклик до `audit_service` (`/admin/audit?limit=5`) всередині функції `get_dashboard_summary` у Gateway, і мапити відповідь у формат, що очікується фронтендом: `{ id, time, event, details, status }`.

## Risks / Trade-offs

- **Затримки при відправці подій**:
  Якщо RabbitMQ недоступний під час старту сервісу, сервіси повинні обробляти помилки публікації логів так, щоб це не переривало їхній запуск (fire-and-forget або try/except).
