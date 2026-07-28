## 1. In-Memory Intra-Batch Deduplication in Go ETL

- [x] 1.1 Add in-memory deduplication map `seenProductStore` in `services/products_etl/internal/service/transformers.go` before building `pgx.Batch`
- [x] 1.2 Skip duplicate entries for the same `(product_id, store_id)` within the same ETL page payload

## 2. SQL Batch Query Refactoring for Absolute Latest Price Check

- [x] 2.1 Update the `INSERT INTO prices` SQL batch query in `transformers.go` to replace `recorded_at > NOW() - INTERVAL '3 hours'` with `ORDER BY recorded_at DESC LIMIT 1` subquery
- [x] 2.2 Add explicit `$3::numeric(10,2)` and `$4::numeric(10,2)` casting to the SQL query to ensure exact numeric comparisons

## 3. Historical Duplicates Cleanup Migration

- [x] 3.1 Add a migration step in `services/products_etl/database/migrate.go` to delete consecutive duplicate price records using `LAG()` window function

## 4. Verification and Testing

- [x] 4.1 Run unit and integration tests for `products_etl` to verify price insertion behavior
- [x] 4.2 Verify that repeated ETL passes on the same dataset do not insert new rows into `prices`
