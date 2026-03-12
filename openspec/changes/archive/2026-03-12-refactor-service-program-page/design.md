## Context

`ServiceProgramPage.vue` is 6022 lines with template (~1237), script (~1833), and style (~2950). It mixes core program editing with self-contained features like presentation mode, YouTube playlist, media display, and draft management. The file is functional but unwieldy.

## Goals / Non-Goals

**Goals:**
- Reduce `ServiceProgramPage.vue` from ~6022 to ~2500 lines
- Extract self-contained modals into their own components
- Extract edit lock lifecycle into a composable
- Extract summary and control sections into small components
- Zero behavior changes — pure refactor

**Non-Goals:**
- Extracting `ProgramItemCard` (too coupled to parent state, defer to future)
- Changing any UI, UX, or data flow
- Adding tests (separate effort)
- Extracting CSS custom properties or design tokens

## Decisions

### 1. New `src/components/program/` directory

All extracted components go under `src/components/program/`. This groups program-specific components separately from generic shared components.

**Alternative:** Put in `src/components/service-detail/` — rejected because these are specific to the program page, not the service detail overview.

### 2. Extract modals first (highest line reduction, lowest coupling)

Modals are the most self-contained sections. Each has its own template, state, and CSS with minimal parent dependencies (just open/close + data props).

**Extraction order:**
1. `PresentationModal.vue` (~950 lines: template + script + CSS)
2. `YouTubePlaylistModal.vue` (~570 lines)
3. `MediaDisplayModal.vue` (~200 lines)
4. `MusicPropertiesModal.vue` (~200 lines)
5. `DraftViewersModal.vue` (~180 lines)

### 3. Extract control sections as thin components

Small template sections with clear props/emits boundaries:
- `ProgramSummary.vue` — stats + conductor display/edit
- `EditModeControls.vue` — enter edit / timer+finish buttons
- `EditLockIndicator.vue` — "X is editing" banner
- `DraftModeControls.vue` — draft notice + publish button

### 4. Extract `useEditLock.ts` composable

The edit lock lifecycle (enter/exit/extend/force, countdown timer, warning state) is ~150 lines of tightly coupled logic. Moving it to a composable clarifies the parent component's responsibilities.

**Interface:**
```ts
useEditLock(programRef, serviceIdRef) → {
  isEditing, isLockedByOther, lockHolder,
  formattedLockTime, isTimerWarning,
  enterEditMode, exitEditMode, forceEnterEditMode, extendEditMode
}
```

### 5. Props-down, emits-up pattern for all extractions

Each extracted component receives data via props and communicates back via emits. No provide/inject, no shared refs. This keeps the refactor mechanical and safe.

## Risks / Trade-offs

- **Risk:** Prop drilling becomes verbose for deeply nested data → Mitigation: Only extract top-level sections, not nested item cards
- **Risk:** CSS specificity issues when moving scoped styles → Mitigation: Keep all styles scoped, test visual regression manually
- **Risk:** Large diff makes review harder → Mitigation: Extract one component per task, each independently verifiable
