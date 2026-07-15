## ADDED Requirements

### Requirement: Theme Selection State
The system SHALL provide a global state to manage the user's preferred theme in the admin panel (light or dark). The state MUST be persisted locally so it survives page reloads.

#### Scenario: User switches to dark theme
- **WHEN** the user switches the theme to dark
- **THEN** the state is saved in local storage and the `dark` class is applied to the application root element

#### Scenario: Application initialization
- **WHEN** the user loads the admin panel
- **THEN** the system applies the previously saved theme from local storage and sets the root element classes accordingly
