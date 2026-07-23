# admin-panel-styling Specification

## MODIFIED Requirements

### Requirement: Admin Panel Text Styling and Code Hygiene
The system SHALL apply globally defined text styling rules to all admin panel pages for consistency, replacing any ad-hoc font assignments. All frontend components in `apps/admin` and `apps/react` SHALL adhere to React code hygiene standards: components MUST NOT be declared inside parent component render functions, and synchronous state updates MUST NOT be executed directly inside `useEffect` bodies.

#### Scenario: Admin views a page with bold text
- **WHEN** an admin user views any page in the admin panel containing bold text (e.g., headings or `font-bold` elements)
- **THEN** the text is rendered with color #265447 and font Manrope

#### Scenario: Admin views a page with regular text
- **WHEN** an admin user views any page in the admin panel containing regular text (e.g., body paragraphs)
- **THEN** the text is rendered with color #6D8279 and font Inter

#### Scenario: ESLint linting clean run
- **WHEN** developer runs `npm run lint` in `apps/admin` or `apps/react`
- **THEN** no errors or warnings regarding nested component declarations or synchronous setState in useEffect are produced
