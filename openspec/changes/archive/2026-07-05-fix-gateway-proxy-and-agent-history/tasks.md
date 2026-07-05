## 1. Gateway Fixes

- [x] 1.1 In `services/gateway/app/api/routes/agent.py`, import `Response` from `fastapi`.
- [x] 1.2 In `services/gateway/app/api/routes/agent.py`, update the `if response.status_code >= 400:` block to return `Response` instead of `JSONResponse`, using raw bytes `body` and setting `media_type="application/json"`.

## 2. Agent Fixes

- [x] 2.1 In `services/zephyros_agent/app/agent/zephyros.py`, edit the `SYSTEM_PROMPT` to remove rule 11 which mentions the forbidden `<function=final_result>` XML tag, to resolve LLM negation bias.
- [x] 2.2 In `services/zephyros_agent/app/main.py`, refine history parsing for assistant messages to avoid model tool-use confusion.
