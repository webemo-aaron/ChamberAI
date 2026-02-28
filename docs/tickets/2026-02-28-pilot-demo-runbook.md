# Pilot Demo Runbook: Geo Intelligence Workflow

Date: 2026-02-28
Owner: Product + Chamber Ops
Status: Ready to Run

## Objective
Demonstrate end-to-end local opportunity workflow:
1. Scan area by ZIP/city/town
2. Generate localized brief
3. Copy outreach content
4. Export briefs JSON for follow-up

## Audience
- Chamber executive director
- Board chair / committee leads
- 2-3 pilot local businesses
- One implementation partner/provider

## Environment Prep
1. Start API and console stack.
2. Ensure at least one meeting exists with location and tags.
3. Verify login role is `admin` or `secretary`.
4. Confirm API base in console points to active stack.

## Demo Script (10-15 min)
1. Open **Geo Intelligence** panel in Secretary Console.
2. Set scope:
   - `Scope Type`: `city`
   - `Scope ID`: target pilot city (e.g., `Bethel`)
3. Add 2-3 local details in multiline input.
4. Click **Scan Area**.
   - Callout: profile density/readiness scores and demand gaps.
5. Click **Generate Brief**.
   - Callout: top use cases + localized summary + outreach draft.
6. Click **Copy Outreach**.
   - Paste into sample email/newsletter draft.
7. Click **Export Briefs JSON**.
   - Show file handoff for ops tracking/reporting.

## Success Criteria
- Geo profile generated without errors.
- Brief generated with relevant use cases.
- Outreach copy produced and reusable.
- Export file downloaded for operational use.
- Stakeholders agree on first 3 pilot opportunities.

## Post-Demo Actions
1. Select first pilot scope (city/town/ZIP).
2. Approve first outreach batch (10-20 businesses).
3. Assign owner for weekly geo scan + brief cadence.
4. Review outcomes after 2 weeks with scoreboard template.
