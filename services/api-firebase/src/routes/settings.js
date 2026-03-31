import express from "express";
import { initFirestore, serverTimestamp } from "../db/firestore.js";
import { orgCollection, orgRef } from "../db/orgFirestore.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

const router = express.Router();

router.get("/settings", async (req, res, next) => {
  try {
    const db = initFirestore();
    const doc = await orgCollection(db, req.orgId, "settings").doc("system").get();
    res.json(
      doc.exists
        ? doc.data()
        : {
            retentionDays: 60,
            maxFileSizeMb: 500,
            maxDurationSeconds: 14400,
            featureFlags: {
              business_directory: true,
              review_workflow: true,
              quote_automation: true,
              ai_search: true
            }
          }
    );
  } catch (error) {
    next(error);
  }
});

router.put("/settings", requireRole("admin", "secretary"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const patch = {
      retentionDays: req.body.retentionDays ?? 60,
      maxFileSizeMb: req.body.maxFileSizeMb ?? 500,
      maxDurationSeconds: req.body.maxDurationSeconds ?? 14400,
      featureFlags: req.body.featureFlags ?? {},
      updated_at: serverTimestamp()
    };
    await orgCollection(db, req.orgId, "settings").doc("system").set(patch, { merge: true });
    res.json(patch);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/settings/org-profile
 * Fetch organization branding and profile configuration
 * Requires authentication
 */
router.get("/api/settings/org-profile", requireAuth, async (req, res, next) => {
  try {
    const db = initFirestore();
    const orgId = req.orgId ?? process.env.DEFAULT_ORG_ID ?? "default";

    const orgDoc = await orgRef(db, orgId).get();
    const branding = orgDoc.exists ? (orgDoc.data()?.branding ?? {}) : {};

    return res.json({
      success: true,
      branding: {
        displayName: branding.displayName ?? "",
        logoUrl: branding.logoUrl ?? "",
        kioskSystemPromptOverride: branding.kioskSystemPromptOverride ?? ""
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/settings/org-profile
 * Update organization branding and profile configuration
 * Admin only
 *
 * @body {
 *   displayName?: string,
 *   logoUrl?: string,
 *   kioskSystemPromptOverride?: string
 * }
 */
router.patch("/api/settings/org-profile", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const orgId = req.orgId ?? process.env.DEFAULT_ORG_ID ?? "default";
    const { displayName, logoUrl, kioskSystemPromptOverride } = req.body;

    // Validate input types
    if (displayName && typeof displayName !== "string") {
      return res.status(400).json({ error: "displayName must be a string" });
    }
    if (logoUrl && typeof logoUrl !== "string") {
      return res.status(400).json({ error: "logoUrl must be a string" });
    }
    if (kioskSystemPromptOverride && typeof kioskSystemPromptOverride !== "string") {
      return res.status(400).json({ error: "kioskSystemPromptOverride must be a string" });
    }

    // Update organization document with branding
    const branding = {};
    if (displayName !== undefined) branding.displayName = displayName;
    if (logoUrl !== undefined) branding.logoUrl = logoUrl;
    if (kioskSystemPromptOverride !== undefined) branding.kioskSystemPromptOverride = kioskSystemPromptOverride;

    await orgRef(db, orgId).set(
      { branding, updatedAt: serverTimestamp() },
      { merge: true }
    );

    // Audit log
    await orgCollection(db, orgId, "audit_logs").add({
      timestamp: serverTimestamp(),
      action: "org_profile_updated",
      actor: req.user?.email ?? "system",
      details: {
        displayName: displayName !== undefined,
        logoUrl: logoUrl !== undefined,
        kioskSystemPromptOverride: kioskSystemPromptOverride !== undefined
      }
    });

    return res.json({
      success: true,
      message: "Organization profile updated",
      branding: {
        displayName: branding.displayName ?? "",
        logoUrl: branding.logoUrl ?? "",
        kioskSystemPromptOverride: branding.kioskSystemPromptOverride ?? ""
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
