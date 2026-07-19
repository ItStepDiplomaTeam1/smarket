## ADDED Requirements

### Requirement: Search overlay smooth fade and scale transition
The quick search modal overlay (`HeaderSearch.tsx`) MUST utilize hardware-accelerated CSS transitions for both entry and exit states. Upon trigger, the backdrop blur and background opacity SHALL transition smoothly, and the search container dialog SHALL scale from 95% to 100% and slide up into view. Upon dismissal, the reverse animation MUST execute over a duration of 200–250ms before the component is unmounted.

#### Scenario: Opening quick search overlay
- **WHEN** the user clicks the header search button or uses the keyboard shortcut
- **THEN** the search overlay transitions to visible with a smooth scale-up, translation, and backdrop blur fade-in

#### Scenario: Dismissing quick search overlay
- **WHEN** the user clicks the close button, clicks outside the search container, or presses Escape
- **THEN** the search overlay transitions out with a scale-down and opacity fade-out, completing the unmount cycle after the transition ends

### Requirement: Mobile swipe-to-close gesture with rubber-banding
The quick search overlay on mobile screens SHALL support touch-drag gestures to swipe down and close the dialog. The container translation MUST follow the finger coordinates dynamically, applying a dampening factor (rubber-banding) to visual shifts. If the user releases the container after dragging down by at least 80px, it SHALL automatically transition to closed. If released below that threshold, it MUST snap back to its original position.

#### Scenario: Touch-drag closure threshold met
- **WHEN** the user swipes down on the mobile search handle or container by 90px and releases the touch
- **THEN** the search overlay slides down off-screen and triggers the onClose callback

#### Scenario: Touch-drag closure threshold not met
- **WHEN** the user drags the container down by 40px and releases
- **THEN** the search overlay snaps back to its default vertical alignment with a spring animation

### Requirement: Global page route fade-in transitions
The customer React application SHALL apply a lightweight, hardware-accelerated opacity transition to page layouts when route changes occur. The transition duration MUST be between 150ms and 250ms to maintain speed while preventing sudden visual layout shifts.

#### Scenario: Navigating between pages
- **WHEN** the user clicks a route link and page path changes
- **THEN** the old page unmounts and the new page content animates from opacity 0 to 1

### Requirement: Interactive hover and active feedback transforms
Common interactive components, such as product cards, buttons, category elements, and text inputs, SHALL respond to hover and focus states with smooth transform scaling and shadow elevations. These visual states MUST transition using ease-out cubic-bezier curves over 150–200ms.

#### Scenario: Hovering on product card
- **WHEN** the cursor hovers over a product card in the catalog grid
- **THEN** the card transitions its scale slightly (e.g., scale-102) and smoothly increases shadow depth
