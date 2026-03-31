# ChamberAI Hetzner Cloud Deployment Guide

This guide covers provisioning and deploying ChamberAI to Hetzner Cloud using the pre-built infrastructure scripts.

## Prerequisites

- Hetzner Cloud account with billing method configured
- `hcloud` CLI installed: https://github.com/hetznercloud/cli
- `HCLOUD_TOKEN` environment variable (from Hetzner Cloud Console → API Tokens)
- SSH key pair (`~/.ssh/id_rsa.pub`)
- Domain name with DNS management

## Architecture

```
┌─────────────────────────────────────┐
│      Hetzner Cloud VPS (CPX31)      │
├─────────────────────────────────────┤
│ Caddy (port 80/443, TLS via ACME)   │
├─────────────────────────────────────┤
│ api.domain.com      → api:8080      │
│ app.domain.com      → console:5173  │
├─────────────────────────────────────┤
│ Services (Docker Compose)           │
│ • Firebase Emulator (port 8080)     │
│ • API Server (port 8080)            │
│ • Worker (port 8080)                │
│ • Console (port 5173)               │
│ • Caddy (port 80/443)               │
├─────────────────────────────────────┤
│ Volumes                             │
│ • firebase-data (Firestore, Auth)   │
│ • caddy_data, caddy_config (TLS)    │
└─────────────────────────────────────┘
```

## Step 1: Provision the VM

### 1.1 Set Environment Variables

```bash
export HCLOUD_TOKEN="your_api_token_here"
export SERVER_NAME="chamberai-prod"
export SSH_KEY_PATH="$HOME/.ssh/id_rsa.pub"
```

### 1.2 Run Provisioning Script

```bash
cd /path/to/ChamberAI
./scripts/provision_hetzner.sh
```

Output example:
```
Server ID: 12345678
Public IP: 192.0.2.100
SSH Command: ssh -i ~/.ssh/id_rsa root@192.0.2.100
```

### 1.3 Configure Firewall (Optional)

The provisioning script auto-creates a firewall. If you need to customize:

```bash
hcloud firewall list
hcloud firewall describe chamberai-firewall
```

Allowed ports by default:
- **22** (SSH)
- **80** (HTTP)
- **443** (HTTPS)

## Step 2: Configure DNS

Create two A records in your domain registrar/DNS provider:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | api | `192.0.2.100` | 300 |
| A | app | `192.0.2.100` | 300 |

**Example for `chamber.example.com`:**
- `api.chamber.example.com` → `192.0.2.100`
- `app.chamber.example.com` → `192.0.2.100`

Wait for DNS propagation (~5 minutes). Verify with:

```bash
nslookup api.chamber.example.com
nslookup app.chamber.example.com
```

## Step 3: Bootstrap the Server

### 3.1 SSH to VM

```bash
ssh -i ~/.ssh/id_rsa root@192.0.2.100
```

### 3.2 Clone Repository

```bash
mkdir -p /opt
cd /opt
git clone https://github.com/webemo-aaron/ChamberAI.git
cd ChamberAI
```

### 3.3 Run Bootstrap Script

```bash
sudo ./scripts/bootstrap_vps.sh
```

This installs:
- Docker & Docker Compose
- UFW firewall (allows 22, 80, 443)
- fail2ban (SSH brute-force protection)
- nightly backup cron job at 2am UTC

## Step 4: Configure Environment

### 4.1 Copy Template

```bash
cd /opt/ChamberAI
cp .env.hybrid.example .env.hybrid
chmod 600 .env.hybrid
```

### 4.2 Edit Configuration

```bash
nano .env.hybrid
```

**Required values:**

```bash
# API domain (from DNS setup)
API_DOMAIN=api.chamber.example.com
ACME_EMAIL=admin@chamber.example.com

# Frontend domain
APP_DOMAIN=app.chamber.example.com

# Stripe (get from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_PRO=price_xxxxx
STRIPE_PRICE_COUNCIL=price_xxxxx
STRIPE_PRICE_NETWORK=price_xxxxx
APP_BASE_URL=https://app.chamber.example.com

# Admin bootstrap (email of first admin user)
AUTH_BOOTSTRAP_ADMINS=admin@chamber.example.com

# Firebase (pre-configured for emulator)
GCP_PROJECT_ID=cam-aim-dev
CORS_ORIGIN=https://app.chamber.example.com
```

**Optional values:**

```bash
# Customize VM defaults
COMPOSE_PROJECT_NAME=chamberofcommerceai
DEFAULT_ORG_ID=default
API_PORT=8080
WORKER_PORT=8080
API_NODE_ENV=production
WORKER_NODE_ENV=production
```

### 4.3 Set Permissions

```bash
chmod 600 .env.hybrid
```

## Step 5: Deploy the Stack

### 5.1 Initial Deployment

```bash
./scripts/deploy_hybrid_vps.sh .env.hybrid
```

**Expected output:**
```
Building api...
Building worker...
Building firebase-emulators...
Starting docker compose stack...
Container xxxx is healthy
Container yyyy is healthy
✓ All services started
```

### 5.2 Verify Deployment

```bash
./scripts/verify_hybrid_stack.sh .env.hybrid
```

**Expected output:**
```
✓ API health check passed (200)
✓ Worker health check passed (200)
✓ Caddy TLS check passed
✓ Stack verification complete
```

### 5.3 Smoke Tests

Test the endpoints:

```bash
# API health
curl https://api.chamber.example.com/health

# Frontend
curl https://app.chamber.example.com

# Stripe webhook (requires auth)
curl -X POST https://api.chamber.example.com/billing/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"ping"}'
```

## Step 6: Configure Stripe Webhooks

### 6.1 Hetzner Firewall Verification

Ensure the VPS can reach Stripe webhooks (outbound HTTPS):

```bash
curl -I https://api.stripe.com/
# Should return 200 OK
```

### 6.2 Add Webhook in Stripe Dashboard

1. Go to **Developers → Webhooks**
2. Click **Add an endpoint**
3. Endpoint URL: `https://api.chamber.example.com/billing/webhook`
4. API version: Latest stable
5. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_action_required`
   - `invoice.paid`
   - `charge.dispute.created`
   - `checkout.session.completed`

6. Copy the **Signing Secret** and add to `.env.hybrid`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

7. Restart the API container:

```bash
docker compose -f docker-compose.hybrid.yml restart api
```

## Step 7: Monitor and Maintain

### 7.1 View Logs

```bash
# All services
docker compose -f docker-compose.hybrid.yml logs -f

# Specific service
docker compose -f docker-compose.hybrid.yml logs -f api

# Caddy (TLS)
docker compose -f docker-compose.hybrid.yml logs -f caddy
```

### 7.2 Manual Backup

```bash
./scripts/backup_hybrid_data.sh .env.hybrid
```

Output: `backups/firebase-data-YYYYMMDD-HHMMSS.tgz`

### 7.3 Daily Snapshot (Optional)

Add to crontab for automated snapshots:

```bash
# Get server ID from deployment
SERVER_ID=$(hcloud server list --format json | jq -r '.[] | select(.name=="chamberai-prod") | .id')

# Add to crontab (daily at 2am UTC)
(crontab -l 2>/dev/null; echo "0 2 * * * cd /opt/ChamberAI && HCLOUD_TOKEN=$HCLOUD_TOKEN SERVER_ID=$SERVER_ID ./scripts/hetzner_snapshot.sh >> /var/log/chamberai-snapshot.log 2>&1") | crontab -
```

### 7.4 Rollback Procedure

If deployment fails:

```bash
# Stop current stack
docker compose -f docker-compose.hybrid.yml down

# Checkout previous commit
git reset --hard HEAD~1

# Redeploy
./scripts/deploy_hybrid_vps.sh .env.hybrid
./scripts/verify_hybrid_stack.sh .env.hybrid
```

## Step 8: GitHub Actions CI/CD (Optional)

### 8.1 Add Secrets to GitHub

Go to **Settings → Secrets and variables → Actions**:

| Secret | Value |
|--------|-------|
| `HETZNER_HOST` | `192.0.2.100` |
| `HETZNER_USER` | `root` |
| `HETZNER_SSH_KEY` | Contents of `~/.ssh/id_rsa` (private key) |

### 8.2 Enable Auto-Deploy

The `.github/workflows/ci.yml` already includes a `deploy` job. On push to `main`:

1. CI/tests run
2. If passing, deploy job SSHs to VPS
3. Runs: `git pull && ./scripts/deploy_hybrid_vps.sh && ./scripts/verify_hybrid_stack.sh`
4. On failure, automatically rolls back

## Troubleshooting

### DNS Not Resolving

```bash
# Check DNS propagation
nslookup api.chamber.example.com 8.8.8.8

# Check A records
dig api.chamber.example.com

# Force refresh (some systems cache)
sudo systemctl restart systemd-resolved  # Linux
```

### TLS Certificate Not Issued

Caddy auto-renews via Let's Encrypt. Check logs:

```bash
docker compose -f docker-compose.hybrid.yml logs caddy
# Look for "acme" or "tls" errors
```

Common issues:
- **DNS not yet propagated** → Wait 5-10 minutes
- **Port 80 blocked** → Verify firewall allows HTTP
- **Rate limit** → Let's Encrypt has rate limits; wait 1 hour

### Services Failing to Start

```bash
# Check health
docker compose -f docker-compose.hybrid.yml ps

# View logs
docker compose -f docker-compose.hybrid.yml logs api
docker compose -f docker-compose.hybrid.yml logs worker
docker compose -f docker-compose.hybrid.yml logs firebase-emulators
```

### High Memory Usage

Check resource limits in `docker-compose.hybrid.yml`:
- API: 512M / 0.5 CPU
- Worker: 256M / 0.25 CPU
- Firebase: uncapped
- Console: 128M / 0.1 CPU

To adjust, edit `.env.hybrid` or docker-compose file and redeploy.

### Stripe Webhook Not Received

1. Verify webhook URL is accessible:
   ```bash
   curl https://api.chamber.example.com/billing/webhook
   # Should return 404 (no body) or validation error, not timeout
   ```

2. Check endpoint in Stripe Dashboard → Webhooks:
   - Correct URL?
   - Correct signing secret in `.env.hybrid`?

3. Send test webhook from Stripe:
   ```
   Developers → Webhooks → Select endpoint → Send test webhook
   ```

4. Check API logs for webhook processing:
   ```bash
   docker compose -f docker-compose.hybrid.yml logs api | grep -i webhook
   ```

## Cost Estimate (Monthly)

| Item | Cost |
|------|------|
| **Hetzner CPX31** | €12.90 |
| **Data transfer** (1TB/month) | €1.00 |
| **Backups** (included) | €0.00 |
| **Stripe processing** (2% revenue) | Variable |
| **Total Infrastructure** | ~€14/month |

## Production Checklist

- [x] VM provisioned on Hetzner (CPX31, EU-Central)
- [x] DNS A records configured (api.*, app.*)
- [x] Bootstrap script run (Docker, UFW, fail2ban)
- [x] `.env.hybrid` configured with all required values
- [x] Stack deployed and verified
- [x] Stripe webhook configured and tested
- [x] TLS certificate issued and auto-renewal configured
- [x] Backup cron job running
- [x] GitHub Actions secrets configured (optional)
- [x] Smoke tests passing

## Next Steps

1. **Stripe Products**: Create products/prices in Stripe Dashboard (if not done)
2. **Admin User**: First auth will bootstrap the admin from `AUTH_BOOTSTRAP_ADMINS`
3. **Custom Domain**: If you own the domain, update nameservers
4. **Monitoring**: Consider external monitoring (e.g., Uptime.com, Pingdom)
5. **Logs**: Set up log aggregation (e.g., Logtail, Datadog)

## Support

For issues:

1. Check logs: `docker compose -f docker-compose.hybrid.yml logs -f`
2. Verify health: `./scripts/verify_hybrid_stack.sh .env.hybrid`
3. Test connectivity: `curl -v https://api.chamber.example.com/health`
4. Review GitHub Issues: https://github.com/webemo-aaron/ChamberAI/issues

## Additional Resources

- **Hetzner Cloud Docs**: https://docs.hetzner.cloud/
- **Caddy TLS**: https://caddyserver.com/docs/json/apps/http/servers/
- **Firebase Emulator**: https://firebase.google.com/docs/emulator-suite
- **Docker Compose**: https://docs.docker.com/compose/reference/
