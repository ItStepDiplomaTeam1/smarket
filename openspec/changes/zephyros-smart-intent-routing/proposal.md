## Why

Currently, Zephyros (the AI shopping assistant) classifies user intent using deterministic keyword matches in `classify_intent` (defined in `services/zephyros_agent/app/read_context.py`). Any message that does not match specific cart keywords or basic chitchat words defaults to a `catalog_search` intent, which triggers an expensive Meilisearch query. When a user asks general queries, questions about how Smarket works, or has conversational chitchat that isn't matched by the static lists, they receive irrelevant catalog search hits or empty/degraded catalog fallback blocks instead of helpful chitchat or system guidance.

This change introduces a smarter intent classification layer to cleanly distinguish between active shopping intents (searching, adding to cart, comparing) and general chitchat or system/usage questions, ensuring better resource efficiency and a superior conversational user experience.

## What Changes

- **Smart Intent Classifier**: Enhance the intent routing layer in the backend to combine keyword matches with semantic categorization (using either a lightweight LLM classifier or a semantic similarity model) to accurately identify chitchat/usage questions.
- **Explicit General/Help Intent**: Route general support, chitchat, and usage questions to the `none` intent, bypassing catalog searches and database queries.
- **Helpful Chitchat Handler**: Update the `readonly_agent` system prompt and default handlers to render conversational chitchat or system help blocks, complete with suggested prompts and navigation buttons, instead of search fallbacks.

## Capabilities

### New Capabilities
- `zephyros-intent-classification`: Semantic classification of user queries into active shopping intents vs general chitchat or usage queries.

### Modified Capabilities
- `agent-shopping-copilot-experience`: Render structured assistant help, system usage cards, and suggested shopping prompts when handling chitchat or system queries under the `none` intent.

## Impact

- `services/zephyros_agent/app/read_context.py` — Implement the smart classification logic combining fast heuristics with a semantic categorization step.
- `services/zephyros_agent/app/agent/zephyros.py` — Update the system prompt to explicitly format conversational and help responses using structured cards/buttons when no catalog context is active.
- `services/zephyros_agent/app/config.py` — Add configuration settings for the intent classifier (e.g. classification threshold, local model settings, or classifier prompt).
- `services/zephyros_agent/tests/` — Add tests verifying correct intent classification across a suite of shopping vs chitchat test queries.
