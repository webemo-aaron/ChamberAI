# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

## [Unreleased]

## [0.2.16-rc1] - 2026-02-25

- Aligned repository Firebase defaults to `cam-aim-dev` (`.firebaserc`, `scripts/dev_laptop.sh`) for consistent local/CLI project targeting.
- Hardened critical action-items CSV E2E flow by waiting for successful import API response and post-import UI state before assertions.
- Regenerated release evidence with passing release gate, rollback drill, and console guard trend artifacts.

## [0.2.12] - 2026-02-25

- Stabilized minutes editing E2E further by waiting for meeting status `DRAFT_READY` before editing and extending persistence polling to avoid asynchronous generation races in CI.

## [0.2.11] - 2026-02-25

- Hardened minutes editing E2E persistence check by polling draft content through API before UI reload assertions, reducing intermittent CI failures.

## [0.2.10] - 2026-02-25

- Stabilized minutes editing E2E by waiting for explicit `Draft saved.` collaboration status before reloading and re-opening the meeting.

## [0.2.9] - 2026-02-25

- Switched the `e2e` GitHub Actions job to use the Docker Compose stack (same as compose-smoke) and fixed fixture seeding base URL to `http://127.0.0.1:4001`.

## [0.2.8] - 2026-02-25

- Fixed compose smoke console trend artifact generation by ensuring `artifacts/` exists before teeing warning logs in CI and local scripts.

## [0.2.7] - 2026-02-25

- Made `scripts/verify_local_stack.sh` and `scripts/diag_frontend.sh` compatible with both `docker-compose` and `docker compose` to fix compose smoke CI failures on GitHub runners.

## [0.2.6] - 2026-02-25

- Fixed Docker Compose CI build contexts for API and worker services (`services/api-firebase`, `services/worker-firebase`) to prevent compose smoke build failures.

## [0.2.5] - 2026-02-25

- Added explicit `build` definitions for API and worker services in `docker-compose.yml` so CI compose workflows do not attempt missing remote images.

## [0.2.4] - 2026-02-25

- Updated `auth-middleware` CI job to boot Firebase emulator and set Firestore emulator environment for auth integration tests.

## [0.2.3] - 2026-02-25

- Updated Node test scripts to use shell-expanded file paths (`tests/unit/*.test.js`, `tests/contracts/*.test.mjs`) for CI compatibility.

## [0.2.2] - 2026-02-25

- Added portable fallback from `rg` to `grep` in `scripts/check_test_quality.sh` so CI quality gates run on runners without ripgrep.

## [0.2.1] - 2026-02-25

- Fixed CI quality gate path handling to use repository-relative locations in `scripts/check_test_quality.sh`.

## [0.2.0] - 2026-02-25

- Added full-text advanced search endpoint (`GET /search/meetings?q=`) and console controls.
- Added real-time collaborative minutes editing across active console sessions.
- Added minutes version history with rollback support in the minutes panel.
- Hardened API response parsing for non-JSON/error responses in secretary console.
- Added clean-room compose smoke validation in CI.
- Added release-time report assertion and release artifact attachment in GitHub Actions.
- Added API contract test suite (`npm run test:contracts`).
- Added release gate automation script (`./scripts/release_gate.sh`) with report artifact output.
- Added rollback runbook (`docs/ROLLBACK.md`) and clean test state reset script (`./scripts/reset_test_state.sh`).
- Added rollback drill automation script (`./scripts/rollback_drill.sh`).
- Added metrics threshold gate script (`./scripts/check_metrics_thresholds.sh`).
- Added basic observability endpoints (`/metrics`) and structured request logs for API and worker services.

## [0.1.0] - 2026-02-16

- Initial open-source documentation set
- Self-hosted deployment guide
- Release checklist and governance docs
