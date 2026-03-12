# Program Status Lifecycle & Edit Mode Refactor

## Problem

Edit mode and draft mode are two tangled concepts that conflict:

- **Edit mode** (distributed lock) controls *who can edit right now* — concurrency control
- **Draft mode** (`isDraft` boolean) controls *who can see it* — visibility/lifecycle

The conflict: draft programs are inherently "being worked on," yet the system requires a 10-minute lock to edit them. This is like locking a Google Doc that only you can see. The recent fix (c25265b) removed `!isDraft` from the edit button condition, but that's a band-aid — it doesn't resolve the fundamental mismatch.

## Solution

Replace `isDraft: boolean` with a `status: 'draft' | 'published'` enum and make editing rules **status-dependent**:

| Status | Visibility | Editing | Lock required? |
|--------|-----------|---------|----------------|
| `draft` | Admins + `draftViewerIds` | Free editing — always editable inline | No |
| `published` | Everyone | Locked editing — distributed lock with 10-min TTL | Yes |

## Decisions

- **Drafts: completely free editing** — no lock acquisition needed, no timer, no "Modifier" button. The page is just editable.
- **One-way publish stays** — `publishProgram()` remains irreversible. No "unpublish" path.
- **`status` enum replaces `isDraft` boolean** — cleaner, extensible for future states (archived, template).

## Migration Strategy

- Existing Firestore documents: read-time migration. If `status` is absent, derive from `isDraft` (`isDraft === true` → `'draft'`, else `'published'`). Fall back to `'published'` if neither field exists.
- No batch migration needed — lazy migration on read.
- New writes always use `status` field. Stop writing `isDraft`.

## Scope

### In scope
- New `ProgramStatus` enum type
- `ServiceProgram.status` field replacing `isDraft`
- Status-dependent edit mode logic in `ServiceProgramPage.vue`
- Remove lock machinery from draft flow (keep for published)
- Update `canUserViewProgram` to use `status`
- Update `createProgram` to use `status: 'draft'`
- Update `publishProgram` to set `status: 'published'`
- Read-time migration in query/subscription handlers
- Update draft controls UI to show inline when status is draft

### Out of scope
- New statuses beyond draft/published (archived, template)
- Batch Firestore migration
- Changes to Firestore security rules (draft visibility is app-layer enforced)
- Soft locks or "who's editing" indicators for drafts
