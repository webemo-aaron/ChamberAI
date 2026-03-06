import { initFirestore } from "../db/firestore.js";
import { orgCollection } from "../db/orgFirestore.js";

/**
 * Middleware factory that enforces minimum subscription tier
 * @param {string} requiredTier - 'free', 'pro', 'council', or 'network'
 * @returns {function} Express middleware
 */
export function requireTier(requiredTier) {
  const tierLevels = {
    free: 0,
    pro: 1,
    council: 2,
    network: 3
  };

  return async (req, res, next) => {
    try {
      const db = initFirestore();
      const orgId = req.orgId ?? process.env.DEFAULT_ORG_ID ?? "default";
      const settingsDoc = await orgCollection(db, orgId, "settings").doc("system").get();
      const settings = settingsDoc.exists ? settingsDoc.data() : {};
      const currentTier = settings.subscription?.tier ?? "free";

      if ((tierLevels[currentTier] ?? 0) < (tierLevels[requiredTier] ?? 0)) {
        return res.status(402).json({
          error: "Payment required",
          tier_required: requiredTier,
          current_tier: currentTier,
          message: `This feature requires ${requiredTier} tier or higher`
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
