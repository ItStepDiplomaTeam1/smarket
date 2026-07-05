## Context

The agent continues to fail to respond on the production host. To debug this efficiently, we must add logging to identify which provider keys are loaded on startup and cross-check the JWT secrets consistency.

## Goals / Non-Goals

**Goals:**
- Log the list of configured providers when `zephyros_agent` starts up in production.
- Enable the user to cross-check `JWT_SECRET_KEY` settings in Doppler.

**Non-Goals:**
- Changing the agent core algorithm or Pydantic AI schemas.

## Decisions

- **Log Configured Providers on Lifespan Startup**: In `app/main.py`, within the `lifespan` startup hook, log the return value of `available_provider_chain()`. This will immediately show in the docker logs whether Doppler is correctly injecting the API keys (`OPENROUTER_API_KEY`, etc.).
- **Verify JWT Secrets**: Since we got "Invalid token" from the gateway when trying to use an `auth_service` issued token, we suspect `JWT_SECRET_KEY` in `dev_gateway` config is different from `dev_auth_service` config in Doppler.

## Risks / Trade-offs

- **Exposing Secrets**: We must only log the *presence* of keys (via `available_provider_chain()`), not the actual secret values.
  - *Mitigation*: The log only prints the provider names list (e.g. `['openrouter', 'groq']`), keeping key values completely hidden.
