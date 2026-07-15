## Why

Currently, the Zephyros AI chat agent widget is styled primarily for desktop viewports. On mobile screens, the chat window can overflow, block other interface elements, or feel cramped, which degrades the user experience. Adding a fully responsive layout ensures that the AI chat agent is comfortable, readable, and highly usable on all screen sizes.

## What Changes

- **Responsive Chat Panel Layout**: Adapt the chat window to be a full-screen overlay or bottom drawer on screens smaller than 768px (md breakpoint).
- **Responsive Elements/Blocks**: Adjust padding, font sizes, and layout of different Zephyros response blocks (especially tables, grids, and action buttons) to prevent horizontal scrolling and overflow on mobile.
- **Optimized Chat Trigger**: Reposition or resize the floating chat widget toggle button on mobile screens so it does not block core website navigation or buttons.
- **Header & Control Bars**: Optimize the chat header, provider/model selector dropdowns, and input area for touch interaction and smaller screens.

## Capabilities

### New Capabilities
- `agent-window-mobile-adaptation`: Specifying the responsive layouts, breakpoints, touch gestures, and style guidelines for the AI chat agent window on mobile, tablet, and desktop devices.

### Modified Capabilities

## Impact

- **Affected Code**: Modifies `apps/react/frontend/my-react-app/src/modules/AiChat/components/AiChatWidget.tsx` (the main chat component) and potentially related UI elements in the React app.
- **APIs**: No changes to APIs or gateway/backend services.
- **Dependencies**: None.
