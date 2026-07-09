## Why

The login and registration pages currently use the default light theme, which does not align with the premium dark theme aesthetics shown in Smarket's product designs. Implementing a static dark theme on these pages ensures visual consistency and a premium user experience across the entire authentication flow.

## What Changes

- **Dark Theme Page & Card Backgrounds**: Update the authentication page wrappers to use a dark backdrop (`#0B110F`) and card containers to use `#111A17`.
- **Gradient Left Brand Panel**: Implement the left panel background as a linear gradient combining `#4ADE80` (at 31% opacity/stop) and `#111A17` (at 47% opacity/stop), with a right border of `1px` `#265447` at 8% opacity.
- **Teal Primary Actions**: Customize all main buttons (e.g. "Зареєструватися", "Увійти") to use the brand teal/green color `#3DAE8B` with dark text (`#111A17` or `#173B33`).
- **Dark Input Controls**: Style inputs with a dark green-gray background (`#1D2A25`), light text (`#EAF7F2`), and appropriate focus and error states.
- **Sage and Green Typography**: Color normal text and labels in light sage (`#A9B6B0` or `#EAF7F2`) and highlights/links in bright teal (`#3DAE8B`).
- **Translucent Info Cards**: Style the "Ваш тижневий кошик" card with a translucent dark green background (`bg-[#265447]/30`) and appropriate text highlights.

## Capabilities

### New Capabilities
- `login-register-dark-theme`: Defines the visual and design spec for Smarket's dark theme authentication pages and inputs.

### Modified Capabilities
<!-- None -->

## Impact

- `apps/react/frontend/my-react-app/src/pages/Auth/index.tsx` (Login page wrapper layout)
- `apps/react/frontend/my-react-app/src/modules/Auth/components/Create.tsx` (Registration page wrapper and form layout)
- `apps/react/frontend/my-react-app/src/modules/Auth/components/Login.tsx` (Login form inputs and button)
- `apps/react/frontend/my-react-app/src/modules/Auth/components/ForgotPass.tsx` (Forgot password page layout & form styling)
