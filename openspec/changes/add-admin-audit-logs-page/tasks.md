## 1. Setup and Component Creation

- [x] 1.1 Create `LogsPage.tsx` skeleton component in `apps/admin/src/pages/`
- [x] 1.2 Implement UI layout (Header, Search input, Severity dropdown, Table structure) matching the premium design

## 2. API Integration

- [x] 2.1 Set up `@tanstack/react-query` `useQuery` hook in `LogsPage.tsx` to fetch from `/admin/audit` via `apiClient`
- [x] 2.2 Add state variables for `page`, `limit`, `severity`, and `search` parameters
- [x] 2.3 Connect state variables to the API query and UI inputs

## 3. UI Refinement and Wiring

- [x] 3.1 Implement pagination controls (Next/Prev buttons and page numbers)
- [x] 3.2 Add Lucide icons and Tailwind classes for log severities mapping (success, info, warning, error)
- [x] 3.3 Add a skeleton loader for the table loading state
- [x] 3.4 Add the `/logs` route in `apps/admin/src/App.tsx` using `React.lazy`
- [x] 3.5 Update `SystemLogsTable.tsx` to use `<Link to="/logs">` from `react-router-dom`
