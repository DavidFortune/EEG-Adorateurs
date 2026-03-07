## Context

Resources are created via four distinct UI flows:
1. **ResourceFormPage** - Dedicated form page for creating/editing resources
2. **ResourceBottomSheet** - Bottom sheet used in ServiceProgramPage for quick resource creation
3. **ResourceSelector** - Modal selector with inline create tab
4. **NaturalResourceSelector** - YouTube search and create flow

Each flow calls `createResource()` from `firebase/resources.ts` which uses `addDoc()` (auto-generated IDs). Double-clicking a create button before the async operation completes results in duplicate Firestore documents.

## Goals / Non-Goals

**Goals:**
- Prevent duplicate resource creation caused by double-click or rapid re-submission
- Apply consistent guard pattern across all four creation flows

**Non-Goals:**
- Server-side deduplication (idempotency keys) - UI guards are sufficient for this bug
- Refactoring the resource creation architecture

## Decisions

**Decision: Disable buttons with loading state guards**

All create/save buttons SHALL be disabled while the async creation operation is in progress. This is the simplest and most reliable approach for preventing double submissions in a UI context.

Pattern: `:disabled="loading || !isFormValid"` where `loading` is set to `true` at the start of the async handler and `false` in the `finally` block.

Alternative considered: Debouncing clicks - rejected because it adds complexity and doesn't give visual feedback to the user.

## Risks / Trade-offs

- [Risk] Button stays disabled if async operation hangs indefinitely -> Mitigation: `finally` block always resets loading state; Firebase operations have built-in timeouts.
