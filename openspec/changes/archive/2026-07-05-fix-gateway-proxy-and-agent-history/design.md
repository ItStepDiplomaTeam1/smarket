## Context

When the upstream microservices (like `zephyros_agent`) return an HTTP error (e.g. 502/503 from provider exhaustion, 429 from rate limits, or 400 from tool formatting errors), the API Gateway intercepts the response and tries to forward it. Currently, it uses `JSONResponse` with the raw byte-string response body from the upstream, causing a serialization exception that returns a 500 Internal Server Error without CORS headers to the client.

Additionally, we need to ensure that the agent correctly parses message histories for multi-turn cart additions and does not trigger negation biases in prompt rules.

## Goals / Non-Goals

**Goals:**
- Fix the gateway's error-forwarding handler to correctly proxy any byte response (status >= 400) without crashing.
- Ensure that CORS headers are preserved on error responses from the gateway.
- Confirm agent behavior for cart confirmations and clean up potential prompt confusion.

**Non-Goals:**
- Modifying the underlying LLM provider architectures.
- Rewriting the core cart schema or endpoints.

## Decisions

### Decision 1: Use Raw Response in API Gateway proxy
In [gateway/app/api/routes/agent.py](file:///c:/Users/ashfromsky/PycharmProjects/smarket/services/gateway/app/api/routes/agent.py), when status code is `>= 400`, return a raw `Response` instead of `JSONResponse`.

- **Rationale:** `Response` directly accepts bytes or strings and returns them without parsing or re-encoding. This is highly efficient and robust against arbitrary upstream error bodies (including non-JSON or raw bytes).
- **Alternatives Considered:** 
  - `json.loads(body)` first and pass the dict to `JSONResponse`. *Rejected* because if the upstream returns an HTML error page (like a 502 from Nginx) or raw text, `json.loads` will throw a `JSONDecodeError`, causing another 500 crash in the gateway.

### Decision 2: Remove negation prompt rules in Zephyros System Prompt
Remove rule 11 from [zephyros.py](file:///c:/Users/ashfromsky/PycharmProjects/smarket/services/zephyros_agent/app/agent/zephyros.py) that mentions the forbidden XML-like syntax `<function=final_result>`.

- **Rationale:** Mentioning forbidden XML tags primes LLMs (specifically Llama models) to output those tags due to negation bias when they are confused by input history. Removing the forbidden tags from the prompt reduces the chance of the LLM generating them.

## Risks / Trade-offs

- **[Risk]** Downstream response might not have the correct media type headers.
  - *Mitigation:* Explicitly set `media_type="application/json"` in the raw `Response` constructor.
