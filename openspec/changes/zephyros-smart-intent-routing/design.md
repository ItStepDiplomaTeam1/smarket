## Context

Zephyros classifies user queries in `build_read_context` (inside `services/zephyros_agent/app/read_context.py`) before routing to the provider race. The current intent classifier uses simple keyword lists and string checks:
1. Greets/chitchat are matched against a static list `_NON_SEARCH_MESSAGES`.
2. Clear/add/remove actions match specific verbs.
3. Everything else defaults to `catalog_search`.

This keyword approach fails on complex queries (e.g., "Хочу дізнатися як працює доставка", "Як замовити товар?", "Що ти вмієш?"), which default to `catalog_search`, triggering empty Meilisearch queries and rendering irrelevant catalog search hits. We need a hybrid classifier that combines fast heuristics with a semantic categorization step for ambiguous queries.

## Goals / Non-Goals

**Goals:**
- **Intent Accuracy**: Accurately distinguish general questions, help requests, and conversational chitchat from actual product search intents.
- **Performance**: Keep intent classification latency under 400ms by utilizing caching and fast providers.
- **Conversational UX**: Route general questions to the `none` intent so the assistant can render helpful markdown guides, interactive action buttons, and suggested follow-ups.

**Non-Goals:**
- No new external microservices or machine learning frameworks (e.g. PyTorch, spaCy) in the agent stack.
- No changes to the core parallel provider race model.

## Decisions

### D1: Hybrid Classifier Flow
We will implement a two-step classification flow:
1. **Heuristics First**: Match queries against improved static keyword lists. If a clear cart action or direct greeting matches, return the intent immediately.
2. **Semantic Fallback**: If the query would default to `catalog_search`, run a fast zero-shot LLM check to confirm if it is a shopping query or a general/help question.

```
                  User Query
                      │
                      ▼
           [Heuristic Keyword Match]
            /                     \
    Matches direct           No direct match
  cart/greeting intent       (defaults to catalog_search)
          │                               │
          ▼                               ▼
    Return Intent           [Zero-Shot LLM Classifier]
                                  /            \
                       Classifies as         Classifies as
                      catalog_search             none
                            │                     │
                            ▼                     ▼
                       Run search,          Return none intent,
                     catalog context         chitchat response
```

### D2: Fast Zero-Shot LLM Classifier
For queries that default to `catalog_search`, we will perform a lightweight classification request to the fastest eligible provider (e.g., Groq Llama or Gemini) with a max token limit of 5. The prompt instructs the model to return exactly one word: `catalog_search` or `none`.
- **Latency Control**: The classification query will have a strict timeout of 1.0s. If it times out or fails, it defaults safely to `catalog_search`.
- **Caching**: The classification result will be cached in Redis with a 24-hour TTL.

### D3: Structured Help Responses
We will update the system prompt in `app/agent/zephyros.py` to instruct models on how to format answers for `none` intent queries. When no catalog context is supplied, they must use a combination of text, tab structures, and action buttons (`navigate`, `apply_filters`) to direct the user.

## Risks / Trade-offs

- **[Risk]** Additional latency for catalog search queries due to the zero-shot classifier fallback.
  - *Mitigation*: Limit zero-shot checks to queries that contain question marks, help pronouns ("як", "чому", "де"), or when the query length is long but contains no nouns. Use a strict 1.0s timeout and Redis caching to eliminate checks for repeated queries.
- **[Risk]** Classifier misclassifying a product search as chitchat (False Negative).
  - *Mitigation*: If the query contains specific product adjectives or brands, skip classification and default to search.
