## ADDED Requirements

### Requirement: Multi-store selection filters search results by all selected chains
The system SHALL accept multiple `retail_chain` values in a single search request and return results matching ANY of the specified chains (OR logic).

#### Scenario: Single chain selection
- **WHEN** the frontend sends `?retail_chain=atb`
- **THEN** search results contain only products available in ATB stores

#### Scenario: Multiple chain selection
- **WHEN** the frontend sends `?retail_chain=atb&retail_chain=silpo`
- **THEN** search results contain products available in ATB OR Sільпо stores

#### Scenario: No chain filter applied
- **WHEN** the request contains no `retail_chain` parameter
- **THEN** search results include products from all chains
