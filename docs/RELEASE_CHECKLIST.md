# Release Checklist (Self-Hosted Free Tier)

Use this checklist for stable, repeatable releases of the self-hosted tier.

## Pre-Release

- [ ] Run release gate script (`./scripts/release_gate.sh`) and archive `artifacts/release-gate-report.txt`
- [ ] Run rollback drill (`./scripts/rollback_drill.sh`) and archive `artifacts/rollback-drill-report.txt`
- [ ] Rollback critical-test gate passes (`./scripts/check_rollback_critical_failures.sh artifacts/rollback-drill-report.txt`)
- [ ] Build release evidence bundle (`./scripts/build_release_evidence.sh`) and archive `artifacts/release-evidence/`
- [ ] Verify release evidence integrity (`./scripts/verify_release_evidence.sh`)
- [ ] Package evidence archive (`tar -czf artifacts/release-evidence.tar.gz -C artifacts release-evidence`)
- [ ] Verify draft release assets and publish (`./scripts/promote_release_draft.sh <tag>`)
- [ ] Rollback warning threshold check passes (`./scripts/check_rollback_warnings.sh artifacts/rollback-drill-report.txt`)
- [ ] Verify archive checksum integrity (`./scripts/verify_release_archive.sh artifacts/release-evidence.tar.gz`)
- [ ] Console warning regression check passes (`./scripts/check_console_guard_regression.sh artifacts/console-guard-warning-trend.json docs/testing/console_guard_baseline.json`)
- [ ] Run full test suite (`npm test`)
- [ ] Run security gate (`npm run test:security`)
- [ ] Run UI quality gate (`npm run test:quality`)
- [ ] Run critical UI flows (`npm run test:e2e:critical`)
- [ ] If local Playwright is sandbox-blocked, confirm E2E passed in GitHub Actions `e2e` job
- [ ] Confirm Docker Compose boots cleanly
- [ ] Validate API health at `/health`
- [ ] Validate compose services in-container (`./scripts/verify_local_stack.sh`)
- [ ] Verify basic workflow: create meeting -> draft minutes -> approve
- [ ] Review `docs/DEPLOYMENT.md` for accuracy
- [ ] Confirm `services/api-firebase/.env.example` and `services/worker-firebase/.env.example` are current
- [ ] Update version notes in `CHANGELOG.md`

## Security & Compliance

- [ ] Scan dependencies (`npm audit`)
- [ ] Confirm no secrets committed (`./scripts/check_no_secrets.sh`)
- [ ] Review `SECURITY.md` and `CODE_OF_CONDUCT.md` for accuracy

## Build & Packaging

- [ ] Build API Docker image
- [ ] Build Worker Docker image
- [ ] Verify images start with docker-compose

## Documentation

- [ ] Update `README.md` if there are UX/API changes
- [ ] Update `docs/ARCHITECTURE.md` for system changes
- [ ] Update `docs/api-firebase.md` if endpoints changed
- [ ] Review rollback runbook (`docs/ROLLBACK.md`)

## Release

- [ ] Confirm the exact commit/tag has a fully green CI workflow before publishing the GitHub release
- [ ] Tag release in Git (`vX.Y.Z`)
- [ ] Publish release notes (copy from `CHANGELOG.md`)
- [ ] Announce release location and upgrade notes

## Post-Release

- [ ] Monitor issues and feedback
- [ ] Triage regressions
