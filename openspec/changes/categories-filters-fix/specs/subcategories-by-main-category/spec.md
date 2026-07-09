## ADDED Requirements

### Requirement: Subcategories endpoint returns categories grouped under a main category
The `product_service` SHALL expose `GET /api/v1/products/categories/{main_category_id}/subcategories` that returns all non-hidden `Category` records where `main_category_id` matches the path parameter, along with a `product_count` showing how many visible (non-hidden) products belong to each subcategory.

#### Scenario: Valid main_category_id with subcategories
- **WHEN** a GET request is made to `/api/v1/products/categories/1/subcategories`
- **THEN** the response is HTTP 200 with a JSON array of objects, each containing `id`, `slug`, `name`, `main_category_id`, and `product_count`

#### Scenario: main_category_id with no subcategories returns empty array
- **WHEN** a GET request is made to `/api/v1/products/categories/99/subcategories` and no categories exist with `main_category_id = 99`
- **THEN** the response is HTTP 200 with an empty JSON array `[]`

#### Scenario: Hidden categories are excluded
- **WHEN** a category has `is_hidden = true` and `main_category_id = 1`
- **THEN** it MUST NOT appear in the response for `GET /api/v1/products/categories/1/subcategories`

#### Scenario: product_count reflects only visible products
- **WHEN** a category has 50 products, 5 of which have `is_hidden = true`
- **THEN** the `product_count` for that category SHALL be 45
