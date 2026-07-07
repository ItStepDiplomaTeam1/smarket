## Context

Smarket scrapes product catalogs from multiple supermarket chains via Zakaz.ua. The ETL pipeline (Go) fetches categories per-store and stores slugs verbatim — e.g. `fruits-and-vegetables-auchan`, `meat-fish-poultry-metro`. This means the same logical category appears dozens of times with different suffixes in the `categories` table and in the Meilisearch index.

The `search_service` (Rust/Axum) uses strict equality filtering (`category_slug = "..."`) when a `category_slug` param is passed. Because the frontend hardcodes UI category IDs that don't match any existing slug (e.g., `molochni-produkty`, `vegetables`), all category-filtered searches return 0 results. The root fix is to introduce a universal integer `main_category_id` that can be used as a filterable field across all store variants of a category.

All modifications MUST remain within `services/products_etl/`. No changes to `search_service`, `product_service`, or frontend are in scope for this change.

## Goals / Non-Goals

**Goals:**
- Introduce a `ResolveMainCategoryID(slug string) int` utility in Go that deterministically maps any raw slug to an integer 1–10.
- Add `main_category_id` column to the `categories` table via the existing migration runner in `migrate.go`.
- Persist `main_category_id` in every `categories` insert/update path (`SeedCategories`, `ResolveCategoryID`).
- Include `main_category_id` in the Meilisearch document struct (`SearchProductDocument`) and in the SQL join query used by `indexProductsToSearch`.

**Non-Goals:**
- Modifying `search_service` to use `main_category_id` as a filter parameter (separate change).
- Modifying the frontend to use `main_category_id` in queries (separate change).
- Updating `product_service` read API to expose `main_category_id` (separate change).
- Any backfill job — re-indexing existing Meilisearch documents will happen naturally on next ETL run.

## Decisions

### Decision 1: New file `category_mapping.go` for the mapping utility
**Chosen**: A standalone Go file in `services/products_etl/internal/service/` containing the regex, the static map, and `ResolveMainCategoryID`.

**Rationale**: Keeps the mapping logic isolated, easy to test independently, and avoids bloating `transformers.go` or `seed.go`. The regex is compiled once at package init via `var` so there is no repeated compilation cost.

**Alternatives considered**:
- Inline in `transformers.go`: rejected — would inflate an already large file and makes testing awkward.
- DB-driven mapping table: rejected — requires a migration, adds a DB roundtrip per category, and the mapping is stable enough to be hardcoded.

### Decision 2: Fallback to `main_category_id = 1` (Products)
**Chosen**: Unknown/unmapped slugs default to `1` (Products — the broadest category).

**Rationale**: Guarantees every product appears in at least one top-level category without any NULL handling complexity on the frontend. Products is the safest bucket for unknown food-adjacent items.

**Alternatives considered**:
- Return `NULL` / `0`: rejected — would require NULL-aware filtering logic in the Rust search handler.
- Return an error: rejected — category mapping is best-effort; a bad slug should not fail the entire batch.

### Decision 3: Nullable `main_category_id` column in PostgreSQL
**Chosen**: `INTEGER NULL` (no `NOT NULL` constraint, no default).

**Rationale**: The column is populated by the application layer. Enforcing `NOT NULL DEFAULT 1` at the DB level would silently mask future mapping bugs (e.g., a row inserted by a migration script without the computed value would appear as Products). Nullable makes the sentinel explicit; the application always computes and sets the value.

### Decision 4: Keep suffix-stripping regex in a compiled `var` at package level
**Chosen**: `var storeChainSuffixRe = regexp.MustCompile(...)` at package level.

**Rationale**: `regexp.MustCompile` panics at startup if the pattern is invalid (a compile-time catch), and the compiled `*Regexp` is safe for concurrent use, which matters since the ETL runs goroutines for workers.

## Risks / Trade-offs

- **[Risk] Slug never present in static map** → Mitigation: fallback to `1` (Products) ensures no data is lost, but a log line should be emitted so the team can refine the map over time.
- **[Risk] New store suffix added by Zakaz.ua** → Mitigation: the suffix regex is exhaustive for current known chains; unknown suffixes will just not be stripped, and the full slug will miss the map and fall back to `1`. A monitoring alert on frequent `main_category_id = 1` hits for unknown slugs is advisable long-term.
- **[Risk] Backfill gap** → Products already in Meilisearch won't have `main_category_id` until the next ETL re-index cycle. This is acceptable as an eventual-consistency property; no data is deleted.
- **[Trade-off] Hardcoded map vs DB table** → The static map is faster and simpler, but requires a code deploy to update. Given that Zakaz.ua's top-level category taxonomy is stable (< 10 changes/year), this is acceptable.

## Migration Plan

1. Deploy updated `products_etl` Docker image.
2. On startup, `migrate.go` runs `ALTER TABLE categories ADD COLUMN IF NOT EXISTS main_category_id INTEGER` — idempotent, no downtime.
3. `SeedCategories` runs next and backfills `main_category_id` for all known category slugs via `ON CONFLICT DO UPDATE`.
4. New ETL parse cycles will re-index products to Meilisearch with `main_category_id` populated.
5. **Rollback**: remove the `main_category_id` column from the `SearchProductDocument` struct and redeploy; the DB column can remain as it has no `NOT NULL` constraint and won't affect queries.

## Open Questions

- (None — mapping matrix and all implementation details are fully specified in the proposal and specs.)
