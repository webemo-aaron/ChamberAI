# CAM-AIMS Roadmap (Modular, Feature-Flagged)

Date: 2026-01-22

## Goals
- Deliver value in small, reversible modules
- Allow Chambers to enable/disable features per board
- Keep governance-first posture

---

## 1) Feature Modules (Enable/Disable)

### A. Core Minutes (Required)
- Meeting creation, audio upload, batch processing
- Draft minutes, motions, action items
- Approval gate + exports

### B. Public Summary
- Generate public-safe summary after approval
- Optional auto-publish toggle

### C. Member Spotlight
- Auto-rotate spotlight in minutes/newsletters
- Track anniversaries/milestones

### D. Referral Board
- Member-to-member referral requests
- Categorized “Looking for” queue

### E. Visitor Experience
- Visitor FAQ list
- Seasonal “What’s open late” and “Rainy day” lists

### F. Event Collaboration
- Shared events calendar
- Sponsorship request workflow

### G. Business Retention (BRE)
- Structured checklists + risk flags
- Follow-up action item templates

### H. Funding & Grants
- Grant pipeline tracking
- Sponsorship renewal checklist

### I. Analytics Dashboard
- Participation, action completion, member health

### J. Integrations
- CRM (HubSpot/Salesforce)
- Email (Mailchimp)
- Calendar (Google/M365)

---

## 2) Feature Flags & Packaging

Flags should be stored per Chamber:
- `core_minutes` (always on)
- `public_summary`
- `member_spotlight`
- `referral_board`
- `visitor_experience`
- `event_collaboration`
- `bre_tools`
- `funding_grants`
- `analytics_dashboard`
- `integrations_*`

Implementation note:
- Feature flags are stored in Settings and managed in the Console Settings panel.

Packaging examples:
- **Essentials:** core_minutes + public_summary
- **Growth:** Essentials + spotlight + referral_board
- **Tourism:** Essentials + visitor_experience + events
- **Economic Dev:** Essentials + bre_tools + funding_grants

---

## 3) Phased Roadmap

### Phase 1 — MVP Release (Weeks 1–6)
- Core Minutes
- Approval gate + exports
- Action item CSV export
- Retention + audit log

### Phase 2 — Community Comms (Weeks 7–10)
- Public Summary module
- Member Spotlight module

### Phase 3 — Business Support (Weeks 11–16)
- Referral Board module
- BRE tools module

### Phase 4 — Tourism & Events (Weeks 17–22)
- Visitor Experience module
- Event Collaboration module

### Phase 5 — Funding & Analytics (Weeks 23–28)
- Funding/Grants module
- Analytics Dashboard module

### Phase 6 — Integrations (Weeks 29+)
- CRM, Calendar, Email integrations

---

## 4) Implementation Strategy

- Each module has:
  - Feature flag
  - UI surface (tab/panel)
  - API scope
  - Data schema additions
  - Permissions

- Core domain events:
  - meeting_created
  - minutes_approved
  - action_item_created
  - export_generated

---

## 5) Governance Considerations

- Public summary must never expose raw audio/transcripts
- Referral board is member-only by default
- Visitor lists are publishable with Chair approval

---

## 6) Next Actions

1) Confirm packaging for pilot Chamber
2) Define schema additions per module
3) Add feature flag table in settings
4) Build Phase 2 modules (Public Summary + Spotlight)
