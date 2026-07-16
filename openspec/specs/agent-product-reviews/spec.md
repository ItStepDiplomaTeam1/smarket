# agent-product-reviews Specification

## Purpose
TBD - created by archiving change extend-agent-capabilities. Update Purpose after archive.
## Requirements
### Requirement: Get product reviews and ratings
The system MUST allow the user to ask the AI agent about the ratings, reviews, or customer feedback of a product.

#### Scenario: User queries product feedback
- **WHEN** the user asks "які відгуки на молоко селянське"
- **THEN** the agent calls the reviews tool to fetch ratings and review list from `reviews_service`
- **AND** the agent replies with a summarized block showing average star rating, positive/negative takeaways, and a text excerpt of recent reviews

### Requirement: Submit product review via AI Agent
The system MUST allow the user to submit a rating and a comment for a product through chat interaction with the AI agent.

#### Scenario: User posts a review
- **WHEN** the user tells the agent "постав 5 зірок молоку і напиши: смачне"
- **THEN** the agent identifies the product, prompts for confirmation if needed, and calls the create review tool to persist the review via `reviews_service`
- **AND** the agent displays a success badge to confirm the review has been published

