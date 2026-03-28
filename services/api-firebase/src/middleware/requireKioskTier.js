import { initFirestore } from "../db/firestore.js";
import { orgCollection } from "../db/orgFirestore.js";

const tierLevels = {
  free: 0,
  pro: 1,
  council: 2,
  network: 3
};

/**
 * In-memory rate limiter with chamber and IP tracking
 * Automatically cleans up old entries every 60 seconds
 */
class RateLimiter {
  constructor() {
    this.chambers = new Map(); // orgId -> { timestamps: [] }
    this.ips = new Map(); // ip -> { timestamps: [] }
    this.cleanupInterval = 60000; // 60 seconds
    this.startCleanup();
  }

  startCleanup() {
    setInterval(() => {
      const now = Date.now();
      const ttl = 60000; // 1 minute

      // Clean chambers
      for (const [key, data] of this.chambers.entries()) {
        data.timestamps = data.timestamps.filter((ts) => now - ts < ttl);
        if (data.timestamps.length === 0) {
          this.chambers.delete(key);
        }
      }

      // Clean IPs
      for (const [key, data] of this.ips.entries()) {
        data.timestamps = data.timestamps.filter((ts) => now - ts < ttl);
        if (data.timestamps.length === 0) {
          this.ips.delete(key);
        }
      }
    }, this.cleanupInterval);
  }

  checkChamber(orgId, maxPerMinute) {
    if (!this.chambers.has(orgId)) {
      this.chambers.set(orgId, { timestamps: [] });
    }

    const data = this.chambers.get(orgId);
    const now = Date.now();
    data.timestamps = data.timestamps.filter((ts) => now - ts < 60000);

    if (data.timestamps.length >= maxPerMinute) {
      return false;
    }

    data.timestamps.push(now);
    return true;
  }

  checkIP(ip, maxPerMinute) {
    if (!this.ips.has(ip)) {
      this.ips.set(ip, { timestamps: [] });
    }

    const data = this.ips.get(ip);
    const now = Date.now();
    data.timestamps = data.timestamps.filter((ts) => now - ts < 60000);

    if (data.timestamps.length >= maxPerMinute) {
      return false;
    }

    data.timestamps.push(now);
    return true;
  }
}

const rateLimiter = new RateLimiter();

/**
 * Middleware factory to check Kiosk tier and configuration
 * Ensures user's organization has Pro+ tier and kiosk is configured
 *
 * @returns {function} Express middleware
 */
export function requireKioskTier() {
  return async (req, res, next) => {
    try {
      const db = initFirestore();
      const orgId = req.orgId ?? process.env.DEFAULT_ORG_ID ?? "default";

      // Fetch org settings
      const settingsDoc = await orgCollection(db, orgId, "settings").doc("system").get();
      const settings = settingsDoc.exists ? settingsDoc.data() : {};
      const currentTier = settings.subscription?.tier ?? "free";

      // Kiosk requires Pro+ tier
      if ((tierLevels[currentTier] ?? 0) < (tierLevels["pro"] ?? 0)) {
        return res.status(402).json({
          error: "Payment required",
          feature: "kiosk",
          tier_required: "pro",
          current_tier: currentTier,
          message: "AI Kiosk feature requires Pro tier or higher"
        });
      }

      // Check kiosk configuration exists
      const kioskConfig = settings.kioskConfig ?? {};
      if (!kioskConfig.enabled) {
        return res.status(400).json({
          error: "Kiosk not configured",
          message: "Kiosk feature is not configured for this organization. Contact your administrator."
        });
      }

      // Attach config to request
      req.kioskConfig = kioskConfig;

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware factory for rate limiting
 * Applies both per-chamber and per-IP limits
 *
 * @param {number} chamberMaxPerMinute - Max requests per chamber per minute (default: 10)
 * @param {number} ipMaxPerMinute - Max requests per IP per minute (default: 5)
 * @returns {function} Express middleware
 */
export function rateLimit(chamberMaxPerMinute = 10, ipMaxPerMinute = 5) {
  return (req, res, next) => {
    const orgId = req.orgId ?? "unknown";
    const ip = req.ip ?? req.connection.remoteAddress ?? "unknown";

    // Check chamber limit
    if (!rateLimiter.checkChamber(orgId, chamberMaxPerMinute)) {
      return res.status(429).json({
        error: "Rate limit exceeded",
        limit: chamberMaxPerMinute,
        window: "60 seconds",
        message: `Chamber rate limit: ${chamberMaxPerMinute} requests per minute`
      });
    }

    // Check IP limit
    if (!rateLimiter.checkIP(ip, ipMaxPerMinute)) {
      return res.status(429).json({
        error: "Rate limit exceeded",
        limit: ipMaxPerMinute,
        window: "60 seconds",
        message: `IP rate limit: ${ipMaxPerMinute} requests per minute`
      });
    }

    next();
  };
}

/**
 * Middleware to check if private mode is enabled
 * Private mode allows kiosk to access sensitive data like motions and action items
 *
 * @returns {function} Express middleware
 */
export function requirePrivateMode() {
  return (req, res, next) => {
    const kioskConfig = req.kioskConfig ?? {};

    if (!kioskConfig.privateModeEnabled) {
      return res.status(403).json({
        error: "Private mode not enabled",
        message: "This operation requires private mode to be enabled in kiosk configuration"
      });
    }

    next();
  };
}
