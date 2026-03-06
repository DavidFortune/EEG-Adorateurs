## Why

Linking and managing resources in the service program is tedious and hard to discover. The ResourceSelector is crammed next to the title field in a small `slot="end"` button, the add/edit item modal layout feels heavy with the nested title + resource selector pattern, and unlinking a resource requires opening the modal again. The resource-linking UX in the program should be as smooth and accessible as it is in the Resource library section.

## What Changes

- **Redesign the add/edit item modal layout**: Move the ResourceSelector out of the title field's end slot and give it its own prominent section below the title. Show a clear "Lier une ressource" button that's easy to find and tap.
- **Inline resource display**: When a resource is linked, show a compact resource card (title, collection badge, media type icons) directly in the modal with a one-tap unlink button — no need to re-open the selector.
- **Consistent patterns with resource library**: Reuse the same visual patterns (content type icons, compact cards) from the simplified resource creation form.
- **Lighter form layout**: Reorganize the modal form to reduce visual weight — group optional fields, use clearer visual hierarchy, and avoid the cramped title+selector row.
- **Sub-item resource linking**: Apply the same improved resource linking pattern to add/edit sub-item modals.
- **Quick unlink from program view**: In edit mode, allow unlinking a resource directly from the program item card without opening the edit modal.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `service-program`: Program item resource linking UX changes — ResourceSelector placement, inline resource card display, unlink flow, form layout improvements

## Impact

- `src/views/services/ServiceProgramPage.vue` — restructure add/edit item modals, add inline resource display, add quick unlink in edit mode
- `src/components/ResourceSelector.vue` — may need minor prop/style adjustments for new layout context
