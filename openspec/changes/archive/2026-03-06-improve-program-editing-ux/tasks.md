## 1. Remove edit mode toggle and always-on admin editing

- [x] 1.1 Remove `isEditMode` ref, `toggleEditMode()` function, and the pencil/checkmark toolbar button from ServiceProgramPage
- [x] 1.2 Replace all `v-if="isEditMode"` with `v-if="isAdmin"` in the template (add buttons, quick-unlink, action areas)
- [x] 1.3 Remove `edit-mode` CSS class from `ion-content` and update any styles that depend on it
- [x] 1.4 Make toolbar buttons (presentation, export, YouTube, SMS) always visible for admins (remove `!isEditMode` guard)
- [x] 1.5 Change page title from conditional `isEditMode ? 'Édition du programme' : 'Programme'` to just `'Programme'`

## 2. Swipe-to-reveal actions on items

- [x] 2.1 Wrap each program item in `ion-item-sliding` with `:disabled="isReorderMode"` inside the `ion-reorder-group`
- [x] 2.2 Add `ion-item-options` (side="end") with edit, delete, and add-sub-item buttons for each item
- [x] 2.3 For section items, include only delete in swipe options (edit triggers inline title editing — see task 5.4)
- [x] 2.4 Remove the fixed `.item-actions-column` from the item layout
- [x] 2.5 Style swipe action buttons (green for add-sub, primary for edit, danger for delete) with appropriate icons

## 3. Swipe-to-reveal actions on sub-items

- [x] 3.1 Wrap each sub-item in `ion-item-sliding` with `:disabled="isReorderMode"`
- [x] 3.2 Add `ion-item-options` (side="end") with edit and delete buttons for each sub-item
- [x] 3.3 Remove the fixed `.sub-item-actions` div from the sub-item layout
- [x] 3.4 Style sub-item swipe action buttons

## 4. Dedicated reorder mode

- [x] 4.1 Add `isReorderMode` ref to ServiceProgramPage (or composable)
- [x] 4.2 Add "Réorganiser" toolbar button (visible to admins when not in reorder mode) and "Done" checkmark button (when in reorder mode)
- [x] 4.3 Bind `ion-reorder-group :disabled` to `!isReorderMode` (instead of old `!isEditMode`)
- [x] 4.4 Show drag handles (`ion-reorder`) only when `isReorderMode` is true
- [x] 4.5 Hide other toolbar buttons (presentation, export, YouTube, SMS) during reorder mode — show only the checkmark "Done" button

## 5. Inline title editing

- [x] 5.1 Add `editingTitleItemId` ref and `inlineUpdateTitle(itemId, newTitle)` function to `useProgramItems` composable
- [x] 5.2 In the item template, conditionally render an `ion-input` (when `editingTitleItemId === item.id`) instead of the `h4.item-title` text
- [x] 5.3 Add click handler on `h4.item-title` (admin only) to activate inline editing, auto-focus the input
- [x] 5.4 Handle Enter (save), Escape (cancel), and blur (save) events on the inline input
- [x] 5.5 Wire section swipe "Edit" action to activate inline title editing instead of opening form modal
- [x] 5.6 Style the inline input to match the title appearance (same font size, weight, position)

## 6. Inline duration editing

- [x] 6.1 Create `DurationStepper.vue` component: +/- buttons, center value display, preset chips (3, 5, 10, 15, 20 min), tappable center for direct entry
- [x] 6.2 Add `inlineUpdateDuration(itemId, newDuration)` function to `useProgramItems` composable
- [x] 6.3 In the item template, add click handler on `.item-duration` (admin only) that opens an `ion-popover` with `DurationStepper`
- [x] 6.4 Wire stepper changes to save immediately via `inlineUpdateDuration`
- [x] 6.5 Style the duration badge to indicate interactivity for admins (cursor pointer, subtle hover effect)

## 7. Inline participant quick-edit

- [x] 7.1 Add `inlineUpdateParticipants(itemId, participants)` function to `useProgramItems` composable
- [x] 7.2 In the item template, add click handler on `.item-participants` (admin only) that opens an `ion-popover` with `ParticipantSelector`
- [x] 7.3 Wire popover dismiss to save participant changes via `inlineUpdateParticipants`
- [x] 7.4 Style the participant area to indicate interactivity for admins

## 8. Flatten Section — inline creation

- [x] 8.1 Remove `Section` from the `programItemTypes` array passed to `ProgramItemForm`
- [x] 8.2 Add "Ajouter une section" button alongside "Ajouter un élément" in both top and bottom add-item containers
- [x] 8.3 Add `addSectionInline()` function to composable: creates a Section item with default title "Nouvelle section" and returns the new item ID
- [x] 8.4 After section creation, automatically activate inline title editing on the new section item
- [x] 8.5 Style the "Ajouter une section" button distinctly (e.g., outline with section icon)

## 9. Grouped type selection in ProgramItemForm

- [x] 9.1 Define primary types constant: `['Chant', 'Prière', 'Lecture biblique', 'Prédication', 'Titre']`
- [x] 9.2 Split the type grid into primary (always visible) and secondary (collapsible) sections
- [x] 9.3 Add "Plus de types" toggle button below the primary grid that expands/collapses the secondary grid
- [x] 9.4 Remove `Section` from the types prop for item-level forms (keep Titre)
- [x] 9.5 Style the grouped layout: primary types full-size buttons, secondary types smaller or slightly muted

## 10. Duration stepper in ProgramItemForm

- [x] 10.1 Replace the `<ion-input type="number">` for duration in ProgramItemForm with the `DurationStepper` component (reuse from task 6.1)
- [x] 10.2 Ensure the stepper integrates with the form's `form.duration` reactive state
- [x] 10.3 Style the stepper consistently in the form context

## 11. Better autocomplete in ProgramItemForm

- [x] 11.1 Replace the `handleTitleBlur` 200ms setTimeout with proper `@focusout` relatedTarget check
- [x] 11.2 Add debounce (300ms) to the `handleTitleInput` function
- [x] 11.3 Add a subtle loading spinner in the autocomplete dropdown while searching
- [x] 11.4 Verify autocomplete works correctly with the new blur handling (clicking a suggestion should select it)

## 12. Verify and clean up

- [x] 12.1 Run `vue-tsc --noEmit` to verify type check passes
- [x] 12.2 Remove unused imports, refs, and CSS classes related to old `isEditMode` pattern
- [x] 12.3 Test that non-admin users see the read-only view with no editing capabilities
