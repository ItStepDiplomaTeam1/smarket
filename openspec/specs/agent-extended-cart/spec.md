# agent-extended-cart Specification

## Purpose
TBD - created by archiving change extend-agent-capabilities. Update Purpose after archive.
## Requirements
### Requirement: Clear shopping cart via AI Agent
The system MUST allow the authenticated user to fully clear all items from their shopping cart by messaging the AI agent.

#### Scenario: User requests cart clearance
- **WHEN** the user sends a message like "очисти мій кошик"
- **THEN** the agent calls the clear cart tool, which deletes all items from the user's active cart via `cart_service`
- **AND** the agent replies with a confirmation text block

### Requirement: Remove specific item from cart via AI Agent
The system MUST allow the authenticated user to remove a specific product from their shopping cart by specifying the product name or ID to the AI agent.

#### Scenario: User requests removal of a product
- **WHEN** the user sends a message like "видали молоко з кошика"
- **THEN** the agent resolves the matching product in the cart, calls the remove item tool to delete it via `cart_service`
- **AND** the agent replies with a confirmation text block and a badge showing the removal status

