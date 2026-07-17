## Context

The current AI assistant (Promin) in the Smarket platform responds in 3-6 seconds. This is caused by multiple factors: sequential LLM tool execution roundtrips (first searching the catalog, then comparing product offers), prioritizing slow OpenRouter models, and sending full unary responses. This document outlines the technical design to transition the system to fast models, implement a combined query tool, add Redis-based query caching, and introduce SSE streaming.

## Goals / Non-Goals

**Goals:**
- Optimize the default provider chain to prioritize Groq and Gemini using fast models (`llama-3.1-8b-instant`, `gemini-2.5-flash`).
- Reduce LLM roundtrips by introducing a combined `search_and_compare_offers` tool.
- Implement short-lived Redis caching (e.g., 5-minute TTL) for search and offer queries inside the tool.
- Implement a Server-Sent Events (SSE) streaming endpoint `/agent/chat/stream` that returns partial JSON response blocks in real time.
- Proxy the streaming endpoint through the API Gateway.

**Non-Goals:**
- Caching user carts (carts are dynamic and private, so they must be queried live).
- Changing database schemas or the ETL data extraction process.

## Decisions

### 1. Re-prioritize AI Providers and Fast Models
- **Choice**: Change `PROVIDER_CHAIN = ["groq", "gemini", "openrouter", "cerebras"]` and set the default Groq model to `llama-3.1-8b-instant`.
- **Alternative**: Keep `openai/gpt-oss-120b:free` on OpenRouter. *Rejected* because free models have long queue times and high latency.
- **Rationale**: Groq and Gemini have the lowest Time-To-First-Token (TTFT) and high throughput, making them ideal for instant chat.

### 2. Combine Search and Compare Tools
- **Choice**: Implement a single unified tool `search_and_compare_offers` that queries Meilisearch first, then runs parallel HTTP fetches (via `asyncio.gather`) for matching products to fetch store prices.
- **Alternative**: Let the LLM continue calling `search_catalog` and `compare_product_offers` sequentially. *Rejected* because sequential tool calling adds 1-2 extra LLM calls (each taking ~1s).
- **Rationale**: The LLM will call a single tool, lowering total roundtrips from 3 to 2 (or 1 if it goes straight to formatting).

### 3. Redis Caching for Combined Tool
- **Choice**: Use the existing Redis database (`redis://redis:6379`) to store search results for 5 minutes. The cache key will be `search:query:<store_id>`.
- **Alternative**: Use in-memory caching (`cachetools` or `async-lru`). *Rejected* because the agent may scale to multiple worker processes where in-memory caches aren't shared.
- **Rationale**: Since the catalog is parsed every 2 hours by `products_etl`, a 5-minute cache TTL is safe, fast, and prevents database/Meilisearch overload.

### 4. SSE Streaming Endpoint
- **Choice**: Use FastAPI's `StreamingResponse` returning `text/event-stream`. Leverage `pydantic-ai`'s structured stream validation (`agent.run_stream`) to emit partial `ZephyrosResponse` blocks as they are decoded.
- **Alternative**: Stream raw text and let the frontend parse it. *Rejected* because the frontend relies on structured UI blocks.
- **Rationale**: Streaming structured Pydantic models ensures the frontend can gradually render blocks (such as typing text or drawing tables) as the tokens arrive.

## Risks / Trade-offs

- **[Risk]**: Cache invalidation when a product goes out of stock between ETL updates.
  - *Mitigation*: Set a low TTL (3 to 5 minutes) so caching is short-lived.
- **[Risk]**: SSE connection drops or gateway buffering issues.
  - *Mitigation*: Ensure API Gateway's proxy client does not buffer SSE responses (already configured to stream raw responses).
