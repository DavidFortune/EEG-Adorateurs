## 1. Replace item swipe actions with 3-dot popover menu

- [x] 1.1 Remove `IonItemSliding`, `IonItemOptions`, `IonItemOption` imports and usage for program items
- [x] 1.2 Add `ellipsisVertical` icon import
- [x] 1.3 Add shared action popover state (`actionPopoverOpen`, `actionPopoverEvent`, `actionPopoverItem`, `actionPopoverSubItem`) and handler functions (`openItemActionPopover`, `handleItemAction`, `closeActionPopover`)
- [x] 1.4 Replace item `ion-item-sliding` wrapper with plain `ion-item`, add 3-dot button with `slot="end"` for consistent right-alignment, visible only for admins and hidden during reorder mode
- [x] 1.5 Add `ion-popover` template with `ion-list`/`ion-item` actions: "Modifier" (primary), "Ajouter un sous-élément" (success, all item types), "Supprimer" (danger)
- [x] 1.6 Remove `.program-item-sliding-item` CSS class references and add `.item-action-menu-btn` and `.action-popover` styles

## 2. Replace sub-item swipe actions with 3-dot popover menu

- [x] 2.1 Remove `ion-item-sliding` and `ion-item-options` usage for sub-items
- [x] 2.2 Add `openSubItemActionPopover` and `handleSubItemAction` functions, reusing the shared popover
- [x] 2.3 Add 3-dot button at end of each sub-item row with `margin-left: auto`, visible only for admins and hidden during reorder mode
- [x] 2.4 Add sub-item actions to the shared popover template: "Modifier" (primary) and "Supprimer" (danger)
- [x] 2.5 Remove `.sub-item-sliding-item` CSS class references and add `.sub-item-action-menu-btn` styles

## 3. Move reorder toggle to add-item row

- [x] 3.1 Remove reorder mode toggle button (`reorderThreeOutline`) and checkmark done button from the toolbar
- [x] 3.2 Add "Réorganiser" button to both top and bottom `.add-item-row` containers, alongside "Ajouter un élément" and "Section"
- [x] 3.3 When `isReorderMode` is true, replace add/section/reorder buttons with a single "Terminer" button in both add-item rows
- [x] 3.4 Style the "Réorganiser" and "Terminer" buttons consistently with the existing add-item row layout

## 4. Allow sub-items on all item types

- [x] 4.1 Remove the `item.type !== 'Titre' && item.type !== 'Section'` restriction on the "Ajouter un sous-élément" action

## 5. Clean up and verify

- [x] 5.1 Remove unused `IonItemSliding`, `IonItemOptions`, `IonItemOption`, `actionSheetController` imports
- [x] 5.2 Remove unused CSS related to swipe actions
- [x] 5.3 Run `vue-tsc --noEmit` to verify type check passes
- [x] 5.4 Verify non-admin users see no 3-dot buttons or reorder controls
