## Context

The gateway proxies requests to the agent microservice. When a user sends a chat message, it goes to `http://157.180.74.21:8080/api/v1/agent/chat`, which is routed to the `zephyros_agent` container at `http://zephyros_agent:8005/agent/chat`.

Currently, the production endpoint returns `503 Service Unavailable`. This is caused by one of two things:
1. **Unhealthy Container**: The container failed its healthcheck because `orjson` was missing before our recent fix.
2. **Missing API Keys**: The environment variables for LLM providers (Gemini, Groq, OpenRouter) are not configured, causing `available_provider_chain()` to return empty.

## Goals / Non-Goals

**Goals:**
- Rebuild the `zephyros_agent` image on Hetzner with the latest package dependencies (including `orjson`).
- Ensure `OPENROUTER_API_KEY` is correctly injected via Doppler or `.env`.

**Non-Goals:**
- Modifying the proxy/routing logic in the gateway.

## Decisions

- **Rebuild and Redeploy**: Pull the latest code on the Hetzner host and execute a rebuild of the `zephyros_agent` container.
- **Verify Secrets**: Validate that the Doppler project config has the correct API keys set.

## Risks / Trade-offs

- **Downtime during Rebuild**: Rebuilding might cause brief service downtime.
  - *Mitigation*: The service is already returning a 503 error, so rebuilding will not negatively affect current availability.
