## Context

In `.github/workflows/ci.yml`, the jobs `go-ci` (Go ETL) and `rust-ci` (Rust Search Service) set `HOME: /root` at the job-level `env:` block.
When `actions/checkout@v4` runs on standard GitHub-hosted `ubuntu-latest` runners (which execute as the unprivileged user `runner`), it attempts to inspect `$HOME/.gitconfig` (`/root/.gitconfig`), triggering `Error: EACCES: permission denied, stat '/root/.gitconfig'`.

## Goals / Non-Goals

**Goals:**
- Eliminate `HOME: /root` overrides in GitHub Actions jobs so `actions/checkout@v4` runs smoothly under user `runner`.
- Use standard user-home relative paths for Go module caching (`~/go/pkg/mod`, `~/.cache/go-build`) and Cargo caching (`~/.cargo`).
- Ensure `go-ci`, `rust-ci`, and `deploy-hetzner` jobs execute cleanly without filesystem permission errors.

**Non-Goals:**
- Modifying Docker container builds or Hetzner server deployment scripts (only workflow YAML environment configs are affected).

## Decisions

1. **Decision: Remove `HOME: /root` from job-level `env` blocks**
   - *Rationale*: GitHub-hosted runners run as user `runner` (`/home/runner`). Overriding `HOME` globally causes Node.js actions to attempt root filesystem operations.
   - *Alternative Considered*: Overriding `HOME` only inside `run:` steps — unnecessary since `~` resolves correctly by default.

2. **Decision: Update Go & Cargo cache paths in `ci.yml`**
   - *Rationale*: Caching paths like `/root/.cargo/registry/cache` fail when running as user `runner`. Updating them to `~/.cargo/...` and `~/go/...` allows `actions/cache@v4` to function as intended.

## Risks / Trade-offs

- **[Risk]**: Cargo binaries or Go modules on self-hosted runners might rely on specific system locations.
  - *Mitigation*: On Linux runners, standard user home directories (`~/go`, `~/.cargo`) are portable across both `ubuntu-latest` and `self-hosted` environments.
