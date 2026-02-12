# Chamber AI Ecosystem Design
**Date**: 2026-02-04  
**Status**: Approved for Phase 1 Implementation

---

## Executive Summary

The Chamber AI Ecosystem is a **hub-and-spoke architecture** where CAM-AIMS (Chamber Audio & AI Management System) serves as the authoritative central hub, publishing domain events to three specialized platforms:

1. **Business Hub** — Member-to-member support (referrals, partnerships, spotlights)
2. **Board Portal** — Leadership dashboards (member health, operations, insights)
3. **Analytics Engine** — Unified data warehouse for metrics and reporting

This design enables:
- **Business owners** to find, refer, and partner with each other
- **Chamber board** to lead operations with real-time visibility
- **Governance-first** approach where CAM-AIMS remains the source of truth
- **Modular scaling** where features roll out independently

---

## Architecture Overview

### Data Flow (One Direction)

```
CAM-AIMS (Hub)
  ├─ Publishes Events
  │  ├─ member.joined
  │  ├─ meeting.completed
  │  ├─ action_item.created
  │  └─ participation_metric.recorded
  │
  ├─ Business Hub (subscribes to events)
  │  ├─ Maintains referrals, partnerships
  │  └─ Publishes: referral.completed
  │
  ├─ Board Portal (subscribes to events)
  │  ├─ Displays member health, action items
  │  └─ Publishes: decision.made, goal.updated
  │
  └─ Analytics Engine (subscribes to all events)
     ├─ Normalizes data
     ├─ Computes metrics
     └─ Serves dashboards & exports
```

**Why one direction?** Prevents circular dependencies. CAM-AIMS never becomes dependent on other platforms.

---

## Section 1: CAM-AIMS as Central Hub

### Data Owned by CAM-AIMS
- Member profiles (name, company, industry, contact)
- Meeting metadata (date, attendees, agenda)
- Minutes (approved secretary record)
- Motions (passed, failed, pending)
- Action items (assigned, deadline, status)
- Member roles (board member, committee chair, etc.)
- Approval workflows & audit logs
- Attendance & participation history

### Domain Events Published
When these events occur, CAM-AIMS publishes to Firebase Pubsub:

| Event | Triggered By | Consumed By |
|-------|--------------|-------------|
| `member.joined` | Admin adds new member | All platforms (populate directory) |
| `member.profile_updated` | Member edits profile | Business Hub, Analytics |
| `meeting.created` | Secretary creates meeting | Board Portal, Analytics |
| `meeting.completed` | Secretary approves minutes | All platforms (meeting is official) |
| `action_item.created` | Board assigns action | Board Portal, Analytics |
| `action_item.updated` | Action status changes | Board Portal, Analytics |
| `participation_metric.recorded` | Meeting attendance tracked | Board Portal, Analytics |
| `member.role_changed` | Board updates member role | Board Portal, Analytics |

### Integration Constraints
- Other platforms **never write** to CAM-AIMS
- Other platforms **only consume events** (immutable)
- CAM-AIMS remains governance-focused (no business logic leakage)

---

## Section 2: Business Hub Platform

### Purpose
Enable chamber members to find, refer, and partner with each other to serve customers better.

### Primary Users
- Regular chamber members (business owners, entrepreneurs)
- Committee chairs (secondary access)

### Core Features

#### 1. Member Directory with Smart Search
- **Search filters**: Industry, service type, location, expertise, committee membership
- **Member card shows**: Company name, industry, expertise tags, spotlights/achievements, contact form
- **One-click referral**: "Request a referral from this member"
- **Data source**: Pulled from CAM-AIMS (auto-sync on member.profile_updated event)

#### 2. Referral Board (Async Marketplace)
- **Post a need**: "Looking for: graphic designer for client project" (categorized)
- **Responses**: Other members reply with offers/introductions
- **Tracking**: Mark referral as "completed" → generates referral.completed event
- **Analytics**: Board sees referral volume by category (feeds Board Portal)
- **Example**: Accountant posts "Need freelance bookkeeper" → 3 designers respond → Accountant picks one → Referral marked complete

#### 3. Partnership Opportunities
- **Post collaboration ideas**: "Co-marketing event?" "Joint proposal?" "Looking for tech cofounder"
- **Smart matching**: Show members whose services complement yours
- **Discussion thread**: Direct messaging with interested partners
- **Track outcomes**: Completed partnerships feed Analytics

#### 4. Member Spotlights & Milestones
- **Auto-pulled from CAM-AIMS**: Anniversaries, committee roles, achievements mentioned in meetings
- **Member self-reporting**: Add custom milestones, awards, achievements
- **Spotlight rotation**: Featured member of the week (public-facing gallery, opt-in)
- **Example**: "Jane's company was mentioned 5 times in meetings this month" → Auto-featured

#### 5. Expertise Marketplace
- **Members tag skills**: "I offer: business consulting, intro services, marketing advice"
- **Request help**: "Need advice on hiring practices"
- **Helpfulness scoring**: Track who helps most → builds community culture
- **Privacy**: Members control visibility (public vs. connections-only)

### User Experience Philosophy
- **Mobile-first**: Members check on lunch breaks, commutes
- **Peer-focused**: Zero board presence; all content is member-to-member
- **Low friction**: One-click referrals, not forms
- **Transparency**: See all open requests, participation is encouraged

### Data Model
```
Referral {
  id, member_id, category, description, 
  responses: [{ responder_id, message, timestamp }],
  status: pending|completed|closed,
  completed_partner_id (if matched),
  created_at, updated_at
}

Partnership {
  id, initiator_id, description, 
  participants: [member_id],
  outcome: pending|completed|closed,
  created_at, completed_at
}

Spotlight {
  id, member_id, description, source: auto|self_reported,
  featured_week: YYYY-WW,
  created_at
}
```

### Integration with CAM-AIMS
- **Auth**: Single sign-on via CAM-AIMS
- **Data**: Member profiles pulled on member.profile_updated
- **Events published**: 
  - `referral.completed` (when matched)
  - `partnership.created`, `partnership.completed`
  - `spotlight.featured` (for tracking)

---

## Section 3: Board Portal Platform

### Purpose
Give chamber leadership real-time operational visibility and decision support.

### Primary Users
- Board members (all metrics)
- Committee chairs (their committee only)
- Executive Director (all + admin functions)
- Board Chair (governance + all metrics)

### Core Features

#### 1. Member Health Dashboard
- **Health Score** (0-100): Weighted combination of
  - Meeting attendance rate (last 3 months): 40%
  - Committee participation: 30%
  - Action item completion: 20%
  - Referral activity (gave + received): 10%
- **Visual**: Color-coded heatmap (Green: 70+, Yellow: 40-70, Red: <40)
- **Drill-down**: Click member → see attendance history, referral activity, committees, why disengaged
- **Alerts**: "3 members dropped below 40 this week" → board can reach out
- **Renewal risk**: Flag members not renewing (based on engagement trend)

#### 2. Economic Development Insights
- **Business Retention & Expansion (BRE)**: 
  - Track member industry (pull from CAM-AIMS)
  - Flag at-risk businesses (declining attendance, not in referrals)
  - BRE action items (calls, check-ins, retention plays)
- **Industry heatmap**: 
  - Which industries are well-represented?
  - Which industries are we missing?
  - Growth by industry (YoY new members)
- **Referral activity by category**:
  - Where are connections happening? (Finance, Tech, Services)
  - Which industries give most referrals?
  - Which are under-participating?
- **Sponsorship pipeline**: Track renewal, growth, risk sponsors

#### 3. Meeting & Action Management
- **Meeting approvals**: View minutes from CAM-AIMS, status of approvals
- **Action item dashboard**: 
  - All open actions across committees
  - Owner, deadline, status
  - Color-coded by due date (Red: overdue, Yellow: due soon, Green: on track)
- **Committee view**: Filter by committee
- **Completion rate**: Track % of actions completed on time
- **Escalation**: Auto-flag overdue items (notify owner + committee chair)

#### 4. Governance & Compliance
- **Meeting log**: Complete history of approved minutes
- **Attendance records**: For board certification, member disputes
- **Resolution tracking**: Motions passed, outcomes tracked
- **Audit log**: Who accessed what, when (compliance for SOC2/HIPAA if applicable)

#### 5. Engagement Analytics
- **Month-over-month trends**: 
  - Total participation score
  - Attendance rate
  - New member onboarding rate
  - Churn rate
- **Member lifecycle**: Visualize stages (new → active → at-risk → churned)
- **Cohort analysis**: "2024 new members have 60% lower retention" → identify onboarding gap
- **Committee health**: Which committees are most active? Least?
- **Participation equity**: Are benefits distributed evenly or concentrated?

#### 6. Communication Hub
- **Draft announcements**: Create messages to members
- **Engagement tracking**: See who opened, clicked, engaged
- **Newsletter builder**: Feature member spotlights, referral wins, upcoming events
- **Member segments**: Target announcements (e.g., "new members," "committee chairs")

### User Experience Philosophy
- **Executive dashboard**: One login, instant overview of chamber health
- **Drill-down**: Click any metric to see details
- **Actionable**: Every metric suggests an action (call at-risk member, celebrate referral, escalate overdue action)
- **Mobile-friendly**: Board can check status on phone

### Data Model
```
MemberHealthScore {
  member_id, score: 0-100,
  attendance_rate, committee_participation, 
  action_completion, referral_activity,
  calculated_at, renewal_risk: boolean
}

ActionItem {
  id, description, assigned_to, 
  deadline, status, committee_id,
  created_at, completed_at
}

EngagementMetric {
  member_id, month: YYYY-MM,
  attendance_rate, participation_score, 
  referral_count_given, referral_count_received
}
```

### Integration with CAM-AIMS
- **Auth**: Single sign-on via CAM-AIMS
- **Data**: All member, meeting, action item data pulled via events
- **Events consumed**: member.joined, meeting.completed, action_item.*, participation_metric.recorded
- **Events published**: 
  - `decision.made` (board approval)
  - `goal.updated` (board sets chamber goals)
  - `communication.sent` (when announcing to members)

---

## Section 4: Analytics Engine

### Purpose
Unified data warehouse that normalizes data from all sources, computes metrics, and serves insights to Board Portal and external integrations.

### Architecture

```
Event Sources
  ├─ CAM-AIMS (member, meeting, action items)
  ├─ Business Hub (referrals, partnerships)
  └─ Board Portal (decisions, communications)
        ↓
Firebase Pubsub (event stream)
        ↓
Data Ingestion Layer (subscribe + parse)
        ↓
BigQuery (data warehouse)
        ├─ Raw Events Table (immutable, append-only)
        ├─ Normalized Member Table (point-in-time snapshots)
        ├─ Normalized Meeting Table
        ├─ Referral Activity Table
        └─ Metrics Table (attendance %, completion %, scores)
        ↓
Metrics Layer (dbt transforms)
        ├─ Member engagement scores
        ├─ Chamber health index
        ├─ Economic development trends
        └─ Predictive risk scores (Phase 5+)
        ↓
API Layer (serve data)
        ├─ Board Portal dashboards (real-time)
        ├─ Batch reports (daily/weekly exports)
        ├─ External integrations (Zoho CRM, Mailchimp)
        └─ BI tools (Tableau, Looker)
```

### Core Capabilities

#### 1. Data Ingestion & Normalization
- **Subscribe to events**: All Pubsub topics from CAM-AIMS, Business Hub, Board Portal
- **Parse + validate**: Ensure event schema correctness
- **Persist to BigQuery**: Raw events table (append-only, immutable)
- **Deduplicate**: Handle retries (idempotent ID-based processing)

#### 2. Metric Computation
- **Member engagement score**: Weighted formula
  - Attendance rate (40%)
  - Committee participation (30%)
  - Action item completion (20%)
  - Referral activity (10%)
- **Chamber health index**: Composite metric
  - Average engagement score
  - Growth rate (new members/month)
  - Retention rate (renewals/total)
  - Referral velocity (connections/month)
- **Referral metrics**:
  - Referrals by category/industry
  - Completion rate (requested vs. completed)
  - Most active members (givers/receivers)
- **Committee effectiveness**:
  - Action item completion % by committee
  - Committee participation rate
  - Impact (actions that created business results)

#### 3. Predictive Analytics (Phase 5+)
- **Churn risk scoring**: Machine learning model predicting likelihood of non-renewal
  - Input: attendance trend, participation drop, referral decline
  - Output: Risk score + "Why this member is at-risk"
- **High-value member identification**: Who drives most referrals, actions completed?
- **Industry gap analysis**: Automatically identify missing industries
- **Seasonal patterns**: When do members disengage? (holidays, summer, etc.)

#### 4. Reporting & Exports
- **Pre-built board reports**:
  - Monthly engagement digest (PDF)
  - Quarterly economic development summary
  - Annual state-of-chamber report
- **Member data exports**:
  - For CRM sync (Zoho, Salesforce, HubSpot)
  - For email marketing (Mailchimp, ConvertKit)
  - For event registration (Eventbrite)
- **Public insights** (anonymized, opt-in):
  - "Our community created 127 business referrals this quarter"
  - "Tech industry grew 15% YoY"
  - Marketing for chamber growth

#### 5. Data Availability
- **Real-time dashboards**: Board Portal refreshes every 5 minutes
- **Batch reports**: Daily snapshots for historical analysis
- **API access**: Custom queries for advanced users
- **Data warehouse**: Direct BigQuery access for BI tools (if chamber wants Tableau, Looker, etc.)

### Data Model (BigQuery Tables)

```
events (raw, immutable)
  event_id, event_type, chamber_id, timestamp, 
  payload (JSON), source (cam_aims|business_hub|board_portal)

members (snapshot, refreshed daily)
  member_id, name, company, industry, status (active|inactive|churned),
  joined_date, last_activity_date, engagement_score

meetings (snapshot, refreshed daily)
  meeting_id, date, attendees: [member_id], 
  actions_created: count, minutes_approved: boolean

referrals (transactional)
  referral_id, requester_id, responder_id, category, status,
  created_at, completed_at

metrics (computed, refreshed hourly)
  member_id, month: YYYY-MM, attendance_rate, 
  participation_score, referral_given_count, referral_received_count,
  action_completion_pct, engagement_score
```

### Integration Points
- **Consumes from**: CAM-AIMS, Business Hub, Board Portal (all via Pubsub events)
- **Serves to**: 
  - Board Portal (dashboards, member health)
  - Business Hub (referral metrics, leaderboards)
  - External systems (Zoho CRM, Mailchimp, Google Analytics)
  - BI tools (Tableau, Looker, Data Studio)

---

## Section 5: User Flows & Permissions

### Authentication
**Single Sign-On via CAM-AIMS**
- Users log in once to CAM-AIMS
- Token shared with Business Hub, Board Portal
- Auth managed centrally (no duplicate login databases)

### Role Hierarchy

```
Regular Member
  ├─ Business Hub (full access)
  ├─ Board Portal (NO access)
  └─ Can view: public member directory, public spotlights

Committee Chair (Member + Responsibility)
  ├─ Business Hub (full access)
  ├─ Board Portal (committee view only)
  │  └─ Can see: their committee's action items, members, performance
  └─ Can manage: action items for their committee

Board Member
  ├─ Business Hub (full access)
  ├─ Board Portal (full access)
  └─ Can view: all members, all metrics, all committees

Executive Director / Staff
  ├─ All platform access
  ├─ Admin functions (member management, exports)
  ├─ Integration management (CRM sync, email campaigns)
  └─ Can configure: feature flags, settings

Board Chair
  ├─ All platform access + governance
  ├─ Can approve/deny minutes (delegated to CAM-AIMS)
  ├─ Can set chamber-wide goals
  └─ Can manage: member roles, board members
```

### User Flow Examples

#### Flow 1: Regular Member Uses Business Hub
```
1. Member logs in → single sign-on (CAM-AIMS)
2. Visits Business Hub dashboard
3. Searches "graphic designer" in directory
4. Finds Jane's profile (5-star referral record)
5. Clicks "Request Referral"
6. Jane receives notification
7. Jane responds with introduction + proposal
8. Member marks referral "completed"
9. Both get credit (Analytics tracks: "1 referral completed")
```

#### Flow 2: Board Member Reviews Member Health
```
1. Board member logs in → CAM-AIMS
2. Visits Board Portal
3. Sees member health heatmap (10 members in red)
4. Clicks "Red" → filtered list
5. Clicks member "Bob" → sees:
   - Attendance trend (declining last 3 months)
   - Last referral activity (6 months ago)
   - Committee: none
   - Action items: none
6. Board notes: "Call Bob to check in"
7. Board Portal logs this action
```

#### Flow 3: Committee Chair Manages Actions
```
1. Committee chair logs in → CAM-AIMS
2. Visits Board Portal
3. Filters to their committee: "Economic Development"
4. Sees 5 open action items
5. Clicks action "Recruit 5 tech companies by Q2"
6. Sees owner (Jennifer), deadline (March 31)
7. Updates status: "In Progress" + adds note
8. Action item changes color to yellow
9. Jennifer gets notification
```

### Data Privacy by Role

| Data | Regular Member | Committee Chair | Board Member | Exec Director |
|------|--|--|--|--|
| Own profile | ✓ edit | ✓ edit | ✓ edit | ✓ edit |
| Other profiles (public) | ✓ read | ✓ read | ✓ read | ✓ read |
| Other profiles (private contact) | ✗ | Connected only | ✓ | ✓ |
| Member health scores | ✗ | Committee only | ✓ all | ✓ all |
| Attendance records | ✗ | Committee only | ✓ all | ✓ all |
| Meeting minutes | ✓ public | ✓ public | ✓ all | ✓ all |
| Audit logs | ✗ | ✗ | ✗ | ✓ |
| Export member data | ✗ | ✗ | ✗ | ✓ |

### Cross-Platform Permission Sync
- **Source of truth**: CAM-AIMS roles
- **Sync mechanism**: When member.role_changed event fires
- **Business Hub + Board Portal**: Subscribe to event, update role locally
- **Latency**: <1 second propagation

### Audit Logging
Every access to sensitive data is logged:
```
audit_log {
  timestamp, user_id, action: "viewed_member_contact",
  resource: member_id, result: success|denied
}
```
- Board can see "Who viewed member contact info?" (compliance)
- Exports generate audit trail (PCI-DSS, HIPAA audit readiness)

---

## Section 6: Implementation Sequence (6 Phases)

### Phase 1: CAM-AIMS Core + Event Foundation (Weeks 1–6)
**Objective**: Establish hub with reliable event publishing

**Deliverables**:
- [ ] CAM-AIMS MVP complete
  - Meeting creation, audio upload, draft minutes
  - Approval workflow (secretary signs off)
  - Action item extraction (AI + manual)
  - Retention + audit log
- [ ] Event schema & Pubsub setup
  - Event types defined (member.*, meeting.*, action_item.*, participation_metric.*)
  - Firebase Pubsub topics created
  - Event publishing library in Node.js
- [ ] Board Portal skeleton
  - Login (via CAM-AIMS)
  - Member list view (read-only)
  - Attendance view (simple table)

**Why first**: Everything depends on reliable events. CAM-AIMS must be stable + event-publishing before other platforms build on it.

**Dependencies**: CAM-AIMS (in progress)

**Team**: 2 devs
- Dev 1: CAM-AIMS core completion
- Dev 2: Event infra + Board Portal skeleton

---

### Phase 2: Board Portal MVP + Basic Analytics (Weeks 7–10)
**Objective**: Give board operational visibility; validate analytics pipeline

**Deliverables**:
- [ ] Board Portal MVP
  - Member health heatmap (attendance + participation score)
  - Action item tracking (by committee, status, deadline)
  - Meeting approval workflow view
  - Monthly engagement report (PDF export)
- [ ] Analytics Engine foundation
  - Pubsub event ingestion pipeline
  - BigQuery schema + data loading
  - dbt transforms (basic metrics)
  - Member health score computation
- [ ] Dashboards
  - Real-time board metrics (5-minute refresh)
  - Historical trend charts (attendance %, completion %)

**Why now**: CAM-AIMS + events proven. Board gets early value; validates analytics architecture.

**Dependencies**: Phase 1 complete

**Team**: 2 devs
- Dev 1: Board Portal UI/UX
- Dev 2: Analytics data pipeline + metrics

---

### Phase 3: Business Hub MVP + Referral Board (Weeks 11–16)
**Objective**: Enable peer-to-peer member support; core business value

**Deliverables**:
- [ ] Business Hub platform (React app)
  - Member directory (searchable by industry, expertise)
  - Member profile pages (from CAM-AIMS data)
  - Referral Board (post needs, respond to offers)
  - Referral tracking (completion status)
- [ ] Member Spotlights integration
  - Auto-pull achievements from CAM-AIMS
  - Member self-reporting
  - Rotation logic (featured member)
- [ ] Analytics integration
  - Track referral.completed events
  - Feed to Analytics Engine
  - Referral metrics appear in Board Portal

**Why now**: Analytics pipeline proven. Board Portal foundation stable. Members ready for peer network.

**Dependencies**: Phase 1, 2 complete

**Team**: 2 devs
- Dev 1: Business Hub UI/UX
- Dev 2: Referral Board logic + event integration

---

### Phase 4: Partnership Tools + Enhanced Board Portal (Weeks 17–22)
**Objective**: Deepen member collaboration; board gets economic insights

**Deliverables**:
- [ ] Business Hub enhancements
  - Partnership matching ("Your industry needs...")
  - Expertise marketplace (members offer skills)
  - Community spotlights (public gallery)
- [ ] Board Portal enhancements
  - Economic development dashboard (referral heatmap by industry)
  - Member lifecycle visualization (new → active → at-risk)
  - Committee effectiveness scores
  - Sponsorship/funding pipeline tracker
- [ ] Metrics expansion
  - Industry analysis (which industries active?)
  - Referral patterns by category
  - Seasonal trend detection

**Why now**: Referral board data shows patterns. Board ready for deeper insights.

**Dependencies**: Phase 3 complete

**Team**: 2–3 devs
- Dev 1: Business Hub features
- Dev 1–2: Board Portal features
- Dev 2: Analytics metrics expansion

---

### Phase 5: Predictive Analytics + Integrations (Weeks 23–28)
**Objective**: Enable proactive leadership; external data sync

**Deliverables**:
- [ ] Predictive models
  - Churn risk scoring (identify at-risk members early)
  - High-value member identification
  - Industry gap analysis
  - Seasonal pattern detection
- [ ] Integrations
  - Zoho CRM sync (member data ↔ contacts)
  - Mailchimp integration (member segments for campaigns)
  - Google Calendar sync (chamber events)
- [ ] Advanced dashboards
  - Churn risk leaderboard
  - Predictive alerts ("4 members at-risk this quarter")
  - Integration health status

**Why now**: Analytics mature. Board trusts metrics. Executives ready for integrations.

**Dependencies**: Phase 4 complete

**Team**: 2 devs
- Dev 1: Integrations (Zoho, Mailchimp, Calendar)
- Dev 2: Predictive models (churn, gap analysis)

---

### Phase 6: Advanced Features & Scale (Weeks 29+)
**Objective**: Polish, optimize, enable advanced users

**Deliverables**:
- [ ] Business Hub advanced features
  - AI-powered member matching ("Members you should know")
  - Automated spotlight rotation
  - Community health alerts
- [ ] Board Portal advanced features
  - Custom cohort analysis
  - Automated report scheduling (email digest)
  - Multi-chamber support (if scaling beyond one)
- [ ] Performance optimization
  - Search indexing (Business Hub directory)
  - Caching (member data, metrics)
  - Load testing + optimization
- [ ] Documentation & training
  - Board user guide
  - Business member guide
  - Admin playbook

**Why later**: Refinement. Early phases prove value; Phase 6 scales it.

**Dependencies**: Phase 5 complete

**Team**: 3 devs + product/marketing
- Dev 1: Business Hub features
- Dev 2: Board Portal features
- Dev 3: Performance + infrastructure
- Product: Training materials

---

### Parallel & Sequential Opportunities
```
Phase 1 (CAM-AIMS + Events)
  ↓
Phase 2 (Board Portal + Analytics)
  ├─→ Phase 3 (Business Hub) [can start together]
  │   ├─→ Phase 4 (Enhanced features)
  │   │   └─→ Phase 5 (Integrations)
  │   │       └─→ Phase 6 (Polish/Scale)
```

**Recommended sequencing**:
- Weeks 1–6: Phase 1 (CAM-AIMS, events)
- Weeks 7–10: Phase 2 (Board Portal baseline)
- Weeks 11–16: Phase 2 continued + Phase 3 starts (overlap)
- Weeks 17–22: Phase 3 stabilizes + Phase 4
- Weeks 23–28: Phase 4 stabilizes + Phase 5
- Weeks 29+: Phase 5 stabilizes + Phase 6

---

## Technology Stack & Rationale

### Frontend
- **Framework**: React (existing tech)
- **UI Library**: Material-UI or Tailwind (for rapid design)
- **State Management**: Redux or Zustand (simple + proven)
- **Mobile**: Responsive design (not native apps initially)

### Backend
- **Runtime**: Node.js (existing)
- **API**: Express or Next.js API routes
- **Authentication**: Firebase Auth (existing)
- **Job queue**: Cloud Tasks or Bull (for async work)

### Data & Analytics
- **Event streaming**: Firebase Pubsub (existing)
- **Data warehouse**: BigQuery (scalable, cost-effective)
- **Metrics layer**: dbt (transforms events → metrics)
- **API**: Node.js service (serves dashboards)

### Integrations
- **Zoho CRM**: REST API + webhooks
- **Mailchimp**: REST API
- **Google Calendar**: Google Calendar API
- **Firebase**: Pubsub, Auth, Firestore

### Infrastructure
- **Hosting**: Google Cloud Run (serverless)
- **Database**: Firestore (events, operational data) + BigQuery (analytics)
- **Monitoring**: Cloud Logging, Cloud Monitoring

---

## Success Metrics

### Phase 1
- ✅ CAM-AIMS MVP shipped with zero event publishing errors (99.9% uptime)
- ✅ Board Portal shows real-time member data within 5 seconds of CAM-AIMS update

### Phase 2
- ✅ Board Portal used by 100% of board members in monthly review meetings
- ✅ Analytics dashboards answer 90% of board questions (no manual data pulling)

### Phase 3
- ✅ 50%+ of members using Business Hub within 3 months
- ✅ 20+ referrals completed (tracked in analytics)
- ✅ Members report value ("Found 2 new business partners")

### Phase 4
- ✅ Board uses economic insights to identify recruitment gaps (acts on 2+)
- ✅ Sponsorship pipeline tracking reduces revenue surprise

### Phase 5
- ✅ Proactive board intervention prevents 3+ member churns (measured by retention lift)
- ✅ CRM sync reduces manual data entry by 80%

### Phase 6
- ✅ System adoption plateau at 75%+ of members
- ✅ AI matching creates 30+ high-value partnerships YoY

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Event publishing failures (CAM-AIMS crashes other platforms) | Critical | Dead-letter queues for failed events; unit tests on all event schemas; canary deployment |
| Member privacy concerns (board sees too much) | High | Clear privacy policy; RBAC enforced in code; audit logging; SOC2 compliance |
| Poor Business Hub adoption (members don't use it) | High | Strong launch comms; early wins (spotlights, easy referrals); committee champions |
| Analytics data stale/incorrect | Medium | Real-time dashboards; automated data quality checks; dbt tests; alerting on anomalies |
| Integration overload (too much external data) | Medium | Phased integrations (CRM first, others later); clear ROI before each integration |

---

## Next Steps

1. **Lock in design**: Confirm architecture with all stakeholders
2. **Create implementation plan**: Detailed task breakdown for Phase 1
3. **Set up development environment**: 
   - Git worktree for isolated Phase 1 work
   - Staging environment for Board Portal
4. **Recruit team**: Identify 2–3 developers for Phase 1
5. **Communicate with board**: Show roadmap, get buy-in on priorities

---

## Appendix: Event Schema

```typescript
interface DomainEvent {
  event_id: string; // unique UUID
  event_type: string; // member.joined, meeting.completed, etc.
  chamber_id: string; // which chamber (multi-tenant support)
  timestamp: ISO8601; // when it happened
  actor_id?: string; // who caused it (user ID)
  payload: Record<string, any>; // event-specific data
  version: number; // schema version (for backwards compatibility)
}

// Example events:
{
  event_id: "uuid-1",
  event_type: "member.joined",
  chamber_id: "chamber-1",
  timestamp: "2026-02-04T10:00:00Z",
  actor_id: "user-123", // admin who added them
  payload: {
    member_id: "member-456",
    name: "Jane Doe",
    company: "Doe Consulting",
    industry: "Professional Services",
    email: "jane@doeconsulting.com"
  }
}

{
  event_id: "uuid-2",
  event_type: "meeting.completed",
  chamber_id: "chamber-1",
  timestamp: "2026-02-04T15:00:00Z",
  actor_id: "user-789", // secretary
  payload: {
    meeting_id: "meeting-111",
    date: "2026-02-04",
    attendees: ["member-1", "member-2", "member-3"],
    actions_created: 5,
    actions_assigned: {
      "member-1": 2,
      "member-2": 3
    }
  }
}
```

