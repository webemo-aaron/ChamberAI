# Low-Cost Hybrid Deployment (Under $20/mo)

This guide deploys ChamberAI with:

- Frontend on free static hosting (Cloudflare Pages recommended)
- API + worker + Firebase emulators on one low-cost VPS
- HTTPS termination with Caddy

Designed for small pilot usage with best-effort reliability.

## Target Cost

- Static frontend: $0/mo
- Single VPS (1 vCPU / 2GB RAM): ~$5-8/mo
- Optional domain: ~$1-2/mo equivalent
- Optional backup storage: $0-5/mo

Estimated total: **$6-15/mo**

## 1) Deploy Frontend (Free)

Use Cloudflare Pages (recommended) or GitHub Pages.

- Publish from repo path `apps/secretary-console`
- Note the public frontend URL (for example, `https://your-frontend.pages.dev`)

## 2) Provision VPS

Recommended baseline:

- Ubuntu 22.04/24.04
- 1 vCPU / 2GB RAM
- Docker + Docker Compose installed

Use one-command bootstrap (Docker + firewall + fail2ban + backup cron):

```bash
sudo APP_DIR=/opt/chamberai SSH_PORT=22 ./scripts/bootstrap_vps.sh
```

This enforces:

- UFW allowlist (`22`, `80`, `443`)
- fail2ban SSH protection
- nightly backup cron using `scripts/backup_hybrid_data.sh`

## 3) Configure Environment

On VPS:

```bash
cd /opt/chamberai
cp .env.hybrid.example .env.hybrid
```

Set at minimum:

- `API_DOMAIN` (for example `api.example.org`)
- `ACME_EMAIL`
- `CORS_ORIGIN` (your frontend URL)

## 4) Deploy Hybrid Stack

```bash
./scripts/deploy_hybrid_vps.sh .env.hybrid
```

This starts:

- `caddy` (public 80/443)
- `api` (private network)
- `worker` (private network)
- `firebase-emulators` (private network)

## 5) Verify Deployment

```bash
./scripts/verify_hybrid_stack.sh .env.hybrid
curl -I https://api.example.org/health
```

## 6) Backup and Restore

Backup Firebase emulator volume and env snapshot:

```bash
./scripts/backup_hybrid_data.sh .env.hybrid
```

Restore from archive:

```bash
./scripts/restore_hybrid_data.sh backups/firebase-data-<timestamp>.tgz .env.hybrid
```

## 7) Low-Cost Ops Rhythm

- Nightly backup cron:
  - `0 3 * * * cd /opt/chamberai && ./scripts/backup_hybrid_data.sh .env.hybrid`
- Weekly local RC validation:
  - `npm run rc:local`
- On-change verification:
  - `./scripts/verify_hybrid_stack.sh .env.hybrid`

## Notes

- This profile keeps current architecture and avoids migration effort.
- Reliability is single-node best-effort; use backups as the primary resilience control.
