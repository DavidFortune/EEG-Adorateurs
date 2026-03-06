## Why

Sub-items in the service program are second-class citizens compared to parent items. They only have a title, resource link, notes, and scripture reference — missing type selection, title autocomplete with resource suggestions, participant assignment, duration, and subtitle. This forces users to work around limitations when building complex program structures like worship medleys. Sub-items should reuse the same rich form logic as parent items (excluding the Section type which doesn't make sense for sub-items).

## What Changes

- **Add type selection to sub-items**: Sub-items get the same type button grid as items, filtered to exclude Section type
- **Add title autocomplete to sub-items**: Sub-items get the same title autocomplete with resource suggestions and auto-link behavior
- **Add participant assignment to sub-items**: Sub-items can have assigned participants
- **Add duration to sub-items**: Sub-items can have individual durations
- **Add subtitle to sub-items**: Sub-items can have subtitles
- **Group optional fields under "Options avancées"**: Match the parent item modal layout with collapsible accordion for secondary fields
- **Update sub-item display in program view**: Show type icon, duration, and participants on sub-item cards
- **Update data model**: Extend `ProgramSubItem` interface with new fields

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `service-program`: Sub-items gain type, title autocomplete, participants, duration, and subtitle — matching the parent item form pattern (excluding Section type)

## Impact

- `src/types/program.ts` — extend `ProgramSubItem` interface with `type`, `subtitle`, `participants`, `duration` fields
- `src/views/services/ServiceProgramPage.vue` — restructure add/edit sub-item modals, update sub-item display in program view, add sub-item form state fields
- `src/firebase/programs.ts` — update addSubItemToItem/updateSubItemInItem to handle new fields
