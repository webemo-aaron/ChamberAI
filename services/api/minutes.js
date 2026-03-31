import { MeetingStatus } from "../../packages/shared/status.js";
import { addAuditLog, getDraftMinutes, setDraftMinutes, updateMeeting } from "./in_memory_db.js";

export function updateDraftMinutes(db, meetingId, payload = {}) {
  const content = payload.content ?? "";
  const existing = getDraftMinutes(db, meetingId);
  const currentVersion = Number(existing?.minutes_version ?? 0);
  const baseVersion = payload.base_version;

  if (baseVersion !== undefined && Number(baseVersion) !== currentVersion) {
    const error = new Error("Version conflict");
    error.status = 409;
    error.current_version = currentVersion;
    error.current_content = existing?.content ?? "";
    throw error;
  }

  const minutesVersion = currentVersion + 1;
  const versions = Array.isArray(existing?.versions) ? existing.versions : [];
  const nextEntry = {
    version: minutesVersion,
    content,
    updated_at: db.now().toISOString()
  };

  setDraftMinutes(db, meetingId, {
    content,
    minutes_version: minutesVersion,
    updated_at: nextEntry.updated_at,
    versions: [nextEntry, ...versions]
  });
  return getDraftMinutes(db, meetingId);
}

export function listDraftMinuteVersions(db, meetingId, options = {}) {
  const draft = getDraftMinutes(db, meetingId);
  const versions = Array.isArray(draft?.versions) ? draft.versions : [];
  const limitRaw = Number.parseInt(String(options.limit ?? "50"), 10);
  const offsetRaw = Number.parseInt(String(options.offset ?? "0"), 10);

  if (options.limit !== undefined && Number.isNaN(limitRaw)) {
    const error = new Error("limit must be a number");
    error.status = 400;
    throw error;
  }
  if (options.offset !== undefined && Number.isNaN(offsetRaw)) {
    const error = new Error("offset must be a number");
    error.status = 400;
    throw error;
  }

  const limit = Number.isNaN(limitRaw) ? 50 : Math.min(Math.max(limitRaw, 1), 100);
  const offset = Number.isNaN(offsetRaw) ? 0 : Math.max(offsetRaw, 0);
  const items = versions.slice(offset, offset + limit);
  const nextOffset = offset + items.length;
  const hasMore = nextOffset < versions.length;

  return {
    items,
    offset,
    limit,
    next_offset: hasMore ? nextOffset : null,
    has_more: hasMore,
    total: versions.length
  };
}

export function rollbackDraftMinutes(db, meetingId, version) {
  const targetVersion = Number(version ?? 0);
  if (!targetVersion) {
    const error = new Error("version required");
    error.status = 400;
    throw error;
  }

  const draft = getDraftMinutes(db, meetingId);
  const versions = Array.isArray(draft?.versions) ? draft.versions : [];
  const target = versions.find((entry) => Number(entry.version) === targetVersion);
  if (!target) {
    const error = new Error("Version not found");
    error.status = 404;
    throw error;
  }

  const currentVersion = Number(draft?.minutes_version ?? 0);
  const nextVersion = currentVersion + 1;
  const rolledBack = {
    content: target.content ?? "",
    minutes_version: nextVersion,
    updated_at: db.now().toISOString(),
    rolled_back_from_version: targetVersion,
    versions: [
      {
        version: nextVersion,
        content: target.content ?? "",
        updated_at: db.now().toISOString()
      },
      ...versions
    ]
  };
  setDraftMinutes(db, meetingId, rolledBack);
  addAuditLog(db, {
    meeting_id: meetingId,
    event_type: "MINUTES_ROLLBACK",
    actor: "system",
    details: { from_version: currentVersion, to_version: targetVersion }
  });
  return getDraftMinutes(db, meetingId);
}

export function approveMinutes(db, meetingId) {
  const validation = validateApproval(db, meetingId);
  if (!validation.ok) {
    const error = new Error("Approval blocked by validation rules");
    error.details = validation;
    throw error;
  }

  const meeting = updateMeeting(db, meetingId, {
    status: MeetingStatus.APPROVED,
    approved_at: db.now().toISOString()
  });

  addAuditLog(db, {
    meeting_id: meetingId,
    event_type: "MINUTES_APPROVED",
    actor: meeting.secretary_name ?? "Secretary",
    details: { meeting_id: meetingId }
  });

  return meeting;
}

export function exportMinutes(db, meetingId, format) {
  const meeting = db.meetings.get(meetingId);
  if (!meeting) {
    const error = new Error(`Meeting not found: ${meetingId}`);
    error.status = 404;
    throw error;
  }
  const exportId = `export_${meetingId}_${format}_${Date.now()}`;
  const fileUri = `exports/${meetingId}/${exportId}.${format}`;

  addAuditLog(db, {
    meeting_id: meetingId,
    event_type: "MINUTES_EXPORT",
    actor: meeting.secretary_name ?? "Secretary",
    details: { format, file_uri: fileUri }
  });

  return { id: exportId, format, file_uri: fileUri };
}

export function validateApproval(db, meetingId) {
  const meeting = db.meetings.get(meetingId);
  if (!meeting) {
    throw new Error(`Meeting not found: ${meetingId}`);
  }

  const motions = db.motions.get(meetingId) ?? [];
  const actionItems = db.actionItems.get(meetingId) ?? [];

  const hasMotions = motions.length > 0;
  const hasNoMotionsFlag = meeting.no_motions === true;
  const hasNoActionItemsFlag = meeting.no_action_items === true;
  const missingActionItemFields = actionItems.filter((item) => !item.owner_name || !item.due_date);
  const hasAdjournment = Boolean(meeting.end_time || meeting.adjournment_time);
  const hasAdjournmentFlag = meeting.no_adjournment_time === true;

  return {
    ok:
      (hasMotions || hasNoMotionsFlag) &&
      (missingActionItemFields.length === 0 || hasNoActionItemsFlag) &&
      (hasAdjournment || hasAdjournmentFlag),
    has_motions: hasMotions,
    no_motions_flag: hasNoMotionsFlag,
    missing_action_items: missingActionItemFields,
    no_action_items_flag: hasNoActionItemsFlag,
    has_adjournment_time: hasAdjournment,
    no_adjournment_time_flag: hasAdjournmentFlag
  };
}
