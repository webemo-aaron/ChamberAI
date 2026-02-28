# Follow-Up Ticket: Firestore Geo Query and Index Optimization

Date: 2026-02-28
Owner: Platform/API
Status: Proposed

## Problem
Current Firebase geo list endpoints load full collections and filter in memory:
- `GET /geo-profiles`
- `GET /geo-content-briefs`

This is acceptable for pilot scale but will degrade with large chamber datasets.

## Scope
Optimize Firestore reads for geo endpoints by reducing collection scans and adding index-backed query patterns.

## Deliverables
1. Refactor route query paths to use scoped Firestore queries where possible.
2. Add pagination contract enforcement with stable sort and cursor strategy.
3. Add/verify Firestore composite indexes required for production query paths.
4. Add performance regression checks (read count and latency bounds).
5. Update API docs with query/index constraints and expected limits.

## Acceptance Criteria
- P95 response latency under target for 10k+ geo briefs.
- Firestore read count reduced versus baseline scan implementation.
- No API contract break (`items`, `offset`, `limit`, `next_offset`, `has_more`, `total`).
- Integration tests cover scoped query behavior and pagination consistency.

## Suggested Implementation Notes
- Prefer `where(scope_type == x)` and `where(scope_id == y)` with ordered fields.
- Introduce capped limits and deterministic ordering to avoid page drift.
- Use backfill script if field normalization is needed for indexed query keys.
