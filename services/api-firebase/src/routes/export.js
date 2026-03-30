/**
 * Data export routes - GDPR compliant
 * Allows users and admins to export their/org data
 */

import { Router } from "express";
import { initFirestore, serverTimestamp } from "../db/firestore.js";
import { orgCollection } from "../db/orgFirestore.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

const router = Router();

/**
 * GET /api/export/user-data
 * Export all data for the authenticated user
 * Returns: JSON object with user's data from their org
 */
router.get("/api/export/user-data", requireAuth, async (req, res, next) => {
  try {
    const db = initFirestore();
    const orgId = req.orgId;
    const userEmail = req.user?.email;

    if (!userEmail) {
      return res.status(400).json({ error: "User email not found in token" });
    }

    // Fetch user's meetings, action items, kiosk chats
    const [meetingsSnap, actionItemsSnap, kioskChatsSnap, membershipSnap] = await Promise.all([
      orgCollection(db, orgId, "meetings")
        .where("created_by", "==", userEmail)
        .get(),
      orgCollection(db, orgId, "actionItems")
        .where("owner", "==", userEmail)
        .get(),
      orgCollection(db, orgId, "kiosk_chats")
        .where("userId", "==", userEmail)
        .get(),
      orgCollection(db, orgId, "memberships")
        .doc(userEmail)
        .get()
    ]);

    // Compile export
    const exportData = {
      export_date: new Date().toISOString(),
      user: {
        email: userEmail,
        role: membershipSnap.exists ? membershipSnap.data()?.role : "unknown",
        org_id: orgId
      },
      meetings: meetingsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })),
      action_items: actionItemsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })),
      kiosk_chats: kioskChatsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))
    };

    // Log export for audit
    await orgCollection(db, orgId, "audit_logs").add({
      timestamp: serverTimestamp(),
      action: "user_data_exported",
      actor: userEmail,
      details: {
        meetings_count: meetingsSnap.size,
        actions_count: actionItemsSnap.size,
        chats_count: kioskChatsSnap.size
      }
    });

    // Set headers for file download
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="user-data-${userEmail}-${Date.now()}.json"`);

    res.json(exportData);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/export/org-data
 * Export full organization data (admin only)
 * Returns: JSON object with entire org's data
 */
router.get("/api/export/org-data", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const orgId = req.orgId;

    // Fetch all collections for the org
    const [
      meetingsSnap,
      actionItemsSnap,
      motionsSnap,
      membersSnap,
      kioskChatsSnap,
      settingsSnap,
      auditLogsSnap
    ] = await Promise.all([
      orgCollection(db, orgId, "meetings").get(),
      orgCollection(db, orgId, "actionItems").get(),
      orgCollection(db, orgId, "motions").get(),
      orgCollection(db, orgId, "memberships").get(),
      orgCollection(db, orgId, "kiosk_chats").get(),
      orgCollection(db, orgId, "settings").get(),
      orgCollection(db, orgId, "audit_logs").orderBy("timestamp", "desc").limit(1000).get()
    ]);

    // Compile complete org export
    const exportData = {
      export_date: new Date().toISOString(),
      org_id: orgId,
      exported_by: req.user?.email,
      data_summary: {
        total_meetings: meetingsSnap.size,
        total_actions: actionItemsSnap.size,
        total_motions: motionsSnap.size,
        total_members: membersSnap.size,
        total_ai_interactions: kioskChatsSnap.size,
        total_audit_records: auditLogsSnap.size
      },
      meetings: meetingsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })),
      action_items: actionItemsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })),
      motions: motionsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })),
      members: membersSnap.docs.map((doc) => ({
        email: doc.id,
        ...doc.data()
      })),
      kiosk_chats: kioskChatsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })),
      audit_logs: auditLogsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))
    };

    // Log the export
    await orgCollection(db, orgId, "audit_logs").add({
      timestamp: serverTimestamp(),
      action: "org_data_exported",
      actor: req.user?.email,
      details: {
        summary: exportData.data_summary
      }
    });

    // Set headers for file download
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="org-data-${orgId}-${Date.now()}.json"`);

    res.json(exportData);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/export/audit-report
 * Export audit logs with filtering (admin only)
 * Query parameters:
 *   - startDate: ISO8601 date (e.g., 2026-01-01)
 *   - endDate: ISO8601 date (e.g., 2026-03-31)
 *   - actorEmail: filter by actor email
 *   - eventType: filter by event type
 *   - format: "json" (default) or "csv"
 */
router.get("/api/export/audit-report", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const orgId = req.orgId;
    const startDate = req.query.startDate ? new Date(String(req.query.startDate)) : new Date(0);
    const endDate = req.query.endDate ? new Date(String(req.query.endDate)) : new Date();
    const actorEmail = req.query.actorEmail ? String(req.query.actorEmail) : null;
    const eventType = req.query.eventType ? String(req.query.eventType) : null;
    const format = req.query.format === "csv" ? "csv" : "json";

    // Build audit_logs query
    let query = orgCollection(db, orgId, "audit_logs");

    // Firestore doesn't support range queries well for timestamps, so fetch and filter
    const snapshot = await query.get();
    let records = snapshot.docs.map((doc) => ({
      id: doc.id,
      timestamp: doc.data().timestamp,
      action: doc.data().action || doc.data().event_type,
      actor: doc.data().actor || "system",
      details: doc.data().details || {},
      ...doc.data()
    }));

    // Apply date range filter
    records = records.filter((r) => {
      const timestamp = r.timestamp?.toDate?.() || new Date(r.timestamp);
      return timestamp >= startDate && timestamp <= endDate;
    });

    // Apply actor filter
    if (actorEmail) {
      records = records.filter((r) => r.actor === actorEmail);
    }

    // Apply event type filter
    if (eventType) {
      records = records.filter((r) => r.action === eventType || r.event_type === eventType);
    }

    // Sort by timestamp descending
    records.sort((a, b) => {
      const aTime = a.timestamp?.toDate?.() || new Date(a.timestamp);
      const bTime = b.timestamp?.toDate?.() || new Date(b.timestamp);
      return bTime - aTime;
    });

    // Count by event type
    const eventsByType = {};
    records.forEach((r) => {
      const type = r.action || r.event_type || "unknown";
      eventsByType[type] = (eventsByType[type] || 0) + 1;
    });

    if (format === "csv") {
      // Generate CSV
      const csv = generateAuditReportCsv(records);
      res.set({
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="audit-report-${orgId}-${Date.now()}.csv"`
      });
      return res.send(csv);
    }

    // JSON response
    const reportDate = new Date().toISOString();
    const report = {
      report_date: reportDate,
      org_id: orgId,
      exported_by: req.user?.email,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      filters: {
        actor_email: actorEmail,
        event_type: eventType
      },
      total_events: records.length,
      events_by_type: eventsByType,
      records
    };

    // Log the export
    await orgCollection(db, orgId, "audit_logs").add({
      timestamp: serverTimestamp(),
      action: "audit_report_exported",
      actor: req.user?.email,
      details: {
        total_events: records.length,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        actor_filter: actorEmail,
        event_type_filter: eventType
      }
    });

    res.set("Content-Type", "application/json");
    res.set("Content-Disposition", `attachment; filename="audit-report-${orgId}-${Date.now()}.json"`);
    res.json(report);
  } catch (error) {
    next(error);
  }
});

/**
 * Generate CSV from audit records
 * @param {array} records - Array of audit record objects
 * @returns {string} - CSV formatted string
 */
function generateAuditReportCsv(records) {
  const headers = ["timestamp", "action", "actor", "meeting_id", "details_summary"];
  const rows = records.map((r) => [
    (r.timestamp?.toDate?.() || new Date(r.timestamp)).toISOString(),
    r.action || r.event_type || "",
    r.actor || "",
    r.meeting_id || r.details?.meeting_id || "",
    JSON.stringify(r.details || {}).substring(0, 200)
  ]);

  // Escape CSV fields with commas or quotes
  const escapeCsvField = (field) => {
    const str = String(field || "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvLines = [
    headers.map(escapeCsvField).join(","),
    ...rows.map((row) => row.map(escapeCsvField).join(","))
  ];

  return csvLines.join("\n");
}

export default router;
