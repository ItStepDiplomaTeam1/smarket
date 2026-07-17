## Why

The Zephyros AI Shopping Agent currently executes requests in a stateless manner without conversation context. When a user clicks the "Так, додай до кошика" button (which sends "Так, додай до кошика" to the agent) or replies with confirmation, the agent cannot associate this action with the product comparison or product card it previously showed, resulting in a breakdown of the shopping flow.

## What Changes

- **Backend / Agent service API**: Extend `/agent/chat` request schema (`ChatRequest`) to accept a `history` parameter containing previous conversation messages.
- **Backend / Message history loader**: Parse the incoming message history and construct `pydantic_ai.messages.ModelMessage` compatible objects (i.e. `ModelRequest` and `ModelResponse`), then pass it to `agent.run(..., message_history=...)`.
- **Frontend / API hook**: Update `useSendAiMessage` to accept the chat history payload and send it in the request body.
- **Frontend / Widget**: Update the message submission logic in `AiChatWidget.tsx` to compile the current list of messages in the store and pass it as the history payload.

## Capabilities

### New Capabilities

- `cart-context-passing`: Enforces the passing and parsing of conversation history, allowing the agent to remember the previously proposed product and execute the `add_product_to_cart` tool upon user confirmation.

### Modified Capabilities

None.

## Impact

- `services/zephyros_agent/app/main.py`: Modified `ChatRequest` schema and `/agent/chat` router.
- `apps/react/frontend/my-react-app/src/hooks/api/useAiChatApi.ts`: Updated `useSendAiMessage` hook payload.
- `apps/react/frontend/my-react-app/src/modules/AiChat/components/AiChatWidget.tsx`: Updated message sending handler.
