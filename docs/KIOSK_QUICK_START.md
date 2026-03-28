# AI Kiosk Quick Start Guide

Get the kiosk up and running in 5 minutes.

## Prerequisites

- ChamberAI API running (http://localhost:4000)
- Firebase authentication configured
- Admin access to an organization

## Step 1: Configure the Kiosk (Admin Only)

```bash
# Get your Firebase token
TOKEN="your-firebase-id-token"

# Configure with Claude
curl -X POST http://localhost:4000/api/kiosk/config \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "privateModeEnabled": true,
    "aiProvider": {
      "type": "claude",
      "apiKey": "sk-proj-your-api-key",
      "model": "claude-3-5-sonnet-20241022"
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Kiosk configuration updated",
  "config": {
    "enabled": true,
    "privateModeEnabled": true,
    "aiProvider": { "type": "claude" }
  }
}
```

## Step 2: Verify Configuration

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/kiosk/config
```

Should return:
```json
{
  "enabled": true,
  "publicModeEnabled": false,
  "privateModeEnabled": true,
  "dataScope": "public",
  "aiProvider": {
    "type": "claude",
    "model": "claude-3-5-sonnet-20241022"
  }
}
```

## Step 3: Send Your First Message

```bash
curl -X POST http://localhost:4000/api/kiosk/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are my open action items?"
  }'
```

Expected response:
```json
{
  "response": "Based on your organization's data, here are your open action items:\n\n1. **Board Compliance Review**...",
  "followUps": [
    "Who has the most overdue items?",
    "What's the due date for the next item?"
  ],
  "tokensUsed": 287,
  "sources": {
    "actionItems": {
      "count": 5,
      "fields": ["title", "status", "assignee", "due_date"]
    }
  },
  "metadata": {
    "provider": "claude",
    "model": "claude-3-5-sonnet-20241022",
    "contextTokens": 2150,
    "dataScope": "public"
  }
}
```

## Common Questions

### Q: Which AI providers are supported?
**A**: Claude, OpenAI, and Custom HTTP endpoints. See Provider Configuration below.

### Q: Can I switch providers?
**A**: Yes, just POST to /api/kiosk/config with a new provider. Old API keys are automatically replaced.

### Q: How do I debug what data the AI sees?
**A**: Use the debug endpoint:
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:4000/api/kiosk/context
```

### Q: What's the rate limit?
**A**: 10 messages per minute per organization, 5 per IP address. Reset every 60 seconds.

### Q: How do I view conversation history?
**A**: Admin only:
```bash
curl -X POST http://localhost:4000/api/kiosk/history \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"limit": 20}'
```

### Q: Is my API key secure?
**A**: Yes, API keys are encrypted with AES-256-GCM before storage. Each organization uses a unique encryption key.

---

## Provider Configuration

### Claude (Anthropic)
```json
{
  "type": "claude",
  "apiKey": "sk-proj-...",
  "model": "claude-3-5-sonnet-20241022"
}
```
Get API key: https://console.anthropic.com

### OpenAI
```json
{
  "type": "openai",
  "apiKey": "sk-...",
  "model": "gpt-4o-mini"
}
```
Get API key: https://platform.openai.com/api-keys

### Custom Endpoint
```json
{
  "type": "custom",
  "endpoint": "http://your-server.com/api/chat",
  "authHeader": "Bearer your-custom-key"
}
```

---

## Troubleshooting

### "Kiosk not configured"
```bash
# Solution: Configure it first (see Step 1)
POST /api/kiosk/config with aiProvider details
```

### "Rate limit exceeded" (429)
```bash
# Solution: Wait 60 seconds, or check configuration
# GET /api/kiosk/config to see rateLimit settings
```

### "Payment required" (402)
```bash
# Solution: Upgrade to Pro tier
# https://docs.chamberai.com/billing
```

### "Invalid auth token"
```bash
# Solution: Get a fresh Firebase token
firebase auth:login
```

---

## Example Workflows

### Setup for Development
```bash
# 1. Start API server
cd services/api-firebase
npm install
npm start

# 2. Set token
export TOKEN="dev-test-token-from-firebase"

# 3. Configure with test endpoint
curl -X POST http://localhost:4000/api/kiosk/config \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "aiProvider": {
      "type": "custom",
      "endpoint": "http://localhost:3000/api/mock-chat"
    }
  }'

# 4. Test chat
curl -X POST http://localhost:4000/api/kiosk/chat \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message": "test"}'
```

### Integration Testing
```bash
# Run integration tests
cd services/api-firebase
node tests/kiosk-integration.test.js

# All 25 tests should pass
```

### Monitor Usage
```bash
# Check recent conversations
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:4000/api/kiosk/history \
  -d '{"limit": 100}'

# View context being used
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:4000/api/kiosk/context
```

---

## Next Steps

1. **Frontend Integration**: Build a chat UI component
2. **Custom Instructions**: Add chamber-specific AI personality
3. **Analytics**: Track usage patterns and costs
4. **Monitoring**: Set up error alerts and usage quotas

---

## Documentation

- **[KIOSK_IMPLEMENTATION.md](./KIOSK_IMPLEMENTATION.md)** - Full architecture and configuration
- **[KIOSK_API_REFERENCE.md](./KIOSK_API_REFERENCE.md)** - Complete API documentation
- **[../PHASE_9A_SUMMARY.md](../PHASE_9A_SUMMARY.md)** - Implementation summary

---

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review debug endpoint (/api/kiosk/context)
3. Check chat history (/api/kiosk/history)
4. Review server logs

---

**Last Updated**: 2026-03-28
**Status**: Production Ready
