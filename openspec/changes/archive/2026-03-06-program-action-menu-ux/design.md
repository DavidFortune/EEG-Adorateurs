## Context

The service program page currently uses `ion-item-sliding` with `ion-item-options` for item/sub-item actions (edit, delete, add sub-item). This swipe gesture is not discoverable — users have no visual indication that actions exist. The reorder mode toggle is in the toolbar among several other buttons, making it hard to find.

## Goals / Non-Goals

**Goals:**
- Make item/sub-item actions discoverable via a visible 3-dot menu button
- Show labeled actions (icon + text) so users understand what each action does
- Place reorder toggle contextually alongside add buttons for better discoverability

**Non-Goals:**
- Changing inline editing behavior (title, duration, participants)
- Changing the add-item form or sub-item form

## Decisions

### 1. Use `ion-popover` with `ion-list` for item actions

Use a template-based `ion-popover` containing an `ion-list` of `ion-item` buttons. The popover appears right next to the 3-dot trigger button, keeping the user's attention near where they tapped. This is preferred over `actionSheetController` because:
- The popover appears contextually next to the button (less eye movement)
- Standard overflow menu pattern (Material Design, iOS context menus)
- Less disruptive than a full bottom sheet for just 2-3 actions

A single shared popover handles both item and sub-item menus via reactive state (`actionPopoverItem` / `actionPopoverSubItem`).

Each action uses a colored icon and text label:
- **Items**: "Modifier" (primary, edit), "Ajouter un sous-élément" (success, add sub-item for all types), "Supprimer" (danger, delete). For sections, "Modifier" triggers inline title editing.
- **Sub-items**: "Modifier" (primary, edit), "Supprimer" (danger, delete)

### 2. 3-dot button placement on items

Add an `ellipsisVertical` icon button using Ionic's `slot="end"` on the `ion-item` wrapper. This leverages Ionic's native layout to pin the button consistently to the right edge across all items, regardless of content width. The button is only visible for admins.

For sub-items, the same pattern applies — a 3-dot button at the end of the sub-item flex row, pushed right via `margin-left: auto`.

### 3. Remove `ion-item-sliding` entirely

Since all actions move to the popover, `ion-item-sliding`, `ion-item-options`, and `ion-item-option` are no longer needed. The items remain inside `ion-reorder-group` for drag-and-drop support, wrapped in plain `ion-item` elements.

### 4. Reorder toggle moves to add-item row

The "Réorganiser" button moves from the toolbar to the `.add-item-row` div, alongside "Ajouter un élément" and "Section". When reorder mode is active, the three add/section buttons are replaced by a single "Terminer" button to exit reorder mode. This appears in both top and bottom add-item containers.

The toolbar no longer contains the reorder or checkmark buttons.

### 5. Hide 3-dot buttons during reorder mode

During reorder mode, the 3-dot action buttons are hidden to avoid accidental action triggers while dragging. Only drag handles and the "Terminer" button are visible.

## Risks / Trade-offs

- [Extra tap required] Popover requires one more tap than swipe. → Acceptable trade-off for much better discoverability.
- [Popover overlays content] The popover partially overlays content near the button. → Minimal disruption, dismissed on backdrop tap.
