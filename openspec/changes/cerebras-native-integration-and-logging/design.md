## Context

To improve the stability and predictability of the Cerebras integration, we will replace the generic `OpenAIChatModel` setup with the native `CerebrasModel` from `pydantic-ai`. 

To trace query hangs and client cancellations, we will add request duration timing and explicit `asyncio.CancelledError` handling to logs. 

For the frontend, we will make Cerebras the default pre-selected provider in the Zustand store and disable option buttons in the UI during pending requests to prevent duplicate submissions.

## Goals / Non-Goals

**Goals:**
- Instantiate `CerebrasModel` and `CerebrasProvider` inside `zephyros.py`.
- Log duration for successful chat requests and capture `asyncio.CancelledError` (logging it as a warning before re-raising).
- Change default Zustand store state in the frontend to pre-select `'cerebras'`.
- Disable options and action buttons in `AiChatWidget.tsx` when `isPending` is `true`.

**Non-Goals:**
- Tweak timeout thresholds or other provider models.

## Decisions

- **Cerebras Model Class**: Use the built-in `CerebrasModel` and `CerebrasProvider` classes from `pydantic_ai`.
- **Zustand Initial State**: Update `useAiChatStore.ts` initial values: `provider` will default to `'cerebras'` and `modelName` to `null` (letting it resolve to the backend default `gpt-oss-120b`).
- **Cancellation Logging**: Catch `asyncio.CancelledError` explicitly in the chat router, log `logger.warning("Request cancelled by client disconnection.")`, and re-raise it. This preserves standard ASGI cancellation behavior while making it visible in logs.

## Risks / Trade-offs

- **PowerShell / Venv package versions**: The local virtual environment has been verified to contain the `pydantic_ai.models.cerebras.CerebrasModel` class. If the production docker image is built with an outdated dependency version, it could fail.
  - *Mitigation*: The `uv.lock` and requirements files will build with the latest dependencies matching our tested workspace setup.
