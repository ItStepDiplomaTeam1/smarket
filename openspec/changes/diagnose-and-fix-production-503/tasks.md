## 1. Add Startup Config Logging

- [ ] 1.1 In `services/zephyros_agent/app/main.py`, log the available provider candidates on lifespan startup
- [ ] 1.2 In `services/zephyros_agent/app/main.py`, improve error logging when a request fails to show the exact exception message

## 2. Doppler Config Verification

- [ ] 2.1 Check Doppler project settings to ensure `JWT_SECRET_KEY` is identical across both `dev_gateway` and `dev_auth_service` configs
- [ ] 2.2 Ensure the production-deployed Doppler secret configuration has an active `OPENROUTER_API_KEY` set
