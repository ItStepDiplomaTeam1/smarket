# Smooth Page Navigation

This specification outlines the functional requirements for smooth global transition animations and loading states across Smarket routes to provide a seamless UX.

## Requirements

### Requirement: View Transitions for Navigation Links
The system SHALL utilize the native View Transitions API on all principal navigation links (`Link` and `NavLink` elements) to smooth out cross-page transitions.

#### Scenario: Visual Transition on Catalog Navigation
- **WHEN** the user clicks on the "Каталог" (Catalog) link in the header
- **THEN** the browser performs a view transition, smoothly blending the home page layout into the catalog layout.

### Requirement: CSS Page Entrance Animation
The system SHALL apply a global CSS-based fade-in and slide-up entrance animation to the page content container when a new route mounts, ensuring smooth transitions even if the browser does not support the View Transitions API.

#### Scenario: Route Mount Animation
- **WHEN** the user navigates to any route and the page component is rendered
- **THEN** the main layout container fades in from `opacity: 0` to `opacity: 1` and slides up by `8px` over a duration of 350-400ms.

### Requirement: Skeleton Loaders for Pending Suspense States
The system SHALL display high-fidelity, shimmering skeleton loaders instead of plain text loading messages while resolving code-split page chunks or initial API data fetch states inside React Router `<Suspense>` boundaries.

#### Scenario: Shimmer Skeleton during Catalog Load
- **WHEN** the user navigates to the "/catalog" page and the page component is in a pending chunk state
- **THEN** the page displays a grid of shimmering skeleton cards mimicking the visual layout of product cards.
