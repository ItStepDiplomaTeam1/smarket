# Purpose
TBD: Dynamic dark theme integration for the login and registration pages.

# Requirements

## Requirement: Static Dark Theme Styling for Auth Pages

The frontend system MUST render the Login and Register page layouts and components using Smarket's static dark theme style rules. 

Specifically:
1. The outer page backdrop section SHALL use background color `#0B110F` (very dark green-black).
2. The card container containing the left and right panels SHALL use background color `#111A17` (dark charcoal-green) and border color `rgba(38, 84, 71, 0.08)`.
3. The Left Brand Panel background SHALL be a linear gradient combining `#4ADE80` (at 31% stop/opacity) and `#111A17` (at 47% stop/opacity), with a `1px` right border using color `#265447` at 8% opacity.
4. Input fields SHALL be styled with background color `#1D2A25`, text color `#EAF7F2`, and placeholder color `#6D8279`.
5. Primary buttons ("Зареєструватися", "Увійти") SHALL use background color `#3DAE8B` (teal-green) and text color `#111A17` with font-bold.
6. The interactive links (e.g. "Умови користування", "Політикою конфіденційності", "Увійти", "Зареєструватися") SHALL use text color `#3DAE8B`.
7. The weekly basket info card in the left panel SHALL use a translucent background color `rgba(38, 84, 71, 0.3)`.

#### Scenario: Verify Register Page Dark Theme Styling
- **WHEN** the user visits the `/register` page
- **THEN** the container renders in dark mode with the linear gradient left brand panel and the dark form fields on the right, with the register button using the solid teal `#3DAE8B` background and dark text.

#### Scenario: Verify Login Page Dark Theme Styling
- **WHEN** the user visits the `/login` or `/auth` pages
- **THEN** the container renders in dark mode with the linear gradient left brand panel and the dark form fields on the right, with the login button using the solid teal `#3DAE8B` background and dark text.
