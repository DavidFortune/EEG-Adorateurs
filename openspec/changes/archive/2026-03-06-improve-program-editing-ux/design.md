## Context

ServiceProgramPage.vue (~5,800 lines) is the main program editing view. Currently it uses a binary `isEditMode` toggle that gates all editing capabilities behind a pencil/checkmark button. In edit mode, a fixed action column (120px) appears on every item with add-sub/edit/delete buttons, and drag handles appear for reordering. The ProgramItemForm.vue component (755 lines) uses a flat grid of 18+ type buttons and a bare number input for duration. Section items go through the same form modal as other types.

The `useProgramItems.ts` composable handles all CRUD operations through a unified form modal. Inline edits (title, duration, participant) are not currently supported — every change requires opening the full-screen form modal.

## Goals / Non-Goals

**Goals:**
- Remove the edit mode toggle — admins always have editing capabilities
- Replace the action column with swipe-to-reveal actions (`ion-item-sliding`)
- Add a dedicated reorder mode (the only remaining explicit mode switch)
- Support inline editing for title, duration, and participants
- Flatten Section creation out of the form modal — inline-only with dedicated "Add Section" button
- Reorganize type selection into grouped categories with prominent common types
- Make form sections context-aware based on selected type
- Replace duration number input with a visual stepper component
- Fix the autocomplete 200ms blur delay hack with proper debounced search

**Non-Goals:**
- Changing the data model or Firestore schema (all changes are UI-only)
- Modifying presentation mode, YouTube playlist, text export, or SMS features
- Changing the ResourceSelector or ResourceBottomSheet components
- Refactoring the page into smaller components (that's a separate change)
- Adding new item types or capabilities
- Changing the sub-item form modal (sub-items still use ProgramItemForm)

## Decisions

### 1. Remove `isEditMode` toggle, always-on editing for admins

**Decision:** Remove `isEditMode` ref and the pencil/checkmark toolbar button. For admins, all interactive elements (swipe actions, inline edits, add buttons, quick-unlink) are always available. Non-admins see the read-only view as before.

**Rationale:** The toggle creates unnecessary friction — admins always want editing capabilities available. There's no meaningful "viewing as non-admin" use case for admins. Toolbar buttons that were previously gated on `!isEditMode` (presentation, export, YouTube, SMS) become always-visible for admins.

**Alternative considered:** Keep a subtle toggle but default it to ON. Rejected because it adds complexity for no clear benefit — admins manage programs, they don't passively browse them.

**Migration:** Replace all `v-if="isEditMode"` with `v-if="isAdmin"`. Remove `toggleEditMode()`. Update the `ion-content` class binding. The title changes from conditional "Édition du programme" / "Programme" to just "Programme".

### 2. Swipe-to-reveal actions with `ion-item-sliding`

**Decision:** Wrap each program item in `ion-item-sliding` with `ion-item-options` containing edit, delete, and add-sub-item buttons. Remove the fixed action column.

**Rationale:** Ionic's `ion-item-sliding` is a built-in, well-optimized component for mobile swipe patterns. It reclaims 120px of horizontal space for content and provides a more natural mobile editing UX.

**Layout:**
```
Left swipe reveals (end side):
  [+ Sub] (green)  [Edit] (primary)  [Delete] (danger)
```

For section items: no "Add Sub" button, only edit and delete.

**Important:** `ion-item-sliding` and `ion-reorder` can conflict. When reorder mode is active, swipe actions MUST be disabled. This is handled by wrapping `ion-item-sliding` with `:disabled="isReorderMode"`.

### 3. Dedicated reorder mode

**Decision:** Add a "Réorganiser" button in the toolbar (visible to admins) that toggles `isReorderMode`. When active: drag handles appear, swipe actions are disabled, a checkmark button replaces the reorder button to exit.

**Rationale:** Reorder requires drag handles which conflict with swipe gestures and need explicit visual space. A separate mode keeps the interaction model clean.

**Toolbar flow:**
- Default: `[Presentation] [Export] [YouTube] [SMS] [Reorder]`
- Reorder active: `[✓ Done]` (replaces all other buttons)

### 4. Inline title editing

**Decision:** Admin taps the item title (`h4.item-title`) to activate an inline `ion-input`. The input replaces the title text, focused automatically. Blur or Enter saves via `updateItemInProgram()`. Escape cancels.

**Implementation:** Add `editingTitleItemId` ref to the composable. When set, the item card renders an input instead of the title text. On blur/enter, call a new `inlineUpdateTitle(itemId, newTitle)` function in the composable.

**Alternative considered:** Double-tap to edit. Rejected because double-tap is not a standard Ionic/mobile pattern and adds detection complexity.

### 5. Inline duration editing

**Decision:** Admin taps the duration badge to open an `ion-popover` containing a stepper: `[-]` button, current value display, `[+]` button, and preset chips (3, 5, 10, 15, 20 min). Changes save immediately on each tap.

**Implementation:** Create a `DurationStepper.vue` component (popover content). The composable gets `inlineUpdateDuration(itemId, newDuration)`. The stepper increments/decrements by 1 minute, with presets that set absolute values.

### 6. Inline participant quick-edit

**Decision:** Admin taps the participant area to open an `ion-popover` with the `ParticipantSelector` in compact mode. Changes save immediately on dismiss.

**Implementation:** Use the existing `ParticipantSelector` component inside a popover. The composable gets `inlineUpdateParticipants(itemId, participants)`.

### 7. Flatten Section — inline-only, no form

**Decision:** Remove `Section` from the type list in `ProgramItemForm`. Add a dedicated "Ajouter une section" button alongside "Ajouter un élément" in the add-item container. Clicking it creates a Section item immediately with a default title and activates inline title editing on it.

**Behavior:**
- Sections are created inline (no modal)
- Sections support inline title editing (tap to edit)
- Sections are draggable in reorder mode
- Sections can be deleted via swipe action
- Sections have NO form modal — swipe "Edit" on a section activates inline title editing instead

**Rationale:** Sections are just visual dividers with a title. They don't need type selection, resource linking, participants, duration, or any other field. A form modal is overkill.

### 8. Grouped type selection in ProgramItemForm

**Decision:** Reorganize the type grid into two tiers:
- **Primary types** (always visible): Chant, Prière, Lecture biblique, Prédication, Titre
- **More types** (expandable): All remaining types behind a "Plus de types" toggle button

Remove `Section` from the type list entirely (handled by inline creation).

**Layout:**
```
Type *
[Chant] [Prière] [Lecture] [Prédication] [Titre]
[▼ Plus de types]
  [Annonce] [Offrande] [Bénédiction] [Bienvenue] [Salutations] ...
```

**Rationale:** Users pick the same 5 types 90%+ of the time. Showing all 18 creates visual noise. Grouping prioritizes common actions without removing access to less-used types.

### 9. Context-aware form sections

**Decision:** Form sections show/hide based on selected type:
- Scripture section (prominent): visible only when type is Lecture biblique or Prédication
- Resource link section: visible for all types except Titre (titles don't have resources)
- Participants/duration: visible for all types
- "Options avancées": visible for all types

This is mostly already the current behavior. The main change is hiding the resource section for Titre type.

### 10. Duration stepper in ProgramItemForm

**Decision:** Replace the `<ion-input type="number">` with a visual stepper component:
```
Durée (minutes)
  [-]  [  5  ]  [+]
  [3] [5] [10] [15] [20]  ← preset chips
```

**Behavior:** `-`/`+` buttons change value by 1. Preset chips set absolute values. Minimum 0, no maximum. The center display is tappable for direct number entry.

### 11. Better autocomplete (debounced, proper blur handling)

**Decision:** Replace the current `handleTitleBlur` 200ms `setTimeout` hack with a proper implementation:
- Debounce input to 300ms before triggering search
- Use `@mousedown.prevent` on suggestions (already done) for click handling
- Use `@focusout` with `relatedTarget` check instead of setTimeout: if the focus moves to a suggestion item, don't hide the dropdown
- Add a subtle loading spinner while searching

## Risks / Trade-offs

**[Swipe + reorder conflict]** → `ion-item-sliding` must be disabled during reorder mode. Mitigated by the `isReorderMode` flag that disables sliding and enables reorder handles.

**[Inline editing save failures]** → Network errors during inline saves could leave the UI out of sync with Firestore. Mitigated by the real-time subscription — after a failed save, the subscription will revert the UI to the server state. Show a toast on error.

**[Section creation inline-only]** → Existing sections in programs won't be affected. They'll gain swipe actions and inline title editing. No migration needed.

**[Scope of change]** → This is a large UX overhaul touching template, script, and styles across 3 files. Risk of regression in edge cases (sections with sub-items, legacy participants, etc.). Mitigate by implementing incrementally and testing each feature before moving to the next.

**[`ion-item-sliding` inside `ion-reorder-group`]** → Ionic supports this combination but there may be touch gesture conflicts on some devices. Test on iOS and Android. Fallback: use `ion-item-sliding` outside the reorder group and handle reorder visually differently.
