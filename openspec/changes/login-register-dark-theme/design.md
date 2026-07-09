## Context

The current authentication pages (Login, Register, and Forgot Password) are styled in a light theme (`bg-[#F6FAF8]` backdrop with a white `#FFFFFF` card container and dark green `#265447` inputs/buttons). This design does not align with the premium dark branding assets. The goal of this change is to modify the styling of these components to implement a static dark theme matching the provided design mockups.

## Goals / Non-Goals

**Goals:**
- Implement a static dark theme for `/login`, `/register`, `/auth`, and `/forgot-password` pages/components.
- Match the exact hex color codes from the Figma specifications:
  - Page background: `#0B110F`
  - Card container background: `#111A17`
  - Input field background: `#1D2A25` with light text `#EAF7F2`
  - Primary button background: `#3DAE8B` (teal/green) with dark text `#111A17`
  - Left panel gradient: linear gradient from `#4ADE80` at 31% opacity to `#111A17` at 47% opacity.
  - Left panel basket card background: translucent `rgba(38, 84, 71, 0.3)`
- Maintain full functional parity, validation error messaging, loading indicators, and OAuth actions (Google/Telegram).

**Non-Goals:**
- Implementing a dynamic runtime theme switcher (light/dark toggle) for the rest of the application.
- Redesigning the layout structure or changing forms validation logic.

## Decisions

### 1. Left Panel Gradient Background
- **Choice**: Use Tailwind's arbitrary background gradient class `bg-gradient-to-b from-[rgba(74,222,128,0.31)] to-[rgba(17,26,23,0.47)]`.
- **Rationale**: This matches the Figma color details (`#4ADE80 31%` to `#111A17 47%`) while maintaining utility-first classes without needing to define custom themes in `vite.config.ts`.
- **Alternative**: CSS inline styles. Less maintainable and harder to inspect in developer tools compared to Tailwind.

### 2. Button and Link Color
- **Choice**: Primary actions buttons will use `bg-[#3DAE8B]` and `text-[#111A17]`, and links will use `text-[#3DAE8B]`.
- **Rationale**: Directly maps the design token specified in `input_file_2.png` and provides high contrast readability against the `#111A17` background.
- **Alternative**: Using standard Tailwind `bg-emerald-500` or `text-emerald-400`. These do not exactly match the custom hex `#3DAE8B` from Smarket's design details.

### 3. Google and Telegram Buttons Styling
- **Choice**: Update button background to `bg-[#1B2A24]` with border `border-[rgba(38,84,71,0.2)]` and text color `text-white`.
- **Rationale**: Blends smoothly with the dark panel, replacing the bright white button from the light theme.
- **Alternative**: Keeping the white background buttons. This creates an unappealing, high-contrast flash on the dark card.

### 4. Shared Form Elements
- **Choice**: Apply dark theme styling to all inputs across `Login.tsx`, `Create.tsx`, and `ForgotPass.tsx` statically.
- **Rationale**: Visual consistency across the entire user authentication experience.

## Risks / Trade-offs

- **[Risk]** Password strength checklist color contrast.
  - *Mitigation*: Ensure the checklist items are colored in `#A9B6B0` (muted green/gray) for unchecked and `#3DAE8B` or light green for checked states to guarantee WCAG contrast compliance.
- **[Risk]** Unused components like `Popup.tsx` drifting out of styling sync.
  - *Mitigation*: Style `Popup.tsx` with the same dark theme variables to prevent visual breaks if it is reintegrated or used in future catalog modals.
