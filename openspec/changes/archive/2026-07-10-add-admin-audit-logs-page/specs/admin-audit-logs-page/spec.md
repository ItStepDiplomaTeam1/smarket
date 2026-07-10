## ADDED Requirements

### Requirement: Dedicated Audit Logs Page
The system SHALL provide a dedicated page (`/logs`) in the admin panel to display a paginated list of system audit logs.

#### Scenario: Navigating to the page
- **WHEN** the admin clicks on "Журнал дій" in the sidebar or "Переглянути всі події" in the dashboard
- **THEN** the system navigates to `/logs` without a full page reload
- **AND** the system fetches and displays the first page of audit logs from the backend API

### Requirement: Search and Filtering
The audit logs page SHALL allow the admin to filter logs by severity level and search by text.

#### Scenario: Filtering by severity
- **WHEN** the admin selects a severity level (e.g., "error") from the dropdown
- **THEN** the table updates to display only logs with the selected severity

#### Scenario: Searching by text
- **WHEN** the admin enters text in the search input
- **THEN** the table updates to display logs containing the search text in their event type, actor, or message

### Requirement: Pagination
The audit logs page SHALL support server-side pagination.

#### Scenario: Changing pages
- **WHEN** the admin clicks on a page number or the "Next" button
- **THEN** the system fetches the corresponding page of logs from the backend and updates the table
