## ADDED Requirements

### Requirement: Shopper-focused automatic mode
The shopper AI widget SHALL not display controls for selecting providers or model identifiers. It SHALL describe the assistant in shopper-facing language and leave routing automatic.

#### Scenario: Shopper opens assistant settings
- **WHEN** an authenticated shopper opens assistant settings
- **THEN** no provider or model selector SHALL be shown
- **AND** the panel SHALL contain only shopper-meaningful preferences or help

### Requirement: Understandable assistant state feedback
The widget SHALL show distinct ready, working, answered, and degraded states using plain Ukrainian language without provider names, raw error text, or model identifiers.

#### Scenario: Providers are exhausted
- **WHEN** the service returns a structured degraded response
- **THEN** the widget SHALL explain that the assistant is temporarily unavailable in plain language
- **AND** SHALL present an accessible Retry control when supplied by the response

### Requirement: Actionable shopping results
The widget SHALL render structured product, comparison, filter, navigation, and cart actions with clear labels. Mutating actions SHALL require explicit confirmation before a request is sent.

#### Scenario: Shopper uses a suggested add-to-cart action
- **WHEN** the assistant presents an add-to-cart action and the shopper selects it
- **THEN** the widget SHALL request confirmation with the product and quantity
- **AND** SHALL send the action only after confirmation

### Requirement: Accessible responsive assistant experience
The widget SHALL preserve the existing desktop floating panel and mobile full-screen layout, keyboard opening shortcut, visible focus states, readable live status, and touch targets of at least 44 by 44 CSS pixels for primary mobile controls.

#### Scenario: Shopper opens a degraded response on mobile
- **WHEN** the assistant is open on a viewport narrower than 768 pixels
- **THEN** the degraded notice and retry control SHALL remain visible, operable, and contained within the full-screen panel without horizontal overflow

### Requirement: Conversation recovery controls
The widget SHALL provide copy, retry, and clear-history controls that remain available after a failed or degraded assistant response without discarding the shopper's unsent input.

#### Scenario: Retry after a degraded response
- **WHEN** a shopper selects Retry after a degraded assistant response
- **THEN** the widget SHALL resend the failed user message with the preserved relevant history
- **AND** SHALL display working status while the retry is in progress
