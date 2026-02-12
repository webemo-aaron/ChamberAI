import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createInMemoryDb,
  createMeeting,
  getMeeting,
  registerAudioSource,
  updateMeeting,
  listAudioSources,
  updateConfig
} from "../../services/api/index.js";

/**
 * Edge cases and boundary condition tests
 * Tests unusual but valid scenarios that could break the system
 */

test("Meeting created successfully with minimal fields", () => {
  const db = createInMemoryDb();
  const meeting = createMeeting(db, {
    date: "2026-02-15",
    start_time: "10:00",
    location: "Chamber Hall"
  });

  // Meeting created without optional chair/secretary fields
  assert.ok(meeting.id);
  assert.equal(meeting.status, "CREATED");
  assert.equal(meeting.location, "Chamber Hall");
  assert.equal(meeting.chair_name, null);
  assert.equal(meeting.secretary_name, null);
});

test("Audio source at maximum allowed duration", () => {
  const db = createInMemoryDb();
  const meeting = createMeeting(db, {
    date: "2026-02-15",
    start_time: "10:00",
    location: "Chamber Hall"
  });

  // Register audio at exactly the max duration (4 hours = 14400 seconds)
  const maxDuration = db.config.maxDurationSeconds;
  const audio = registerAudioSource(db, meeting.id, {
    type: "UPLOAD",
    file_uri: "meeting.wav",
    duration_seconds: maxDuration
  });

  assert.ok(audio);
  assert.equal(audio.duration_seconds, maxDuration);

  // Verify meeting status updated to UPLOADED
  const updated = getMeeting(db, meeting.id);
  assert.equal(updated.status, "UPLOADED");
});

test("Special characters in location and names handled correctly", () => {
  const db = createInMemoryDb();
  const specialText = "Room 2B™ - \"Executive\" Suite & Lounge";

  const meeting = createMeeting(db, {
    date: "2026-02-15",
    start_time: "10:00",
    location: specialText,
    chair_name: specialText,
    secretary_name: specialText
  });

  assert.ok(meeting.id);
  assert.equal(meeting.location, specialText);
  assert.equal(meeting.chair_name, specialText);
  assert.equal(meeting.secretary_name, specialText);
});

test("Meeting status changes are persisted correctly", () => {
  const db = createInMemoryDb();
  const meeting = createMeeting(db, {
    date: "2026-02-15",
    start_time: "10:00",
    location: "Chamber Hall"
  });

  // Register audio (changes status to UPLOADED)
  registerAudioSource(db, meeting.id, {
    type: "UPLOAD",
    file_uri: "meeting.wav",
    duration_seconds: 3600
  });

  let current = getMeeting(db, meeting.id);
  assert.equal(current.status, "UPLOADED");

  // Update to DRAFT_READY
  const draft = updateMeeting(db, meeting.id, { status: "DRAFT_READY" });
  assert.equal(draft.status, "DRAFT_READY");

  // Verify persistence
  current = getMeeting(db, meeting.id);
  assert.equal(current.status, "DRAFT_READY");
});

test("Multiple audio sources can be registered for single meeting", () => {
  const db = createInMemoryDb();
  const meeting = createMeeting(db, {
    date: "2026-02-15",
    start_time: "10:00",
    location: "Chamber Hall"
  });

  // Register 3 different audio sources
  const sources = [];
  for (let i = 0; i < 3; i++) {
    const source = registerAudioSource(db, meeting.id, {
      type: "UPLOAD",
      file_uri: `segment_${i + 1}.wav`,
      duration_seconds: 1200
    });
    sources.push(source);
  }

  assert.equal(sources.length, 3);

  // Verify all sources are stored
  const stored = listAudioSources(db, meeting.id);
  assert.equal(stored.length, 3);

  // Verify each source is unique
  const ids = stored.map((s) => s.id);
  assert.equal(new Set(ids).size, 3);
});

test("Meeting tags are normalized and preserved", () => {
  const db = createInMemoryDb();

  // Create meeting with various tag formats
  const meeting1 = createMeeting(db, {
    date: "2026-02-15",
    start_time: "10:00",
    location: "Hall",
    tags: "budget, annual, special"
  });

  assert.deepEqual(meeting1.tags, ["budget", "annual", "special"]);

  // Update tags with different format
  const updated = updateMeeting(db, meeting1.id, {
    tags: ["finance", "review"]
  });

  assert.deepEqual(updated.tags, ["finance", "review"]);

  // Verify persistence
  const current = getMeeting(db, meeting1.id);
  assert.deepEqual(current.tags, ["finance", "review"]);
});

test("Configuration limits can be adjusted and applied", () => {
  const db = createInMemoryDb();
  const originalMax = db.config.maxDurationSeconds;

  // Update config to allow longer audio
  updateConfig(db, { maxDurationSeconds: 28800 }); // 8 hours
  assert.equal(db.config.maxDurationSeconds, 28800);

  const meeting = createMeeting(db, {
    date: "2026-02-15",
    start_time: "10:00",
    location: "Hall"
  });

  // Can now register longer audio
  const audio = registerAudioSource(db, meeting.id, {
    type: "UPLOAD",
    file_uri: "marathon.wav",
    duration_seconds: 28800
  });

  assert.ok(audio);
  assert.equal(audio.duration_seconds, 28800);

  // Restore original config
  updateConfig(db, { maxDurationSeconds: originalMax });
  assert.equal(db.config.maxDurationSeconds, originalMax);
});
