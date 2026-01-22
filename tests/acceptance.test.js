import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createInMemoryDb,
  createMeeting,
  registerAudioSource,
  startProcessing,
  getDraftMinutes,
  updateMeeting,
  approveMinutes,
  updateActionItems,
  runRetentionSweep
} from "../services/api/index.js";

function makeDbWithClock(startDate) {
  let current = new Date(startDate);
  const db = createInMemoryDb({ now: () => new Date(current) });
  return {
    db,
    setNow: (value) => {
      current = new Date(value);
    }
  };
}

test("processing pipeline produces draft minutes and DRAFT_READY status", () => {
  const { db } = makeDbWithClock("2026-01-10T10:00:00Z");
  const meeting = createMeeting(db, {
    date: "2026-01-10",
    start_time: "10:00",
    location: "Chamber Hall",
    chair_name: "Alex Chair",
    secretary_name: "Riley Secretary"
  });

  registerAudioSource(db, meeting.id, {
    type: "UPLOAD",
    file_uri: "meeting_good.wav",
    duration_seconds: 1200
  });

  const status = startProcessing(db, meeting.id);
  assert.equal(status.status, "DRAFT_READY");
  assert.ok(getDraftMinutes(db, meeting.id));
});

test("approval blocked when action items missing owner/due date", () => {
  const { db } = makeDbWithClock("2026-01-11T10:00:00Z");
  const meeting = createMeeting(db, {
    date: "2026-01-11",
    start_time: "10:00",
    location: "Chamber Hall",
    chair_name: "Alex Chair",
    secretary_name: "Riley Secretary"
  });

  registerAudioSource(db, meeting.id, {
    type: "UPLOAD",
    file_uri: "meeting_bad_crosstalk.wav",
    duration_seconds: 600
  });

  startProcessing(db, meeting.id);

  updateMeeting(db, meeting.id, {
    no_motions: true,
    no_adjournment_time: true
  });

  assert.throws(() => approveMinutes(db, meeting.id), (error) => {
    assert.equal(error.message, "Approval blocked by validation rules");
    assert.equal(error.details.missing_action_items.length, 1);
    return true;
  });

  updateActionItems(db, meeting.id, [
    {
      description: "Follow up on ambiguous vote.",
      owner_name: "Taylor Treasurer",
      due_date: "2026-02-01"
    }
  ]);

  const approved = approveMinutes(db, meeting.id);
  assert.equal(approved.status, "APPROVED");
});

test("retention deletes audio older than retention window for approved meetings", () => {
  const { db, setNow } = makeDbWithClock("2025-10-01T10:00:00Z");
  const meeting = createMeeting(db, {
    date: "2025-10-01",
    start_time: "10:00",
    location: "Chamber Hall"
  });

  registerAudioSource(db, meeting.id, {
    type: "UPLOAD",
    file_uri: "meeting_good.wav",
    duration_seconds: 1200
  });

  updateMeeting(db, meeting.id, { status: "APPROVED" });

  setNow("2026-01-01T10:00:00Z");

  const result = runRetentionSweep(db, new Date("2026-01-01T10:00:00Z"));
  assert.equal(result.deleted.length, 1);
});
