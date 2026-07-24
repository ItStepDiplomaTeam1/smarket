## Why

При переході на сторінку детального перегляду товару (`ProductDetail`) у фронтенд-застосунку користувачі на 1-2 секунди бачать помилковий екран "Товар не знайдено", після чого сторінка раптово оновлюється та показує товар. Це відбувається через те, що при повторній спробі запиту (retry) блок `finally` передчасно скидає прапорець `isLoading` до завершення ретраю, а також через крос-доменні обмеження `SameSite=Lax` для `refresh_token` cookie при запитах з Cloudflare Pages на API.

## What Changes

- **Фронтенд (`ProductDetail.tsx`)**:
  - Переробити логіку `fetchProduct`: блок `finally` або прапорець `isLoading = false` повинен викликатися **тільки після завершення всіх спроб (retries)**, а не після першої невдалої спроби.
  - Розділити відображення стану завантаження (`isLoading`), помилки 404 (`notFound`) та відсутності даних `!product`, щоб уникнути помилкового миготіння екрана "Товар не знайдено" під час повторних запитів.
- **Бекенд (`auth_service`)**:
  - Оновити конфігурацію кукі `refresh_token`: встановити `SameSite=None; Secure` для коректної крос-доменної передачі між Cloudflare Pages (`smarket-7go.pages.dev`) та API (`smarket-api.duckdns.org`).

## Capabilities

### New Capabilities
- `product-detail-loading-resilience`: Забезпечення коректного стану завантаження, обробки ретраїв та відсутності помилкових спалахів "Товар не знайдено" при відкритті детальної сторінки товару.

### Modified Capabilities
- `cross-domain-auth-cookies`: Оновлення налаштувань SameSite/Secure для refresh-токена для усунення блокувань браузером крос-доменних cookie.

## Impact

- `apps/react/frontend/my-react-app/src/pages/ProductDetail/ui/ProductDetail.tsx`
- `services/auth_service/app/main.py` або `routers/auth.py` (налаштування Cookie `SameSite`)
