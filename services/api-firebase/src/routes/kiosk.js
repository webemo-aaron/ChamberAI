import express from "express";
import { initFirestore, serverTimestamp } from "../db/firestore.js";
import { orgCollection } from "../db/orgFirestore.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { requireKioskTier, rateLimit, requirePrivateMode } from "../middleware/requireKioskTier.js";
import { decryptApiKey, sanitizeMessage, sanitizeHtml } from "../services/kiosk-encryption.js";
import { createProvider } from "../services/kiosk-providers.js";
import { buildContext } from "../services/kiosk-context.js";

const router = express.Router();

/**
 * System prompt for the kiosk AI
 * Instructs the AI to act as a chamber assistant
 */
const SYSTEM_PROMPT = `You are an AI assistant for chamber of commerce leadership.
Your role is to help chamber officials understand their organization's operations,
governance decisions, and action items.

Provide clear, concise answers based on the context provided.
If information is not available in the context, say so clearly.
Focus on helping leadership make informed decisions.
Always maintain a professional tone appropriate for governance discussions.`;

/**
 * GET /api/kiosk/config
 * Fetch kiosk configuration for the organization
 * Returns public configuration (no sensitive keys)
 */
router.get("/api/kiosk/config", requireAuth, requireKioskTier(), async (req, res, next) => {
  try {
    const db = initFirestore();
    const orgId = req.orgId ?? process.env.DEFAULT_ORG_ID ?? "default";

    const settingsDoc = await orgCollection(db, orgId, "settings").doc("system").get();
    const settings = settingsDoc.exists ? settingsDoc.data() : {};
    const kioskConfig = settings.kioskConfig ?? {};

    // Return sanitized config (no sensitive API keys)
    return res.json({
      enabled: kioskConfig.enabled ?? false,
      publicModeEnabled: kioskConfig.publicModeEnabled ?? false,
      privateModeEnabled: kioskConfig.privateModeEnabled ?? false,
      dataScope: kioskConfig.dataScope ?? "public",
      aiProvider: kioskConfig.aiProvider ?? {
        type: "claude",
        model: "claude-3-5-sonnet-20241022"
      },
      contextConfig: {
        tokenLimit: kioskConfig.contextConfig?.tokenLimit ?? 8000,
        meetingsLimit: kioskConfig.contextConfig?.meetingsLimit ?? 5,
        motionsLimit: kioskConfig.contextConfig?.motionsLimit ?? 10,
        actionItemsLimit: kioskConfig.contextConfig?.actionItemsLimit ?? 10
      },
      rateLimit: {
        chamberMaxPerMinute: kioskConfig.rateLimit?.chamberMaxPerMinute ?? 10,
        ipMaxPerMinute: kioskConfig.rateLimit?.ipMaxPerMinute ?? 5
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/kiosk/config
 * Update kiosk configuration (admin only)
 * @body {
 *   enabled: boolean,
 *   publicModeEnabled: boolean,
 *   privateModeEnabled: boolean,
 *   aiProvider: { type, apiKey, model, ... },
 *   contextConfig: { tokenLimit, meetingsLimit, ... },
 *   rateLimit: { chamberMaxPerMinute, ipMaxPerMinute }
 * }
 */
router.post("/api/kiosk/config", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const orgId = req.orgId ?? process.env.DEFAULT_ORG_ID ?? "default";
    const config = req.body;

    // Validate basic structure
    if (typeof config !== "object") {
      return res.status(400).json({ error: "Invalid config structure" });
    }

    // Validate AI provider if provided
    if (config.aiProvider) {
      if (!config.aiProvider.type) {
        return res.status(400).json({ error: "aiProvider.type is required" });
      }
      if (!["claude", "openai", "custom"].includes(config.aiProvider.type.toLowerCase())) {
        return res.status(400).json({ error: "Invalid aiProvider type" });
      }
      if (config.aiProvider.type === "custom" && !config.aiProvider.endpoint) {
        return res.status(400).json({ error: "Custom provider requires endpoint" });
      }
    }

    // Encrypt API key if provided (use org ID as encryption password)
    const kioskConfig = {
      enabled: config.enabled ?? true,
      publicModeEnabled: config.publicModeEnabled ?? false,
      privateModeEnabled: config.privateModeEnabled ?? false,
      dataScope: config.dataScope ?? "public",
      aiProvider: config.aiProvider ?? {},
      contextConfig: config.contextConfig ?? {},
      rateLimit: config.rateLimit ?? {}
    };

    // If API key provided, encrypt it
    if (config.aiProvider?.apiKey) {
      try {
        const { encryptApiKey } = await import("../services/kiosk-encryption.js");
        const encryptionPassword = `${orgId}-kiosk-${process.env.ENCRYPTION_SEED ?? "default"}`;
        kioskConfig.aiProvider.encryptedApiKey = encryptApiKey(config.aiProvider.apiKey, encryptionPassword);
        delete kioskConfig.aiProvider.apiKey; // Remove plaintext key
      } catch (error) {
        console.error("Failed to encrypt API key:", error.message);
        return res.status(500).json({
          error: "Configuration failed",
          message: "Failed to encrypt API key"
        });
      }
    }

    // Update settings
    const settingsRef = orgCollection(db, orgId, "settings").doc("system");
    await settingsRef.update({
      kioskConfig,
      updatedAt: serverTimestamp()
    });

    // Audit log
    await orgCollection(db, orgId, "audit_logs").add({
      timestamp: serverTimestamp(),
      action: "kiosk_config_updated",
      actor: req.user?.email ?? "system",
      details: {
        enabled: kioskConfig.enabled,
        provider: kioskConfig.aiProvider?.type
      }
    });

    return res.json({
      success: true,
      message: "Kiosk configuration updated",
      config: {
        enabled: kioskConfig.enabled,
        publicModeEnabled: kioskConfig.publicModeEnabled,
        privateModeEnabled: kioskConfig.privateModeEnabled,
        aiProvider: {
          type: kioskConfig.aiProvider?.type
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/kiosk/chat
 * Main kiosk chat endpoint
 * Accepts user message, returns AI response with context
 *
 * @body { message: string }
 * @returns {
 *   response: string,
 *   followUps: string[],
 *   tokensUsed: number,
 *   sources: object,
 *   metadata: object
 * }
 */
router.post("/api/kiosk/chat", requireAuth, requireKioskTier(), rateLimit(10, 5), async (req, res, next) => {
  try {
    const db = initFirestore();
    const orgId = req.orgId ?? process.env.DEFAULT_ORG_ID ?? "default";
    const { message } = req.body;

    // Validate input
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({
        error: "Invalid request",
        message: "message field is required and must be non-empty"
      });
    }

    // Fetch org settings and kiosk config
    const settingsDoc = await orgCollection(db, orgId, "settings").doc("system").get();
    const settings = settingsDoc.exists ? settingsDoc.data() : {};
    const kioskConfig = settings.kioskConfig ?? {};

    // Determine data scope based on user role and config
    let dataScope = kioskConfig.dataScope ?? "public";
    if (req.user?.role === "admin" && kioskConfig.privateModeEnabled) {
      dataScope = "private";
    }

    // Build context from organization data
    const contextData = await buildContext(db, orgId, {
      tokenLimit: kioskConfig.contextConfig?.tokenLimit ?? 8000,
      meetingsLimit: kioskConfig.contextConfig?.meetingsLimit ?? 5,
      motionsLimit: kioskConfig.contextConfig?.motionsLimit ?? 10,
      actionItemsLimit: kioskConfig.contextConfig?.actionItemsLimit ?? 10,
      dataScope
    });

    // Sanitize user message
    const sanitizedMessage = sanitizeMessage(message);

    // Get AI provider
    const providerConfig = kioskConfig.aiProvider ?? {};
    if (!providerConfig.type) {
      return res.status(500).json({
        error: "Kiosk not configured",
        message: "AI provider not configured. Contact your administrator."
      });
    }

    // Decrypt API key if encrypted
    let decryptedConfig = { ...providerConfig };
    if (providerConfig.encryptedApiKey) {
      try {
        const encryptionPassword = `${orgId}-kiosk-${process.env.ENCRYPTION_SEED ?? "default"}`;
        const decryptedKey = decryptApiKey(providerConfig.encryptedApiKey, encryptionPassword);
        decryptedConfig.apiKey = decryptedKey;
      } catch (error) {
        console.error("Failed to decrypt API key:", error.message);
        return res.status(500).json({
          error: "Configuration error",
          message: "Failed to access AI provider credentials"
        });
      }
    }

    // Create provider and generate response
    let aiResponse;
    try {
      const provider = createProvider(decryptedConfig);
      aiResponse = await provider.generateResponse(
        sanitizedMessage,
        contextData.context,
        SYSTEM_PROMPT
      );
    } catch (error) {
      console.error("AI provider error:", error.message);
      return res.status(503).json({
        error: "AI service error",
        message: error.message,
        details: process.env.NODE_ENV === "development" ? { error: error.message } : undefined
      });
    }

    // Generate follow-up suggestions (simple heuristics)
    const followUps = generateFollowUps(sanitizedMessage, aiResponse.response);

    // Save chat history
    await orgCollection(db, orgId, "kiosk_chats").add({
      timestamp: serverTimestamp(),
      userId: req.user?.email ?? "anonymous",
      userRole: req.user?.role ?? "unknown",
      message: sanitizedMessage,
      response: sanitizeHtml(aiResponse.response),
      tokensUsed: aiResponse.tokensUsed,
      provider: aiResponse.metadata?.provider,
      model: aiResponse.metadata?.model
    });

    return res.json({
      response: aiResponse.response,
      followUps,
      tokensUsed: aiResponse.tokensUsed,
      sources: contextData.sources,
      metadata: {
        provider: aiResponse.metadata?.provider,
        model: aiResponse.metadata?.model,
        contextTokens: contextData.estimatedTokens,
        dataScope
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/kiosk/context
 * Debug endpoint to view context being used
 * Requires admin role
 */
router.get("/api/kiosk/context", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const orgId = req.orgId ?? process.env.DEFAULT_ORG_ID ?? "default";

    const settingsDoc = await orgCollection(db, orgId, "settings").doc("system").get();
    const settings = settingsDoc.exists ? settingsDoc.data() : {};
    const kioskConfig = settings.kioskConfig ?? {};

    const contextData = await buildContext(db, orgId, {
      tokenLimit: kioskConfig.contextConfig?.tokenLimit ?? 8000,
      meetingsLimit: kioskConfig.contextConfig?.meetingsLimit ?? 5,
      motionsLimit: kioskConfig.contextConfig?.motionsLimit ?? 10,
      actionItemsLimit: kioskConfig.contextConfig?.actionItemsLimit ?? 10,
      dataScope: "private" // Admins can see private data
    });

    return res.json({
      context: contextData.context,
      estimatedTokens: contextData.estimatedTokens,
      sources: contextData.sources,
      error: contextData.error
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/kiosk/history
 * Fetch chat history
 * Requires admin role
 *
 * @body { limit: number, offset: number, userId?: string }
 */
router.post("/api/kiosk/history", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const orgId = req.orgId ?? process.env.DEFAULT_ORG_ID ?? "default";
    const { limit = 20, offset = 0, userId } = req.body;

    let query = orgCollection(db, orgId, "kiosk_chats").orderBy("timestamp", "desc");

    // Filter by userId if provided
    if (userId) {
      query = query.where("userId", "==", userId);
    }

    const totalSnap = await query.count().get();
    const total = totalSnap.data().count;

    const snapshot = await query.offset(offset).limit(limit).get();

    const chats = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        timestamp: data.timestamp,
        userId: data.userId,
        userRole: data.userRole,
        message: data.message,
        response: data.response,
        tokensUsed: data.tokensUsed,
        provider: data.provider,
        model: data.model
      };
    });

    return res.json({
      chats,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Generate follow-up question suggestions
 * Simple heuristics based on user message and AI response
 * @param {string} message - User's original message
 * @param {string} response - AI's response
 * @returns {string[]} - Array of follow-up suggestions
 */
function generateFollowUps(message, response) {
  const followUps = [];

  const lowerMessage = message.toLowerCase();
  const lowerResponse = response.toLowerCase();

  // Suggest follow-ups based on message content
  if (lowerMessage.includes("motion")) {
    followUps.push("What are the voting results for this motion?");
    followUps.push("Who abstained from this vote?");
  }

  if (lowerMessage.includes("action item")) {
    followUps.push("What's the status of other open action items?");
    followUps.push("Who is responsible for overdue items?");
  }

  if (lowerMessage.includes("meeting")) {
    followUps.push("What was discussed at this meeting?");
    followUps.push("Who attended this meeting?");
  }

  if (lowerMessage.includes("recent") || lowerMessage.includes("latest")) {
    followUps.push("How does this compare to previous periods?");
    followUps.push("What trends do you see?");
  }

  // Suggest clarifying follow-ups
  if (response.length < 200) {
    followUps.push("Can you provide more details?");
  }

  if (lowerResponse.includes("unknown") || lowerResponse.includes("unclear")) {
    followUps.push("What additional information would be helpful?");
  }

  // Limit to 3 suggestions
  return followUps.slice(0, 3);
}

export default router;
