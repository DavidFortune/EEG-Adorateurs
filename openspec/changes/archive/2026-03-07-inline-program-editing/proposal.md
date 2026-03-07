## Why

Adding items and sub-items to a service program currently requires opening a full-screen modal form for every single entry. When building a 12-item program, this means 12+ modal open/close cycles, each breaking the user's creative flow. The modal batches all field changes into a single submit, which also creates blind spots for collaborative editing — changes made by other users during the 30-second modal session can be silently overwritten. Inline editing eliminates both problems: faster item creation and field-level saves that are inherently collaboration-friendly.

## What Changes

- **Replace the "Ajouter un element" modal flow with an inline quick-add bar** that lets admins select a type and type a title to instantly create items with Enter — no modal, no context switch
- **Reuse the same inline add bar component inside expanded items** to enable rapid sub-item creation with the same gesture
- **Persist the selected type between consecutive adds** so batch-adding multiple songs or prayers requires only one type selection
- **Integrate resource autocomplete suggestions directly in the add bar** with a sticky "Creer comme ressource" option at the bottom that opens the existing ResourceSelector modal in create mode with the title pre-filled
- **Replace the 3-dot menu "Modifier" action with a bottom sheet (half-screen modal)** for enriching items/sub-items — same fields as the current form but lighter, field-level saves on blur, and the program list remains visible behind it
- **Remove the full-screen ProgramItemForm modal** once the inline add bar + bottom sheet cover all use cases
- **Keep existing inline editing** for title (click-to-edit), duration (popover), and participants (popover) unchanged

## Capabilities

### New Capabilities
- `inline-add-bar`: Reusable inline component for rapid item/sub-item creation with type selection, title input, resource autocomplete, and sticky create-resource option
- `item-detail-sheet`: Bottom sheet component for enriching items/sub-items with all fields (type, subtitle, notes, resource linking, scripture, duration, participants, delete) using field-level saves

### Modified Capabilities
- `service-program`: Program item creation and editing flows change from full-screen modal to inline add bar + bottom sheet. The ProgramItemForm modal is removed. The 3-dot menu "Modifier" action opens the bottom sheet instead of the modal. Sub-item add bar appears inside expanded items.

## Impact

- **Components**: New `InlineAddBar.vue`, new `ItemDetailSheet.vue`. `ProgramItemForm.vue` to be deleted. `ServiceProgramPage.vue` significantly modified (remove modal integration, add inline bars, wire bottom sheet).
- **Composable**: `useProgramItems.ts` gains `quickAddItem()`, `quickAddSubItem()`, and field-level inline update methods for remaining fields (type, subtitle, notes, resourceId, scripture). Modal-related methods removed.
- **Existing components reused as-is**: `ResourceSelector.vue` (opened from bottom sheet and from sticky create option), `DurationStepper.vue`, `ParticipantSelector.vue`, resource autocomplete via `getSmartSuggestions()`.
- **Data layer**: No schema changes. Firestore operations stay the same (read-modify-write on items array). Consider adding Firestore transactions to reduce conflict risk during concurrent edits.
- **No breaking changes**: Read-only view for non-admins is unchanged. All existing program data is compatible.
