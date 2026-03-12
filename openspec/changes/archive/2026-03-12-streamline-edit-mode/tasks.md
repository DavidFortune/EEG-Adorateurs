## 1. Data Model

- [x] 1.1 Add `isSection?: boolean` to `ProgramItem` interface in `src/types/program.ts`
- [x] 1.2 Update `migrateProgram()` in `src/firebase/programs.ts` to handle legacy Section-type items by setting `isSection: true` (alongside existing `isGroup` migration)
- [x] 1.3 Add `createSectionItem` function in `src/firebase/programs.ts` (creates item with `isSection: true`)

## 2. Quick-Add Buttons

- [x] 2.1 Remove `InlineAddBar` component usage from `ServiceProgramPage.vue` (and related imports, refs, handlers)
- [x] 2.2 Add quick-add buttons section at the bottom of the program list (edit mode only): "+ Élément", "+ Groupe", "+ Section"
- [x] 2.3 Wire "+ Élément" to create item with default title and activate inline title edit
- [x] 2.4 Wire "+ Groupe" to create group header with default title and activate inline title edit
- [x] 2.5 Wire "+ Section" to create section with default title and activate inline title edit

## 3. Remove Expandable Card & Inter-Item Zones

- [x] 3.1 Remove expandable item card template, state (`expandedEditItemIds`, `tuckedSections`, `toggleEditExpansion`, `isEditExpanded`, `collapseAllEditExpanded`), and CSS
- [x] 3.2 Remove inter-item add zone template, state (`activeAddZoneIndex`, `toggleAddZone`, `addItemAtPosition`, `addGroupAtPosition`), and CSS
- [x] 3.3 Remove expand chevron button from item rows

## 4. Section Rendering

- [x] 4.1 Add section row rendering in the template: colored banner with centered title, no item number, no chips
- [x] 4.2 Add inline title editing for sections (tap to edit, same as group headers)
- [x] 4.3 Exclude sections from item numbering (like groups)
- [x] 4.4 Add section CSS (colored banner style, similar to old Section type)

## 5. Item Action Menu (3-Dot)

- [x] 5.1 Add 3-dot menu button (`ellipsisVerticalOutline`) in end slot of each item row (edit mode only)
- [x] 5.2 Create `ion-popover` for the action menu with contextual options based on item state
- [x] 5.3 For regular items: show resource, scripture, notes, delete options with add/edit labels based on state
- [x] 5.4 For groups and sections: show only delete option
- [x] 5.5 Wire "Supprimer" to existing `deleteItem` with confirmation prompt

## 6. Resource Edit Modal

- [x] 6.1 Wire resource action to open existing `ResourceSelector` in modal mode
- [x] 6.2 On resource select, link to item via `inlineUpdateField(itemId, 'resourceId', resourceId)`
- [x] 6.3 Add "Dissocier la ressource" button/option when resource is already linked
- [x] 6.4 Display linked resource title as a chip on the item row

## 7. Scripture Edit Modal

- [x] 7.1 Create scripture edit modal with reference input + fetch button + text display area
- [x] 7.2 Wire fetch button to `bibleService.getScripture()` and display results
- [x] 7.3 On save, update item's scriptureReference, scriptureText, scriptureVersion fields
- [x] 7.4 Pre-fill modal when editing existing scripture
- [x] 7.5 Add "Supprimer le passage" button to clear scripture fields
- [x] 7.6 Display scripture reference as a chip on the item row

## 8. Notes Edit Modal

- [x] 8.1 Create notes edit modal with `ion-textarea`
- [x] 8.2 On save, update item's notes field
- [x] 8.3 Pre-fill textarea when editing existing notes
- [x] 8.4 Add "Supprimer la note" button to clear notes
- [x] 8.5 Display notes indicator icon on the item row when notes exist

## 9. Cleanup

- [x] 9.1 Remove unused imports, state, and CSS related to expandable cards, tucked sections, and InlineAddBar
- [x] 9.2 Remove `InlineAddBar.vue` component file (no longer used anywhere)
- [x] 9.3 Update `ProgramOverview.vue` to handle section items (skip or display as dividers)

## 10. Verify

- [x] 10.1 Build compiles with no errors (`npx vue-tsc --noEmit`)
- [x] 10.2 Quick-add buttons create items, groups, and sections correctly
- [x] 10.3 3-dot menu shows correct contextual options for each item type
- [x] 10.4 Resource, scripture, and notes modals open, save, and unlink correctly
- [x] 10.5 Section rows render as colored banners with inline-editable titles
- [x] 10.6 Existing programs with legacy data display correctly after migration
