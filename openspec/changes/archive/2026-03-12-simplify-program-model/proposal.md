## Why

The program data model has accumulated complexity: sub-items nested inside TITLE-type items, 18+ item types with icons/labels, and type-specific logic scattered across templates, composables, and Firebase functions. This makes the page harder to maintain (~7000 lines) and the UX harder to reason about. Sub-items are really just "items inside a group" — modeling them as a separate concept adds unnecessary nesting. Item types add visual noise but don't drive meaningful behavior beyond icon display.

## What Changes

- **BREAKING**: Remove `ProgramSubItem` interface and all sub-item CRUD (add, update, delete, reorder)
- **BREAKING**: Remove `ProgramItemType` enum and all type-specific logic (icon map, type grid selector, type-based filtering)
- Introduce `ProgramGroup` concept: items can be grouped under a named header. A group is a lightweight container with a title and optional metadata — items belong to a group via a `groupId` field
- Flatten the data model: all items are top-level `ProgramItem` entries (no nested arrays)
- Add read-time migration: existing sub-items are promoted to top-level items within their parent's group; existing `type` fields are preserved as optional display hint but not required
- Remove ~160 lines of sub-item template, 3 Firebase functions, 4 composable functions
- Remove type selector grid, icon map, and type-specific CSS
- Keep `Section` concept as a simple visual divider (already exists, just strip the type enum dependency)

## Capabilities

### New Capabilities
- `program-groups`: Group model, group CRUD, item-group assignment, group reordering, read-time migration from sub-items

### Modified Capabilities
- `expandable-item-card`: Remove sub-item expand/collapse, remove type change tucked section, simplify expanded card fields
- `inter-item-add-zone`: Replace "Section" option with "Group" option for inserting group headers
- `service-program`: Update ProgramItem interface (remove subItems, remove required type, add optional groupId)
- `inline-add-bar`: Remove type selector from add bar, simplify to title + resource only

## Impact

- `src/types/program.ts` — remove ProgramSubItem, ProgramItemType enum, update ProgramItem
- `src/firebase/programs.ts` — remove sub-item CRUD, add group CRUD, add migration logic
- `src/composables/useProgramItems.ts` — remove sub-item functions, add group functions
- `src/views/services/ServiceProgramPage.vue` — major template/script reduction
- `src/components/InlineAddBar.vue` — remove type selector, simplify props
- `src/components/ItemDetailSheet.vue` — can be fully deleted (already unused)
- `src/views/services/ServiceDetailPage.vue` — update sub-item iteration to group-aware display
- `src/components/service-detail/ProgramOverview.vue` — no sub-item changes needed (doesn't display them)
