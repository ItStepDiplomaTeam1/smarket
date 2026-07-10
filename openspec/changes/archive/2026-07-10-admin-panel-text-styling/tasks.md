## 1. Setup global typography

- [x] 1.1 Locate the main CSS file or layout wrapper for the admin panel in `apps/react`.
- [x] 1.2 Import `Manrope` and `Inter` fonts from Google Fonts (or verify they are already present).

## 2. Apply typography rules

- [x] 2.1 Update Tailwind config or CSS to set `Inter` as the default font for the admin pages and set text color to `#6D8279`.
- [x] 2.2 Add CSS rules or Tailwind layer styles to enforce `Manrope` and color `#265447` on `b`, `strong`, `h1`-`h6`, and `.font-bold` elements within the admin panel context.

## 3. Testing & Verification

- [x] 3.1 Verify font rendering and colors on various admin panel views.
- [x] 3.2 Ensure these changes do not unintentionally leak and affect the public frontend (if they share the same setup).
