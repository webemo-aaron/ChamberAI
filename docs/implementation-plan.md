# CAM-AIMS Implementation Plan (UI, API, Data Model)

Date: 2026-01-22
Owner: Chamber Secretary
Scope: From current mock to initial release (MVP)

---

## 0) Summary

This plan defines the full implementation path for CAM-AIMS from the current mock system to an initial release. It includes:
- UI build-out for Secretary Console and Attendee Mic Join
- API + worker pipeline design
- Data model and storage layout
- Security, governance, and retention
- Milestones, risks, and release checklist

The guiding principle remains: **AI assists the Secretary; the Secretary is editor of record.**

---

## 1) Current State vs Target

### Current (Mock)
- Static Secretary Console UI (HTML/JS/CSS)
- In-memory API endpoints + worker mock pipeline
- Draft minutes + action items + motions + approval gates
- CSV export/import for action items
- Settings mock, tags, filters, export history

### Target (Initial Release)
- Production UI (Secretary Console)
- Real API + DB + storage (GCP/Firebase or Postgres + GCS)
- Batch transcription pipeline + diarization
- Retention policy + audit log + RBAC
- Formal minutes export (PDF/DOCX) and task export

---

## 2) Product Requirements (MVP)

Required outcomes:
- Create meeting, upload audio, process transcription, generate draft minutes
- Secretary can edit motions, votes, action items
- Approval gates enforced
- Exports available (PDF/DOCX + CSV action items)
- Retention policy enforced on raw audio
- Role-based access + audit log

Non-goals:
- Real-time transcription
- Public audio sharing
- Verbatim transcript as official record

---

## 3) UI Implementation Plan

### 3.1 Secretary Console

Pages:
1) Meetings List
   - Columns: date, location, status, tags
   - Filters: tag, status, recent days, search
   - Actions: new meeting, quick create, seed demo

2) Meeting Detail
   Tabs:
   - Overview: metadata, audio sources, process/reprocess
   - Transcript: segments, speaker relabel
   - Minutes: structured editor
   - Motions & Votes: table editor
   - Action Items: table editor + CSV import/export
   - Exports: PDF/DOCX/MD + export history
   - Audit log

3) Settings
   - Retention days, size limits, duration limits

Role Behavior:
- Admin/Secretary: full edit
- Viewer: read-only

Validation + UX:
- Required fields on meeting create
- Approval checklist for motions/action items/adjournment time
- Inline warnings and row-level validation
- Confirm destructive actions

### 3.2 Attendee Mic Join (Phase 1.5)

- QR landing + consent banner
- Optional name/role
- Mic test + join/leave
- Push-to-talk mode

---

## 4) API Implementation Plan

### 4.1 Core Endpoints

Meetings:
- POST /meetings
- GET /meetings
- GET /meetings/{id}
- PUT /meetings/{id}

Audio:
- POST /meetings/{id}/audio-sources
- PUT /audio-sources/{id}/upload (signed URL)
- GET /meetings/{id}/audio-sources

Processing:
- POST /meetings/{id}/process
- GET /meetings/{id}/process-status

Minutes:
- GET /meetings/{id}/draft-minutes
- PUT /meetings/{id}/draft-minutes
- POST /meetings/{id}/export

Motions:
- GET /meetings/{id}/motions
- PUT /meetings/{id}/motions

Action Items:
- GET /meetings/{id}/action-items
- PUT /meetings/{id}/action-items
- GET /meetings/{id}/action-items/export/csv

Audit + Retention:
- GET /meetings/{id}/audit-log
- POST /retention/sweep

Settings:
- GET /settings
- PUT /settings

### 4.2 API Concerns

- RBAC enforced at API boundary
- Signed URLs for audio uploads/downloads
- Validation rules on approval
- Audit log entries for exports, approvals, audio downloads
- Rate limits for upload and processing endpoints

---

## 5) Data Model (MVP)

Meeting:
- id, date, start_time, end_time
- location, chair_name, secretary_name
- status, tags[], no_motions, no_action_items, no_adjournment_time
- created_at, updated_at

AudioSource:
- id, meeting_id
- type (ROOM/PHONE/UPLOAD)
- file_uri, duration_seconds, created_at

TranscriptSegment:
- id, meeting_id, speaker_id
- start_ms, end_ms, text

Speaker:
- id, meeting_id, label, name, role

Motion:
- id, meeting_id
- text, mover_name, seconder_name, vote_method, outcome

ActionItem:
- id, meeting_id
- description, owner_name, due_date, status

DraftMinutes:
- meeting_id, content, minutes_version

AuditLog:
- id, meeting_id, event_type, actor, timestamp, details

---

## 6) Processing Pipeline (MVP)

Steps:
1) Normalize audio (mono, 16kHz)
2) Transcription (timestamps)
3) Diarization (speaker segments)
4) Extract motions/votes/action items
5) Generate draft minutes
6) Persist artifacts + status

Retry policy:
- 3 retries with exponential backoff
- Partial failures allowed; UI shows missing artifacts

---

## 7) Storage & Retention

- Raw audio stored in private bucket
- Signed URLs for Secretary/Admin access
- Retention policy configurable (default 60 days)
- Retention never deletes audio for PROCESSING/DRAFT_READY

---

## 8) Security & Governance

- Consent banner for phone mic join
- Minutes are the only official record
- Role-based access controls
- Audit logging for critical actions
- No public audio sharing

---

## 9) Milestones

M0 (Ops Ready, no code)
- Minutes template + QR join instructions

M1 (MVP)
- Meeting CRUD + audio upload + processing + draft minutes
- Secretary review console
- Exports + approval gates

M2 (Workflow Automation)
- Task integration + archive export
- Audit log & retention automation

M3 (Quality & Scale)
- Improved diarization + analytics
- Committee mode

---

## 10) Risks & Mitigations

- Speaker diarization accuracy
  - Mitigate with manual relabel tools
- Action item extraction errors
  - Require Secretary review + validation
- Audio upload sizes
  - Enforce limits + chunked upload
- Retention mistakes
  - Never delete processing/draft audio

---

## 11) Release Checklist

- UI flows complete and tested
- API validation + RBAC enforced
- Retention job tested
- Audit log verified
- Approval gates enforced
- Exports generate correctly
- Backup and monitoring in place

---

## 12) Next Actions

- Confirm tech stack choice (Firebase vs Postgres)
- Implement persistent DB + storage
- Implement real transcription pipeline
- Deploy MVP to staging

