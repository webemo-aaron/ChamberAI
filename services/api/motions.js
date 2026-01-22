import { setMotions } from "./in_memory_db.js";

export function updateMotions(db, meetingId, motions) {
  const normalized = motions.map((motion, index) => ({
    id: motion.id ?? `motion_${meetingId}_${index + 1}`,
    meeting_id: meetingId,
    text: motion.text ?? "",
    mover_name: motion.mover_name ?? null,
    seconder_name: motion.seconder_name ?? null,
    vote_method: motion.vote_method ?? null,
    outcome: motion.outcome ?? null
  }));
  setMotions(db, meetingId, normalized);
  return normalized;
}

export function listMotions(db, meetingId) {
  return db.motions.get(meetingId) ?? [];
}
