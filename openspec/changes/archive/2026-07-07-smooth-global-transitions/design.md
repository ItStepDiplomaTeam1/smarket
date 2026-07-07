## Context

The Smarket React frontend currently operates as a Single Page Application (SPA) using React Router v7. Navigation between pages is instantaneous in terms of DOM swapping, but visually abrupt. Furthermore, the application relies on lazy loading (`React.lazy`) for all routes, showing bare-bones fallback text elements (e.g., "Завантаження...") while new page chunks are downloaded. This design proposes a set of unobtrusive global transitions, skeleton loaders, and entry animations to optimize perceived performance and aesthetic smoothness.

## Goals / Non-Goals

**Goals:**
- Implement global page transition effects during navigation using standard CSS and the browser's View Transitions API.
- Re-purpose React Router `<Suspense>` loaders from text place-holders to shimmering skeleton wireframes.
- Ensure the changes are purely visual enhancements with minimal footprint and zero additional runtime library dependencies.
- Retain identical layout structures and functional behaviors.

**Non-Goals:**
- Introducing heavy stateful animation engines (such as Framer Motion or React Spring) which would bloat the bundle size.
- Changing the layout, fonts, colors, or structural styling of the pages.

## Decisions

### Decision 1: React Router v7 View Transitions API for Page Navigation
- **Approach**: Enable `viewTransition` prop on `<Link>` and `<NavLink>` elements. Leverage native browser GPU-accelerated view transitions.
- **Rationale**: Since the application is already using React Router v7, native View Transitions are natively supported. This keeps performance extremely high and relies on browser defaults.
- **CSS Selectors**:
  ```css
  ::view-transition-old(root) {
    animation: fade-out 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  ::view-transition-new(root) {
    animation: fade-in-slide-up 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  ```
- **Alternatives considered**:
  - `react-transition-group`: Adds dependencies and adds complex state wrappers around routes.
  - Custom React wrapper state: Hard to handle layout capturing compared to the browser's native API.

### Decision 2: Location-Keyed Mounting Animation for universal CSS fallback
- **Approach**: Add a CSS class (`page-enter-active`) to the main page content wrapper inside `MainLayout.tsx`. Bind a React `key` to this container based on `location.pathname`.
  ```tsx
  <main className="flex-1">
    <div key={location.pathname} className="animate-page-enter">
      <Outlet />
    </div>
  </main>
  ```
- **Rationale**: When a new page is clicked, the `key` resets, prompting React to unmount/remount the container. This triggers the CSS `@keyframes` page animation for every browser, including those lacking full View Transitions API compatibility.

### Decision 3: High-fidelity Shimmer Skeletons in `Suspense`
- **Approach**: Replace generic string fallbacks with specialized, lightweight functional components inside `Router.tsx`:
  - `CatalogSkeleton` for the Catalog route.
  - `ShopsSkeleton` for the Shops route.
  - `PageSkeleton` (generic block skeleton) for simpler text/content routes.
- **Tailwind Setup**: Use Tailwind v4's native `animate-pulse` utility along with structural layout shapes (matching the target headers and content sections) to keep code light.

## Risks / Trade-offs

- **[Risk] View Transitions API Browser Compatibility** → Mitigation: Supported out of the box in Chrome, Edge, and Safari. For unsupported browsers, the location-keyed CSS mount animation serves as a perfect graceful fallback.
- **[Risk] Double-triggering of animations** → Mitigation: If both View Transitions and mounting animations fire simultaneously, page jumps can occur. Ensure the CSS mount animation duration is fast and uses smooth transforms (`translateY` not exceeding `8px`) or disable the mount animation if a view transition is active using CSS `@supports` checking.
