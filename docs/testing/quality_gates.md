# UI Automation Quality Gates

## Grade A Target

- All implemented user-facing features have outcome-based automated tests.
- Planned features have explicit placeholder tests (`test.skip`) with activation criteria.
- No active Playwright test contains placeholder assertions (`expect(true)`).
- CI gates pass consistently without retry masking.

## Required PR Gates

1. `npm run test:quality`
2. `npm run test:unit`
3. `npm run test:e2e:critical`

## Required Release Gates

1. `npm run test:quality`
2. `npm run test:unit`
3. `npm run test:contracts`
4. `npm run test:e2e`
5. `./scripts/verify_local_stack.sh`
6. `./scripts/release_gate.sh`

## Test Authoring Rules

- Assert user outcomes (state/content/status), not only clickability/visibility.
- Avoid `page.waitForTimeout` unless no event-based wait is possible.
- Do not suppress errors with broad `.catch(() => null)` in active tests.
- Tag critical tests with `@critical` in test titles.

## Placeholder Policy

- Planned features live in `tests/playwright/placeholders/planned-features.spec.js`.
- Placeholder tests must be `test.skip` and include requirement IDs.
- Placeholder tests must never run in PR critical gate.
