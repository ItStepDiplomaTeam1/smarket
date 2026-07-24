## ADDED Requirements

### Requirement: Continuous Loading State During Product Fetch Retries
The system SHALL maintain the `isLoading` state as `true` during all initial and retry attempts of fetching product details, and SHALL NOT set `isLoading` to `false` until all retries have completed or data is successfully loaded.

#### Scenario: Network delay or temporary failure during product fetch
- **WHEN** the user opens a product page and the initial HTTP request fails or times out
- **THEN** the application maintains the loading screen ("Завантаження товару...") while attempting retries without displaying "Товар не знайдено"

### Requirement: Immediate 404 Handling Without Redundant Retries
The system SHALL immediately set `notFound` to `true` and terminate retries if the API responds with an explicit 404 status code.

#### Scenario: Product does not exist in backend database
- **WHEN** the user navigates to a non-existent product ID and the API returns HTTP 404
- **THEN** the application stops retrying immediately and displays the "Товар не знайдено" UI page
