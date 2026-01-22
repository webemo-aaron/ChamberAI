import { MeetingStatus } from "../../packages/shared/status.js";
import { addAuditLog, getDraftMinutes, setDraftMinutes, updateMeeting } from "./in_memory_db.js";

export function updateDraftMinutes(db, meetingId, content) {
  const existing = getDraftMinutes(db, meetingId);
  const minutesVersion = existing?.minutes_version ?? 1;
  setDraftMinutes(db, meetingId, {
    content,
    minutes_version: minutesVersion,
    updated_at: db.now().toISOString()
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
  const draft = getDraftMinutes(db, meetingId);
  if (!draft) {
    throw new Error("Draft minutes not found");
  }
  const meeting = db.meetings.get(meetingId);
  if (!meeting) {
    throw new Error(`Meeting not found: ${meetingId}`);
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
