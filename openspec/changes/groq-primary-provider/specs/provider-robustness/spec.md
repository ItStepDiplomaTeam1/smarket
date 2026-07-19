## MODIFIED Requirements

### Requirement: AI Provider Fallback Priorities
The system SHALL order the automatic fallback candidates chain such that Groq with GPT OSS 20B is tried first, followed by Groq with Llama 3.3, followed by Gemini 3.5 Flash, followed by Cerebras, and lastly OpenRouter.

#### Scenario: Fallback priority chain execution
- **WHEN** a client request does not specify a pinned provider (or when the pinned provider fails)
- **THEN** the system SHALL attempt providers in the following order:
  1. `groq-gpt-oss` (Groq with `openai/gpt-oss-20b`)
  2. `groq-llama` (Groq with `llama-3.3-70b-versatile`)
  3. `gemini` (Google with `gemini-3.5-flash`)
  4. `cerebras` (Cerebras with `qwen3`)
  5. `openrouter` (OpenRouter with free tier model)
