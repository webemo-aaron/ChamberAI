import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildInviteEmail,
  isAuthorizedInviteSender,
  isValidEmail,
  mergeAuthorizedSenders,
  parseEnvInviteAllowedSenders
} from "../../services/api-firebase/src/services/invite_email.js";

test("invite email sender allowlist merge normalizes and deduplicates emails", () => {
  const result = mergeAuthorizedSenders(["AARON@mahoosuc.solutions"], ["aaron@mahoosuc.solutions", "chair@chamber.org"]);
  assert.deepEqual(result.sort(), ["aaron@mahoosuc.solutions", "chair@chamber.org"]);
});

test("invite sender authorization checks both env and settings entries", () => {
  const envAllowed = parseEnvInviteAllowedSenders("admin@chamber.org, secretary@chamber.org");
  const settingsAllowed = ["chair@chamber.org"];
  assert.equal(isAuthorizedInviteSender("SECRETARY@chamber.org", envAllowed, settingsAllowed), true);
  assert.equal(isAuthorizedInviteSender("unknown@chamber.org", envAllowed, settingsAllowed), false);
});

test("invite email template includes Motion link when provided", () => {
  const message = buildInviteEmail({
    chamberName: "Mahoosuc Chamber",
    meetingTitle: "March Board Meeting",
    motionLink: "https://app.usemotion.com/meeting/abc",
    inviteUrl: "https://secretary-console.vercel.app"
  });

  assert.equal(message.subject, "Mahoosuc Chamber invitation: March Board Meeting");
  assert.equal(message.html.includes("Open Motion workspace"), true);
  assert.equal(message.html.includes("View invitation details"), true);
});

test("email validation accepts basic real emails and rejects malformed addresses", () => {
  assert.equal(isValidEmail("aaron@mahoosuc.solutions"), true);
  assert.equal(isValidEmail("missing-at-sign"), false);
});
