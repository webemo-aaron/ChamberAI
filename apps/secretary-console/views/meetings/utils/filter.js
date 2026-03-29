/**
 * Filter utilities for meetings list
 *
 * Pure, testable filter functions extracted from meeting-list.js:applyFilters()
 * No side effects — all functions return new arrays or filtered results.
 */

/**
 * Filter meetings by search term across location and topic
 * @param {Array} meetings - Meeting objects to search
 * @param {String} searchTerm - Search term (case-insensitive)
 * @returns {Array} Filtered meetings
 */
export function filterBySearch(meetings, searchTerm) {
  if (!searchTerm || !searchTerm.trim()) {
    return meetings;
  }

  const lower = searchTerm.toLowerCase();
  return meetings.filter((meeting) => {
    const location = (meeting.location || "").toLowerCase();
    const topic = (meeting.topic || "").toLowerCase();
    return location.includes(lower) || topic.includes(lower);
  });
}

/**
 * Filter meetings by status
 * @param {Array} meetings - Meeting objects to filter
 * @param {String} status - Status value to match (or "all" to skip filtering)
 * @returns {Array} Filtered meetings
 */
export function filterByStatus(meetings, status) {
  if (!status || status === "all") {
    return meetings;
  }

  return meetings.filter((m) => m.status === status);
}

/**
 * Apply all filters to a meetings list
 * Applies search and status filters in sequence.
 *
 * @param {Array} meetings - Full meeting dataset
 * @param {Object} options - Filter options
 * @param {String} options.search - Search term (optional)
 * @param {String} options.status - Status filter (optional, default "all")
 * @returns {Array} Filtered meetings
 */
export function applyMeetingsFilter(meetings, { search = "", status = "all" } = {}) {
  let filtered = meetings;

  // Apply search filter
  filtered = filterBySearch(filtered, search);

  // Apply status filter
  filtered = filterByStatus(filtered, status);

  return filtered;
}
