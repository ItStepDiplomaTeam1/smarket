# store-geo-data Specification

## Purpose
TBD - created by archiving change cart-receipt-checkout. Update Purpose after archive.
## Requirements
### Requirement: Store address and coordinates storage
The ETL pipeline SHALL persist address and geographic coordinates for each store during the `SeedStores` operation. The `stores` table SHALL include columns: `address TEXT` (formatted as "вул. Хрещатик, 22, Київ"), `lat DOUBLE PRECISION`, `lng DOUBLE PRECISION`. These values SHALL be derived from the `AddressDTO` and `CoordsDTO` already present in `StoreDTO` (DTO/SyncDTO.go).

#### Scenario: Store with full address data
- **WHEN** Zakaz.ua API returns a store with `address.street`, `address.building`, `address.city` and `coords.lat`, `coords.lng`
- **THEN** ETL writes formatted address string and lat/lng into `stores` table
- **THEN** subsequent product_service reads return address and coordinates for that store

#### Scenario: Store with missing coordinates
- **WHEN** Zakaz.ua API returns a store with `coords.lat == 0` and `coords.lng == 0`
- **THEN** ETL writes `lat=null` and `lng=null` (zero coordinates are treated as absent)
- **THEN** receipt snapshot for this store has `lat=null, lng=null`
- **THEN** frontend omits the "Прокласти маршрут" link for this store

#### Scenario: Idempotent migration
- **WHEN** ETL service restarts after migration was already applied
- **THEN** `ALTER TABLE stores ADD COLUMN IF NOT EXISTS` executes without error
- **THEN** existing store records retain their previously-written address/lat/lng values

### Requirement: Product service Store model reflects geo columns
The `product_service` `Store` SQLAlchemy model SHALL declare `address`, `lat`, `lng` columns to match the ETL-managed schema. These columns are read-only from product_service's perspective.

#### Scenario: Store endpoint returns geo data
- **WHEN** product_service handles a request that includes store data
- **WHEN** the store has `address`, `lat`, `lng` populated by ETL
- **THEN** the response includes these fields
- **THEN** `lat` and `lng` are floating point numbers (or null)

