## MODIFIED Requirements

### Requirement: Understandable assistant state feedback
The widget SHALL show distinct ready, working, answered, and degraded states using plain Ukrainian language without provider names, raw error text, or model identifiers. For chitchat or help requests, the assistant SHALL return supportive system guidance or conversational answers with suggested follow-up prompts.

#### Scenario: Providers are exhausted
- **WHEN** the service returns a structured degraded response
- **THEN** the widget SHALL explain that the assistant is temporarily unavailable in plain language
- **AND** SHALL present an accessible Retry control when supplied by the response

#### Scenario: Shopper asks general usage questions
- **WHEN** the user asks general or usage questions under the `none` intent
- **THEN** the assistant SHALL return a structured response containing suggested next steps
- **AND** SHALL render interactive buttons for quick navigation (e.g. "Відкрити кошик", "Показати всі магазини")
