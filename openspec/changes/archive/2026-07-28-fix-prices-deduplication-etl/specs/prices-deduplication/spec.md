## MODIFIED Requirements

### Requirement: Prevention of future consecutive duplicates

The Go ETL service SHALL only insert a new row in the `prices` table if the incoming price, old price, or stock status differs from the absolute latest recorded price for that product and store, regardless of when the last record was inserted (removing arbitrary time window limits), and MUST perform intra-batch deduplication to prevent duplicate insertions within the same ETL run.

#### Scenario: ETL ingests product with unchanged price outside time window
- **WHEN** the ETL service processes an ingested product whose price and stock status match the latest database entry recorded more than 3 hours ago
- **THEN** the system skips inserting a new price entry.

#### Scenario: ETL ingests product with changed price or stock status
- **WHEN** the ETL service processes an ingested product whose price or stock status differs from the latest database entry
- **THEN** the system inserts a new price entry with the current timestamp.

#### Scenario: ETL batch contains multiple entries for the same product
- **WHEN** the ETL batch processes multiple price events for the same product and store within the same ETL run
- **THEN** the system deduplicates the incoming items in memory and executes only one price insertion check against the latest database record.
