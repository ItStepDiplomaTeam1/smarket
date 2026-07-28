## Why

Клієнти сервісу Smarket потребують можливості бачити пропозиції супермаркетів та ціни на товари саме у своєму місті. Наразі система зберігає інформацію про місто для супермаркетів у БД, але клієнтський веб-додаток не надає зручного інтерфейсу для вибору локації клієнта та автоматичної фільтрації магазинів, каталогу й пошуку за населеним пунктом.

## What Changes

- **Вибір та збереження міста**: Додано Zustand-стор `locationStore` для збереження обраного міста клієнта у `localStorage` та синхронізації із профілем авторизованого користувача (`user.settings.city`).
- **Модальне вікно та віджет у Header**: Додано віджет з іконкою `MapPin` у шапці сайту, який відображає поточне місто та відкриває `CitySelectorModal` з пошуком міст і автовизначенням через Geolocation API.
- **Ендпоінт міст у Product Service**: Створено ендпоінт `GET /api/v1/stores/cities` для отримання переліку унікальних міст з активними супермаркетами та підрахунком їх кількості.
- **Фільтрація сторінки Магазини (`/shops`)**: Оновлено відображення сторінки супермаркетів для виведення саме тих магазинів, що знаходяться у вибраному місті клієнта.
- **Фільтрація у Каталозі та Пошуку**: Додано передачу параметра `city` в API каталогу (`product_service`) та пошуку (`search_service` Meilisearch).

## Capabilities

### New Capabilities
- `city-location-store-selection`: Інтеграція геолокації та вибору міста покупця для відбору супермаркетів, каталогу та товарних пропозицій у місті клієнта.

### Modified Capabilities
- `stores-proxy`: Підтримка повернення унікальних міст `GET /api/v1/stores/cities` та регістронезалежної фільтрації за параметром `city`.
- `search-filtering`: Підтримка відбору товарів і пропозицій магазинів за містом у Meilisearch search-сервісі.

## Impact

- **Frontend (`apps/react`)**: `Header.tsx`, `Mainpart.tsx` у `/shops`, Zustand store, API клієнт, нові компоненти `CitySelectorModal` та `locationStore`.
- **Product Service (`services/product_service`)**: `app/routers/stores.py`, `app/routers/products.py`.
- **Search Service (`services/search_service`)**: `src/handlers/get_search.rs`.
- **Gateway (`services/gateway`)**: Проксіювання запиту `/api/v1/stores/cities` на `product_service`.
