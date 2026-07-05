# cart-context-passing Specification

## Purpose
TBD - created by archiving change agent-cart-context-passing. Update Purpose after archive.
## Requirements
### Requirement: Send chat history from frontend
The frontend client SHALL capture the current conversation's message history and pass it in the request payload under the `history` parameter when invoking the agent chat endpoint.

#### Scenario: User sends chat message
- **WHEN** the user types and sends a message or clicks a quick option/action button in the chat UI
- **THEN** the client sends a POST request to `/api/v1/agent/chat` with the user's `message` and a `history` list of previous messages in the current conversation

### Requirement: Parse history and run agent with message history on backend
The backend agent service SHALL accept the `history` parameter, transform each item into a `pydantic_ai` compatible message object (`ModelRequest` for user prompts, `ModelResponse` for assistant responses), and pass the reconstructed history list to `agent.run` as the `message_history` argument.

#### Scenario: Chat request with history received
- **WHEN** a POST request to `/agent/chat` containing a list of `history` messages is received
- **THEN** the backend converts user messages to `ModelRequest` with `UserPromptPart` and assistant messages to `ModelResponse` with `TextPart`, passes them to `agent.run(..., message_history=...)`, and returns the assistant's response

