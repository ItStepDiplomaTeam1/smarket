## 1. Workflow Environment & Permissions Fix

- [x] 1.1 Remove `HOME: /root` override from `go-ci` job in `.github/workflows/ci.yml`
- [x] 1.2 Remove `HOME: /root` override from `rust-ci` job in `.github/workflows/ci.yml`
- [x] 1.3 Remove `HOME: /root` override from `deploy-hetzner` job in `.github/workflows/ci.yml`

## 2. Dependency Cache Paths Update

- [x] 2.1 Update Go module cache path in `go-ci` from `/root/...` to `~/go/pkg/mod` and `~/.cache/go-build`
- [x] 2.2 Update Cargo cache path in `rust-ci` from `/root/...` to `~/.cargo/registry` and `~/.cargo/git`

## 3. Verification & Validation

- [x] 3.1 Validate `.github/workflows/ci.yml` syntax using `actionlint` or standard YAML parser
- [x] 3.2 Verify no remaining hardcoded `/root` environment overrides exist in workflow files
