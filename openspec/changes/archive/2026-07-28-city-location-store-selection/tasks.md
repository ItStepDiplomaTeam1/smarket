## 1. Backend Implementation (Product Service & Search Service)

- [x] 1.1 Додати ендпоінт `GET /api/v1/stores/cities` у `services/product_service/app/routers/stores.py`
- [x] 1.2 Оновити регістронезалежний фільтр за `city` у `GET /api/v1/stores/` в `product_service`
- [x] 1.3 Додати параметр `city` для фільтрації товарів у `GET /api/v1/products` (`services/product_service/app/routers/products.py`)
- [x] 1.4 Підтримати поле/параметр `city` у `services/search_service/src/handlers/get_search.rs` (Rust Meilisearch proxy)
- [x] 1.5 Написати unit/integration тести для нових ендпоінтів та фільтрації за містом

## 2. Frontend Infrastructure & State (`apps/react`)

- [x] 2.1 Створити Zustand стор `locationStore` у `apps/react/frontend/my-react-app/src/shared/store/locationStore.ts`
- [x] 2.2 Реалізувати збереження обраного міста у `localStorage` та синхронізацію із профілем `user.settings.city`
- [x] 2.3 Створити модальне вікно `CitySelectorModal.tsx` з інпут-пошуком міст та геолокацією

## 3. UI Integration & Store/Catalog Filtering

- [x] 3.1 Інтеграція віджета вибору міста з іконкою `MapPin` у `Header.tsx`
- [x] 3.2 Оновити сторінку `Mainpart.tsx` у `/shops` для відображення саме тієї мережі й магазинів, що знаходяться у вибраному місті клієнта
- [x] 3.3 Передавати `city` у всі API запити каталогу та пошуку продуктів
- [x] 3.4 Перевірити коректність роботи додатку в темній та світлій темі
