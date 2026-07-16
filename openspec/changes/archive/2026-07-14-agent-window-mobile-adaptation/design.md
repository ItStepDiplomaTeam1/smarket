## Context

The Zephyros AI chat agent widget (`AiChatWidget.tsx`) currently renders with a fixed desktop layout (default width 420px, height 600px) and a floating trigger button at the bottom-right corner of the viewport. On mobile screens, this fixed width exceeds the screen width, leading to layout breakage and truncation. Furthermore, layout blocks such as tabs (`TabsBlockView`) do not support horizontal scroll when overflowing.

## Goals / Non-Goals

**Goals:**
- Render the `ChatWindow` as a full-screen overlay (`fixed inset-0`) on viewports < 768px.
- Disable the resizer handle (`ResizeHandle`) on mobile screens.
- Optimize the floating toggle button (FAB) for mobile viewports: size it to 48x48px (w-12 h-12), make it circular, and hide the text and keyboard shortcut hints.
- Prevent layout breaking in tabs and table blocks by supporting horizontal scrolling and preventing column squishing.

**Non-Goals:**
- Modifying backend routing, FastAPI responses, or the Zephyros prompt schema.
- Changing the desktop styling and functionality of the widget.

## Decisions

### Decision 1: Viewport Detection via Media Query Listener
We will introduce an `isMobile` state hook in `AiChatWidget` that listens to `window.matchMedia('(max-width: 767px)')`.
- **Alternatives Considered**: Pure CSS overrides with `!important` tags.
- **Rationale**: Utilizing a React state hook allows conditional rendering of components (like hiding `ResizeHandle` completely from the DOM on mobile) and conditionally applying the inline `style={{ width, height }}`, preventing React from fighting CSS.

### Decision 2: Mobile Panel Layout
When `isMobile` is `true`, the outer layout element wrapper will use `fixed inset-0 z-50` (instead of `fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3`). The inner `ChatWindow` will render with classes `w-full h-full rounded-none border-l-0`.
- **Alternatives Considered**: Slide-up bottom drawer.
- **Rationale**: Given that Zephyros returns data-heavy response blocks (like tables comparing prices across multiple chains), a full-screen display maximizes readable area and offers a cleaner interface.

### Decision 3: Responsive Trigger Button
The chat trigger button will render as a compact circle on mobile:
- Size: `w-12 h-12` (48x48px) with `rounded-full` and `justify-center` for standard touch targets.
- Content: The `ZephyrosMark` icon only. The text label and shortcut key hint will be hidden on viewports < 768px.
- **Alternatives Considered**: Keeping text and resizing the font.
- **Rationale**: Minimalist floating action buttons (FABs) are standard on mobile and avoid covering important page content.

### Decision 4: Responsive Tabs and Tables Scrollability
Apply `overflow-x-auto` to the tab button row in `TabsBlockView` and specify `shrink-0` on tab buttons to prevent horizontal overflow and squishing.

## Risks / Trade-offs

- **[Risk]**: Overlap with other mobile floating components (e.g. Back-to-Top buttons).
  - *Mitigation*: Place the trigger button standard `bottom-6 right-6` layout, which matches standard system-level triggers.
- **[Risk]**: Users on small tablets may prefer the compact panel size.
  - *Mitigation*: Breakpoint is set strictly to `767px`. Viewports `>= 768px` (like iPad Portrait) will continue to see the desktop floating panel with resize capabilities.
