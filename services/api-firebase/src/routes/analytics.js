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

    // Fetch related action items, motions, kiosk chats
    const actionItemsSnap = await orgCollection(db, req.orgId, "actionItems").get();
    const motionsSnap = await orgCollection(db, req.orgId, "motions").get();
    const draftMinutesSnap = await orgCollection(db, req.orgId, "draftMinutes").get();
    const kioskChatsSnap = await orgCollection(db, req.orgId, "kiosk_chats").get();

    const actionItems = actionItemsSnap.docs.map((doc) => doc.data());
    const motions = motionsSnap.docs.map((doc) => doc.data());
    const draftMinutes = draftMinutesSnap.docs.map((doc) => doc.data());
    const kioskChats = kioskChatsSnap.docs.map((doc) => doc.data());

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

    // Action item completion and open count
    let openActions = 0;
    actionItems.forEach((item) => {
      if (item.status === "COMPLETED") {
        completedActions += 1;
      } else {
        openActions += 1;
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
      completion_rate: totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0,
      open_action_items: openActions,
      ai_interactions: kioskChats.length,
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
        motions_total: motions.length,
        kiosk_chats_total: kioskChats.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /analytics/kiosk
 * Returns AI kiosk interaction metrics
 * Requires: council tier or higher
 * @returns {kiosk_metrics} - Chat and interaction counts
 */
router.get("/analytics/kiosk", requireTier("council"), async (req, res, next) => {
  try {
    const db = initFirestore();

    // Fetch kiosk chats
    const kioskChatsSnap = await orgCollection(db, req.orgId, "kiosk_chats").get();
    const kioskChats = kioskChatsSnap.docs.map((doc) => doc.data());

    if (kioskChats.length === 0) {
      return res.json({
        total_messages: 0,
        unique_users: 0,
        avg_tokens_per_message: 0,
        busiest_hour: null,
        top_providers: []
      });
    }

    // Calculate metrics
    const uniqueUsers = new Set(kioskChats.map((chat) => chat.userId)).size;
    let totalTokens = 0;
    const hourCounts = {};
    const providerCounts = {};

    kioskChats.forEach((chat) => {
      totalTokens += chat.tokensUsed ?? 0;

      // Hour analysis
      if (chat.timestamp) {
        try {
          const date =
            chat.timestamp instanceof Date ? chat.timestamp : new Date(chat.timestamp);
          const hour = date.getUTCHours();
          hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
        } catch (e) {
          // Skip invalid timestamps
        }
      }

      // Provider analysis
      if (chat.provider) {
        providerCounts[chat.provider] = (providerCounts[chat.provider] ?? 0) + 1;
      }
    });

    // Busiest hour
    let busiestHour = null;
    let maxCount = 0;
    for (const [hour, count] of Object.entries(hourCounts)) {
      if (count > maxCount) {
        maxCount = count;
        busiestHour = parseInt(hour);
      }
    }

    // Top providers
    const topProviders = Object.entries(providerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([provider, count]) => ({
        provider,
        messages: count
      }));

    res.json({
      total_messages: kioskChats.length,
      unique_users: uniqueUsers,
      avg_tokens_per_message:
        kioskChats.length > 0
          ? Math.round((totalTokens / kioskChats.length) * 10) / 10
          : 0,
      busiest_hour: busiestHour,
      top_providers: topProviders
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /analytics/compliance
 * Returns governance compliance metrics with real analysis
 * Requires: pro tier or higher
 * @returns {compliance_metrics} - Compliance scores and trends
 */
router.get("/analytics/compliance", requireTier("pro"), async (req, res, next) => {
  try {
    const db = initFirestore();

    // Fetch recent meetings, motions, and audit logs
    const meetingsSnap = await orgCollection(db, req.orgId, "meetings")
      .orderBy("date", "desc")
      .limit(50)
      .get();

    const meetings = meetingsSnap.docs.map((doc) => doc.data());

    if (meetings.length === 0) {
      const issueCategories = {
        missing_summary: 0,
        incomplete_attendance: 0,
        unapproved_minutes: 0,
        motions_without_seconds: 0
      };

      return res.json({
        avg_compliance_score: 0,
        scores_by_meeting: [],
        issues_by_category: issueCategories,
        common_issues: issueCategories
      });
    }

    // Analyze each meeting for compliance issues
    const scoresByMeeting = [];
    const issueCategories = {
      missing_summary: 0,
      incomplete_attendance: 0,
      unapproved_minutes: 0,
      motions_without_seconds: 0
    };

    // Get all motions for analysis
    const motionsSnap = await orgCollection(db, req.orgId, "motions").get();
    const motionsByMeeting = {};
    motionsSnap.docs.forEach((doc) => {
      const motion = doc.data();
      const meetingId = motion.meeting_id;
      if (!motionsByMeeting[meetingId]) motionsByMeeting[meetingId] = [];
      motionsByMeeting[meetingId].push(motion);
    });

    // Get draft minutes for approval status
    const draftMinutesSnap = await orgCollection(db, req.orgId, "draftMinutes").get();
    const minutesByMeeting = {};
    draftMinutesSnap.docs.forEach((doc) => {
      const minutes = doc.data();
      minutesByMeeting[minutes.meeting_id] = minutes;
    });

    for (const meeting of meetings) {
      let score = 100;

      // Check for missing public summary (-10)
      if (!meeting.public_summary_published && !meeting.publicSummary) {
        score -= 10;
        issueCategories.missing_summary += 1;
      }

      // Check for incomplete attendance (-5)
      if (!meeting.attendees || meeting.attendees.length === 0) {
        score -= 5;
        issueCategories.incomplete_attendance += 1;
      }

      // Check for unapproved minutes (-15)
      const minutes = minutesByMeeting[meeting.id];
      if (minutes && !minutes.approved_at) {
        score -= 15;
        issueCategories.unapproved_minutes += 1;
      }

      // Check for motions without seconds (-10 each)
      const meetingMotions = motionsByMeeting[meeting.id] || [];
      const motionsWithoutSeconds = meetingMotions.filter((m) => !m.seconder_name).length;
      if (motionsWithoutSeconds > 0) {
        score -= Math.min(10, motionsWithoutSeconds * 5);
        issueCategories.motions_without_seconds += motionsWithoutSeconds;
      }

      scoresByMeeting.push({
        meeting_id: meeting.id,
        meeting_date: meeting.date || meeting.created_at,
        compliance_score: Math.max(0, score)
      });
    }

    // Calculate average
    const avgScore =
      scoresByMeeting.length > 0
        ? Math.round(
            (scoresByMeeting.reduce((sum, m) => sum + m.compliance_score, 0) /
              scoresByMeeting.length) *
              10
          ) / 10
        : 0;

    res.json({
      avg_compliance_score: avgScore,
      scores_by_meeting: scoresByMeeting.slice(0, 10),  // Top 10 most recent
      issues_by_category: issueCategories,
      common_issues: issueCategories
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

    // Group meetings by month
    meetings.forEach((meeting) => {
      const dateStr = meeting.date || meeting.created_at;
      if (dateStr) {
        const month = String(dateStr).slice(0, 7); // YYYY-MM
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

    // Group motions by month and count passed
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

    // Group action items by month
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

    // Group kiosk chats by month
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

    // Sort by period and return last 12 months
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

/**
 * GET /analytics/meeting-quality
 * Returns quality scores for each meeting (0-100)
 * Score formula: attendance(30%) + motions(25%) + actions(25%) + minutes_speed(20%)
 * Requires: council tier or higher
 * @returns {meeting_quality} - Quality scores by meeting
 */
router.get("/analytics/meeting-quality", requireTier("council"), async (req, res, next) => {
  try {
    const db = initFirestore();

    // Fetch all meetings
    const meetingsSnap = await orgCollection(db, req.orgId, "meetings")
      .orderBy("date", "desc")
      .limit(50)
      .get();
    const meetings = meetingsSnap.docs.map((doc) => doc.data());

    if (meetings.length === 0) {
      return res.json({
        avg_quality_score: 0,
        scores_by_meeting: []
      });
    }

    // Fetch related data
    const motionsSnap = await orgCollection(db, req.orgId, "motions").get();
    const actionItemsSnap = await orgCollection(db, req.orgId, "actionItems").get();
    const draftMinutesSnap = await orgCollection(db, req.orgId, "draftMinutes").get();

    const motionsByMeeting = {};
    motionsSnap.docs.forEach((doc) => {
      const motion = doc.data();
      const meetingId = motion.meeting_id;
      if (!motionsByMeeting[meetingId]) motionsByMeeting[meetingId] = [];
      motionsByMeeting[meetingId].push(motion);
    });

    const actionsByMeeting = {};
    actionItemsSnap.docs.forEach((doc) => {
      const action = doc.data();
      const meetingId = action.meeting_id;
      if (!actionsByMeeting[meetingId]) actionsByMeeting[meetingId] = [];
      actionsByMeeting[meetingId].push(action);
    });

    const minutesByMeeting = {};
    draftMinutesSnap.docs.forEach((doc) => {
      const minutes = doc.data();
      minutesByMeeting[minutes.meeting_id] = minutes;
    });

    // Calculate quality score for each meeting
    const scores = meetings.map((meeting) => {
      let score = 0;
      const breakdown = {};

      // Attendance component (30%) - assume quorum of 5
      const attendanceScore = Math.min(
        100,
        ((meeting.attendance_count ?? 0) / 5) * 100
      );
      breakdown.attendance = Math.round(attendanceScore);
      score += attendanceScore * 0.3;

      // Motions component (25%) - success rate of passed motions
      const meetingMotions = motionsByMeeting[meeting.id] || [];
      let motionsScore = 100;
      if (meetingMotions.length > 0) {
        const passedCount = meetingMotions.filter(
          (m) => m.outcome === "passed" || m.outcome === "approved"
        ).length;
        motionsScore = Math.round((passedCount / meetingMotions.length) * 100);
      }
      breakdown.motions = motionsScore;
      score += motionsScore * 0.25;

      // Action items component (25%) - completion rate
      const meetingActions = actionsByMeeting[meeting.id] || [];
      let actionsScore = 100;
      if (meetingActions.length > 0) {
        const completedCount = meetingActions.filter(
          (a) => a.status === "COMPLETED"
        ).length;
        actionsScore = Math.round((completedCount / meetingActions.length) * 100);
      }
      breakdown.actions = actionsScore;
      score += actionsScore * 0.25;

      // Minutes approval speed component (20%)
      let minutesScore = 100;
      const minutes = minutesByMeeting[meeting.id];
      if (minutes && minutes.created_at && minutes.approved_at) {
        try {
          const created = new Date(minutes.created_at);
          const approved = new Date(minutes.approved_at);
          const daysDiff = (approved - created) / (1000 * 60 * 60 * 24);
          minutesScore = Math.max(0, 100 - Math.min(100, daysDiff * 10));
        } catch (e) {
          // If date parsing fails, assume perfect score
        }
      }
      breakdown.minutes_speed = Math.round(minutesScore);
      score += minutesScore * 0.2;

      return {
        meeting_id: meeting.id,
        meeting_date: meeting.date || meeting.created_at,
        quality_score: Math.round(score),
        breakdown
      };
    });

    // Calculate average
    const avgScore =
      scores.length > 0
        ? Math.round(
            (scores.reduce((sum, s) => sum + s.quality_score, 0) / scores.length) * 10
          ) / 10
        : 0;

    res.json({
      avg_quality_score: avgScore,
      scores_by_meeting: scores
    });
  } catch (error) {
    next(error);
  }
});

export default router;
