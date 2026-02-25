import express from "express";
import { initFirestore, serverTimestamp } from "../db/firestore.js";
import { requireRole } from "../middleware/rbac.js";

const router = express.Router();

router.post("/retention/sweep", requireRole("admin", "secretary"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const settingsDoc = await db.collection("settings").doc("system").get();
    const settings = settingsDoc.exists
      ? settingsDoc.data()
      : { retentionDays: 60 };
    const retentionDays = Number(settings.retentionDays ?? 60);
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    const approvedSnapshot = await db.collection("meetings").where("status", "==", "APPROVED").get();
    const deleted = [];

    for (const meetingDoc of approvedSnapshot.docs) {
      const meetingId = meetingDoc.id;
      const audioSnapshot = await db.collection("audioSources").where("meeting_id", "==", meetingId).get();
      for (const audioDoc of audioSnapshot.docs) {
        const audio = audioDoc.data();
        const createdAt = toDate(audio.created_at);
        if (!createdAt) continue;
        if (createdAt <= cutoff) {
          await audioDoc.ref.delete();
          deleted.push({ meeting_id: meetingId, audio_id: audioDoc.id, file_uri: audio.file_uri ?? null });
        }
      }
    }

    if (deleted.length > 0) {
      await db.collection("auditLogs").add({
        meeting_id: "system",
        event_type: "RETENTION_SWEEP",
        actor: req.user?.email ?? "user",
        timestamp: serverTimestamp(),
        details: {
          deleted_count: deleted.length,
          meeting_ids: Array.from(new Set(deleted.map((entry) => entry.meeting_id)))
        }
      });
    }

    res.json({ deleted });
  } catch (error) {
    next(error);
  }
});

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (typeof value === "object" && typeof value.seconds === "number") {
    return new Date(value.seconds * 1000);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? null : parsed;
}

export default router;
