## ADDED Requirements

### Requirement: Auto-mapping of Deprecated Gemini Models
The backend AI agent model builder SHALL translate requests for deprecated Gemini model identifiers (specifically `gemini-2.5-flash`) to their current active replacements (specifically `gemini-3.5-flash`) before making any API calls to the Google Gemini provider.

#### Scenario: Request for deprecated model is translated
- **WHEN** the agent chat endpoint receives a request with `requested_model="gemini-2.5-flash"`
- **THEN** the system SHALL construct the model using `gemini-3.5-flash` instead
- **AND** the API call to Google Gemini SHALL succeed

### Requirement: Local Storage Model Name Migration
The frontend Zustand store SHALL validate the loaded model name from local storage on mount. If the loaded model name is not present in the list of available models for the active provider, the store SHALL automatically migrate/reset the model name to the provider's default recommended model.

#### Scenario: Deprecated model name in local storage is reset
- **WHEN** the frontend mounts the chat widget
- **AND** the persisted store contains `modelName="gemini-2.5-flash"` for provider `gemini`
- **THEN** the store SHALL update `modelName` to `"gemini-3.5-flash"`
- **AND** the widget SHALL display the correct recommended model in the settings

### Requirement: Search-Hit Metadata Fallback on product_service Failure
The AI agent `search_and_compare_offers` tool SHALL fall back to search hit metadata (including price, old price, store name, and stock status) to construct the offer list if the request to `product_service` for detailed offers fails or returns a 404.

#### Scenario: Product service returns 404 for top hits
- **WHEN** the `search_and_compare_offers` tool queries `product_service` for a search hit ID
- **AND** `product_service` responds with a 404 Not Found error (or connection timeout)
- **THEN** the tool SHALL synthesize an offer list using the search hit's `price`, `old_price`, `store_id`, `store_name`, `retail_chain`, and `in_stock` fields
- **AND** the tool SHALL return these synthesized offers to the agent for rendering the UI comparison block
