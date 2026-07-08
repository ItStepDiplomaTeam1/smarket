## Why

The `AGENTS.md` document serves as the entrypoint for AI coding agents to understand the Smarket monorepository ecosystem. However, it currently lacks detailed context regarding databases, schemas, migrations, search mechanisms, and local troubleshooting, which are critical for AI agents to perform tasks safely and autonomously without human intervention. Updating it with precise details ensures smoother agent onboarding and higher quality code generation.

## What Changes

- Update `AGENTS.md` with:
  - Precise directory mappings and entrypoints for each of the 9 microservices.
  - Detailed database schemas and migration workflows (Alembic for Python, Go migration scripts).
  - Clear data pipeline flow (crawling, storage in MongoDB raw datalake, transformation, loading to PostgreSQL and Meilisearch).
  - AI Agent (Zephyros/Promin) UI block structure description and LLM fallback chain.
  - Detailed conventions for coding agents, scope rules, and environment variables.

## Capabilities

### New Capabilities
- `update-agents-doc`: Detailed Smarket architecture and conventions documentation for AI agents.

### Modified Capabilities
- None

## Impact

This is a documentation-only change to `AGENTS.md` at the root of the repository. It has no runtime impact on APIs, services, or databases, but greatly improves context sharing for AI agents.
