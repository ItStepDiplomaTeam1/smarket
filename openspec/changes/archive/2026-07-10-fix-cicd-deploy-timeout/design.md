## Context

Деплой-конвейер Smarket запускается на self-hosted GitHub Actions runner, который находится **на том же Hetzner-сервере**, де виконується продакшн-стек. При деплої CI виконує `docker compose up -d --remove-orphans --wait --wait-timeout 240`. Флаг `--wait` означає, що команда блокується до тих пір, поки **всі** сервіси зі включеним healthcheck не стануть `healthy`.

**Поточна проблема — ланцюг блокувань:**

```
docker compose up --wait
    │
    ├─ gateway_service (service_healthy) ◄── блокує весь compose
    │       │
    │       ├─ search_service (service_healthy)
    │       │       └─ залежить від: meilisearch (service_healthy)
    │       │               └─ meilisearch зайнятий індексацією від ETL
    │       │
    │       └─ zephyros_agent (service_healthy)
    │
    └─ products_etl (немає healthcheck → --wait ігнорує)
            └─ при старті НЕГАЙНО запускає ETL-цикл
                    └─ POST /api/v1/index → meilisearch (тисячі документів кожні 6 хв)
                            └─ meilisearch перевантажений → healthcheck search_service FAILS
                                    └─ gateway_service чекає → TIMEOUT 240s
```

**Спостереження з логів CI:**
- Батчі по 788–1878 документів надходять кожні ~6 хвилин (17:15, 17:22, 17:28, 17:34)
- `search_service` відповідає нормально, але `meilisearch` під навантаженням ETL не встигає звітувати `healthy`
- `--wait-timeout 240` (4 хв) — критично мало для цього сценарію
- `products_etl` не має healthcheck → `--wait` не може перевірити його стан і просто чекає решту

## Goals / Non-Goals

**Goals:**
- Деплой завершується за **< 5 хвилин** на Hetzner-сервері
- Усі сервіси стартують і стають `healthy` незалежно від стану ETL-циклу
- `products_etl` має healthcheck, щоб CI міг відслідковувати його стан
- CI явно передає `SMARKET_DEPLOY_WAIT_TIMEOUT` без покладання на shell-дефолт

**Non-Goals:**
- Оптимізація швидкості самого ETL-парсингу (окрема задача)
- Зміна логіки `search_service` чи `meilisearch`
- Зміна Python-коду сервісів (тільки конфіги)

## Decisions

### 1. `gateway_service.depends_on.search_service`: `service_healthy` → `service_started`

**Проблема:** `gateway` чекає `search_service` як `service_healthy`, але той залежить від `meilisearch`, який перевантажений ETL. Це блокує весь compose на старті.

**Рішення:** Змінити на `service_started`. Gateway вже має свою логіку retry/fallback для search (httpx з таймаутом). Якщо search недоступний — запит просто поверне 503, що краще ніж повний збій деплою.

**Альтернативи розглянуті:**
- *Збільшити таймаут meilisearch healthcheck* — не вирішує корінь, лише відкладає
- *Відключити ETL на час деплою* — складно і ненадійно з CI/CD

### 2. `gateway_service.depends_on.zephyros_agent`: `service_healthy` → `service_started`

Аналогічно — `zephyros_agent` є допоміжним AI-сервісом і не є критичним для базового функціонування gateway. Вже використовує `service_started` у деяких залежностях.

### 3. Додати healthcheck для `products_etl`

`products_etl` вже має HTTP-сервер на порту `8082` з ендпоінтом `/health`. Потрібно лише додати блок `healthcheck` в `docker-compose.yml`. Це дозволить `--wait` підтверджувати його стан і CI-логи бачитимуть реальний статус.

```yaml
healthcheck:
  test: ["CMD-SHELL", "wget -qO- http://127.0.0.1:8082/health || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 5
  start_period: 30s
```

`wget` використовується замість `curl`, бо Go-образи зазвичай мають `wget` і не мають `curl`. Якщо є сумніви — перевірити наявність через `which curl || which wget`.

### 4. `SMARKET_DEPLOY_WAIT_TIMEOUT` в CI: дефолт → явне значення `360`

Поточний CI-рядок: `--wait-timeout "${SMARKET_DEPLOY_WAIT_TIMEOUT:-240}"`. Значення 240 секунд (4 хвилини) неочевидно мале. Змінити на явний env у блоці `env:` deploy-шагу: `SMARKET_DEPLOY_WAIT_TIMEOUT: "360"`. 6 хвилин — достатньо для старту всього стеку без ETL-навантаження на healthcheck.

### 5. `products_etl` НЕ потрібно включати в залежності `gateway_service`

ETL — фоновий воркер, а не API. Він не повинен бути в шляху `service_healthy` gateway. Якщо ETL не стартував — фронтенд і API продовжують працювати зі старими даними.

## Risks / Trade-offs

| Ризик | Мітігація |
|---|---|
| `gateway` стартує до `search_service` → перші запити повертають 503 | Фронтенд вже обробляє 503 від search. Стартове вікно < 30s. |
| `products_etl` healthcheck падає якщо Go HTTP-сервер не стартував | `start_period: 30s` дає час Go-процесу ініціалізуватися |
| `wget` відсутній в Go-образі | Перевірити Dockerfile ETL; якщо немає — використати `nc -z 127.0.0.1 8082` |
| Таймаут 360s може не вистачити при холодному старті MongoDB | MongoDB має `start_period: 120s` + `retries: 30` — це окрема проблема, не в скоупі |

## Migration Plan

1. Змінити `infra/docker-compose.yml` (локально перевірити через `docker compose config`)
2. Змінити `.github/workflows/ci.yml` (додати env variable)
3. Запустити деплой на `develop` — перевірити тривалість deploy-шагу
4. **Rollback:** Повернути `service_healthy` для `search_service` і `zephyros_agent` у `depends_on`, видалити healthcheck ETL — 1 коміт

## Open Questions

- Чи є `curl` або `wget` в поточному Docker-образі `products_etl`? Якщо ні — використати `nc` або простіший shell-скрипт.
- Чи варто взагалі прибрати `products_etl` з `--wait` через `profiles` або окремий compose override? (Для майбутньої оптимізації)
