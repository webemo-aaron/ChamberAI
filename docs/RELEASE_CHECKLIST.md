# Release Checklist (Self-Hosted Free Tier)

Use this checklist for stable, repeatable releases of the self-hosted tier.

## Pre-Release

- [ ] Run full test suite (`npm test`)
- [ ] Confirm Docker Compose boots cleanly
- [ ] Validate API health at `/health`
- [ ] Verify basic workflow: create meeting -> draft minutes -> approve
- [ ] Review `docs/DEPLOYMENT.md` for accuracy
- [ ] Confirm `services/api-firebase/.env.example` and `services/worker-firebase/.env.example` are current
- [ ] Update version notes in `CHANGELOG.md`

## Security & Compliance

- [ ] Scan dependencies (`npm audit`)
- [ ] Confirm no secrets committed (`rg -n "(API_KEY|SECRET|PRIVATE_KEY)"`)
- [ ] Review `SECURITY.md` and `CODE_OF_CONDUCT.md` for accuracy

## Build & Packaging

- [ ] Build API Docker image
- [ ] Build Worker Docker image
- [ ] Verify images start with docker-compose

## Documentation

- [ ] Update `README.md` if there are UX/API changes
- [ ] Update `docs/ARCHITECTURE.md` for system changes
- [ ] Update `docs/api-firebase.md` if endpoints changed

## Release

- [ ] Tag release in Git (`vX.Y.Z`)
- [ ] Publish release notes (copy from `CHANGELOG.md`)
- [ ] Announce release location and upgrade notes

## Post-Release

- [ ] Monitor issues and feedback
- [ ] Triage regressions
