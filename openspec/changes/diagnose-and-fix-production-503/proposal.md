## Why

The frontend chat widget continues to display connection failure messages. We need to diagnose the exact cause of the 503 error on the production host (whether it is an unhealthy agent container, missing Doppler API key configurations, or a JWT secret key mismatch between the gateway and the auth service).

## What Changes

- Verify backend logs of `zephyros_agent` on the Hetzner server during a chat request.
- Cross-check `JWT_SECRET_KEY` config settings between the `gateway_service` and `auth_service` in the Doppler secrets manager.
- Implement detailed diagnostics logging in `zephyros_agent` when no providers can be resolved to help identify root causes.

## Capabilities

### New Capabilities
- `agent-debugging`: Integrates advanced diagnostic logs for provider resolution errors in `zephyros_agent`.

### Modified Capabilities

## Impact

- **Logging**: Added debug logs inside `zephyros_agent` routing middleware.
- **Secrets Management**: Verification of Doppler secrets consistency.
