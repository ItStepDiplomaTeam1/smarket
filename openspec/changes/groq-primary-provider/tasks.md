## 1. Implementation

- [x] 1.1 Update `useAiChatStore.ts` to set default provider to `groq` and model to `openai/gpt-oss-20b`
- [x] 1.2 Update `AiChatWidget.tsx` provider model list for Groq and Cerebras
- [x] 1.3 Update `config.py` default model names (`openai/gpt-oss-20b` and `qwen3`)
- [x] 1.4 Reconfigure `zephyros.py` to order `PROVIDER_CHAIN` as requested, handling virtual candidates
- [x] 1.5 Update `_is_down` in `main.py` to inspect base provider cooldown state

## 2. Verification and Git Operations

- [x] 2.1 Verify backend code style and tests in `zephyros_agent`
- [x] 2.2 Commit the Groq priority and model changes
- [x] 2.3 Push changes to remote repository
