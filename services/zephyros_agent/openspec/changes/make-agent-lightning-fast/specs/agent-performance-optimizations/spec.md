## ADDED Requirements

### Requirement: Combined Search and Offers Tool
The agent SHALL expose a combined tool that fetches both matching catalog items and their detailed store offers in a single invocation to reduce LLM tool-calling roundtrips.

#### Scenario: User queries catalog
- **WHEN** the agent decides to search for products
- **THEN** it SHALL call a single combined tool that queries Meilisearch and retrieves product store/price details in parallel, returning the integrated results to the agent in one turn

### Requirement: Redis Query Caching
The agent service SHALL cache the combined tool's results in a Redis store using a short TTL (Time to Live) to avoid duplicate search and DB queries.

#### Scenario: Identical catalog search executed within TTL
- **WHEN** a tool call is made with a query that has been fetched recently
- **THEN** the system SHALL return the cached response from Redis without making external network calls to Meilisearch or PostgreSQL

### Requirement: SSE Streaming of UI Blocks
The agent service SHALL support Server-Sent Events (SSE) streaming for the chat endpoint, pushing partial UI blocks and thought/status events to the client as they are generated.

#### Scenario: Streaming chat request received
- **WHEN** a client initiates a streaming request to `/api/v1/agent/chat/stream`
- **THEN** the system SHALL stream structured response blocks token-by-token and output status updates in real-time
