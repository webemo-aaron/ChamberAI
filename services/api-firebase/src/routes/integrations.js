import express from "express";
import { initFirestore, serverTimestamp } from "../db/firestore.js";
import { requireRole } from "../middleware/rbac.js";

const router = express.Router();

const motionApiBase = (process.env.MOTION_API_BASE ?? "https://api.usemotion.com/v1").replace(/\/$/, "");

function sanitizeText(value, max = 300) {
  const text = String(value ?? "").trim();
  return text.slice(0, max);
}

async function getMotionConfig(db) {
  const doc = await db.collection("settings").doc("integrations").get();
  const data = doc.exists ? doc.data() : {};
  return data.motion ?? {};
}

function publicMotionConfig(config) {
  return {
    enabled: Boolean(config.enabled),
    workspaceId: config.workspaceId ?? "",
    defaultProjectId: config.defaultProjectId ?? "",
    defaultLinkTemplate: config.defaultLinkTemplate ?? "",
    hasApiKey: Boolean(config.apiKey),
    updatedAt: config.updatedAt ?? null,
    updatedBy: config.updatedBy ?? null
  };
}

router.get("/integrations/motion/config", requireRole("admin", "secretary"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const config = await getMotionConfig(db);
    res.json(publicMotionConfig(config));
  } catch (error) {
    next(error);
  }
});

router.put("/integrations/motion/config", requireRole("admin", "secretary"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const current = await getMotionConfig(db);

    const next = {
      ...current,
      enabled: Boolean(req.body?.enabled),
      workspaceId: sanitizeText(req.body?.workspaceId ?? "", 120),
      defaultProjectId: sanitizeText(req.body?.defaultProjectId ?? "", 120),
      defaultLinkTemplate: sanitizeText(req.body?.defaultLinkTemplate ?? "", 500),
      updatedAt: serverTimestamp(),
      updatedBy: req.user?.email ?? "user"
    };

    if (typeof req.body?.apiKey === "string") {
      const raw = req.body.apiKey.trim();
      next.apiKey = raw;
    }

    await db.collection("settings").doc("integrations").set(
      {
        motion: next
      },
      { merge: true }
    );

    res.json(publicMotionConfig(next));
  } catch (error) {
    next(error);
  }
});

router.post("/integrations/motion/test", requireRole("admin", "secretary"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const config = await getMotionConfig(db);
    if (!config.apiKey) {
      return res.status(400).json({ error: "Motion API key is not configured." });
    }

    const response = await fetch(`${motionApiBase}/users/me`, {
      method: "GET",
      headers: {
        "X-API-Key": config.apiKey,
        Accept: "application/json"
      }
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(502).json({
        error: "Motion API test failed.",
        motion: body
      });
    }

    res.json({
      ok: true,
      userId: body.id ?? null,
      name: body.name ?? null,
      email: body.email ?? null
    });
  } catch (error) {
    next(error);
  }
});

export default router;
