# Spec: Status-Dependent Edit Mode

## Requirements

### MUST — Draft behavior
- Draft programs are always inline-editable for admins (no button click needed)
- No lock acquisition, no timer, no countdown UI for drafts
- Draft banner (with publish + manage viewers) always visible — not gated behind edit mode
- `isEditing` returns `true` for admins when `status === 'draft'`

### MUST — Published behavior
- Published programs require lock acquisition to edit (existing behavior)
- Lock acquisition is admin-only — non-admins never see edit controls or acquire locks
- "Modifier le programme" button shown only for published programs, only for admins
- Timer, countdown, "Terminer" button, lock indicator — all kept for published
- Force-acquire for admins when another user holds lock — kept

### MUST — UI changes
- Remove "Modifier le programme" button for draft programs
- Show draft banner unconditionally when `status === 'draft'` and user is admin
- Show lock-related UI (timer, Terminer, lock indicator) only when `status === 'published'`
- `enterEditMode` / `exitEditMode` only called for published programs
- Remove 3-dot action menu from item rows — all editing is via expandable item cards
- Remove `ItemDetailSheet.vue` popup modal — all fields are inline in expanded cards

### MUST NOT
- Add any locking for draft programs
- Change the lock TTL or lock mechanism for published programs
- Auto-enter edit mode for published programs
- Use popup modals or action menus for item editing

### Files affected
- `src/views/services/ServiceProgramPage.vue` — computed properties, template conditionals, lifecycle
