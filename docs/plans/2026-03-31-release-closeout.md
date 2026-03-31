# 2026-03-31 Release Closeout

## Deployed Revision
- Git SHA: `380f4f0`
- Branch: `main`
- Deployment target: Hetzner hybrid stack

## Validation Executed
- `node --test tests/unit/secretary-console-*.test.js` -> pass (89/89)
- `node --test tests/unit/phase17-governance-insights.test.js` -> pass (30/30)
- `node --test tests/unit/governance-insights-smoke-script.test.js` -> pass (2/2)
- `npm run test:release-gate` -> unit/contracts pass; intermittent Playwright critical instability observed

## Release Workflow Evidence
- Command: `./scripts/hetzner_release.sh .env.hybrid`
- Result: success
- Health checks: API/worker/Caddy healthy
- Showcase verification: primary external call returned 401, compose-network fallback passed across seeded cities

## Known Follow-ups
- Keep `backups/` out of source control and retained as local operational artifacts only.
- Continue reducing unified exec session churn during long operator sessions.
- Critical E2E flake observed in `tests/playwright/business_hub.spec.mjs` (`#loginSubmit` click timeout where element reports unstable/out-of-viewport); isolated rerun passed. Treat as environment/test-harness instability and harden bootstrap interaction for deterministic CI.
