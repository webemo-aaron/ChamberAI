export async function loadSettings(request) {
  return request("/settings", "GET");
}

export async function saveSettings(request, patch) {
  return request("/settings", "PUT", patch);
}
