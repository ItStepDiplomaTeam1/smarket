## ADDED Requirements

### Requirement: Trigger frontend page navigation
The system MUST support redirecting the user to specific pages of the Smarket application (e.g., store page, product page, cart details) via interactive buttons inside the AI agent widget.

#### Scenario: User clicks a navigate button
- **WHEN** the agent returns a block of type `action_button` with action `navigate` and a valid target route
- **AND** the user clicks this button
- **THEN** the React frontend router redirects the browser window to the specified route (e.g., `/shops/metro` or `/product/123`)

### Requirement: Apply catalog search filters
The system MUST allow the AI agent to suggest and automatically apply search, sorting, or store filters to the main product catalog view.

#### Scenario: User applies filters from agent recommendation
- **WHEN** the agent returns an action button with action `apply_filters` containing query parameters like store, price limits, or lactose-free constraints
- **AND** the user clicks it
- **THEN** the frontend updates the Zustand catalog store with these filters, reloading the catalog page layout to reflect the filtered results
