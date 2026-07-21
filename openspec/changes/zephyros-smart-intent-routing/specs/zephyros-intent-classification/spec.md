## ADDED Requirements

### Requirement: Semantic classification of user queries
The intent routing layer SHALL classify incoming user queries into active shopping intents (such as search, add, remove, compare, clear) or general chitchat/support intents. Chitchat, greetings, help inquiries, and general system questions SHALL be routed to the `none` intent.

#### Scenario: Active shopping query classified
- **WHEN** the user sends a query requesting product searches or pricing, such as "знайди молоко" or "найдешевше масло"
- **THEN** the system SHALL classify the intent as `catalog_search`
- **AND** SHALL perform a catalog search query to Meilisearch

#### Scenario: General chitchat query classified
- **WHEN** the user sends a greeting or conversational query, such as "привіт" or "як справи"
- **THEN** the system SHALL classify the intent as `none`
- **AND** SHALL NOT perform any catalog search or database query

#### Scenario: System help query classified
- **WHEN** the user asks about the assistant's capabilities or how to use the app, such as "що ти вмієш?" or "як працює кошик?"
- **THEN** the system SHALL classify the intent as `none`
- **AND** SHALL NOT perform any catalog search or database query

### Requirement: Intelligent semantic classification fallback
When static keyword heuristic matching is ambiguous or fails to identify a clear shopping intent, the intent routing layer SHALL perform semantic analysis (using a fast semantic rule classifier, zero-shot classifier prompt, or semantic search) to verify whether the query is chitchat/help before defaulting to a catalog search.

#### Scenario: Conversational search query defaults to search
- **WHEN** the query lacks cart keywords but represents a specific product intent, such as "мені потрібно купити пральний порошок"
- **THEN** the semantic fallback classifier SHALL classify the query as a catalog search
- **AND** the system SHALL proceed with a catalog search for "пральний порошок"

#### Scenario: General system query is caught as chitchat
- **WHEN** the query lacks chitchat keywords but represents a system usage question, such as "як мені порівняти ціни у Novus та Сільпо?"
- **THEN** the semantic fallback classifier SHALL classify the query as `none` intent
- **AND** the system SHALL route it as a chitchat request
