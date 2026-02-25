# Rollback Notes

Use these steps when a release must be rolled back quickly.

## Container Rollback

1. Identify the last known-good tag (for example `v0.1.0`).
2. Checkout/tag deploy the previous image set.
3. Recreate services:
   - `docker compose down`
   - `docker compose up -d`
4. Validate health:
   - `./scripts/verify_local_stack.sh`

## Data Rollback (Local Emulator)

- For local development test rollback, reset emulator state:
  - `./scripts/reset_test_state.sh`

## Post-Rollback Validation

Run minimum gates:

- `npm run test:quality`
- `npm run test:unit`
- `npm run test:e2e:critical`

Document the rollback reason and follow-up remediation before retrying release.
