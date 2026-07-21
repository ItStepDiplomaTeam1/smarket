## MODIFIED Requirements

### Requirement: Structured Message History Ingestion
The agent service SHALL parse user and assistant message history while preserving structured action context. It SHALL translate prior assistant UI blocks into model context without exposing raw provider output, and SHALL represent proposed mutation actions as unexecuted, user-bound action tokens. Parallel provider attempts SHALL consume the same read-only canonical history and SHALL NOT invoke mutation tools from history alone.

#### Scenario: User confirms a previously proposed item addition
- **WHEN** the agent receives history containing a prior assistant product card and unexecuted add-to-cart action, followed by a user confirmation
- **THEN** the system SHALL validate the action token against the authenticated user and its expiry
- **AND** SHALL execute the cart mutation exactly once through the centralized action executor
- **AND** SHALL return a structured confirmation response
