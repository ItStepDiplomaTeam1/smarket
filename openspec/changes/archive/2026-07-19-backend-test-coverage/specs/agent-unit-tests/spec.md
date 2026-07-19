## ADDED Requirements

### Requirement: Tool response shape (search_and_compare_offers)
The `search_and_compare_offers` tool SHALL return a structured response containing at most 3 product offers with their prices per store, the cheapest offer identified as the highlight row, and a fallback message when no results are found.

#### Scenario: Search returns multiple products with offers
- **WHEN** `search_and_compare_offers` is invoked with a query that matches catalog products
- **THEN** the returned structure MUST contain up to 3 product cards each with an `offers` array, and the cheapest offer per product MUST be marked as highlighted

#### Scenario: Search returns no results
- **WHEN** `search_and_compare_offers` is invoked with a query that matches no products
- **THEN** the returned structure MUST contain a `fallback` block with a human-readable message and MUST NOT raise an exception

### Requirement: Add to cart requires user confirmation
The `add_product_to_cart` tool SHALL prompt the user for confirmation (via an `action_button` of type `add_to_cart`) before mutating the user's cart.

#### Scenario: Tool returns confirmation action
- **WHEN** `add_product_to_cart` is invoked with a product id and quantity
- **THEN** the returned structure MUST include an `action_button` block with `type=add_to_cart` and a payload containing `product_id`, `quantity`, and `store_id`, and MUST NOT immediately add the item to the cart

### Requirement: Circuit breaker provider fallback
The `zephyros_agent` SHALL implement a circuit breaker that marks a provider as down for `CIRCUIT_BREAKER_COOLDOWN_SECONDS` after a failure, and on subsequent requests MUST skip providers that are still in cooldown, walking the chain `groq -> gemini -> openrouter -> cerebras`.

#### Scenario: Primary provider fails and fallback is used
- **WHEN** the `groq` provider raises an error on `agent.run`
- **THEN** the agent MUST be marked down, the request MUST be retried with the next provider in the chain (`gemini`), and the cooldown start MUST be recorded for `groq`

#### Scenario: All providers in cooldown reject request
- **WHEN** all four providers are within their cooldown windows
- **THEN** the endpoint MUST respond with HTTP 503 (or consistent degraded response) and MUST NOT attempt an external call

#### Scenario: Cooldown expiry restores provider
- **WHEN** the `groq` provider's cooldown has expired (current time > `_provider_down_until["groq"]`)
- **THEN** the circuit breaker MUST treat `groq` as available for the next request

### Requirement: UI block schema conformance
Tool outputs SHALL conform to the `ZephyrosResponse` schema, returning a JSON object with a `blocks` array where each block has a valid `type` (text, table, product_card, tabs, clarification, action_button, badge, fallback, divider).

#### Scenario: Invalid block type is rejected
- **WHEN** a tool attempts to return a block with `type="invalid_type"`
- **THEN** the agent response validation MUST fail (raising a validation error) and MUST NOT be silently accepted

#### Scenario: Table block highlights cheapest offer
- **WHEN** a tool returns a `table` block for a price comparison
- **THEN** the `highlight_row` field MUST be set to the index of the cheapest available offer row
