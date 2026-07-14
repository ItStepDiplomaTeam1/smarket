## 1. Setup & Viewport Detection

- [x] 1.1 Implement mobile viewport detection state in `AiChatWidget.tsx` using `window.matchMedia('(max-width: 767px)')`.
- [x] 1.2 Conditionally hide/disable `ResizeHandle` from DOM if the viewport is mobile.

## 2. Chat Layout & Responsive Styles

- [x] 2.1 Update parent container layout class names in `AiChatWidget` to use `fixed inset-0 z-50` when the chat is open on mobile, instead of bottom-right positioning.
- [x] 2.2 Update container styles in `ChatWindow` to be full-screen (`w-full h-full rounded-none border-l-0`) on mobile, and bypass inline width/height style objects.
- [x] 2.3 Adjust input panel, header controls, and model selectors padding and font sizing for better touch targets and readability on mobile.

## 3. Trigger & Content Block Optimizations

- [x] 3.1 Style the floating trigger button as a circular 48x48px button on mobile viewports, hiding the "Zephyros" label and key shortcut hint.
- [x] 3.2 Implement horizontal scrolling for tab buttons in `TabsBlockView` (`overflow-x-auto whitespace-nowrap scrollbar-none`) and apply `shrink-0` to tab buttons.
- [x] 3.3 Test table block horizontal scroll and product card wrap styling.
