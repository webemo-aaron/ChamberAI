import express from "express";
import { initFirestore, serverTimestamp } from "../db/firestore.js";
import { requireRole } from "../middleware/rbac.js";
import { maybeEnhancePublicSummary } from "../services/ai_generation.js";

const router = express.Router();

router.get("/meetings/:id/public-summary", async (req, res, next) => {
  try {
    const db = initFirestore();
    const doc = await db.collection("publicSummaries").doc(req.params.id).get();
    if (!doc.exists) return res.json(null);
    res.json(normalizeSummary(doc.data()));
  } catch (error) {
    next(error);
  }
});

router.put("/meetings/:id/public-summary", requireRole("admin", "secretary"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const summary = {
      meeting_id: req.params.id,
      content: req.body.content ?? "",
      fields: req.body.fields ?? {},
      checklist: req.body.checklist ?? {},
      updated_at: serverTimestamp()
    };
    await db.collection("publicSummaries").doc(req.params.id).set(summary, { merge: true });
    res.json(normalizeSummary(summary));
  } catch (error) {
    next(error);
  }
});

router.post(
  "/meetings/:id/public-summary/generate",
  requireRole("admin", "secretary"),
  async (req, res, next) => {
    try {
      const db = initFirestore();
      const meetingSnap = await db.collection("meetings").doc(req.params.id).get();
      if (!meetingSnap.exists) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      const meeting = meetingSnap.data();
      const motionsSnap = await db.collection("motions").where("meeting_id", "==", req.params.id).get();
      const actionSnap = await db.collection("actionItems").where("meeting_id", "==", req.params.id).get();
      const motionsCount = motionsSnap.size;
      const actionCount = actionSnap.size;
      const location = meeting.location ?? "the meeting location";
      const chair = meeting.chair_name ?? "the Chair";

      const fields = {
        title: `Public summary for ${meeting.date}`,
        highlights: motionsCount > 0 ? `Motions recorded: ${motionsCount}.` : "No formal motions recorded.",
        impact: `Meeting held at ${location}.`,
        motions: motionsCount > 0 ? "Motions reviewed and documented." : "No motions recorded.",
        actions: actionCount > 0 ? `Action items captured: ${actionCount}.` : "No action items recorded.",
        attendance: chair ? `Facilitated by ${chair}.` : "",
        call_to_action: "Minutes are available upon request.",
        notes: ""
      };
      const content = [
        fields.title,
        fields.highlights,
        fields.impact,
        fields.motions,
        fields.actions,
        fields.attendance,
        fields.call_to_action,
        fields.notes
      ]
        .map((text) => String(text).trim())
        .filter(Boolean)
        .join("\n\n");

      const seed = { fields, content };
      const { output, meta } = await maybeEnhancePublicSummary(seed, {
        meeting: {
          id: req.params.id,
          date: meeting.date,
          location: meeting.location,
          chair_name: meeting.chair_name,
          secretary_name: meeting.secretary_name
        },
        motions_count: motionsCount,
        action_items_count: actionCount
      });

      const summary = {
        meeting_id: req.params.id,
        content: output.content,
        fields: output.fields,
        checklist: {
          no_confidential: false,
          names_approved: false,
          motions_reviewed: false,
          actions_reviewed: false,
          chair_approved: false
        },
        generation_meta: meta,
        updated_at: serverTimestamp()
      };
      await db.collection("publicSummaries").doc(req.params.id).set(summary, { merge: true });
      res.json(normalizeSummary(summary));
    } catch (error) {
      next(error);
    }
  }
);

router.post("/meetings/:id/public-summary/publish", requireRole("admin", "secretary"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const docRef = db.collection("publicSummaries").doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Public summary not found" });
    }
    const summary = doc.data();
    const checklist = summary.checklist ?? {};
    const ready =
      checklist.no_confidential &&
      checklist.names_approved &&
      checklist.motions_reviewed &&
      checklist.actions_reviewed &&
      checklist.chair_approved;
    if (!ready) {
      return res.status(400).json({ error: "Publish blocked by incomplete checklist" });
    }
    const updated = {
      ...summary,
      published_at: serverTimestamp(),
      published_by: req.user?.email ?? "user",
      updated_at: serverTimestamp()
    };
    await docRef.set(updated, { merge: true });
    const refreshed = await docRef.get();
    res.json(normalizeSummary(refreshed.data()));
  } catch (error) {
    next(error);
  }
});

export default router;

function normalizeSummary(summary) {
  return {
    ...summary,
    updated_at: normalizeTimestamp(summary.updated_at),
    published_at: normalizeTimestamp(summary.published_at)
  };
}

function normalizeTimestamp(value) {
  if (!value) return value;
  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  if (typeof value === "object" && typeof value.seconds === "number") {
    return new Date(value.seconds * 1000).toISOString();
  }
  return value;
}
