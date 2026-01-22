import { ActionItemStatus } from "../../packages/shared/status.js";
import { setActionItems } from "./in_memory_db.js";

export function updateActionItems(db, meetingId, items) {
  const normalized = items.map((item, index) => ({
    id: item.id ?? `action_${meetingId}_${index + 1}`,
    meeting_id: meetingId,
    description: item.description ?? "",
    owner_name: item.owner_name ?? null,
    due_date: item.due_date ?? null,
    status: item.status ?? ActionItemStatus.OPEN
  }));
  setActionItems(db, meetingId, normalized);
  return normalized;
}

export function listActionItems(db, meetingId) {
  return db.actionItems.get(meetingId) ?? [];
}
