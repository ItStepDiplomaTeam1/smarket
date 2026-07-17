## ADDED Requirements

### Requirement: Search catalog filtering by store chain
The system SHALL support filtering search results and product catalog items by supermarket chain (retail_chain).

#### Scenario: Filtering catalog by ATB chain on frontend
- **WHEN** the user selects the "ATB" store filter in the catalog UI
- **THEN** the frontend query parameter `retail_chain` is set to "atb"

#### Scenario: Filtering catalog by Novus chain in AI agent
- **WHEN** the AI agent calls `search_catalog` with store_id "novus"
- **THEN** the request parameter `retail_chain` is set to "novus"
