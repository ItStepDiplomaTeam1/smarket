## 1. Global CSS Styling & Animations

- [x] 1.1 Add `@keyframes page-enter` and `@keyframes shimmer` in `apps/react/frontend/my-react-app/src/index.css` under the `@theme` directive.
- [x] 1.2 Define the `.shimmer-bg` utility class and hover transitions for primary interactive elements in `src/index.css`.

## 2. Header Search Transition & Gesture Enhancements

- [x] 2.1 Refactor state transitions in `HeaderSearch.tsx` to handle `closed`, `opening`, `open`, and `closing` stages for graceful unmounting.
- [x] 2.2 Update class names and transition styling in `HeaderSearch.tsx` using custom spring cubic-bezier animations.
- [x] 2.3 Inject mobile gesture rubber-banding improvements into the touch event handlers in `HeaderSearch.tsx`.

## 3. Route Transitions & Skeleton Shimmers

- [x] 3.1 Verify key binding inside `MainLayout.tsx` to ensure `animate-page-enter` executes upon location updates.
- [x] 3.2 Update `Skeletons.tsx` elements to use the `.shimmer-bg` style for sweeping gradient loading states.
