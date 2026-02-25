import express from "express";
import { initFirestore, serverTimestamp } from "../db/firestore.js";
import { requireRole } from "../middleware/rbac.js";
import {
  buildInviteEmail,
  isAuthorizedInviteSender,
  isValidEmail,
  mergeAuthorizedSenders,
  normalizeEmail,
  parseEnvInviteAllowedSenders
} from "../services/invite_email.js";

const router = express.Router();

function getResendConfig() {
  return {
    apiKey: process.env.RESEND_API_KEY ?? "",
    fromEmail: process.env.RESEND_FROM_EMAIL ?? "",
    apiBase: process.env.RESEND_API_BASE ?? "https://api.resend.com"
  };
}

async function getSystemSettings(db) {
  const doc = await db.collection("settings").doc("system").get();
  return doc.exists ? doc.data() : {};
}

router.get("/invites/authorized-senders", requireRole("admin", "secretary"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const settings = await getSystemSettings(db);
    const envAllowed = parseEnvInviteAllowedSenders(process.env.INVITE_ALLOWED_SENDERS);
    const settingsAllowed = Array.isArray(settings.emailInviteAuthorizedSenders) ? settings.emailInviteAuthorizedSenders : [];
    res.json({ authorizedSenders: mergeAuthorizedSenders(envAllowed, settingsAllowed) });
  } catch (error) {
    next(error);
  }
});

router.post("/invites/authorized-senders", requireRole("admin"), async (req, res, next) => {
  try {
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Valid email is required." });
    }

    const db = initFirestore();
    const settings = await getSystemSettings(db);
    const current = Array.isArray(settings.emailInviteAuthorizedSenders) ? settings.emailInviteAuthorizedSenders : [];
    const nextList = mergeAuthorizedSenders(current, [email]);

    await db.collection("settings").doc("system").set(
      {
        emailInviteAuthorizedSenders: nextList,
        updated_at: serverTimestamp()
      },
      { merge: true }
    );

    return res.status(201).json({ authorizedSenders: nextList });
  } catch (error) {
    next(error);
  }
});

router.post("/invites/send", requireRole("admin", "secretary"), async (req, res, next) => {
  try {
    const senderEmail = normalizeEmail(req.user?.email ?? "");
    const recipientEmail = normalizeEmail(req.body?.to);
    if (!isValidEmail(recipientEmail)) {
      return res.status(400).json({ error: "Valid recipient email is required." });
    }

    const config = getResendConfig();
    if (!config.apiKey || !config.fromEmail) {
      return res.status(503).json({ error: "Invite email is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL." });
    }

    const db = initFirestore();
    const settings = await getSystemSettings(db);
    const envAllowed = parseEnvInviteAllowedSenders(process.env.INVITE_ALLOWED_SENDERS);
    const settingsAllowed = Array.isArray(settings.emailInviteAuthorizedSenders) ? settings.emailInviteAuthorizedSenders : [];

    if (!isAuthorizedInviteSender(senderEmail, envAllowed, settingsAllowed)) {
      return res.status(403).json({ error: "Sender is not authorized to send invites." });
    }

    const inviteEmail = buildInviteEmail({
      chamberName: req.body?.chamberName,
      senderName: req.body?.senderName,
      recipientName: req.body?.recipientName,
      meetingTitle: req.body?.meetingTitle,
      inviteUrl: req.body?.inviteUrl,
      motionLink: req.body?.motionLink,
      note: req.body?.note,
      subject: req.body?.subject
    });

    const response = await fetch(`${config.apiBase.replace(/\/$/, "")}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: config.fromEmail,
        to: [recipientEmail],
        subject: inviteEmail.subject,
        html: inviteEmail.html,
        reply_to: senderEmail || undefined
      })
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(502).json({
        error: "Failed to send invite email.",
        resend: result
      });
    }

    const inviteDoc = await db.collection("invites").add({
      to: recipientEmail,
      from: config.fromEmail,
      sender_email: senderEmail,
      meeting_id: req.body?.meetingId ?? null,
      meeting_title: req.body?.meetingTitle ?? null,
      invite_url: req.body?.inviteUrl ?? null,
      motion_link: req.body?.motionLink ?? null,
      role_assigned: req.body?.role ?? "viewer",
      resend_id: result.id ?? null,
      status: "sent",
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });

    await db
      .collection("memberships")
      .doc(recipientEmail)
      .set(
        {
          email: recipientEmail,
          role: req.body?.role ?? "viewer",
          status: "active",
          source: "invite",
          invited_by: senderEmail,
          updated_at: serverTimestamp(),
          created_at: serverTimestamp()
        },
        { merge: true }
      );

    return res.status(202).json({ ok: true, inviteId: inviteDoc.id, resendId: result.id ?? null });
  } catch (error) {
    next(error);
  }
});

router.get("/invites", requireRole("admin", "secretary"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const snapshot = await db.collection("invites").orderBy("created_at", "desc").limit(100).get();
    const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(list);
  } catch (error) {
    next(error);
  }
});

router.get("/memberships", requireRole("admin"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const snapshot = await db.collection("memberships").limit(200).get();
    const list = snapshot.docs
      .map((doc) => doc.data())
      .sort((a, b) => String(a.email ?? "").localeCompare(String(b.email ?? "")));
    res.json(list);
  } catch (error) {
    next(error);
  }
});

router.patch("/memberships/:email", requireRole("admin"), async (req, res, next) => {
  try {
    const email = normalizeEmail(req.params.email);
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Valid membership email is required." });
    }

    const nextRole = req.body?.role;
    const nextStatus = req.body?.status;
    if (nextRole && !["admin", "secretary", "viewer"].includes(nextRole)) {
      return res.status(400).json({ error: "Invalid role." });
    }
    if (nextStatus && !["active", "disabled"].includes(nextStatus)) {
      return res.status(400).json({ error: "Invalid status." });
    }

    const patch = { updated_at: serverTimestamp() };
    if (nextRole) patch.role = nextRole;
    if (nextStatus) patch.status = nextStatus;
    if (Object.keys(patch).length === 1) {
      return res.status(400).json({ error: "No membership fields to update." });
    }

    const db = initFirestore();
    await db.collection("memberships").doc(email).set(patch, { merge: true });
    const doc = await db.collection("memberships").doc(email).get();
    return res.json(doc.data());
  } catch (error) {
    next(error);
  }
});

router.get("/memberships/me", requireRole("admin", "secretary", "viewer"), async (req, res, next) => {
  try {
    const email = normalizeEmail(req.user?.email ?? "");
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Authenticated email is invalid." });
    }
    const db = initFirestore();
    const doc = await db.collection("memberships").doc(email).get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Membership not found." });
    }
    return res.json(doc.data());
  } catch (error) {
    next(error);
  }
});

export default router;
