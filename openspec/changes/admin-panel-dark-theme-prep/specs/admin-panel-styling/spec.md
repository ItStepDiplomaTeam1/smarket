## MODIFIED Requirements

### Requirement: Admin Panel Text Styling
The system SHALL apply globally defined text styling rules to all admin panel pages for consistency, replacing any ad-hoc font assignments.
Specifically, bold text SHALL use the primary semantic text color (e.g., CSS variable that defaults to `#265447` in light mode) and the Manrope font family, which automatically adapts based on the active theme.
Regular (thin) text SHALL use the secondary semantic text color (e.g., CSS variable that defaults to `#6D8279` in light mode) and the Inter font family, adapting to the active theme.

#### Scenario: Admin views a page with bold text
- **WHEN** an admin user views any page in the admin panel containing bold text (e.g., headings or `font-bold` elements)
- **THEN** the text is rendered with the semantic bold text color variable and font Manrope

#### Scenario: Admin views a page with regular text
- **WHEN** an admin user views any page in the admin panel containing regular text (e.g., body paragraphs)
- **THEN** the text is rendered with the semantic regular text color variable and font Inter
