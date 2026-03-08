## 1. Data Model & Firestore Lock Functions

- [x] 1.1 Add `EditLock` type to program types (`userId`, `userName`, `lockedAt: Date`, `expiresAt: Date`)
- [x] 1.2 Add optional `editLock: EditLock | null` field to `ServiceProgram` type and Firestore parsing in `subscribeToProgramByServiceId`
- [x] 1.3 Implement `acquireEditLock(programId, userId, userName)` using `runTransaction` — check lock is null or expired, write new lock with 10-min TTL
- [x] 1.4 Implement `releaseEditLock(programId, userId)` using `runTransaction` — verify holder matches, set editLock to null
- [x] 1.5 Implement `forceAcquireEditLock(programId, userId, userName)` using `runTransaction` — unconditionally write new lock, return previous holder info

## 2. Edit Mode State & Computed

- [x] 2.1 Add `isEditing` computed: `isAdmin && editLock?.userId === currentUser.uid && editLock.expiresAt > now`
- [x] 2.2 Add `isLockedByOther` computed: `editLock !== null && editLock.userId !== currentUser.uid && editLock.expiresAt > now`
- [x] 2.3 Add `lockHolder` computed: returns `{ userName, expiresAt }` when locked by another user
- [x] 2.4 Add `lockTimeRemaining` ref: seconds remaining, updated by interval timer

## 3. Lock Lifecycle

- [x] 3.1 Implement `enterEditMode()`: call `acquireEditLock`, handle success/failure, start countdown timer
- [x] 3.2 Implement `exitEditMode()`: call `releaseEditLock`, stop countdown timer
- [x] 3.3 Implement `forceEnterEditMode()`: call `forceAcquireEditLock`, start countdown timer, show toast with previous holder name
- [x] 3.4 Implement `extendEditMode()`: re-acquire lock with fresh 10-min TTL, reset countdown
- [x] 3.5 Auto-acquire lock on mount when `isDraft === true`
- [x] 3.6 Release lock on `onUnmounted` and `window.beforeunload`

## 4. Countdown Timer

- [x] 4.1 Start `setInterval(1000)` on lock acquisition, compute remaining seconds from `expiresAt - Date.now()`
- [x] 4.2 Turn timer to warning color when ≤ 120 seconds remain
- [x] 4.3 Show toast notification when ≤ 30 seconds remain ("Votre session d'édition expire bientôt")
- [x] 4.4 Auto-release lock and exit edit mode when timer reaches 0, show toast "Session d'édition expirée"
- [x] 4.5 Clear interval on lock release or unmount

## 5. Template — Gate Replacements

- [x] 5.1 Replace `isAdmin` with `isEditing` on quick action buttons (`v-if="isAdmin && !isSectionItem(item)"`)
- [x] 5.2 Replace `isAdmin` with `isEditing` on InlineAddBar (main and sub-item)
- [x] 5.3 Replace `isAdmin` with `isEditing` on 3-dot action menu buttons (item and sub-item)
- [x] 5.4 Replace `isAdmin` with `isEditing` on reorder handles and `ion-reorder-group :disabled`
- [x] 5.5 Replace `isAdmin` with `isEditing` on inline title edit click handler (`@click="isAdmin && startInlineTitleEdit"`)
- [x] 5.6 Replace `isAdmin` with `isEditing` on subtitle/notes editable click handlers and `.editable` class binding
- [x] 5.7 Replace `isAdmin` with `isEditing` on resource unlink button and music props edit button
- [x] 5.8 Replace `isAdmin` with `isEditing` on meta chip `.interactive` class and click handlers
- [x] 5.9 Replace `isAdmin` with `isEditing` on draft controls (publish, manage access)
- [x] 5.10 Replace `isAdmin` with `isEditing` on conductor edit button and "Ajouter un dirigeant" button

## 6. Template — New UI Elements

- [x] 6.1 Add "Modifier le programme" button (visible when `isAdmin && !isEditing && !isLockedByOther && !isDraft`)
- [x] 6.2 Add countdown timer display in header toolbar (visible when `isEditing`, format MM:SS, tappable to extend)
- [x] 6.3 Add "Terminer" button in header toolbar (visible when `isEditing`)
- [x] 6.4 Add lock indicator card (visible when `isLockedByOther`): shows holder name, remaining time, "Prendre le contrôle" button
- [x] 6.5 Style countdown timer: normal color by default, warning color when ≤ 2 min

## 7. Displaced Editor Notification

- [x] 7.1 Watch `program.editLock` changes via the existing onSnapshot subscription
- [x] 7.2 If lock was held by current user and changes to another user → show toast "X a pris le contrôle de l'édition", exit edit mode

## 8. Testing & Verification

- [x] 8.1 Verify published program opens in read-only mode (no edit controls visible)
- [x] 8.2 Verify draft program auto-enters edit mode with lock acquired
- [x] 8.3 Verify "Modifier" → lock acquired → edit controls appear → "Terminer" → lock released → read-only
- [x] 8.4 Verify countdown timer counts down and auto-releases at 0
- [x] 8.5 Verify force-acquire works and displaces previous editor
- [x] 8.6 Verify lock is released on page navigation (back button)
- [x] 8.7 Verify build passes with no errors
