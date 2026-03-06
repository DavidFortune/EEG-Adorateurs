## Why

ServiceProgramPage.vue is 7,180 lines — a god component handling 10+ distinct concerns. The add/edit item modal, add sub-item modal, and edit sub-item modal are 90% identical (~600 lines of duplicated template, ~500 lines of duplicated script with triplicated handlers). This makes bugs inconsistent (e.g., scripture clearing only works in edit-sub-item), UX inconsistent (different placeholders, different scripture rendering), and any form change requires updating three places. Participants and duration are buried behind an "Options avancées" accordion despite being core data for a worship service program.

## What Changes

- **Extract `ProgramItemForm.vue`**: A single reusable form component replacing the 3 duplicate modal forms (add/edit item, add/edit sub-item), parameterized by mode, type list, and submit handler
- **Extract `useProgramItems` composable**: Move item/sub-item CRUD logic, reorder handlers, and related state out of ServiceProgramPage into a focused composable
- **Promote core fields**: Move participants and duration out of "Options avancées" into the main form body
- **Normalize inconsistencies**: Consistent scripture clearing (always send `null`), consistent `v-html` scripture preview, default `scriptureVersion` to `'LSG'` everywhere, consistent participant cleaning
- **Reduce modal count**: Replace 3 separate modals (item form, add sub-item, edit sub-item) with a single modal using `ProgramItemForm`

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `service-program`: Program item/sub-item form layout changes — unified form component, participants and duration promoted to main form body

## Impact

- `src/components/ProgramItemForm.vue` — new component (~300-400 lines replacing ~1,200 lines across 3 forms)
- `src/composables/useProgramItems.ts` — new composable extracting CRUD + reorder logic
- `src/views/services/ServiceProgramPage.vue` — major reduction: remove 3 modal templates, remove triplicated handlers, import new component and composable
