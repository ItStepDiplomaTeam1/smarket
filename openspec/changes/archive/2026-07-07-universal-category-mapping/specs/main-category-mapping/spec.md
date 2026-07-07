## ADDED Requirements

### Requirement: ETL normalizes raw category slug to universal main_category_id
The ETL pipeline SHALL compute a `main_category_id` integer (1–10) for every category by (1) lower-casing the raw slug, (2) stripping any store-specific suffix matching the pattern `-(novus|ultramarket|zaraz|alcohub|auchan|metro|tavriav|cosmos|vostorg|kharkiv|chudomarket|biotus|epicentr|ekomarket|torba|masterzoo|megamarket|grono|winetime|ideal|onde)$` using a compiled regular expression, and (3) looking up the normalized slug in a static map to return the mapped ID. If no match is found, the system SHALL fall back to `1` (Products).

#### Scenario: Known slug with store suffix is normalized
- **WHEN** the raw slug is `fruits-and-vegetables-auchan`
- **THEN** the suffix `-auchan` is stripped, the normalized slug `fruits-and-vegetables` maps to `main_category_id = 1`

#### Scenario: Known slug without store suffix maps correctly
- **WHEN** the raw slug is `dairy-and-eggs`
- **THEN** no suffix is stripped, the slug maps to `main_category_id = 1`

#### Scenario: Unknown slug falls back to Products
- **WHEN** the raw slug is `some-unknown-category`
- **THEN** no match is found and `main_category_id = 1` is returned as fallback

#### Scenario: Drink category is mapped to Drinks
- **WHEN** the raw slug is `hot-drinks-metro`
- **THEN** the suffix `-metro` is stripped, `hot-drinks` maps to `main_category_id = 2`

#### Scenario: Alcohol category is mapped to Alcohol & Tobacco
- **WHEN** the raw slug is `eighteen-plus-auchan`
- **THEN** the suffix `-auchan` is stripped, `eighteen-plus` maps to `main_category_id = 4`

#### Scenario: Pet-related category is mapped to Pets
- **WHEN** the raw slug is `cats-masterzoo`
- **THEN** the suffix `-masterzoo` is stripped, `cats` maps to `main_category_id = 7`

---

### Requirement: categories table stores main_category_id
The `categories` PostgreSQL table SHALL have a nullable `main_category_id INTEGER` column. The ETL migration step SHALL execute `ALTER TABLE categories ADD COLUMN IF NOT EXISTS main_category_id INTEGER` on startup to ensure the column exists without breaking existing data.

#### Scenario: Migration runs on a table that already has the column
- **WHEN** the migration runs and `main_category_id` already exists
- **THEN** `IF NOT EXISTS` prevents an error and the migration completes successfully

#### Scenario: Migration runs on a fresh table without the column
- **WHEN** the migration runs and `main_category_id` does not exist
- **THEN** the column is added with no default constraint

---

### Requirement: SeedCategories persists main_category_id on upsert
When `SeedCategories` inserts or updates a category row, it SHALL compute `main_category_id` for that slug using the mapping utility and include it in the `INSERT ... ON CONFLICT DO UPDATE SET` statement so the value is always current after each ETL run.

#### Scenario: New category slug is seeded with correct main_category_id
- **WHEN** a new slug `bakery-zaraz` is seeded for the first time
- **THEN** the row is inserted with `main_category_id = 1` (Products)

#### Scenario: Existing category slug is re-seeded and main_category_id is updated
- **WHEN** an existing slug's mapping changes (e.g., due to a mapping update) and SeedCategories runs
- **THEN** the `ON CONFLICT DO UPDATE` clause overwrites `main_category_id` with the newly computed value

---

### Requirement: ResolveCategoryID persists main_category_id on lazy creation
When `ResolveCategoryID` lazily inserts a new category slug that was not previously known, it SHALL compute and persist `main_category_id` in the `INSERT` statement.

#### Scenario: Lazy-created category includes main_category_id
- **WHEN** a product with slug `frozen-vostorg` is processed and no category row exists
- **THEN** a new row is inserted with `slug = 'frozen-vostorg'`, `name = ''`, and `main_category_id = 1` (frozen → Products)

---

### Requirement: Meilisearch documents include main_category_id
When `indexProductsToSearch` sends product documents to `search_service`, each document SHALL include a `main_category_id` field (nullable integer) sourced from the `products.canonical_category_id` → `categories.main_category_id` join.

#### Scenario: Indexed product carries main_category_id
- **WHEN** a product belonging to category `dairy-and-eggs-metro` (main_category_id = 1) is indexed
- **THEN** the Meilisearch document contains `"main_category_id": 1`

#### Scenario: Product with no category is indexed with null main_category_id
- **WHEN** a product has `canonical_category_id = NULL`
- **THEN** the Meilisearch document contains `"main_category_id": null`
