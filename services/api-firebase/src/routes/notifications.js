/**
 * Notification routes for device token registration and push notification management
 */

import express from "express";
import { initFirestore, serverTimestamp } from "../db/firestore.js";
import { orgCollection } from "../db/orgFirestore.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { sendToOrg } from "../services/notifications.js";

const router = express.Router();

/**
 * POST /api/notifications/device-token
 * Register or update FCM device token for the authenticated user
 * Requires: Authentication
 * @body {
 *   token: string,        // FCM device token from client
 *   platform: string,     // "ios" or "android"
 *   device_id?: string    // Optional device ID for uniqueness
 * }
 */
router.post("/api/notifications/device-token", requireAuth, async (req, res, next) => {
  try {
    const db = initFirestore();
    const { token, platform, device_id } = req.body;
    const userEmail = req.user?.email;
    const orgId = req.orgId;

    if (!token) {
      return res.status(400).json({ error: "token is required" });
    }

    if (!platform || !["ios", "android"].includes(platform)) {
      return res.status(400).json({ error: "platform must be 'ios' or 'android'" });
    }

    if (!userEmail) {
      return res.status(400).json({ error: "User email not found in token" });
    }

    // Use device_id if provided, otherwise derive from email + platform
    const tokenId = device_id || `${userEmail}-${platform}`;

    // Store device token in Firestore
    const tokenRef = orgCollection(db, orgId, "device_tokens").doc(tokenId);
    await tokenRef.set({
      token,
      email: userEmail,
      platform,
      registered_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });

    res.json({
      success: true,
      message: "Device token registered",
      token_id: tokenId
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/notifications/device-token
 * Unregister device token (called on logout)
 * Requires: Authentication
 * @query {
 *   token_id?: string     // Optional token ID (if provided, only unregister that token)
 * }
 */
router.delete("/api/notifications/device-token", requireAuth, async (req, res, next) => {
  try {
    const db = initFirestore();
    const userEmail = req.user?.email;
    const orgId = req.orgId;
    const tokenIdParam = req.query.token_id;

    if (!userEmail) {
      return res.status(400).json({ error: "User email not found in token" });
    }

    if (tokenIdParam) {
      // Unregister specific token
      await orgCollection(db, orgId, "device_tokens").doc(tokenIdParam).delete();
      return res.json({ success: true, message: "Device token unregistered" });
    }

    // Unregister all tokens for this user
    const tokensSnap = await orgCollection(db, orgId, "device_tokens")
      .where("email", "==", userEmail)
      .get();

    const batch = db.batch();
    tokensSnap.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    res.json({ success: true, message: "All device tokens unregistered" });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/notifications/preferences
 * Get notification preferences for the authenticated user
 * Requires: Authentication
 * @returns { preferences with opt-in/out flags }
 */
router.get("/api/notifications/preferences", requireAuth, async (req, res, next) => {
  try {
    const db = initFirestore();
    const userEmail = req.user?.email;
    const orgId = req.orgId;

    if (!userEmail) {
      return res.status(400).json({ error: "User email not found in token" });
    }

    // Fetch user preferences from org settings
    const settingsDoc = await orgCollection(db, orgId, "settings").doc("notifications").get();
    const settings = settingsDoc.exists ? settingsDoc.data() : {};

    // Get user-specific preferences (or defaults)
    const userPrefs = settings[userEmail] || {
      meeting_created: true,
      meeting_approved: true,
      action_item_overdue: true,
      action_item_due_today: true,
      minutes_pending: true
    };

    res.json({
      user_email: userEmail,
      preferences: userPrefs
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/notifications/preferences
 * Update notification preferences for the authenticated user
 * Requires: Authentication
 * @body { preferences object with flags }
 */
router.patch("/api/notifications/preferences", requireAuth, async (req, res, next) => {
  try {
    const db = initFirestore();
    const userEmail = req.user?.email;
    const orgId = req.orgId;
    const preferences = req.body.preferences;

    if (!userEmail) {
      return res.status(400).json({ error: "User email not found in token" });
    }

    if (!preferences || typeof preferences !== "object") {
      return res.status(400).json({ error: "preferences must be an object" });
    }

    // Update user-specific preferences
    const settingsDoc = orgCollection(db, orgId, "settings").doc("notifications");
    await settingsDoc.set({ [userEmail]: preferences }, { merge: true });

    res.json({
      success: true,
      message: "Preferences updated",
      preferences
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/notifications/test
 * Send a test push notification to all devices in the org (admin only)
 * Requires: Authentication + Admin role
 * Used for testing notification infrastructure
 */
router.post("/api/notifications/test", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const orgId = req.orgId;

    const testNotification = {
      title: "Test notification",
      body: "This is a test push notification from ChamberAI",
      event_type: "test",
      data: {
        notification_type: "test",
        test_timestamp: new Date().toISOString()
      }
    };

    const result = await sendToOrg(db, orgId, testNotification);

    res.json({
      success: result.success,
      message: "Test notification sent",
      sent: result.sent,
      failed: result.failed
    });
  } catch (error) {
    next(error);
  }
});

export default router;
