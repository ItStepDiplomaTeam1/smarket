# update-agents-doc Specification

## Purpose
This specification defines the requirements for maintaining accurate and detailed developer and AI-agent context in the `AGENTS.md` monorepository map.

## Requirements

### Requirement: Service Mappings and Entrypoints
The `AGENTS.md` file SHALL document all 9 microservices in the Smarket ecosystem, specifying their port numbers, direct directory locations, exact entrypoint filenames, and primary roles.

#### Scenario: Check service catalog details
- **WHEN** an AI agent reads the microservices catalog section
- **THEN** they find the exact port, stack, main directory path, and entrypoint file for each service (e.g. `services/auth_service/main.py`)

### Requirement: Database and Migration Flows
The `AGENTS.md` file SHALL describe the multi-schema PostgreSQL setup, specifying which services have independent schemas and migrations (using Alembic) and which services read/write shared data.

#### Scenario: Inspect database setup
- **WHEN** an AI agent reads the database section
- **THEN** they see how migrations are run for Auth, Cart, Product, and Reviews services, and learn that the PostgreSQL instance is an external hosted service.

### Requirement: AI Agent and Search Mechanisms
The `AGENTS.md` file SHALL detail the `zephyros_agent` UI block specifications, its fallback chain, and Meilisearch index configurations used by `search_service`.

#### Scenario: Learn AI Agent requirements
- **WHEN** an AI agent reads the agent block schemas
- **THEN** they understand all allowed block types (`text`, `table`, `product_card`, `tabs`, `clarification`, `action_button`, `badge`, `fallback`, `divider`) and the provider chain (OpenRouter -> Gemini -> Groq -> Cerebras).
