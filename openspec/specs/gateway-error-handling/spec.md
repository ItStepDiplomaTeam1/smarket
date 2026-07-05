# Gateway Error Response Proxying

## Purpose
Specification for handling and proxying downstream API error responses.

## Requirements

### Requirement: Gateway Error Response Proxying
The API Gateway SHALL proxy downstream HTTP responses with status codes >= 400 containing raw bytes to client applications without raising response serialization errors or returning a 500 Internal Server Error.

#### Scenario: Upstream service returns 502 Bad Gateway
- **WHEN** the upstream `zephyros_agent` service returns an HTTP status code 502 with an error detail payload as raw bytes
- **THEN** the API Gateway SHALL forward the raw bytes response body directly to the client with a 502 status code and include proper CORS headers
