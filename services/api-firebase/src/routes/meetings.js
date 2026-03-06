import express from "express";
import { initFirestore, serverTimestamp } from "../db/firestore.js";
import { orgCollection } from "../db/orgFirestore.js";
import { makeId } from "../utils/ids.js";
import { normalizeTags, requireFields } from "../utils/validation.js";
import { requireRole } from "../middleware/rbac.js";
import { requireTier } from "../middleware/requireTier.js";

const router = express.Router();

router.post("/meetings", requireRole("admin", "secretary"), requireTier("pro"), async (req, res, next) => {
  try {
    requireFields(req.body, ["date", "start_time", "location"]);
    const db = initFirestore();
    const id = makeId("meeting");
    const meeting = {
      id,
      date: req.body.date,
      start_time: req.body.start_time,
      end_time: req.body.end_time ?? null,
      location: req.body.location,
      chair_name: req.body.chair_name ?? null,
      secretary_name: req.body.secretary_name ?? null,
      status: "CREATED",
      tags: normalizeTags(req.body.tags),
      no_motions: false,
      no_action_items: false,
      no_adjournment_time: false,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    await orgCollection(db, req.orgId, "meetings").doc(id).set(meeting);
    res.status(201).json(meeting);
  } catch (error) {
    next(error);
  }
});

router.get("/meetings", async (req, res, next) => {
  try {
    const db = initFirestore();
    const snapshot = await orgCollection(db, req.orgId, "meetings").get();
    const meetings = snapshot.docs.map((doc) => doc.data());
    res.json(meetings);
  } catch (error) {
    next(error);
  }
});

router.get("/meetings/:id", async (req, res, next) => {
  try {
    const db = initFirestore();
    const doc = await orgCollection(db, req.orgId, "meetings").doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Meeting not found" });
    }
    res.json(doc.data());
  } catch (error) {
    next(error);
  }
});

router.put("/meetings/:id", requireRole("admin", "secretary"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const update = {
      ...req.body,
      tags: req.body.tags ? normalizeTags(req.body.tags) : undefined,
      updated_at: serverTimestamp()
    };
    await orgCollection(db, req.orgId, "meetings").doc(req.params.id).set(update, { merge: true });
    const doc = await orgCollection(db, req.orgId, "meetings").doc(req.params.id).get();
    res.json(doc.data());
  } catch (error) {
    next(error);
  }
});

/**
 * GET /meetings/:id/governance-report
 * Returns governance compliance metrics for a single meeting
 * Requires: pro tier or higher
 */
router.get("/meetings/:id/governance-report", requireTier("pro"), async (req, res, next) => {
  try {
    const db = initFirestore();

    const meeting = await orgCollection(db, req.orgId, "meetings").doc(req.params.id).get();
    if (!meeting.exists) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    const meetingData = meeting.data();
    const draft = await orgCollection(db, req.orgId, "draftMinutes").doc(req.params.id).get();
    const draftData = draft.exists ? draft.data() : null;
    const motions = await orgCollection(db, req.orgId, "motions").where("meeting_id", "==", req.params.id).get();
    const actions = await orgCollection(db, req.orgId, "actionItems").where("meeting_id", "==", req.params.id).get();

    const motionsList = motions.docs.map((doc) => doc.data());
    const actionsList = actions.docs.map((doc) => doc.data());

    // Compliance checklist
    const checks = {
      quorum_recorded: !!meetingData.attendance_count,
      all_motions_have_outcome: motionsList.every((m) => m.status),
      all_actions_have_owner: actionsList.every((a) => a.owner),
      all_actions_have_due_date: actionsList.every((a) => a.due_date),
      minutes_approved: !!draftData?.approved_at,
      public_summary_published: !!meetingData.public_summary_published
    };

    // Calculate compliance score
    const checkedItems = Object.keys(checks).length;
    const passedItems = Object.values(checks).filter((v) => v).length;
    const complianceScore = Math.round((passedItems / checkedItems) * 100);

    // Flags
    const flags = [];
    if (motionsList.some((m) => !m.seconder)) {
      flags.push({
        type: "missing_seconder",
        message: "Some motions missing seconder information",
        severity: "warning"
      });
    }

    const overdueActions = actionsList.filter((a) => {
      if (!a.due_date) return false;
      try {
        const due = new Date(a.due_date);
        return due < new Date() && a.status !== "COMPLETED";
      } catch {
        return false;
      }
    });

    if (overdueActions.length > 0) {
      flags.push({
        type: "overdue_actions",
        message: `${overdueActions.length} action(s) are overdue`,
        severity: "critical",
        count: overdueActions.length
      });
    }

    if (draftData && !draftData.approved_at) {
      flags.push({
        type: "minutes_pending",
        message: "Minutes have not been approved",
        severity: "warning"
      });
    }

    res.json({
      meeting_id: req.params.id,
      meeting_date: meetingData.date,
      compliance_score: complianceScore,
      checks,
      flags,
      summary: {
        motions_total: motionsList.length,
        motions_passed: motionsList.filter((m) => m.status === "PASSED").length,
        actions_total: actionsList.length,
        actions_completed: actionsList.filter((a) => a.status === "COMPLETED").length,
        actions_overdue: overdueActions.length
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
