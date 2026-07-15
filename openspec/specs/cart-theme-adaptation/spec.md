# cart-theme-adaptation Specification

## Purpose
TBD - created by archiving change cart-theme-and-mobile-adaptation. Update Purpose after archive.
## Requirements
### Requirement: Cart Page Dark Theme Support
The system MUST render the Cart page (`/cart`) and all of its subcomponents in dark theme when the active theme is set to 'dark' or 'system' (with dark mode preferred).

The styling rules SHALL be:
1. The page main background uses `dark:bg-[#0B110F]`.
2. Cart list sidebars, item detail containers, and summary cards use background `dark:bg-[#111A17]`, border `dark:border-[#265447]/30`, and text `dark:text-white`.
3. Cart item cards inside the details container use surface background `dark:bg-[#1D2A25]`, title text `dark:text-white`, and quantity/retail badges with dark contrast.
4. Input fields inside modals use background `dark:bg-[#1D2A25]`, text `dark:text-[#EAF7F2]`, and border `dark:border-[#265447]`.
5. Primary action buttons ("Створити новий кошик") use background `dark:bg-[#3DAE8B]` and text `dark:text-[#111A17]`.
6. Empty states and unauthenticated states use text color `dark:text-[#A9B6B0]` and contrast buttons.

#### Scenario: View Cart Page in Dark Theme
- **WHEN** the user switches the application theme to dark and navigates to `/cart`
- **THEN** the backdrop displays in `#0B110F`, section containers display in `#111A17` with `#265447` borders, and item cards display in `#1D2A25`.

#### Scenario: Open Create Cart Modal in Dark Theme
- **WHEN** the user clicks "Створити новий кошик" while the application is in dark theme
- **THEN** the modal displays with a `#111A17` backdrop, `#1D2A25` input fields, and `#3DAE8B` submit button.

### Requirement: Cart Page Mobile Responsive Layout
The system MUST adapt the Cart page layout for viewports smaller than the `lg` (1024px) breakpoint to prevent horizontal scrolling and clipping.

The layout behavior SHALL be:
1. The 3-column layout (Saved Lists, Details, Summary) collapses to a 1-column layout where sections are stacked vertically.
2. The grid layout columns of `CartDetails` items stack vertically (e.g. image, title, price, quantity controls, and delete actions stack or wrap gracefully instead of overlapping).
3. The increment and decrement quantity buttons, along with delete icons, have interactive touch target dimensions of at least 44x44px.
4. The Create Cart Modal transitions from a centered dialog to a bottom sheet or a full-width dialog on mobile devices.

#### Scenario: View Cart Page on Mobile Viewport
- **WHEN** the user opens `/cart` on a screen width of less than 1024px
- **THEN** the grid displays in a single column stack, padding is reduced from `py-8 px-8` to `py-4 px-4`, and the catalog and cart buttons wrap under the title.

#### Scenario: Verify Cart Item Touch Targets
- **WHEN** the user views their cart items on a mobile viewport
- **THEN** the increment/decrement buttons and the remove item button each have bounding box touch targets of at least 44x44px.

