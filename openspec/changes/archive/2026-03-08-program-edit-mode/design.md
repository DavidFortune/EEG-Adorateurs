## Context

ServiceProgramPage has 16 editing surfaces (inline edits, popovers, modals, action menus, reorder, add bar) all gated by `isAdmin`. Every field saves immediately on blur/enter — there is no pending state or "save all" button. The page uses a Firestore `onSnapshot` subscription for real-time updates, meaning lock state changes propagate to all connected clients instantly.

Current editing surfaces:
- Inline: title, subtitle, notes (click to edit)
- Quick actions: participant, duration, subtitle, notes buttons
- Popovers: duration stepper, participant selector, action menu
- Modals: ItemDetailSheet, conductor editor, music props, draft viewers
- Structural: reorder (drag handles), InlineAddBar (add item/sub-item/section), resource link/unlink
- Draft controls: publish, manage access

## Goals / Non-Goals

**Goals:**
- Prevent accidental edits on published programs by requiring explicit edit mode activation
- Prevent concurrent editing conflicts via a distributed lock (one editor at a time)
- Preserve current draft UX (drafts are immediately editable)
- Provide clear feedback: countdown timer, lock holder info, force-release option
- Minimal code change: swap `isAdmin` → `isEditing` on existing gates

**Non-Goals:**
- Per-item granular locking (whole program lock is sufficient)
- Offline edit mode support
- Edit history / undo / conflict resolution
- Server-side lock enforcement (Cloud Functions) — client-side with transactions is sufficient
- Changes to non-admin user experience

## Decisions

### 1. Lock lives on the program document, not a separate collection
**Decision**: Add an `editLock` field directly to the existing program document.
**Rationale**: The existing `onSnapshot` subscription already delivers the full program document to all clients. Putting the lock there means zero additional queries or listeners — lock state changes arrive for free. A separate `locks` collection would require an extra listener per page.
**Alternative considered**: Separate `programLocks/{programId}` collection — rejected for unnecessary complexity and extra read costs.

### 2. Firestore transactions for atomic lock acquisition
**Decision**: Use `runTransaction()` for all lock operations (acquire, release, force-acquire).
**Rationale**: Transactions guarantee that two admins clicking "Modifier" at the same instant won't both succeed. The read-check-write is atomic. This is ~10 lines more than a simple `updateDoc` but eliminates the race condition entirely.
**Alternative considered**: Simple `updateDoc` with client-side check — rejected because of the race window.

### 3. 10-minute TTL with client-side countdown
**Decision**: Set `expiresAt = now + 10 minutes` on lock acquisition. Client runs a `setInterval(1000)` countdown from `expiresAt`. Auto-release at expiry.
**Rationale**: TTL handles abandoned sessions (browser closed, phone died). 10 minutes is the user's chosen duration. The countdown uses `expiresAt` from Firestore (not local clock) to stay consistent across clients. Click the timer to extend (re-acquire with fresh 10 min).
**Alternative considered**: Heartbeat-based extension — rejected as over-engineered for this use case; click-to-extend is simpler.

### 4. Draft programs auto-acquire lock on page load
**Decision**: When `isDraft === true`, attempt to acquire the lock automatically in `onMounted`. If lock is taken by another user, show the lock indicator (same as published programs).
**Rationale**: Preserves the current UX where admins open a draft and immediately start editing. No extra click required. If the lock is taken, the admin sees who's editing and can force-take if needed.
**Alternative considered**: Always require explicit "Modifier" click even for drafts — rejected as a UX regression.

### 5. `isEditing` computed replaces `isAdmin` for edit gates
**Decision**: Introduce `isEditing` computed that checks `isAdmin && lockHeldByCurrentUser && !expired`. Replace `isAdmin` with `isEditing` on all 16 editing surfaces via template find-and-replace.
**Rationale**: Minimal template change. The existing conditional structure stays identical — only the gate variable changes. `isAdmin` continues to be used for admin-only *view* features (presentation button, download, etc.).
**Alternative considered**: Wrapping edit surfaces in a `<template v-if="isEditing">` parent — rejected because the edit gates are scattered across different template locations and nesting levels.

### 6. Release lock on unmount and beforeunload
**Decision**: Call `releaseEditLock` in `onUnmounted` and on `window.beforeunload`.
**Rationale**: Covers both Vue navigation (back button, route change) and browser close/refresh. The `beforeunload` handler is a best-effort — if it doesn't fire (e.g., phone killed), the TTL handles it.

## Risks / Trade-offs

- **[Clock skew between clients]** → Mitigate by using Firestore `serverTimestamp()` for `lockedAt` and computing `expiresAt` server-side. Countdown displays use `expiresAt` from the subscription, not local time. Small skew (seconds) is acceptable.
- **[10-min expiry during long editing sessions]** → Mitigate with click-to-extend on the timer. Visual warnings at 2:00 and 0:30 remaining. Could add auto-extend on activity in a future iteration.
- **[Force-release disrupts active editor]** → Mitigate with immediate toast notification to the displaced editor. Their in-progress field save (blur) will still succeed since Firestore write doesn't require lock.
- **[Lock field adds to document size]** → Negligible (~100 bytes). Lock is set to null when released, not deleted, to avoid index churn.
