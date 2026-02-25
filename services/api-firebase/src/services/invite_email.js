export function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function isValidEmail(value) {
  const email = normalizeEmail(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function parseEnvInviteAllowedSenders(raw) {
  if (!raw) return [];
  return String(raw)
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter(Boolean);
}

export function mergeAuthorizedSenders(existing = [], additions = []) {
  const merged = new Set();
  existing.forEach((email) => {
    const normalized = normalizeEmail(email);
    if (normalized) merged.add(normalized);
  });
  additions.forEach((email) => {
    const normalized = normalizeEmail(email);
    if (normalized) merged.add(normalized);
  });
  return [...merged];
}

export function isAuthorizedInviteSender(userEmail, envAllowed = [], settingsAllowed = []) {
  const normalized = normalizeEmail(userEmail);
  if (!normalized) return false;
  const allowed = new Set(mergeAuthorizedSenders(envAllowed, settingsAllowed));
  return allowed.has(normalized);
}

export function buildInviteEmail(payload) {
  const chamberName = payload.chamberName?.trim() || "ChamberAI";
  const senderName = payload.senderName?.trim() || "ChamberAI Secretary";
  const recipientName = payload.recipientName?.trim() || "";
  const meetingTitle = payload.meetingTitle?.trim() || "upcoming chamber meeting";
  const inviteUrl = payload.inviteUrl?.trim() || "";
  const motionLink = payload.motionLink?.trim() || "";
  const note = payload.note?.trim() || "";

  const salutation = recipientName ? `Hi ${recipientName},` : "Hello,";
  const linkLine = inviteUrl ? `<p><a href="${inviteUrl}">View invitation details</a></p>` : "";
  const motionLine = motionLink ? `<p><a href="${motionLink}">Open Motion workspace</a></p>` : "";
  const noteLine = note ? `<p><strong>Note:</strong> ${note}</p>` : "";

  const subject = payload.subject?.trim() || `${chamberName} invitation: ${meetingTitle}`;
  const html = `
    <div>
      <p>${salutation}</p>
      <p>You are invited to ${meetingTitle} from ${chamberName}.</p>
      ${noteLine}
      ${linkLine}
      ${motionLine}
      <p>Sent by ${senderName}</p>
    </div>
  `.trim();

  return { subject, html };
}
