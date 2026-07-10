## Context

The backend `audit_service` and API Gateway already expose a fully functional endpoint at `/api/v1/admin/audit` that supports pagination, filtering by severity and event_type, and text search. The dashboard (`apps/admin`) currently shows the latest 5 logs using a simple summary table (`SystemLogsTable.tsx`). However, administrators need a dedicated page (`/logs`) to search, filter, and view the entire history of system events.

## Goals / Non-Goals

**Goals:**
- Implement a dedicated `/logs` page in `apps/admin` (React + Vite + Tailwind CSS).
- Provide robust filtering (severity level) and a text search bar.
- Implement server-side pagination to handle thousands of audit logs efficiently.
- Ensure the UI design matches the premium look and feel of existing pages (e.g., `CategoriesPage.tsx`), utilizing Tailwind CSS utility classes and `lucide-react` icons.

**Non-Goals:**
- Any modifications to the backend services (`gateway` or `audit_service`).
- Real-time WebSocket updates for audit logs (polling or standard fetch is sufficient).

## Decisions

1. **Data Fetching:** Use `@tanstack/react-query` (`useQuery`) via the existing `apiClient`. The query key will include pagination and filter parameters to automatically refetch when they change.
2. **Styling and Components:** Follow the styling patterns established in `CategoriesPage.tsx`. Use a skeleton loader while fetching data to prevent layout shift and improve perceived performance.
3. **Routing Integration:** Add the new route to the protected section of `App.tsx` and configure it to lazy-load the component. Update the "Переглянути всі події" link in the dashboard's `SystemLogsTable` to use `react-router-dom`'s `Link` component.

## Risks / Trade-offs

- **Risk:** Large JSON objects in the `details` field could clutter the UI.
  - **Mitigation:** The `details` column will truncate large JSON objects or display a simplified string representation, with the potential to add a collapsible accordion or modal for full details if necessary in the future.
