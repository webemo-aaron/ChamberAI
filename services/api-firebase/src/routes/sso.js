/**
 * SSO (Single Sign-On) configuration and management endpoints
 * Supports SAML and OIDC providers: Google Workspace, Azure AD, Okta
 */

import express from "express";
import { initFirestore, serverTimestamp } from "../db/firestore.js";
import { orgCollection } from "../db/orgFirestore.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import {
  getSsoConfig,
  validateSsoConfig,
  clearSsoConfigCache
} from "../utils/sso-provisioning.js";

const router = express.Router();

/**
 * GET /api/sso/config
 * Get SSO configuration for the organization (admin only)
 * Sensitive fields (samlCertificate, oidcClientSecret) are NOT returned
 */
router.get("/api/sso/config", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const config = await getSsoConfig(db, req.orgId);

    if (!config) {
      return res.json({
        provider: "disabled",
        enabled: false
      });
    }

    // Sanitize response: remove sensitive fields
    const { samlCertificate, oidcClientSecret, ...safeConfig } = config;

    res.json({
      ...safeConfig,
      hasCertificate: !!samlCertificate,
      hasClientSecret: !!oidcClientSecret
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/sso/config
 * Update SSO configuration (admin only)
 */
router.patch("/api/sso/config", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const {
      provider,
      samlEntityId,
      samlSsoUrl,
      samlCertificate,
      oidcClientId,
      oidcClientSecret,
      oidcIssuer,
      allowedDomains,
      autoProvisionRole,
      enabled
    } = req.body;

    if (!provider) {
      return res.status(400).json({ error: "provider is required" });
    }

    if (!Array.isArray(allowedDomains) || allowedDomains.length === 0) {
      return res.status(400).json({ error: "allowedDomains must be a non-empty array" });
    }

    if (!["viewer", "secretary"].includes(autoProvisionRole)) {
      return res.status(400).json({ error: "autoProvisionRole must be 'viewer' or 'secretary'" });
    }

    const config = {
      provider,
      samlEntityId: samlEntityId || null,
      samlSsoUrl: samlSsoUrl || null,
      samlCertificate: samlCertificate || null,
      oidcClientId: oidcClientId || null,
      oidcClientSecret: oidcClientSecret || null,
      oidcIssuer: oidcIssuer || null,
      allowedDomains,
      autoProvisionRole,
      enabled: enabled !== false,
      updatedAt: serverTimestamp(),
      updatedBy: req.user?.email ?? "admin"
    };

    // Validate config
    const validation = await validateSsoConfig(config, db);
    if (!validation.valid) {
      return res.status(400).json({
        error: "Invalid SSO configuration",
        errors: validation.errors
      });
    }

    await orgCollection(db, req.orgId, "settings").doc("sso").set(config, { merge: true });

    // Log configuration change
    await orgCollection(db, req.orgId, "audit_logs").add({
      action: "SSO_CONFIG_CHANGED",
      actor: req.user?.email ?? "admin",
      timestamp: serverTimestamp(),
      details: {
        provider,
        enabled,
        allowedDomains: allowedDomains.length
      }
    });

    // Clear cache
    clearSsoConfigCache(req.orgId);

    // Return sanitized config
    const { samlCertificate: _, oidcClientSecret: __, ...safeConfig } = config;
    res.json({
      ...safeConfig,
      hasCertificate: !!samlCertificate,
      hasClientSecret: !!oidcClientSecret,
      message: "SSO configuration updated"
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sso/status
 * Check if SSO is enabled for the organization (requires auth)
 * Public information used for login screen
 */
router.get("/api/sso/status", requireAuth, async (req, res, next) => {
  try {
    const db = initFirestore();
    const config = await getSsoConfig(db, req.orgId);

    if (!config || !config.enabled) {
      return res.json({
        enabled: false,
        provider: null
      });
    }

    // Return only non-sensitive info for login screen
    res.json({
      enabled: true,
      provider: config.provider,
      orgId: req.orgId
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sso/test-connection
 * Test SSO provider configuration (admin only)
 * Returns validation result without making actual provider calls
 */
router.post("/api/sso/test-connection", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const config = await getSsoConfig(db, req.orgId);

    if (!config) {
      return res.json({
        ok: false,
        error: "No SSO configuration found"
      });
    }

    const validation = await validateSsoConfig(config, db);

    if (!validation.valid) {
      return res.json({
        ok: false,
        error: "Invalid SSO configuration",
        errors: validation.errors
      });
    }

    // Log test attempt
    await orgCollection(db, req.orgId, "audit_logs").add({
      action: "SSO_TEST_CONNECTION",
      actor: req.user?.email ?? "admin",
      timestamp: serverTimestamp(),
      details: {
        provider: config.provider,
        success: true
      }
    });

    res.json({
      ok: true,
      message: "SSO configuration is valid",
      provider: config.provider
    });
  } catch (error) {
    next(error);
  }
});

export default router;
