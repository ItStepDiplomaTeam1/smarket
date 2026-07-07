## Why

The Neon database is full (0.51 / 0.5 GB) because the `prices` table acts as an append-only log and contains over 2.8 million rows, most of which are consecutive duplicates (identical price snapshots recorded on different days). This blocks database writes and stops the ETL worker and other microservices from functioning.

## What Changes

- **Database Deduplication Script**: Introduce a batch-based deduplication script to remove consecutive identical price records, keeping only the historical changes.
- **Go ETL Ingestion Logic**: Modify the Go ETL product-saving query to compare the incoming price/stock status against the absolute latest recorded price for that product/store, instead of inserting a row unconditionally if not inserted in the last 3 hours.
- **Database Maintenance**: Run `REINDEX` and `VACUUM` on the `prices` table after deduplication to reclaim disk space.

## Capabilities

### New Capabilities

- `prices-deduplication`: Deduplicate consecutive duplicate prices in the database and optimize Go ETL to prevent future duplicates.

### Modified Capabilities

*None.*

## Impact

- **Database Storage**: Reclaims ~95% of space occupied by the `prices` table (~430MB of 450MB total bloat).
- **Go ETL Worker (`products_etl`)**: Modifies the `batch.Queue` query in `transformers.go` to check against the absolute latest price snapshot.
