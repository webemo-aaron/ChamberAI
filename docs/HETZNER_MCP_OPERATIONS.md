# ChamberAI Hetzner MCP Operations Runbook

This runbook defines the MCP-first operating model for the current ChamberAI Hetzner cloud deployment. The deployment topology remains a hardened single VPS. Application deploy mechanics still run through the existing hybrid scripts, but infrastructure state, protection points, and rollback readiness are treated as Hetzner control-plane concerns.

For the current production deployment, treat `https://chamberai.mahoosuc.ai` as the canonical app hostname and `https://api.chamberai.mahoosuc.ai` as the canonical API hostname.

## MCP-first operating model

- Hetzner MCP is the preferred authority for server, firewall, snapshot, and capacity state.
- The current repo scripts remain the execution path for application changes:
  - `./scripts/sync_hetzner_release_workspace.sh root@46.224.10.3`
    - syncs the release workspace manifest into `/opt/ChamberAI` before server-side deploys when the host is not being updated via git push
  - `./scripts/deploy_hybrid_vps.sh .env.hybrid`
    - rebuilds the `api` image with `--no-cache`
    - verifies `chamberofcommerceai-api:local` with `./scripts/verify_api_image_integrity.sh`
  - `./scripts/verify_hybrid_stack.sh .env.hybrid`
  - `./scripts/backup_hybrid_data.sh .env.hybrid`
- Until a direct Hetzner MCP adapter is wired into the repo, the workflow scripts use the current `hcloud` CLI as the control-plane bridge while preserving the same preflight, protect, deploy, verify, and rollback sequence.

## Standard release workflow

1. Run `./scripts/hetzner_preflight.sh .env.hybrid`.
2. Create an application backup with `./scripts/backup_hybrid_data.sh .env.hybrid`.
3. Create a Hetzner snapshot through `./scripts/hetzner_snapshot.sh`.
4. Sync the release workspace with `./scripts/sync_hetzner_release_workspace.sh root@46.224.10.3` when the host is not pulling from a pushed git ref.
5. Deploy the stack with `./scripts/deploy_hybrid_vps.sh .env.hybrid`.
   This now rebuilds the API image without cache and performs an API image-integrity check before any container restart.
6. Wait for the stabilization window configured by `DEPLOY_STABILIZATION_SECONDS`.
7. Verify the application with `./scripts/verify_hybrid_stack.sh .env.hybrid`.
8. Re-run `./scripts/hetzner_preflight.sh .env.hybrid` as the post-deploy state check.

For routine releases, use:

```bash
HCLOUD_TOKEN=... ./scripts/hetzner_release.sh .env.hybrid
```

## Preflight gates

The release is blocked if any of the following fail:

- `HCLOUD_SERVER_ID` is missing or does not resolve to a running server.
- `HCLOUD_FIREWALL_NAME` does not expose the expected inbound ports from `DEPLOY_EXPECTED_INBOUND_PORTS`.
- `API_DOMAIN` or `APP_DOMAIN` resolves to an IP different from the Hetzner server public IP.
- Free disk is below `DEPLOY_MIN_DISK_FREE_MB`.
- Available memory is below `DEPLOY_MIN_MEMORY_FREE_MB`.

These gates are conservative by design because the current topology is single-node and has no standby capacity.

## Rollback policy

Two rollback modes are supported:

- `ROLLBACK_MODE=app`
  - Restores the latest known-good application backup with `restore_hybrid_data.sh`
  - Re-runs `verify_hybrid_stack.sh`
- `ROLLBACK_MODE=snapshot`
  - Reserved for node-level incidents or broken runtime state
  - Restore the server from the desired Hetzner snapshot using Hetzner MCP or `hcloud`
  - Re-attach the expected firewall
  - Re-run deploy and verify once the instance is available

Application rollback is the default. Snapshot rollback is the escalation path.

## Snapshot and backup policy

- Application backups are required before every release.
- Hetzner snapshots are required before every release.
- Snapshot retention is controlled by `HCLOUD_SNAPSHOT_RETENTION`.
- Snapshot metadata must encode:
  - snapshot label
  - release ref
  - reason (`pre-deploy`, `scheduled`, or `manual`)

## Capacity policy for the single VPS

- Keep at least `DEPLOY_MIN_DISK_FREE_MB` free on the root volume.
- Keep at least `DEPLOY_MIN_MEMORY_FREE_MB` available before rollout.
- If either threshold is routinely breached, resize the server before the next application release.
- If update windows become too risky or too slow, treat that as the trigger to plan the two-node split.
