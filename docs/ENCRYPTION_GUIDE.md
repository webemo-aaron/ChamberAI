# ChamberAI Field-Level Encryption Guide

## Overview

ChamberAI implements transparent field-level encryption for sensitive data at rest in Firestore.
This guide explains what is encrypted, how it works, and how to manage encryption keys.

---

## What Gets Encrypted

### Sensitive Fields (Encrypted)

These fields are automatically encrypted before being stored in Firestore:

1. **Meeting Minutes Content**
   - Field: `draftMinutes.content`
   - Why: Contains governance decisions, sensitive discussions, business strategy
   - Decrypted on: Read by authenticated users with secretary/admin role

2. **Kiosk Chat Messages**
   - Field: `kiosk_chats.message`
   - Why: User questions may contain sensitive business context
   - Decrypted on: Read by authenticated users with admin role

3. **Kiosk Chat Responses**
   - Field: `kiosk_chats.response`
   - Why: AI responses may reference sensitive org data, strategy, decisions
   - Decrypted on: Read by authenticated users with admin role

### Non-Encrypted Fields (Queryable Metadata)

These fields are stored **in plaintext** because they need to be queryable for:

- **Meeting metadata**: `date`, `status`, `attendance_count`, `tags`, `location`
- **Action items**: `status`, `due_date`, `owner_name` (needed for compliance queries, "OPEN" vs "COMPLETED" filters)
- **Org settings**: `subscription_tier`, `branding`, `kioskConfig`
- **Public listings**: `business_listings` (intentionally public)
- **User/org structure**: `memberships`, `organizations` (needed for org isolation queries)

---

## How Encryption Works

### Algorithm & Key Derivation

```
Algorithm: AES-256-GCM (authenticated encryption)
Key derivation: PBKDF2 with SHA-256
Iterations: 100,000 (prevents brute-force attacks)
Per-document: 64-byte random salt + 16-byte IV + AES-256-GCM auth tag
```

### Password Derivation

Each organization has its own encryption password derived from:

```javascript
password = `${orgId}-field-${process.env.ENCRYPTION_SEED}`;
```

Example: `org_123-field-your-secret-seed`

This ensures that:
- Each org's data is encrypted with a unique password
- The same plaintext encrypted for different orgs produces different ciphertexts
- Compromise of one org's data doesn't expose another org's plaintext

### Wire Format

Encrypted values are stored as base64-encoded blobs with prefix `enc:`:

```
enc:BASE64(salt[64] + iv[16] + ciphertext + authTag[16])
```

The `enc:` prefix allows automatic detection of encrypted vs plaintext values (for backwards compatibility).

---

## Backwards Compatibility

Documents written **before encryption was enabled** are stored as plaintext strings.

The `decryptField()` function handles both:

```javascript
// Reads encrypted value
const decrypted = decryptField("enc:abc123...", orgId);  // → plaintext

// Reads plaintext (old docs)
const plaintext = decryptField("old plaintext content", orgId);  // → same string

// Handles null/undefined
const result = decryptField(null, orgId);  // → null
```

This means:
- **No migration required** — old plaintext docs are readable as-is
- **Gradual rollout** — new writes are encrypted, reads are transparent
- **Zero downtime** — no data migration or restart needed

---

## Environment Configuration

### Required: `ENCRYPTION_SEED`

Set this in your `.env` file or Cloud Run secret:

```bash
ENCRYPTION_SEED="your-long-random-seed-at-least-32-chars"
```

**Generation:**

```bash
# On macOS / Linux
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Storage:**

For production, store in Google Cloud Secret Manager:

```bash
echo -n "$ENCRYPTION_SEED" | gcloud secrets create encryption-seed --data-file=-

# Grant Cloud Run access
gcloud secrets add-iam-policy-binding encryption-seed \
  --member=serviceAccount:chamberai-api@chamberai-prod.iam.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor

# Reference in Cloud Run deployment
gcloud run deploy chamberai-api \
  --set-secrets ENCRYPTION_SEED=encryption-seed:latest
```

### Optional: `ENCRYPTION_SEED` in Default Mode

If `ENCRYPTION_SEED` is not set:

```javascript
// Falls back to "default"
password = `${orgId}-field-default`;
```

This is **only safe for development/staging** — not recommended for production.

---

## Key Rotation Procedure

### Scenario: You need to rotate the encryption seed

**Why?** Annual security practice, suspected compromise, or key exposure.

### Steps:

1. **Create new seed**
   ```bash
   NEW_SEED=$(openssl rand -base64 32)
   echo "New seed: $NEW_SEED"
   ```

2. **Deploy with temporary fallback**

   Update `encryption.js` to try new seed first, then old seed on failure:
   ```javascript
   const seeds = [process.env.ENCRYPTION_SEED, process.env.OLD_ENCRYPTION_SEED];
   for (const seed of seeds) {
     const password = `${orgId}-field-${seed}`;
     try {
       return decrypted = decipher(ciphertext, password);
     } catch (e) {
       // Try next seed
     }
   }
   ```

3. **Deploy updated code to staging**
   - Test that old docs decrypt with old seed
   - Test that new docs decrypt with new seed

4. **Deploy to production**
   - Monitor: Check that decryption works
   - No data loss — old docs still readable with fallback seed

5. **Optional: Re-encrypt old documents**

   Run a batch job to decrypt with old seed, re-encrypt with new seed:
   ```javascript
   for (const meeting of oldMeetings) {
     const plaintext = decryptField(meeting.content, oldSeed);
     const reencrypted = encryptField(plaintext, newSeed, orgId);
     await update(meeting, { content: reencrypted });
   }
   ```

6. **Remove fallback seed**
   - Once all old docs are re-encrypted, remove `OLD_ENCRYPTION_SEED` from code
   - Verify: `git log` shows the rotation completed

---

## Emergency Decryption

### Scenario: You lost the `ENCRYPTION_SEED` and need to recover data

**Bad news:** If the seed is truly lost, the data **cannot be decrypted**.

This is intentional for security — the encryption prevents even the server operator from
reading encrypted data without the seed.

### Your options:

1. **From backup**
   - If you have a database backup from before encryption was enabled, restore from that
   - Otherwise, restore from point-in-time backup (Firestore supports 7-day point-in-time recovery)

2. **Accept data loss**
   - Encrypted meeting minutes and kiosk chats are unrecoverable
   - Org can resume with plaintext content going forward
   - Non-encrypted fields (dates, status, owners) are unaffected

3. **Disable encryption** (if you have an older seed)
   - If you remember the old seed, set it as `ENCRYPTION_SEED`
   - Redeploy and re-enable normal operations

### Prevention:

- **Store seed securely**: Use Google Cloud Secret Manager, HashiCorp Vault, or similar
- **Backup seed separately**: Keep a physical backup in a safe deposit box (encrypted)
- **Rotation schedule**: Rotate seed annually or after team membership changes
- **Audit log**: Track who accessed the seed (Cloud Audit Logs)

---

## Verification: Is Encryption Working?

### In Development (Firestore Emulator)

1. Start emulators:
   ```bash
   firebase emulators:start
   ```

2. Create a meeting with minutes:
   ```bash
   curl -X PUT http://localhost:4000/meetings/123/draft-minutes \
     -H "Content-Type: application/json" \
     -d '{"content": "SECRET: We are planning a merger"}'
   ```

3. Check Firestore Emulator UI (http://localhost:4000)
   - Navigate to `organizations/{orgId}/draftMinutes/{id}`
   - The `content` field should show `enc:...` (encrypted, not plaintext)

4. Read the minutes via API:
   ```bash
   curl http://localhost:4000/meetings/123/draft-minutes
   ```
   - Response should have decrypted content: `"content": "SECRET: We are planning a merger"`

### In Staging/Production

1. Check Cloud Logging:
   ```bash
   gcloud logging read "resource.type=cloud_run_revision AND jsonPayload.level=info" \
     --project=chamberai-prod \
     --limit=10
   ```
   - Look for: No errors about "Decryption failed"

2. Verify no decryption errors in Sentry:
   ```
   Sentry dashboard → Errors
   Search: "Decryption failed"
   Expected: 0 errors
   ```

3. Test end-to-end:
   - Create meeting with minutes via console
   - Export minutes (DOCX)
   - Verify exported content is readable (decrypted)

---

## Operational Checklist

### Before Going Live:

- [ ] `ENCRYPTION_SEED` set in `.env` or Secret Manager
- [ ] `ENCRYPTION_SEED` backed up in secure location
- [ ] Test: Create meeting, add minutes, verify encrypted in emulator UI
- [ ] Test: Read minutes via API, verify decrypted
- [ ] Test: Export minutes to DOCX, verify content is readable
- [ ] Staging deployment: All smoke tests passing
- [ ] Production: Monitor first 24 hours for decryption errors (Sentry)

### During Operations:

- [ ] Monthly: Verify `ENCRYPTION_SEED` value in Secret Manager
- [ ] Quarterly: Review Cloud Audit Logs for seed access
- [ ] Annually: Rotate `ENCRYPTION_SEED` (or on team changes)
- [ ] On error: Check `Decryption failed` errors in Sentry
  - If decryption fails, it returns null — check logs for context

### On Incident:

**If decryption is failing:**

1. Check `ENCRYPTION_SEED` is set: `gcloud secrets describe encryption-seed`
2. Verify seed value is correct (shouldn't show in logs, but check deployment config)
3. Check Cloud Run revision: Is it deployed with latest secret?
4. Restart Cloud Run: `gcloud run deploy chamberai-api --region=us-central1` (no code change, just redeploy)
5. If still failing: This indicates seed mismatch — check if seed was recently rotated

---

## Technical Details

### Decryption Failure Modes

If `decryptField(packed, orgId)` fails:
- Returns `null` instead of throwing
- Logs to console: `Decryption failed for org {orgId}: {error message}`
- Caller should handle null: `decryptField(...) ?? fallbackValue`

**Why null instead of exception?**
- Gracefully handles backwards compatibility (old plaintext docs)
- Doesn't crash the API on transient decryption errors
- Allows detection in logs: `"Decryption failed"` pattern

### Performance Impact

Encryption/decryption are local operations (no network):
- Encrypt: ~1ms (PBKDF2 is the cost, 100k iterations)
- Decrypt: ~1ms (same)
- Negligible impact on API latency

On cold start, Firestore connection is the bottleneck, not crypto.

---

## FAQ

**Q: Will encryption slow down the API?**
A: No. Encryption is <1ms, Firestore round-trip is ~50-100ms.

**Q: Can I encrypt specific fields for specific orgs?**
A: Currently, all sensitive fields are encrypted for all orgs with the same seed.
Future enhancement: per-org encryption keys (ENCRYPTION_SEED + org_random).

**Q: What if an attacker gets the ENCRYPTION_SEED?**
A: They can decrypt all org data. The seed is the crown jewel — protect it like production credentials.

**Q: Can I disable encryption?**
A: Yes. Change `encryptField()` to return plaintext unchanged. But existing encrypted docs
won't be readable until re-encrypted. Better to rotate the seed than disable.

**Q: Are database backups encrypted?**
A: No. Firestore backups are at-rest encrypted by GCP, but ChamberAI's field-level encryption
provides an additional layer for application-level security (defense in depth).

---

## References

- [RFC 3394: AES Key Wrap Algorithm](https://tools.ietf.org/html/rfc3394)
- [NIST SP 800-38D: GCM and GMAC](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf)
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html)
- [Google Cloud Secret Manager](https://cloud.google.com/secret-manager/docs)
