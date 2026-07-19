## Context

The `zephyros_agent` chat and streaming endpoints process requests. Currently, when the client explicitly requests a provider (e.g. `'gemini'`), candidates contains only that provider:
```python
if request.provider:
    candidates = [request.provider.lower()]
```
If Gemini fails with a 429 rate limit or 5xx server error, the loop immediately terminates and returns the error back to the client.

## Goals / Non-Goals

**Goals:**
- Enable fallback/failover to other configured and active providers if the preferred provider fails.
- Order the candidates list such that the preferred provider is tried first.

## Decisions

### Decision 1: Candidates array transformation
- **Option A (Chosen):** Resolve candidates as `[preferred_provider] + [all_other_configured_providers]`.
  * *Rationale:* This preserves the client's preference while providing a complete set of fallbacks in case of errors.

## Risks / Trade-offs

- **Risk:** The user might get a model different from the one they selected.
  * *Mitigation:* This is a necessary trade-off for high availability. Getting a response from Llama 3 or Gemini 1.5/2.5 is vastly superior to getting an absolute 429/503 error screen in the chat.
