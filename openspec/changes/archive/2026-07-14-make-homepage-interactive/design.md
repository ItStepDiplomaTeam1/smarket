## Context

The React frontend has a landing page with mock/static elements (search input, categories list, popular products, Final CTA). These components do not react to clicks or trigger any state/page transitions. The catalog page currently manages filters locally via `useState` and does not automatically read query parameters from the URL when navigated to from outside.

## Goals / Non-Goals

**Goals:**
- Connect all homepage actions (Hero Search, Category clicks, Popular products "Порівняти", Final CTA buttons) to React Router navigation.
- Update the Catalog page (`MainContent.tsx`) to check for `q`, `search`, and `category` parameters in the URL on mount/update to pre-populate the search/filter states.

**Non-Goals:**
- Do not modify visual layout, CSS, tailwind styling, or themes.
- Do not change or add any backend endpoints.

## Decisions

1. **Routing and Parameter Sync:**
   - Use `useNavigate` from `react-router-dom` in the Home page components.
   - Use `useSearchParams` in `MainContent.tsx` (the Catalog component) to parse the initial search string and selected category.
   
2. **Category Selection Mapping:**
   - In `CategoriesSec.tsx`, map:
     - `Продукти` ➔ `/catalog` (all products)
     - `Напої` ➔ `/catalog?category=drinks`
     - `Дитячі товари` ➔ `/catalog?category=baby`
     - `Побутова хімія` ➔ `/catalog?category=chemistry`
     - `Краса та догляд` ➔ `/catalog?category=beauty`
     - `Товари для дому` ➔ `/catalog?category=home`

3. **Popular Products Search Mapping:**
   - Map each product "Порівняти" button click to `/catalog?q=<name>`:
     - `Молоко 2,5%` ➔ `/catalog?q=Молоко`
     - `Кава мелена` ➔ `/catalog?q=Кава`
     - `Підгузки` ➔ `/catalog?q=Підгузки`
     - `Соняшникова олія` ➔ `/catalog?q=Олія`
     - `Пральний порошок` ➔ `/catalog?q=Порошок`

## Risks / Trade-offs

- **[Risk] State Desynchronization** ➔ If the user updates the search input inside the Catalog page, the URL should ideally reflect the new state, or at least the initial mount state shouldn't overwrite subsequent local user edits.
  *Mitigation*: We will initialize the local `searchQuery` state from `useSearchParams` once on mount or read it using a `useEffect` that runs only when the URL changes.
