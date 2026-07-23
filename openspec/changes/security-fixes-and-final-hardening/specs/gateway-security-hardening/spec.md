# gateway-security-hardening Specification

## ADDED Requirements

### Requirement: Centralized proxy header and cookie sanitization
The system SHALL strip incoming client-supplied `X-User-Id` and `X-User-Role` headers, as well as `refresh_token` from `Cookie` headers, on ALL proxy routes in API Gateway (`products`, `search`, `stores`, `reviews`, `admin`, `cart`, `agent`, `favorites`) before forwarding requests to internal microservices.

#### Scenario: Client sends malicious X-User-Id header to products endpoint
- **WHEN** an unauthenticated client sends `GET /api/v1/products` with `X-User-Id: spoofed-uuid`
- **THEN** API Gateway strips `X-User-Id` prior to forwarding the request to `product_service`
- **THEN** internal service receives no identity header from the untrusted client

#### Scenario: Client sends refresh_token cookie to search endpoint
- **WHEN** client sends `POST /api/v1/search` with `Cookie: refresh_token=secret`
- **THEN** API Gateway strips `refresh_token` from the forwarded headers before contacting `search_service`
