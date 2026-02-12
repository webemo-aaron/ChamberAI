/**
 * Reusable test data and fixtures
 * Used across unit tests and E2E tests
 */

export const fixtures = {
  // Valid meeting data
  validMeeting: {
    date: "2026-02-15",
    startTime: "18:00",
    location: "Chamber Hall",
    chair: "Alex Chair",
    secretary: "Riley Secretary",
    tags: "budget,annual",
  },

  // Invalid meeting data (missing required fields)
  invalidMeeting: {
    date: "",
    startTime: "",
    location: "",
    chair: "",
    secretary: "",
  },

  // Minimal meeting data
  minimalMeeting: {
    date: "2026-02-15",
    startTime: "18:00",
    location: "Chamber Hall",
    chair: "Alex",
    secretary: "Riley",
  },

  // Valid audio file metadata
  validAudio: {
    filename: "meeting-2026-02-15.mp3",
    duration: 3600,
    size: 52428800, // 50MB
    mimeType: "audio/mpeg",
  },

  // Invalid audio file metadata
  invalidAudio: {
    filename: "document.pdf",
    duration: 0,
    size: 1048576000, // 1GB - exceeds max
    mimeType: "application/pdf",
  },

  // Valid action item
  validActionItem: {
    description: "Prepare budget report",
    owner: "John Smith",
    dueDate: "2026-03-15",
  },

  // Invalid action item (missing required fields)
  invalidActionItem: {
    description: "",
    owner: "",
    dueDate: "",
  },

  // Valid motion
  validMotion: {
    text: "Approve FY2026 budget",
    mover: "Sarah Johnson",
    seconder: "Mike Davis",
    voteMethod: "voice",
    outcome: "PASSED",
  },

  // Invalid motion (missing required fields)
  invalidMotion: {
    text: "",
    mover: "",
    seconder: "",
    voteMethod: "",
    outcome: "",
  },

  // Valid motion with unanimous outcome
  unanimousMotion: {
    text: "Approve meeting minutes",
    mover: "Chair",
    seconder: "Secretary",
    voteMethod: "unanimous",
    outcome: "PASSED_UNANIMOUS",
  },

  // Valid public summary
  validPublicSummary: {
    title: "Board Meeting Highlights - February 2026",
    highlights:
      "Approved FY2026 budget, elected new board members, discussed community initiatives",
    impact: "These decisions will guide our governance for the next fiscal year",
    motions: "Motion to approve budget passed unanimously",
    actions: "Finance committee to present detailed budget breakdown at next meeting",
    attendance: "12 members present, 2 guests",
    cta: "Members invited to attend finance committee meeting next week",
  },

  // Valid test user
  testUser: {
    email: "secretary@chamber.local",
    role: "secretary",
    name: "Test Secretary",
  },

  // Admin test user
  adminUser: {
    email: "admin@chamber.local",
    role: "admin",
    name: "Test Admin",
  },

  // Viewer test user
  viewerUser: {
    email: "viewer@chamber.local",
    role: "viewer",
    name: "Test Viewer",
  },

  // Valid meeting status
  meetingStatuses: {
    CREATED: "CREATED",
    UPLOADED: "UPLOADED",
    PROCESSING: "PROCESSING",
    DRAFT_READY: "DRAFT_READY",
    APPROVED: "APPROVED",
  },

  // Meeting status transitions (valid sequences)
  validStatusTransitions: [
    { from: "CREATED", to: "UPLOADED" },
    { from: "UPLOADED", to: "PROCESSING" },
    { from: "PROCESSING", to: "DRAFT_READY" },
    { from: "DRAFT_READY", to: "APPROVED" },
  ],

  // Feature flags
  featureFlags: {
    publicSummary: {
      id: "public-summary",
      name: "Public Summary",
      description: "Enable public-facing meeting summaries",
      enabled: false,
    },
    memberSpotlight: {
      id: "member-spotlight",
      name: "Member Spotlight",
      description: "Feature member contributions in summaries",
      enabled: false,
    },
    analyticsDashboard: {
      id: "analytics-dashboard",
      name: "Analytics Dashboard",
      description: "Track meeting metrics and trends",
      enabled: false,
    },
  },

  // Settings
  defaultSettings: {
    retentionDays: 90,
    maxFileSize: 500, // MB
    maxDuration: 21600, // seconds
  },

  // API endpoints
  apiEndpoints: {
    meetings: "/meetings",
    audio: "/meetings/:id/audio",
    process: "/meetings/:id/process",
    approve: "/meetings/:id/approve",
    actionItems: "/meetings/:id/actions",
    motions: "/meetings/:id/motions",
    publicSummary: "/meetings/:id/public-summary",
    auditLog: "/meetings/:id/audit",
    retention: "/admin/retention-sweep",
  },

  // HTTP status codes
  httpStatus: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },

  // Error messages
  errorMessages: {
    MISSING_REQUIRED_FIELD: "Missing required field",
    INVALID_DATE: "Invalid date format",
    INVALID_FILE_TYPE: "Invalid file type",
    FILE_TOO_LARGE: "File exceeds maximum size",
    UNAUTHORIZED_ACCESS: "Unauthorized access",
    MEETING_NOT_FOUND: "Meeting not found",
    DUPLICATE_MOTION: "Motion already exists",
    INVALID_STATUS_TRANSITION: "Invalid status transition",
  },

  // Common test data patterns
  patterns: {
    // Email patterns
    validEmail: "test@chamber.local",
    invalidEmail: "not-an-email",

    // Date patterns
    todayDate: new Date().toISOString().split("T")[0],
    tomorrowDate: new Date(Date.now() + 86400000)
      .toISOString()
      .split("T")[0],
    pastDate: "2025-12-31",

    // Time patterns
    morningTime: "09:00",
    afternoonTime: "14:00",
    eveningTime: "18:00",

    // Duration patterns
    shortDuration: 600, // 10 minutes
    normalDuration: 3600, // 1 hour
    longDuration: 7200, // 2 hours
  },
};

/**
 * Helper function to create a meeting with default values
 * @param {Object} overrides - Properties to override defaults
 * @returns {Object} Meeting object
 */
export function createMeeting(overrides = {}) {
  return {
    ...fixtures.validMeeting,
    ...overrides,
  };
}

/**
 * Helper function to create an action item with default values
 * @param {Object} overrides - Properties to override defaults
 * @returns {Object} Action item object
 */
export function createActionItem(overrides = {}) {
  return {
    ...fixtures.validActionItem,
    ...overrides,
  };
}

/**
 * Helper function to create a motion with default values
 * @param {Object} overrides - Properties to override defaults
 * @returns {Object} Motion object
 */
export function createMotion(overrides = {}) {
  return {
    ...fixtures.validMotion,
    ...overrides,
  };
}

/**
 * Helper function to create a public summary with default values
 * @param {Object} overrides - Properties to override defaults
 * @returns {Object} Public summary object
 */
export function createPublicSummary(overrides = {}) {
  return {
    ...fixtures.validPublicSummary,
    ...overrides,
  };
}
