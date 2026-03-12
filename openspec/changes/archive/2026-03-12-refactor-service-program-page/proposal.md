## Why

`ServiceProgramPage.vue` is 6022 lines — a monolithic file combining program display, inline editing, presentation mode, YouTube playlist, media display, scripture viewing, music properties editing, draft management, and edit lock controls. This makes it hard to maintain, test, or extend. Extracting self-contained features into components and composables will improve readability and developer experience.

## What Changes

- Extract `PresentationModal.vue` component (~300 template + 350 script + 300 CSS lines)
- Extract `YouTubePlaylistModal.vue` component (~120 template + 250 script + 200 CSS lines)
- Extract `MediaDisplayModal.vue` component (~80 template + related script/CSS)
- Extract `MusicPropertiesModal.vue` component (~80 template + related script/CSS)
- Extract `DraftViewersModal.vue` component (~60 template + related script/CSS)
- Extract `ProgramSummary.vue` component (~40 template + 93 CSS lines)
- Extract `EditModeControls.vue` component (edit button + timer/finish controls)
- Extract `EditLockIndicator.vue` component (lock status display)
- Extract `DraftModeControls.vue` component (draft notice + publish)
- Create `useEditLock.ts` composable (lock state, countdown timer, lifecycle)
- Parent page reduced from ~6022 to ~2500-3000 lines

## Capabilities

### New Capabilities

_None — this is a pure refactor with no behavior changes._

### Modified Capabilities

_None — no spec-level requirement changes, only internal code organization._

## Impact

- `src/views/services/ServiceProgramPage.vue` — heavily modified (reduced by ~50%)
- `src/components/program/` — new directory with ~9 extracted components
- `src/composables/useEditLock.ts` — new composable
- No API changes, no data model changes, no behavior changes
- All existing functionality preserved exactly as-is
