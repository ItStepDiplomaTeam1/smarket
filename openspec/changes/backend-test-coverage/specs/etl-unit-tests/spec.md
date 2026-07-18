## ADDED Requirements

### Requirement: EAN-13 barcode validation
The system SHALL validate product barcodes against the EAN-13 standard during ETL transformation. A valid EAN-13 barcode MUST be exactly 13 digits, with the final digit being a valid checksum computed from the preceding 12 digits using the EAN-13 modulo-10 algorithm.

#### Scenario: Valid EAN-13 barcode passes validation
- **WHEN** the TransformLoadWorker processes a product with a 13-digit barcode whose checksum digit matches the computed checksum of the first 12 digits
- **THEN** the barcode MUST be accepted and stored in the `products.canonical_ean` column

#### Scenario: Invalid checksum fails validation
- **WHEN** a 13-digit barcode has a checksum digit that does not match the computed checksum
- **THEN** the barcode MUST be rejected and the product MUST be skipped (or stored with NULL `canonical_ean`)

#### Scenario: Barcode of wrong length fails validation
- **WHEN** a barcode has fewer or more than 13 digits, or contains non-digit characters
- **THEN** validation MUST fail and the barcode MUST NOT be persisted

### Requirement: Price conversion from kopecks to hryvnias
The system SHALL convert prices sourced from Zakaz.ua (expressed in kopecks) to hryvnias by dividing the integer value by 100.0 before storing in the `prices.price` column.

#### Scenario: Integer kopeck value converts to decimal hryvnias
- **WHEN** the source API returns a price of `4150` kopecks
- **THEN** the stored `prices.price` value MUST equal `41.50`

#### Scenario: Zero and null price handling
- **WHEN** the source price is `0` or missing/NULL
- **THEN** the transformer MUST store `0.0` or skip the price record respectively, and MUST NOT raise an exception

### Requirement: Category mapping to 10 global categories
The system SHALL map store-specific category slugs to one of 10 canonical `main_category_id` values (1=Food, 2=Drinks, 3=Alcohol, 4=Baby, 5=Chemistry, 6=Beauty, 7=Home, 8=Zoo, 9=Garden, 10=Stationery) via the `ResolveMainCategoryID` function.

#### Scenario: Known category slug maps to correct main category
- **WHEN** `ResolveMainCategoryID` receives a slug belonging to a known mapping (e.g. a dairy slug)
- **THEN** it MUST return the corresponding `main_category_id` integer (e.g. `1` for dairy)

#### Scenario: Unknown category slug defaults to fallback
- **WHEN** `ResolveMainCategoryID` receives a slug that has no explicit mapping
- **THEN** it MUST return a deterministic fallback `main_category_id` (specified in the implementation) and MUST NOT panic or return an error

### Requirement: HTML stripping from product descriptions
The system SHALL strip all HTML tags from product descriptions during ETL transformation, leaving only the plain-text content.

#### Scenario: HTML tags removed
- **WHEN** a product description contains `<p>Text <b>with</b> tags</p>`
- **THEN** the stored description MUST be `Text with tags` (with HTML tags removed and whitespace normalized)

#### Scenario: Empty description stays empty
- **WHEN** the source description is empty, NULL, or whitespace-only
- **THEN** the stored description MUST be empty/NULL and MUST NOT raise an exception
