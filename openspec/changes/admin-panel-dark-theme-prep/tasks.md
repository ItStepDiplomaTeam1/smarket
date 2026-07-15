## 1. State Management

- [x] 1.1 Create `useThemeStore` in `apps/admin/src/store/` with Zustand, including persistence to `localStorage`
- [x] 1.2 Implement logic (e.g., `useEffect` in the root App or AdminLayout) to sync the theme state with the `dark` class on the `<html>` or `<body>` element. on initial load and state changes

## 2. Global CSS & Tailwind Configuration

- [x] 2.1 Update `apps/react/tailwind.config.js` (or relevant config) to enable `darkMode: 'class'`
- [x] 2.2 Add CSS variables to `apps/react/src/index.css` for light and dark themes (e.g., `--admin-bg`, `--admin-text`, `--admin-text-bold`, `--admin-text-regular`)
- [x] 2.3 Extend Tailwind theme configuration to map colors to the new CSS variables

## 3. UI Implementation

- [x] 3.1 Add a basic theme toggle switch (or button) in the admin panel header/sidebar to switch between light and dark themes
- [ ] 3.2 Refactor existing hardcoded colors (like `#265447` for bold text, `#6D8279` for regular text) in the admin panel layout/components to use the new semantic Tailwind classes (per `admin-panel-styling` spec)
