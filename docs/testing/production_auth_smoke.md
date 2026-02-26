# Production Auth Smoke Test

Use this checklist run when validating live Google auth and membership-enforced API access.

## Command

```bash
npm run test:auth-smoke:prod
```

Optional arguments:

```bash
./scripts/run_production_auth_smoke.sh <project_id> <api_service> <frontend_url>
```

## What It Produces

Under `artifacts/auth-smoke/`:

- `*.checklist.txt` manual browser checklist
- `*.cloudrun.json` relevant Cloud Run logs (last 2h)
- `*.summary.txt` endpoint/status/error summary

## Pass Criteria

- Google chooser/auth page appears after clicking `Continue with Google`.
- Top bar shows `Auth: Google connected (<email>)`.
- `Settings -> Motion Integration -> Test Connection` does not return auth errors.
- No `Firebase token verification failed` or `Membership lookup failed` errors in summary.

## Fail Indicators

- UI shows `Invalid auth token`, `Forbidden`, or repeated save/test failures.
- Summary shows repeated `401` on `/integrations/motion/config` or `/integrations/motion/test`.
- Summary includes auth verification or membership lookup failures.
