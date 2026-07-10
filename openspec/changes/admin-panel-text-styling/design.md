## Context

The admin panel currently has inconsistent text styling for typography. The design requires a unified font family and color configuration for all bold texts and regular texts in the admin interfaces.

## Goals / Non-Goals

**Goals:**
- Unify the typography on the admin panel.
- Ensure all bold text uses the `Manrope` font with color `#265447`.
- Ensure all regular text uses the `Inter` font with color `#6D8279`.
- Apply these settings globally in Tailwind CSS config or a global CSS file.

**Non-Goals:**
- Modifying text styling on the customer-facing frontend.
- Refactoring the entire admin panel layout or components beyond typography.

## Decisions

- **Tailwind Configuration vs. Global CSS**: Update the Tailwind CSS config (and global CSS variables if needed) to define standard text colors and font-families. 
  - Add standard styles to the `body` or base layout for regular text.
  - Override styles for `b`, `strong`, and elements with `.font-bold` to enforce the new `Manrope` font and color `#265447`.
  - Import the fonts `Manrope` and `Inter` via Google Fonts in the `index.html` or `@import` in the main stylesheet if not already present.

## Risks / Trade-offs

- **Risk**: Hardcoded inline styles on individual components might override global settings.
  - **Mitigation**: Use Tailwind base layer or global CSS that target HTML elements. If inline styles exist, they may need to be cleaned up as part of the implementation tasks.
