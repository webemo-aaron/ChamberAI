import express from "express";
import { initFirestore, serverTimestamp } from "../db/firestore.js";
import { orgCollection } from "../db/orgFirestore.js";
import { requireRole } from "../middleware/rbac.js";
import { sendToUser, buildActionItemNotification } from "../services/notifications.js";

const router = express.Router();

router.post("/retention/sweep", requireRole("admin", "secretary"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const settingsDoc = await orgCollection(db, req.orgId, "settings").doc("system").get();
    const settings = settingsDoc.exists
      ? settingsDoc.data()
      : { retentionDays: 60 };
    const retentionDays = Number(settings.retentionDays ?? 60);
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    const approvedSnapshot = await orgCollection(db, req.orgId, "meetings").where("status", "==", "APPROVED").get();
    const deleted = [];

    for (const meetingDoc of approvedSnapshot.docs) {
      const meetingId = meetingDoc.id;
      const audioSnapshot = await orgCollection(db, req.orgId, "audioSources").where("meeting_id", "==", meetingId).get();
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
      await orgCollection(db, req.orgId, "audit_logs").add({
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

    // Send notifications for overdue action items
    const actionItemsSnap = await orgCollection(db, req.orgId, "actionItems")
      .where("status", "==", "OPEN")
      .get();

    const todayStr = new Date().toISOString().slice(0, 10);
    const notificationsSent = [];

    for (const actionDoc of actionItemsSnap.docs) {
      const action = actionDoc.data();
      if (!action.due_date || !action.owner_name) continue;

      const dueStr = String(action.due_date).slice(0, 10);
      const dueDate = new Date(dueStr);
      const today = new Date(todayStr);
      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

      // Send notifications for items due today or overdue
      if (daysOverdue >= 0) {
        const notification = buildActionItemNotification(action, daysOverdue);
        const result = await sendToUser(db, req.orgId, action.owner_name, notification);
        if (result.success && result.sent > 0) {
          notificationsSent.push({
            action_item_id: action.id,
            owner: action.owner_name,
            days_overdue: daysOverdue
          });
        }
      }
    }

    res.json({ deleted, notifications_sent: notificationsSent });
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
