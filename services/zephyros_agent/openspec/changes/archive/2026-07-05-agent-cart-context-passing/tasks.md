## 1. Backend Implementation

- [x] 1.1 Define `ChatMessage` schema and extend `ChatRequest` schema in `app/main.py`
- [x] 1.2 Implement message history parsing logic mapping to Pydantic-AI's `ModelMessage` classes in `app/main.py`
- [x] 1.3 Update `/agent/chat` route in `app/main.py` to pass parsed `message_history` to `agent.run`
- [x] 1.4 Run and verify the backend agent service builds and executes successfully

## 2. Frontend Implementation

- [x] 2.1 Update the payload interface and the POST request structure in `useAiChatApi.ts` to include the `history` array
- [x] 2.2 Update `handleSend` in `AiChatWidget.tsx` to map previous store messages to the `history` format and pass them during submission
- [x] 2.3 Verify the frontend React application compiles successfully
