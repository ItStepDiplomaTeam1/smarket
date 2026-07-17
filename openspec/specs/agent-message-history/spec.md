# Agent Message History Ingestion

## Purpose
Specification for formatting assistant and user message histories.

## Requirements

### Requirement: Structured Message History Ingestion
The agent service SHALL parse the message history such that previous assistant structured JSON responses are properly translated into assistant messages (or tool call/returns) for the underlying LLM library, ensuring the LLM is not confused by text-only representation of blocks and does not output raw XML-like tool tags.

#### Scenario: User confirms item addition to cart
- **WHEN** the agent receives a chat request with a history containing an assistant response with a product card and action button payload, followed by a user message "Так, додай до кошика"
- **THEN** the agent SHALL correctly identify the target product from the message history context, invoke the `add_product_to_cart` tool, and return a successful structured JSON response
