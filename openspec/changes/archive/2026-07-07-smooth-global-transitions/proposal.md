## Why

The current React frontend lacks smooth transition animations between pages, and showcases raw text loading states like "Завантаження сторінки..." when fetching chunk bundles. This leads to abrupt layout shifts and a jarring user experience during navigation. Introducing subtle, highly polished global transition animations and layout skeleton loaders will dramatically improve the perceived speed, responsiveness, and premium feel of the platform without altering the core visual identity or layout structure.

## What Changes

- Enable native **View Transitions API** in React Router v7 for smooth cross-page navigations.
- Define a global CSS animation system in `src/index.css` for page mounting and soft fade/slide-up transitions.
- Upgrade raw text loading fallbacks inside React `<Suspense>` components with pulsing loading skeletons.
- Implement a thin, top-aligned progress bar to visually report page chunk resolution status for heavy routes.

## Capabilities

### New Capabilities
- `smooth-page-navigation`: Outlines the requirements for transition styles, fallback mount animations, and loading states to ensure polished and consistent navigation across all application routes.

### Modified Capabilities
<!-- None -->

## Impact

- **Frontend (`apps/react/frontend/my-react-app`)**:
  - `src/app/routes/Router.tsx`: Modify route definitions and `<Suspense>` fallbacks to support view transitions and custom loading skeletons.
  - `src/app/layouts/MainLayout.tsx`: Wrap route components to apply entry transitions.
  - `src/index.css`: Add custom animation properties, keyframes, and view-transition selectors.
  - UI pages: Update main section nodes to support soft entrance transitions where applicable.
