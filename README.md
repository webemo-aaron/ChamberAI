# ChamberOfCommerceAI

![Build](https://img.shields.io/github/actions/workflow/status/mahoosuc-solutions/ChamberOfCommerceAI/ci.yml)
![License](https://img.shields.io/github/license/mahoosuc-solutions/ChamberOfCommerceAI)
![Issues](https://img.shields.io/github/issues/mahoosuc-solutions/ChamberOfCommerceAI)

ChamberOfCommerceAI is a Secretary Console that helps teams run meetings, capture minutes, and track
follow-ups. The self-hosted (free) tier runs locally with the Firebase Emulator Suite and
can be switched to real Firebase services for production.

Docs index: `docs/INDEX.md`

GitHub Pages: https://webemo-aaron.github.io/ChamberAI/

Pilot intake: https://webemo-aaron.github.io/ChamberAI/pilot-intake.html

## Features

- Meeting creation and management
- Minutes drafting and approval flow
- Motions tracking
- Action items and CSV export
- Public summary generation and publishing
- Audit log and retention sweep
- Settings management and feature flags
- Advanced full-text meeting search
- Real-time collaborative minutes editing
- Minutes version history with rollback

## Free vs Paid

**Free (self-hosted)**

- Run locally via Docker Compose
- Firebase Emulator Suite by default
- Core meeting, minutes, and action-item workflows

**Paid (SaaS)**

- Hosted version with managed infrastructure
- Enhanced AI processing and automation
- Advanced analytics and integrations

## Status

- Feature audit and definition of done: `FEATURE_AUDIT_AND_DEFINITION_OF_DONE.md`

## Release Checklist (Free Tier)

- Checklist: `docs/RELEASE_CHECKLIST.md`
- Deployment guide: `docs/DEPLOYMENT.md`

## Quick Start (Docker Compose)

```bash
# Clone and start
npm install

docker-compose up -d

# Console UI: http://localhost:5173
# Console Health: http://localhost:5173/healthz
# API Health: http://localhost:4001/health
# Firebase UI: http://localhost:4000
```

Stop services:

```bash
docker-compose down
```

## Documentation

- Deployment: `docs/DEPLOYMENT.md`
- Lowest-cost hybrid deployment: `docs/DEPLOYMENT_LOW_COST_HYBRID.md`
- GCP + Vercel low-cost deployment: `docs/DEPLOYMENT_GCP_VERCEL_LOW_COST.md`
- Docs index: `docs/INDEX.md`
- Architecture: `docs/ARCHITECTURE.md`
- API (mock): `docs/api.md`
- API (Firebase): `docs/api-firebase.md`
- Worker (Firebase): `docs/worker-firebase.md`
- Governance: `docs/governance-policy.md`
- Roadmap: `docs/roadmap.md`
- Changelog: `CHANGELOG.md`
- Rollback runbook: `docs/ROLLBACK.md`
- Support: `SUPPORT.md`
- Outreach one-pager: `docs/mission-vision.md`
- Landing page outline: `docs/landing-page-outline.md`
- Community posts: `docs/community-posts.md`
- Subscriptions (PayPal): `docs/SUBSCRIPTIONS.md`

## Development

```bash
# Terminal 1
npm run dev:firebase

# Terminal 2
npm run dev:api

# Terminal 3
npm run dev:console
```

## Testing

```bash
# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e

# Critical E2E flows
npm run test:e2e:critical

# API contract tests (requires local stack)
npm run test:contracts

# UI test quality gate
npm run test:quality

# Full test suite
npm test

# One-command release gate report
./scripts/release_gate.sh

# One-command local RC pipeline (no GitHub Actions required)
npm run rc:local
# Optional tuning:
# SOAK_CRITICAL_RUNS=5 SOAK_ROLLBACK_RUNS=2 SKIP_RESET=1 npm run rc:local

# Reset dockerized test state
./scripts/reset_test_state.sh

# Seed baseline test data
./scripts/seed_test_data.sh

# Seed deterministic fixture dataset
./scripts/seed_fixture_data.sh
# Optional fixture cleanup strategy before seeding (docker reset):
FIXTURE_CLEANUP_MODE=reset ./scripts/seed_fixture_data.sh

# Rollback validation drill
./scripts/rollback_drill.sh

# Assert rollback drill has zero failed critical tests
npm run test:rollback-critical-gate

# Build release evidence bundle (after release gate + rollback drill)
./scripts/build_release_evidence.sh

# Verify evidence manifest/checksums
./scripts/verify_release_evidence.sh

# Package evidence archive for release draft attachment
tar -czf artifacts/release-evidence.tar.gz -C artifacts release-evidence

# Verify draft release assets and publish
./scripts/promote_release_draft.sh vX.Y.Z

# Track console guard warning trends without failing (warn mode)
npm run test:console-guard-trend

# Fail on warning-regression vs baseline
npm run test:console-guard-regression

# Verify packaged release archive checksums
npm run test:verify-release-archive

# Hybrid VPS deploy (frontend hosted separately)
sudo APP_DIR=/opt/chamberai SSH_PORT=22 ./scripts/bootstrap_vps.sh
./scripts/deploy_hybrid_vps.sh .env.hybrid
./scripts/verify_hybrid_stack.sh .env.hybrid
./scripts/backup_hybrid_data.sh .env.hybrid

# GCP + Vercel Pro low-cost deploy
cp .env.gcp.vercel.example .env.gcp.vercel
./scripts/deploy_gcp_vercel_low_cost.sh .env.gcp.vercel
./scripts/configure_gcp_low_cost_controls.sh .env.gcp.vercel
./scripts/check_gcp_monthly_readiness.sh .env.gcp.vercel
./scripts/setup_firebase_web_auth.sh cam-aim-dev
./scripts/enable_firebase_google_auth.sh cam-aim-dev

# Deploy secretary console to Vercel production
./scripts/deploy_vercel_console.sh
```

If local Playwright is blocked by Chromium sandbox constraints, use GitHub Actions `e2e` job as the canonical browser E2E signal and run `./scripts/verify_local_stack.sh` for local stack health.

Feature-to-test mapping: `docs/testing/feature_test_matrix.yaml`  
Quality gate policy: `docs/testing/quality_gates.md`

## Contributing

See `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md`.

## Security

See `SECURITY.md` for reporting guidelines.

## License

MIT. See `LICENSE`.
