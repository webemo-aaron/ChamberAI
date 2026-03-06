import express from "express";
import { initFirestore, serverTimestamp } from "../db/firestore.js";
import { orgCollection } from "../db/orgFirestore.js";
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

export default router;
