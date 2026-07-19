## Context

The Zephyros AI shopping assistant depends on external LLM APIs (Google Gemini, Groq, Cerebras, OpenRouter) and internal microservices (search_service, product_service). During production deployment, several fragility points were identified:
1. Google API deprecated the `gemini-2.5-flash` model, which was saved in users' local storage and hardcoded in previous versions. This caused immediate 404 errors from Google.
2. The startup health probes had a tight 3.0s timeout and used outdated default model names (`openai/gpt-oss-20b` for Groq, `qwen3` for Cerebras), causing all providers to fail the probe on startup and trigger a 60-second circuit breaker cooldown.
3. Mismatches or temporary outages of `product_service` caused 404 errors during parallel offer fetching for search results, leading to empty comparison blocks.

## Goals / Non-Goals

**Goals:**
- Provide backward compatibility for deprecated model identifiers on both frontend and backend.
- Optimize startup health check timeout and configurations to ensure provider availability.
- Implement a graceful fallback in the `search_and_compare_offers` tool to use search-hit indexed pricing if the downstream `product_service` fails.

**Non-Goals:**
- Completely rewriting the circuit breaker/cooldown mechanism.
- Modifying the underlying databases or indexing schemas.

## Decisions

### 1. Automatic Model Translation on the Backend
We will intercept the incoming model requests in `build_model` (`services/zephyros_agent/app/agent/zephyros.py`) and translate deprecated identifiers before building the model instance:
- `gemini-2.5-flash` → `gemini-3.5-flash`
- `openai/gpt-oss-20b` (if passed under Groq) → `llama-3.3-70b-versatile`
- `qwen3` (if passed under Cerebras) → `gpt-oss-120b`

*Rationale:* This prevents backend crashes when legacy frontend clients send request payloads containing deprecated/invalid models.

### 2. Frontend Model Name Validation and Migration
In the frontend Zustand store (`useAiChatStore.ts`), we will:
- Update the default state values: `provider` should default to `gemini` (as it's the recommended provider) and `modelName` to `gemini-3.5-flash`.
- Validate the loaded state on mount or initialization. If the saved `modelName` is not in the list of available models for the saved `provider` (defined in `PROVIDER_MODELS`), we reset it to the default recommended model for that provider.

*Rationale:* This automatically cleans up local storage for returning users who have legacy model configurations cached.

### 3. Startup Health Probe Optimization
In `services/zephyros_agent/app/main.py` lifespan:
- Increase `timeout_seconds` in `probe_provider_health` from `3.0` to `10.0` seconds.
- In `config.py`, change default `GROQ_MODEL` to `llama-3.3-70b-versatile` and `CEREBRAS_MODEL` to `gpt-oss-120b` to prevent startup probes from failing with invalid model name errors.

*Rationale:* Probing external APIs over HTTPS involves DNS/TCP/TLS handshakes which can easily exceed 3 seconds. 10 seconds is safer for startup probes.

### 4. Search-Hit Metadata Fallback
In the `search_and_compare_offers` tool (`services/zephyros_agent/app/tools.py`), if the parallel call to `fetch_product_offers(product_id)` fails (returns an exception or an error/empty dict):
- Instead of returning empty offers (which results in table rendering failures), we will synthesize a fallback offer using the fields present in the Meilisearch search hit: `price`, `old_price`, `store_id`, `store_name`, `retail_chain`, and `in_stock`.

*Rationale:* This makes the product catalog comparison robust against downstream `product_service` database mismatches, connection failures, or temporary outages.

## Risks / Trade-offs

- **[Risk]**: Fallback pricing from Meilisearch might be slightly out of date compared to live PostgreSQL queries.
- **[Mitigation]**: Meilisearch index is updated regularly by the ETL pipeline. Showing slightly stale pricing is a better user experience than returning empty comparison tables or failing with a 404 error block.
