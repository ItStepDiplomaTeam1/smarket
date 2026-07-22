## ADDED Requirements

### Requirement: Efficient Product Detail & Similar Products Retrieval
The system SHALL return product details and similar products efficiently without generating N+1 requests or request timeouts.

#### Scenario: Displaying Similar Products
- **WHEN** a user visits a product detail page
- **THEN** similar products SHALL be populated from the category product list without issuing individual product detail requests per item

#### Scenario: Product Proxy Request Handling
- **WHEN** the API Gateway receives a GET request for products or product details
- **THEN** it SHALL forward the request to product_service without streaming a request body, completing response within normal timeout limits
