import express from "express";
import { Document, Packer, Table, TableRow, TableCell, Paragraph, TextRun } from "docx";
import { initFirestore, serverTimestamp } from "../db/firestore.js";
import { orgCollection } from "../db/orgFirestore.js";
import { requireRole } from "../middleware/rbac.js";
import { requireTier } from "../middleware/requireTier.js";

const router = express.Router();

router.get("/meetings/:id/draft-minutes", async (req, res, next) => {
  try {
    const db = initFirestore();
    const doc = await orgCollection(db, req.orgId, "draftMinutes").doc(req.params.id).get();
    if (!doc.exists) return res.json(null);
    res.json(doc.data());
  } catch (error) {
    next(error);
  }
});

router.put("/meetings/:id/draft-minutes", requireRole("admin", "secretary"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const ref = orgCollection(db, req.orgId, "draftMinutes").doc(req.params.id);
    const snapshot = await ref.get();
    const existing = snapshot.exists ? snapshot.data() : null;
    const currentVersion = Number(existing?.minutes_version ?? 0);
    const baseVersion = req.body.base_version;

    if (baseVersion !== undefined && Number(baseVersion) !== currentVersion) {
      return res.status(409).json({
        error: "Version conflict",
        current_version: currentVersion,
        current_content: existing?.content ?? ""
      });
    }

    const nextVersion = currentVersion + 1;
    const draft = {
      meeting_id: req.params.id,
      content: req.body.content ?? "",
      minutes_version: nextVersion,
      updated_by: req.user?.email ?? "user",
      updated_at: serverTimestamp()
    };
    await ref.set(draft, { merge: true });
    await orgCollection(db, req.orgId, "draftMinuteVersions").add({
      meeting_id: req.params.id,
      version: nextVersion,
      content: draft.content,
      actor: req.user?.email ?? "user",
      created_at: serverTimestamp()
    });
    await orgCollection(db, req.orgId, "auditLogs").add({
      meeting_id: req.params.id,
      event_type: "MINUTES_VERSION_SAVED",
      actor: req.user?.email ?? "user",
      timestamp: serverTimestamp(),
      details: { version: nextVersion }
    });
    res.json(draft);
  } catch (error) {
    next(error);
  }
});

router.get("/meetings/:id/draft-minutes/versions", async (req, res, next) => {
  try {
    const db = initFirestore();
    const limitRaw = req.query.limit;
    const offsetRaw = req.query.offset;
    const limitParam = Number.parseInt(String(limitRaw ?? "50"), 10);
    const offsetParam = Number.parseInt(String(offsetRaw ?? "0"), 10);
    if (limitRaw !== undefined && Number.isNaN(limitParam)) {
      return res.status(400).json({ error: "limit must be a number" });
    }
    if (offsetRaw !== undefined && Number.isNaN(offsetParam)) {
      return res.status(400).json({ error: "offset must be a number" });
    }
    const limit = Number.isNaN(limitParam) ? 50 : Math.min(Math.max(limitParam, 1), 100);
    const offset = Number.isNaN(offsetParam) ? 0 : Math.max(offsetParam, 0);
    const snapshot = await orgCollection(db, req.orgId, "draftMinuteVersions").where("meeting_id", "==", req.params.id).get();
    const allVersions = snapshot.docs
      .map((doc) => doc.data())
      .sort((a, b) => Number(b.version ?? 0) - Number(a.version ?? 0));
    const items = allVersions.slice(offset, offset + limit);
    const nextOffset = offset + items.length;
    const hasMore = nextOffset < allVersions.length;
    res.json({
      items,
      offset,
      limit,
      next_offset: hasMore ? nextOffset : null,
      has_more: hasMore,
      total: allVersions.length
    });
  } catch (error) {
    next(error);
  }
});

router.post("/meetings/:id/draft-minutes/rollback", requireRole("admin", "secretary"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const targetVersion = Number(req.body.version ?? 0);
    if (!targetVersion) {
      return res.status(400).json({ error: "version required" });
    }

    const versionsSnap = await orgCollection(db, req.orgId, "draftMinuteVersions").where("meeting_id", "==", req.params.id).get();
    const target = versionsSnap.docs.map((doc) => doc.data()).find((entry) => Number(entry.version) === targetVersion);
    if (!target) {
      return res.status(404).json({ error: "Version not found" });
    }

    const draftRef = orgCollection(db, req.orgId, "draftMinutes").doc(req.params.id);
    const current = await draftRef.get();
    const currentVersion = Number(current.data()?.minutes_version ?? 0);
    const nextVersion = currentVersion + 1;
    const draft = {
      meeting_id: req.params.id,
      content: target.content ?? "",
      minutes_version: nextVersion,
      updated_by: req.user?.email ?? "user",
      rolled_back_from_version: targetVersion,
      updated_at: serverTimestamp()
    };
    await draftRef.set(draft, { merge: true });
    await orgCollection(db, req.orgId, "draftMinuteVersions").add({
      meeting_id: req.params.id,
      version: nextVersion,
      content: draft.content,
      actor: req.user?.email ?? "user",
      rollback_from_version: targetVersion,
      created_at: serverTimestamp()
    });
    await orgCollection(db, req.orgId, "auditLogs").add({
      meeting_id: req.params.id,
      event_type: "MINUTES_ROLLBACK",
      actor: req.user?.email ?? "user",
      timestamp: serverTimestamp(),
      details: { from_version: targetVersion, to_version: nextVersion }
    });
    res.json(draft);
  } catch (error) {
    next(error);
  }
});

router.post("/meetings/:id/export", requireRole("admin", "secretary"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const format = req.body.format ?? "pdf";

    // DOCX export requires Council tier or higher
    if (format === "docx") {
      const settingsDoc = await orgCollection(db, req.orgId, "settings").doc("system").get();
      const settings = settingsDoc.exists ? settingsDoc.data() : {};
      const currentTier = settings.subscription?.tier ?? "free";
      const tierLevels = { free: 0, pro: 1, council: 2, network: 3 };

      if ((tierLevels[currentTier] ?? 0) < 2) {
        return res.status(402).json({
          error: "Payment required",
          tier_required: "council",
          current_tier: currentTier,
          message: "DOCX export requires Council tier or higher"
        });
      }

      // Generate DOCX
      const meeting = await orgCollection(db, req.orgId, "meetings").doc(req.params.id).get();
      const draft = await orgCollection(db, req.orgId, "draftMinutes").doc(req.params.id).get();
      const actions = await orgCollection(db, req.orgId, "actionItems").where("meeting_id", "==", req.params.id).get();
      const motions = await orgCollection(db, req.orgId, "motions").where("meeting_id", "==", req.params.id).get();

      const meetingData = meeting.exists ? meeting.data() : {};
      const draftData = draft.exists ? draft.data() : {};
      const actionsList = actions.docs.map((doc) => doc.data());
      const motionsList = motions.docs.map((doc) => doc.data());

      // Build DOCX document
      const rows = [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph(new TextRun({ text: "Motion", bold: true }))]
            }),
            new TableCell({
              children: [new Paragraph(new TextRun({ text: "Status", bold: true }))]
            })
          ]
        }),
        ...motionsList.map(
          (motion) =>
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph(motion.description ?? "")]
                }),
                new TableCell({
                  children: [new Paragraph(motion.status ?? "PENDING")]
                })
              ]
            })
        )
      ];

      const actionRows = [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph(new TextRun({ text: "Action", bold: true }))]
            }),
            new TableCell({
              children: [new Paragraph(new TextRun({ text: "Owner", bold: true }))]
            }),
            new TableCell({
              children: [new Paragraph(new TextRun({ text: "Due", bold: true }))]
            })
          ]
        }),
        ...actionsList.map(
          (action) =>
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph(action.title ?? "")]
                }),
                new TableCell({
                  children: [new Paragraph(action.owner ?? "Unassigned")]
                }),
                new TableCell({
                  children: [new Paragraph(action.due_date ?? "")]
                })
              ]
            })
        )
      ];

      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                text: `Meeting Minutes: ${meetingData.date}`,
                heading: "Heading1"
              }),
              new Paragraph(`Location: ${meetingData.location}`),
              new Paragraph(`Chair: ${meetingData.chair_name || "Not recorded"}`),
              new Paragraph(""),
              new Paragraph({
                text: "Minutes",
                heading: "Heading2"
              }),
              new Paragraph(draftData.content || "(No minutes recorded)"),
              new Paragraph(""),
              new Paragraph({
                text: "Motions",
                heading: "Heading2"
              }),
              new Table({
                rows
              }),
              new Paragraph(""),
              new Paragraph({
                text: "Action Items",
                heading: "Heading2"
              }),
              new Table({
                rows: actionRows
              }),
              new Paragraph(""),
              new Paragraph({
                text: "Approval",
                heading: "Heading2"
              }),
              new Paragraph(`Approved by: ________________________     Date: ____________`)
            ]
          }
        ]
      });

      const buffer = await Packer.toBuffer(doc);
      res.set({
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="meeting-${req.params.id}.docx"`
      });

      await orgCollection(db, req.orgId, "auditLogs").add({
        meeting_id: req.params.id,
        event_type: "MINUTES_EXPORT",
        actor: req.user?.email ?? "user",
        timestamp: serverTimestamp(),
        details: { format, tier: currentTier }
      });

      return res.send(buffer);
    }

    // Standard export (PDF/Markdown)
    const file_uri = `exports/${req.params.id}/${Date.now()}.${format}`;
    await orgCollection(db, req.orgId, "auditLogs").add({
      meeting_id: req.params.id,
      event_type: "MINUTES_EXPORT",
      actor: req.user?.email ?? "user",
      timestamp: serverTimestamp(),
      details: { format, file_uri }
    });
    res.json({ format, file_uri });
  } catch (error) {
    next(error);
  }
});

export default router;
