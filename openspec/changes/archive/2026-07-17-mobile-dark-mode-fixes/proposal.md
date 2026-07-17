## Why

The product detail page and user profile page currently lack proper mobile responsiveness and dark mode support, which leads to an inconsistent user experience on mobile screens and in dark mode. Additionally, modal dropdowns on mobile screens are difficult to use and lack mobile adaptation, and the dark theme switch does not persist the theme selection across user sessions in cookies.

## What Changes

- **Mobile Adaptation**: Update the layouts of the Product Details page (`/product/:id`) and User Profile page (`/profile`) to be fully responsive (Mobile-First) using Tailwind utility classes.
- **Dark Theme support**: Ensure all elements, text, backgrounds, and icons on the Product Details page and User Profile page adapt properly to the dark theme (`dark:` prefix).
- **Responsive Dropdowns/Modals**: Add mobile adaptation support to dropdown elements within modals so they render correctly and fit on smaller screens.
- **Theme Switcher & Persistent Preference**: Fix the dark theme toggle. Read/write the user's theme selection ('light' or 'dark') to/from document cookies (e.g., `theme` cookie) so it persists across page reloads and is accessible server-side if needed.

## Capabilities

### New Capabilities
- `product-profile-mobile-dark-theme`: Support for mobile responsiveness, dark mode on Product Details and User Profile pages, dropdown adaptation in modals, and theme preference persistence via cookies.

### Modified Capabilities
<!-- None -->

## Impact

- **Affected Code**: 
  - `src/shared/store/useThemeStore.ts` (theme store behavior and cookie persistence).
  - `src/app/providers/ThemeProvider.tsx` (reading theme from cookies and applying CSS classes).
  - `src/pages/ProductDetail/` and `src/modules/Product/` (Product Details responsiveness and dark styles).
  - `src/pages/Profile/` and `src/modules/Profile/` (Profile responsiveness and dark styles).
  - `src/shared/ui/` (components like Header/dropdowns/modals that need mobile adjustments).
