## 1. Page Wrappers and Layouts

- [x] 1.1 Update `/auth` login page wrapper (`src/pages/Auth/index.tsx`) to use page background `#0B110F`, card container background `#111A17`, and appropriate text sage/white colors.
- [x] 1.2 Update `/register` page wrapper and Left Brand Panel layout in `src/modules/Auth/components/Create.tsx` to use page background `#0B110F`, card background `#111A17`, and correct text coloring.
- [x] 1.3 Update `/forgot-password` page wrapper in `src/modules/Auth/components/ForgotPass.tsx` to use page background `#0B110F`, card background `#111A17`, and correct text coloring.
- [x] 1.4 Apply the linear gradient `bg-gradient-to-b from-[rgba(74,222,128,0.31)] to-[rgba(17,26,23,0.47)]` and the right border to the Left Brand Panel on all three pages.
- [x] 1.5 Update the weekly basket info card on the Left Brand Panel to use a translucent dark-green background (`bg-[#265447]/30`) and yellow text highlights.

## 2. Form Components Styling

- [x] 2.1 Update input fields, password toggle, and links in the `LoginForm` (`src/modules/Auth/components/Login.tsx`) to match dark theme specifications (background `#1D2A25`, text `#EAF7F2`, active border, and teal links `#3DAE8B`).
- [x] 2.2 Update input fields, password toggle, links, and strength checklist in the `Create` registration form to match dark theme specifications.
- [x] 2.3 Update input fields, submit button, and back link in the `ForgotPass` form to match dark theme specifications.
- [x] 2.4 Modify `TelegramLoginButton` (`src/modules/Auth/components/TelegramLoginButton.tsx`) to use the dark theme button style (dark-green background `#1B2A24`, light text, and green-accented borders).
- [x] 2.5 Update the Google OAuth button styling in `Auth/index.tsx`, `Create.tsx`, and `Popup.tsx` to use the dark-green background `#1B2A24` and white text.
- [x] 2.6 Style the unused/legacy `Popup` component (`src/modules/Auth/components/Popup.tsx`) to ensure theme alignment.

## 3. Verification & Testing

- [x] 3.1 Run local Vite dev server and manually verify visual design matches mockup on `/auth` (Login).
- [x] 3.2 Manually verify visual design matches mockup on `/register` (Registration), including checklist items.
- [x] 3.3 Manually verify visual design matches mockup on `/forgot-password` (Forgot Password).
