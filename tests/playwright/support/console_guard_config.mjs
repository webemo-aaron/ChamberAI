export const CONSOLE_GUARD_RULES = [
  { pattern: /Failed to load resource: the server responded with a status of 404 \(Not Found\)/, severity: "warn" },
  { pattern: /net::ERR_CONNECTION_RESET/, severity: "warn" },
  { pattern: /net::ERR_SOCKET_NOT_CONNECTED/, severity: "warn" },
  { pattern: /net::ERR_EMPTY_RESPONSE/, severity: "warn" },
  { pattern: /TypeError: Failed to fetch/, severity: "warn" }
];

export function getConsoleGuardMode() {
  return process.env.PLAYWRIGHT_CONSOLE_GUARD_MODE ?? "strict";
}
