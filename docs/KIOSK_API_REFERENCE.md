# AI Kiosk API Reference

## Base URL
```
http://localhost:4000/api/kiosk
https://your-deployment.com/api/kiosk
```

## Authentication
All endpoints require Bearer token authentication (Firebase ID token).

```bash
curl -H "Authorization: Bearer {id_token}" \
     https://api.example.com/api/kiosk/chat
```

## Endpoints

### 1. POST /api/kiosk/chat
Main conversation endpoint. Send a message to the AI kiosk and receive a contextual response.

**Request**
```json
{
  "message": "What are my top priority action items?"
}
```

**Response** (200 OK)
```json
{
  "response": "Based on your organization's data, here are your open action items:\n\n1. **Board Compliance Review** (Status: Open, Due: 2026-04-15)\n   - Assigned to: Jane Smith\n   - Description: Complete annual compliance audit\n\n2. **Meeting Minutes Draft** (Status: In Progress, Due: 2026-04-08)\n   - Assigned to: John Doe\n   - Description: Draft minutes from March 25 meeting\n\n3. **Vendor Contract Review** (Status: Open, Due: 2026-04-22)\n   - Assigned to: Marketing Committee\n   - Description: Review and approve new marketing vendor contracts",
  "followUps": [
    "Who has the most overdue items?",
    "What are the upcoming meeting dates?",
    "Can you summarize recent motions?"
  ],
  "tokensUsed": 287,
  "sources": {
    "meetings": {
      "count": 3,
      "fields": ["title", "date", "attendees", "motions_count", "action_items_count"]
    },
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

**Error Responses**

400 Bad Request - Missing or invalid message
```json
{
  "error": "Invalid request",
  "message": "message field is required and must be non-empty"
}
```

402 Payment Required - Insufficient tier
```json
{
  "error": "Payment required",
  "feature": "kiosk",
  "tier_required": "pro",
  "current_tier": "free",
  "message": "AI Kiosk feature requires Pro tier or higher"
}
```

429 Too Many Requests - Rate limited
```json
{
  "error": "Rate limit exceeded",
  "limit": 10,
  "window": "60 seconds",
  "message": "Chamber rate limit: 10 requests per minute"
}
```

503 Service Unavailable - AI provider error
```json
{
  "error": "AI service error",
  "message": "Claude API error: Rate limit exceeded",
  "details": {
    "error": "Rate limit exceeded"
  }
}
```

---

### 2. GET /api/kiosk/config
Fetch kiosk configuration (sanitized, no sensitive keys).

**Request**
```bash
curl -H "Authorization: Bearer {id_token}" \
     https://api.example.com/api/kiosk/config
```

**Response** (200 OK)
```json
{
  "enabled": true,
  "publicModeEnabled": false,
  "privateModeEnabled": true,
  "dataScope": "public",
  "aiProvider": {
    "type": "claude",
    "model": "claude-3-5-sonnet-20241022"
  },
  "contextConfig": {
    "tokenLimit": 8000,
    "meetingsLimit": 5,
    "motionsLimit": 10,
    "actionItemsLimit": 10
  },
  "rateLimit": {
    "chamberMaxPerMinute": 10,
    "ipMaxPerMinute": 5
  }
}
```

**Error Responses**

402 Payment Required
```json
{
  "error": "Payment required",
  "message": "AI Kiosk feature requires Pro tier or higher"
}
```

---

### 3. POST /api/kiosk/config
Update kiosk configuration. **Admin only**.

**Request**
```json
{
  "enabled": true,
  "publicModeEnabled": false,
  "privateModeEnabled": true,
  "dataScope": "public",
  "aiProvider": {
    "type": "claude",
    "apiKey": "sk-proj-...",
    "model": "claude-3-5-sonnet-20241022",
    "temperature": 0.7,
    "maxTokens": 1024
  },
  "contextConfig": {
    "tokenLimit": 8000,
    "meetingsLimit": 5,
    "motionsLimit": 10,
    "actionItemsLimit": 10
  },
  "rateLimit": {
    "chamberMaxPerMinute": 10,
    "ipMaxPerMinute": 5
  }
}
```

**Response** (200 OK)
```json
{
  "success": true,
  "message": "Kiosk configuration updated",
  "config": {
    "enabled": true,
    "publicModeEnabled": false,
    "privateModeEnabled": true,
    "aiProvider": {
      "type": "claude"
    }
  }
}
```

**Error Responses**

400 Bad Request - Invalid config
```json
{
  "error": "Invalid aiProvider type",
  "message": "Provider type must be claude, openai, or custom"
}
```

403 Forbidden - Not admin
```json
{
  "error": "Forbidden",
  "message": "Only admins can update configuration"
}
```

500 Internal Server Error - Encryption failure
```json
{
  "error": "Configuration failed",
  "message": "Failed to encrypt API key"
}
```

---

### 4. GET /api/kiosk/context
View the context data being used for AI responses. **Admin debug endpoint**.

**Request**
```bash
curl -H "Authorization: Bearer {id_token}" \
     https://api.example.com/api/kiosk/context
```

**Response** (200 OK)
```json
{
  "context": "## Recent Meetings\n- Board Meeting (2026-03-28): 8 attendees, 3 motions, 5 action items\n- Finance Committee (2026-03-27): 4 attendees, 1 motion, 2 action items\n- Marketing Subcommittee (2026-03-26): 5 attendees, 0 motions, 3 action items\n\n## Recent Motions\n- Motion to approve FY2027 budget (approved): Yes=9, No=0 (2026-03-28)\n- Motion to hire new executive director (pending): Yes=6, No=2 (2026-03-28)\n- Motion to update bylaws section 4 (approved): Yes=8, No=1 (2026-03-25)\n\n## Open Action Items\n- Complete board compliance audit (Open): Assigned to Jane Smith, Due 2026-04-15\n- Draft meeting minutes (In Progress): Assigned to John Doe, Due 2026-04-08\n- Review vendor contracts (Open): Assigned to Marketing Committee, Due 2026-04-22\n",
  "estimatedTokens": 2150,
  "sources": {
    "meetings": {
      "count": 3,
      "fields": ["title", "date", "attendees", "motions_count", "action_items_count"]
    },
    "motions": {
      "count": 3,
      "fields": ["title", "status", "votes_yes", "votes_no", "timestamp"]
    },
    "actionItems": {
      "count": 3,
      "fields": ["title", "status", "assignee", "due_date"]
    }
  }
}
```

---

### 5. POST /api/kiosk/history
Fetch chat history. **Admin only**.

**Request**
```json
{
  "limit": 20,
  "offset": 0,
  "userId": "john@example.com"
}
```

**Parameters**
- `limit` (number, optional): Items per page. Default: 20. Max: 100.
- `offset` (number, optional): Pagination offset. Default: 0.
- `userId` (string, optional): Filter by user email.

**Response** (200 OK)
```json
{
  "chats": [
    {
      "id": "doc-id-123",
      "timestamp": "2026-03-28T14:32:15.123Z",
      "userId": "john@example.com",
      "userRole": "admin",
      "message": "What are my top priority action items?",
      "response": "Based on your organization's data, here are your open action items...",
      "tokensUsed": 287,
      "provider": "claude",
      "model": "claude-3-5-sonnet-20241022"
    },
    {
      "id": "doc-id-124",
      "timestamp": "2026-03-28T14:28:42.456Z",
      "userId": "jane@example.com",
      "userRole": "secretary",
      "message": "Summarize recent board decisions",
      "response": "Here are the key decisions from recent meetings...",
      "tokensUsed": 156,
      "provider": "claude",
      "model": "claude-3-5-sonnet-20241022"
    }
  ],
  "total": 150,
  "limit": 20,
  "offset": 0,
  "hasMore": true
}
```

---

## Provider Configuration Examples

### Claude (Anthropic)
```json
{
  "type": "claude",
  "apiKey": "sk-proj-...",
  "model": "claude-3-5-sonnet-20241022",
  "temperature": 0.7,
  "maxTokens": 1024
}
```

**Available Models:**
- `claude-3-5-sonnet-20241022` (recommended)
- `claude-3-opus-20250219`
- `claude-3-haiku-20250307`

### OpenAI
```json
{
  "type": "openai",
  "apiKey": "sk-...",
  "model": "gpt-4o-mini",
  "temperature": 0.7,
  "maxTokens": 1024
}
```

**Available Models:**
- `gpt-4o-mini` (recommended)
- `gpt-4o`
- `gpt-4-turbo`
- `gpt-3.5-turbo`

### Custom HTTP Endpoint
```json
{
  "type": "custom",
  "endpoint": "http://localhost:8080/api/chat",
  "authHeader": "Bearer custom-api-key",
  "temperature": 0.7,
  "maxTokens": 1024
}
```

**Custom endpoint must:**
- Accept POST requests
- Process JSON body: `{ message, context, systemPrompt, temperature, maxTokens }`
- Return JSON: `{ response, tokensUsed, metadata }`

---

## Rate Limiting

Default limits:
- **Per Chamber**: 10 requests per minute
- **Per IP**: 5 requests per minute
- **Time Window**: 60 seconds

Rate limit reset behavior:
- Timestamps older than 60 seconds are automatically removed
- Limits reset every 60 seconds
- Counters are kept in-memory (not persisted)

**Rate Limit Headers** (future enhancement)
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1711615935
```

---

## Data Privacy & Security

### Message Sanitization
All user messages are automatically sanitized to remove:
- Email addresses → `[EMAIL]`
- Phone numbers → `[PHONE]`
- Social Security numbers → `[SSN]`
- Credit card numbers → `[CARD]`
- API keys → `[SECRET]`

### Encryption
- API keys stored encrypted (AES-256-GCM)
- Each organization uses unique encryption key
- Encryption seed: `{orgId}-kiosk-{ENCRYPTION_SEED}`

### Audit Logging
All kiosk configuration changes are logged:
- Action: `kiosk_config_updated`
- Timestamp and actor email captured
- Provider type logged for compliance

---

## Example Workflows

### Setup Kiosk with Claude
```bash
# 1. Get admin token
TOKEN="..."

# 2. Configure kiosk with Claude
curl -X POST https://api.example.com/api/kiosk/config \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "privateModeEnabled": true,
    "aiProvider": {
      "type": "claude",
      "apiKey": "sk-proj-...",
      "model": "claude-3-5-sonnet-20241022"
    }
  }'

# 3. Test with a chat message
curl -X POST https://api.example.com/api/kiosk/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "What are my open action items?"}'
```

### Monitor Usage
```bash
# 1. Get recent chat history
curl https://api.example.com/api/kiosk/history \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"limit": 50}'

# 2. Check context being used
curl https://api.example.com/api/kiosk/context \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 3. Review configuration
curl https://api.example.com/api/kiosk/config \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 400 | Bad Request | Invalid request format or missing required fields |
| 402 | Payment Required | Insufficient subscription tier |
| 403 | Forbidden | Insufficient permissions (e.g., not admin) |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error (check logs) |
| 503 | Service Unavailable | AI provider unavailable or error |

---

## Best Practices

1. **Message Clarity** - Use specific, concise questions
   ```
   ✓ "What are open action items assigned to John?"
   ✗ "Tell me stuff"
   ```

2. **Follow-ups** - The response includes suggested follow-up questions
   ```json
   "followUps": ["Who has overdue items?", "What's the timeline?"]
   ```

3. **Check Context** - Use debug endpoint to verify data
   ```bash
   curl /api/kiosk/context
   ```

4. **Monitor Rate Limits** - Implement retry logic with backoff
   ```javascript
   if (response.status === 429) {
     await sleep(60000);  // Wait 60 seconds
     retry();
   }
   ```

5. **Audit Trail** - Review history regularly
   ```bash
   curl /api/kiosk/history?limit=100
   ```

---

## Changelog

### v1.0.0 (2026-03-28)
- Initial release
- Claude, OpenAI, Custom providers
- AES-256-GCM encryption
- Rate limiting and tier gating
- Audit logging
- Public/private data scopes

---

**Last Updated**: 2026-03-28
**API Version**: v1
**Status**: Stable
