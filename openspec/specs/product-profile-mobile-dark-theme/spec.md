# Purpose
TBD

# Requirements

## ADDED Requirements

### Requirement: Product details page mobile responsiveness
The product details page SHALL adapt dynamically to mobile viewport widths (width < 768px). The layout MUST stack elements vertically (e.g. image, product info, store offers, reviews) in a single column to ensure content is fully readable and responsive.

#### Scenario: Product details page on small screens
- **WHEN** the user views a product details page on a screen width of less than 768px
- **THEN** the layout is displayed as a single vertical column with responsive text and images scaled to fit the viewport

### Requirement: Product details page dark theme styling
The product details page SHALL support dark theme styling. Background colors, text colors, borders, tabs, and tables (such as FBT - frequently bought together, and store price lists) MUST adapt to dark theme color schemes using the CSS `dark` mode classes.

#### Scenario: Dark mode enabled on product details page
- **WHEN** the user enables dark mode and views the product details page
- **THEN** the background changes to a dark color and text changes to a high-contrast light color, applying appropriate `dark:` prefixes

### Requirement: User profile page mobile responsiveness
The user profile page SHALL support mobile responsiveness. The desktop-specific layout containing sidebar navigation and dashboard grids MUST adapt to mobile screens, stacking the menu and content panels vertically and ensuring no horizontal overflow occurs.

#### Scenario: User profile page on mobile devices
- **WHEN** the user opens the profile page on a screen width of less than 768px
- **THEN** the sidebar menu and the main content section stack vertically, and the layout fits within the viewport

### Requirement: User profile page dark theme styling
The user profile page SHALL support dark theme styling. Backgrounds, text, input fields, tables, lists, and tabs on all sub-tabs of the profile (e.g. dashboard, reviews, baskets, favorites, settings) MUST apply dark mode CSS classes.

#### Scenario: Dark mode enabled on profile page
- **WHEN** the user enables dark mode and views the profile page
- **THEN** all profile subpages and elements apply dark theme colors

### Requirement: Modal dropdowns mobile adaptation
All dropdown lists and dropdown selectors inside modals SHALL support mobile adaptation. On viewport widths less than 768px, dropdowns MUST position, scale, and adjust their overlay containers properly, preventing clipping or overflow outside of the modal container or the screen bounds.

#### Scenario: Opening modal with dropdown on mobile
- **WHEN** a modal containing a dropdown selector is opened on a mobile device
- **THEN** the dropdown elements scale and position themselves within the viewport bounds without causing layout overflow

### Requirement: Dark theme toggle persistence with cookies
The user's light/dark/system theme selection SHALL be persisted in a browser cookie named `theme`. The frontend application SHALL write to this cookie whenever the theme is changed and read from this cookie upon initialization to restore the user's preference.

#### Scenario: Changing theme preference
- **WHEN** the user clicks the theme switcher to select the dark theme
- **THEN** the theme changes to dark and the `theme` cookie is updated to 'dark'
