## ADDED Requirements

### Requirement: Offer-type filter narrows search results by promotional status or recency
The system SHALL accept one or more `offer_type` values (`promo`, `save`, `new`) and filter search results accordingly.

#### Scenario: Promo filter returns only discounted products
- **WHEN** the frontend sends `?offer_type=promo`
- **THEN** search results contain only products where `old_price IS NOT NULL` (i.e., have an active price reduction)

#### Scenario: Save filter behaves identically to promo
- **WHEN** the frontend sends `?offer_type=save`
- **THEN** search results contain only products where `old_price IS NOT NULL`

#### Scenario: New filter returns recently added products
- **WHEN** the frontend sends `?offer_type=new`
- **THEN** search results contain only products whose `created_at_ts` is within the last 14 days (computed at request time)

#### Scenario: Combined offer types apply union (OR) logic
- **WHEN** the frontend sends `?offer_type=promo&offer_type=new`
- **THEN** search results contain products that are EITHER discounted OR newly added (OR across offer types)

#### Scenario: No offer_type filter
- **WHEN** the request contains no `offer_type` parameter
- **THEN** search results are not filtered by promotional status or recency

### Requirement: ETL indexes product creation timestamp as filterable numeric field
The `products_etl` service SHALL include a `created_at_ts` field (Unix timestamp in seconds, `i64`) in every `SearchProductDocument` sent to `search_service`, derived from `products.created_at` in PostgreSQL.

#### Scenario: New product has created_at_ts set
- **WHEN** ETL indexes a product with `created_at = '2026-06-01T10:00:00Z'`
- **THEN** the Meilisearch document contains `created_at_ts = 1748779200` (corresponding Unix timestamp)
