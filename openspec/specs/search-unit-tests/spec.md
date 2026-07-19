# search-unit-tests Specification

## Purpose
TBD - created by archiving change backend-test-coverage. Update Purpose after archive.
## Requirements
### Requirement: Category slug to main category ID mapping
The `search_service` SHALL expose a pure function `map_slug_to_main_id(slug: &str) -> Option<i32>` that maps frontend category slugs to `main_category_id` integers. Known mappings MUST include at minimum: `drinks`->2, `baby`->8, `chemistry`->9, `beauty`->6, `home`->5, `zoo`->7.

#### Scenario: Known slug returns Some(id)
- **WHEN** `map_slug_to_main_id("drinks")` is called
- **THEN** it MUST return `Some(2)`

#### Scenario: Unknown slug returns None
- **WHEN** `map_slug_to_main_id("nonexistent-slug")` is called
- **THEN** it MUST return `None`

### Requirement: Subcategory prefix expansion
The `search_service` SHALL expose a pure function `expand_subcategory_prefixes(sub_slug: &str) -> Vec<String>` that expands a subcategory prefix into a list of store-specific slugs by appending each known retail-chain suffix (at least 20 suffixes) to the prefix.

#### Scenario: Dairy prefix expands to per-store slugs
- **WHEN** `expand_subcategory_prefixes("molochni-produkty")` is called
- **THEN** the returned list MUST contain the base slug plus at least 20 suffixed variants (e.g. `molochni-produkty-novus`, `molochni-produkty-silpo`, ...)

#### Scenario: Unknown prefix still expands with suffixes
- **WHEN** `expand_subcategory_prefixes("unknown-prefix")` is called
- **THEN** the returned list MUST still contain the prefix plus all known suffixed variants and MUST NOT return an empty list

### Requirement: Discount range filter construction
The `search_service` SHALL expose a pure function that converts a discount range identifier (one of: `10`, `10-20`, `20-30`, `30+`) into a Meilisearch filter expression string operating on the `discount_percent` attribute.

#### Scenario: Range 10-20 produces bounded filter
- **WHEN** the filter identifier `"10-20"` is provided
- **THEN** the resulting filter string MUST include both a `discount_percent >= 10` and `discount_percent < 20` condition (inclusive lower bound, exclusive upper bound)

#### Scenario: Range 30+ produces open-ended filter
- **WHEN** the filter identifier `"30+"` is provided
- **THEN** the resulting filter string MUST contain a `discount_percent >= 30` lower-bound condition with no upper bound

### Requirement: Offer type filter construction
The `search_service` SHALL expose pure functions that build filter expressions for offer types: `promo`/`save` (where `old_price IS NOT NULL`) and `new` (where `created_at_ts` falls within the last 14 days).

#### Scenario: Promo offer filter requires non-null old_price
- **WHEN** the offer type is `promo` or `save`
- **THEN** the resulting filter expression MUST include `old_price IS NOT NULL`

#### Scenario: New offer filter uses 14-day window relative to now
- **WHEN** the offer type is `new`
- **THEN** the resulting filter expression MUST include a `created_at_ts >= <now - 14 days>` condition

