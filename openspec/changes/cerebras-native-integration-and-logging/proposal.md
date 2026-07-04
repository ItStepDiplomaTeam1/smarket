## Why

The current generic OpenAI integration for Cerebras can lead to API request hangs or incorrect tool call generation due to missing formatting adjustments. Additionally, the backend currently lacks logs for successful chat requests and execution durations, and the frontend is not configured to select Cerebras by default. 

Implementing a native `CerebrasModel` integration, introducing quality logging, and setting Cerebras as the default provider in the frontend will ensure stability, traceability, and a better out-of-the-box user experience.

## What Changes

- Update `zephyros_agent` backend to use Pydantic-AI's native `CerebrasModel` and `CerebrasProvider` classes when initializing the Cerebras model.
- Implement detailed logger entries in the chat route measuring request duration, provider used, and outcome status (success, error, or cancelled).
- Configure the frontend's Zustand store (`useAiChatStore.ts`) to default to the `'cerebras'` provider instead of `null` on first initialization.
- Disable option buttons in `AiChatWidget.tsx` during pending states (`isPending`) to prevent duplicate parallel requests.

## Capabilities

### New Capabilities
- `cerebras-native-integration`: Use `CerebrasModel` and default to Cerebras as the primary AI provider in the frontend.
- `agent-logging`: Log chat query timings, providers, and final statuses for all requests.

### Modified Capabilities

## Impact

- Frontend: Zustand store (`useAiChatStore.ts`) initial state, and option buttons state in `AiChatWidget.tsx`.
- Backend: `zephyros.py` model builder and `main.py` router logic.
