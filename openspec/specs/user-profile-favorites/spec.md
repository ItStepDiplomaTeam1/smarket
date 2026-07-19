# user-profile-favorites Specification

## Purpose
TBD - created by archiving change user-profile-favorites. Update Purpose after archive.
## Requirements
### Requirement: User profile displays actual favorite products
The user profile page SHALL display the actual products saved in the user's favorites list from `useFavoritesStore` instead of hardcoded mock data.

#### Scenario: Display favorites when user has saved products
- **WHEN** the user has logged in and has items in their favorites list
- **THEN** the "Обрані товари" section of the profile page displays those actual products with their correct titles, images, and prices.

#### Scenario: Load favorites if not already loaded
- **WHEN** the user opens the profile page and the favorites store state is not loaded (`isLoaded` is false)
- **THEN** the application SHALL invoke the `load` action of `useFavoritesStore` to fetch the favorites from the backend.

#### Scenario: Navigate to product detail from favorite item
- **WHEN** the user clicks on a favorite product item in the profile list
- **THEN** the application SHALL navigate to the product detail page (`/product/{product_id}`).

#### Scenario: Display fallback when there are no favorites
- **WHEN** the user's favorites list is empty
- **THEN** the "Обрані товари" section SHALL display a placeholder text indicating that the list is empty, with a link to navigate to the catalog page.

