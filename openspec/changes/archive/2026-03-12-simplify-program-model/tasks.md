## 1. Data Model Update

- [x] 1.1 Remove `ProgramItemType` enum from `src/types/program.ts`
- [x] 1.2 Remove `ProgramSubItem` interface from `src/types/program.ts`
- [x] 1.3 Update `ProgramItem` interface: add `isGroup?: boolean`, `groupId?: string`, make `type` optional string (legacy), remove required type
- [x] 1.4 Remove `ProgramSection` interface (already deprecated)

## 2. Read-Time Migration

- [x] 2.1 Add `migrateProgram()` function in `src/firebase/programs.ts` that promotes sub-items to top-level grouped items and converts Section-type items to group headers
- [x] 2.2 Wire migration into `getProgramByServiceId` and `subscribeToProgramByServiceId` read paths
- [x] 2.3 Ensure migration is idempotent (no duplicates on re-read)

## 3. Firebase CRUD Updates

- [x] 3.1 Remove `addSubItemToItem`, `updateSubItemInItem`, `deleteSubItemFromItem` functions
- [x] 3.2 Add `createGroupItem` function (creates item with `isGroup: true`)
- [x] 3.3 Update `deleteItem` to handle group deletion: ungroup child items (remove `groupId`) instead of deleting them
- [x] 3.4 Update reorder logic to move group headers with their child items

## 4. Composable Updates

- [x] 4.1 Remove `deleteSubItem`, `handleSubItemReorder`, `quickAddSubItem`, `inlineUpdateSubItemField` from `useProgramItems.ts`
- [x] 4.2 Add `createGroup`, `deleteGroup` helpers to composable
- [x] 4.3 Update reorder handler to keep grouped items together when moving a group header

## 5. InlineAddBar Simplification

- [x] 5.1 Remove type selector row (primary + secondary type icons) from `InlineAddBar.vue`
- [x] 5.2 Remove `parentItemId` prop and sub-item creation mode
- [x] 5.3 Enable resource autocomplete for all items (remove type-gating to Chant only)
- [x] 5.4 Remove scripture reference input for Predication type

## 6. Template — Remove Sub-Items

- [x] 6.1 Remove sub-items container, sub-item rendering loop, sub-item expanded edit cards (~lines 579-741)
- [x] 6.2 Remove sub-item InlineAddBar instances
- [x] 6.3 Remove `canHaveSubItems`, `hasSubItems`, `getSortedSubItems` helpers
- [x] 6.4 Remove sub-item related state: `subItemAddBarRefs`, sub-item expand state

## 7. Template — Remove Item Types

- [x] 7.1 Remove `getItemIcon` function and all type-specific icon imports (musicalNoteOutline, handLeftOutline, libraryOutline, micOutline, megaphoneOutline, giftOutline, etc.)
- [x] 7.2 Remove type icon display from collapsed item rows
- [x] 7.3 Remove type change tucked section from expanded card
- [x] 7.4 Remove `expandedTypeOptions` and type grid CSS
- [x] 7.5 Remove `isSectionItem` helper and section-specific CSS styling

## 8. Template — Add Group Support

- [x] 8.1 Add group header rendering: visually distinct row with bold title, background color, collapse/expand chevron
- [x] 8.2 Add `collapsedGroupIds` reactive Set with toggle helpers (default all expanded)
- [x] 8.3 Add group-aware item rendering: indent grouped items, hide items in collapsed groups
- [x] 8.4 Update inter-item add zone: replace "Section" button with "Groupe" button, wire to `createGroup`
- [x] 8.5 Update group header edit mode: inline title edit on tap, delete button that ungroups children

## 9. Template — Reorder Updates

- [x] 9.1 Update reorder handler to assign/remove `groupId` based on drop position (items dropped within a group's range get the group's ID)
- [x] 9.2 Ensure dragging a group header moves all its child items together

## 10. Cleanup

- [x] 10.1 Delete `src/components/ItemDetailSheet.vue` (already unused)
- [x] 10.2 Remove unused imports, icons, CSS across all modified files
- [x] 10.3 Update `ServiceDetailPage.vue` sub-item iteration to use group-aware display

## 11. Verify

- [x] 11.1 Build compiles with no errors (`npx vue-tsc --noEmit`)
- [x] 11.2 Existing programs with sub-items display correctly after migration (promoted to grouped items)
- [x] 11.3 Group create, rename, collapse/expand, delete (ungroups children) all work
- [x] 11.4 Reorder moves groups with children, items can be dragged into/out of groups
- [x] 11.5 InlineAddBar creates items without type, autocomplete works for all items
- [x] 11.6 Expanded card shows all fields except type change and sub-item button
