#!/usr/bin/env bash
#
# provision_hetzner.sh
#
# One-command Hetzner Cloud VM provisioning via hcloud CLI.
# Requires: hcloud CLI installed, HCLOUD_TOKEN env var set.
#
# Usage:
#   HCLOUD_TOKEN=xxx SSH_KEY_PATH=~/.ssh/id_rsa.pub ./scripts/provision_hetzner.sh
#
# Outputs:
#   - Server name, IP address, server ID to stdout
#   - Exits 1 on error

set -euo pipefail

# Configuration
SERVER_NAME="${SERVER_NAME:-chamberai-prod}"
SERVER_TYPE="${SERVER_TYPE:-cpx31}"  # cpx31 = 4 vCPU, 8GB RAM, 160GB SSD
LOCATION="${LOCATION:-nbg1}"
IMAGE="${IMAGE:-ubuntu-22.04}"
SSH_KEY_PATH="${SSH_KEY_PATH:-$HOME/.ssh/id_rsa.pub}"
FIREWALL_NAME="${FIREWALL_NAME:-chamberai-firewall}"

# Check prerequisites
if ! command -v hcloud &> /dev/null; then
  echo "ERROR: hcloud CLI not installed. Install from https://github.com/hetznercloud/cli"
  exit 1
fi

if [[ -z "${HCLOUD_TOKEN:-}" ]]; then
  echo "ERROR: HCLOUD_TOKEN not set. Export your Hetzner API token."
  exit 1
fi

if [[ ! -f "$SSH_KEY_PATH" ]]; then
  echo "ERROR: SSH public key not found at $SSH_KEY_PATH"
  exit 1
fi

echo "=== Provisioning Hetzner VM ==="
echo "Server: $SERVER_NAME"
echo "Type: $SERVER_TYPE"
echo "Location: $LOCATION"
echo "Image: $IMAGE"
echo "SSH Key: $SSH_KEY_PATH"

# Read SSH public key
SSH_KEY_CONTENT=$(cat "$SSH_KEY_PATH")

# Try to find existing chamberai SSH key
SSH_KEY_NAME=$(hcloud ssh-key list | grep chamberai | head -1 | awk '{print $2}')

if [[ -z "$SSH_KEY_NAME" ]]; then
  # No existing key, create a new one
  SSH_KEY_NAME="chamberai-$(date +%s)"
  echo "Creating new SSH key: $SSH_KEY_NAME"
  hcloud ssh-key create --name "$SSH_KEY_NAME" --public-key "$SSH_KEY_CONTENT" > /dev/null || {
    echo "ERROR: Failed to create SSH key"
    exit 1
  }
else
  echo "Using existing SSH key: $SSH_KEY_NAME"
fi

# Create firewall if it doesn't exist
FIREWALL_EXISTS=$(hcloud firewall list | grep "$FIREWALL_NAME" || true)
if [[ -z "$FIREWALL_EXISTS" ]]; then
  echo "Creating firewall: $FIREWALL_NAME"
  hcloud firewall create --name "$FIREWALL_NAME"
  # Allow SSH, HTTP, HTTPS (add rules one at a time with proper syntax)
  hcloud firewall add-rule "$FIREWALL_NAME" --direction in --source-ips 0.0.0.0/0 --protocol tcp --port 22
  hcloud firewall add-rule "$FIREWALL_NAME" --direction in --source-ips 0.0.0.0/0 --protocol tcp --port 80
  hcloud firewall add-rule "$FIREWALL_NAME" --direction in --source-ips 0.0.0.0/0 --protocol tcp --port 443
fi

# Create server
echo "Creating server: $SERVER_NAME"
SERVER_JSON=$(hcloud server create \
  --name "$SERVER_NAME" \
  --type "$SERVER_TYPE" \
  --image "$IMAGE" \
  --location "$LOCATION" \
  --ssh-key "$SSH_KEY_NAME")

# Parse server output (format varies by hcloud version)
# Try to extract ID and IP from text output
SERVER_ID=$(echo "$SERVER_JSON" | grep -oP "(?<=ID:\s)\d+" | head -1)
SERVER_IP=$(echo "$SERVER_JSON" | grep -oP "(?<=IPv4:\s)\d+\.\d+\.\d+\.\d+" | head -1)

# If parsing failed, try alternative method
if [[ -z "$SERVER_ID" || -z "$SERVER_IP" ]]; then
  echo "Server creation output:"
  echo "$SERVER_JSON"
  echo "ERROR: Could not parse server ID or IP from output"
  exit 1
fi

# Attach firewall
echo "Attaching firewall to server..."
hcloud firewall attach-to-server "$FIREWALL_NAME" "$SERVER_ID" || true

echo ""
echo "=== Provisioning Complete ==="
echo "Server ID: $SERVER_ID"
echo "Public IP: $SERVER_IP"
echo "SSH Command: ssh -i ~/.ssh/id_rsa root@$SERVER_IP"
echo ""
echo "Next steps:"
echo "1. Update your DNS records:"
echo "   api.YOUR_DOMAIN -> $SERVER_IP"
echo "   app.YOUR_DOMAIN -> $SERVER_IP"
echo "2. SSH to the server and run bootstrap:"
echo "   ssh -i ~/.ssh/id_rsa root@$SERVER_IP"
echo "   cd /opt/ChamberAI && sudo ./scripts/bootstrap_vps.sh"
echo "3. Copy .env.hybrid.example to .env.hybrid and fill in values"
echo "4. Run deploy: ./scripts/deploy_hybrid_vps.sh .env.hybrid"
echo "5. Verify: ./scripts/verify_hybrid_stack.sh .env.hybrid"

# Clean up temp SSH key from local hcloud (but not from server)
hcloud ssh-key delete "$SSH_KEY_NAME" > /dev/null || true

echo "Server IP: $SERVER_IP" >&2
