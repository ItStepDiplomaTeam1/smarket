## ADDED Requirements

### Requirement: Receipt list shows error state on API failure
The system SHALL display a distinct error message when the receipt list API fails, separate from the empty state shown when no receipts exist.

#### Scenario: API returns 401 Unauthorized
- **WHEN** user opens "Мої чеки" modal and the receipt list API returns 401
- **THEN** modal displays error message "Помилка авторизації. Увійдіть знову." with a retry button

#### Scenario: API returns 500 Server Error
- **WHEN** user opens "Мої чеки" modal and the receipt list API returns 500
- **THEN** modal displays error message "Помилка завантаження чеків. Спробуйте пізніше." with a retry button

#### Scenario: Network request fails
- **WHEN** user opens "Мої чеки" modal and the network request fails (timeout, offline)
- **THEN** modal displays error message "Немає з'єднання з сервером." with a retry button

### Requirement: Receipt list shows empty state only when no receipts exist
The system SHALL display the empty state message only when the API succeeds and returns an empty list, not when an error occurs.

#### Scenario: API succeeds with empty list
- **WHEN** user opens "Мої чеки" modal and the API returns an empty list
- **THEN** modal displays "Ви ще не завершували жодного кошика"

#### Scenario: API fails then succeeds on retry
- **WHEN** user clicks retry after an error and the API succeeds with receipts
- **THEN** modal displays the receipts list

### Requirement: AI description polls until available or max retries reached
The receipt page SHALL poll for `ai_description` with exponential backoff until the description appears or the maximum retry count is reached.

#### Scenario: AI description available on first poll
- **WHEN** user views a receipt and `ai_description` is null
- **THEN** system waits 3 seconds and refetches the receipt

#### Scenario: AI description available on second poll
- **WHEN** first poll at 3 seconds returns null `ai_description`
- **THEN** system waits 6 seconds and refetches again

#### Scenario: AI description available on third poll
- **WHEN** second poll at 6 seconds returns null `ai_description`
- **THEN** system waits 12 seconds and refetches again

#### Scenario: AI description never available
- **WHEN** all 3 polls return null `ai_description`
- **THEN** receipt page displays without the AI note section and stops polling

### Requirement: Receipt page shows loading state during AI description polling
The receipt page SHALL display a loading skeleton for the AI description section while polling is in progress.

#### Scenario: Polling in progress
- **WHEN** receipt page is waiting for `ai_description` during any retry attempt
- **THEN** the AI note section shows a shimmer/skeleton animation

#### Scenario: Polling completes with description
- **WHEN** a poll returns `ai_description` with a value
- **THEN** the skeleton is replaced with the actual description text

#### Scenario: Polling completes without description
- **WHEN** all retries exhausted and `ai_description` is still null
- **THEN** the skeleton is hidden and the AI note section is not shown
