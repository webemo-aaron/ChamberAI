import express from "express";
import admin from "firebase-admin";
import { initFirestore, serverTimestamp } from "../db/firestore.js";
import { orgRef, orgCollection } from "../db/orgFirestore.js";
import { makeId } from "../utils/ids.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

const router = express.Router();

/**
 * POST /organizations
 * Public endpoint for organization onboarding/signup
 * Creates org, settings, and initial membership
 * @body {name: string, slug: string}
 * @returns {orgId, name, slug}
 */
router.post("/organizations", async (req, res, next) => {
  try {
    const { name, slug } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: "name and slug are required" });
    }

    const db = initFirestore();
    const orgId = makeId("org");

    // Create organization document
    await orgRef(db, orgId).set({
      id: orgId,
      name,
      slug,
      plan: "free",
      created_at: serverTimestamp()
    });

    // Create organization settings/system document
    await orgCollection(db, orgId, "settings").doc("system").set({
      subscription: {
        tier: "free",
        status: "active",
        created_at: serverTimestamp()
      }
    });

    // If a user is authenticated, create initial membership
    if (req.user?.email && req.user.email !== "guest@local") {
      await orgCollection(db, orgId, "memberships").doc(req.user.email).set({
        role: "admin",
        status: "active",
        created_at: serverTimestamp()
      });

      // Set Firebase custom claim if uid is available
      if (req.user?.uid && process.env.FIREBASE_AUTH_ENABLED === "true") {
        try {
          await admin.auth().setCustomUserClaims(req.user.uid, { orgId });
        } catch (error) {
          console.warn("Could not set custom claims", { uid: req.user.uid, error: error.message });
        }
      }
    }

    res.status(201).json({
      orgId,
      name,
      slug
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /organizations/me
 * Returns the current user's organization
 * @returns {id, name, slug, plan, created_at}
 */
router.get("/organizations/me", requireAuth, async (req, res, next) => {
  try {
    if (!req.orgId) {
      return res.status(400).json({ error: "No organization ID in request" });
    }

    const db = initFirestore();
    const orgDoc = await orgRef(db, req.orgId).get();

    if (!orgDoc.exists) {
      return res.status(404).json({ error: "Organization not found" });
    }

    res.json(orgDoc.data());
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /organizations/me
 * Update organization metadata (admin only)
 * @body {name?: string, slug?: string}
 * @returns {id, name, slug, plan, created_at, updated_at}
 */
router.patch("/organizations/me", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    if (!req.orgId) {
      return res.status(400).json({ error: "No organization ID in request" });
    }

    const { name, slug } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = slug;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    updates.updated_at = serverTimestamp();

    const db = initFirestore();
    await orgRef(db, req.orgId).update(updates);

    const orgDoc = await orgRef(db, req.orgId).get();
    res.json(orgDoc.data());
  } catch (error) {
    next(error);
  }
});

export default router;
