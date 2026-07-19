## Why

The Zephyros AI shopping assistant fails to run or provide comparison data in production due to three main issues: (1) client requests using deprecated model identifiers (e.g., `gemini-2.5-flash`) fail with 404 errors from Google API, (2) strict 3.0-second startup health checks cause LLM providers to go into a 60-second cooldown on container startup, and (3) database desync between Meilisearch and PostgreSQL causes `product_service` to return 404 for search hits, which results in empty offers. 

This change ensures the AI agent is fully resilient against provider deprecations, network timeouts, and database inconsistencies.

## What Changes

- **Automatic Model Translation (Backend)**: Add a mapping/fallback layer in the backend to automatically translate deprecated model names (e.g., `gemini-2.5-flash`) to their current active replacements (e.g., `gemini-3.5-flash`).
- **Local Storage Model Migration (Frontend)**: Update the frontend Zustand store configuration to validate model names and automatically fall back to supported defaults if a stored model is no longer available.
- **Robust Startup Probes**: Increase startup health probe timeout from 3s to 10s and update default model identifiers to valid, active ones.
- **Search-Hit Fallback (Backend Tools)**: Modify the search tool to fall back to search hit metadata (price, store, stock status) if `product_service` fails to return detailed offers or returns a 404, preventing empty offer lists in the UI.

## Capabilities

### New Capabilities
- `agent-resilience`: Automatic model version translation, robust health checks, and search-hit fallback mechanisms for uninterrupted AI agent operations.

### Modified Capabilities
- `provider-robustness`: Improve the default provider configurations and increase timeout limits to prevent premature circuit-breaker cooldowns.

## Impact

- `services/zephyros_agent/app/agent/zephyros.py` — Auto-mapping of deprecated models and fallback tools.
- `services/zephyros_agent/app/main.py` — Increase startup health probe timeout and update configurations.
- `services/zephyros_agent/app/tools.py` — Synthesize fallback offers using search hit metadata on product_service errors.
- `apps/react/frontend/my-react-app/src/modules/AiChat/store/useAiChatStore.ts` — Migrate and validate stored model name on load.
