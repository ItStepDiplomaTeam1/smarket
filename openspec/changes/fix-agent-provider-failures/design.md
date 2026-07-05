## Context

Backend log analysis of production failures shows:
1. **OpenRouter**: 429 rate limits on free-tier model.
2. **Gemini**: 403 Forbidden because Google AI Studio blocks European datacenter IPs (like Hetzner).
3. **Groq**: 400 Bad Request because Llama 3.3 outputs `<function=final_result>...` in text instead of using native JSON tool calls.
4. **Cerebras**: Configured model name (`gpt-oss-120b`) is invalid.

## Goals / Non-Goals

**Goals:**
- Fix the Groq 400 tool-use failure by refining system prompt constraints.
- Fix Cerebras model name.
- Guide the user on resolving 429 (OpenRouter) and 403 (Gemini).

**Non-Goals:**
- Removing structured outputs entirely.

## Decisions

- **System Prompt Warning**: Add a rule to the system prompt to explicitly prevent Llama from outputting XML tags like `<function=final_result>` in the response text, forcing it to use native tool calling.
- **Cerebras Model Default**: Update `CEREBRAS_MODEL` to `"llama-3.3-70b"`.

## Risks / Trade-offs

- **LLM Compliance**: Llama might still occasionally fail tool use if Groq's parser is highly unstable.
  - *Mitigation*: Fallback provider logic automatically switches to next provider if Groq fails.
