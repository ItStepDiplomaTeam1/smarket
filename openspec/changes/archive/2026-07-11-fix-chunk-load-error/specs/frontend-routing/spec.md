## ADDED Requirements

### Requirement: Router Error Element Integration
The application router SHALL define a root error element to handle layout and navigation crashes.

#### Scenario: Route error element is configured
- **WHEN** the browser creates the router using `createBrowserRouter`
- **THEN** the router configuration MUST specify an `errorElement` on the root route
