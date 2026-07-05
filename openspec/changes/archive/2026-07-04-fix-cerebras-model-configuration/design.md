## Context

The React frontend has a dropdown menu to select LLM providers and models. In [AiChatWidget.tsx](file:///C:/Users/ashfromsky/PycharmProjects/smarket/apps/react/frontend/my-react-app/src/modules/AiChat/components/AiChatWidget.tsx), the `PROVIDER_MODELS` object incorrectly maps the `cerebras` provider to `gpt-oss-120b`. 

Furthermore, the backend microservice has `.env` and `.env.example` files containing `CEREBRAS_MODEL=gpt-oss-120b`. 

When the user selects Cerebras, the request fails because the Cerebras API endpoint does not host `gpt-oss-120b` (which is an OpenRouter model). The correct default model for Cerebras in our settings is `llama-3.3-70b`.

## Goals / Non-Goals

**Goals:**
- Replace the invalid `gpt-oss-120b` model option with the valid `llama-3.3-70b` option under Cerebras in the frontend `PROVIDER_MODELS` object.
- Correct `CEREBRAS_MODEL` setting in `services/zephyros_agent/.env` and `services/zephyros_agent/.env.example` files to `llama-3.3-70b`.
- Ensure that both explicit and default model selection flows choose `llama-3.3-70b` when sending queries to Cerebras.

**Non-Goals:**
- Modifying how keys are verified or routing logic inside `zephyros.py`.
- Implementing auto-fallback logic changes.

## Decisions

- **Cerebras Model Choice**: Use `llama-3.3-70b` as the model for Cerebras. This model supports fast inference, structured outputs, and matches the default setting defined in the backend `config.py`.

## Risks / Trade-offs

- **Model Deprecation**: If Cerebras deprecates `llama-3.3-70b` in favor of a newer model, both the frontend dropdown and backend configuration will need to be updated. Since this is already the case for other providers like Gemini and Groq, it is an acceptable risk.
