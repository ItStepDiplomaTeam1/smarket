## Why

The current text styling in the admin panel does not follow the designated design guidelines. Applying consistent fonts and colors to bold and regular text will improve the visual consistency and readability of the admin interfaces.

## What Changes

- Apply `#265447` color and `Manrope` font to all bold text across the admin pages.
- Apply `#6D8279` color and `Inter` font to all regular (thin) text across the admin pages.
- Ensure these styles are globally applied in the admin panel's CSS/Tailwind configuration or base layout to avoid repeating styles manually.

## Capabilities

### New Capabilities
- `admin-panel-styling`: Defines global text styling rules (colors and fonts) for the admin panel interfaces.

### Modified Capabilities

## Impact

- Global CSS files or Tailwind configuration for the `admin` application/pages.
- Base layout components for the admin panel.
