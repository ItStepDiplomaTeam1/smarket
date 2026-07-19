## ADDED Requirements

### Requirement: Failover for Pinned AI Provider Requests
When a specific AI provider is requested by the client, the system SHALL attempt the requested provider first, but fall back to other configured and healthy providers if the requested provider fails.

#### Scenario: Pinned provider rate limit triggers fallback
- **WHEN** a client request specifies a preferred provider
- **AND** the preferred provider returns a rate limit error (429) or is currently marked down
- **THEN** the system SHALL automatically try the next configured provider in the priority chain (e.g., Groq, OpenRouter, Cerebras) rather than failing immediately
