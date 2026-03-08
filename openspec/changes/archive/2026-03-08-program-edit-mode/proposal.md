## Why

Admins can currently modify any part of a service program (items, order, participants, durations, resources) at any time just by opening the page. This causes two problems: (1) accidental edits from mis-taps on mobile, and (2) concurrent editing conflicts when multiple admins work on the same program. An explicit edit mode with a distributed lock solves both — admins must opt in to editing, and only one admin can edit at a time.

## What Changes

- Add an edit lock field (`editLock`) to the program Firestore document with userId, userName, lockedAt, and expiresAt (10-minute TTL)
- Add three Firestore transaction functions: `acquireEditLock`, `releaseEditLock`, `forceAcquireEditLock`
- Replace `isAdmin` gate on all 16 editing surfaces in ServiceProgramPage with a new `isEditing` computed that checks the current user holds an active lock
- Draft programs auto-acquire the lock on page load (preserving current UX where drafts are immediately editable)
- Published programs show read-only by default with a "Modifier le programme" button for admins
- Display a countdown timer (⏱ MM:SS) in the toolbar during edit mode, with warnings at 2:00 and 0:30 remaining
- Auto-release lock on expiry, page navigation, or unmount
- Show lock holder info and "Prendre le contrôle" force-release option when another admin holds the lock
- Non-admin users see no changes — the lock system is invisible to them

## Capabilities

### New Capabilities
- `program-edit-lock`: Firestore-based distributed edit lock with 10-minute TTL, atomic acquire/release via transactions, force-acquire for admins, and auto-expiry
- `program-edit-mode`: UI toggle between read-only and edit mode on ServiceProgramPage, with countdown timer, lock indicator, and automatic draft-mode editing

### Modified Capabilities
- `service-program`: Gate all editing surfaces behind `isEditing` instead of `isAdmin`; draft programs auto-enter edit mode; published programs require explicit edit mode activation

## Impact

- **Data model**: New optional `editLock` field on program documents (backward compatible — null means unlocked)
- **Code**: `src/firebase/programs.ts` (3 new functions ~60 lines), `src/views/services/ServiceProgramPage.vue` (edit mode logic ~80 lines, UI ~50 lines, ~25 template gate replacements)
- **No new components**: Timer display, lock indicator, and edit button are inline in ServiceProgramPage
- **No Cloud Functions**: Lock expiry handled client-side via TTL field
- **No new collections**: Lock lives on the existing program document
- **Migration**: None — existing programs have no `editLock` field, which is treated as unlocked
