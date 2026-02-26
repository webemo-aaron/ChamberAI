import { loadSettings, saveSettings } from "./settings.js";
import { FEATURE_FLAGS, defaultFlags } from "./modules.js";

const apiBaseInput = document.getElementById("apiBase");
const saveApiBaseBtn = document.getElementById("saveApiBase");
const refreshBtn = document.getElementById("refreshMeetings");
const quickCreateBtn = document.getElementById("quickCreate");
const seedDemoBtn = document.getElementById("seedDemo");
const createBtn = document.getElementById("createMeeting");
const newTags = document.getElementById("newTags");
const newMeetingError = document.getElementById("newMeetingError");
const meetingList = document.getElementById("meetingList");
const meetingEmpty = document.getElementById("meetingEmpty");
const meetingCount = document.getElementById("meetingCount");
const meetingStatus = document.getElementById("meetingStatus");
const meetingMeta = document.getElementById("meetingMeta");
const metaEndTime = document.getElementById("metaEndTime");
const metaTags = document.getElementById("metaTags");
const flagNoMotions = document.getElementById("flagNoMotions");
const flagNoActionItems = document.getElementById("flagNoActionItems");
const flagNoAdjournment = document.getElementById("flagNoAdjournment");
const saveMetaBtn = document.getElementById("saveMeta");
const registerAudioBtn = document.getElementById("registerAudio");
const pickFileBtn = document.getElementById("pickFile");
const fileInput = document.getElementById("fileInput");
const dropzone = document.getElementById("dropzone");
const fileMeta = document.getElementById("fileMeta");
const fileHint = document.getElementById("fileHint");
const audioDuration = document.getElementById("audioDuration");
const audioSourcesList = document.getElementById("audioSources");
const processBtn = document.getElementById("processMeeting");
const approveBtn = document.getElementById("approveMeeting");
const saveMinutesBtn = document.getElementById("saveMinutes");
const minutesContent = document.getElementById("minutesContent");
const collabStatus = document.getElementById("collabStatus");
const versionHistoryList = document.getElementById("versionHistoryList");
const versionHistoryPrev = document.getElementById("versionHistoryPrev");
const versionHistoryNext = document.getElementById("versionHistoryNext");
const versionHistoryPage = document.getElementById("versionHistoryPage");
const actionDescription = document.getElementById("actionDescription");
const actionOwner = document.getElementById("actionOwner");
const actionDue = document.getElementById("actionDue");
const addActionBtn = document.getElementById("addActionItem");
const actionItemsList = document.getElementById("actionItemsList");
const auditLog = document.getElementById("auditLog");
const approvalWarnings = document.getElementById("approvalWarnings");
const motionWarnings = document.getElementById("motionWarnings");
const motionGate = document.getElementById("motionGate");
const actionGate = document.getElementById("actionGate");
const adjournmentGate = document.getElementById("adjournmentGate");
const flagNoAdjournmentInline = document.getElementById("flagNoAdjournmentInline");
const saveAdjournmentFlag = document.getElementById("saveAdjournmentFlag");
const exportActionCsv = document.getElementById("exportActionCsv");
const importActionCsv = document.getElementById("importActionCsv");
const actionCsvInput = document.getElementById("actionCsvInput");
const csvPreviewModal = document.getElementById("csvPreviewModal");
const csvPreviewTable = document.getElementById("csvPreviewTable");
const csvApply = document.getElementById("csvApply");
const csvCancel = document.getElementById("csvCancel");
const csvSkipInvalid = document.getElementById("csvSkipInvalid");
const csvPreviewNote = document.getElementById("csvPreviewNote");

const tabs = document.querySelectorAll(".tab");
const tabMinutes = document.getElementById("tab-minutes");
const tabActions = document.getElementById("tab-actions");
const tabAudit = document.getElementById("tab-audit");
const tabMotions = document.getElementById("tab-motions");
const tabPublicSummary = document.getElementById("tab-public-summary");
const publicSummaryTab = document.getElementById("publicSummaryTab");

const motionText = document.getElementById("motionText");
const motionMover = document.getElementById("motionMover");
const motionSeconder = document.getElementById("motionSeconder");
const motionVote = document.getElementById("motionVote");
const motionOutcome = document.getElementById("motionOutcome");
const addMotionBtn = document.getElementById("addMotion");
const motionsList = document.getElementById("motionsList");
const exportPdfBtn = document.getElementById("exportPdf");
const exportDocxBtn = document.getElementById("exportDocx");
const exportMinutesMd = document.getElementById("exportMinutesMd");
const publicSummaryTitle = document.getElementById("publicSummaryTitle");
const publicSummaryHighlights = document.getElementById("publicSummaryHighlights");
const publicSummaryImpact = document.getElementById("publicSummaryImpact");
const publicSummaryMotions = document.getElementById("publicSummaryMotions");
const publicSummaryActions = document.getElementById("publicSummaryActions");
const publicSummaryAttendance = document.getElementById("publicSummaryAttendance");
const publicSummaryCTA = document.getElementById("publicSummaryCTA");
const publicSummaryNotes = document.getElementById("publicSummaryNotes");
const publicSummaryContent = document.getElementById("publicSummaryContent");
const savePublicSummary = document.getElementById("savePublicSummary");
const composePublicSummary = document.getElementById("composePublicSummary");
const generatePublicSummary = document.getElementById("generatePublicSummary");
const publishPublicSummary = document.getElementById("publishPublicSummary");
const publicSummaryPublishStatus = document.getElementById("publicSummaryPublishStatus");
const publicSummaryReady = document.getElementById("publicSummaryReady");
const summaryNoConfidential = document.getElementById("summaryNoConfidential");
const summaryNamesApproved = document.getElementById("summaryNamesApproved");
const summaryMotionsReviewed = document.getElementById("summaryMotionsReviewed");
const summaryActionsReviewed = document.getElementById("summaryActionsReviewed");
const summaryChairApproved = document.getElementById("summaryChairApproved");
const exportResults = document.getElementById("exportResults");
const exportHistory = document.getElementById("exportHistory");
const approvalChecklist = document.getElementById("approvalChecklist");
const exportLatestOnly = document.getElementById("exportLatestOnly");
const exportGroup = document.getElementById("exportGroup");
const onboardingBanner = document.getElementById("onboardingBanner");
const dismissBanner = document.getElementById("dismissBanner");
const roleBadge = document.getElementById("roleBadge");
const authCycleStatus = document.getElementById("authCycleStatus");
const logoutBtn = document.getElementById("logout");
const loginModal = document.getElementById("loginModal");
const loginEmail = document.getElementById("loginEmail");
const loginRole = document.getElementById("loginRole");
const loginSubmit = document.getElementById("loginSubmit");
const loginGoogle = document.getElementById("loginGoogle");
const quickModal = document.getElementById("quickModal");
const tagFilter = document.getElementById("tagFilter");
const meetingSearch = document.getElementById("meetingSearch");
const advancedSearchQuery = document.getElementById("advancedSearchQuery");
const advancedSearchBtn = document.getElementById("advancedSearchBtn");
const advancedSearchReset = document.getElementById("advancedSearchReset");
const clearFilters = document.getElementById("clearFilters");
const clearExportHistory = document.getElementById("clearExportHistory");
const tagChips = document.getElementById("tagChips");
const statusFilter = document.getElementById("statusFilter");
const recentFilter = document.getElementById("recentFilter");
const quickLocation = document.getElementById("quickLocation");
const quickChair = document.getElementById("quickChair");
const quickSecretary = document.getElementById("quickSecretary");
const quickTags = document.getElementById("quickTags");
const quickSubmit = document.getElementById("quickSubmit");
const quickCancel = document.getElementById("quickCancel");
const settingRetention = document.getElementById("settingRetention");
const settingMaxSize = document.getElementById("settingMaxSize");
const settingMaxDuration = document.getElementById("settingMaxDuration");
const saveSettingsBtn = document.getElementById("saveSettings");
const settingsStatus = document.getElementById("settingsStatus");
const runRetentionSweep = document.getElementById("runRetentionSweep");
const retentionResult = document.getElementById("retentionResult");
const toast = document.getElementById("toast");
const featureFlagsEl = document.getElementById("featureFlags");
const settingsInviteDisclosure = document.getElementById("settingsInviteDisclosure");
const settingsMotionDisclosure = document.getElementById("settingsMotionDisclosure");
const inviteAuthorizedEmail = document.getElementById("inviteAuthorizedEmail");
const inviteAuthorizeSender = document.getElementById("inviteAuthorizeSender");
const inviteAuthorizedList = document.getElementById("inviteAuthorizedList");
const inviteRecipientEmail = document.getElementById("inviteRecipientEmail");
const inviteMeetingTitle = document.getElementById("inviteMeetingTitle");
const inviteMotionLink = document.getElementById("inviteMotionLink");
const inviteMotionSource = document.getElementById("inviteMotionSource");
const inviteJoinLink = document.getElementById("inviteJoinLink");
const inviteNote = document.getElementById("inviteNote");
const inviteSendBtn = document.getElementById("inviteSendBtn");
const inviteRefreshBtn = document.getElementById("inviteRefreshBtn");
const inviteStatus = document.getElementById("inviteStatus");
const motionEnabled = document.getElementById("motionEnabled");
const motionApiKey = document.getElementById("motionApiKey");
const motionWorkspaceId = document.getElementById("motionWorkspaceId");
const motionProjectId = document.getElementById("motionProjectId");
const motionLinkTemplate = document.getElementById("motionLinkTemplate");
const motionSaveBtn = document.getElementById("motionSaveBtn");
const motionTestBtn = document.getElementById("motionTestBtn");
const motionStatus = document.getElementById("motionStatus");

let meetings = [];
let selectedMeetingId = null;
let actionItems = [];
let selectedFile = null;
let motions = [];
let approvalStatus = null;
let motionEditIndex = null;
let activeTagFilter = "";
let searchQuery = "";
let statusQuery = "";
let recentDays = "";
let pendingCsvItems = [];
let currentRole = localStorage.getItem("camRole") || "";
let featureFlags = defaultFlags();
let settingsSyncVersion = 0;
let currentMinutesVersion = 0;
let minutesSyncTimer = null;
let minutesAutosaveTimer = null;
let startupRetriesInProgress = false;
let versionHistoryOffset = 0;
const versionHistoryLimit = 5;
let versionHistoryHasMore = false;
let versionHistoryTotal = 0;
let summaryLoadToken = 0;
let summaryUserEditing = false;
let firebaseAuth = null;
let firebaseUser = null;
let signInWithPopupFn = null;
let signOutFn = null;
let googleProvider = null;
let inviteAuthorizedSenders = [];
let motionConfig = null;

const hostedApiBase = "https://chamberai-api-ecfgvedexq-uc.a.run.app";
const inferredApiBase = window.location.hostname.endsWith(".vercel.app") ? hostedApiBase : "http://localhost:4000";
const defaultApiBase = localStorage.getItem("camApiBase") || inferredApiBase;
apiBaseInput.value = defaultApiBase;

if (localStorage.getItem("camOnboardingDismissed") === "true") {
  onboardingBanner.style.display = "none";
}
inviteJoinLink.value = window.location.origin;
updateInviteMotionSource();
updateAuthCycleStatus();

if (!currentRole) {
  loginModal.classList.remove("hidden");
} else {
  setRole(
    currentRole,
    localStorage.getItem("camEmail") || "user@example.com",
    localStorage.getItem("camDisplayName") || ""
  );
}

saveApiBaseBtn.addEventListener("click", () => {
  const value = apiBaseInput.value.trim();
  if (value) {
    localStorage.setItem("camApiBase", value);
    syncSettingsFromApi({ startup: true });
  }
});

loginSubmit.addEventListener("click", () => {
  const email = loginEmail.value.trim() || "user@example.com";
  const role = loginRole.value;
  localStorage.setItem("camDisplayName", "");
  localStorage.setItem("camRole", role);
  localStorage.setItem("camEmail", email);
  setRole(role, email, "");
  updateAuthCycleStatus();
  syncSettingsFromApi({ startup: true });
  loginModal.classList.add("hidden");
});

loginGoogle.addEventListener("click", async () => {
  if (!firebaseAuth || !signInWithPopupFn || !googleProvider) {
    showToast("Google auth is not configured.");
    return;
  }
  try {
    const result = await signInWithPopupFn(firebaseAuth, googleProvider);
    const role = loginRole.value || localStorage.getItem("camRole") || "secretary";
    const email = result.user?.email || loginEmail.value.trim() || "user@example.com";
    const displayName = result.user?.displayName || "";
    localStorage.setItem("camRole", role);
    localStorage.setItem("camEmail", email);
    localStorage.setItem("camDisplayName", displayName);
    setRole(role, email, displayName);
    syncSettingsFromApi({ startup: true });
    loginModal.classList.add("hidden");
    showToast("Signed in with Google.");
  } catch (error) {
    console.error(error);
    const code = error?.code ? ` (${error.code})` : "";
    showToast(`Google sign-in failed${code}.`);
  }
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("camRole");
  localStorage.removeItem("camEmail");
  localStorage.removeItem("camDisplayName");
  currentRole = "";
  roleBadge.textContent = "Role: Guest";
  applyRolePermissions("guest");
  loginModal.classList.remove("hidden");
  if (firebaseAuth && signOutFn) {
    signOutFn(firebaseAuth).catch(() => {});
  }
  updateAuthCycleStatus();
});

dismissBanner.addEventListener("click", () => {
  localStorage.setItem("camOnboardingDismissed", "true");
  onboardingBanner.style.display = "none";
});

quickModal.addEventListener("click", (event) => {
  if (event.target === quickModal) {
    quickModal.classList.add("hidden");
  }
});

csvPreviewModal.addEventListener("click", (event) => {
  if (event.target === csvPreviewModal) {
    pendingCsvItems = [];
    csvPreviewModal.classList.add("hidden");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "/") {
    event.preventDefault();
    meetingSearch.focus();
  }
  if (event.key === "Escape") {
    if (!quickModal.classList.contains("hidden")) {
      quickModal.classList.add("hidden");
      return;
    }
    meetingSearch.value = "";
    searchQuery = "";
    meetingSearch.blur();
    renderMeetings();
  }
});

refreshBtn.addEventListener("click", () => loadMeetings());
createBtn.addEventListener("click", async () => {
  newMeetingError.textContent = "";
  const payload = {
    date: document.getElementById("newDate").value,
    start_time: document.getElementById("newStart").value,
    location: document.getElementById("newLocation").value,
    chair_name: document.getElementById("newChair").value,
    secretary_name: document.getElementById("newSecretary").value,
    tags: newTags.value
  };

  const missing = [];
  if (!payload.date) missing.push("date");
  if (!payload.start_time) missing.push("start time");
  if (!payload.location) missing.push("location");
  if (missing.length > 0) {
    newMeetingError.textContent = `Required: ${missing.join(", ")}.`;
    return;
  }

  const created = await request("/meetings", "POST", payload);
  if (created) {
    await loadMeetings();
    selectMeeting(created.id);
    newTags.value = "";
  }
});

seedDemoBtn.addEventListener("click", async () => {
  const created = await request("/meetings", "POST", {
    date: new Date().toISOString().slice(0, 10),
    start_time: "18:00",
    location: "Chamber Hall",
    chair_name: "Alex Chair",
    secretary_name: "Riley Secretary",
    tags: "demo"
  });
  if (!created) return;
  await request(`/meetings/${created.id}/audio-sources`, "POST", {
    type: "UPLOAD",
    file_uri: "meeting_good.wav",
    duration_seconds: 1200
  });
  await request(`/meetings/${created.id}/process`, "POST");
  await request(`/meetings/${created.id}/action-items`, "PUT", {
    items: [
      {
        description: "Send follow-up summary to board.",
        owner_name: "Taylor Treasurer",
        due_date: new Date().toISOString().slice(0, 10)
      }
    ]
  });
  await loadMeetings();
  selectMeeting(created.id);
  showToast("Demo meeting created.");
});

tagFilter.addEventListener("change", () => {
  activeTagFilter = tagFilter.value;
  renderMeetings();
});

meetingSearch.addEventListener("input", (event) => {
  searchQuery = event.target.value.toLowerCase();
  renderMeetings();
});

advancedSearchBtn.addEventListener("click", () => {
  runAdvancedSearch();
});

advancedSearchQuery.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    runAdvancedSearch();
  }
});

advancedSearchReset.addEventListener("click", async () => {
  advancedSearchQuery.value = "";
  await loadMeetings();
});

statusFilter.addEventListener("change", () => {
  statusQuery = statusFilter.value;
  renderMeetings();
});

recentFilter.addEventListener("change", () => {
  recentDays = recentFilter.value;
  renderMeetings();
});

saveSettingsBtn.addEventListener("click", async () => {
  const patch = {
    retentionDays: Number(settingRetention.value || "60"),
    maxFileSizeMb: Number(settingMaxSize.value || "500"),
    maxDurationSeconds: Number(settingMaxDuration.value || "14400"),
    featureFlags: collectFeatureFlags()
  };
  const validation = validateSettings(patch);
  if (!validation.ok) {
    showSettingsBanner(validation.message, "error");
    return;
  }
  const result = await saveSettings(request, patch);
  if (result?.error) {
    showSettingsBanner(`Save failed: ${result.error}`, "error");
  } else {
    showSettingsBanner("Settings saved.", "success");
    showToast("Settings updated.");
    renderFeatureFlags();
  }
});

runRetentionSweep.addEventListener("click", async () => {
  const result = await request("/retention/sweep", "POST");
  if (result?.error) {
    retentionResult.textContent = `Sweep failed: ${result.error}`;
    return;
  }
  const deletedCount = Array.isArray(result?.deleted) ? result.deleted.length : 0;
  retentionResult.textContent = `Sweep complete. Deleted ${deletedCount} audio source(s).`;
  showToast("Retention sweep complete.");
});

inviteAuthorizeSender.addEventListener("click", async () => {
  if (currentRole !== "admin") {
    inviteStatus.textContent = "Only admins can authorize sender emails.";
    return;
  }
  const email = inviteAuthorizedEmail.value.trim().toLowerCase();
  if (!email) {
    inviteStatus.textContent = "Enter an email to authorize.";
    return;
  }
  const result = await request("/invites/authorized-senders", "POST", { email });
  if (!result || result.error) {
    inviteStatus.textContent = `Authorization failed: ${result?.error ?? "unknown error"}`;
    return;
  }
  inviteAuthorizedEmail.value = "";
  inviteStatus.textContent = `${email} authorized.`;
  inviteAuthorizedSenders = Array.isArray(result.authorizedSenders) ? result.authorizedSenders : inviteAuthorizedSenders;
  renderAuthorizedSenders();
});

inviteSendBtn.addEventListener("click", async () => {
  const recipient = inviteRecipientEmail.value.trim().toLowerCase();
  if (!recipient) {
    inviteStatus.textContent = "Recipient email is required.";
    return;
  }
  const payload = {
    to: recipient,
    meetingTitle: inviteMeetingTitle.value.trim(),
    motionLink: inviteMotionLink.value.trim(),
    inviteUrl: inviteJoinLink.value.trim() || window.location.origin,
    note: inviteNote.value.trim(),
    chamberName: "ChamberAI",
    senderName: localStorage.getItem("camDisplayName") || "Chamber Secretary"
  };
  const response = await request("/invites/send", "POST", payload);
  if (!response || response.error) {
    inviteStatus.textContent = `Send failed: ${response?.error ?? "unknown error"}`;
    return;
  }
  inviteStatus.textContent = `Invite sent to ${recipient}.`;
  inviteRecipientEmail.value = "";
  inviteNote.value = "";
  showToast("Invite sent.");
});

inviteRefreshBtn.addEventListener("click", () => {
  loadInviteWorkspace();
});

inviteMotionLink.addEventListener("input", () => {
  updateInviteMotionSource();
});

motionSaveBtn.addEventListener("click", async () => {
  const payload = {
    enabled: motionEnabled.checked,
    workspaceId: motionWorkspaceId.value.trim(),
    defaultProjectId: motionProjectId.value.trim(),
    defaultLinkTemplate: motionLinkTemplate.value.trim()
  };
  if (motionApiKey.value.trim()) {
    payload.apiKey = motionApiKey.value.trim();
  }

  const response = await request("/integrations/motion/config", "PUT", payload);
  if (!response || response.error) {
    motionStatus.textContent = `Save failed: ${response?.error ?? "unknown error"}`;
    return;
  }
  motionStatus.textContent = "Motion config saved.";
  motionApiKey.value = "";
  motionConfig = response;
  applyMotionConfigToForm();
});

motionTestBtn.addEventListener("click", async () => {
  const response = await request("/integrations/motion/test", "POST", {});
  if (!response || response.error) {
    motionStatus.textContent = `Connection failed: ${response?.error ?? "unknown error"}`;
    return;
  }
  const displayName = response.name || response.email || response.userId || "connected";
  motionStatus.textContent = `Motion connection OK (${displayName}).`;
});

quickCreateBtn.addEventListener("click", () => {
  quickLocation.value = localStorage.getItem("camLastLocation") ?? "";
  quickChair.value = localStorage.getItem("camLastChair") ?? "";
  quickSecretary.value = localStorage.getItem("camLastSecretary") ?? "";
  quickTags.value = localStorage.getItem("camLastTags") ?? "";
  quickModal.classList.remove("hidden");
});

quickCancel.addEventListener("click", () => {
  quickModal.classList.add("hidden");
});

quickSubmit.addEventListener("click", async () => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const payload = {
    date,
    start_time: "18:00",
    location: quickLocation.value || "Chamber Hall",
    chair_name: quickChair.value || "Chair",
    secretary_name: quickSecretary.value || "Secretary",
    tags: quickTags.value || ""
  };

  const created = await request("/meetings", "POST", payload);
  if (created) {
    localStorage.setItem("camLastLocation", payload.location);
    localStorage.setItem("camLastChair", payload.chair_name);
    localStorage.setItem("camLastSecretary", payload.secretary_name);
    localStorage.setItem("camLastTags", payload.tags);
    quickModal.classList.add("hidden");
    await loadMeetings();
    selectMeeting(created.id);
    showToast("Meeting created.");
  }
});

pickFileBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0] ?? null;
  updateSelectedFile(file);
});

["dragenter", "dragover"].forEach((eventName) => {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.add("dragover");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.remove("dragover");
  });
});

dropzone.addEventListener("drop", (event) => {
  const file = event.dataTransfer?.files?.[0] ?? null;
  if (file) {
    updateSelectedFile(file);
  }
});

registerAudioBtn.addEventListener("click", async () => {
  if (!selectedMeetingId) return;
  if (!selectedFile) {
    alert("Select an audio file first.");
    return;
  }
  if (hasFileErrors(selectedFile)) {
    alert("Fix file validation errors before registering.");
    return;
  }

  const duration = Number(audioDuration.value || "1200");

  await request(`/meetings/${selectedMeetingId}/audio-sources`, "POST", {
    type: "UPLOAD",
    file_uri: selectedFile.name,
    duration_seconds: Number.isNaN(duration) ? 1200 : duration
  });

  updateSelectedFile(null);
  await loadMeetingDetail(selectedMeetingId);
});

processBtn.addEventListener("click", async () => {
  if (!selectedMeetingId) return;
  await request(`/meetings/${selectedMeetingId}/process`, "POST");
  await loadMeetingDetail(selectedMeetingId);
});

approveBtn.addEventListener("click", async () => {
  if (!selectedMeetingId) return;
  const result = await request(`/meetings/${selectedMeetingId}/approve`, "POST");
  if (result?.error) {
    alert(result.error);
    if (result.details) {
      renderApprovalWarnings(result.details);
    }
  } else {
    await loadMeetingDetail(selectedMeetingId);
    showToast("Minutes approved.");
  }
});

saveMinutesBtn.addEventListener("click", async () => {
  if (!selectedMeetingId) return;
  await saveMinutesDraft();
});

minutesContent.addEventListener("input", () => {
  if (!selectedMeetingId) return;
  collabStatus.textContent = "Editing draft…";
  if (minutesAutosaveTimer) clearTimeout(minutesAutosaveTimer);
  minutesAutosaveTimer = setTimeout(() => {
    saveMinutesDraft({ silent: true });
  }, 800);
});

savePublicSummary.addEventListener("click", async () => {
  if (!selectedMeetingId) return;
  const payload = collectPublicSummaryPayload();
  await request(`/meetings/${selectedMeetingId}/public-summary`, "PUT", payload);
  showToast("Public summary saved.");
});

composePublicSummary.addEventListener("click", () => {
  publicSummaryContent.value = composePublicSummaryText();
  updatePublicSummaryReady();
});

generatePublicSummary.addEventListener("click", async () => {
  if (!selectedMeetingId) return;
  const result = await request(`/meetings/${selectedMeetingId}/public-summary/generate`, "POST");
  if (result) {
    applyPublicSummary(result, { force: true });
  }
});

publishPublicSummary.addEventListener("click", async () => {
  if (!selectedMeetingId) return;
  if (!isPublicSummaryReady()) {
    showToast("Checklist incomplete. Complete readiness items before publishing.");
    return;
  }
  const result = await request(`/meetings/${selectedMeetingId}/public-summary/publish`, "POST");
  if (result) {
    applyPublicSummary(result, { force: true });
    showToast("Public summary published.");
  }
});

[
  summaryNoConfidential,
  summaryNamesApproved,
  summaryMotionsReviewed,
  summaryActionsReviewed,
  summaryChairApproved
].forEach((checkbox) => {
  checkbox.addEventListener("change", updatePublicSummaryReady);
});

[
  publicSummaryTitle,
  publicSummaryHighlights,
  publicSummaryImpact,
  publicSummaryMotions,
  publicSummaryActions,
  publicSummaryAttendance,
  publicSummaryCTA,
  publicSummaryNotes,
  publicSummaryContent
].forEach((input) => {
  input.addEventListener("input", () => {
    summaryUserEditing = true;
  });
});

addActionBtn.addEventListener("click", async () => {
  if (!selectedMeetingId) return;
  const item = {
    description: actionDescription.value,
    owner_name: actionOwner.value,
    due_date: actionDue.value
  };
  actionItems = [...actionItems, item];
  await request(`/meetings/${selectedMeetingId}/action-items`, "PUT", { items: actionItems });
  actionDescription.value = "";
  actionOwner.value = "";
  actionDue.value = "";
  await loadMeetingDetail(selectedMeetingId);
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const target = tab.dataset.tab;
    tabMinutes.classList.toggle("hidden", target !== "minutes");
    tabActions.classList.toggle("hidden", target !== "actions");
    tabAudit.classList.toggle("hidden", target !== "audit");
    tabMotions.classList.toggle("hidden", target !== "motions");
    tabPublicSummary.classList.toggle("hidden", target !== "public-summary");
  });
});

addMotionBtn.addEventListener("click", () => {
  saveMotion();
});

exportPdfBtn.addEventListener("click", () => exportMinutes("pdf"));
exportDocxBtn.addEventListener("click", () => exportMinutes("docx"));
exportMinutesMd.addEventListener("click", () => downloadMinutesMd());
exportLatestOnly.addEventListener("change", () => {
  if (!selectedMeetingId) return;
  loadMeetingDetail(selectedMeetingId);
});
exportGroup.addEventListener("change", () => {
  if (!selectedMeetingId) return;
  loadMeetingDetail(selectedMeetingId);
});

clearFilters.addEventListener("click", () => {
  activeTagFilter = "";
  searchQuery = "";
  statusQuery = "";
  recentDays = "";
  tagFilter.value = "";
  meetingSearch.value = "";
  advancedSearchQuery.value = "";
  statusFilter.value = "";
  recentFilter.value = "";
  renderMeetings();
  renderTagChips(Array.from(new Set(meetings.flatMap((meeting) => meeting.tags ?? []))).sort());
});

clearExportHistory.addEventListener("click", () => {
  exportHistory.textContent = "";
  exportResults.textContent = "";
  if (selectedMeetingId) {
    localStorage.removeItem(getExportStorageKey(selectedMeetingId));
  }
});

saveMetaBtn.addEventListener("click", async () => {
  if (!selectedMeetingId) return;
  const patch = {
    end_time: metaEndTime.value || null,
    tags: metaTags.value || "",
    no_motions: flagNoMotions.checked,
    no_action_items: flagNoActionItems.checked,
    no_adjournment_time: flagNoAdjournment.checked
  };
  await request(`/meetings/${selectedMeetingId}`, "PUT", patch);
  await loadMeetingDetail(selectedMeetingId);
});

saveAdjournmentFlag.addEventListener("click", async () => {
  if (!selectedMeetingId) return;
  await request(`/meetings/${selectedMeetingId}`, "PUT", {
    no_adjournment_time: flagNoAdjournmentInline.checked
  });
  await loadMeetingDetail(selectedMeetingId);
});

exportActionCsv.addEventListener("click", async () => {
  if (!selectedMeetingId) return;
  const base = apiBaseInput.value.trim() || "http://localhost:4000";
  const url = `${base}/meetings/${selectedMeetingId}/action-items/export/csv`;
  const response = await fetch(url);
  const csv = await response.text();
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `action-items-${selectedMeetingId}.csv`;
  link.click();
  showToast("Action items CSV downloaded.");
});

importActionCsv.addEventListener("click", () => {
  actionCsvInput.click();
});

actionCsvInput.addEventListener("change", async () => {
  if (!selectedMeetingId) return;
  const file = actionCsvInput.files?.[0];
  if (!file) return;
  const text = await file.text();
  const parsed = parseActionCsv(text);
  if (!parsed.ok) {
    alert(parsed.error);
    return;
  }
  pendingCsvItems = parsed.items;
  renderCsvPreview(pendingCsvItems);
  csvPreviewModal.classList.remove("hidden");
});

csvCancel.addEventListener("click", () => {
  pendingCsvItems = [];
  csvPreviewModal.classList.add("hidden");
  actionCsvInput.value = "";
});

csvApply.addEventListener("click", async () => {
  if (!selectedMeetingId || pendingCsvItems.length === 0) return;
  const invalidRows = pendingCsvItems.filter((item) => !item.owner_name || !item.due_date);
  if (invalidRows.length > 0 && !csvSkipInvalid.checked) {
    alert("Import contains items missing owner or due date. Enable skip or fix CSV.");
    return;
  }
  actionItems = csvSkipInvalid.checked
    ? pendingCsvItems.filter((item) => item.owner_name && item.due_date)
    : pendingCsvItems;
  await request(`/meetings/${selectedMeetingId}/action-items`, "PUT", { items: actionItems });
  renderActionItems();
  pendingCsvItems = [];
  csvPreviewModal.classList.add("hidden");
  actionCsvInput.value = "";
  showToast("Action items imported.");
});

async function loadMeetings(options = {}) {
  const data = await request("/meetings", "GET", undefined, options);
  if (!Array.isArray(data)) return false;
  meetings = data;
  refreshTagFilter();
  renderMeetings();
  return true;
}

function renderMeetings() {
  meetingList.innerHTML = "";
  const filtered = meetings.filter((meeting) => {
    if (activeTagFilter && !(meeting.tags ?? []).includes(activeTagFilter)) {
      return false;
    }
    if (statusQuery && meeting.status !== statusQuery) {
      return false;
    }
    if (recentDays) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - Number(recentDays));
      if (new Date(meeting.date) < cutoff) {
        return false;
      }
    }
    if (searchQuery) {
      const haystack = `${meeting.location ?? ""} ${meeting.chair_name ?? ""} ${meeting.secretary_name ?? ""}`.toLowerCase();
      if (!haystack.includes(searchQuery)) {
        return false;
      }
    }
    return true;
  });
  meetingCount.textContent = String(filtered.length);
  meetingEmpty.style.display = filtered.length === 0 ? "block" : "none";

  filtered
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .forEach((meeting) => {
      const card = document.createElement("div");
      card.className = "meeting-card" + (meeting.id === selectedMeetingId ? " active" : "");
      const tags = meeting.tags ?? [];
      const tagHtml =
        tags.length > 0
          ? `<div class="tag-row">${tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>`
          : "";
      card.innerHTML = `
        <div><strong>${meeting.date}</strong> · ${meeting.location}</div>
        <div>Status: <span class="status-pill status-${meeting.status.toLowerCase()}">${meeting.status}</span></div>
        ${tagHtml}
      `;
      card.addEventListener("click", () => selectMeeting(meeting.id));
      meetingList.appendChild(card);
    });
}

async function selectMeeting(meetingId) {
  selectedMeetingId = meetingId;
  renderMeetings();
  await loadMeetingDetail(meetingId);
}

async function loadMeetingDetail(meetingId) {
  const meeting = await request(`/meetings/${meetingId}`, "GET");
  if (!meeting || meeting.error) return;

  // Reset summary readiness state early so stale checkbox state cannot leak across meetings.
  summaryLoadToken += 1;
  summaryUserEditing = false;
  applyPublicSummary({ content: "", fields: {}, checklist: {} }, { force: true });

  meetingStatus.textContent = meeting.status;
  const tagLabel = (meeting.tags ?? []).length > 0 ? meeting.tags.join(", ") : "—";
  meetingMeta.innerHTML = `
    <div><strong>Date:</strong> ${meeting.date}</div>
    <div><strong>Location:</strong> ${meeting.location}</div>
    <div><strong>Chair:</strong> ${meeting.chair_name ?? "—"}</div>
    <div><strong>Secretary:</strong> ${meeting.secretary_name ?? "—"}</div>
    <div><strong>Start:</strong> ${meeting.start_time ?? "—"}</div>
    <div><strong>End:</strong> ${meeting.end_time ?? "—"}</div>
    <div><strong>Tags:</strong> ${tagLabel}</div>
  `;
  metaEndTime.value = meeting.end_time ?? "";
  metaTags.value = (meeting.tags ?? []).join(", ");
  flagNoMotions.checked = Boolean(meeting.no_motions);
  flagNoActionItems.checked = Boolean(meeting.no_action_items);
  flagNoAdjournment.checked = Boolean(meeting.no_adjournment_time);
  flagNoAdjournmentInline.checked = Boolean(meeting.no_adjournment_time);

  const minutes = await request(`/meetings/${meetingId}/draft-minutes`, "GET");
  minutesContent.value = minutes?.content ?? "";
  currentMinutesVersion = Number(minutes?.minutes_version ?? 0);
  collabStatus.textContent = "Collaboration active.";
  versionHistoryOffset = 0;
  await renderVersionHistory(meetingId);
  startMinutesSync(meetingId);
  exportResults.textContent = "";

  actionItems = (await request(`/meetings/${meetingId}/action-items`, "GET")) ?? [];
  renderActionItems();

  const audioSources = (await request(`/meetings/${meetingId}/audio-sources`, "GET")) ?? [];
  renderAudioSources(audioSources);

  motions = (await request(`/meetings/${meetingId}/motions`, "GET")) ?? [];
  motionEditIndex = null;
  renderMotions();

  const audit = (await request(`/meetings/${meetingId}/audit-log`, "GET")) ?? [];
  renderAuditLog(audit);
  renderExportHistory(audit);

  approvalStatus = await request(`/meetings/${meetingId}/approval-status`, "GET");
  if (approvalStatus?.ok === false) {
    renderApprovalWarnings(approvalStatus);
  } else {
    clearApprovalWarnings();
  }
  renderMotionGate();
  renderActionGate();
  renderAdjournmentGate();
  renderApprovalChecklist();
  approveBtn.disabled = !approvalStatus?.ok || currentRole === "viewer";

  if (featureFlags.public_summary) {
    const loadToken = summaryLoadToken;
    const summary = await request(`/meetings/${meetingId}/public-summary`, "GET");
    if (loadToken !== summaryLoadToken) return;
    if (summary) {
      applyPublicSummary(summary);
    } else {
      applyPublicSummary({ content: "", fields: {}, checklist: {} });
    }
  }
}

function renderActionItems() {
  actionItemsList.innerHTML = "";
  if (actionItems.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No action items captured.";
    actionItemsList.appendChild(empty);
    return;
  }

  if (currentRole === "viewer") {
    actionItems.forEach((item) => {
      const row = document.createElement("div");
      row.className = "action-card";
      row.innerHTML = `
        <span>${item.description}</span>
        <span>${item.owner_name ?? "Unassigned"}</span>
        <span>${item.due_date ?? "No due date"}</span>
        <span>${item.status ?? "OPEN"}</span>
      `;
      actionItemsList.appendChild(row);
    });
    return;
  }

  actionItems.forEach((item, index) => {
    const row = document.createElement("div");
    const missing = !item.owner_name || !item.due_date;
    row.className = `action-card${missing ? " invalid" : ""}`;

    const descInput = document.createElement("input");
    descInput.value = item.description ?? "";
    descInput.placeholder = "Description";

    const ownerInput = document.createElement("input");
    ownerInput.value = item.owner_name ?? "";
    ownerInput.placeholder = "Owner";

    const dueInput = document.createElement("input");
    dueInput.type = "date";
    dueInput.value = item.due_date ?? "";

    const actions = document.createElement("div");
    const saveBtn = document.createElement("button");
    saveBtn.className = "btn ghost";
    saveBtn.textContent = "Save";
    saveBtn.addEventListener("click", () => updateActionItem(index, descInput.value, ownerInput.value, dueInput.value));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn ghost";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => deleteActionItem(index));

    const autofillBtn = document.createElement("button");
    autofillBtn.className = "btn ghost";
    autofillBtn.textContent = "Quick Fill";
    autofillBtn.addEventListener("click", () => {
      if (!ownerInput.value) ownerInput.value = "Board Member";
      if (!dueInput.value) dueInput.value = new Date().toISOString().slice(0, 10);
    });

    actions.appendChild(saveBtn);
    actions.appendChild(deleteBtn);
    actions.appendChild(autofillBtn);

    row.appendChild(descInput);
    row.appendChild(ownerInput);
    row.appendChild(dueInput);
    row.appendChild(actions);
    if (missing) {
      const msg = document.createElement("div");
      msg.className = "row-message";
      msg.textContent = "Owner and due date are required to approve minutes.";
      row.appendChild(msg);
    }
    actionItemsList.appendChild(row);
  });
}

function renderAuditLog(entries) {
  auditLog.innerHTML = "";
  if (entries.length === 0) {
    auditLog.textContent = "No audit entries yet.";
    return;
  }

  entries.forEach((entry) => {
    const line = document.createElement("div");
    line.textContent = `${entry.timestamp} · ${entry.event_type}`;
    auditLog.appendChild(line);
  });
}

function renderAudioSources(sources) {
  audioSourcesList.innerHTML = "";
  if (!Array.isArray(sources) || sources.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No audio sources yet.";
    audioSourcesList.appendChild(empty);
    return;
  }

  sources.forEach((source) => {
    const item = document.createElement("div");
    item.className = "list-item";
    item.innerHTML = `<span>${source.file_uri}</span><span>${source.duration_seconds}s</span>`;
    audioSourcesList.appendChild(item);
  });
}

function renderMotions() {
  motionsList.innerHTML = "";
  motionWarnings.innerHTML = "";
  if (motions.length === 0) {
    const empty = document.createElement("div");
    empty.className = "motions-row";
    empty.innerHTML = "<span>No motions captured yet.</span>";
    motionsList.appendChild(empty);
    return;
  }

  const warnings = [];
  motions.forEach((motion, index) => {
    const row = document.createElement("div");
    const missingMover = !motion.mover_name;
    const missingOutcome = !motion.outcome;
    if (missingMover || missingOutcome) {
      warnings.push(
        `Motion ${index + 1} missing ${missingMover ? "mover" : ""}${missingMover && missingOutcome ? " and " : ""}${missingOutcome ? "outcome" : ""}.`
      );
    }

    row.className = `motions-row${missingMover || missingOutcome ? " invalid" : ""}`;

    if (currentRole === "viewer") {
      row.innerHTML = `
        <span>${motion.text || "—"}</span>
        <span>${motion.mover_name || "—"}</span>
        <span>${motion.seconder_name || "—"}</span>
        <span>${motion.vote_method || "—"}</span>
        <span>${motion.outcome || "—"}</span>
        <span></span>
      `;
    } else if (motionEditIndex === index) {
      const textInput = document.createElement("input");
      textInput.value = motion.text ?? "";
      const moverInput = document.createElement("input");
      moverInput.value = motion.mover_name ?? "";
      const seconderInput = document.createElement("input");
      seconderInput.value = motion.seconder_name ?? "";
      const voteInput = document.createElement("input");
      voteInput.value = motion.vote_method ?? "";
      const outcomeInput = document.createElement("input");
      outcomeInput.value = motion.outcome ?? "";

      row.appendChild(textInput);
      row.appendChild(moverInput);
      row.appendChild(seconderInput);
      row.appendChild(voteInput);
      row.appendChild(outcomeInput);

      const actions = document.createElement("div");
      const saveBtn = document.createElement("button");
      saveBtn.className = "btn ghost";
      saveBtn.textContent = "Save";
      saveBtn.addEventListener("click", () =>
        applyMotionEdit(index, {
          text: textInput.value,
          mover_name: moverInput.value,
          seconder_name: seconderInput.value,
          vote_method: voteInput.value,
          outcome: outcomeInput.value
        })
      );
      const cancelBtn = document.createElement("button");
      cancelBtn.className = "btn ghost";
      cancelBtn.textContent = "Cancel";
      cancelBtn.addEventListener("click", () => {
        motionEditIndex = null;
        renderMotions();
      });
      actions.appendChild(saveBtn);
      actions.appendChild(cancelBtn);
      row.appendChild(actions);
      if (missingMover || missingOutcome) {
        const msg = document.createElement("div");
        msg.className = "row-message";
        msg.textContent = "Mover and outcome required for approval.";
        row.appendChild(msg);
      }
    } else {
      row.innerHTML = `
        <span>${motion.text || "—"}</span>
        <span>${motion.mover_name || "—"}</span>
        <span>${motion.seconder_name || "—"}</span>
        <span>${motion.vote_method || "—"}</span>
        <span>${motion.outcome || "—"}</span>
      `;
      const actions = document.createElement("div");
      const editBtn = document.createElement("button");
      editBtn.className = "btn ghost";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", () => startEditMotion(index));

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn ghost";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => deleteMotion(index));

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);
      row.appendChild(actions);
      if (missingMover || missingOutcome) {
        const msg = document.createElement("div");
        msg.className = "row-message";
        msg.textContent = "Mover and outcome required for approval.";
        row.appendChild(msg);
      }
    }

    motionsList.appendChild(row);
  });

  warnings.forEach((text) => {
    const item = document.createElement("div");
    item.className = "warning";
    item.textContent = text;
    motionWarnings.appendChild(item);
  });
}

function renderMotionGate() {
  if (!approvalStatus || approvalStatus.ok) {
    motionGate.textContent = "";
    return;
  }
  if (!approvalStatus.has_motions && !approvalStatus.no_motions_flag) {
    motionGate.textContent = "Approval blocked: add a motion or set “No motions recorded.”";
  } else {
    motionGate.textContent = "";
  }
}

function renderActionGate() {
  if (!approvalStatus || approvalStatus.ok) {
    actionGate.textContent = "";
    return;
  }
  if (approvalStatus.missing_action_items?.length > 0 && !approvalStatus.no_action_items_flag) {
    actionGate.textContent = "Approval blocked: assign owner and due date for all action items.";
  } else {
    actionGate.textContent = "";
  }
}

function renderAdjournmentGate() {
  if (!approvalStatus || approvalStatus.ok) {
    adjournmentGate.textContent = "";
    return;
  }
  if (!approvalStatus.has_adjournment_time && !approvalStatus.no_adjournment_time_flag) {
    adjournmentGate.textContent = "Approval blocked: add adjournment time or mark it missing.";
  } else {
    adjournmentGate.textContent = "";
  }
}

function renderApprovalChecklist() {
  approvalChecklist.innerHTML = "";
  if (!approvalStatus) return;

  const items = [
    {
      label: "Motions recorded",
      ok: approvalStatus.has_motions || approvalStatus.no_motions_flag
    },
    {
      label: "Action items have owner + due date",
      ok: approvalStatus.missing_action_items?.length === 0 || approvalStatus.no_action_items_flag
    },
    {
      label: "Adjournment time captured",
      ok: approvalStatus.has_adjournment_time || approvalStatus.no_adjournment_time_flag
    }
  ];

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = `checklist-item ${item.ok ? "good" : "bad"}`;
    row.innerHTML = `<strong>${item.ok ? "✓" : "!"}</strong><span>${item.label}</span>`;
    approvalChecklist.appendChild(row);
  });
}

function renderExportHistory(entries) {
  exportHistory.innerHTML = "";
  const exportsFromAudit = entries
    .filter((entry) => entry.event_type === "MINUTES_EXPORT")
    .map((entry) => ({
      timestamp: entry.timestamp,
      format: entry.details?.format ?? "export",
      file_uri: entry.details?.file_uri ?? ""
    }));
  const exportsFromStorage = selectedMeetingId ? loadExportHistory(selectedMeetingId) : [];
  let exports = mergeExports(exportsFromAudit, exportsFromStorage);

  if (exportLatestOnly.checked) {
    const latestByFormat = new Map();
    exports.forEach((entry) => {
      const existing = latestByFormat.get(entry.format);
      if (!existing || new Date(entry.timestamp) > new Date(existing.timestamp)) {
        latestByFormat.set(entry.format, entry);
      }
    });
    exports = Array.from(latestByFormat.values());
  }

  if (exports.length === 0) {
    exportHistory.textContent = "No exports yet.";
    return;
  }

  if (exportGroup.value === "format") {
    const byFormat = exports.reduce((acc, entry) => {
      const format = entry.format ?? "export";
      acc[format] = acc[format] || [];
      acc[format].push(entry);
      return acc;
    }, {});
    Object.entries(byFormat).forEach(([format, list]) => {
      const header = document.createElement("div");
      header.textContent = format.toUpperCase();
      exportHistory.appendChild(header);
      list.forEach((entry) => {
        const line = document.createElement("div");
        line.textContent = `${entry.timestamp} · ${entry.file_uri}`;
        exportHistory.appendChild(line);
      });
    });
    return;
  }

  exports.forEach((entry) => {
    const line = document.createElement("div");
    line.textContent = `${entry.timestamp} · ${entry.format.toUpperCase()} · ${entry.file_uri}`;
    exportHistory.appendChild(line);
  });
}

async function saveMotion() {
  if (!selectedMeetingId) return;
  if (!motionMover.value || !motionOutcome.value) {
    alert("Mover and outcome are required for motions.");
    return;
  }
  const motion = {
    text: motionText.value,
    mover_name: motionMover.value,
    seconder_name: motionSeconder.value,
    vote_method: motionVote.value,
    outcome: motionOutcome.value
  };
  motions = [...motions, motion];
  motions = await request(`/meetings/${selectedMeetingId}/motions`, "PUT", { motions });
  renderMotions();
  motionText.value = "";
  motionMover.value = "";
  motionSeconder.value = "";
  motionVote.value = "";
  motionOutcome.value = "";
}

async function startEditMotion(index) {
  motionEditIndex = index;
  renderMotions();
}

async function applyMotionEdit(index, updates) {
  if (!selectedMeetingId) return;
  if (!updates.mover_name || !updates.outcome) {
    alert("Mover and outcome are required for motions.");
    return;
  }
  motions = motions.map((motion, i) =>
    i === index
      ? {
          ...motion,
          ...updates
        }
      : motion
  );
  motions = await request(`/meetings/${selectedMeetingId}/motions`, "PUT", { motions });
  motionEditIndex = null;
  renderMotions();
}

async function deleteMotion(index) {
  if (!selectedMeetingId) return;
  if (currentRole === "viewer") return;
  if (!confirm("Delete this motion?")) return;
  motions = motions.filter((_, i) => i !== index);
  motions = await request(`/meetings/${selectedMeetingId}/motions`, "PUT", { motions });
  renderMotions();
}

async function exportMinutes(format) {
  if (!selectedMeetingId) return;
  const result = await request(`/meetings/${selectedMeetingId}/export`, "POST", { format });
  if (result?.error) {
    exportResults.textContent = `Export failed: ${result.error}`;
    return;
  }
  const line = document.createElement("div");
  line.textContent = `${format.toUpperCase()} export ready: ${result.file_uri}`;
  exportResults.appendChild(line);
  persistExportHistory(selectedMeetingId, {
    timestamp: new Date().toISOString(),
    format,
    file_uri: result.file_uri
  });
  const audit = (await request(`/meetings/${selectedMeetingId}/audit-log`, "GET")) ?? [];
  renderExportHistory(audit);
  showToast(`${format.toUpperCase()} export ready.`);
}

function downloadMinutesMd() {
  const content = minutesContent.value || "";
  const blob = new Blob([content], { type: "text/markdown" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `minutes-${selectedMeetingId ?? "meeting"}.md`;
  link.click();
  showToast("Minutes markdown downloaded.");
}

async function updateActionItem(index, description, owner, dueDate) {
  if (!selectedMeetingId) return;
  if (currentRole === "viewer") return;
  actionItems = actionItems.map((item, i) =>
    i === index
      ? {
          ...item,
          description,
          owner_name: owner,
          due_date: dueDate
        }
      : item
  );
  actionItems = await request(`/meetings/${selectedMeetingId}/action-items`, "PUT", { items: actionItems });
  renderActionItems();
}

async function deleteActionItem(index) {
  if (!selectedMeetingId) return;
  if (currentRole === "viewer") return;
  if (!confirm("Delete this action item?")) return;
  actionItems = actionItems.filter((_, i) => i !== index);
  actionItems = await request(`/meetings/${selectedMeetingId}/action-items`, "PUT", { items: actionItems });
  renderActionItems();
}

function renderApprovalWarnings(details) {
  approvalWarnings.innerHTML = "";
  const warnings = [];

  if (!details.has_motions && !details.no_motions_flag) {
    warnings.push("Approval blocked: add a motion or set “No motions.”");
  }
  if (details.missing_action_items?.length > 0 && !details.no_action_items_flag) {
    warnings.push("Approval blocked: action items need owner + due date.");
  }
  if (!details.has_adjournment_time && !details.no_adjournment_time_flag) {
    warnings.push("Approval blocked: add adjournment time or mark it missing.");
  }

  if (warnings.length === 0) {
    clearApprovalWarnings();
    return;
  }

  warnings.forEach((text) => {
    const item = document.createElement("div");
    item.className = "warning";
    item.textContent = text;
    approvalWarnings.appendChild(item);
  });
}

function clearApprovalWarnings() {
  approvalWarnings.innerHTML = "";
}

async function authHeaders() {
  const headers = {};
  const email = localStorage.getItem("camEmail");
  if (email) headers["x-demo-email"] = email;
  if (firebaseUser) {
    try {
      const token = await firebaseUser.getIdToken();
      headers.Authorization = `Bearer ${token}`;
      return headers;
    } catch (error) {
      console.error("Failed to get Firebase token", error);
    }
  }
  const role = localStorage.getItem("camRole");
  const isLocalDevHost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  if (isLocalDevHost && role && role !== "guest") {
    headers.Authorization = "Bearer demo-token";
  } else if (!firebaseUser && role && role !== "guest") {
    console.warn("Google auth session missing; not sending demo token in hosted mode.");
  }
  return headers;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(path, method, payload, options = {}) {
  const retries = Number(options.retries ?? 0);
  const retryDelayMs = Number(options.retryDelayMs ?? 350);
  const suppressAlert = Boolean(options.suppressAlert);
  const base = apiBaseInput.value.trim() || "http://localhost:4000";
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(`${base}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders())
        },
        body: payload ? JSON.stringify(payload) : undefined
      });
      const text = await response.text();
      if (!text) return null;

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        return { error: `Unexpected response content-type: ${contentType || "unknown"}` };
      }

      const data = JSON.parse(text);
      if (!response.ok) {
        return data?.error ? data : { error: `HTTP ${response.status}` };
      }
      return data;
    } catch (error) {
      if (attempt < retries) {
        await sleep(retryDelayMs * (attempt + 1));
        continue;
      }
      if (!suppressAlert) {
        console.error(error);
      }
      if (!suppressAlert) {
        showToast("API request failed. Check API base and console.");
        alert("API request failed. Check API base and console.");
      }
      return null;
    }
  }
}

async function initFirebaseAuth() {
  const config = window.CHAMBERAI_FIREBASE_CONFIG;
  if (!config || !config.apiKey || config.apiKey === "REPLACE_ME") return;

  try {
    const [{ initializeApp }, authModule] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js")
    ]);

    const app = initializeApp(config);
    firebaseAuth = authModule.getAuth(app);
    googleProvider = new authModule.GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: "select_account" });
    signInWithPopupFn = authModule.signInWithPopup;
    signOutFn = authModule.signOut;

    authModule.onAuthStateChanged(firebaseAuth, (user) => {
      firebaseUser = user;
      updateAuthCycleStatus();
      if (!user) return;
      const role = localStorage.getItem("camRole") || loginRole.value || "secretary";
      const email = user.email || localStorage.getItem("camEmail") || "user@example.com";
      const displayName = user.displayName || localStorage.getItem("camDisplayName") || "";
      localStorage.setItem("camRole", role);
      localStorage.setItem("camEmail", email);
      localStorage.setItem("camDisplayName", displayName);
      setRole(role, email, displayName);
      loginModal.classList.add("hidden");
    });
  } catch (error) {
    console.error("Firebase auth init failed", error);
  }
}

initFirebaseAuth();

function updateAuthCycleStatus() {
  if (!authCycleStatus) return;
  if (firebaseUser?.email) {
    authCycleStatus.textContent = `Auth: Google connected (${firebaseUser.email})`;
    return;
  }
  const role = localStorage.getItem("camRole");
  if (role && role !== "guest") {
    authCycleStatus.textContent = "Auth: local/demo session";
    return;
  }
  authCycleStatus.textContent = "Auth: not connected";
}

async function runAdvancedSearch() {
  const term = advancedSearchQuery.value.trim();
  if (!term) {
    await loadMeetings();
    return;
  }
  const results = await request(`/search/meetings?q=${encodeURIComponent(term)}`, "GET");
  if (!Array.isArray(results)) {
    showToast("Advanced search failed.");
    return;
  }
  meetings = results;
  activeTagFilter = "";
  searchQuery = "";
  statusQuery = "";
  recentDays = "";
  tagFilter.value = "";
  meetingSearch.value = "";
  statusFilter.value = "";
  recentFilter.value = "";
  refreshTagFilter();
  renderMeetings();
}

function syncSettingsFromApi(options = {}) {
  const startup = Boolean(options.startup);
  const requestOptions = startup
    ? { suppressAlert: true, retries: 4, retryDelayMs: 500 }
    : undefined;
  const runVersion = ++settingsSyncVersion;
  return loadSettings((path, method, payload) => request(path, method, payload, requestOptions)).then((settings) => {
    if (runVersion !== settingsSyncVersion) return;
    if (!settings || settings.error) return;
    settingRetention.value = settings.retentionDays ?? 60;
    settingMaxSize.value = settings.maxFileSizeMb ?? 500;
    settingMaxDuration.value = settings.maxDurationSeconds ?? 14400;
    featureFlags = { ...defaultFlags(), ...(settings.featureFlags ?? {}) };
    renderFeatureFlags();
    settingsStatus.classList.add("hidden");
  });
}

function renderAuthorizedSenders() {
  if (!Array.isArray(inviteAuthorizedSenders) || inviteAuthorizedSenders.length === 0) {
    inviteAuthorizedList.textContent = "No authorized senders yet.";
    return;
  }
  inviteAuthorizedList.textContent = `Authorized senders: ${inviteAuthorizedSenders.join(", ")}`;
}

async function loadInviteWorkspace() {
  if (!(currentRole === "admin" || currentRole === "secretary")) {
    inviteAuthorizedSenders = [];
    renderAuthorizedSenders();
    inviteStatus.textContent = "Invite tools require admin or secretary role.";
    return;
  }
  const response = await request("/invites/authorized-senders", "GET", null, { suppressAlert: true });
  if (!response || response.error) {
    inviteStatus.textContent = `Invite config unavailable: ${response?.error ?? "unknown error"}`;
    return;
  }
  inviteAuthorizedSenders = Array.isArray(response.authorizedSenders) ? response.authorizedSenders : [];
  inviteStatus.textContent = "";
  renderAuthorizedSenders();
}

function applyMotionConfigToForm() {
  const cfg = motionConfig ?? {};
  motionEnabled.checked = Boolean(cfg.enabled);
  motionWorkspaceId.value = cfg.workspaceId ?? "";
  motionProjectId.value = cfg.defaultProjectId ?? "";
  motionLinkTemplate.value = cfg.defaultLinkTemplate ?? "";
  updateInviteMotionSource();
}

function updateInviteMotionSource() {
  const manualLink = inviteMotionLink.value.trim();
  const template = motionConfig?.defaultLinkTemplate ?? "";
  if (manualLink) {
    inviteMotionSource.textContent = "Motion link source: manual link for this invite.";
    return;
  }
  if (template) {
    inviteMotionSource.textContent = "Motion link source: chamber default template.";
    return;
  }
  inviteMotionSource.textContent = "Motion link source: none configured.";
}

async function loadMotionConfig() {
  if (!(currentRole === "admin" || currentRole === "secretary")) {
    motionStatus.textContent = "Motion config requires admin or secretary role.";
    motionConfig = null;
    applyMotionConfigToForm();
    return;
  }
  const response = await request("/integrations/motion/config", "GET", null, { suppressAlert: true });
  if (!response || response.error) {
    motionStatus.textContent = `Motion config unavailable: ${response?.error ?? "unknown error"}`;
    return;
  }
  motionConfig = response;
  applyMotionConfigToForm();
  if (response.hasApiKey) {
    motionStatus.textContent = "Motion API key is configured.";
  } else {
    motionStatus.textContent = "Set Motion API key to enable API operations.";
  }
}

renderFeatureFlags();
void startApp();

function refreshTagFilter() {
  const tags = new Set();
  meetings.forEach((meeting) => {
    (meeting.tags ?? []).forEach((tag) => tags.add(tag));
  });
  const current = tagFilter.value;
  tagFilter.innerHTML = "<option value=\"\">All</option>";
  Array.from(tags)
    .sort()
    .forEach((tag) => {
      const option = document.createElement("option");
      option.value = tag;
      option.textContent = tag;
      tagFilter.appendChild(option);
    });
  tagFilter.value = tags.has(current) ? current : "";
  activeTagFilter = tagFilter.value;
  meetingSearch.value = searchQuery;
  statusFilter.value = statusQuery;
  recentFilter.value = recentDays;
  renderTagChips(Array.from(tags).sort());
}

function renderTagChips(tags) {
  tagChips.innerHTML = "";
  if (tags.length === 0) return;
  const allChip = document.createElement("button");
  allChip.type = "button";
  allChip.className = `tag-chip${activeTagFilter === "" ? " active" : ""}`;
  allChip.textContent = "All";
  allChip.addEventListener("click", () => {
    activeTagFilter = "";
    tagFilter.value = "";
    renderMeetings();
    renderTagChips(tags);
  });
  tagChips.appendChild(allChip);
  tags.forEach((tag) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = `tag-chip${activeTagFilter === tag ? " active" : ""}`;
    chip.textContent = tag;
    chip.addEventListener("click", () => {
      activeTagFilter = activeTagFilter === tag ? "" : tag;
      tagFilter.value = activeTagFilter;
      renderMeetings();
      renderTagChips(tags);
    });
    tagChips.appendChild(chip);
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2200);
}

function composePublicSummaryText() {
  const title = publicSummaryTitle.value.trim();
  const parts = [
    title ? `${title}` : "",
    publicSummaryHighlights.value,
    publicSummaryImpact.value,
    publicSummaryMotions.value,
    publicSummaryActions.value,
    publicSummaryAttendance.value,
    publicSummaryCTA.value,
    publicSummaryNotes.value
  ]
    .map((text) => text.trim())
    .filter(Boolean);
  return parts.join("\\n\\n");
}

function collectPublicSummaryPayload() {
  return {
    content: publicSummaryContent.value,
    fields: {
      title: publicSummaryTitle.value,
      highlights: publicSummaryHighlights.value,
      impact: publicSummaryImpact.value,
      motions: publicSummaryMotions.value,
      actions: publicSummaryActions.value,
      attendance: publicSummaryAttendance.value,
      call_to_action: publicSummaryCTA.value,
      notes: publicSummaryNotes.value
    },
    checklist: {
      no_confidential: summaryNoConfidential.checked,
      names_approved: summaryNamesApproved.checked,
      motions_reviewed: summaryMotionsReviewed.checked,
      actions_reviewed: summaryActionsReviewed.checked,
      chair_approved: summaryChairApproved.checked
    }
  };
}

function applyPublicSummary(summary, options = {}) {
  const force = Boolean(options.force);
  if (summaryUserEditing && !force) return;
  publicSummaryTitle.value = summary?.fields?.title ?? "";
  publicSummaryHighlights.value = summary?.fields?.highlights ?? "";
  publicSummaryImpact.value = summary?.fields?.impact ?? "";
  publicSummaryMotions.value = summary?.fields?.motions ?? "";
  publicSummaryActions.value = summary?.fields?.actions ?? "";
  publicSummaryAttendance.value = summary?.fields?.attendance ?? "";
  publicSummaryCTA.value = summary?.fields?.call_to_action ?? "";
  publicSummaryNotes.value = summary?.fields?.notes ?? "";
  publicSummaryContent.value = summary?.content ?? "";
  summaryNoConfidential.checked = Boolean(summary?.checklist?.no_confidential);
  summaryNamesApproved.checked = Boolean(summary?.checklist?.names_approved);
  summaryMotionsReviewed.checked = Boolean(summary?.checklist?.motions_reviewed);
  summaryActionsReviewed.checked = Boolean(summary?.checklist?.actions_reviewed);
  summaryChairApproved.checked = Boolean(summary?.checklist?.chair_approved);
  const publishedLabel = formatSummaryTimestamp(summary?.published_at);
  if (publishedLabel) {
    const published = publishedLabel;
    publicSummaryPublishStatus.textContent = `Published ${published} by ${summary.published_by ?? "user"}.`;
  } else {
    publicSummaryPublishStatus.textContent = "Not published yet.";
  }
  summaryUserEditing = false;
  updatePublicSummaryReady();
}

function formatSummaryTimestamp(value) {
  if (!value) return "";
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? "" : date.toLocaleString();
  }
  if (typeof value.toDate === "function") {
    return value.toDate().toLocaleString();
  }
  if (typeof value === "object" && typeof value.seconds === "number") {
    return new Date(value.seconds * 1000).toLocaleString();
  }
  return "";
}

function updatePublicSummaryReady() {
  const ready = isPublicSummaryReady();
  publicSummaryReady.textContent = ready
    ? "Publish readiness: complete."
    : "Publish readiness: incomplete.";
  publicSummaryReady.classList.toggle("ready", ready);
  publishPublicSummary.disabled = !ready;
}

function isPublicSummaryReady() {
  return (
    summaryNoConfidential.checked &&
    summaryNamesApproved.checked &&
    summaryMotionsReviewed.checked &&
    summaryActionsReviewed.checked &&
    summaryChairApproved.checked
  );
}

function renderFeatureFlags() {
  featureFlagsEl.innerHTML = "";
  FEATURE_FLAGS.forEach((flag) => {
    const label = document.createElement("label");
    label.className = "check";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = Boolean(featureFlags[flag.key]);
    input.dataset.flag = flag.key;
    label.appendChild(input);
    label.appendChild(document.createTextNode(flag.label));
    featureFlagsEl.appendChild(label);
  });
  const hidePublicSummary = !featureFlags.public_summary;
  const hideInviteTools = !featureFlags.integrations_email;
  publicSummaryTab.classList.toggle("hidden", hidePublicSummary);
  settingsInviteDisclosure.classList.toggle("hidden", hideInviteTools);
  settingsMotionDisclosure.classList.toggle("hidden", hideInviteTools);
  if (hidePublicSummary && publicSummaryTab.classList.contains("active")) {
    tabs.forEach((tab) => tab.classList.remove("active"));
    if (tabs.length > 0) tabs[0].classList.add("active");
    tabMinutes.classList.remove("hidden");
    tabActions.classList.add("hidden");
    tabAudit.classList.add("hidden");
    tabMotions.classList.add("hidden");
    tabPublicSummary.classList.add("hidden");
  }
}

function collectFeatureFlags() {
  const flags = { ...defaultFlags() };
  featureFlagsEl.querySelectorAll("input[data-flag]").forEach((input) => {
    flags[input.dataset.flag] = input.checked;
  });
  featureFlags = flags;
  return flags;
}

function showSettingsBanner(message, variant) {
  settingsStatus.textContent = message;
  settingsStatus.classList.remove("hidden", "success", "error");
  settingsStatus.classList.add(variant);
}

function setRole(role, email, displayName = "") {
  currentRole = role;
  const identity = displayName || email || "user";
  roleBadge.textContent = `Role: ${role} · ${identity}`;
  loginEmail.value = email;
  loginRole.value = role;
  loginModal.classList.add("hidden");
  applyRolePermissions(role);
  loadInviteWorkspace();
  loadMotionConfig();
}

function applyRolePermissions(role) {
  const isViewer = role === "viewer" || role === "guest" || !role;
  const controls = [
    createBtn,
    quickCreateBtn,
    seedDemoBtn,
    saveMetaBtn,
    registerAudioBtn,
    processBtn,
    approveBtn,
    saveMinutesBtn,
    addActionBtn,
    addMotionBtn,
    importActionCsv,
    csvApply,
    saveAdjournmentFlag,
    saveSettingsBtn,
    quickSubmit,
    inviteSendBtn,
    inviteRefreshBtn,
    motionSaveBtn,
    motionTestBtn
  ];
  controls.forEach((control) => {
    if (!control) return;
    control.disabled = isViewer;
  });
  if (inviteAuthorizeSender) {
    inviteAuthorizeSender.disabled = role !== "admin";
  }

  [
    "newDate",
    "newStart",
    "newLocation",
    "newChair",
    "newSecretary",
    "newTags",
    "metaEndTime",
    "metaTags",
    "flagNoMotions",
    "flagNoActionItems",
    "flagNoAdjournment",
    "flagNoAdjournmentInline",
    "actionDescription",
    "actionOwner",
    "actionDue",
    "motionText",
    "motionMover",
    "motionSeconder",
    "motionVote",
    "motionOutcome",
    "settingRetention",
    "settingMaxSize",
    "settingMaxDuration",
    "inviteAuthorizedEmail",
    "inviteRecipientEmail",
    "inviteMeetingTitle",
    "inviteMotionLink",
    "inviteJoinLink",
    "inviteNote",
    "motionEnabled",
    "motionApiKey",
    "motionWorkspaceId",
    "motionProjectId",
    "motionLinkTemplate"
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.disabled = isViewer;
  });

  document.body.classList.toggle("readonly", isViewer);
}

function validateSettings(settings) {
  if (settings.retentionDays < 1 || settings.retentionDays > 365) {
    return { ok: false, message: "Retention days must be between 1 and 365." };
  }
  if (settings.maxFileSizeMb < 1 || settings.maxFileSizeMb > 1024) {
    return { ok: false, message: "Max file size must be between 1 and 1024 MB." };
  }
  if (settings.maxDurationSeconds < 300 || settings.maxDurationSeconds > 21600) {
    return { ok: false, message: "Max duration must be between 300 and 21600 seconds." };
  }
  return { ok: true, message: "" };
}

function parseActionCsv(csvText) {
  const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) {
    return { ok: false, error: "CSV is empty." };
  }
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const required = ["description", "owner_name", "due_date", "status"];
  const missing = required.filter((field) => !header.includes(field));
  if (missing.length > 0) {
    return { ok: false, error: `Missing columns: ${missing.join(", ")}` };
  }
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));

  const items = lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return {
      description: values[idx.description] ?? "",
      owner_name: values[idx.owner_name] ?? "",
      due_date: values[idx.due_date] ?? "",
      status: values[idx.status] ?? "OPEN"
    };
  });
  return { ok: true, items };
}

function renderCsvPreview(items) {
  csvPreviewTable.innerHTML = "";
  const header = document.createElement("div");
  header.className = "preview-row header";
  header.innerHTML = "<span>Description</span><span>Owner</span><span>Due Date</span><span>Status</span>";
  csvPreviewTable.appendChild(header);

  const invalidCount = items.filter((item) => !item.owner_name || !item.due_date).length;
  if (invalidCount > 0) {
    csvPreviewNote.textContent = `${invalidCount} row(s) missing owner or due date.`;
  } else {
    csvPreviewNote.textContent = "All rows look valid.";
  }

  items.slice(0, 20).forEach((item) => {
    const row = document.createElement("div");
    const missing = !item.owner_name || !item.due_date;
    row.className = `preview-row${missing ? " invalid" : ""}`;
    row.innerHTML = `<span>${item.description || "—"}</span><span>${item.owner_name || "—"}</span><span>${item.due_date || "—"}</span><span>${item.status || "—"}</span>`;
    csvPreviewTable.appendChild(row);
  });
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === "\"" && line[i + 1] === "\"") {
      current += "\"";
      i += 1;
      continue;
    }
    if (char === "\"") {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  values.push(current);
  return values.map((value) => value.trim());
}

async function saveMinutesDraft(options = {}) {
  if (!selectedMeetingId) return;
  const silent = Boolean(options.silent);
  const result = await request(`/meetings/${selectedMeetingId}/draft-minutes`, "PUT", {
    content: minutesContent.value,
    base_version: currentMinutesVersion
  }, { suppressAlert: silent });
  if (!result || result.error) {
    if (result?.current_version !== undefined) {
      currentMinutesVersion = Number(result.current_version);
      minutesContent.value = result.current_content ?? "";
      collabStatus.textContent = "Conflict detected. Loaded latest draft.";
      if (!silent) alert("Draft conflict detected. Latest content has been loaded.");
      await renderVersionHistory(selectedMeetingId);
      return;
    }
    collabStatus.textContent = "Draft save failed.";
    return;
  }
  currentMinutesVersion = Number(result.minutes_version ?? currentMinutesVersion);
  collabStatus.textContent = silent ? "Draft auto-saved." : "Draft saved.";
  await renderVersionHistory(selectedMeetingId);
}

function startMinutesSync(meetingId) {
  if (minutesSyncTimer) clearInterval(minutesSyncTimer);
  if (!meetingId) return;
  minutesSyncTimer = setInterval(async () => {
    if (!selectedMeetingId || selectedMeetingId !== meetingId) return;
    const remote = await request(`/meetings/${meetingId}/draft-minutes`, "GET", undefined, { suppressAlert: true });
    if (!remote || remote.error) return;
    const remoteVersion = Number(remote.minutes_version ?? 0);
    if (remoteVersion > currentMinutesVersion) {
      currentMinutesVersion = remoteVersion;
      minutesContent.value = remote.content ?? "";
      collabStatus.textContent = "Synced from server.";
      await renderVersionHistory(meetingId);
    }
  }, 2000);
}

async function renderVersionHistory(meetingId) {
  versionHistoryList.innerHTML = "";
  const response = await request(
    `/meetings/${meetingId}/draft-minutes/versions?limit=${versionHistoryLimit}&offset=${versionHistoryOffset}`,
    "GET",
    undefined,
    { suppressAlert: true }
  );
  const versions = Array.isArray(response) ? response : response?.items ?? [];
  versionHistoryHasMore = Boolean(response?.has_more);
  versionHistoryTotal = Number(response?.total ?? versions.length ?? 0);
  versionHistoryPrev.disabled = versionHistoryOffset <= 0;
  versionHistoryNext.disabled = !versionHistoryHasMore;
  const totalPages = Math.max(1, Math.ceil(versionHistoryTotal / versionHistoryLimit));
  const currentPage = Math.min(Math.floor(versionHistoryOffset / versionHistoryLimit) + 1, totalPages);
  versionHistoryPage.textContent = `Page ${currentPage}/${totalPages}`;
  if (!Array.isArray(versions) || versions.length === 0) {
    versionHistoryList.textContent = "No saved versions yet.";
    return;
  }

  versions.forEach((version) => {
    const row = document.createElement("div");
    row.className = "version-item";
    const preview = (version.content ?? "").slice(0, 64).replace(/\s+/g, " ").trim() || "(empty)";
    const meta = document.createElement("div");
    meta.className = "version-meta";
    meta.textContent = `v${version.version} · ${preview}`;
    const rollbackBtn = document.createElement("button");
    rollbackBtn.className = "btn ghost";
    rollbackBtn.type = "button";
    rollbackBtn.dataset.version = String(version.version);
    rollbackBtn.textContent = "Rollback";
    rollbackBtn.addEventListener("click", async () => {
      if (!selectedMeetingId) return;
      const rollback = await request(`/meetings/${selectedMeetingId}/draft-minutes/rollback`, "POST", {
        version: version.version
      });
      if (rollback?.error) {
        collabStatus.textContent = `Rollback failed: ${rollback.error}`;
        return;
      }
      currentMinutesVersion = Number(rollback.minutes_version ?? currentMinutesVersion);
      minutesContent.value = rollback.content ?? "";
      collabStatus.textContent = "Rolled back to selected version.";
      showToast("Minutes rolled back.");
      await renderVersionHistory(selectedMeetingId);
    });
    row.appendChild(meta);
    row.appendChild(rollbackBtn);
    versionHistoryList.appendChild(row);
  });
}

versionHistoryPrev.addEventListener("click", async () => {
  if (!selectedMeetingId || versionHistoryOffset <= 0) return;
  versionHistoryOffset = Math.max(versionHistoryOffset - versionHistoryLimit, 0);
  await renderVersionHistory(selectedMeetingId);
});

versionHistoryNext.addEventListener("click", async () => {
  if (!selectedMeetingId || !versionHistoryHasMore) return;
  const nextOffset = versionHistoryOffset + versionHistoryLimit;
  if (versionHistoryTotal > 0 && nextOffset >= versionHistoryTotal) {
    versionHistoryHasMore = false;
    versionHistoryNext.disabled = true;
    return;
  }
  versionHistoryOffset += versionHistoryLimit;
  await renderVersionHistory(selectedMeetingId);
});

async function startApp() {
  if (startupRetriesInProgress) return;
  startupRetriesInProgress = true;
  const startupRequestOptions = { suppressAlert: true, retries: 4, retryDelayMs: 500 };
  const [meetingsResult] = await Promise.all([
    loadMeetings(startupRequestOptions),
    syncSettingsFromApi({ startup: true }),
    loadInviteWorkspace(),
    loadMotionConfig()
  ]);
  if (!meetingsResult) {
    showToast("API is warming up. Retry when services are ready.");
  }
  startupRetriesInProgress = false;
}

function getExportStorageKey(meetingId) {
  return `camExportHistory:${meetingId}`;
}

function loadExportHistory(meetingId) {
  const raw = localStorage.getItem(getExportStorageKey(meetingId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistExportHistory(meetingId, entry) {
  const existing = loadExportHistory(meetingId);
  existing.push(entry);
  localStorage.setItem(getExportStorageKey(meetingId), JSON.stringify(existing));
}

function mergeExports(auditExports, storedExports) {
  const merged = new Map();
  [...auditExports, ...storedExports].forEach((entry) => {
    const key = `${entry.format}|${entry.file_uri}|${entry.timestamp}`;
    merged.set(key, entry);
  });
  return Array.from(merged.values());
}

function updateSelectedFile(file) {
  selectedFile = file;
  fileInput.value = "";

  if (!file) {
    fileMeta.textContent = "No file selected.";
    fileHint.textContent = "Max 500MB. Supported: mp3, wav.";
    fileHint.classList.remove("error");
    return;
  }

  const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
  fileMeta.textContent = `${file.name} · ${sizeMb} MB`;

  const errorMessage = fileValidationMessage(file);
  if (errorMessage) {
    fileHint.textContent = errorMessage;
    fileHint.classList.add("error");
  } else {
    fileHint.textContent = "Ready to register. Duration is required for the mock API.";
    fileHint.classList.remove("error");
  }
}

function fileValidationMessage(file) {
  const allowed = [".mp3", ".wav"];
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (!allowed.includes(ext)) {
    return "Unsupported file type. Use .mp3 or .wav.";
  }
  const maxSizeMb = 500;
  const sizeMb = file.size / (1024 * 1024);
  if (sizeMb > maxSizeMb) {
    return `File too large (${sizeMb.toFixed(1)} MB). Max is ${maxSizeMb} MB.`;
  }
  return null;
}

function hasFileErrors(file) {
  return Boolean(fileValidationMessage(file));
}
