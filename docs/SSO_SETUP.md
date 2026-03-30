# ChamberAI Enterprise SSO Setup Guide

This guide covers configuring Single Sign-On (SSO) for ChamberAI to authenticate users via SAML or OIDC providers including Google Workspace, Azure AD, and Okta.

## Overview

ChamberAI uses Firebase Authentication to handle SSO providers. When a user authenticates through an SSO provider, Firebase returns a custom JWT token with the SSO provider information. ChamberAI then:

1. Extracts the SSO provider claim from the token
2. Checks if the user's email domain is in the allowed list
3. Automatically provisions a membership record (JIT - Just-In-Time provisioning)
4. Assigns the default role configured for the org

**Architecture:**
```
SSO Provider (SAML/OIDC)
       ↓
Firebase Auth (mints JWT)
       ↓
ChamberAI API (auth.js extracts ssoProvider claim)
       ↓
JIT Provisioning: auto-create membership + audit log
```

## Prerequisites

- Firebase project with admin access
- Organization already set up in ChamberAI
- Admin role in ChamberAI for this organization

## Configuration Steps

### Step 1: Enable SSO Provider in Firebase Console

#### For Google Workspace (OIDC):

1. Go to Firebase Console → Authentication → Sign-in method
2. Click "Add new provider" → Google
3. Enable it and save
4. The provider ID in Firebase is `google.com`

In ChamberAI, use:
- **Provider:** `google_workspace`
- **OIDC Client ID:** Get from Google Cloud Console
- **OIDC Issuer:** `https://accounts.google.com`

#### For Azure AD (OIDC):

1. Go to Firebase Console → Authentication → Sign-in method
2. Click "Add new provider" → OIDC
3. Enter provider name: `azure_ad`
4. Fill in details from your Azure AD app registration:
   - **Client ID:** From Azure app registration
   - **Client secret:** From Azure app registration
   - **Discovery URL:** `https://login.microsoftonline.com/{tenant-id}/.well-known/openid-configuration`

In ChamberAI, use:
- **Provider:** `azure_ad`
- **OIDC Client ID:** From Azure
- **OIDC Client Secret:** From Azure
- **OIDC Issuer:** `https://login.microsoftonline.com/{tenant-id}/v2.0`

#### For Okta (OIDC):

1. Go to Firebase Console → Authentication → Sign-in method
2. Click "Add new provider" → OIDC
3. Enter provider name: `okta`
4. Fill in details from your Okta app:
   - **Client ID:** From Okta app
   - **Client secret:** From Okta app
   - **Discovery URL:** `https://{okta-domain}/.well-known/openid-configuration`

In ChamberAI, use:
- **Provider:** `okta`
- **OIDC Client ID:** From Okta
- **OIDC Client Secret:** From Okta
- **OIDC Issuer:** `https://{okta-domain}`

#### For Custom SAML:

1. Go to Firebase Console → Authentication → Sign-in method
2. Click "Add new provider" → SAML
3. Configure your SAML identity provider details:
   - **Entity ID:** Your org's SAML entity ID
   - **Single sign-on URL:** Your IdP's SSO endpoint
   - **X.509 Certificate:** Your IdP's public certificate (PEM format)

In ChamberAI, use:
- **Provider:** `saml_custom`
- **SAML Entity ID:** Your org's SAML entity ID
- **SAML SSO URL:** Your IdP's single sign-on URL
- **SAML Certificate:** Your IdP's X.509 certificate (PEM)

### Step 2: Configure SSO in ChamberAI

1. **Sign in as admin** to your organization
2. **Go to Settings** → (new) **SSO Configuration** tab
3. **Fill in the SSO form:**

| Field | Description | Example |
|-------|-------------|---------|
| Provider | SAML or OIDC provider type | `google_workspace`, `azure_ad`, `okta`, `saml_custom`, `oidc_custom` |
| Allowed Domains | Email domains eligible for auto-provisioning | `company.com`, `partner.org` (comma-separated or list) |
| Auto-Provision Role | Role assigned to new SSO users | `viewer`, `secretary` |
| Enabled | Toggle SSO on/off | checkbox |

For **OIDC providers**:
- **OIDC Client ID:** From your provider's app configuration
- **OIDC Client Secret:** From your provider's app configuration
- **OIDC Issuer:** Provider's issuer URL (e.g., `https://accounts.google.com`)

For **SAML providers**:
- **SAML Entity ID:** Unique identifier for your organization's SAML entity
- **SAML SSO URL:** Single sign-on endpoint URL
- **SAML Certificate:** X.509 certificate in PEM format

**Example Configuration:**
```json
{
  "provider": "google_workspace",
  "oidcClientId": "123456789.apps.googleusercontent.com",
  "oidcIssuer": "https://accounts.google.com",
  "allowedDomains": ["company.com", "contractors.company.com"],
  "autoProvisionRole": "secretary",
  "enabled": true
}
```

### Step 3: Test SSO Configuration

1. **In Settings → SSO Configuration**, click **"Test Connection"**
   - This validates your configuration without creating test users
   - Returns `ok: true` if all required fields are valid

2. **Test login in incognito/private window:**
   - Navigate to your ChamberAI login page
   - If SSO is enabled, you'll see an SSO button above Google Sign-In
   - Button text: "Continue with {Provider Name}"
   - Click it and authenticate with your SSO provider

3. **Verify auto-provisioning:**
   - After SSO login, user should be provisioned with configured role
   - Check Admin → Members to verify the new user was added
   - User's "source" should be marked as "sso"

### Step 4: Monitor SSO Activity

1. **View audit logs:**
   - Go to Settings → Audit Logs (or use API: `GET /api/export/audit-report`)
   - Filter by event type: `SSO_MEMBERSHIP_PROVISIONED`, `SSO_CONFIG_CHANGED`
   - Track who joined via SSO and when

2. **Export compliance report:**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     "https://yourorg.chamberai.com/api/export/audit-report?format=csv&eventType=SSO_MEMBERSHIP_PROVISIONED"
   ```

## Troubleshooting

### SSO button not showing on login page

**Problem:** User sees only Google Sign-In, no SSO button

**Solutions:**
1. Verify SSO is **enabled** in Settings (toggle = ON)
2. Verify **Provider** is set (not "disabled")
3. Clear browser cache and reload login page
4. Check browser console for errors: `GET /api/sso/status 403` means user not authenticated yet

### "User is not authorized for this chamber" on SSO login

**Problem:** User authenticates via SSO but gets 403 error

**Solutions:**
1. Verify user's email domain is in **Allowed Domains**
   - SSO only auto-provisions users with allowed email domains
   - Manually add users from other domains via Members page
2. Verify **Auto-Provision Role** is set to `viewer` or `secretary`
3. Check audit logs for `SSO_MEMBERSHIP_PROVISIONED` events
4. If missing, check browser console for JavaScript errors

### "OIDC configuration is invalid" when saving

**Problem:** Validation error when updating SSO settings

**Solutions:**
1. Verify **OIDC Client ID** is not empty
2. Verify **OIDC Issuer** is a valid HTTPS URL
3. Verify **Allowed Domains** is a non-empty array
4. For Google Workspace: issuer must be `https://accounts.google.com` exactly
5. For Azure AD: check tenant ID in issuer URL is correct

### "Connection test failed"

**Problem:** Test connection returns error

**Solutions:**
1. Verify all required fields are filled for your provider type
2. For SAML: ensure certificate is in valid PEM format
3. For OIDC: test that issuer URL is reachable and returns `.well-known/openid-configuration`
4. Check that credentials (client ID/secret) are correct and not expired

## Rollback / Disabling SSO

If SSO causes login issues:

1. **Quick disable:** Go to Settings → SSO Configuration → toggle **Enabled** OFF
2. **Full reset:** Delete the SSO config (admin API call):
   ```bash
   curl -X DELETE \
     -H "Authorization: Bearer YOUR_TOKEN" \
     "https://yourorg.chamberai.com/api/sso/config"
   ```
3. Users can still sign in via Google or demo access

**Note:** Disabling SSO does NOT delete provisioned users. They remain active members.

## JIT Provisioning Details

**What happens when a user authenticates via SSO:**

1. User clicks SSO button → redirected to provider
2. User authenticates with their credentials
3. Provider returns token to Firebase
4. Firebase validates and mints JWT with `firebase.sign_in_provider` claim
5. ChamberAI API (`auth.js`) receives JWT and:
   - Extracts `ssoProvider` from claims
   - Checks if user's email domain is in `allowedDomains`
   - If yes: creates membership document with:
     - `role`: configured `autoProvisionRole`
     - `source`: `"sso"`
     - `sso_provider`: provider name (e.g., "google.com")
   - Audit log: `SSO_MEMBERSHIP_PROVISIONED` event
6. User is logged in and can access organization

**Allowed Domains Matching:**
- Domain matching is **case-insensitive**
- User with email `john@Company.COM` matches allowed domain `company.com` ✓
- User with email `john@company.co.uk` does NOT match `company.com` ✗
- Wildcard domains not supported (must be exact match)

## API Reference

### Check SSO Status (Login Page)

```
GET /api/sso/status
Authorization: Bearer {idToken}

Response (if enabled):
{
  "enabled": true,
  "provider": "google_workspace",
  "orgId": "org_123"
}

Response (if disabled):
{
  "enabled": false,
  "provider": null
}
```

### Get SSO Configuration (Admin)

```
GET /api/sso/config
Authorization: Bearer {adminToken}

Response:
{
  "provider": "google_workspace",
  "oidcClientId": "...",
  "oidcIssuer": "...",
  "allowedDomains": ["company.com"],
  "autoProvisionRole": "secretary",
  "enabled": true,
  "hasCertificate": false,
  "hasClientSecret": false,
  "updatedAt": "2026-03-29T00:00:00.000Z",
  "updatedBy": "admin@company.com"
}

Note: samlCertificate and oidcClientSecret are never returned (secrets never exposed to client)
```

### Update SSO Configuration (Admin)

```
PATCH /api/sso/config
Authorization: Bearer {adminToken}

Request Body:
{
  "provider": "google_workspace",
  "oidcClientId": "123456789.apps.googleusercontent.com",
  "oidcClientSecret": "YOUR_CLIENT_SECRET",
  "oidcIssuer": "https://accounts.google.com",
  "allowedDomains": ["company.com", "partner.org"],
  "autoProvisionRole": "secretary",
  "enabled": true
}

Response: Updated config (with secrets stripped)
```

### Test Connection (Admin)

```
POST /api/sso/test-connection
Authorization: Bearer {adminToken}

Response (if valid):
{
  "ok": true,
  "message": "SSO configuration is valid",
  "provider": "google_workspace"
}

Response (if invalid):
{
  "ok": false,
  "error": "Invalid SSO configuration",
  "errors": ["oidcClientId is required for OIDC providers"]
}
```

### Export Audit Report (Admin)

```
GET /api/export/audit-report?eventType=SSO_MEMBERSHIP_PROVISIONED&format=csv
Authorization: Bearer {adminToken}

Response: CSV file with columns:
  timestamp,action,actor,meeting_id,details_summary
  2026-03-29T10:00:00Z,SSO_MEMBERSHIP_PROVISIONED,john@company.com,,{provider:google.com,role:secretary...}
```

## Security Considerations

1. **Secrets never in API responses:** SAML certificates and OIDC client secrets are stored in Firestore but never returned via GET API
2. **Audit logging:** All SSO config changes and user provisioning are logged to `audit_logs` collection
3. **Domain validation:** Only users with email domains in `allowedDomains` are auto-provisioned
4. **Role limitation:** JIT-provisioned users get the configured `autoProvisionRole` (not admin by default)
5. **Token verification:** Firebase `verifyIdToken()` validates token signature before JIT logic runs

## Support & FAQ

**Q: Can I have multiple SSO providers?**
A: No, one provider per organization. To switch providers, update the config to point to the new provider.

**Q: What happens to existing Google Sign-In users when I enable SSO?**
A: Existing users keep their accounts. New SSO users are provisioned as separate records. If email matches an existing user, they can use either auth method.

**Q: Can SSO users change their role?**
A: Yes, admins can manually change roles in Members page. JIT provisioning only sets initial role.

**Q: Is SSO available in the mobile app?**
A: Not yet. Mobile app currently supports Google Sign-In only.

**Q: How do I remove an SSO user?**
A: Go to Members → disable or delete the user. This does NOT disable their SSO account with the provider.

**Q: Can I require MFA for SSO users?**
A: Yes, configure MFA in your SSO provider (not in ChamberAI). When MFA is required, provider will enforce it before returning token to Firebase.
