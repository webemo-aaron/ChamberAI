# ChamberAI Hetzner Deployment Checklist

**Date:** 2026-03-22
**Status:** ✅ VM Provisioned & Ready for Bootstrap

---

## ✅ Completed

- [x] Hetzner Cloud VM provisioned
  - **Server ID:** 124460263
  - **Name:** chamberai-prod
  - **IP:** 46.224.10.3
  - **Type:** cx33 (4 vCPU, 8GB RAM, 80GB SSD)
  - **Location:** fsn1 (Falkenstein, Germany)
  - **OS:** Ubuntu 22.04 LTS
  - **Status:** Running

- [x] Firewall rules configured
  - Port 22 (SSH) ✓
  - Port 80 (HTTP) ✓
  - Port 443 (HTTPS) ✓

- [x] SSH key uploaded to Hetzner
  - Local key: `~/.ssh/id_rsa`
  - Hetzner key: `chamberai-1774193915`

- [x] Deployment scripts created
  - ✓ `scripts/provision_hetzner.sh`
  - ✓ `scripts/hetzner_snapshot.sh`
  - ✓ `scripts/remote_deploy.sh`
  - ✓ `docs/HETZNER_SETUP.md`

- [x] Docker Compose stack updated
  - ✓ Console service added (port 5173)
  - ✓ Caddy reverse proxy configured
  - ✓ All environment variables added

- [x] GitHub Actions CI/CD prepared
  - ✓ Deploy job added to workflow
  - ✓ Auto-rollback configured
  - ✓ Requires GitHub secrets

---

## ⏳ Pending (Next Steps)

### Step 1: Configure DNS (5 minutes)
**Who:** You (domain registrar)

1. Go to your domain registrar (GoDaddy, Cloudflare, Route53, etc.)
2. Add these A records:
   ```
   api.yourdomain.com    A    46.224.10.3
   app.yourdomain.com    A    46.224.10.3
   ```
3. Wait 5-10 minutes for DNS propagation
4. Verify with: `nslookup api.yourdomain.com`

**⚠️ Critical:** DNS must be configured BEFORE Caddy starts, or Let's Encrypt won't issue certificates.

---

### Step 2: Bootstrap the Server (10 minutes)
**Who:** You (local terminal)

```bash
# 1. SSH to the server
ssh -i ~/.ssh/id_rsa root@46.224.10.3

# 2. (Inside SSH) Clone the repo
cd /opt
git clone https://github.com/YOUR_ORG/ChamberAI.git
cd ChamberAI

# 3. Run bootstrap (installs Docker, fail2ban, firewall, backups)
sudo ./scripts/bootstrap_vps.sh

# 4. Verify Docker is working
docker --version
docker compose --version
```

---

### Step 3: Configure Environment (10 minutes)
**Who:** You (local terminal)

```bash
# Still SSH'd into the server

# 1. Create production env file
cp .env.hybrid.example .env.hybrid
chmod 600 .env.hybrid

# 2. Edit with your values
nano .env.hybrid
```

**Required values to fill in:**

```bash
# Your domain (from Step 1)
API_DOMAIN=api.yourdomain.com
APP_DOMAIN=app.yourdomain.com
ACME_EMAIL=ops@yourdomain.com

# Stripe (from https://dashboard.stripe.com)
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_PRO=price_xxxxx
STRIPE_PRICE_COUNCIL=price_xxxxx
STRIPE_PRICE_NETWORK=price_xxxxx

# First admin user
AUTH_BOOTSTRAP_ADMINS=admin@yourdomain.com

# Cors & redirects
CORS_ORIGIN=https://app.yourdomain.com
APP_BASE_URL=https://app.yourdomain.com
```

**Save file:** Ctrl+X, Y, Enter

---

### Step 4: Deploy the Stack (15 minutes)
**Who:** You (SSH terminal)

```bash
# Still in /opt/chamberai on the server

# 1. Deploy
./scripts/deploy_hybrid_vps.sh .env.hybrid

# This will:
# - Build Docker images (takes ~5 min first time)
# - Start Firebase emulator
# - Start API, Worker, Console services
# - Start Caddy (gets TLS cert from Let's Encrypt)

# 2. Verify deployment
./scripts/verify_hybrid_stack.sh .env.hybrid

# Expected output:
# ✓ API health check passed (200)
# ✓ Worker health check passed (200)
# ✓ Caddy TLS check passed
# ✓ Stack verification complete
```

If verification passes, move to Step 5. If it fails:
- Check logs: `docker compose -f docker-compose.hybrid.yml logs -f`
- Common issues: DNS not propagated, port conflicts, disk space

---

### Step 5: Configure Stripe Webhook (5 minutes)
**Who:** You (Stripe dashboard)

1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Click **Add an endpoint**
3. **Endpoint URL:** `https://api.yourdomain.com/billing/webhook`
4. **API version:** Latest
5. **Events to send:**
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_action_required`
   - `invoice.paid`
   - `charge.dispute.created`
   - `checkout.session.completed`
6. Create endpoint
7. Copy **Signing secret** (whsec_...)
8. Update on server:
   ```bash
   # SSH to server
   nano .env.hybrid
   # Update: STRIPE_WEBHOOK_SECRET=whsec_xxx
   # Restart: docker compose -f docker-compose.hybrid.yml restart api
   ```

---

### Step 6: Test the Deployment (5 minutes)
**Who:** You (local terminal)

```bash
# Still SSH'd into server (or from any terminal)

# Test API health
curl https://api.yourdomain.com/health
# Expected: {"ok":true}

# Test console frontend
curl https://app.yourdomain.com
# Expected: HTML response (200 OK)

# Check logs
docker compose -f docker-compose.hybrid.yml logs -f api

# Exit logs
Ctrl+C
```

---

### Step 7: Setup GitHub Actions (5 minutes)
**Who:** You (GitHub)

1. Go to your GitHub repo → **Settings → Secrets and variables → Actions**
2. Add these secrets:
   - **HETZNER_HOST** = `46.224.10.3`
   - **HETZNER_USER** = `root`
   - **HETZNER_SSH_KEY** = Contents of `~/.ssh/id_rsa` (private key)

3. Test by pushing to `main`:
   ```bash
   git add .
   git commit -m "chore: Add Hetzner deployment infrastructure"
   git push origin main
   ```
   - GitHub Actions will run CI tests
   - If passing, deploy job will SSH to server and deploy

---

### Step 8: Setup Daily Snapshots (2 minutes)
**Who:** You (SSH on server)

```bash
# SSH to server

# Get server ID (already available: 124460263)
SERVER_ID=$(hcloud server list | grep chamberai-prod | awk '{print $1}')

# Add to crontab for daily snapshots at 2am UTC
(crontab -l 2>/dev/null; echo "0 2 * * * cd /opt/chamberai && HCLOUD_TOKEN=$HCLOUD_TOKEN SERVER_ID=$SERVER_ID ./scripts/hetzner_snapshot.sh >> /var/log/chamberai-snapshot.log 2>&1") | crontab -

# Verify it's scheduled
crontab -l | grep snapshot
```

---

## 📊 Final Verification Checklist

After deployment, verify everything works:

- [ ] DNS resolves: `nslookup api.yourdomain.com` → 46.224.10.3
- [ ] API responds: `curl https://api.yourdomain.com/health` → 200
- [ ] Console loads: `curl https://app.yourdomain.com` → HTML
- [ ] TLS certificate valid: `curl -v https://api.yourdomain.com 2>&1 | grep "subject="`
- [ ] Services healthy: `docker compose -f docker-compose.hybrid.yml ps` → all UP
- [ ] Logs clean: `docker compose -f docker-compose.hybrid.yml logs api` → no errors
- [ ] Stripe webhook configured and tested in Stripe dashboard

---

## 📚 Documentation

- **Setup Guide:** `docs/HETZNER_SETUP.md` (300+ lines, comprehensive)
- **Troubleshooting:** See HETZNER_SETUP.md § Troubleshooting
- **Monitoring:** See docs/DEPLOYMENT_STATUS.md

---

## 🔒 Security Notes

✅ **Already Configured:**
- Firewall allows only 22, 80, 443
- TLS via Let's Encrypt (auto-renewal)
- SSH key authentication (no passwords)
- fail2ban installed (SSH brute-force protection)
- Docker uses user namespaces

**You should add:**
- Monitoring/alerting (Uptime.com, New Relic, etc.)
- Backup verification testing
- Log aggregation (Logtail, Datadog)
- Rate limiting on API (Nginx/HAProxy in front of Caddy)

---

## 💰 Costs

| Item | Cost/Month |
|------|-----------|
| cx33 server | €6.00 |
| Data transfer (if <20TB) | Included |
| Snapshots | Included |
| **Total** | **~€6.00** |

*Note: Stripe processing fees (2.9% + €0.30) vary by volume*

---

## 🚀 Current Status

```
┌──────────────────────────────┐
│   ✅ INFRASTRUCTURE READY    │
├──────────────────────────────┤
│ Hetzner VM:        ✅ Ready  │
│ Firewall:          ✅ Ready  │
│ SSH Access:        ✅ Ready  │
│ Scripts:           ✅ Ready  │
│ Docker Images:     ⏳ Pending │
│ TLS Certs:         ⏳ Pending │
│ Stripe Webhooks:   ⏳ Pending │
│ CI/CD Secrets:     ⏳ Pending │
│ Daily Snapshots:   ⏳ Pending │
└──────────────────────────────┘
```

---

## 📞 Support

If you encounter issues:

1. Check logs: `docker compose -f docker-compose.hybrid.yml logs -f`
2. Run health check: `./scripts/verify_hybrid_stack.sh .env.hybrid`
3. Review HETZNER_SETUP.md § Troubleshooting
4. Check GitHub Issues: https://github.com/YOUR_ORG/ChamberAI/issues

---

**Next:** Start with **Step 1: Configure DNS** ⬇️
