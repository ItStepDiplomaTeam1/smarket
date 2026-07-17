## Why

The deployed gateway on Hetzner returns `503 Service Unavailable` when trying to POST to `/api/v1/agent/chat`. This is likely because the `zephyros_agent` service is either crashing/failing its healthcheck due to missing packages (like `orjson`) before our build fix, or because no AI provider keys (like `OPENROUTER_API_KEY` or `GROQ_API_KEY`) are injected into the container's environment.

## What Changes

- Redeploy the `zephyros_agent` service using the latest code containing the package/setuptools fix.
- Verify environment variable configuration on the Hetzner server (using Doppler or `.env`).
- Improve error messages or logging when no candidates are found in `available_provider_chain()`.

## Capabilities

### New Capabilities
- `agent-deployment`: Defines runtime environment requirements and deployment validation steps for `zephyros_agent`.

### Modified Capabilities

## Impact

- **Deployment**: `zephyros_agent` needs to be rebuilt and restarted on the Hetzner host.
- **Secrets Management**: Verify that `OPENROUTER_API_KEY` is present in Doppler/env configuration.
