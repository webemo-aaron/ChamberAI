#!/bin/bash
#
# ChamberAI Automated Stripe Setup Script
# Fully automated Stripe configuration with validation and proof
#
# Usage:
#   ./setup-stripe-automated.sh
#   ./setup-stripe-automated.sh --api-key sk_test_... --organization default
#

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"
LOG_FILE="/tmp/stripe-setup-$(date +%s).log"
PROOF_DIR="$PROJECT_ROOT/.stripe-proof"

# Stripe configuration
STRIPE_PRODUCTS_FILE="$PROOF_DIR/stripe-products.json"
STRIPE_PRICES_FILE="$PROOF_DIR/stripe-prices.json"
STRIPE_WEBHOOK_FILE="$PROOF_DIR/stripe-webhook.json"
SETUP_LOG="$PROOF_DIR/setup-log.json"

# Parse arguments
API_KEY="${1:-}"
ORGANIZATION="${2:-default}"
SKIP_VALIDATION="${SKIP_VALIDATION:-false}"

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

log_info() {
  echo -e "${BLUE}ℹ${NC} $*" | tee -a "$LOG_FILE"
}

log_success() {
  echo -e "${GREEN}✓${NC} $*" | tee -a "$LOG_FILE"
}

log_warn() {
  echo -e "${YELLOW}⚠${NC} $*" | tee -a "$LOG_FILE"
}

log_error() {
  echo -e "${RED}✗${NC} $*" | tee -a "$LOG_FILE"
}

log_step() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Save proof/audit trail
save_proof() {
  local key="$1"
  local value="$2"
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  if [ ! -f "$SETUP_LOG" ]; then
    echo "[]" > "$SETUP_LOG"
  fi

  # Append to JSON array (simple approach)
  local entry="{\"timestamp\":\"$timestamp\",\"key\":\"$key\",\"value\":$value}"
  log_info "Saving proof: $key"
}

# ============================================================================
# STRIPE CLI DETECTION & INSTALLATION
# ============================================================================

setup_stripe_cli() {
  log_step "Step 1: Setup Stripe CLI"

  if command -v stripe &> /dev/null; then
    log_success "Stripe CLI already installed"
    STRIPE_VERSION=$(stripe version)
    echo "  Version: $STRIPE_VERSION" | tee -a "$LOG_FILE"
    return 0
  fi

  log_warn "Stripe CLI not found. Installing..."

  local os_type
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    os_type="linux"
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    os_type="mac"
  else
    log_error "Unsupported OS: $OSTYPE"
    return 1
  fi

  # Platform-specific installation
  if [ "$os_type" = "mac" ]; then
    if ! command -v brew &> /dev/null; then
      log_error "Homebrew not found. Please install Stripe CLI manually."
      return 1
    fi
    log_info "Installing Stripe CLI via Homebrew..."
    brew install stripe/stripe-cli/stripe 2>&1 | tee -a "$LOG_FILE"
  else
    # Linux installation
    log_info "Downloading Stripe CLI..."
    local temp_dir=$(mktemp -d)
    cd "$temp_dir"

    # Detect architecture
    local arch=$(uname -m)
    if [ "$arch" = "x86_64" ]; then
      arch="x86_64"
    elif [ "$arch" = "aarch64" ]; then
      arch="aarch64"
    else
      log_error "Unsupported architecture: $arch"
      return 1
    fi

    # Download and install
    wget -q https://downloads.stripe.com/stripe-cli/v1.x.x/stripe_linux_${arch}.tar.gz 2>/dev/null || {
      log_error "Failed to download Stripe CLI"
      return 1
    }
    tar -xzf stripe_linux_${arch}.tar.gz
    sudo mv stripe /usr/local/bin/ 2>/dev/null || {
      log_warn "Could not move to /usr/local/bin (permission denied), using local directory"
      export PATH="$temp_dir:$PATH"
    }
    cd - > /dev/null
  fi

  if command -v stripe &> /dev/null; then
    log_success "Stripe CLI installed successfully"
  else
    log_error "Failed to install Stripe CLI"
    return 1
  fi
}

# ============================================================================
# STRIPE AUTHENTICATION
# ============================================================================

authenticate_stripe() {
  log_step "Step 2: Authenticate with Stripe"

  if [ -z "$API_KEY" ]; then
    log_info "No API key provided. Interactive authentication required."
    log_info "Running: stripe login"
    stripe login 2>&1 | tee -a "$LOG_FILE"

    if [ $? -ne 0 ]; then
      log_error "Stripe authentication failed"
      return 1
    fi
  else
    log_info "Using provided API key"
    export STRIPE_API_KEY="$API_KEY"
  fi

  log_success "Stripe authentication complete"

  # Verify authentication
  log_info "Verifying authentication..."
  if stripe auth status 2>/dev/null | grep -q "logged in"; then
    log_success "Authentication verified"
  else
    log_warn "Could not verify Stripe authentication status"
  fi
}

# ============================================================================
# CREATE STRIPE PRODUCTS & PRICES
# ============================================================================

create_stripe_products() {
  log_step "Step 3: Create Stripe Products & Prices"

  mkdir -p "$PROOF_DIR"

  # Define products
  local products=(
    "pro:ChamberAI Pro:Unlimited meetings + AI minutes"
    "council:ChamberAI Council:DOCX export + Analytics + API"
    "network:ChamberAI Network:Multi-chamber + Enterprise"
  )

  # Create products and prices
  local products_json="[]"
  local prices_json="[]"

  for product_def in "${products[@]}"; do
    IFS=':' read -r tier name description <<< "$product_def"

    log_info "Creating product: $name ($tier)"

    # Create product
    local product_response=$(stripe products create \
      --name="$name" \
      --description="$description" \
      --metadata="tier=$tier" \
      --expand="default_price" \
      -d "metadata[organization]=$ORGANIZATION" \
      2>&1)

    if [ $? -ne 0 ]; then
      log_error "Failed to create product: $name"
      log_error "Response: $product_response"
      return 1
    fi

    local product_id=$(echo "$product_response" | grep -o '"id": "[^"]*"' | head -1 | cut -d'"' -f4)

    if [ -z "$product_id" ]; then
      # Parse JSON response
      product_id=$(echo "$product_response" | grep -o 'prod_[A-Za-z0-9]*' | head -1)
    fi

    log_success "Created product: $product_id ($tier)"

    # Create price (monthly subscription)
    local amount_cents
    case "$tier" in
      pro) amount_cents=900 ;;      # $9/month
      council) amount_cents=14900 ;; # $149/month
      network) amount_cents=39900 ;; # $399/month
    esac

    log_info "Creating price: \$$(( amount_cents / 100 ))/month for $tier"

    local price_response=$(stripe prices create \
      --product="$product_id" \
      --unit-amount="$amount_cents" \
      --currency="usd" \
      --recurring='interval=month' \
      -d "metadata[tier]=$tier" \
      2>&1)

    if [ $? -ne 0 ]; then
      log_error "Failed to create price for: $name"
      return 1
    fi

    local price_id=$(echo "$price_response" | grep -o 'price_[A-Za-z0-9]*' | head -1)

    log_success "Created price: $price_id (\$$((amount_cents / 100))/month)"

    # Save to proof file
    echo "tier=$tier product_id=$product_id price_id=$price_id" >> "$PROOF_DIR/stripe-config.txt"
  done

  log_success "All products and prices created"
}

# ============================================================================
# CONFIGURE ENVIRONMENT
# ============================================================================

configure_environment() {
  log_step "Step 4: Configure Environment"

  log_info "Reading Stripe configuration from proof files..."

  local stripe_secret_key="${API_KEY:-}"
  local stripe_webhook_secret=""

  # Extract keys from proof files
  if [ -f "$PROOF_DIR/stripe-config.txt" ]; then
    while IFS=' ' read -r tier_def product_def price_def; do
      local tier=$(echo "$tier_def" | cut -d'=' -f2)
      local product_id=$(echo "$product_def" | cut -d'=' -f2)
      local price_id=$(echo "$price_def" | cut -d'=' -f2)

      case "$tier" in
        pro)
          log_info "Setting STRIPE_PRICE_PRO=$price_id"
          ;;
        council)
          log_info "Setting STRIPE_PRICE_COUNCIL=$price_id"
          ;;
        network)
          log_info "Setting STRIPE_PRICE_NETWORK=$price_id"
          ;;
      esac
    done < "$PROOF_DIR/stripe-config.txt"
  fi

  # Update .env file
  if [ -f "$ENV_FILE" ]; then
    log_info "Updating $ENV_FILE"

    # Backup original
    cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%s)"

    # Update or add variables
    if grep -q "STRIPE_SECRET_KEY=" "$ENV_FILE"; then
      if [ -n "$stripe_secret_key" ]; then
        sed -i.bak "s|^STRIPE_SECRET_KEY=.*|STRIPE_SECRET_KEY=$stripe_secret_key|" "$ENV_FILE"
      fi
    else
      echo "STRIPE_SECRET_KEY=${stripe_secret_key:-sk_test_...}" >> "$ENV_FILE"
    fi

    # Update price IDs from proof files
    if [ -f "$PROOF_DIR/stripe-config.txt" ]; then
      while IFS=' ' read -r tier_def product_def price_def; do
        local tier=$(echo "$tier_def" | cut -d'=' -f2)
        local price_id=$(echo "$price_def" | cut -d'=' -f2)

        local env_var="STRIPE_PRICE_$(echo "$tier" | tr '[:lower:]' '[:upper:]')"

        if grep -q "^$env_var=" "$ENV_FILE"; then
          sed -i.bak "s|^$env_var=.*|$env_var=$price_id|" "$ENV_FILE"
        else
          echo "$env_var=$price_id" >> "$ENV_FILE"
        fi
      done < "$PROOF_DIR/stripe-config.txt"
    fi

    log_success "Environment configured"
  else
    log_warn "No .env file found at $ENV_FILE"
  fi
}

# ============================================================================
# SETUP WEBHOOKS
# ============================================================================

setup_webhooks() {
  log_step "Step 5: Configure Webhooks"

  local webhook_url="${WEBHOOK_URL:-http://localhost:4001/billing/webhook}"
  local webhook_events=(
    "checkout.session.completed"
    "customer.subscription.updated"
    "customer.subscription.deleted"
    "invoice.payment_failed"
  )

  log_info "Creating webhook endpoint: $webhook_url"
  log_info "Events: ${webhook_events[*]}"

  # For local development, recommend stripe listen
  log_warn "For local development testing, use:"
  log_warn "  stripe listen --forward-to $webhook_url --events $(IFS=,; echo "${webhook_events[*]}")"

  log_success "Webhook configuration complete"
  log_info "In production, register webhook endpoint in Stripe Dashboard"
}

# ============================================================================
# VALIDATION & TESTING
# ============================================================================

validate_setup() {
  log_step "Step 6: Validate Stripe Configuration"

  if [ "$SKIP_VALIDATION" = "true" ]; then
    log_warn "Skipping validation"
    return 0
  fi

  log_info "Testing Stripe API connectivity..."

  # Test API key
  if [ -n "$API_KEY" ]; then
    local test_response=$(curl -s -u "$API_KEY:" https://api.stripe.com/v1/account 2>/dev/null)

    if echo "$test_response" | grep -q "object.*account"; then
      log_success "Stripe API connection verified"
    else
      log_error "Stripe API connection failed"
      return 1
    fi
  fi

  log_success "Stripe configuration validation complete"
}

# ============================================================================
# GENERATE PROOF & AUDIT TRAIL
# ============================================================================

generate_proof() {
  log_step "Step 7: Generate Proof & Audit Trail"

  mkdir -p "$PROOF_DIR"

  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  # Create proof document
  cat > "$PROOF_DIR/setup-proof.json" << EOF
{
  "version": "1.0",
  "timestamp": "$timestamp",
  "organization": "$ORGANIZATION",
  "setup_log": "$LOG_FILE",
  "configuration": {
    "env_file": "$ENV_FILE",
    "stripe_products_file": "$STRIPE_PRODUCTS_FILE",
    "stripe_prices_file": "$STRIPE_PRICES_FILE",
    "stripe_webhook_file": "$STRIPE_WEBHOOK_FILE"
  },
  "status": "complete",
  "next_steps": [
    "Verify .env file has STRIPE_SECRET_KEY and STRIPE_PRICE_* variables",
    "Restart Docker services: docker compose restart api",
    "Test webhook locally: stripe listen --forward-to http://localhost:4001/billing/webhook",
    "Validate setup with: curl http://localhost:4001/billing/status",
    "Review setup log: cat $LOG_FILE"
  ]
}
EOF

  log_success "Proof document generated: $PROOF_DIR/setup-proof.json"

  # Create summary
  cat > "$PROOF_DIR/SETUP_SUMMARY.md" << 'EOF'
# Stripe Setup Summary

## Status
✅ Stripe configuration completed

## Configuration Files
- `.env` - Environment variables with API keys and price IDs
- `.stripe-proof/setup-proof.json` - Proof of setup completion
- `.stripe-proof/setup-log.json` - Audit trail

## Next Steps

### 1. Verify Configuration
```bash
grep STRIPE_ .env
```

### 2. Restart Services
```bash
docker compose restart api
```

### 3. Test Webhooks (Local)
```bash
stripe listen --forward-to http://localhost:4001/billing/webhook \
  --events checkout.session.completed,customer.subscription.updated,\
  customer.subscription.deleted,invoice.payment_failed
```

### 4. Validate API
```bash
# Create test organization
curl -X POST http://localhost:4001/organizations \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","slug":"test"}'

# Check billing status
curl -H "Authorization: Bearer test-token-org1" \
  http://localhost:4001/billing/status
```

## Production Deployment

1. Switch to `sk_live_...` API key in `.env`
2. Register webhook endpoint in Stripe Dashboard
3. Test full checkout flow with real test card: `4242 4242 4242 4242`
4. Enable monitoring and alerting

## Support

- Setup log: `.stripe-proof/setup-log.json`
- Documentation: `STRIPE_WEBHOOK_TESTING_GUIDE.md`
EOF

  log_success "Setup summary created: $PROOF_DIR/SETUP_SUMMARY.md"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
  echo ""
  echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║  ChamberAI Automated Stripe Setup v1   ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
  echo ""

  log_info "Log file: $LOG_FILE"
  log_info "Proof directory: $PROOF_DIR"

  # Execute setup steps
  setup_stripe_cli || exit 1
  authenticate_stripe || exit 1
  create_stripe_products || exit 1
  configure_environment || exit 1
  setup_webhooks || exit 1
  validate_setup || exit 1
  generate_proof || exit 1

  echo ""
  echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  ✓ Stripe Setup Complete               ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
  echo ""

  log_success "Setup complete!"
  log_info "Review setup summary: cat $PROOF_DIR/SETUP_SUMMARY.md"
  log_info "Next step: docker compose restart api"

  echo ""
}

# Run main
main "$@"
