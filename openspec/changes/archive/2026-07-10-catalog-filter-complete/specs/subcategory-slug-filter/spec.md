## ADDED Requirements

### Requirement: Search filtering by subcategory slug
The system SHALL support filtering search results by one or more subcategory slugs (`subcategory_slug`). Multiple values MUST be combined with OR logic so results from all selected subcategories are returned.

#### Scenario: Filtering search results by a single subcategory slug
- **WHEN** the search request is sent with `?subcategory_slug=molochni-produkty`
- **THEN** the search results contain only products whose category_slug is 'molochni-produkty' (or matches it)

#### Scenario: Filtering search results by multiple subcategory slugs
- **WHEN** the search request is sent with `?subcategory_slug=molochni-produkty&subcategory_slug=hlib-ta-vypichka`
- **THEN** the search results contain products from either of those subcategories
