## ADDED Requirements

### Requirement: Standard GitHub Runner Home Environment for Go and Rust Jobs
The CI workflow (`.github/workflows/ci.yml`) SHALL NOT override `HOME` to `/root` in job-level environment configurations for GitHub-hosted or runner environment jobs.

#### Scenario: Checkout step executes without permission errors
- **WHEN** GitHub Actions triggers `actions/checkout@v4` in `go-ci` or `rust-ci` jobs
- **THEN** checkout executes cleanly without throwing `EACCES: permission denied, stat '/root/.gitconfig'` errors

### Requirement: Portable User Caching for Go and Cargo
The CI workflow SHALL use standard relative user-home directory paths (`~/.cargo`, `~/go`) for dependency caching.

#### Scenario: Cargo and Go dependency caching
- **WHEN** `actions/cache@v4` runs in `go-ci` or `rust-ci`
- **THEN** dependency caches are saved and restored from user home directory locations accessible by the runner process
