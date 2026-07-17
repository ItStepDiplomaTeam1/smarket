# receipts-dropdown Specification

## Purpose
TBD - created by archiving change receipts-dropdown-modal. Update Purpose after archive.
## Requirements
### Requirement: Toggle button in the Header
The header SHALL display a receipts toggle button next to the favorites (heart) icon for authenticated users.

#### Scenario: Toggle dropdown visibility
- **WHEN** the authenticated user clicks the receipts toggle button
- **THEN** the receipts dropdown visibility toggles between open and closed

### Requirement: Displaying the receipts list
When the dropdown is open, the system SHALL query the user's receipts and render a list of up to 10 of the most recent receipts, showing the store name, date of purchase, total price, savings amount (if positive), and a summary of the first two items.

#### Scenario: Display list of receipts
- **WHEN** the user opens the receipts dropdown and has completed receipts
- **THEN** the system shows a scrollable list of receipts with store names, dates, total prices, savings, and item previews

### Requirement: Dropdown empty state
If the user has not completed any shopping lists, the dropdown SHALL display a friendly empty state message.

#### Scenario: Empty state rendering
- **WHEN** the user opens the receipts dropdown and has no receipts
- **THEN** the system displays a message stating "Ви ще не завершували жодного кошика"

### Requirement: Navigation to receipt detail page
Clicking on any receipt card in the dropdown list SHALL navigate the user to the receipt page at `/receipts/:token` and automatically close the dropdown.

#### Scenario: Click receipt card
- **WHEN** the user clicks on a receipt item in the dropdown
- **THEN** the app navigates to `/receipts/:token` and closes the dropdown

### Requirement: Close on outside click
The dropdown SHALL close automatically when the user clicks anywhere outside of the dropdown container and the toggle button.

#### Scenario: Clicking outside the dropdown
- **WHEN** the dropdown is open and the user clicks outside the dropdown container
- **THEN** the dropdown closes

