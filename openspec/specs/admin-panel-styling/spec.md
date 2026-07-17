# admin-panel-styling Specification

## Purpose
TBD - created by archiving change admin-panel-text-styling. Update Purpose after archive.
## Requirements
### Requirement: Admin Panel Text Styling
The system SHALL apply globally defined text styling rules to all admin panel pages for consistency, replacing any ad-hoc font assignments.
Specifically, bold text SHALL use color #265447 and the Manrope font family.
Regular (thin) text SHALL use color #6D8279 and the Inter font family.

#### Scenario: Admin views a page with bold text
- **WHEN** an admin user views any page in the admin panel containing bold text (e.g., headings or `font-bold` elements)
- **THEN** the text is rendered with color #265447 and font Manrope

#### Scenario: Admin views a page with regular text
- **WHEN** an admin user views any page in the admin panel containing regular text (e.g., body paragraphs)
- **THEN** the text is rendered with color #6D8279 and font Inter

