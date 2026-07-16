## Context

The Smarket Admin Panel currently uses hardcoded colors or a single light theme. To improve user experience for administrators who work long hours, we need to support a dark theme. The dark theme designs are not ready yet, but we need to prepare the frontend infrastructure (React app in `apps/react`) so that implementing the designs later is as simple as possible.

## Goals / Non-Goals

**Goals:**
- Prepare Tailwind CSS configuration to support the dark mode toggle (`class` strategy).
- Define basic CSS variables for colors (backgrounds, text, borders) to be used by both light and dark themes.
- Implement a global Zustand store for theme state management.
- Ensure the application properly reads the theme on load and applies the `dark` class to the HTML document.

**Non-Goals:**
- Do not implement a fully polished dark theme matching final designs (since mockups are pending).
- Do not redesign existing components structurally, only prepare their color properties.

## Decisions

- **Tailwind Dark Mode Strategy**: Use `darkMode: 'class'` in Tailwind config. This allows manual toggling by appending the `dark` class to the `<html>` tag, rather than relying solely on OS settings (media query).
- **State Management**: Use Zustand for state (`useThemeStore`), synchronized with `localStorage` (via `persist` middleware). Zustand is already the standard state manager in this project.
- **CSS Variables**: Introduce variables in `index.css` (e.g., `--admin-bg`, `--admin-text`) so we don't have to rewrite every single component's Tailwind classes. Tailwind will reference these variables in its config.
- **Initialization**: A small React hook (`useThemeInit`) or direct effect in the root App component will be used to sync the Zustand store state with the DOM's `class` attribute on load.

## Risks / Trade-offs

- **[Risk]** Hardcoded colors in existing components might not respond to the dark mode switch.
  → **Mitigation**: Update the `admin-panel-styling` spec to transition towards CSS variables for styling. Refactor obvious hardcoded colors (like `#265447` and `#6D8279` for text) to CSS variables that invert automatically in dark mode.
