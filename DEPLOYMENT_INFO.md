# ChamberAI Deployment Info

**Date:** 2026-03-22
**Status:** Ready for Bootstrap

---

## Server Details

| Item | Value |
|------|-------|
| **Domain** | chamberai.mahoosuc.ai |
| **Server IP** | 46.224.10.3 |
| **Server ID** | 124460263 |
| **Type** | cx33 (4 vCPU, 8GB RAM, 80GB SSD) |
| **Location** | fsn1 (Falkenstein, Germany) |
| **OS** | Ubuntu 22.04 LTS |
| **Cost** | ~€6/month |

---

## DNS Configuration

**Already added to your DNS provider (mahoosuc.ai zone):**

```
api.chamberai    A    46.224.10.3
app.chamberai    A    46.224.10.3
```

**Full domains:**
- `api.chamberai.mahoosuc.ai`
- `app.chamberai.mahoosuc.ai`

---

## Quick Deploy Commands

### 1. SSH to Server
```bash
ssh -i ~/.ssh/id_rsa root@46.224.10.3
```

### 2. Bootstrap (inside SSH)
```bash
cd /opt
git clone https://github.com/YOUR_ORG/ChamberAI.git
cd ChamberAI
sudo ./scripts/bootstrap_vps.sh
```

### 3. Configure
```bash
cp .env.hybrid.example .env.hybrid
nano .env.hybrid
```

**Paste this config:**
```bash
# Public domains
API_DOMAIN=api.chamberai.mahoosuc.ai
APP_DOMAIN=app.chamberai.mahoosuc.ai
ACME_EMAIL=ops@mahoosuc.ai

# Frontend
CORS_ORIGIN=https://app.chamberai.mahoosuc.ai
APP_BASE_URL=https://app.chamberai.mahoosuc.ai
API_BASE=https://api.chamberai.mahoosuc.ai

# Stripe (get from https://dashboard.stripe.com)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_COUNCIL=price_...
STRIPE_PRICE_NETWORK=price_...

# Admin user
AUTH_BOOTSTRAP_ADMINS=YOUR_EMAIL@mahoosuc.ai

# Keep remaining values from .env.hybrid.example
```

### 4. Deploy
```bash
./scripts/deploy_hybrid_vps.sh .env.hybrid
./scripts/verify_hybrid_stack.sh .env.hybrid
```

### 5. Test
```bash
curl https://api.ChamberAI.mahoosuc.ai/health
curl https://app.ChamberAI.mahoosuc.ai
```

---

## Stripe Webhook Setup

**In Stripe Dashboard → Developers → Webhooks:**

- **Endpoint URL:** `https://api.chamberai.mahoosuc.ai/billing/webhook`
- **Events:** customer.subscription.*, invoice.*, checkout.session.completed, charge.dispute.created

---

## GitHub Actions (Optional Auto-Deploy)

**Settings → Secrets and variables → Actions:**

```
HETZNER_HOST     = 46.224.10.3
HETZNER_USER     = root
HETZNER_SSH_KEY  = (private key content from ~/.ssh/id_rsa)
```

Then push to `main` and it will auto-deploy! 🚀

---

## Support

- **Full Setup Guide:** `docs/HETZNER_SETUP.md`
- **Deployment Checklist:** `HETZNER_DEPLOYMENT_CHECKLIST.md`
- **Troubleshooting:** See HETZNER_SETUP.md § Troubleshooting

---

## Firewall Rules (Auto-configured)

- ✅ SSH (22)
- ✅ HTTP (80)
- ✅ HTTPS (443)

---

## Daily Backups (Optional)

After first deploy, add to crontab on server:

```bash
HCLOUD_TOKEN=$(grep "^HCLOUD_TOKEN=" ~/.env) SERVER_ID=124460263
0 2 * * * cd /opt/chamberai && ./scripts/hetzner_snapshot.sh
```

---

**Ready? Start with DNS configuration, then SSH to server and follow Quick Deploy Commands above.**
