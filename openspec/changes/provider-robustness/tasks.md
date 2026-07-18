## 1. Provider Health Verification Probing

- [x] 1.1 Implement a `probe_provider_health` function in `services/zephyros_agent/app/agent/zephyros.py` that runs a lightweight query with a strict timeout (e.g. 3.0s) to verify API connectivity and credentials.
- [x] 1.2 Integrate probing check in the startup `lifespan` of `services/zephyros_agent/app/main.py` to detect broken providers and put them on immediate cooldown (e.g., if API keys are invalid or connectivity is down).

## 2. Expanded Circuit Breaking

- [x] 2.1 Update exception handling in `/agent/chat` and `/agent/summarize-plan` endpoints to trigger `_mark_down` on timeouts, connection errors, and 5xx model HTTP errors.
- [x] 2.2 Add exception handling and circuit breaking to the `/agent/chat/stream` endpoint, ensuring that failures during streaming also trigger `_mark_down` for that provider.

## 3. Visibility & Monitoring

- [x] 3.1 Modify the `/health` endpoint in `services/zephyros_agent/app/main.py` to display configured providers, active status, cooldown status, and remaining cooldown seconds.
- [x] 3.2 Verify the provider health checks, blocking mechanism, and fallback logic manually or via automated test scripts.
