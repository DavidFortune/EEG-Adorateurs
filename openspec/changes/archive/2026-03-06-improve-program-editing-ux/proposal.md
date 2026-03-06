## Why

Editing a service program requires too many taps and mode switches. Admins must toggle edit mode ON before any editing action, then open a full-screen modal for simple changes like fixing a title or adjusting duration. The always-visible action column (edit/delete/add-sub) wastes 120px of horizontal space when in edit mode, and the flat type selection grid presents 18+ types with no visual hierarchy. These friction points slow down the most common program authoring workflow: quickly building and tweaking a program list.

## What Changes

- **Remove the edit mode toggle**: Admins always have editing capabilities — no pencil button to switch modes. Viewing and editing are unified.
- **Swipe-to-reveal actions**: Item edit/delete/add-sub actions are accessed by swiping left on the item card (using `ion-item-sliding`), replacing the fixed action column. Reclaims horizontal space for content.
- **Dedicated reorder mode**: A "Réorganiser" toolbar button replaces the pencil toggle for drag-and-drop reordering. This is the only explicit mode switch that remains.
- **Inline title editing**: Admins can tap an item title to edit it in-place without opening the full form modal. Blur or Enter saves.
- **Inline duration editing**: Admins can tap the duration badge to adjust via a popover stepper (+/- buttons), no modal needed.
- **Inline participant quick-edit**: Admins can tap the participant area to open a compact popover for quick assignment changes.
- **Grouped type selection**: Type grid reorganized into categories (Keep Chant,Prière, Lecture biblique, Prédication and Titre) with the 4-5 most common types displayed prominently. Less common types accessible via expandable section.
- **Flatten Section**: Remove Section from Add item form. Put it at the same level as Ajouter un élément button.  Only setup inline editing.  No form.  Must be dragabble, editable and deletable. 
- **Context-aware form sections**: Form auto-shows/hides sections based on selected type (e.g., scripture section appears for Lecture/Prédication, hides for Chant).
- **Duration stepper**: Replace bare number input with visual +/- stepper with common presets (3, 5, 10, 15, 20 min).
- **Better autocomplete**: Proper debounced search dropdown replacing the 200ms blur delay hack.

## Capabilities

### New Capabilities

_None — all changes enhance existing service-program behavior._

### Modified Capabilities

- `service-program`: Removing edit mode toggle, adding swipe actions, inline editing, reorder mode, grouped type selection, context-aware form, duration stepper, improved autocomplete.

## Impact

- `src/views/services/ServiceProgramPage.vue` — Major template/script changes: remove `isEditMode` toggle logic, replace action column with `ion-item-sliding`, add inline editing components, add reorder mode
- `src/components/ProgramItemForm.vue` — Restructure type selection grid into grouped layout, add context-aware section visibility, replace duration input with stepper, improve autocomplete
- `src/composables/useProgramItems.ts` — Add inline update functions (title, duration, participant) that bypass the full form modal
- CSS/styles — New styles for swipe actions, inline editing states, grouped type grid, duration stepper, reorder mode indicators
