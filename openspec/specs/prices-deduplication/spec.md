# prices-deduplication Specification

## Purpose
TBD - created by archiving change optimize-prices-storage. Update Purpose after archive.
## Requirements
### Requirement: Deduplication of prices table

The system SHALL support pruning of the `prices` table to delete consecutive records for the same product and store where `price`, `old_price`, and `in_stock` remain unchanged, keeping only the earliest snapshot and subsequent change events.

#### Scenario: Running the database pruning script
- **WHEN** the prune script is executed against the database
- **THEN** it deletes all consecutive duplicate price rows and leaves only unique historical price and stock status changes.

### Requirement: Prevention of future consecutive duplicates

The Go ETL service SHALL only insert a new row in the `prices` table if the incoming price, old price, or stock status differs from the absolute latest recorded price for that product and store.

#### Scenario: ETL ingests product with unchanged price
- **WHEN** the ETL service processes an ingested product whose price and stock status match the latest database entry
- **THEN** the system skips inserting a new price entry.

#### Scenario: ETL ingests product with changed price or stock status
- **WHEN** the ETL service processes an ingested product whose price or stock status differs from the latest database entry
- **THEN** the system inserts a new price entry.

