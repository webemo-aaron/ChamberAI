import express from "express";
import { initFirestore } from "../db/firestore.js";
import { orgCollection } from "../db/orgFirestore.js";
import { requireTier } from "../middleware/requireTier.js";
import { annotateTrendAnomalies } from "../services/governance-insights.js";

const router = express.Router();

/**
 * GET /analytics/board
 * Returns board effectiveness metrics across all meetings
 * Requires: council tier or higher
 * @returns {metrics} - Meeting aggregate metrics
 */
router.get("/analytics/board", requireTier("council"), async (req, res, next) => {
  try {
    const db = initFirestore();

    // Fetch all meetings
    const meetingsSnap = await orgCollection(db, req.orgId, "meetings").get();
    const meetings = meetingsSnap.docs.map((doc) => doc.data());

    if (meetings.length === 0) {
      return res.json({
        meetings_total: 0,
        average_time_to_approval_days: 0,
        action_item_completion_rate: 0,
        average_meeting_attendance: 0,
        motions_per_meeting_avg: 0,
        most_active_action_owners: [],
        meeting_frequency_days: 0,
        data_points: 0
      });
    }

    // Fetch related action items and motions
    const actionItemsSnap = await orgCollection(db, req.orgId, "actionItems").get();
    const motionsSnap = await orgCollection(db, req.orgId, "motions").get();
    const draftMinutesSnap = await orgCollection(db, req.orgId, "draftMinutes").get();

    const actionItems = actionItemsSnap.docs.map((doc) => doc.data());
    const motions = motionsSnap.docs.map((doc) => doc.data());
    const draftMinutes = draftMinutesSnap.docs.map((doc) => doc.data());

    // Calculate metrics
    let totalApprovalDays = 0;
    let approvalCount = 0;
    let completedActions = 0;
    let totalActions = actionItems.length;
    let totalAttendance = 0;
    let attendanceCount = 0;
    const ownerCompletionMap = {};

    // Time to approval
    draftMinutes.forEach((draft) => {
      if (draft.approved_at && draft.created_at) {
        try {
          const created =
            draft.created_at instanceof Date
              ? draft.created_at
              : new Date(draft.created_at);
          const approved =
            draft.approved_at instanceof Date
              ? draft.approved_at
              : new Date(draft.approved_at);
          const days = (approved - created) / (1000 * 60 * 60 * 24);
          if (days >= 0) {
            totalApprovalDays += days;
            approvalCount += 1;
          }
        } catch (e) {
          // Skip invalid dates
        }
      }
    });

    // Action item completion
    actionItems.forEach((item) => {
      if (item.status === "COMPLETED") {
        completedActions += 1;
      }
      const owner = item.owner || "unassigned";
      ownerCompletionMap[owner] = (ownerCompletionMap[owner] ?? 0) + 1;
    });

    // Attendance
    meetings.forEach((meeting) => {
      if (typeof meeting.attendance_count === "number") {
        totalAttendance += meeting.attendance_count;
        attendanceCount += 1;
      }
    });

    // Motions per meeting
    const motionsPerMeeting = motions.length / Math.max(meetings.length, 1);

    // Meeting frequency (days between oldest and newest)
    const meetingDates = meetings
      .map((m) => {
        try {
          return new Date(m.date || m.created_at).getTime();
        } catch {
          return null;
        }
      })
      .filter((d) => d !== null)
      .sort((a, b) => a - b);

    let frequencyDays = 0;
    if (meetingDates.length > 1) {
      const daysBetween =
        (meetingDates[meetingDates.length - 1] - meetingDates[0]) /
        (1000 * 60 * 60 * 24);
      frequencyDays = Math.round(daysBetween / (meetings.length - 1));
    }

    // Most active owners
    const mostActive = Object.entries(ownerCompletionMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([owner, count]) => ({
        owner,
        actions: count
      }));

    res.json({
      meetings_total: meetings.length,
      average_time_to_approval_days: approvalCount > 0 ? Math.round(totalApprovalDays / approvalCount * 10) / 10 : 0,
      action_item_completion_rate: totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0,
      average_meeting_attendance:
        attendanceCount > 0
          ? Math.round((totalAttendance / attendanceCount) * 10) / 10
          : 0,
      motions_per_meeting_avg: Math.round(motionsPerMeeting * 10) / 10,
      most_active_action_owners: mostActive,
      meeting_frequency_days: frequencyDays,
      data_points: {
        approval_samples: approvalCount,
        action_items_total: totalActions,
        attendance_samples: attendanceCount,
        motions_total: motions.length
      }
    });
  } catch (error) {
    next(error);
  }
});


/**
 * GET /analytics/governance-trends
 * Returns governance metrics grouped by time period (month/quarter)
 * Requires: council tier or higher
 * @returns {governance_trends} - Historical metrics by period
 */
router.get("/analytics/governance-trends", requireTier("council"), async (req, res, next) => {
  try {
    const db = initFirestore();

    // Fetch all meetings
    const meetingsSnap = await orgCollection(db, req.orgId, "meetings").get();
    const meetings = meetingsSnap.docs.map((doc) => doc.data());

    // Fetch all related data
    const motionsSnap = await orgCollection(db, req.orgId, "motions").get();
    const actionItemsSnap = await orgCollection(db, req.orgId, "actionItems").get();
    const kioskChatsSnap = await orgCollection(db, req.orgId, "kiosk_chats").get();

    const motions = motionsSnap.docs.map((doc) => doc.data());
    const actionItems = actionItemsSnap.docs.map((doc) => doc.data());
    const kioskChats = kioskChatsSnap.docs.map((doc) => doc.data());

    // Group data by month (YYYY-MM)
    const monthlyBuckets = {};

    meetings.forEach((meeting) => {
      const dateStr = meeting.date || meeting.created_at;
      if (dateStr) {
        const month = String(dateStr).slice(0, 7);
        if (!monthlyBuckets[month]) {
          monthlyBuckets[month] = {
            period: month,
            meetings_held: 0,
            motions_passed: 0,
            motions_total: 0,
            action_items: 0,
            ai_interactions: 0,
            anomaly: false
          };
        }
        monthlyBuckets[month].meetings_held += 1;
      }
    });

    motions.forEach((motion) => {
      const meetingId = motion.meeting_id;
      const meeting = meetings.find((m) => m.id === meetingId);
      if (meeting) {
        const dateStr = meeting.date || meeting.created_at;
        const month = String(dateStr).slice(0, 7);
        if (monthlyBuckets[month]) {
          monthlyBuckets[month].motions_total += 1;
          if (motion.outcome === "passed" || motion.outcome === "approved") {
            monthlyBuckets[month].motions_passed += 1;
          }
        }
      }
    });

    actionItems.forEach((action) => {
      const meetingId = action.meeting_id;
      const meeting = meetings.find((m) => m.id === meetingId);
      if (meeting) {
        const dateStr = meeting.date || meeting.created_at;
        const month = String(dateStr).slice(0, 7);
        if (monthlyBuckets[month]) {
          monthlyBuckets[month].action_items += 1;
        }
      }
    });

    kioskChats.forEach((chat) => {
      const dateStr = chat.timestamp;
      if (dateStr) {
        const month = String(dateStr).slice(0, 7);
        if (!monthlyBuckets[month]) {
          monthlyBuckets[month] = {
            period: month,
            meetings_held: 0,
            motions_passed: 0,
            motions_total: 0,
            action_items: 0,
            ai_interactions: 0,
            anomaly: false
          };
        }
        monthlyBuckets[month].ai_interactions += 1;
      }
    });

    const trends = annotateTrendAnomalies(
      Object.values(monthlyBuckets).sort((a, b) => a.period.localeCompare(b.period)).slice(-12)
    );

    res.json({
      period_type: "monthly",
      data: trends,
      total_periods: trends.length
    });
  } catch (error) {
    next(error);
  }
});

export default router;
