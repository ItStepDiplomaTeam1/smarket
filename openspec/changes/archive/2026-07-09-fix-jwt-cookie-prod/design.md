## Context

Smarket — агрегатор цін на продукти. Фронтенд (`https://smarket-7go.pages.dev`, Cloudflare Pages) і бекенд (`https://smarket-api.duckdns.org`, API Gateway на порту 8080) хостяться на **різних доменах**. Аутентифікація побудована на парі JWT-токенів:

- **Access Token** (15 хв, передається через `Authorization: Bearer` заголовок, зберігається у Zustand `persist` → `localStorage`).
- **Refresh Token** (7 днів, передається через `httpOnly` cookie `refresh_token`).

Потік запитів: `Browser → Gateway (proxy) → auth_service`. Gateway проксіює запити через `httpx.AsyncClient` з потоковою відповіддю (`StreamingResponse`), зберігаючи заголовки відповіді, включно з `Set-Cookie`.

**Поточний стан:** Авторизація в продакшені ламається після перезавантаження сторінки. Три незалежні баги блокують нормальну роботу.

## Goals / Non-Goals

**Goals:**
- Забезпечити роботу `refresh_token` cookie між `pages.dev` і `duckdns.org` (крос-доменна передача).
- Зберегти працездатність локальної розробки (HTTP, `localhost`).
- Зробити параметри cookie конфігурованими через змінні оточення.
- Виправити консистентність `path="/"` для всіх ендпоінтів, що встановлюють cookie.
- Усунути агресивний logout на фронтенді при перезавантаженні сторінки.

**Non-Goals:**
- Міграція на single-domain архітектуру (reverse proxy перед фронтом і бекендом).
- Перехід від cookie-based refresh на token rotation в `localStorage`.
- Зміна TTL access/refresh токенів.
- Впровадження CSRF-захисту (при `SameSite=None` рекомендується, але це окремий скоуп).

## Decisions

### 1. `SameSite=None; Secure` для продакшену

**Рішення:** У продакшені куки `refresh_token` встановлюються з `SameSite=None` та `Secure=True`.

**Обґрунтування:** Фронтенд і бекенд знаходяться на різних eTLD+1 доменах (`pages.dev` vs `duckdns.org`). Браузери (Chrome 80+, Firefox 86+, Safari 15.4+) блокують передачу кук з `SameSite=Lax` у крос-доменних AJAX-запитах. Тільки `SameSite=None; Secure` дозволяє крос-доменну передачу.

**Альтернатива — reverse proxy:** Поставити Nginx/Caddy як reverse proxy на одному домені для обох сервісів (`smarket.com/api` → gateway, `smarket.com/` → Cloudflare Pages). Це усунуло б проблему крос-доменності, але потребує значної інфраструктурної зміни.

**Альтернатива — зберігати refresh в localStorage:** Простіше, немає проблем з куками, але суперечить best practices безпеки (XSS-атака може вкрасти refresh token).

### 2. Конфігурація cookie через змінні оточення

**Рішення:** Додати три env-змінні до `auth_service`:
- `COOKIE_SECURE` (вже існує, default `false` через Docker Compose) — `true`/`false`.
- `COOKIE_SAMESITE` (нова, default `lax`) — `lax`/`none`/`strict`.
- `COOKIE_DOMAIN` (нова, default порожній) — домен cookie, напр. `.duckdns.org`.

**Обґрунтування:** Дозволяє мати різні конфігурації для локальної розробки (HTTP, `SameSite=Lax`, без domain) та продакшену (HTTPS, `SameSite=None`, з domain).

### 3. Централізована хелпер-функція `_build_cookie_params()`

**Рішення:** Замість дублювання параметрів у 6+ місцях, створити одну функцію `_build_cookie_params()`, що повертає словник з усіма параметрами cookie.

**Обґрунтування:** Поточний код дублює параметри в `auth.py` (4 місця) та `oauth.py` (2 місця). При додаванні `domain` і `samesite` ризик неконсистентності зростає. Єдина функція усуває цей ризик.

### 4. Silent refresh замість logout при rehydrate

**Рішення:** Видалити перевірку `isTokenExpired` з хука `onRehydrateStorage` в Zustand. Залишити існуючий request interceptor в `apiClient.ts`, який вже реалізує proactive token refresh.

**Обґрунтування:** Request interceptor вже містить повну логіку: перевірку протермінованості → виклик `/refresh` → оновлення стейту → чергування конкурентних запитів. Дублювати цю логіку в rehydrate не потрібно. Достатньо просто не стирати стейт — перший API-запит після перезавантаження автоматично оновить токен.

### 5. CORS: додати `https://smarket-7go.pages.dev` у allow_origins

**Рішення:** Переконатися, що `https://smarket-7go.pages.dev` є в `origins` списку Gateway. Перевірити, що фронтенд Cloudflare Pages preview-деплоїв (`*.smarket-7go.pages.dev`) також покриті.

**Поточний стан:** Домен `https://smarket-7go.pages.dev` вже додано в `main.py` (рядок 47). Потрібно лише переконатися, що preview-деплої Cloudflare Pages (`*.smarket-7go.pages.dev`) також працюють, якщо це потрібно.

## Risks / Trade-offs

**[`SameSite=None` знижує захист від CSRF]** → Для повного захисту рекомендується у майбутньому впровадити CSRF-токен або double-submit cookie pattern. Поточний рівень ризику прийнятний, оскільки refresh token використовується лише для `/refresh` (POST), а бекенд не виконує state-changing операцій за одним лише refresh token.

**[Браузерні обмеження Third-Party Cookies]** → Safari ITP та Chrome Privacy Sandbox поступово обмежують third-party cookies. Якщо `duckdns.org` потрапить під блокування, cookie перестане передаватися. Довгострокове рішення — перехід на single-domain архітектуру (reverse proxy). На даний момент `duckdns.org` не у списку blocked tracker domains.

**[Rollback strategy]** → Якщо після деплою проблеми не зникнуть, можна повернути `COOKIE_SAMESITE=lax` через env-змінну без зміни коду. Це дозволяє миттєвий rollback.
