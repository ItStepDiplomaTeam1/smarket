## ADDED Requirements

### Requirement: Request Duration Logging
The backend SHALL measure and log the total processing duration of each chat query.

#### Scenario: Log successful chat query
- **WHEN** a chat request completes successfully
- **THEN** it SHALL log the provider name and duration in seconds

### Requirement: Disconnection and Error Logging
The backend SHALL log when a chat request is interrupted by client disconnection or fails with an error.

#### Scenario: Log client disconnection
- **WHEN** the client disconnects, raising a `CancelledError`
- **THEN** the backend SHALL log a warning indicating that the request was cancelled/aborted by the client
