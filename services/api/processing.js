import { MeetingStatus } from "../../packages/shared/status.js";
import { updateMeeting } from "./in_memory_db.js";
import { runBatchPipeline } from "../worker/pipeline.js";

export function startProcessing(db, meetingId) {
  const meeting = updateMeeting(db, meetingId, { status: MeetingStatus.PROCESSING });

  try {
    runBatchPipeline(db, meetingId);
  } catch (error) {
    updateMeeting(db, meetingId, { status: meeting.status });
    throw error;
  }

  return getProcessStatus(db, meetingId);
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
