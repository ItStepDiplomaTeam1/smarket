## 1. Database Pruning and Cleanup

- [x] 1.1 Create database pruning script `prune_db.py` to delete consecutive identical price entries in batches of 1,000 products.
- [x] 1.2 Execute `prune_db.py` to deduplicate the existing `prices` table.
- [x] 1.3 Run `REINDEX TABLE prices;` and `VACUUM prices;` to immediately reclaim disk space.

## 2. Go ETL Service Update

- [x] 2.1 Update the SQL query in `services/products_etl/internal/service/transformers.go` (around line 569) to verify incoming prices against the absolute latest database record.
- [x] 2.2 Compile the Go ETL worker locally (`go build -v ./...`) to verify there are no compilation or syntax errors.

## 3. Verification

- [x] 3.1 Verify database storage usage has dropped significantly in Neon.
- [x] 3.2 Run the ETL worker and verify new price entries are only created when a price or stock status change actually occurs.
