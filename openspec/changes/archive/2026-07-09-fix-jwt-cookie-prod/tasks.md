## 1. Backend: Централізована функція параметрів cookie

- [x] 1.1 Створити хелпер-функцію `_build_cookie_params()` у `services/auth_service/routers/auth.py`, що читає `COOKIE_SECURE`, `COOKIE_SAMESITE`, `COOKIE_DOMAIN` з env і повертає словник `dict` із ключами `key`, `httponly`, `secure`, `samesite`, `max_age`, `path`, та опціонально `domain`
- [x] 1.2 Замінити всі 4 виклики `response.set_cookie(...)` у `services/auth_service/routers/auth.py` (register, login, refresh, logout/delete_cookie) на використання `_build_cookie_params()`. Додати `path="/"` до ендпоінту `/register` (рядок 149), де його зараз немає
- [x] 1.3 Створити аналогічну функцію `_build_cookie_params()` у `services/auth_service/routers/oauth.py` (або імпортувати зі спільного модуля) і замінити обидва виклики `response.set_cookie(...)` (Google OAuth, Telegram OAuth) на її використання

## 2. Backend: Конфігурація змінних оточення

- [x] 2.1 Додати змінні `COOKIE_SAMESITE` та `COOKIE_DOMAIN` до `services/auth_service/.env` з дефолтними значеннями для локальної розробки (`COOKIE_SAMESITE=lax`, `COOKIE_DOMAIN=` порожній)
- [x] 2.2 Додати змінні `COOKIE_SAMESITE` та `COOKIE_DOMAIN` до `services/auth_service/.env.example` з коментарями
- [x] 2.3 Додати змінні `COOKIE_SAMESITE` та `COOKIE_DOMAIN` до `infra/docker-compose.yml` у секцію `auth_service` environment, з production-значеннями `COOKIE_SAMESITE=none`, `COOKIE_SECURE=true`, `COOKIE_DOMAIN=smarket-api.duckdns.org`

## 3. Frontend: Виправлення Zustand rehydration

- [x] 3.1 У файлі `apps/react/frontend/my-react-app/src/modules/Auth/store/authStore.ts` видалити або замінити хук `onRehydrateStorage`, щоб він НЕ викликав `state.logout()` при простроченому access-токені. Залишити `onRehydrateStorage` порожнім або видалити повністю
- [x] 3.2 Переконатися, що axios request interceptor у `apps/react/frontend/my-react-app/src/shared/api/apiClient.ts` коректно обробляє сценарій, коли Zustand має прострочений токен при першому запиті після перезавантаження (перевірити, що `isTokenExpired` → proactive refresh працює)

## 4. Gateway: Верифікація CORS

- [x] 4.1 Перевірити, що `https://smarket-7go.pages.dev` присутній у списку `origins` у `services/gateway/app/main.py` (вже додано на рядку 47). Переконатися, що `allow_credentials=True` встановлено (вже на рядку 52)

## 5. Верифікація

- [x] 5.1 Перевірити, що cookie-параметри коректно формуються для production env: `SameSite=None`, `Secure=True`, `Path=/`, `Domain=smarket-api.duckdns.org`
- [x] 5.2 Перевірити, що cookie-параметри коректно формуються для local dev env: `SameSite=Lax`, `Secure=False`, `Path=/`, без `Domain`
- [x] 5.3 Перевірити, що фронтенд НЕ викликає logout при перезавантаженні сторінки з простроченим access-токеном у localStorage
