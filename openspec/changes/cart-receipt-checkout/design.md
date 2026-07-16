## Context

Кошик у Smarket (`cart_service`) — це постійно-відкритий список товарів без стану завершення. Таблиці `carts` і `cart_items` зберігають лише актуальний стан, а `prices` постійно оновлюється ETL-воркером. Кнопка "Створити список покупок" у `CartSummary.tsx` існує у вёрстці, але не має обробника.

Проблема: не існує жодного способу "зафіксувати" рішення про покупку. Якщо user порівняв ціни, вибрав магазин і пішов — цифри до повернення з магазину вже могли змінитися. Немає що показувати, нема чим ділитися.

Порядок залежностей реалізації:
1. `products_etl` + `product_service` — додати geo-поля в `stores` (address/lat/lng). Без них чек не знатиме адресу магазину.
2. `cart_service` — таблиця `receipts` + ендпоінти `complete`, `GET /receipts`, `GET /receipts/{token}`.
3. `zephyros_agent` — легкий ендпоінт `/agent/summarize-plan`.
4. `gateway` — прокси для нових ендпоінтів.
5. Frontend — нова сторінка, модалка, кнопка.

## Goals / Non-Goals

**Goals:**
- Заморожений знімок кошика (receipt) у JSONB, що не залежить від живих `prices`.
- Публічна URL сторінка чека за `share_token`, доступна без авторизації.
- AI-коментар генерується асинхронно, без блокування відповіді.
- Адреса та координати магазину зберігаються з Zakaz.ua API в ETL.
- Нові ендпоінти не ламають жоден з існуючих (compare, shared, share/email, duplicate, import).

**Non-Goals:**
- Автоматичне створення нового кошика після завершення — user робить це сам через `CreateCartModal`.
- Повторна генерація AI-опису при повторному перегляді — текст незмінний після першого запису.
- Багатомагазинний чек (розподіл покупки між кількома магазинами) — MVP містить лише один магазин.
- Видалення або редагування чека — чеки іммутабельні.
- Push-нотифікації про готовність AI-опису — frontend робить один retry через 3-4 секунди.

## Decisions

### D1: JSONB snapshot замість FK на live prices
**Рішення**: Таблиця `receipts` зберігає `snapshot JSONB` — повний знімок магазину та товарів на момент завершення.

**Альтернативи**:
- _FK до `prices` через `recorded_at`_: складні JOIN-и при кожному читанні, ризик втрати даних при cleanup, ціни можуть змінюватися заднім числом (ETL update).
- _Нова статусна колонка `Cart.is_completed`_: не вирішує проблему незмінності цін — `compare` і так читає live `prices`.

**Ратіо**: Чек — це юридичний документ. Snapshot гарантує що число, яке user побачив у момент завершення, збережеться назавжди. JSON також спрощує читання: один SELECT без JOIN.

---

### D2: Порядок провайдерів у `PROVIDER_CHAIN` для summarize-plan
**Рішення**: Той самий `PROVIDER_CHAIN = ["groq", "gemini", "openrouter", "cerebras"]` з `build_model()`. Timeout per-provider — 4 секунди. Не чекаємо, якщо провайдер у cooldown.

**Альтернативи**:
- _Окремий chain тільки для summarize_ (без tool-calling моделей): не потрібно, бо ми і так робимо прямий виклик без tools.
- _Groq-only для summarize_ (найшвидший): якщо Groq недоступний — взагалі не матимемо AI-опису. Краще мати fallback.

**Ратіо**: Перевикористання наявної логіки `build_model()` мінімізує код. Endpoint `POST /agent/summarize-plan` буде знаходитись в тому ж `app/main.py` (чи окремому роутері), але не використовуватиме `Agent` з tools — лише `model.chat()` або еквівалент pydantic-ai.

---

### D3: BackgroundTasks vs RabbitMQ для виклику AI після complete
**Рішення**: FastAPI `BackgroundTasks` — простіше, без нових черг.

**Альтернативи**:
- _RabbitMQ черга `receipt_ai_queue`_: потрібна нова інфраструктура, consumer в cart_service або новий worker. Надмірно для однієї задачі.
- _celery/background workers_: ще складніше.

**Ратіо**: `BackgroundTasks` ідеальний: запускається після `return response`, не блокує event loop (виклик до zephyros — IO-bound через httpx), при краші процесу — AI-опис просто не зберігається (що є визначеною поведінкою, не помилкою).

**Ризик**: При restart контейнера між `return response` і виконанням background task — AI-опис не згенерується. Прийнятно: `ai_description: null` — валідний стан.

---

### D4: address/lat/lng в ETL — форматування адреси
**Рішення**: ETL форматує адресу як рядок `"{street} {building}, {city}"` при записі в PostgreSQL. `lat/lng == 0.0` трактуються як absent і зберігаються як `NULL`.

**Альтернативи**:
- _Зберігати окремо street/building/city_: три додаткові колонки замість одної. Frontend все одно відобразить рядком.
- _Завжди зберігати координати, навіть 0.0_: фронтенд отримає `lat: 0, lng: 0` → маршрут у море. Краще NULL.

---

### D5: Структура snapshot JSONB
```json
[
  {
    "store_id": "48215610",
    "store_name": "Novus Хрещатик",
    "retail_chain": "novus",
    "address": "вул. Хрещатик, 22, Київ",
    "lat": 50.4501,
    "lng": 30.5234,
    "is_complete": true,
    "items": [
      {
        "product_id": 123,
        "name": "Молоко Novus 2.5%, 1л",
        "quantity": 2,
        "price": 38.9,
        "subtotal": 77.8,
        "in_stock": true
      }
    ],
    "subtotal": 127.2
  }
]
```
Масив (а не один об'єкт) — для майбутньої фічі multi-store чека без breaking change.

---

### D6: share_token — `secrets.token_urlsafe(16)` = 22 символи
URL-safe, криптографічно безпечний. Довжина 22 символи — достатня ентропія (128 bit), коротша за UUID, читається як URL.

## Risks / Trade-offs

**[Ризик] ETL не має адреси магазину в zakazStore struct у seed.go** → Потрібно розширити `zakazStore` struct і включити `AddressDTO`/`CoordsDTO` (вже є в `DTO/SyncDTO.go`). Без цього міграція додасть колонки, але вони залишаться NULL.
> Mitigation: Оновити struct + INSERT в рамках цієї ж задачі. Перевірити на staging через `GET /api/v1/stores/`.

**[Ризик] Background task виклику AI падає без логування** → Якщо httpx.AsyncClient кидає виняток в BackgroundTask і він не перехоплений — FastAPI тихо ігнорує.
> Mitigation: Обернути весь тіло background task у `try/except`, логувати через `loguru.logger.error`.

**[Ризик] product_service Alembic міграція на `stores` (ETL-owned table)** → Alembic в product_service не повинен DROP або recreate ETL-таблиці. Міграція має бути `ADD COLUMN IF NOT EXISTS` з перевіркою.
> Mitigation: Автогенерована міграція через `alembic revision --autogenerate` з ручною перевіркою — видалити будь-який DROP і залишити тільки ADD COLUMN IF NOT EXISTS.

**[Ризик] cart_service викликає zephyros внутрішнім URL** → cart_service → zephyros через Docker network (http://zephyros_agent:8005). Але якщо zephyros ще не запустився — ConnectError в background task.
> Mitigation: Перехоплюється через try/except. `ai_description` залишиться null — прийнятно.

**[Trade-off] Відсутність push для AI-опису** → Frontend робить один retry через 3-4 секунди. Якщо AI відповів за 5 секунд — user побачить null, потім при наступному відкриванні сторінки — отримає текст. Прийнятно для MVP.

## Migration Plan

1. **ETL deploy** (окремо, перше): додати `address/lat/lng` до `migrate.go` і `seed.go`. Після рестарту ETL — колонки з'являться, нові дані записуватимуться.
2. **product_service Alembic**: `alembic revision --autogenerate -m "add address lat lng to stores"`, перевірити вручну, `alembic upgrade head` при deploy.
3. **cart_service Alembic**: `alembic revision --autogenerate -m "add receipts table"`, перевірити вручну.
4. **cart_service deploy**: нові ендпоінти active, старі не змінені.
5. **zephyros_agent deploy**: новий ендпоінт `/agent/summarize-plan` — безпечно додати, не впливає на `/agent/chat`.
6. **gateway deploy**: нові прокси маршрути — безпечно.
7. **Frontend deploy**: нові компоненти і сторінка — безпечно (нові роути, старі не змінені).

**Rollback**: Кожен сервіс можна відкотити незалежно. Таблиця `receipts` залишається порожньою при rollback cart_service — не впливає на решту.

## Open Questions

- **Чи показувати кнопку "Позначити як куплено" у MVP?** Мокап містить цю кнопку, але завдання не описує жодної логіки за нею. Варіант: показати кнопку, але вона просто закриває/повертає назад, без backend-дії. Або прибрати з MVP.
- **Де саме розміщений `CartSummary.tsx`?** Назва вказана у завданні, але точний шлях потрібно верифікувати при реалізації (ймовірно `src/modules/Cart/components/CartSummary.tsx`).
- **Точки входу в "Мої чеки"**: де в UI буде кнопка відкриття модалки? Пропозиція: у `CartSummary.tsx` або у header/profile. Потребує підтвердження.
