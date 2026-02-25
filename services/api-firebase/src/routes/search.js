import express from "express";
import { initFirestore } from "../db/firestore.js";

const router = express.Router();

router.get("/search/meetings", async (req, res, next) => {
  try {
    const query = String(req.query.q ?? "").trim().toLowerCase();
    if (!query) {
      return res.json([]);
    }

    const db = initFirestore();
    const [meetingsSnap, draftSnap, actionSnap, motionSnap] = await Promise.all([
      db.collection("meetings").get(),
      db.collection("draftMinutes").get(),
      db.collection("actionItems").get(),
      db.collection("motions").get()
    ]);

    const draftsByMeeting = new Map();
    draftSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (data?.meeting_id && data?.content) {
        draftsByMeeting.set(data.meeting_id, String(data.content));
      }
    });

    const actionsByMeeting = new Map();
    actionSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (!data?.meeting_id) return;
      const text = `${data.description ?? ""} ${data.owner_name ?? ""}`.trim();
      if (!text) return;
      const prev = actionsByMeeting.get(data.meeting_id) ?? "";
      actionsByMeeting.set(data.meeting_id, `${prev} ${text}`.trim());
    });

    const motionsByMeeting = new Map();
    motionSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (!data?.meeting_id) return;
      const text = `${data.text ?? ""} ${data.mover_name ?? ""} ${data.outcome ?? ""}`.trim();
      if (!text) return;
      const prev = motionsByMeeting.get(data.meeting_id) ?? "";
      motionsByMeeting.set(data.meeting_id, `${prev} ${text}`.trim());
    });

    const matches = meetingsSnap.docs
      .map((doc) => doc.data())
      .filter(Boolean)
      .filter((meeting) => {
        const haystack = [
          meeting.date,
          meeting.location,
          meeting.chair_name,
          meeting.secretary_name,
          Array.isArray(meeting.tags) ? meeting.tags.join(" ") : "",
          draftsByMeeting.get(meeting.id) ?? "",
          actionsByMeeting.get(meeting.id) ?? "",
          motionsByMeeting.get(meeting.id) ?? ""
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      })
      .sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")));

    return res.json(matches);
  } catch (error) {
    return next(error);
  }
});

export default router;
