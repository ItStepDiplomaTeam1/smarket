## Why

Авторизація в продакшені повністю не працює після перезавантаження сторінки. Користувачі змушені логінитися/реєструватися заново кожного разу. Причина — три незалежні баги, що сукупно унеможливлюють збереження сесії:

1. Фронтенд (`smarket-7go.pages.dev`) і бекенд (`smarket-api.duckdns.org`) знаходяться на різних доменах, але куки відправляються з `SameSite=Lax`, через що браузер блокує їх передачу в крос-доменних AJAX-запитах.
2. Zustand auth store при перезавантаженні сторінки негайно стирає прострочений access-токен (TTL 15 хв) замість того, щоб дозволити інтерцепторам тихо оновити його через refresh endpoint.
3. Ендпоінт `/register` не встановлює `path="/"` для куки `refresh_token`, через що браузер обмежує її видимість шляхом запиту.

## What Changes

- **BREAKING** Параметр `SameSite` для куки `refresh_token` змінюється з `lax` на `none` в продакшені, щоб забезпечити крос-доменну передачу між `pages.dev` і `duckdns.org`.
- Параметр `Secure` для куки `refresh_token` стає конфігурованим через змінну оточення `COOKIE_SECURE` (за замовчуванням `true` в проді, `false` локально).
- Додається нова змінна оточення `COOKIE_SAMESITE` для гнучкого керування політикою кук (`none` у проді, `lax` локально).
- Ендпоінт `/register` у `auth_service` отримує `path="/"` для куки — консистентно з `/login`, `/refresh` та OAuth ендпоінтами.
- Zustand `onRehydrateStorage` хук більше не викликає `logout()` при простроченому access-токені, а натомість ініціює silent refresh через існуючий axios interceptor.
- Додається `domain` параметр для куки у продакшені через конфігурацію.

## Capabilities

### New Capabilities
- `cross-domain-auth-cookies`: Конфігурація та передача httpOnly refresh-token куки між різними доменами (`pages.dev` ↔ `duckdns.org`) з коректними параметрами `SameSite`, `Secure`, `Path` та `Domain`.

### Modified Capabilities
_Немає існуючих спеків, що змінюються._

## Impact

- **Backend (`services/auth_service/routers/auth.py`)**: Зміна всіх 4-х викликів `response.set_cookie()` — додавання конфігурованих `samesite`, `secure`, `path`, `domain`.
- **Backend (`services/auth_service/routers/oauth.py`)**: Зміна 2-х викликів `response.set_cookie()` — аналогічні зміни.
- **Backend (`services/auth_service/.env` / Docker env)**: Додавання змінних `COOKIE_SAMESITE`, `COOKIE_DOMAIN`.
- **Backend (`services/gateway/app/main.py`)**: Можлива верифікація CORS origins для `https://smarket-7go.pages.dev`.
- **Frontend (`apps/react/.../authStore.ts`)**: Зміна логіки `onRehydrateStorage` — видалення агресивного logout при простроченому токені.
- **Infra (`infra/docker-compose.yml`)**: Додавання нових змінних оточення для `auth_service`.
