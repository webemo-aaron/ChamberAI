# Remaining Worktree Slices Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split the remaining uncommitted work into reviewable, validated commits, starting with business hub/showcase parity, then meetings and kiosk workflows, then deployment/docs cleanup.

**Architecture:** The remaining tree is not one feature. Execute it as bounded slices with contract tests at each boundary so frontend shell changes, Firebase-backed routes, mock API behavior, data scripts, and deployment tooling do not drift independently. Prefer compatibility aliases over breaking payload changes, and validate each slice with targeted tests before committing.

**Tech Stack:** Vanilla JS secretary-console, Express APIs (`services/api-firebase`, `services/api`), Firestore/Firebase auth, Node test runner, shell deployment scripts, Cloud Run/Vercel/Hetzner tooling.

---

### Task 1: Snapshot the Remaining Slices

**Files:**
- Modify: `docs/plans/2026-03-30-remaining-worktree-slices.md`
- Inspect: `git status --short`

**Step 1: Verify the current post-shell state**

Run:
```bash
git status --short
```

Expected:
- secretary-console shell files are committed already
- remaining modified files cluster into:
  - business hub/showcase
  - meetings/kiosk
  - backend/showcase/API routes
  - infra/docs/scripts
  - artifact cleanup

**Step 2: Record the slice boundaries**

Keep this exact grouping:
- Slice A: business hub/showcase parity
- Slice B: meetings and kiosk workflow expansion
- Slice C: deployment/Hetzner/GCP/docs/scripts
- Slice D: cleanup-only artifacts and ignores

**Step 3: Do not mix slices**

Rule:
- no commit may include files from more than one slice unless a compatibility alias is required for the slice under test

**Step 4: Commit**

No commit in this task.

### Task 2: Validate Business Hub / Showcase Frontend-Backend Contract

**Files:**
- Modify: `apps/secretary-console/views/business-hub/business-hub-view.js`
- Modify: `apps/secretary-console/views/business-hub/business-detail.js`
- Modify: `apps/secretary-console/views/business-hub/business-hub.css`
- Modify: `apps/secretary-console/views/business-hub/business-list.js`
- Modify: `apps/secretary-console/views/business-hub/tabs/ai-search-tab.js`
- Modify: `apps/secretary-console/views/business-hub/tabs/geographic-tab.js`
- Modify: `apps/secretary-console/views/business-hub/tabs/profile-tab.js`
- Modify: `apps/secretary-console/views/business-hub/tabs/quotes-tab.js`
- Modify: `apps/secretary-console/views/business-hub/tabs/reviews-tab.js`
- Modify: `apps/secretary-console/core/api.js`
- Modify: `services/api-firebase/src/routes/business_listings.js`
- Modify: `services/api-firebase/src/routes/quotes.js`
- Modify: `services/api-firebase/src/routes/review_workflow.js`
- Modify: `services/api/src/business_listings.js`
- Modify: `services/api/src?` Not applicable; use `services/api/business_listings.js`
- Modify: `services/api/business_listings.js`
- Modify: `services/api/business_store.js`
- Modify: `services/api/server.js`
- Test: `tests/unit/secretary-console-business-hub-workflows.test.js`
- Test: `tests/unit/secretary-console-showcase-smoke.test.js`
- Test: `tests/unit/api-firebase-showcase-dedupe.test.js`
- Test: `tests/unit/api-firebase-business-import.test.js`
- Test: `tests/unit/business-store-persistence.test.js`

**Step 1: Write or complete the failing contract tests first**

Run:
```bash
node --test \
  tests/unit/secretary-console-business-hub-workflows.test.js \
  tests/unit/secretary-console-showcase-smoke.test.js \
  tests/unit/api-firebase-showcase-dedupe.test.js \
  tests/unit/api-firebase-business-import.test.js \
  tests/unit/business-store-persistence.test.js
```

Expected:
- at least one failing assertion that identifies current contract drift

**Step 2: Normalize the core business listing payload**

Implement minimal compatibility rules:
- list and detail endpoints must agree on ID, category, geo scope, city/state, contact, and timestamps
- quote/review tabs must not rely on fields that only exist in one API
- if the frontend expects legacy names, return compatibility aliases instead of breaking the UI

**Step 3: Verify list/detail parity across Firebase and mock APIs**

Code to inspect and align:
- `services/api-firebase/src/routes/business_listings.js`
- `services/api/business_listings.js`
- `services/api/server.js`
- `services/api/business_store.js`

Checks:
- `GET /business-listings`
- `GET /business-listings/:id`
- `PUT /business-listings/:id`
- review and quote child resources

**Step 4: Validate showcase city filtering and local state behavior**

Code to inspect and align:
- `apps/secretary-console/views/business-hub/business-list.js`
- `apps/secretary-console/views/business-hub/business-hub-view.js`
- `apps/secretary-console/views/common/showcase-city-context.js`

Checks:
- city change updates list state
- invalid deep-linked IDs fail gracefully
- detail pane and list selection stay in sync

**Step 5: Validate tab-level workflows**

Code to inspect and align:
- `apps/secretary-console/views/business-hub/tabs/profile-tab.js`
- `apps/secretary-console/views/business-hub/tabs/reviews-tab.js`
- `apps/secretary-console/views/business-hub/tabs/quotes-tab.js`
- `apps/secretary-console/views/business-hub/tabs/ai-search-tab.js`
- `apps/secretary-console/views/business-hub/tabs/geographic-tab.js`

Checks:
- profile edits persist or fail safely
- review actions and drafted responses match backend payloads
- quote actions bind to the correct business ID
- AI search and geographic metadata degrade safely when data is sparse

**Step 6: Re-run the business hub suite**

Run:
```bash
node --test \
  tests/unit/secretary-console-business-hub-workflows.test.js \
  tests/unit/secretary-console-showcase-smoke.test.js \
  tests/unit/api-firebase-showcase-dedupe.test.js \
  tests/unit/api-firebase-business-import.test.js \
  tests/unit/business-store-persistence.test.js
```

Expected:
- all tests pass

**Step 7: Add live-ish script verification**

Run:
```bash
node --test tests/api_smoke.test.js
node scripts/live_showcase_smoke.mjs --help
```

Expected:
- smoke test file still passes or fails only for known external-runtime reasons
- showcase smoke script loads cleanly

**Step 8: Commit**

Run:
```bash
git add \
  apps/secretary-console/views/business-hub \
  apps/secretary-console/core/api.js \
  services/api-firebase/src/routes/business_listings.js \
  services/api-firebase/src/routes/quotes.js \
  services/api-firebase/src/routes/review_workflow.js \
  services/api/business_listings.js \
  services/api/business_store.js \
  services/api/server.js \
  tests/unit/secretary-console-business-hub-workflows.test.js \
  tests/unit/secretary-console-showcase-smoke.test.js \
  tests/unit/api-firebase-showcase-dedupe.test.js \
  tests/unit/api-firebase-business-import.test.js \
  tests/unit/business-store-persistence.test.js
git commit -m "Unify business hub showcase flows across frontend and APIs"
```

### Task 3: Validate Meetings and Kiosk Workflow Slice

**Files:**
- Modify: `apps/secretary-console/views/kiosk/kiosk-chat.js`
- Modify: `apps/secretary-console/views/kiosk/kiosk-config.js`
- Modify: `apps/secretary-console/views/kiosk/kiosk-view.js`
- Modify: `apps/secretary-console/views/kiosk/kiosk.css`
- Modify: `apps/secretary-console/components/kiosk-widget.js`
- Modify: `apps/secretary-console/components/kiosk-widget.css`
- Modify: `apps/secretary-console/views/meetings/components/meeting-row.js`
- Modify: `apps/secretary-console/views/meetings/meeting-detail-header.js`
- Modify: `apps/secretary-console/views/meetings/meeting-workflow-utils.js`
- Modify: `apps/secretary-console/views/meetings/meetings.css`
- Modify: `apps/secretary-console/views/meetings/tabs/action-items-tab.js`
- Modify: `apps/secretary-console/views/meetings/tabs/audit-tab.js`
- Modify: `apps/secretary-console/views/meetings/tabs/minutes-tab.js`
- Modify: `apps/secretary-console/views/meetings/tabs/motions-tab.js`
- Modify: `apps/secretary-console/views/meetings/tabs/public-summary-tab.js`
- Modify: `apps/secretary-console/views/meetings/utils/format.js`
- Modify: `services/api-firebase/src/routes/action_items.js`
- Modify: `services/api-firebase/src/routes/kiosk.js`
- Modify: `services/api-firebase/src/routes/meetings.js`
- Modify: `services/api-firebase/src/services/kiosk-context.js`
- Modify: `services/api-firebase/src/services/kiosk-embeddings.js`
- Test: `tests/unit/secretary-console-meetings-workflows.test.js`
- Test: `tests/unit/kiosk-embeddings.test.js`
- Test: `tests/unit/phase15-mobile-api.test.js`

**Step 1: Run the failing workflow tests first**

Run:
```bash
node --test \
  tests/unit/secretary-console-meetings-workflows.test.js \
  tests/unit/kiosk-embeddings.test.js \
  tests/unit/phase15-mobile-api.test.js
```

Expected:
- failures identify UI/backend drift or missing helpers

**Step 2: Align meeting detail and tab actions**

Checks:
- action-item row menus expose correct ARIA and actions
- motions, minutes, audit, and public-summary tabs use the current payloads
- header/state transitions do not regress prior workflows

**Step 3: Align kiosk route, widget, and backend contracts**

Checks:
- kiosk config and kiosk chat use the same auth/org assumptions as backend
- widget loads cleanly and fails gracefully if feature-gated
- embeddings/context helpers are covered by narrow tests

**Step 4: Re-run the workflow suite**

Run:
```bash
node --test \
  tests/unit/secretary-console-meetings-workflows.test.js \
  tests/unit/kiosk-embeddings.test.js \
  tests/unit/phase15-mobile-api.test.js
```

Expected:
- all tests pass

**Step 5: Commit**

Run:
```bash
git add \
  apps/secretary-console/views/kiosk \
  apps/secretary-console/components/kiosk-widget.js \
  apps/secretary-console/components/kiosk-widget.css \
  apps/secretary-console/views/meetings \
  services/api-firebase/src/routes/action_items.js \
  services/api-firebase/src/routes/kiosk.js \
  services/api-firebase/src/routes/meetings.js \
  services/api-firebase/src/services/kiosk-context.js \
  services/api-firebase/src/services/kiosk-embeddings.js \
  tests/unit/secretary-console-meetings-workflows.test.js \
  tests/unit/kiosk-embeddings.test.js \
  tests/unit/phase15-mobile-api.test.js
git commit -m "Align meetings and kiosk workflows with current API contracts"
```

### Task 4: Validate Deployment / Hetzner / Production Tooling Slice

**Files:**
- Modify: `.env.hybrid.example`
- Modify: `DEPLOYMENT_INFO.md`
- Modify: `docker-compose.hybrid.yml`
- Modify: `docs/DEPLOYMENT_GCP_VERCEL_LOW_COST.md`
- Modify: `docs/DEPLOYMENT_LOW_COST_HYBRID.md`
- Modify: `docs/HETZNER_SETUP.md`
- Modify: `firebase.json`
- Modify: `firestore.rules`
- Modify: `package.json`
- Modify: `scripts/bootstrap_vps.sh`
- Modify: `scripts/check_gcp_monthly_readiness.sh`
- Modify: `scripts/deploy_hybrid_vps.sh`
- Modify: `scripts/provision_hetzner.sh`
- Modify: `scripts/remote_deploy.sh`
- Add: `.cloudrun.yaml`
- Add: `.gcloudignore`
- Add: `cloudbuild.yaml`
- Add: `docs/DEPLOYMENT_GUIDE.md`
- Add: `docs/ENCRYPTION_GUIDE.md`
- Add: `docs/GO_LIVE_CHECKLIST.md`
- Add: `docs/HETZNER_MCP_OPERATIONS.md`
- Add: `docs/MONITORING_SETUP.md`
- Add: `docs/RUNBOOKS.md`
- Add: `scripts/check_gcp_deploy_permissions.sh`
- Add: `scripts/deploy-production.sh`
- Add: `scripts/hetzner_preflight.sh`
- Add: `scripts/hetzner_rollback.sh`
- Add: `scripts/sync_hetzner_release_workspace.sh`
- Add: `scripts/verify_api_image_integrity.sh`
- Test: `tests/integration/deployment.test.js`
- Test: `tests/unit/deployment-iam-docs.test.js`
- Test: `tests/unit/gcp-deploy-permissions-script.test.js`
- Test: `tests/unit/gcp-monthly-readiness-script.test.js`
- Test: `tests/unit/production-hardening.test.js`

**Step 1: Run the deployment/tooling tests**

Run:
```bash
node --test \
  tests/integration/deployment.test.js \
  tests/unit/deployment-iam-docs.test.js \
  tests/unit/gcp-deploy-permissions-script.test.js \
  tests/unit/gcp-monthly-readiness-script.test.js \
  tests/unit/production-hardening.test.js
```

Expected:
- failures identify mismatched docs/scripts/config

**Step 2: Align docs with the scripts that actually exist**

Checks:
- no script documented under the wrong name
- Hetzner/GCP/Vercel flows reflect current production state
- runbooks and checklists reference current Cloud Run URLs and auth assumptions

**Step 3: Validate config file consistency**

Checks:
- `package.json` scripts point to real files
- Firebase project naming is consistent where intended
- hybrid/docker files reflect the current deploy model

**Step 4: Re-run the deployment/tooling suite**

Run:
```bash
node --test \
  tests/integration/deployment.test.js \
  tests/unit/deployment-iam-docs.test.js \
  tests/unit/gcp-deploy-permissions-script.test.js \
  tests/unit/gcp-monthly-readiness-script.test.js \
  tests/unit/production-hardening.test.js
```

Expected:
- all tests pass

**Step 5: Commit**

Run:
```bash
git add \
  .env.hybrid.example \
  DEPLOYMENT_INFO.md \
  docker-compose.hybrid.yml \
  docs \
  firebase.json \
  firestore.rules \
  package.json \
  scripts \
  .cloudrun.yaml \
  .gcloudignore \
  cloudbuild.yaml \
  tests/integration/deployment.test.js \
  tests/unit/deployment-iam-docs.test.js \
  tests/unit/gcp-deploy-permissions-script.test.js \
  tests/unit/gcp-monthly-readiness-script.test.js \
  tests/unit/production-hardening.test.js
git commit -m "Harden deployment and hybrid operations tooling"
```

### Task 5: Cleanup-Only Slice

**Files:**
- Delete: `cam-aim-dev-firebase-adminsdk-fbsvc-cbe89bd20a.json:Zone.Identifier`
- Delete: `test-results/action_items_csv-action-items-CSV-import-export-critical/error-context.md`
- Delete: `test-results/approval_export-approval-gating-and-export-flow-critical/error-context.md`
- Delete: `test-results/meeting-creation-Meeting-C-6ef2e-ll-required-fields-critical/error-context.md`
- Delete: `test-results/meeting-workflow-Meeting-W-29446--process---approve-critical/error-context.md`
- Modify: `apps/secretary-console/.gitignore`

**Step 1: Remove artifact-only files**

Run:
```bash
git rm --ignore-unmatch \
  'cam-aim-dev-firebase-adminsdk-fbsvc-cbe89bd20a.json:Zone.Identifier' \
  test-results/action_items_csv-action-items-CSV-import-export-critical/error-context.md \
  test-results/approval_export-approval-gating-and-export-flow-critical/error-context.md \
  test-results/meeting-creation-Meeting-C-6ef2e-ll-required-fields-critical/error-context.md \
  test-results/meeting-workflow-Meeting-W-29446--process---approve-critical/error-context.md
```

Expected:
- only artifact files are removed

**Step 2: Add ignore coverage if needed**

Checks:
- transient OS metadata is ignored
- generated test artifacts are ignored if they should not live in git

**Step 3: Commit**

Run:
```bash
git add apps/secretary-console/.gitignore
git commit -m "Remove generated artifacts from the worktree"
```

### Task 6: Full Validation Pass Before Push

**Files:**
- Inspect only

**Step 1: Run slice-level verification**

Run:
```bash
node --test \
  tests/unit/secretary-console-business-hub-workflows.test.js \
  tests/unit/secretary-console-showcase-smoke.test.js \
  tests/unit/api-firebase-showcase-dedupe.test.js \
  tests/unit/api-firebase-business-import.test.js \
  tests/unit/business-store-persistence.test.js \
  tests/unit/secretary-console-meetings-workflows.test.js \
  tests/unit/kiosk-embeddings.test.js \
  tests/unit/phase15-mobile-api.test.js \
  tests/integration/deployment.test.js \
  tests/unit/deployment-iam-docs.test.js \
  tests/unit/gcp-deploy-permissions-script.test.js \
  tests/unit/gcp-monthly-readiness-script.test.js \
  tests/unit/production-hardening.test.js
```

Expected:
- all targeted tests pass

**Step 2: Check the tree is reduced to intentional changes**

Run:
```bash
git status --short
```

Expected:
- only known unstarted slices remain, or the tree is clean

**Step 3: Push or open PRs by slice**

Recommended PR order:
1. business hub/showcase parity
2. meetings/kiosk workflows
3. deployment/hybrid/docs
4. cleanup-only

**Step 4: Commit**

No commit in this task.
