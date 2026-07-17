## MODIFIED Requirements

### Requirement: Search catalog filtering by store chain
The system SHALL support filtering search results and product catalog items by one or more supermarket chains (`retail_chain`). Multiple values MUST be combined with OR logic so results from all selected chains are returned.

#### Scenario: Filtering catalog by ATB chain on frontend
- **WHEN** the user selects the "ATB" store filter in the catalog UI
- **THEN** the frontend query parameter `retail_chain` is set to `atb` and search results contain only ATB products

#### Scenario: Filtering catalog by Novus chain in AI agent
- **WHEN** the AI agent calls `search_catalog` with store_id "novus"
- **THEN** the request parameter `retail_chain` is set to `novus`

#### Scenario: Filtering catalog by multiple chains simultaneously
- **WHEN** the user selects both "ATB" and "Silpo" in the catalog UI
- **THEN** the frontend sends `retail_chain=atb&retail_chain=silpo` and results include products from BOTH chains

## ADDED Requirements

### Requirement: Cross-store category filter via main_category_id
The system SHALL accept a `main_category_id` integer query parameter in `GET /api/v1/search/search` and restrict results to products whose Meilisearch document has a matching `main_category_id` value. This enables top-level category browsing across all stores without store-specific slug dependencies.

#### Scenario: Category tab click sends main_category_id
- **WHEN** the user clicks a top-level category tab (e.g., "Продукти", id=1)
- **THEN** the search request includes `?main_category_id=1` and results are restricted to products with `main_category_id = 1`

#### Scenario: No main_category_id returns all categories
- **WHEN** the search request omits `main_category_id`
- **THEN** results are not filtered by category
