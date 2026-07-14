## Context

The Smarket application includes a dark mode setting, but the shopping cart page (`/cart`) and its corresponding subcomponents (`CartDetails.tsx`, `CartEmptyState.tsx`, `CartSavedList.tsx`, `CartSummary.tsx`, `CartUnauthState.tsx`, `CreateCartModal.tsx`) have hardcoded light colors and borders (e.g. `bg-white`, `bg-[#F6FAF8]`, `text-[#173B33]`). Furthermore, the desktop 3-column layout does not stack optimally or handle smaller viewports elegantly, leading to UI clipping, layout overflows, and small click targets on mobile devices.

## Goals / Non-Goals

**Goals:**
- Adapt all Cart module components and the main `CartPage` layout to support Smarket's dark theme using Tailwind `dark:` utility classes.
- Ensure the contrast ratio meets WCAG AA standards (at least 4.5:1 for regular text) in both themes.
- Implement mobile responsive layout configurations using Tailwind breakpoints (e.g. `lg:`, `md:`, `sm:`).
- Redesign the 3-column desktop layout (`lg:grid-cols-12`) to collapse into a single-column layout on viewports < 1024px.
- Make all interactive buttons (increment, decrement, remove, tab selection, modals) easy to tap on mobile by providing at least 44x44px target sizes.
- Re-align modals (`CreateCartModal`) to match mobile sheet designs.

**Non-Goals:**
- Changing database schemas, API Gateway configurations, or microservice integrations.
- Adding third-party packages or icon libraries (use existing `lucide-react` icons).
- Refactoring `useCartStore` or TanStack Query custom hooks.

## Decisions

### 1. Color Palette Mapping for Dark Mode
To align with other dark-mode components (like `AiChatWidget` and the auth flow), we will map light-mode colors to their dark-mode counterparts:
- Backdrop: `bg-[#F6FAF8]` ➔ `dark:bg-[#0B110F]`
- Card Background: `bg-white` ➔ `dark:bg-[#111A17]`
- Primary Text: `text-[#173B33]` ➔ `dark:text-white`
- Secondary Text: `text-[#6D8279]` ➔ `dark:text-[#A9B6B0]`
- Subtle Borders: `border-gray-100` / `border-gray-200` ➔ `dark:border-[#265447]/30`
- Active/Highlight State: `bg-[#F0FDF4]` ➔ `dark:bg-[#265447]/40`
- Input Surface: `bg-white` ➔ `dark:bg-[#1D2A25]`
- Primary Action Buttons: `bg-[#265447]` ➔ `dark:bg-[#3DAE8B]` with `dark:text-[#111A17]`

### 2. Collapsible Sidebar/Saved Lists on Mobile
On desktop, `CartSavedList` sits on the left as a sidebar column. On mobile (viewport < 1024px), showing all saved lists at the top would push the active cart details and summary far down.
- **Decision**: Wrap the `CartSavedList` in a collapsible accordion or disclosure header on viewports below `lg` breakpoint. The header will show "Вибрати інший кошик" (Select another cart) and toggle list visibility, keeping the viewport clean.

### 3. Quantity Control Touch Targets
The current increment and decrement buttons in `CartDetails` are small.
- **Decision**: Update the layout of item quantity selectors to use a minimum height of `40px` / `44px` and add invisible padding extensions or wrap them in easily clickable action boxes with a minimum dimension of `44x44px`.

### 4. Bottom Sheet Modals on Mobile
- **Decision**: For `CreateCartModal`, style the container on mobile viewports (`sm:max-w-md` -> `max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:translate-y-0`) so it appears as a bottom sheet.

## Risks / Trade-offs

- **[Risk]**: Complex layout shifts between desktop and mobile could cause components to re-render or break Zustand state syncing.
  - **Mitigation**: Rely solely on Tailwind media queries (`lg:`, `max-lg:`) rather than conditional JS rendering based on window size, ensuring state stays intact.
- **[Risk]**: Contrast issues on brand-specific retail logos (e.g. ATB, Silpo) against dark background.
  - **Mitigation**: Wrap retailer names/badges in high-contrast neutral backgrounds or badges with semi-transparent borders.
