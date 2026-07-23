## Why

In GitHub Actions CI workflows (`.github/workflows/ci.yml`), `go-ci` and `rust-ci` jobs fail with `Error: EACCES: permission denied, stat '/root/.gitconfig'`.
This occurs because job-level `env: HOME: /root` overrides the home directory for `actions/checkout@v4`, causing the non-root runner user (`runner`) to attempt accessing `/root/.gitconfig` without root permissions.

Fixing this restores green CI builds for Go ETL and Rust Search Service components.

## What Changes

- Remove invalid `HOME: /root` overrides from `go-ci` and `rust-ci` job-level environment definitions in `.github/workflows/ci.yml`.
- Remove `HOME: /root` from `deploy-hetzner` job environment.
- Update cache paths for Go and Cargo in `ci.yml` to use standard user home relative paths (`~/.cargo`, `~/go`).
- Add standard toolchain setup step for Go (`actions/setup-go@v5`) and Rust (`dtolnay/rust-toolchain@stable`) to ensure predictable build environments.

## Capabilities

### Modified Capabilities
- `ci-cd-pipeline`: Fix permissions and environment setup in CI workflow for Go and Rust services.

## Impact

- `.github/workflows/ci.yml`
- CI build success rates for Go ETL and Rust Search Service.
