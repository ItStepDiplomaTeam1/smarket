## 1. Prompt and Config Fixes

- [x] 1.1 In `services/zephyros_agent/app/agent/zephyros.py`, add a rule in the `SYSTEM_PROMPT` to explicitly forbid formatting tool calls in XML tags (e.g. `<function=final_result>`)
- [x] 1.2 In `services/zephyros_agent/app/config.py`, change default `CEREBRAS_MODEL` to `"llama-3.3-70b"`
