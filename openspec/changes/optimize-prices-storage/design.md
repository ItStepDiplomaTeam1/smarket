## Context

The Neon PostgreSQL database has reached its 0.5 GB capacity limit. Analysis shows that the `prices` table consumes the vast majority of this space due to excessive redundant records (~2.8 million rows). The table is designed as an append-only price/stock history log, but the ETL worker currently inserts new price snapshots even when the price and stock status have not changed.

## Goals / Non-Goals

**Goals:**
- Prune duplicate consecutive price history entries to reclaim ~95% of space in the `prices` table while maintaining accurate historical trend data.
- Shrink the actual database file/page footprint using Postgres table maintenance commands (`REINDEX` and `VACUUM`).
- Update the Go ETL ingestion SQL query to perform a check against the latest price record before insertion.

**Non-Goals:**
- Changing database schemas or dropping tables.
- Modifying external APIs or gateway contracts.

## Decisions

### 1. Pruning Utility: Batch-based Python Script
- **Decision:** Write a one-time Python script (`prune_db.py`) that deletes redundant consecutive price records in small batches (e.g., batching by products).
- **Rationale:** Running a single massive `DELETE` SQL query on a 2.8M row table in a shared/free-tier Neon database will likely cause statement timeouts, high CPU utilization, or table locks. Batching ensures safety and reliability.
- **Alternatives Considered:** 
  - *Pure SQL recursive CTE/temp table:* Harder to throttle and monitor progress, risk of transaction log exhaustion.

### 2. ETL Ingestion Query Optimization
- **Decision:** Replace the Go ETL insert check in `transformers.go` (which checked if a price was inserted in the last 3 hours) with a check against the absolute latest recorded price (`ORDER BY recorded_at DESC LIMIT 1`).
- **Rationale:** Checking the latest record database-side ensures that we never insert consecutive identical rows, even if the last scan was hours or days ago, while keeping query overhead minimal.
- **Alternatives Considered:** 
  - *In-memory ETL cache:* Prone to inconsistency across worker restarts or multiple running instances.

### 3. Database Maintenance Post-Pruning
- **Decision:** Execute `REINDEX TABLE prices;` and `VACUUM prices;` (or `VACUUM FULL prices;` if necessary) immediately after pruning.
- **Rationale:** In PostgreSQL, deleting rows does not immediately shrink the physical size of the files on disk (due to MVCC dead tuples). Running `VACUUM` and `REINDEX` is necessary to reclaim space and release it back to the cloud provider.

## Risks / Trade-offs

- **[Risk]** Database locking or high CPU load during deduplication.
  - **[Mitigation]** The Python script will process products in batches of 1,000, committing after each batch, and introducing a tiny sleep if database load rises.
- **[Risk]** Accidental loss of price history trend data.
  - **[Mitigation]** The pruning query explicitly checks that a row is only deleted if its `price`, `old_price`, and `in_stock` value are identical to the chronologically preceding record for the same `product_id` and `store_id`. Any actual changes in price or stock status are preserved.
