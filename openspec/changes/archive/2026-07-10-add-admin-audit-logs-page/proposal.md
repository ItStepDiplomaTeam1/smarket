## Why

The admin dashboard currently displays a summary of the latest 5 system events. To fully fulfill the requirement of providing comprehensive system monitoring, the admin needs a dedicated "Журнал дій" (Audit Logs) page where they can view the entire history of system events, filter them by severity, and search through them using text.

## What Changes

- Add a new `LogsPage.tsx` component in `apps/admin/src/pages/` to display the full audit logs table with pagination and filters.
- Add a new route `/logs` in `apps/admin/src/App.tsx` to serve the `LogsPage`.
- Update the existing `SystemLogsTable.tsx` component on the dashboard to link to the new `/logs` page using React Router's `Link`.
- Add integration with the existing `apiClient` to fetch paginated logs from the `/api/v1/admin/audit` endpoint.

## Capabilities

### New Capabilities
- `admin-audit-logs-page`: Admin frontend page for viewing, filtering (by severity), searching, and paginating system audit logs.

### Modified Capabilities
<!-- Leave empty if no requirement changes. -->

## Impact

- `apps/admin/src/pages/LogsPage.tsx` (new file)
- `apps/admin/src/App.tsx` (routing update)
- `apps/admin/src/components/SystemLogsTable.tsx` (link update)
