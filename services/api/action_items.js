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

export function listMeetingActions(db, meetingId) {
  return listActionItems(db, meetingId).map(mapStoredActionItemToMeetingAction);
}

export function createMeetingAction(db, meetingId, action) {
  const items = listActionItems(db, meetingId);
  const created = normalizeMeetingActionInput(action, meetingId, items.length + 1);
  setActionItems(db, meetingId, [...items, created]);
  return mapStoredActionItemToMeetingAction(created);
}

export function updateMeetingAction(db, meetingId, actionId, patch) {
  const items = listActionItems(db, meetingId);
  const index = items.findIndex((item) => String(item.id) === String(actionId));
  if (index === -1) {
    throw new Error(`Action item not found: ${actionId}`);
  }

  const updated = normalizeMeetingActionInput(
    { ...mapStoredActionItemToMeetingAction(items[index]), ...patch, id: actionId },
    meetingId,
    index + 1
  );
  items[index] = updated;
  setActionItems(db, meetingId, items);
  return mapStoredActionItemToMeetingAction(updated);
}

export function deleteMeetingAction(db, meetingId, actionId) {
  const items = listActionItems(db, meetingId);
  const remaining = items.filter((item) => String(item.id) !== String(actionId));
  setActionItems(db, meetingId, remaining);
  return { ok: true };
}

export function importMeetingActionsFromCsv(db, meetingId, csvText) {
  const rows = parseCsvRows(csvText);
  const header = rows.shift() ?? [];
  const columns = header.map((value) => String(value).trim().toLowerCase());

  const items = rows
    .filter((row) => row.some((value) => String(value).trim()))
    .map((row, index) => {
      const record = Object.fromEntries(columns.map((column, columnIndex) => [column, row[columnIndex] ?? ""]));
      return normalizeMeetingActionInput(
        {
          description: record.description,
          assignee: record.owner_name,
          dueDate: record.due_date,
          status: normalizeImportedStatus(record.status)
        },
        meetingId,
        index + 1
      );
    });

  setActionItems(db, meetingId, items);
  return { items: items.map(mapStoredActionItemToMeetingAction) };
}

export function exportMeetingActionsCsv(db, meetingId) {
  const header = ["description", "owner_name", "due_date", "status"];
  const lines = [header.join(",")];
  listActionItems(db, meetingId).forEach((item) => {
    lines.push([
      escapeCsv(item.description ?? ""),
      escapeCsv(item.owner_name ?? ""),
      escapeCsv(item.due_date ?? ""),
      escapeCsv(item.status ?? "")
    ].join(","));
  });
  return lines.join("\n");
}

function normalizeMeetingActionInput(action, meetingId, ordinal) {
  return {
    id: action.id ?? `action_${meetingId}_${ordinal}`,
    meeting_id: meetingId,
    description: action.description ?? "",
    owner_name: action.assignee ?? action.owner_name ?? null,
    due_date: action.dueDate ?? action.due_date ?? null,
    status: normalizeImportedStatus(action.status ?? ActionItemStatus.OPEN)
  };
}

function mapStoredActionItemToMeetingAction(item) {
  return {
    id: item.id,
    meetingId: item.meeting_id,
    description: item.description ?? "",
    assignee: item.owner_name ?? "",
    dueDate: item.due_date ?? "",
    status: normalizeImportedStatus(item.status ?? ActionItemStatus.OPEN)
  };
}

function normalizeImportedStatus(status) {
  const value = String(status ?? "").trim().toLowerCase().replace(/_/g, "-");
  if (!value || value === "open") return "not-started";
  if (value === "in progress") return "in-progress";
  if (value === "completed") return "completed";
  return value;
}

function parseCsvRows(csvText) {
  return String(csvText)
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(",").map((value) => value.replace(/^"|"$/g, "").trim()));
}

function escapeCsv(value) {
  const text = String(value);
  if (text.includes("\"")) {
    return `"${text.replace(/\"/g, "\"\"")}"`;
  }
  if (text.includes(",") || text.includes("\n")) {
    return `"${text}"`;
  }
  return text;
}
