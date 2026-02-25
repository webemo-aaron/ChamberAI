#!/usr/bin/env bash
set -euo pipefail

# One-command VPS bootstrap for ChamberAI hybrid deployment.
# Installs Docker/Compose, UFW, fail2ban, and a nightly backup cron job.
#
# Usage:
#   sudo APP_DIR=/opt/chamberai SSH_PORT=22 BACKUP_TIME="0 3 * * *" ./scripts/bootstrap_vps.sh

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root (sudo)." >&2
  exit 1
fi

APP_DIR="${APP_DIR:-/opt/chamberai}"
SSH_PORT="${SSH_PORT:-22}"
BACKUP_TIME="${BACKUP_TIME:-0 3 * * *}"
BACKUP_KEEP="${BACKUP_KEEP:-14}"
DEPLOY_USER="${DEPLOY_USER:-${SUDO_USER:-$USER}}"

echo "== ChamberAI VPS bootstrap =="
echo "APP_DIR=${APP_DIR}"
echo "SSH_PORT=${SSH_PORT}"
echo "BACKUP_TIME=${BACKUP_TIME}"
echo "BACKUP_KEEP=${BACKUP_KEEP}"
echo "DEPLOY_USER=${DEPLOY_USER}"

echo "== Install base packages =="
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl gnupg lsb-release ufw fail2ban cron

echo "== Install Docker Engine + Compose plugin =="
install -m 0755 -d /etc/apt/keyrings
if [[ ! -f /etc/apt/keyrings/docker.gpg ]]; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
fi
if [[ ! -f /etc/apt/sources.list.d/docker.list ]]; then
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
fi
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker

if id -u "${DEPLOY_USER}" >/dev/null 2>&1; then
  usermod -aG docker "${DEPLOY_USER}" || true
fi

echo "== Configure firewall (UFW) =="
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow "${SSH_PORT}/tcp"
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status verbose

echo "== Configure fail2ban =="
cat >/etc/fail2ban/jail.d/chamberai.local <<'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = systemd
EOF
systemctl enable --now fail2ban
fail2ban-client status sshd || true

echo "== Ensure backup cron =="
mkdir -p /etc/cron.d
cat >/etc/cron.d/chamberai-backup <<EOF
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
KEEP_BACKUPS=${BACKUP_KEEP}
${BACKUP_TIME} root cd ${APP_DIR} && ./scripts/backup_hybrid_data.sh .env.hybrid >> /var/log/chamberai-backup.log 2>&1
EOF
chmod 0644 /etc/cron.d/chamberai-backup
systemctl enable --now cron

echo "== Bootstrap complete =="
echo "Next steps:"
echo "1. Clone repo into ${APP_DIR}"
echo "2. cp .env.hybrid.example .env.hybrid && edit values"
echo "3. ./scripts/deploy_hybrid_vps.sh .env.hybrid"
echo "4. ./scripts/verify_hybrid_stack.sh .env.hybrid"
echo "5. Re-login shell for docker group changes (if needed)"
