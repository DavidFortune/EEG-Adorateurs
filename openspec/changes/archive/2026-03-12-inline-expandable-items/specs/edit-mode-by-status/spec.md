## MODIFIED Requirements

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
