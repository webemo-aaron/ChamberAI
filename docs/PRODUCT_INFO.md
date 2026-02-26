# ChamberAI Product Info

## Product Summary
ChamberAI is a meeting operations platform for chambers and boards. It supports parallel chair/secretary workflows, recording-based minute drafting, governance controls, and audit-friendly outputs.

## Primary Users
- Chamber admin
- Chamber secretary
- Board chair
- Read-only stakeholders (viewer role)

## Core Capabilities
- Meeting lifecycle management
- Audio source registration and processing orchestration
- Draft minute collaboration with rollback/version history
- Motion and action item tracking
- Approval gating and policy checks
- Public summary drafting and publishing
- Retention controls and audit logs
- Email invite workflow with role-based access

## Security and Access Model
- Google sign-in via Firebase Auth
- Membership allowlist enforcement on API
- Role-based authorization (`admin`, `secretary`, `viewer`)
- Bootstrap admin support via env configuration

## Invite + Membership Model
- Admin authorizes sender emails.
- Authorized sender sends invite via Resend.
- Invite upserts membership for recipient.
- Default role on invite: `viewer`.
- Admin can later promote role.

## Integrations
- Firebase Auth / Firestore / Storage
- Cloud Run (API + worker)
- Vercel (frontend hosting)
- Resend (email delivery)
- Motion link support in invites (link-based, no direct API sync yet)

## Deployment Profiles
- Local/self-hosted with Docker + Firebase emulators
- GCP + Vercel low-cost production profile
- Hybrid low-cost profile

## Known Operational Requirements
- `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are required for invite sending.
- Firebase Google provider and authorized domains must be configured.
- `FIREBASE_REQUIRE_MEMBERSHIP=true` recommended for production.

## Success Criteria for Release Readiness
- Authenticated users can access only with membership.
- Admin can authorize senders and manage memberships.
- Secretary/admin can send invites with meeting + Motion context.
- Chair/secretary can run meetings concurrently with safe recovery (version history/rollback).
- Core unit and e2e smoke suites pass.
