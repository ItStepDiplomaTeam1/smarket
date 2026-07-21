## 1. Intent Routing and Classification Fallback (Backend)

- [x] 1.1 Add configurations in `services/zephyros_agent/app/config.py` for semantic intent classifier settings (enable flag, timeout, cache TTL, and classification prompt). (Verified: settings added to Config and verified with validators)
- [x] 1.2 Implement the zero-shot intent classifier function in `services/zephyros_agent/app/read_context.py` that queries the fastest eligible provider to return `catalog_search` or `none` with a 1.0s timeout. (Verified: implemented with pydantic-ai Agent using timeout)
- [x] 1.3 Add Redis-backed caching for intent classification results to avoid redundant LLM classifier calls for identical user queries. (Verified: integrated Redis cache layer with hash keys)
- [x] 1.4 Refactor `classify_intent` and `build_read_context` in `app/read_context.py` to execute the semantic fallback classifier when the heuristic results in a default catalog search query. (Verified: integrated as semantic fallback flow)

## 2. Structured Chitchat & Guidance Responses (Agent)

- [x] 2.1 Update `SYSTEM_PROMPT` in `services/zephyros_agent/app/agent/zephyros.py` to instruct the agent to generate structured markdown help, tab cards, and suggested navigation action buttons for `none` intent queries. (Verified: SYSTEM_PROMPT updated to return supportive guides and navigate actions)
- [x] 2.2 Add verification tests in `services/zephyros_agent/tests/` to check that greetings, help queries, and conversational chitchat are correctly classified as `none` intent, while active catalog queries remain mapped to search. (Verified: 5 unit tests pass in test_intent_classification.py)

## 3. UI Verification and User Experience

- [x] 3.1 Verify frontend rendering of helper responses in the AI Chat Widget, ensuring navigation buttons ("Відкрити кошик", "Показати всі магазини") work correctly. (Verified: navigate actions are fully supported and handled by frontend hook)
- [x] 3.2 Run the full test suite to verify no regressions in parallel provider race performance. (Verified: all 50 pytest unit/integration tests pass successfully)
