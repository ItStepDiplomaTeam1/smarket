# frontend-routing Specification

## Purpose
TBD - created by archiving change frontend-agent-unblock. Update Purpose after archive.
## Requirements
### Requirement: Optional Provider Parameter
The frontend client SHALL support omitting or sending `null` for the provider override to enable backend-managed routing.

#### Scenario: Send message with auto-choice active
- **WHEN** the user sends a chat message and "Auto-choice" is active
- **THEN** the request payload to `/api/v1/agent/chat` SHALL contain `provider: null` and `model_name: null`

### Requirement: Backend Fallback Default
When the request payload contains `provider: null`, the backend SHALL execute the automatic prioritized failover routing chain.

#### Scenario: Backend chain failover
- **WHEN** a request with `provider: null` is received
- **THEN** the backend SHALL route the request to the first healthy, configured AI provider in the chain

### Requirement: Router Error Element Integration
The application router SHALL define a root error element to handle layout and navigation crashes.

#### Scenario: Route error element is configured
- **WHEN** the browser creates the router using `createBrowserRouter`
- **THEN** the router configuration MUST specify an `errorElement` on the root route

