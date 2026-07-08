## Context

Coding agents reading the repository need detailed, up-to-date context on the services, databases, entrypoints, and communication contracts. The current `AGENTS.md` is too high-level.

## Goals / Non-Goals

**Goals:**
- Update `AGENTS.md` with:
  - Complete list of microservices with their entrypoints and directories.
  - Configuration variables / Doppler settings details.
  - Data pipelines (Extract-Load, Transform-Load).
  - Detailed database schemas and migrations.
  - Meilisearch search index attributes.
  - UI Blocks schema for the AI agent (Zephyros).

**Non-Goals:**
- Code modifications to any backend service or frontend app.
- Altering the CLI OpenSpec configurations.

## Decisions

- **Decision 1:** Keep everything in a single `AGENTS.md` file rather than splitting.
  - *Rationale:* AI agents perform best when all project-scoped architectural context is in a single document (like `AGENTS.md` / `.cursorrules` / `.clauderules`), as it prevents them from having to make multiple file read calls to build a mental model.
- **Decision 2:** Write detailed ASCII architecture diagrams.
  - *Rationale:* AI models can parse structured ASCII text and mermaid diagrams very well to understand connections.

## Risks / Trade-offs

- **Risk:** Stale documentation if architecture changes in the future.
  - *Mitigation:* Ensure to clearly note in `AGENTS.md` that agents should inspect `docker-compose.yml` and actual models as the source of truth if discrepancies arise.
