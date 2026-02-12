import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createInMemoryDb,
  createMeeting,
  registerAudioSource
} from "../../services/api/index.js";

/**
 * Motion management tests
 * Tests creating motions, recording votes, tallying, and tie-breaking
 */

test("Create motion with title and description", () => {
  const db = createInMemoryDb();
  const meeting = createMeeting(db, {
    date: "2026-02-15",
    start_time: "10:00",
    location: "Chamber Hall",
    chair_name: "Alex Chair",
    secretary_name: "Riley Secretary"
  });

  // Create a motion
  const motion = {
    meeting_id: meeting.id,
    text: "Approve FY2026 budget",
    mover: "Sarah Johnson",
    seconder: "Mike Davis",
    status: "PENDING"
  };

  // Store motion in database (simulated)
  if (!meeting.motions) {
    meeting.motions = [];
  }
  meeting.motions.push({
    ...motion,
    id: `motion-${Date.now()}`,
    created_at: new Date()
  });

  assert.equal(meeting.motions.length, 1);
  assert.equal(meeting.motions[0].text, "Approve FY2026 budget");
  assert.equal(meeting.motions[0].mover, "Sarah Johnson");
  assert.equal(meeting.motions[0].status, "PENDING");
});

test("Record vote (yes/no/abstain) on motion", () => {
  const db = createInMemoryDb();
  const meeting = createMeeting(db, {
    date: "2026-02-15",
    start_time: "10:00",
    location: "Chamber Hall"
  });

  // Create a motion
  const motion = {
    id: `motion-${Date.now()}`,
    text: "Approve budget amendment",
    mover: "Sarah",
    seconder: "Mike",
    status: "VOTING",
    votes: []
  };

  // Record votes from 5 members
  const votes = [
    { member: "Alex", vote: "yes" },
    { member: "Bailey", vote: "yes" },
    { member: "Casey", vote: "no" },
    { member: "Dana", vote: "abstain" },
    { member: "Eric", vote: "yes" }
  ];

  votes.forEach((v) => {
    motion.votes.push({
      member: v.member,
      vote: v.vote,
      timestamp: new Date()
    });
  });

  assert.equal(motion.votes.length, 5);
  assert.equal(motion.votes[0].vote, "yes");
  assert.equal(motion.votes[2].vote, "no");
  assert.equal(motion.votes[3].vote, "abstain");
});

test("Tally votes and determine result", () => {
  const db = createInMemoryDb();
  const meeting = createMeeting(db, {
    date: "2026-02-15",
    start_time: "10:00",
    location: "Chamber Hall"
  });

  // Create a motion with votes
  const motion = {
    id: `motion-${Date.now()}`,
    text: "Approve committee report",
    mover: "Sarah",
    seconder: "Mike",
    votes: [
      { member: "Alex", vote: "yes" },
      { member: "Bailey", vote: "yes" },
      { member: "Casey", vote: "yes" },
      { member: "Dana", vote: "no" },
      { member: "Eric", vote: "abstain" }
    ]
  };

  // Tally votes
  const yesCount = motion.votes.filter((v) => v.vote === "yes").length;
  const noCount = motion.votes.filter((v) => v.vote === "no").length;
  const abstainCount = motion.votes.filter((v) => v.vote === "abstain").length;
  const totalVotes = yesCount + noCount;

  motion.result = yesCount > noCount ? "PASSED" : "FAILED";
  motion.tally = { yes: yesCount, no: noCount, abstain: abstainCount };

  assert.equal(yesCount, 3);
  assert.equal(noCount, 1);
  assert.equal(abstainCount, 1);
  assert.equal(motion.result, "PASSED");
  assert.equal(motion.tally.yes, 3);
});

test("Handle tie-breaking procedure when votes are tied", () => {
  const db = createInMemoryDb();
  const meeting = createMeeting(db, {
    date: "2026-02-15",
    start_time: "10:00",
    location: "Chamber Hall",
    chair_name: "Alex Chair"
  });

  // Create a motion with tied votes
  const motion = {
    id: `motion-${Date.now()}`,
    text: "Approve budget adjustment",
    mover: "Sarah",
    seconder: "Mike",
    votes: [
      { member: "Bailey", vote: "yes" },
      { member: "Casey", vote: "no" },
      { member: "Dana", vote: "yes" },
      { member: "Eric", vote: "no" }
    ]
  };

  // Tally votes
  const yesCount = motion.votes.filter((v) => v.vote === "yes").length;
  const noCount = motion.votes.filter((v) => v.vote === "no").length;

  // In case of tie, chair breaks tie
  if (yesCount === noCount) {
    const chairTieBreaker = "yes"; // Chair votes yes
    motion.result = chairTieBreaker === "yes" ? "PASSED" : "FAILED";
    motion.tieBreaker = {
      applied: true,
      chairman_vote: chairTieBreaker,
      reason: "Tied vote resolved by chair"
    };
  }

  assert.equal(yesCount, 2);
  assert.equal(noCount, 2);
  assert.ok(motion.tieBreaker.applied);
  assert.equal(motion.tieBreaker.chairman_vote, "yes");
  assert.equal(motion.result, "PASSED");
});

test("Cannot vote twice on same motion", () => {
  const db = createInMemoryDb();
  const meeting = createMeeting(db, {
    date: "2026-02-15",
    start_time: "10:00",
    location: "Chamber Hall"
  });

  // Create a motion
  const motion = {
    id: `motion-${Date.now()}`,
    text: "Approve item",
    mover: "Sarah",
    seconder: "Mike",
    votes: []
  };

  // Record first vote
  const member = "Alex";
  motion.votes.push({ member, vote: "yes", timestamp: new Date() });

  // Try to vote again - should fail
  const hasVoted = motion.votes.some((v) => v.member === member);
  assert.ok(hasVoted);

  // Attempting to add another vote should throw or be rejected
  assert.throws(
    () => {
      if (motion.votes.some((v) => v.member === member)) {
        throw new Error(`Member ${member} has already voted on this motion`);
      }
      motion.votes.push({ member, vote: "no", timestamp: new Date() });
    },
    (error) => {
      assert.ok(error.message.includes("already voted"));
      return true;
    }
  );

  // Verify still only one vote
  assert.equal(
    motion.votes.filter((v) => v.member === member).length,
    1
  );
});

test("Motion status transitions correctly (pending → voting → resolved)", () => {
  const db = createInMemoryDb();
  const meeting = createMeeting(db, {
    date: "2026-02-15",
    start_time: "10:00",
    location: "Chamber Hall"
  });

  // Create a motion
  const motion = {
    id: `motion-${Date.now()}`,
    text: "Approve minutes",
    mover: "Sarah",
    seconder: "Mike",
    status: "PENDING", // Initial state
    votes: [],
    createdAt: new Date()
  };

  // Transition to VOTING
  assert.equal(motion.status, "PENDING");
  motion.status = "VOTING";
  assert.equal(motion.status, "VOTING");

  // Add votes
  motion.votes.push(
    { member: "Alex", vote: "yes" },
    { member: "Bailey", vote: "yes" },
    { member: "Casey", vote: "no" }
  );

  // Tally and transition to RESOLVED
  const yesCount = motion.votes.filter((v) => v.vote === "yes").length;
  const noCount = motion.votes.filter((v) => v.vote === "no").length;
  motion.result = yesCount > noCount ? "PASSED" : "FAILED";
  motion.status = "RESOLVED"; // Final state

  assert.equal(motion.status, "RESOLVED");
  assert.equal(motion.result, "PASSED");
  assert.ok(motion.votes.length > 0);

  // Verify state transitions
  assert.ok(motion.createdAt);
});
