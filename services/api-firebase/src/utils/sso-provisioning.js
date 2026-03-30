/**
 * Just-In-Time (JIT) provisioning utilities for SSO users
 * Automatically creates membership records for users authenticating via SSO
 */

import { initFirestore, serverTimestamp } from "../db/firestore.js";
import { orgCollection } from "../db/orgFirestore.js";

const ssoConfigCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Check if an email should be auto-provisioned based on allowed domains
 * @param {string} email - User email address
 * @param {array} allowedDomains - List of allowed email domains
 * @returns {boolean} - True if email domain is in allowed list
 */
export function shouldAutoProvision(email, allowedDomains = []) {
  if (!email || !allowedDomains || allowedDomains.length === 0) {
    return false;
  }

  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;

  return allowedDomains.some(
    (allowed) => allowed.toLowerCase() === domain
  );
}

/**
 * Provision a new SSO user as an organization member
 * @param {object} db - Firestore instance
 * @param {string} orgId - Organization ID
 * @param {string} email - User email address
 * @param {string} role - Role to assign ("viewer" or "secretary")
 * @param {string} provider - SSO provider name (e.g., "google.com", "saml.my-org")
 * @returns {Promise<object>} - Created membership document
 */
export async function provisionSsoMember(db, orgId, email, role, provider) {
  const membershipId = email.split("@")[0];
  const membersCollection = orgCollection(db, orgId, "memberships");
  const membershipRef = membersCollection.doc(membershipId);

  const membership = {
    email,
    role,
    source: "sso",
    sso_provider: provider,
    provisioned_at: serverTimestamp(),
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  };

  await membershipRef.set(membership, { merge: false });

  // Audit log for provisioning event
  await orgCollection(db, orgId, "audit_logs").add({
    action: "SSO_MEMBERSHIP_PROVISIONED",
    actor: email,
    timestamp: serverTimestamp(),
    details: {
      provider,
      role,
      domain: email.split("@")[1]
    }
  });

  return membership;
}

/**
 * Get SSO configuration for an organization (with caching)
 * @param {object} db - Firestore instance
 * @param {string} orgId - Organization ID
 * @returns {Promise<object|null>} - SSO config or null if not configured
 */
export async function getSsoConfig(db, orgId) {
  const cacheKey = `sso-config-${orgId}`;
  const cached = ssoConfigCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const settingsDoc = await orgCollection(db, orgId, "settings").doc("sso").get();
    const config = settingsDoc.exists ? settingsDoc.data() : null;

    ssoConfigCache.set(cacheKey, {
      data: config,
      timestamp: Date.now()
    });

    return config;
  } catch (error) {
    console.error(`Failed to get SSO config for org ${orgId}:`, error);
    return null;
  }
}

/**
 * Clear SSO config cache (useful after updates)
 * @param {string} orgId - Organization ID (if not provided, clears all)
 */
export function clearSsoConfigCache(orgId) {
  if (orgId) {
    ssoConfigCache.delete(`sso-config-${orgId}`);
  } else {
    ssoConfigCache.clear();
  }
}

/**
 * Validate SSO configuration against provider
 * Note: Actual provider validation would require provider-specific SDK calls
 * This is a placeholder for extensibility
 * @param {object} config - SSO configuration
 * @param {object} db - Firestore instance
 * @returns {Promise<object>} - Validation result
 */
export async function validateSsoConfig(config, db) {
  const result = {
    valid: false,
    errors: []
  };

  if (!config.provider) {
    result.errors.push("provider is required");
  }

  if (config.provider === "google_workspace" || config.provider === "oidc_custom") {
    if (!config.oidcClientId) {
      result.errors.push("oidcClientId is required for OIDC providers");
    }
    if (!config.oidcIssuer) {
      result.errors.push("oidcIssuer is required for OIDC providers");
    }
  }

  if (config.provider === "azure_ad" || config.provider === "saml_custom") {
    if (!config.samlSsoUrl) {
      result.errors.push("samlSsoUrl is required for SAML providers");
    }
    if (!config.samlCertificate) {
      result.errors.push("samlCertificate is required for SAML providers");
    }
  }

  if (!Array.isArray(config.allowedDomains) || config.allowedDomains.length === 0) {
    result.errors.push("allowedDomains must be a non-empty array");
  }

  result.valid = result.errors.length === 0;
  return result;
}
