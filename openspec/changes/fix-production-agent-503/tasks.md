## 1. Deployment Updates

- [ ] 1.1 Pull the latest code (`git pull`) on the Hetzner server to get the setuptools and `orjson` fix
- [ ] 1.2 Rebuild the `zephyros_agent` docker container using `docker compose build zephyros_agent` on the Hetzner host
- [ ] 1.3 Restart the agent service using `docker compose up -d zephyros_agent`

## 2. Environment Verification

- [ ] 2.1 Verify that Doppler secrets for `dev_zephyros_agent` (or the production equivalent configuration) contain a valid `OPENROUTER_API_KEY`
- [ ] 2.2 Restart the backend services to ensure new keys are correctly loaded
