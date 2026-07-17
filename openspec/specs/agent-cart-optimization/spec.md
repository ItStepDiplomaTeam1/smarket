# agent-cart-optimization Specification

## Purpose
TBD - created by archiving change extend-agent-capabilities. Update Purpose after archive.
## Requirements
### Requirement: Compare cart prices across stores
The system MUST allow the user to ask the AI agent to compare the total price of their active cart across all available supermarket chains.

#### Scenario: User requests cart comparison
- **WHEN** the user asks "порівняй мій кошик" or "де дешевше купити кошик"
- **THEN** the agent calls the comparison tool, fetching calculations from `cart_service` (`/cart/{cart_id}/compare`)
- **AND** the agent returns a table block showing the store name, total price, count of found/missing items, and highlights the cheapest complete store

### Requirement: Transfer cart to cheapest store
The system MUST provide a quick action button in the AI agent's response to clone or rebuild the user's active cart items scoped to the cheapest store.

#### Scenario: User confirms cart optimization transfer
- **WHEN** the user clicks the "Перенести кошик у [Магазин]" action button or confirms textually
- **THEN** the system creates a duplicate cart with items matched to the target store's catalog offers
- **AND** the agent responds with a success block indicating the new cart has been created and activated

