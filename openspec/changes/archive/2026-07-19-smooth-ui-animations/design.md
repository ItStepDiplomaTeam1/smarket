## Context

The user experience in Smarket currently lacks polished visual feedback during page changes, search execution, and user inputs. Standard styling transitions are abrupt or completely absent, failing to convey the premium, responsive feel expected from a modern web application.

To solve this, we will add hardware-accelerated transitions to the main search dialog (`HeaderSearch.tsx`), global page transitions triggered by route changes, loading skeleton enhancements (shimmer instead of pulse), and standard micro-interactions (soft lift transforms and shadow transitions) on interactive buttons, cards, and text inputs.

## Goals / Non-Goals

**Goals:**
- Provide a smooth, spring-like opening and closing transition for the header search modal (`HeaderSearch.tsx`).
- Refine the mobile swipe-to-close gesture on the search header with elastic boundaries.
- Add hardware-accelerated routing transitions (soft page fade-in) across all page-level components.
- Introduce keyframe-based gradient shimmer effects for loading skeletons to replace simple opacity pulses.
- Enhance interactive elements (catalog product cards, CTA buttons, inputs) with lift and scale transition states.

**Non-Goals:**
- Overhaul layout structure or change responsive media query breakpoints.
- Install third-party heavy motion libraries (e.g., Framer Motion or React Spring). All animations must be CSS-driven for lightweight bundle footprints.

## Decisions

### 1. Header Search Modal Transition States
Instead of relying on immediate class switches during unmounting, we will leverage an explicit four-state state machine: `closed` -> `opening` -> `open` -> `closing`.
- **Rationale**: This allows mounting the component, rendering the start state (`opacity-0 translate-y-12 sm:scale-95`), playing the transition using a 3D transform trigger in the next animation frame, and delaying unmounting until the close transition completes.
- **Easing Curve**: We will use a cubic-bezier function that mimics a physics-based spring: `cubic-bezier(0.34, 1.56, 0.64, 1)` (back-out effect).

### 2. Shimmer Effects for Skeletons
We will introduce a `.shimmer-bg` class that animates a linear-gradient background's horizontal position using keyframes:
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```
- **Rationale**: Replacing the standard `animate-pulse` block opacity oscillations with a sweeping reflection overlay gives a much higher perceived loading speed and matches standard premium web designs.

### 3. Lightweight Route Transitions
Add a container inside `MainLayout.tsx` using `key={location.pathname}` and applying the class `animate-page-enter`.
- **Rationale**: Since pages are lazy-loaded, changing the React Router location key forces a clean unmount and mount, triggering the CSS-defined page-enter animation.

---

## Risks / Trade-offs

- **[Risk] Layout Thrashing from CSS Transforms** → **[Mitigation]** Use strictly hardware-accelerated properties (`opacity` and `transform: translate3d/scale`) that skip the layout and paint stages of the rendering pipeline. Avoid animating width, height, or margin/padding values.
- **[Risk] Mobile Gesture Lag** → **[Mitigation]** Ensure touch events map to inline styles using `will-change: transform` to indicate to the browser to promote the container to a GPU layer.
