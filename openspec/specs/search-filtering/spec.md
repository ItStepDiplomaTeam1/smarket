# search-filtering Specification

## Purpose
TBD - created by archiving change fix-discovered-bugs. Update Purpose after archive.
## Requirements
### Requirement: Search catalog filtering by store chain
The system SHALL support filtering search results and product catalog items by supermarket chain (retail_chain).

#### Scenario: Filtering catalog by ATB chain on frontend
- **WHEN** the user selects the "ATB" store filter in the catalog UI
- **THEN** the frontend query parameter `retail_chain` is set to "atb"

#### Scenario: Filtering catalog by Novus chain in AI agent
- **WHEN** the AI agent calls `search_catalog` with store_id "novus"
- **THEN** the request parameter `retail_chain` is set to "novus"

### Requirement: Search catalog filtering by category slug mapping
The search service SHALL support filtering search results by category slug (`category_slug`). When the parameter matches a frontend top-level category (e.g. `drinks`), the backend SHALL automatically map it to the corresponding `main_category_id` (e.g. `2`).

#### Scenario: Filtering by drinks category slug
- **WHEN** the frontend sends `?category_slug=drinks`
- **THEN** the backend filters search results by `main_category_id = 2`

