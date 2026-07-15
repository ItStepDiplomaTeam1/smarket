## Why

The homepage components (search bar, categories section, popular products section, and final CTA section) are currently static templates or placeholders. Enabling clickability and interactivity on these elements will significantly improve the user journey, allowing users to naturally transition from landing on the homepage to searching the catalog, viewing category selections, comparing prices, and accessing their cart.

## What Changes

- **Hero Search Interactivity**:
  - Make the search input in the Hero section functional.
  - When the "Порівняти ціни" button is clicked (or Enter is pressed), navigate the user to `/catalog` with the query parameter set (e.g., `/catalog?q=...` or `/catalog?search=...`).
  - Configure the catalog page (`MainContent.tsx`) to read and initialize the search filter from the URL search query parameters.
- **Categories Section Navigation**:
  - Connect the category cards (Products, Drinks, Baby, Chemistry, Beauty, Home) to redirect the user to `/catalog` with the corresponding `category_slug` query parameter.
- **Popular Products Interactivity**:
  - Connect the "Порівняти" button on popular product cards to navigate directly to `/catalog` with the respective product title pre-filled as the search query.
- **Final CTA Navigation**:
  - Connect the "Створити кошик" button to navigate to `/cart`.
  - Connect the "Переглянути акції" link to navigate to `/catalog?offer_type=promo`.

## Capabilities

### New Capabilities
- `homepage-interactivity`: Frontend navigation, search connectivity, and filter parsing on the Smarket homepage and catalog pages.

### Modified Capabilities
<!-- None -->

## Impact

- **Affected components**:
  - Homepage components: [Hero.tsx](file:///c:/Users/ashfromsky/PycharmProjects/smarket/apps/react/frontend/my-react-app/src/modules/Home/components/Hero.tsx), [CategoriesSec.tsx](file:///c:/Users/ashfromsky/PycharmProjects/smarket/apps/react/frontend/my-react-app/src/modules/Home/components/CategoriesSec.tsx), [ProductsSec.tsx](file:///c:/Users/ashfromsky/PycharmProjects/smarket/apps/react/frontend/my-react-app/src/modules/Home/components/ProductsSec.tsx), and [FinalCTA.tsx](file:///c:/Users/ashfromsky/PycharmProjects/smarket/apps/react/frontend/my-react-app/src/modules/Home/components/FinalCTA.tsx).
  - Catalog page: [MainContent.tsx](file:///c:/Users/ashfromsky/PycharmProjects/smarket/apps/react/frontend/my-react-app/src/modules/Catalog/components/MainContent.tsx) to read search query parameters on mount and apply them to the state.
