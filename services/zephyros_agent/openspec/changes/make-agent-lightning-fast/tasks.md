## 1. Provider Chain and Model Routing Optimization

- [x] 1.1 Update `PROVIDER_CHAIN` in `app/agent/zephyros.py` to put Groq and Gemini first, OpenRouter and Cerebras last.
- [x] 1.2 Update `GROQ_MODEL` default in `app/config.py` to `llama-3.1-8b-instant` for faster generation.
- [x] 1.3 Update fallback logic and error handling in `app/main.py` to align with the new fast provider priority.

## 2. Combined Search and Compare Tool

- [x] 2.1 Implement `search_and_compare_offers` tool in `app/tools.py` that queries Meilisearch and fetches PostgreSQL offers for top hits in parallel using `asyncio.gather`.
- [x] 2.2 Register `search_and_compare_offers` as an agent tool and remove old sequential tools in `app/agent/zephyros.py`.
- [x] 2.3 Modify the agent's `SYSTEM_PROMPT` in `app/agent/zephyros.py` to use the combined tool instead of sequential steps, updating output requirements.

## 3. Redis Caching Implementation

- [x] 3.1 Initialize an async Redis client on startup in `app/main.py` lifespan and add it to FastAPI application state.
- [x] 3.2 Add `redis` client to `AgentDeps` class in `app/deps.py` to pass it down to agent runs.
- [x] 3.3 Add Redis caching logic (get/set with 5-minute TTL) inside the `search_and_compare_offers` tool to cache successful query results.

## 4. SSE Streaming Endpoint

- [x] 4.1 Implement a new POST `/agent/chat/stream` endpoint in `app/main.py` that uses `agent.run_stream` to stream partial block JSON structures.
- [x] 4.2 Update API Gateway's proxy handler in `services/gateway/app/api/routes/agent.py` to stream SSE responses correctly without buffering.
