# stores-proxy Specification

## Purpose
TBD - created by archiving change fix-gateway-stores-proxy. Update Purpose after archive.
## Requirements
### Requirement: GET requests proxying without body
The API Gateway SHALL forward GET requests to downstream services without a request body stream to prevent downstream parsing errors.

#### Scenario: Successful GET request proxying to stores
- **WHEN** the client sends a GET request to `/api/v1/stores`
- **THEN** the API Gateway forwards the GET request with an empty body (`b""`) to the `product_service` stores endpoint

