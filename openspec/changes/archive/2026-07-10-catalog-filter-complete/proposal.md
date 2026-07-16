## Why

`GET /api/v1/search/search` — єдиний URL для каталогу на фронтенді — приймає параметри `subcategory_slug` та `category_slug` (для top-level категорій), які не підтримуються належним чином бекендом: `subcategory_slug` ігнорується взагалі, а `category_slug` фільтрує за точним співпадінням (що повертає 0 результатів через мережеві суфікси на кшталт `-silpo` чи `-metro` в індексі Meilisearch). Нам потрібно зробити всю логіку на бекенді, щоб фронтенд міг фільтрувати без жодних змін у своїх запитах.

## What Changes

- `search_service` (`get_search.rs`): додати параметр `subcategory_slug: Vec<String>` до `SearchRequest` та `ProductFilters`.
- `search_service` (`get_search.rs`): реалізувати динамічне мапування та розширення слагов категорій та підкатегорій:
  - Якщо в `category_slug` приходить один із фронтенд-ідентифікаторів категорій (`drinks`, `baby`, `chemistry`, `beauty`, `home`, `zoo`), бекенд автоматично фільтрує по відповідному `main_category_id` (наприклад, `drinks` -> `main_category_id = 2`, `baby` -> `8` тощо).
  - Якщо в `subcategory_slug` приходять слаги підкатегорій (наприклад, `molochni-produkty`, `vegetables` тощо), бекенд автоматично мапить їх на префікси (наприклад, `vegetables` -> `fruits-and-vegetables`) та генерує список слагов для всіх активних мереж магазинів (`-silpo`, `-novus`, `-metro` тощо) для точного пошуку через оператор `IN` в Meilisearch.
- Фронтенд залишається без змін, всі запити надсилаються як і раніше, але починають коректно фільтруватися.

## Capabilities

### New Capabilities

- `subcategory-slug-filter`: Підтримка `?subcategory_slug` (multi-value) в `search_service` — мапінг та авторозширення слагов підкатегорій для пошуку через `IN` у Meilisearch.

### Modified Capabilities

- `search-filtering`: Модифікація поведінки фільтра `category_slug` на бекенді — автоматичний мапінг на `main_category_id` для крос-стор фільтрації без зміни фронтенду.

## Impact

- **`services/search_service/src/handlers/get_search.rs`** — `SearchRequest`, `ProductFilters`, filter builder.
- Без змін: frontend (`apps/react`), gateway, product_service, ETL, БД.
