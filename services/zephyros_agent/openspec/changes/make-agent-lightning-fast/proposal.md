## Why

The current AI chatbot assistant (Promin) has high latency (3-6+ seconds) due to three consecutive LLM roundtrips per user query, fallback chain prioritization of slow free models on OpenRouter, lack of tool results caching, and unary API responses. Transitioning the system to fast AI providers, combining tools to reduce LLM roundtrips, introducing Redis-based caching, and adding SSE streaming will deliver a near-instant user experience (sub-second perceived latency).

## What Changes

- Reorder the AI provider fallback chain to prioritize Groq and Gemini over OpenRouter, and replace default models with fast ones (e.g. `llama-3.1-8b-instant`).
- Add a new combined tool `search_and_compare_offers` to fetch search results and product offers in a single LLM tool call, replacing sequential calls to `search_catalog` and `compare_product_offers`.
- Integrate Redis caching for the combined tool to avoid querying Meilisearch and PostgreSQL on identical/similar requests.
- Implement Server-Sent Events (SSE) streaming for the chat endpoint to stream structured blocks (and execution thoughts/status messages) to the client.

## Capabilities

### New Capabilities
- `agent-performance-optimizations`: Implements the combined catalog tool, Redis caching of query results, and Server-Sent Events (SSE) streaming of chat responses.

### Modified Capabilities
- `agent-routing`: Modify the routing priority and default models to prioritize fast API providers (Groq, Gemini) and avoid slow OpenRouter free models by default.

## Impact

- **zephyros_agent**: Modified provider fallback chain configuration, new combined tool registration, Redis connection setup, and a new streaming endpoint `/agent/chat/stream`.
- **gateway**: Update routing to support proxying `/agent/chat/stream` as an event stream.
- **frontend / react app**: Support event stream parsing and dynamic rendering of partial blocks or status notifications.
