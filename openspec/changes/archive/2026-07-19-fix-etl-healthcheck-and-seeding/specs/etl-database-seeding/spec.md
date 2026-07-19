## ADDED Requirements

### Requirement: Optimized Seeding
The system SHALL seed product categories by querying at most one store per unique retail chain to avoid excessive network requests and timeout.

#### Scenario: Seeding with multiple stores of the same chain
- **WHEN** the seeding process starts on a clean database containing multiple stores of the same retail chain
- **THEN** the system SHALL execute only one HTTP request to fetch categories for that retail chain

### Requirement: Seeding Timeout Resiliency
The system SHALL monitor the database seeding context and abort loop executions immediately when the context is cancelled or times out.

#### Scenario: Seeding context timeout
- **WHEN** the seeding context timeout is reached during category fetch or database insert loops
- **THEN** the system SHALL immediately terminate the seeding loop and log a single warning message

### Requirement: BusyBox Wget Healthcheck
The container healthcheck configuration SHALL use `wget` instead of `curl` to verify the health status, ensuring compatibility with minimal BusyBox/Alpine images.

#### Scenario: Health status check execution
- **WHEN** the Docker daemon runs the healthcheck for `products_etl`
- **THEN** it executes `wget` to query `/health` and returns status 0 on a 200 response or status 1 on failure
