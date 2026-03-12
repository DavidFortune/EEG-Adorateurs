# Spec: Program Status Field

## Requirements

### MUST
- Add `ProgramStatus` type: `'draft' | 'published'`
- Replace `isDraft: boolean` with `status: ProgramStatus` in `ServiceProgram` interface
- Read-time migration: derive `status` from `isDraft` when `status` field is absent
- Default to `'published'` when neither `status` nor `isDraft` exists
- New programs created with `status: 'draft'`
- `publishProgram()` sets `status: 'published'` (one-way)
- `canUserViewProgram()` uses `status` instead of `isDraft`
- Stop writing `isDraft` on new operations

### MUST NOT
- Batch-migrate existing Firestore documents
- Remove `isDraft` reads from migration logic (needed for backward compat)
- Allow reverting from `'published'` back to `'draft'`

### Files affected
- `src/types/program.ts` — add `ProgramStatus`, update `ServiceProgram`
- `src/firebase/programs.ts` — migration logic, `createProgram`, `publishProgram`, `canUserViewProgram`
