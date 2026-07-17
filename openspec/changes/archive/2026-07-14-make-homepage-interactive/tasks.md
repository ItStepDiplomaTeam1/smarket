## 1. Homepage Interactivity Implementation

- [x] 1.1 Connect search bar input and "Порівняти ціни" button in `Hero.tsx` to react-router-dom navigation (to `/catalog?q=...`).
- [x] 1.2 Connect category cards in `CategoriesSec.tsx` to redirect to `/catalog?category=...` using pre-mapped slug values.
- [x] 1.3 Connect "Порівняти" buttons in `ProductsSec.tsx` to redirect to `/catalog?q=...` using pre-mapped product title queries.
- [x] 1.4 Connect "Створити кошик" and "Переглянути акції" buttons/links in `FinalCTA.tsx` to redirect to `/cart` and `/catalog?offer_type=promo` respectively.

## 2. Catalog Page Parameter Synchronization

- [x] 2.1 Integrate `useSearchParams` hook from `react-router-dom` in `MainContent.tsx` of Catalog page.
- [x] 2.2 Parse `q` or `search` parameters from the URL and initialize the local `searchQuery` and `debouncedSearch` state.
- [x] 2.3 Parse the `category` query parameter and initialize the `selectedCategory` state.

## 3. Verification & Testing

- [x] 3.1 Verify navigation flows on the local build.
- [x] 3.2 Verify search input value persists and triggers catalog product load on direct landing.
- [x] 3.3 Verify category selection and search query values pre-fill matching filters on the catalog page.
