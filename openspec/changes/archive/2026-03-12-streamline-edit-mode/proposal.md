## Why

The current edit mode uses an expandable card pattern (tap item → inline form expands) and a single InlineAddBar at the bottom. This creates friction: too many fields visible at once, no quick way to add groups or sections, and resource/scripture/notes editing is mixed into the expanded card. A streamlined approach with quick-add buttons, inline title/duration/participant editing, and a 3-dot menu for secondary actions (resource, scripture, notes) will be faster and cleaner.

## What Changes

- **Replace InlineAddBar** with 3 quick-add buttons in edit mode: "+ Élément", "+ Groupe", "+ Section"
  - Each creates the corresponding row immediately with a default title
  - Section reintroduced as a visual divider/separator row (distinct from Group which is a collapsible container)
- **Remove expandable item card** — items no longer expand into a full edit form
- **Inline editing** on item rows: tap title to edit inline, tap duration/participant chips to edit via popover (existing behavior preserved)
- **Add 3-dot menu** (ion-popover) in end slot of each item row with contextual options:
  - "+ Ressource" / "Modifier la ressource" — opens ResourceSelector modal to link/change a resource
  - "+ Passage biblique" / "Modifier le passage" — opens scripture modal to add/edit scripture reference
  - "+ Note" / "Modifier la note" — opens notes modal to add/edit notes
  - "Supprimer" — deletes item after confirmation
  - Menu labels change from "add" to "edit" when the item already has the corresponding data
- **Edit modals** for resource, scripture, and notes each include an "Unlink/Remove" option
- **Preserve 1:1 relationships**: each item has at most one resource, one scripture passage, one notes text
- **Display linked data** on the item row: resource title chip, scripture reference chip, notes indicator

## Capabilities

### New Capabilities

- `item-action-menu`: 3-dot popover menu on program items with contextual add/edit actions for resource, scripture, notes, and delete

### Modified Capabilities

- `inline-add-bar`: Replace single add bar with 3 quick-add buttons (+ Élément, + Groupe, + Section)
- `expandable-item-card`: Remove expandable card pattern, replace with inline editing + 3-dot menu
- `service-program`: Update item row layout to show linked resource/scripture/notes and 3-dot menu
- `inter-item-add-zone`: Remove inter-item add zones (replaced by quick-add buttons at bottom)
- `program-groups`: Add Section type alongside Group (Section = visual divider, Group = collapsible container)

## Impact

- `src/views/services/ServiceProgramPage.vue` — major template/script changes to item rendering and editing
- `src/components/InlineAddBar.vue` — replaced by quick-add buttons (may be removed or simplified)
- `src/components/program/` — may need new components for action menu and edit modals
- `src/types/program.ts` — may need `isSection?: boolean` field on ProgramItem
- `src/composables/useProgramItems.ts` — update add/delete logic for sections
- `src/firebase/programs.ts` — section CRUD if needed
