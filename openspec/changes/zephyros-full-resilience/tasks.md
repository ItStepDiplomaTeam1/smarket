## 1. Backend Resiliency Updates (services/zephyros_agent)

- [x] 1.1 Update `build_model` in `services/zephyros_agent/app/agent/zephyros.py` to translate deprecated/invalid models (`gemini-2.5-flash` -> `gemini-3.5-flash`, `qwen3` -> `gpt-oss-120b`) while retaining `openai/gpt-oss-20b` as the default Groq model.
- [x] 1.2 Update configurations in `services/zephyros_agent/app/config.py` to use correct active default model names.
- [x] 1.3 Update `lifespan` in `services/zephyros_agent/app/main.py` to increase startup health check timeout from 3.0s to 10.0s.
- [x] 1.4 Update `search_and_compare_offers` in `services/zephyros_agent/app/tools.py` to fallback to search hit metadata (price, store, stock) if `product_service` details query fails with a connection error or returns a 404.

## 2. Frontend Resiliency Updates (apps/react)

- [x] 2.1 Update `useAiChatStore.ts` store logic to check and automatically migrate or reset model names in local storage that are no longer available for the active provider.

## 3. Verification & Deployment

- [x] 3.1 Run tests to verify the local backend builds and starts up successfully.
- [ ] 3.2 Commit all changes and push to the remote git repository.
