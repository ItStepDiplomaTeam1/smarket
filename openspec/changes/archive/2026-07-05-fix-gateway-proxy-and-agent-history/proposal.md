## Why

The Smarket application experiences a failure during AI agent operations where certain requests (specifically multi-turn dialogs requesting a product addition to the cart) fail with a blank "Internal Server Error" and a browser CORS block. 

This occurs because:
1. The API Gateway crashes with a 500 serialization error when trying to parse and return backend error responses (e.g. 502/503/429) that are byte-strings instead of JSON objects.
2. The `zephyros_agent` backend fails or times out when handling history because Llama models (on Groq and Cerebras) generate invalid XML-like tool calls (e.g. `<function=final_result>`) when the message history is improperly formatted as text instead of structured model responses.

## What Changes

1. **API Gateway Error Forwarding:** Modify the proxy route handler in the gateway to forward error responses using FastAPI's raw `Response` instead of `JSONResponse`. This prevents the gateway from crashing and allows correct CORS headers and error details to reach the client.
2. **Agent History Formatting:** Standardize the message history conversion in the agent's endpoint to feed structured model responses back to `pydantic-ai` instead of raw serialized text.
3. **Agent System Prompt Refinement:** Tweak the system prompt to avoid triggering negation bias for forbidden XML-like syntax.

## Capabilities

### New Capabilities
- `gateway-error-handling`: API Gateway must properly proxy and return downstream HTTP error responses of type bytes without crashing.
- `agent-message-history`: Agent service must format previous assistant responses in history as proper structured/tool messages so LLM providers can parse and generate subsequent responses without invalid XML formats.

### Modified Capabilities
<!-- None -->

## Impact

- **API Gateway:** Modified proxy router logic in `services/gateway/app/api/routes/agent.py`.
- **Zephyros Agent:** Modified history ingestion logic in `services/zephyros_agent/app/main.py`.
