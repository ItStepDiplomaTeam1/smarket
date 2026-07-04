## Context

We previously updated the Cerebras model configuration to use `llama-3.3-70b`. However, logs from the Hetzner server showed that the Cerebras Inference platform returned `404 Not Found` for `llama-3.3-70b` because it has been deprecated. The official Cerebras documentation verifies that the only active production model supported on their public endpoints is `gpt-oss-120b`. We must revert to `gpt-oss-120b`.

## Goals / Non-Goals

**Goals:**
- Update `AiChatWidget.tsx` to set the model option for `cerebras` back to `gpt-oss-120b`.
- Update `services/zephyros_agent/.env` and `services/zephyros_agent/.env.example` to set `CEREBRAS_MODEL` back to `gpt-oss-120b`.

**Non-Goals:**
- Modifying other model selections or adding preview/experimental models like `gemma-4-31b`.

## Decisions

- **Use gpt-oss-120b**: This is the only production model supported by the Cerebras Inference public API. It supports OpenAI-compatible function calling, ensuring the agent's tool execution remains functional.

## Risks / Trade-offs

- **None**: This is a direct bug fix reverting to a known functional state.
