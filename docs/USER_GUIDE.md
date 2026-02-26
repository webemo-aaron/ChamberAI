# ChamberAI User Guide

## What This App Does
ChamberAI helps the chair and secretary run meetings from separate laptops, capture notes, process recordings, manage motions, and publish approved outcomes.

## Sign In
1. Open `https://secretary-console.vercel.app`.
2. Select `Continue with Google`.
3. Use your authorized chamber email.
4. If access is denied, ask an admin to invite or authorize your email.

## Roles
- `admin`: full access, settings, authorization, memberships.
- `secretary`: meeting operations, invites, processing, publishing.
- `viewer`: read-only visibility.

## Daily Meeting Workflow
1. Create a meeting with date, time, location, chair, and secretary.
2. Register room audio source(s).
3. Process the meeting.
4. Review and edit draft minutes.
5. Add motions and action items.
6. Resolve approval warnings.
7. Approve and export minutes.
8. Optionally publish public summary.

## Two-Laptop Collaboration (Chair + Secretary)
- Both users can open the same meeting at once.
- Minutes autosave and sync.
- Version history supports rollback when edits collide or need correction.
- Recommended: chair validates content and approvals while secretary handles edits and operations.

## Invite and Access Management
Location: `Settings` -> `Email Invites` (requires email integration feature flag).

1. Admin adds authorized sender email(s).
2. Authorized sender enters recipient email.
3. Optionally include:
- Meeting title
- Motion link
- Invite/join link
- Note
4. Send invite.
5. Invite creates/updates membership with default role `viewer`.

## Motion Configuration (Secretary/Admin)
Location: `Settings` -> `Motion Integration`

1. Enable Motion integration.
2. Add Motion API key.
3. Optionally set workspace/project IDs.
4. Set a default meeting link template:
- Example: `https://app.usemotion.com/?q={{meeting_title}}`
5. Save and run `Test Connection`.

When sending invites, if no manual Motion link is entered, ChamberAI uses the default template for all meetings.

## Troubleshooting
- `User is not authorized for this chamber`: ask admin to add membership.
- `Sender is not authorized to send invites`: admin must authorize sender email.
- `Invite email is not configured`: backend missing Resend env vars.
- Google auth errors: verify Firebase Google provider and authorized domains.
