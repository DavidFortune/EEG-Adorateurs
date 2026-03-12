# Design: Program Status Lifecycle & Edit Mode Refactor

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ServiceProgramPage.vue                     │
│                                                              │
│  status === 'draft'          │  status === 'published'       │
│  ─────────────────           │  ──────────────────────       │
│  • Always editable           │  • Read-only by default       │
│  • No lock required          │  • "Modifier" → acquire lock  │
│  • Draft banner + publish    │  • Timer + "Terminer"         │
│  • No timer UI               │  • Lock indicator if other    │
│  • Save on every change      │  • Save within lock window    │
│                              │                               │
└──────────────┬───────────────┼───────────────┬───────────────┘
               │               │               │
               ▼               │               ▼
┌──────────────────────┐       │  ┌──────────────────────────┐
│  Direct updateProgram │       │  │  acquireEditLock →       │
│  (no lock dance)      │       │  │  updateProgram →         │
│                       │       │  │  releaseEditLock         │
└──────────────────────┘       │  └──────────────────────────┘
                               │
                    publishProgram()
                    (one-way, sets status: 'published')
```

## Data Model Changes

### New: `ProgramStatus` enum

```typescript
export type ProgramStatus = 'draft' | 'published';
```

### Updated: `ServiceProgram` interface

```typescript
export interface ServiceProgram {
  // ... existing fields ...

  // NEW: replaces isDraft
  status: ProgramStatus;

  // KEPT: still useful for draft visibility
  draftViewerIds: string[];
  publishedAt?: Date;
  publishedBy?: string;

  // KEPT: only used when status === 'published'
  editLock?: EditLock | null;

  // REMOVED: isDraft (replaced by status)
}
```

### Read-time migration

In `getProgramByServiceId` and `subscribeToProgramByServiceId`:

```typescript
// Migration: derive status from legacy isDraft field
status: data.status ?? (data.isDraft === true ? 'draft' : 'published'),
```

## UI Behavior by Status

### Draft Programs

```
┌─────────────────────────────────────────────────────┐
│  [←]  Programme                                      │
│                                                      │
│  ┌─ Draft Banner ─────────────────────────────────┐  │
│  │  🔒 Mode brouillon                             │  │
│  │  Ce programme n'est pas encore visible...       │  │
│  │  [Gérer les accès (3)]  [Publier le programme] │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌─ Program Content (always editable) ────────────┐  │
│  │  [+ Ajouter un élément]                         │  │
│  │  🎵 Chant d'ouverture          [edit] [delete]  │  │
│  │  📖 Lecture biblique            [edit] [delete]  │  │
│  │  ...                                            │  │
│  └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

- No "Modifier le programme" button needed — content is always inline-editable
- Draft banner always visible at top (not gated behind edit mode)
- All editing controls (add, edit, delete, reorder) always visible for admins

### Published Programs

```
┌─────────────────────────────────────────────────────┐
│  [←]  Programme              [⏱ 08:32] [Terminer]   │
│                                                      │
│  ┌─ Program Content (locked editing) ─────────────┐  │
│  │  [+ Ajouter un élément]                         │  │
│  │  🎵 Chant d'ouverture          [edit] [delete]  │  │
│  │  ...                                            │  │
│  └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

OR (not editing):

```
┌─────────────────────────────────────────────────────┐
│  [←]  Programme                                      │
│                                                      │
│  [Modifier le programme]                             │
│                                                      │
│  ┌─ Program Content (read-only) ──────────────────┐  │
│  │  🎵 Chant d'ouverture                           │  │
│  │  📖 Lecture biblique                             │  │
│  │  ...                                            │  │
│  └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Key Computed Properties (Refactored)

```typescript
// Simple status check
const isDraft = computed(() => program.value?.status === 'draft');
const isPublished = computed(() => program.value?.status === 'published');

// For drafts: always editable (no lock needed)
// For published: editable only with active lock
const isEditing = computed(() => {
  if (!isAdmin.value || !program.value) return false;
  if (isDraft.value) return true;  // ← KEY CHANGE: drafts always editable
  // Published: check lock ownership
  if (!program.value.editLock || !user.value) return false;
  const lock = program.value.editLock;
  return lock.userId === user.value.uid && lock.expiresAt.getTime() > Date.now();
});

// Only relevant for published programs
const isLockedByOther = computed(() => {
  if (!isPublished.value) return false;  // drafts can't be "locked"
  if (!program.value?.editLock || !user.value) return false;
  const lock = program.value.editLock;
  return lock.userId !== user.value.uid && lock.expiresAt.getTime() > Date.now();
});

// Show lock UI only for published programs
const showLockControls = computed(() => isPublished.value && isEditing.value);
```

## Function Changes

### `createProgram` — use `status: 'draft'`

Replace `isDraft: true` with `status: 'draft'`.

### `publishProgram` — set `status: 'published'`

Replace `isDraft: false` with `status: 'published'`. Check `data.status !== 'draft'` instead of `!data.isDraft`.

### `canUserViewProgram` — use `status`

```typescript
if (program.status === 'published') return true;
// else it's draft...
```

### Lock functions — unchanged

`acquireEditLock`, `releaseEditLock`, `forceAcquireEditLock` remain the same. They're just never called for draft programs.

## Migration Safety

No batch migration. Lazy read-time conversion:

```
Firestore doc has:        →  App reads as:
─────────────────────────────────────────
status: 'draft'           →  status: 'draft'
status: 'published'       →  status: 'published'
isDraft: true (no status) →  status: 'draft'
isDraft: false (no status)→  status: 'published'
neither field             →  status: 'published'
```

New writes always include `status`. Old `isDraft` field left in place — harmless, ignored after migration.
