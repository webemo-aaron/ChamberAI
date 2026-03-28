/**
 * Email Invitations Settings Tab
 *
 * Configure:
 * - Authorized email sender (for invites)
 * - Email templates and links
 * - Invitation delivery settings
 */

/**
 * Render the invitations tab content
 * Creates form fields for email invite configuration
 * @param {HTMLElement} container - Tab panel container
 * @param {Object} settings - Current settings from API
 */
export function renderInviteTab(container, settings = {}) {
  // Clear container
  container.innerHTML = "";

  // Create form section
  const form = document.createElement("form");
  form.className = "settings-form";

  // Form title
  const title = document.createElement("h2");
  title.className = "settings-form-title";
  title.textContent = "Email Invitations";

  const subtitle = document.createElement("p");
  subtitle.className = "settings-form-subtitle";
  subtitle.textContent = "Configure email invitations and notification delivery";

  form.appendChild(title);
  form.appendChild(subtitle);

  // Create form grid
  const formGrid = document.createElement("div");
  formGrid.className = "settings-form-grid";

  // Authorized sender email (admin only)
  const senderGroup = document.createElement("div");
  senderGroup.className = "form-group";

  const senderLabel = document.createElement("label");
  senderLabel.htmlFor = "inviteAuthorizeSender";
  senderLabel.textContent = "Authorized Sender Email";

  const senderHint = document.createElement("p");
  senderHint.className = "form-hint form-hint-warning";
  senderHint.textContent = "Admin only: Email address for sending invitations";

  const senderInput = document.createElement("input");
  senderInput.type = "email";
  senderInput.id = "inviteAuthorizeSender";
  senderInput.placeholder = "secretary@chamber.org";
  senderInput.value = settings.inviteAuthorizeSender || "";

  senderGroup.appendChild(senderLabel);
  senderGroup.appendChild(senderHint);
  senderGroup.appendChild(senderInput);

  // Recipient email
  const recipientGroup = document.createElement("div");
  recipientGroup.className = "form-group";

  const recipientLabel = document.createElement("label");
  recipientLabel.htmlFor = "inviteRecipientEmail";
  recipientLabel.textContent = "Recipient Email";

  const recipientInput = document.createElement("input");
  recipientInput.type = "email";
  recipientInput.id = "inviteRecipientEmail";
  recipientInput.placeholder = "participant@example.com";
  recipientInput.value = settings.inviteRecipientEmail || "";

  const recipientHint = document.createElement("p");
  recipientHint.className = "form-hint";
  recipientHint.textContent = "Email address to send meeting invitations to";

  recipientGroup.appendChild(recipientLabel);
  recipientGroup.appendChild(recipientInput);
  recipientGroup.appendChild(recipientHint);

  // Meeting title
  const meetingTitleGroup = document.createElement("div");
  meetingTitleGroup.className = "form-group";

  const meetingTitleLabel = document.createElement("label");
  meetingTitleLabel.htmlFor = "inviteMeetingTitle";
  meetingTitleLabel.textContent = "Meeting Title";

  const meetingTitleInput = document.createElement("input");
  meetingTitleInput.type = "text";
  meetingTitleInput.id = "inviteMeetingTitle";
  meetingTitleInput.placeholder = "Board Meeting - March 2025";
  meetingTitleInput.value = settings.inviteMeetingTitle || "";

  const meetingTitleHint = document.createElement("p");
  meetingTitleHint.className = "form-hint";
  meetingTitleHint.textContent = "Title to include in invitation subject line";

  meetingTitleGroup.appendChild(meetingTitleLabel);
  meetingTitleGroup.appendChild(meetingTitleInput);
  meetingTitleGroup.appendChild(meetingTitleHint);

  // Motion link template
  const motionLinkGroup = document.createElement("div");
  motionLinkGroup.className = "form-group";

  const motionLinkLabel = document.createElement("label");
  motionLinkLabel.htmlFor = "inviteMotionLink";
  motionLinkLabel.textContent = "Motion Link Template";

  const motionLinkInput = document.createElement("input");
  motionLinkInput.type = "text";
  motionLinkInput.id = "inviteMotionLink";
  motionLinkInput.placeholder = "https://chamber.org/motions/{id}";
  motionLinkInput.value = settings.inviteMotionLink || "";

  const motionLinkHint = document.createElement("p");
  motionLinkHint.className = "form-hint";
  motionLinkHint.textContent = "Template for motion links (use {id} placeholder)";

  motionLinkGroup.appendChild(motionLinkLabel);
  motionLinkGroup.appendChild(motionLinkInput);
  motionLinkGroup.appendChild(motionLinkHint);

  // Join link
  const joinLinkGroup = document.createElement("div");
  joinLinkGroup.className = "form-group";

  const joinLinkLabel = document.createElement("label");
  joinLinkLabel.htmlFor = "inviteJoinLink";
  joinLinkLabel.textContent = "Meeting Join Link";

  const joinLinkInput = document.createElement("input");
  joinLinkInput.type = "text";
  joinLinkInput.id = "inviteJoinLink";
  joinLinkInput.placeholder = "https://chamber.org/join/{id}";
  joinLinkInput.value = settings.inviteJoinLink || "";

  const joinLinkHint = document.createElement("p");
  joinLinkHint.className = "form-hint";
  joinLinkHint.textContent = "Template for meeting join links (use {id} placeholder)";

  joinLinkGroup.appendChild(joinLinkLabel);
  joinLinkGroup.appendChild(joinLinkInput);
  joinLinkGroup.appendChild(joinLinkHint);

  // Custom note
  const noteGroup = document.createElement("div");
  noteGroup.className = "form-group";

  const noteLabel = document.createElement("label");
  noteLabel.htmlFor = "inviteNote";
  noteLabel.textContent = "Invitation Footer Note";

  const noteInput = document.createElement("textarea");
  noteInput.id = "inviteNote";
  noteInput.placeholder = "Add any additional notes to include in email invitations...";
  noteInput.value = settings.inviteNote || "";
  noteInput.rows = 4;

  const noteHint = document.createElement("p");
  noteHint.className = "form-hint";
  noteHint.textContent = "Optional note to append to all invitation emails";

  noteGroup.appendChild(noteLabel);
  noteGroup.appendChild(noteInput);
  noteGroup.appendChild(noteHint);

  // Assemble form grid
  formGrid.appendChild(senderGroup);
  formGrid.appendChild(recipientGroup);
  formGrid.appendChild(meetingTitleGroup);
  formGrid.appendChild(motionLinkGroup);
  formGrid.appendChild(joinLinkGroup);
  formGrid.appendChild(noteGroup);

  form.appendChild(formGrid);

  // Info box
  const infoBox = document.createElement("div");
  infoBox.className = "settings-info-box";

  const infoTitle = document.createElement("p");
  infoTitle.className = "settings-info-title";
  infoTitle.textContent = "About Invitations";

  const infoText = document.createElement("p");
  infoText.className = "settings-info-text";
  infoText.textContent = "Email invitations are sent to meeting participants with links to motions and the meeting. Configure these settings to customize invitation content and delivery.";

  infoBox.appendChild(infoTitle);
  infoBox.appendChild(infoText);

  form.appendChild(infoBox);

  container.appendChild(form);
}
