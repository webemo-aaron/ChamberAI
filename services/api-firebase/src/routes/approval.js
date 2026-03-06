import express from "express";
import { initFirestore, serverTimestamp } from "../db/firestore.js";
import { orgCollection } from "../db/orgFirestore.js";
import { requireRole } from "../middleware/rbac.js";

const router = express.Router();

router.get("/meetings/:id/approval-status", async (req, res, next) => {
  try {
    const db = initFirestore();
    const meetingSnap = await orgCollection(db, req.orgId, "meetings").doc(req.params.id).get();
    if (!meetingSnap.exists) {
      return res.status(404).json({ error: "Meeting not found" });
    }
    const meeting = meetingSnap.data();
    const motionsSnap = await orgCollection(db, req.orgId, "motions").where("meeting_id", "==", req.params.id).get();
    const actionSnap = await orgCollection(db, req.orgId, "actionItems").where("meeting_id", "==", req.params.id).get();
    const motions = motionsSnap.docs.map((doc) => doc.data());
    const actionItems = actionSnap.docs.map((doc) => doc.data());

    const hasMotions = motions.length > 0;
    const hasNoMotionsFlag = meeting.no_motions === true;
    const hasNoActionItemsFlag = meeting.no_action_items === true;
    const missingActionItems = actionItems.filter((item) => !item.owner_name || !item.due_date);
    const hasAdjournment = Boolean(meeting.end_time || meeting.adjournment_time);
    const hasAdjournmentFlag = meeting.no_adjournment_time === true;

    res.json({
      ok:
        (hasMotions || hasNoMotionsFlag) &&
        (missingActionItems.length === 0 || hasNoActionItemsFlag) &&
        (hasAdjournment || hasAdjournmentFlag),
      has_motions: hasMotions,
      no_motions_flag: hasNoMotionsFlag,
      missing_action_items: missingActionItems,
      no_action_items_flag: hasNoActionItemsFlag,
      has_adjournment_time: hasAdjournment,
      no_adjournment_time_flag: hasAdjournmentFlag
    });
  } catch (error) {
    next(error);
  }
});

router.post("/meetings/:id/approve", requireRole("admin", "secretary"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const meetingRef = orgCollection(db, req.orgId, "meetings").doc(req.params.id);
    const meetingSnap = await meetingRef.get();
    if (!meetingSnap.exists) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    const approval = await getApprovalStatus(db, req.orgId, req.params.id);
    if (!approval.ok) {
      return res.status(400).json({ error: "Approval blocked by validation rules", details: approval });
    }

    await meetingRef.set(
      {
        status: "APPROVED",
        approved_at: serverTimestamp(),
        updated_at: serverTimestamp()
      },
      { merge: true }
    );
    await orgCollection(db, req.orgId, "auditLogs").add({
      meeting_id: req.params.id,
      event_type: "MINUTES_APPROVED",
      actor: req.user?.email ?? "user",
      timestamp: serverTimestamp(),
      details: { meeting_id: req.params.id }
    });

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

async function getApprovalStatus(db, orgId, meetingId) {
  const meetingSnap = await orgCollection(db, orgId, "meetings").doc(meetingId).get();
  if (!meetingSnap.exists) {
    return { ok: false, error: "Meeting not found" };
  }
  const meeting = meetingSnap.data();
  const motionsSnap = await orgCollection(db, orgId, "motions").where("meeting_id", "==", meetingId).get();
  const actionSnap = await orgCollection(db, orgId, "actionItems").where("meeting_id", "==", meetingId).get();
  const motions = motionsSnap.docs.map((doc) => doc.data());
  const actionItems = actionSnap.docs.map((doc) => doc.data());

  const hasMotions = motions.length > 0;
  const hasNoMotionsFlag = meeting.no_motions === true;
  const hasNoActionItemsFlag = meeting.no_action_items === true;
  const missingActionItems = actionItems.filter((item) => !item.owner_name || !item.due_date);
  const hasAdjournment = Boolean(meeting.end_time || meeting.adjournment_time);
  const hasAdjournmentFlag = meeting.no_adjournment_time === true;

  return {
    ok:
      (hasMotions || hasNoMotionsFlag) &&
      (missingActionItems.length === 0 || hasNoActionItemsFlag) &&
      (hasAdjournment || hasAdjournmentFlag),
    has_motions: hasMotions,
    no_motions_flag: hasNoMotionsFlag,
    missing_action_items: missingActionItems,
    no_action_items_flag: hasNoActionItemsFlag,
    has_adjournment_time: hasAdjournment,
    no_adjournment_time_flag: hasAdjournmentFlag
  };
}

export default router;
