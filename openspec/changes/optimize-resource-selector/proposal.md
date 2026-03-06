## Why

The ResourceSelector modal is hard to use. It uses ion-segment tabs (Existantes / YouTube / Créer) that fragment the workflow. Collection filtering uses a horizontal segment that doesn't show all collections and only displays symbols, making it impossible to find the right filter. The quick-create form is minimal (title + collection + lyrics only) and doesn't match the full resource creation experience in the Resources section. When a needed resource doesn't exist, there's no smooth way to create one and come back to the item being linked.

## What Changes

- **Remove segment tabs**: Default view shows existing resources directly, no tab switching required
- **Replace collection filter segment with a dropdown**: Use `ion-select` to show all collections by full name, solving the visibility issue
- **Add a "Créer une ressource" button**: Opens an inline resource creation form within the selector modal, using the same full form as the Resources section (title, collection, reference, music properties, contents)
- **Inline resource creation flow**: After saving the new resource, automatically select it and return to the selector (no navigation to resource detail page)
- **Keep YouTube search accessible**: Move YouTube search into the resource creation flow (as a content type option), not as a separate tab
- **Simplify the modal layout**: Single view with search bar, collection dropdown filter, resource list, and a create button at the bottom

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `resource-library`: ResourceSelector modal layout changes — remove tabs, dropdown collection filter, inline resource creation with full form

## Impact

- `src/components/ResourceSelector.vue` — major restructure: remove segment tabs, replace collection filter, add inline creation form
- `src/views/services/ServiceProgramPage.vue` — no changes needed (uses ResourceSelector via props)
