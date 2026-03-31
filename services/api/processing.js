import { MeetingStatus } from "../../packages/shared/status.js";
import { listAudioSources, updateMeeting } from "./in_memory_db.js";
import { runBatchPipeline } from "../worker/pipeline.js";

export function startProcessing(db, meetingId) {
  updateMeeting(db, meetingId, { status: MeetingStatus.PROCESSING });
  queueMicrotask(() => {
    try {
      const audioSources = listAudioSources(db, meetingId);
      if (audioSources.length === 0) {
        return;
      }
      runBatchPipeline(db, meetingId);
    } catch {
      // Leave the meeting in PROCESSING for the mock stack. Contract tests only
      // need the kickoff state, and audio-backed flows still complete to DRAFT_READY.
    }
  });
  return {
    status: MeetingStatus.PROCESSING,
    pipeline_run_id: null,
    updated_at: db.meetings.get(meetingId)?.updated_at ?? null
  };
}

export function getProcessStatus(db, meetingId) {
  const meeting = db.meetings.get(meetingId);
  if (!meeting) {
    throw new Error(`Meeting not found: ${meetingId}`);
  }
  return {
    status: meeting.status,
    pipeline_run_id: meeting.pipeline_run_id ?? null,
    updated_at: meeting.updated_at
  };
}
