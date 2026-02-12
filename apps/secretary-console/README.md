# Secretary Console (Mock UI)

Serve locally:
- `npm run dev:console` (defaults to http://127.0.0.1:5173; use `PORT=5174` if 5173 is taken)
- `npm run dev:api` (defaults to http://localhost:4000)
- `./scripts/dev_all_firebase.sh` (runs Firebase API + console together)
- `./scripts/dev_laptop.sh` (runs Firebase emulators + API + worker + console)

This is a static, client-only prototype meant to exercise the in-memory API.

Notes:
- Drag and drop a .mp3/.wav file to register audio (mocked; no actual upload).
- Audio sources list and motions tab are UI-only for now.
- Motions warn if mover/outcome missing. Action items are editable inline with Save/Delete.
- Metadata editor supports end time and approval flags.
- Action items show approval guidance and include a Quick Fill helper.
- Actions tab includes an adjournment-time flag and guidance.
- Motions can be edited inline and exports are available from the Motions tab.
- Approval checklist summarizes gating status; export history is shown in the Motions tab.
- Motions support inline row editing with Save/Cancel.
- Export history supports grouping by format and filtering to latest only.
- Onboarding banner provides a quick start checklist.
- Row-level validation messages highlight missing motion/action fields.
- Quick Create modal uses today’s date and stored defaults.
- Quick Create modal includes tags.
- Settings panel updates retention and size limits (mock only).
- Toast notifications fire on key actions (export, approval, settings).
- Meetings support tags and filtering by tag.
- Tag chips display in meeting list rows.
- Settings inputs validate min/max ranges before save.
- Settings save feedback shows as a banner instead of inline hint text.
- Meeting list includes search by location, chair, or secretary.
- Action items can be exported as CSV.
- Filters and export history can be cleared quickly.
- Tag preset chips are available for quick filtering.
- Action items can be imported from CSV.
- CSV imports show a preview modal before applying.
- Preview highlights missing owner/due date and blocks invalid imports.
- CSV preview supports skipping invalid rows on import.
- Press Esc to clear the search field.
- Meeting status uses colored pills in the list.
- Export history is persisted per meeting in localStorage.
- Tag chips include an “All” option; press `/` to focus search.
- Meeting list can be filtered by status.
- Recent filter supports last 30/60/90 days.
- Demo login enables admin/secretary/viewer roles with read-only gating.
- Approval is disabled until checklist passes.
- Seed demo creates a processed meeting with action items.
- Minutes can be downloaded as Markdown.
- Feature flags can be toggled in Settings (modules).
- Demo login supports admin/secretary/viewer roles.
- Approve is disabled until checklist passes (and viewer is read-only).
- Demo seed button creates a processed meeting with action items.
- Minutes can be downloaded as markdown.
