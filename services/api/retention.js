import { addAuditLog } from "./in_memory_db.js";
import { MeetingStatus } from "../../packages/shared/status.js";

export function runRetentionSweep(db, now = db.now()) {
  const retentionMs = db.config.retentionDays * 24 * 60 * 60 * 1000;
  const deleted = [];

  for (const [audioId, audio] of db.audioSources.entries()) {
    const meeting = db.meetings.get(audio.meeting_id);
    if (!meeting) continue;
    if (meeting.status === MeetingStatus.PROCESSING || meeting.status === MeetingStatus.DRAFT_READY) {
      continue;
    }
    if (meeting.status !== MeetingStatus.APPROVED) {
      continue;
    }

    const createdAt = new Date(audio.created_at).getTime();
    if (Number.isNaN(createdAt)) continue;

    if (now.getTime() - createdAt > retentionMs) {
      db.audioSources.delete(audioId);
      deleted.push({
        meeting_id: audio.meeting_id,
        audio_id: audioId,
        file_uri: audio.file_uri ?? null
      });

      addAuditLog(db, {
        meeting_id: audio.meeting_id,
        event_type: "AUDIO_DELETED_RETENTION",
        actor: "system",
        details: { audio_id: audioId }
      });
    }
  }

  if (deleted.length > 0) {
    addAuditLog(db, {
      meeting_id: "system",
      event_type: "RETENTION_SWEEP",
      actor: "system",
      details: {
        deleted_count: deleted.length,
        meeting_ids: Array.from(new Set(deleted.map((entry) => entry.meeting_id)))
      }
    });
  }

  return { deleted };
}
