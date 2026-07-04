## Why

The backend logs show that all 4 configured provider backends fail during request execution (OpenRouter: 429 rate limit on free tier, Gemini: 403 forbidden due to EU datacenters blocking, Groq: 400 Bad Request due to Llama 3.3 formatting tool calls as XML tags instead of standard JSON, Cerebras: incorrect default model name config). We need to correct the code configurations and system instructions to make these backends robust.

## What Changes

- Add clear formatting directives to `SYSTEM_PROMPT` in `app/agent/zephyros.py` to prevent Llama models from writing tool calls inside XML tags.
- Update `CEREBRAS_MODEL` default name to `"llama-3.3-70b"`.
- Document clear resolution steps for the OpenRouter 429 and Gemini 403 errors.

## Capabilities

### New Capabilities
- `provider-robustness`: Enhances LLM system instructions and configurations to support multi-provider compatibility.

### Modified Capabilities

## Impact

- **Model Prompts**: `zephyros.py` updated with strict function-calling rules.
- **Configuration Defaults**: `config.py` updated.
