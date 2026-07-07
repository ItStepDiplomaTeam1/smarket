## Context

The React frontend has an AI Chat Widget where the user can choose a specific provider or use "Auto-choice" (which maps to `provider: null`). However, if a user has selected a specific provider (like OpenRouter) in the past, the value is persisted in local storage and sent in all subsequent requests, completely disabling the backend's automatic provider chain failover.

We need to make sure that the frontend allows users to easily choose "Auto-choice" to bypass explicit overrides, and verify that the API request payload maps it to `null` correctly.

## Goals / Non-Goals

**Goals:**
- Ensure that the frontend allows clear fallback routing to the backend's automatic provider chain.
- Remove any hardcoded overrides forcing a specific provider.

**Non-Goals:**
- Completely removing the ability for developers/admins to test specific providers via the settings dropdown.

## Decisions

- **Send `null` for Auto-Choice**: Ensure that the widget settings default to Auto-Choice (`null`), and the API payload sends `provider: null` and `model_name: null` when auto-choice is active.

## Risks / Trade-offs

- **User Preference Reset**: Users who explicitly wanted a specific provider will have their requests route to the backend chain instead if they select Auto-choice.
  - *Mitigation*: This is the intended behavior and is actually safer as it guarantees high availability via failover.
