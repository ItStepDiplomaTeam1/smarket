## Context

The Zephyros AI Shopping Agent currently processes requests in isolation without access to previous conversation turns. Consequently, when the user interacts with action buttons (like "Так, додай до кошика") or confirms an offer, the agent cannot associate this request with the product details it previously returned. 

## Goals / Non-Goals

**Goals:**
- Extend the `/agent/chat` endpoint to accept a list of previous messages in the conversation (history).
- Parse the history list on the backend and convert it to Pydantic-AI's native message history objects (`ModelRequest` and `ModelResponse`), passing it to the agent.
- Update the frontend (`my-react-app` widget) to send the current history of messages along with each new request.

**Non-Goals:**
- Implementing database or Redis persistence for message histories. The history is kept on the client (in Zustand) and passed on demand.
- Modifying other backend microservices.

## Decisions

### Decision 1: Request Schema Extension
We will extend the `ChatRequest` schema in the backend to include an optional `history` list parameter:
```python
from typing import Any
from pydantic import BaseModel

class ChatMessage(BaseModel):
    role: str # "user" or "assistant"
    content: str | dict[str, Any]

class ChatRequest(BaseModel):
    message: str
    provider: str | None = None
    model_name: str | None = None
    history: list[ChatMessage] | None = None
```
- **Rationale**: This is a non-breaking extension that cleanly transfers the history state from the client to the server.

### Decision 2: Message History Reconstruction
On the backend, incoming history messages will be mapped to `pydantic_ai.messages.ModelMessage` compatible structures:
- A user message is mapped to:
  ```python
  ModelRequest(parts=[UserPromptPart(content=msg_text, timestamp=utc_now)])
  ```
- An assistant message is mapped to:
  ```python
  ModelResponse(parts=[TextPart(content=msg_text_json)], timestamp=utc_now)
  ```
- **Rationale**: Since Pydantic-AI's structured outputs are deserialized by the framework, the LLM reads past assistant outputs as text/JSON. Using `TextPart` with the JSON content is the most direct and reliable way to feed the model's past structured outputs back into the LLM context.

### Decision 3: Frontend Integration
We will update `useAiChatStore` and the sending hook `useSendAiMessage` to collect all previous messages from the Zustand store, format them, and append them as the `history` parameter:
```typescript
const historyPayload = messages.map(msg => ({
  role: msg.role,
  content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
}));
```
- **Rationale**: This leverages the existing `messages` array in the client store without requiring any schema changes to local state storage.

## Risks / Trade-offs

- **[Risk]** Context length exhaustion on long chats.
  - **Mitigation**: The microservice uses high-capacity context models (e.g. Gemini 2.5 Flash). In the future, we could truncate history to the last $N$ turns, but current grocery shopping chats are brief.
- **[Risk]** Large payload sizes when sending full assistant JSON responses.
  - **Mitigation**: Our `ZephyrosResponse` schema is highly compact. The total size of a 10-turn conversation is well under 20KB, which has negligible latency impact on network traffic.
