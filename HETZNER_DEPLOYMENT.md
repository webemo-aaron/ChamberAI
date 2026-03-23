# ChamberAI Hetzner Cloud Deployment Guide

**Status**: ✅ Ready to deploy (Stripe optional)
**Target**: Hetzner CPX31 (4 vCPU, 8GB RAM, 160GB SSD) + Caddy + Docker
**Cost**: €12.90/month (~$14/month)
**Uptime Target**: 99.5% (RTO/RPO <1 hour)

---

## Overview

This guide walks you through deploying ChamberAI to Hetzner Cloud. The system is **fully functional without Stripe** — deploy now with demo mode enabled, configure billing later.

### Deployment Flow
1. **Provision** VM on Hetzner Cloud (5 min)
2. **Bootstrap** VPS with Docker, firewall, backups (10 min)
3. **Configure** environment variables (5 min)
4. **Deploy** via Docker Compose (10 min)
5. **Verify** all services healthy (5 min)

**Total time**: ~35 minutes

---

## Prerequisites

### Local Machine
- `hcloud` CLI installed ([install here](https://github.com/hetznercloud/cli))
- Hetzner Cloud account with API token
- SSH key pair (`~/.ssh/id_rsa` and `~/.ssh/id_rsa.pub`)
- Domain names (optional, but recommended)

### What You'll Need
```
HCLOUD_TOKEN=xxx              # From Hetzner Cloud console → API Tokens
SSH_KEY_PATH=~/.ssh/id_rsa.pub
DOMAIN_API=api.yourdomain.com  # DNS will point here
DOMAIN_APP=app.yourdomain.com  # React frontend will be here
```

---

## Step 1: Provision Hetzner VM (5 min)

### 1a. Export Hetzner API Token
```bash
export HCLOUD_TOKEN="your-hetzner-api-token-here"
```

### 1b. Run Provisioning Script
```bash
cd /mnt/devdata/repos/ChamberAI
SSH_KEY_PATH=~/.ssh/id_rsa.pub \
  SERVER_NAME=chamberai-prod \
  SERVER_TYPE=cpx31 \
  ./scripts/provision_hetzner.sh
```

**Output** (save these):
```
Server ID: 12345678
Public IP: 46.224.10.3
SSH Command: ssh -i ~/.ssh/id_rsa root@46.224.10.3
```

### 1c. Update DNS Records

Point your domains to the server IP:
```bash
# In your DNS provider (Cloudflare, Route53, etc.):
api.yourdomain.com  A  46.224.10.3
app.yourdomain.com  A  46.224.10.3
```

**Wait 5-10 minutes for DNS propagation.**

---

## Step 2: Bootstrap VPS (10 min)

### 2a. SSH to Server
```bash
ssh -i ~/.ssh/id_rsa root@46.224.10.3
```

### 2b. Clone Repository
```bash
mkdir -p /opt
cd /opt
git clone https://github.com/mahoosuc-solutions/ChamberAI.git chamberai
cd chamberai
```

### 2c. Run Bootstrap Script
```bash
sudo APP_DIR=/opt/chamberai \
  SSH_PORT=22 \
  BACKUP_TIME="0 3 * * *" \
  ./scripts/bootstrap_vps.sh
```

**What this installs**:
- Docker Engine + Compose plugin
- UFW firewall (allows SSH, HTTP, HTTPS)
- fail2ban (protects against brute-force)
- Cron job for nightly backups (3am UTC)

### 2d. Verify Docker Installation
```bash
docker --version
docker compose --version
```

Expected output:
```
Docker version 27.x.x
Docker Compose version 2.x.x
```

### 2e. Re-login to Apply Docker Group
```bash
exit
ssh -i ~/.ssh/id_rsa root@46.224.10.3
```

---

## Step 3: Configure Environment (5 min)

### 3a. Create .env.hybrid from Template
```bash
cd /opt/chamberai
cp .env.hybrid.example .env.hybrid
```

### 3b. Edit Configuration
```bash
nano .env.hybrid
```

**Fill in these values**:

```bash
# Domains (from your DNS setup)
API_DOMAIN=api.yourdomain.com
APP_DOMAIN=app.yourdomain.com
ACME_EMAIL=ops@yourdomain.com  # Let's Encrypt certificate email

# Deployment mode (set to true during initial deployment)
DEMO_MODE=true
# Once Stripe is configured, change to:
# DEMO_MODE=false

# Firebase (use existing dev project for now)
GCP_PROJECT_ID=cam-aim-dev
FIREBASE_AUTH_ENABLED=true
FIREBASE_USE_EMULATOR=true
FIRESTORE_EMULATOR_HOST=firebase-emulators:8080
FIREBASE_AUTH_EMULATOR_HOST=firebase-emulators:9099
FIREBASE_STORAGE_EMULATOR_HOST=firebase-emulators:9199
GCS_BUCKET_NAME=chamberofcommerceai-local-audio

# CORS origin (where frontend is served from)
CORS_ORIGIN=https://app.yourdomain.com

# Worker callback
WORKER_ENDPOINT=http://worker:8080/tasks/process

# API base URL (used for Stripe redirects, etc.)
API_BASE=https://api.yourdomain.com

# Stripe (leave empty for now - will configure later)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO=
STRIPE_PRICE_COUNCIL=
STRIPE_PRICE_COUNCIL_ANNUAL=
STRIPE_PRICE_NETWORK=
APP_BASE_URL=https://app.yourdomain.com

# Multi-tenancy
DEFAULT_ORG_ID=default

# Bootstrap first admin user
AUTH_BOOTSTRAP_ADMINS=your-email@example.com

# Optional: Require membership verification
FIREBASE_REQUIRE_MEMBERSHIP=false  # Set to true after users are verified
```

**Save**: Press `Ctrl+O`, `Enter`, `Ctrl+X`

---

## Step 4: Deploy via Docker Compose (10 min)

### 4a. Deploy Stack
```bash
cd /opt/chamberai
./scripts/deploy_hybrid_vps.sh .env.hybrid
```

**Output**:
```
== Validate compose config ==
== Build and start hybrid stack ==
Pulling images... (may take 2-3 min)
Creating network chamberofcommerceai_default
Creating chamberofcommerceai-caddy-1
Creating chamberofcommerceai-firebase-emulators-1
Creating chamberofcommerceai-api-1
Creating chamberofcommerceai-worker-1
...
Deployment complete.
```

### 4b. Check Container Status
```bash
docker compose --env-file .env.hybrid -f docker-compose.hybrid.yml ps
```

Expected:
```
NAME                               STATUS
chamberofcommerceai-caddy-1        Up (healthy)
chamberofcommerceai-firebase-emulators-1  Up (healthy)
chamberofcommerceai-api-1          Up (healthy)
chamberofcommerceai-worker-1       Up (healthy)
```

### 4c. Wait for Services (1-2 minutes)

Check Caddy is serving traffic:
```bash
curl -s https://api.yourdomain.com/health | jq .
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-22T14:30:00Z"
}
```

---

## Step 5: Verify Deployment (5 min)

### 5a. Run Verification Script
```bash
./scripts/verify_hybrid_stack.sh .env.hybrid
```

Should show:
```
✅ Caddy running and healthy
✅ Firebase emulators running
✅ API service responding
✅ Worker service responding
✅ Database connectivity OK
✅ All required env vars set
```

### 5b. Check Billing Configuration Status
```bash
curl https://api.yourdomain.com/billing/status/system | jq .
```

Expected (Stripe not configured):
```json
{
  "configured": false,
  "key_type": "none",
  "prices_configured": false,
  "webhook_configured": false,
  "missing_config": {
    "secret_key": true,
    "webhook_secret": true,
    "price_pro": true,
    "price_council": true,
    "price_network": true
  }
}
```

✅ This is **normal** — Stripe will be configured in a separate step.

### 5c. Test User Creation
Access the app at `https://app.yourdomain.com`:
1. Sign up with a test email
2. Create a test meeting
3. Add motions, actions, minutes
4. Export as PDF/Markdown

**Expected**: Everything works, no billing blocks, DEMO_MODE=true allows free tier to create real meetings.

---

## Step 6: Post-Deployment Checklist

- [ ] SSL/TLS working (green lock in browser at `https://app.yourdomain.com`)
- [ ] Health checks passing (all containers healthy)
- [ ] Can create test meeting without paying
- [ ] Firebase emulator is running (not using live Firebase)
- [ ] Backups cron job scheduled (runs nightly at 3am UTC)
- [ ] Firewall configured (SSH, HTTP, HTTPS only)

---

## Accessing the System

### Frontend
```
https://app.yourdomain.com
```

### API
```
curl https://api.yourdomain.com/health
```

### SSH to Server
```bash
ssh -i ~/.ssh/id_rsa root@46.224.10.3
cd /opt/chamberai
```

---

## Monitoring & Logs

### View Container Logs
```bash
docker compose --env-file .env.hybrid -f docker-compose.hybrid.yml logs -f api
docker compose --env-file .env.hybrid -f docker-compose.hybrid.yml logs -f worker
docker compose --env-file .env.hybrid -f docker-compose.hybrid.yml logs -f caddy
```

### View System Metrics
```bash
docker stats
```

### Check Disk Space
```bash
df -h /
```

**Alert threshold**: < 10GB free, trigger cleanup

---

## Backing Up Data

### Manual Backup
```bash
cd /opt/chamberai
./scripts/backup_hybrid_data.sh .env.hybrid
```

Backup location: `/opt/chamberai/backups/`

### Automated Backups
Cron runs nightly at **3am UTC** (configured in bootstrap).

Keep last 14 days of backups (configurable via `BACKUP_KEEP` env var).

### Restore from Backup
```bash
./scripts/restore_hybrid_data.sh backups/chamberai-2026-03-22-030000.tar.gz .env.hybrid
```

---

## Security Hardening (Optional, Recommended)

### 1. Disable Root Login
```bash
sudo sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart sshd
```

### 2. Enable UFW Logging
```bash
sudo ufw logging on
sudo ufw logging high
```

### 3. Rotate SSH Keys (Monthly)
```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_rsa_new
# Add to authorized_keys, test new key, then remove old key
```

### 4. Review Firewall Rules
```bash
sudo ufw status verbose
```

Expected:
```
22/tcp         ALLOW       Anywhere
80/tcp         ALLOW       Anywhere
443/tcp        ALLOW       Anywhere
```

---

## Configuring Stripe (Later, When Ready)

**This is a separate step** — deploy first without Stripe, then configure billing anytime:

### Prerequisites
- Hetzner deployment is running
- DEMO_MODE=false will enforce paid tier

### Steps
1. Create Stripe account (https://stripe.com)
2. Create 3 products + 4 prices (see STRIPE_CONFIGURATION.md)
3. Register webhook endpoint in Stripe Dashboard
4. Update `.env.hybrid` with Stripe keys:
   ```bash
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_PRO=price_...
   # ... etc
   DEMO_MODE=false
   ```
5. Redeploy:
   ```bash
   ./scripts/deploy_hybrid_vps.sh .env.hybrid
   ```

---

## Troubleshooting

### Containers Won't Start
```bash
docker compose --env-file .env.hybrid -f docker-compose.hybrid.yml logs api
# Check for missing env vars, port conflicts, or image build errors
```

### DNS Not Resolving
```bash
nslookup api.yourdomain.com
# Should return 46.224.10.3
# If not, wait 10+ minutes or check DNS provider
```

### Caddy Certificate Issues
```bash
docker compose --env-file .env.hybrid -f docker-compose.hybrid.yml logs caddy
# Check ACME_EMAIL is set correctly
# Verify domains resolve to server IP
```

### Out of Disk Space
```bash
docker system prune -a
# Remove unused images/containers
```

### High CPU/Memory
```bash
docker stats
# Check which service is using resources
# May need larger server (cpx41) if load increases
```

---

## Next Steps (After Deployment)

1. **Set up monitoring** (optional)
   - Hetzner Cloud Console → Metrics
   - CloudWatch or Grafana for custom metrics

2. **Configure CI/CD** (optional)
   - GitHub Actions to auto-deploy on push to main
   - See `.github/workflows/` for templates

3. **Set up email** (optional)
   - SendGrid, Mailgun, or AWS SES for transactional emails
   - Update Firebase Cloud Functions config

4. **Enable Stripe billing** (separate docs)
   - Create Stripe products/prices
   - Test full checkout flow
   - Switch DEMO_MODE=false

5. **Load production data** (if migrating)
   - Export from old system
   - Import via bulk API endpoints

---

## Support & Scaling

### Current Capacity
- **CPX31**: ~100-200 concurrent users, 500+ meetings/month
- **Uptime**: 99.5% target (45 min/month acceptable downtime)
- **Storage**: 160GB SSD, ~100GB available after OS/Docker

### When to Scale Up
- > 200 concurrent users → upgrade to **CPX41** (8 vCPU, 16GB RAM)
- > 10TB storage → add second volume or enable S3 for audio files
- > 1000 QPS → consider load balancing across multiple servers

### Cost Scaling
| Tier | vCPU | RAM | SSD | Cost/mo |
|------|------|-----|-----|---------|
| CPX31 (current) | 4 | 8GB | 160GB | €12.90 |
| CPX41 | 8 | 16GB | 240GB | €24.90 |
| CPX51 | 16 | 32GB | 360GB | €49.90 |

---

## Rolling Back

If deployment goes wrong:

```bash
# Stop current deployment
docker compose --env-file .env.hybrid -f docker-compose.hybrid.yml down

# Restore from backup
./scripts/restore_hybrid_data.sh backups/chamberai-2026-03-22-030000.tar.gz .env.hybrid

# Redeploy previous working version
git checkout main~1  # Go back one commit
./scripts/deploy_hybrid_vps.sh .env.hybrid
```

---

## Disaster Recovery

### Data Loss Scenario
1. Automatic backups run daily (3am UTC)
2. Restore to any point in last 14 days
3. RTO: 15 min (restore from backup + redeploy)
4. RPO: 24 hours (last nightly backup)

### Server Loss Scenario
1. Reprovision new server (`provision_hetzner.sh`)
2. Restore from backup
3. Redeploy
4. Total time: ~30 min

### Disk Failure
- Hetzner hardware redundancy handles this
- Backups are stored locally (safe)
- Snapshots available in Hetzner Console

---

## Maintenance Schedule

| Task | Frequency | Time |
|------|-----------|------|
| Security updates | Weekly | Off-peak |
| Docker image updates | Monthly | Planned |
| Backup retention cleanup | Monthly | Auto |
| SSL certificate renewal | Auto | 60 days before expiry |
| Firewall rule audit | Quarterly | Scheduled |
| Disaster recovery drill | Annually | Planned |

---

## Questions?

Refer to:
- **Architecture**: `docs/ARCHITECTURE.md`
- **API Docs**: `docs/API.md`
- **Stripe Setup**: `STRIPE_CONFIGURATION.md` (after deployment)
- **Local Dev**: `DOCKER.md`

---

**Last Updated**: 2026-03-22
**Version**: 1.0 (Production Ready)
**Deployment Status**: ✅ READY
