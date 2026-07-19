# backend-ci-tests Specification

## Purpose
TBD - created by archiving change backend-test-coverage. Update Purpose after archive.
## Requirements
### Requirement: Python service tests run in CI
The CI pipeline SHALL run `pytest --cov` for every Python service that contains a `tests/` directory, using the existing matrix of `py-services`.

#### Scenario: Python service with tests is tested
- **WHEN** a push or pull request modifies a Python service that has a `tests/` directory
- **THEN** the CI pipeline MUST execute `pytest --cov` against that service and the job MUST fail if any test fails

#### Scenario: Python service without tests is skipped gracefully
- **WHEN** a push or pull request modifies a Python service that does not have a `tests/` directory
- **THEN** the CI pipeline MUST skip the test step for that service and MUST NOT fail the overall job solely due to the absence of tests

### Requirement: Go service tests run in CI
The CI pipeline SHALL run `go test -v ./...` for the `products_etl` service.

#### Scenario: Go tests execute on push
- **WHEN** a push or pull request modifies files under `services/products_etl/`
- **THEN** the CI pipeline MUST run `go test -v ./...` and the job MUST fail on any test failure

### Requirement: Rust service tests run in CI
The CI pipeline SHALL run `cargo test` for the `search_service` service.

#### Scenario: Rust tests execute on push
- **WHEN** a push or pull request modifies files under `services/search_service/`
- **THEN** the CI pipeline MUST run `cargo test` and the job MUST fail on any test failure

### Requirement: Coverage reporting
The CI pipeline SHALL collect coverage reports from each tested service and upload them as CI artifacts.

#### Scenario: Python coverage XML uploaded
- **WHEN** the Python test job completes successfully
- **THEN** the pipeline MUST upload the `coverage.xml` artifact for the service, regardless of whether the subsequent stages succeed

### Requirement: Pre-commit unit test hook
The repository SHALL include a pre-commit hook configuration that runs unit tests for the modified Python service before the commit is created.

#### Scenario: Pre-commit runs tests for modified service
- **WHEN** a developer stages changes to `services/cart_service/` and runs `git commit`
- **THEN** the pre-commit hook MUST run `pytest services/cart_service/tests/` and MUST block the commit if any test fails

#### Scenario: Pre-commit skips when no service changes
- **WHEN** a developer commits changes only to documentation or non-service paths
- **THEN** the pre-commit hook MUST skip the test step and allow the commit to proceed

