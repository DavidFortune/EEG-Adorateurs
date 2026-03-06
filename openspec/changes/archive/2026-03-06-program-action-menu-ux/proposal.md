## Why

Swipe-to-reveal actions on program items are not discoverable — users don't know they can swipe to access edit, delete, or add-sub-item actions. A visible 3-dot menu button with labeled actions (icon + text) is more intuitive and accessible. Additionally, the reorder toggle is hidden in the toolbar among other buttons; placing it alongside the add buttons makes it contextually clear and easier to find.

## What Changes

- Replace `ion-item-sliding` / `ion-item-options` on program items with a 3-dot (`ellipsisVertical`) button that opens a popover menu with labeled actions (icon + text for each action)
- Replace `ion-item-sliding` / `ion-item-options` on sub-items with the same 3-dot popover menu pattern
- Allow sub-items on all program item types (including Titre and Section)
- Move the reorder mode toggle ("Réorganiser") from the toolbar to the add-item button row, alongside "Ajouter un élément" and "Section"
- Remove the reorder checkmark button from the toolbar; add a "Terminer" button in the same row when reorder mode is active

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `service-program`: Program item and sub-item actions change from swipe-to-reveal to a 3-dot action menu. Reorder mode toggle moves from toolbar to add-item row.

## Impact

- `src/views/services/ServiceProgramPage.vue` — Remove `ion-item-sliding` wrappers, add 3-dot buttons with `ion-popover` menus, move reorder toggle to add-item row
- No new dependencies — `ion-popover` and `ion-list` are already available in Ionic Vue
