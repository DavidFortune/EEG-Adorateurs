## Why

Groups currently lack a direct way to add items into them — users must create items at the bottom, then drag them into the group. Additionally, the old sub-item lyrics modal (which showed all lyrics, scripture, and notes for items in a group) was removed during the model simplification and needs to come back for the new group model.

## What Changes

- Add a "+ Élément" button on group headers (edit mode) to create an item directly inside the group
- Add a group content modal (accessible from the group header) that displays all lyrics, scripture text, and notes from the group's child items in a scrollable view — similar to the old sub-item lyrics modal

## Capabilities

### New Capabilities

_None_

### Modified Capabilities

- `program-groups`: Add "add item to group" button on group header; add group content modal for viewing children's lyrics, scripture, and notes

## Impact

- `src/views/services/ServiceProgramPage.vue` — group header template, new modal, composable wiring
- `src/composables/useProgramItems.ts` — new `quickAddItemToGroup` function
