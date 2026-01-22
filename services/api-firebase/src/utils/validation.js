export function requireFields(body, fields) {
  const missing = fields.filter((field) => !body[field]);
  if (missing.length > 0) {
    const error = new Error(`Missing required fields: ${missing.join(", ")}`);
    error.status = 422;
    throw error;
  }
}

export function normalizeTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }
  return String(tags)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function parseOptionalNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}
