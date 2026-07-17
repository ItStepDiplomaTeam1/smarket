## ADDED Requirements

### Requirement: Chat Panel Responsive Layout
The chat window SHALL dynamically adjust its layout based on viewport width:
- For viewports < 768px (mobile), the chat window MUST be a full-screen modal or overlay spanning 100% of the viewport width and height.
- For viewports >= 768px (desktop), the chat window SHALL be a floating sidebar or popover anchored at the bottom-right corner of the screen.

#### Scenario: Mobile Viewport layout
- **WHEN** the chat window is opened on a viewport narrower than 768px
- **THEN** the chat window spans the entire screen, covering the rest of the application interface, with a clear close button in the header.

#### Scenario: Desktop Viewport layout
- **WHEN** the chat window is opened on a viewport wider than or equal to 768px
- **THEN** the chat window is rendered as a floating panel on the bottom-right, allowing the user to interact with both the chat and the main page.

### Requirement: Chat Content Block Responsiveness
All chat message content blocks (specifically tables, grids, tabs, and product cards) SHALL adapt their layout for smaller viewports to prevent horizontal overflow and breakage:
- Tables MUST enable horizontal scroll inside the block or wrap columns into stackable items.
- Product cards MUST change to a vertical stack layout when width is constrained.
- Tabs and filter buttons MUST wrap or enable horizontal scrolling.

#### Scenario: Table block overflow on mobile
- **WHEN** a table block containing multiple columns is rendered on a viewport narrower than 480px
- **THEN** the table is scrollable horizontally within the message block, keeping the chat container itself from overflowing.

#### Scenario: Product card layout on mobile
- **WHEN** a product card block is rendered on a mobile viewport
- **THEN** the card content (image, info, price, button) wraps or stacks vertically to fit the viewport width without breaking.

### Requirement: Accessible Floating Chat Trigger
The floating chat widget toggle button SHALL remain accessible and touch-friendly on mobile devices:
- The touch target size of the toggle button MUST be at least 44x44 pixels.
- The toggle button MUST be positioned to avoid overlapping key UI elements such as bottom navigation bar items on mobile devices.

#### Scenario: Mobile viewport trigger button sizing
- **WHEN** the user views the website on a mobile device
- **THEN** the chat toggle button displays with a minimum click/touch area of 44x44px.
