## ADDED Requirements

### Requirement: Proxy-aware rate limiter key identification
The authentication service rate limiter SHALL identify client IP addresses using the `X-Forwarded-For` or `X-Real-IP` HTTP header instead of the immediate network peer IP when the request is proxied.

#### Scenario: Rate limiter parses X-Forwarded-For header
- **WHEN** a request is received containing the `X-Forwarded-For` header
- **THEN** the rate limiter extracts the client IP address from the header to evaluate rate limits

#### Scenario: Rate limiter falls back to peer IP when header is missing
- **WHEN** a request is received without `X-Forwarded-For` or `X-Real-IP` headers
- **THEN** the rate limiter falls back to using the socket remote peer IP address
