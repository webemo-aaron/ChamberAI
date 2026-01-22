import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MeetingStatus } from "../../packages/shared/status.js";
import {
  listAudioSources,
  setTranscriptSegments,
  setSpeakers,
  setMotions,
  setActionItems,
  setDraftMinutes,
  updateMeeting
} from "../api/in_memory_db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.resolve(__dirname, "../../fixtures");

export function runBatchPipeline(db, meetingId) {
  const audioSources = listAudioSources(db, meetingId);
  if (audioSources.length === 0) {
    throw new Error("No audio sources available for processing");
  }

  const fixtureName = selectFixture(audioSources);
  const fixturePath = path.join(fixturesDir, fixtureName);

  const expectedTranscript = readJson(path.join(fixturePath, "expected_transcript.json"));
  const expectedExtractions = readJson(path.join(fixturePath, "expected_extractions.json"));
  const expectedMinutes = fs.readFileSync(path.join(fixturePath, "expected_minutes.md"), "utf8");

  setTranscriptSegments(db, meetingId, expectedTranscript.segments);
  setSpeakers(db, meetingId, expectedTranscript.speakers);
  setMotions(db, meetingId, expectedExtractions.motions ?? []);
  setActionItems(db, meetingId, expectedExtractions.action_items ?? []);
  setDraftMinutes(db, meetingId, {
    content: expectedMinutes,
    minutes_version: expectedExtractions.minutes_version ?? 1,
    updated_at: db.now().toISOString()
  });

  updateMeeting(db, meetingId, {
    status: MeetingStatus.DRAFT_READY,
    pipeline_run_id: expectedExtractions.pipeline_run_id ?? `run_${meetingId}`
  });
}

function selectFixture(audioSources) {
  const hasBad = audioSources.some((source) => source.file_uri.includes("bad_crosstalk"));
  return hasBad ? "meeting_bad_crosstalk" : "meeting_good";
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}
