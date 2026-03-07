## Context

The service program page (`ServiceProgramPage.vue`) currently uses a full-screen modal (`ProgramItemForm.vue`) for all item and sub-item creation/editing. The composable `useProgramItems.ts` manages form state, CRUD operations, and already supports partial inline editing (title click-to-edit, duration popover, participants popover, section instant-create). The data layer stores the entire program as a single Firestore document with an `items[]` array, using `onSnapshot` for real-time sync via `subscribeToProgramByServiceId`.

Resource linking currently happens inside the modal form via title autocomplete (`getSmartSuggestions`) and an explicit `ResourceSelector` modal. The `ResourceSelector` already supports both browse and create modes.

## Goals / Non-Goals

**Goals:**
- Eliminate the full-screen modal for item/sub-item creation — replace with an inline quick-add bar
- Eliminate the full-screen modal for item/sub-item editing — replace with a bottom sheet
- Enable rapid batch creation (type once, add many items of the same type)
- Make resource linking seamless during creation via autocomplete with a sticky "create resource" fallback
- Maintain all existing functionality (reorder, draft mode, export, presentation, YouTube playlist)
- Keep the experience collaboration-friendly with field-level saves

**Non-Goals:**
- Real-time presence indicators (who is editing what) — future enhancement
- Moving items to a Firestore subcollection — keeping current single-document model
- CRDT-based conflict resolution — last-write-wins with transactions is sufficient
- Changing the read-only view for non-admin users
- Modifying the ResourceSelector or ResourceFormPage components

## Decisions

### 1. InlineAddBar as a single reusable component

**Decision**: Create one `InlineAddBar.vue` component used in two contexts — bottom of the program list (for items) and inside expanded items (for sub-items). A `parentItemId` prop determines context.

**Rationale**: Items and sub-items share the same creation gesture (pick type, type title, Enter). The only differences are: items include Section type, sub-items don't; items call `addItemToProgram`, sub-items call `addSubItemToItem`. A prop-driven component avoids duplication.

**Alternative considered**: Separate `AddItemBar` and `AddSubItemBar` components — rejected because 90% of the code would be identical.

### 2. Type persistence between adds

**Decision**: The selected type in `InlineAddBar` persists after creating an item. Adding 4 songs requires selecting the song type only once.

**Rationale**: Worship leaders often add items in batches of the same type (multiple songs, multiple prayers). Resetting the type after each add would add unnecessary taps. The type icons remain visible so switching is easy.

### 3. Bottom sheet instead of full-screen modal for enrichment

**Decision**: Replace the full-screen `ProgramItemForm` modal with an `ItemDetailSheet.vue` — an `ion-modal` with `breakpoints` and `initialBreakpoint` props for half-screen presentation.

**Rationale**: A bottom sheet keeps the program list partially visible, maintaining context. It's more natural on mobile (swipe to dismiss). Each field saves independently on blur rather than batching all changes to a single submit, which reduces the conflict window for collaborative editing.

**Alternative considered**: Expanding the item row inline (Motion-style) — rejected because the number of fields (type, subtitle, notes, resource, scripture, participants, duration) would make the expanded row very tall and push other items off-screen on mobile.

### 4. Resource linking strategy — three tiers

**Decision**: Three progressive levels of resource linking:
1. **Autocomplete** (inline, zero friction): Title suggestions in the add bar dropdown. Selecting a suggestion auto-links the resource.
2. **Sticky create** (inline trigger, modal form): A "Creer comme ressource" option always appears as the last item in the suggestions dropdown. Tapping it creates the item first (Enter), then opens the existing `ResourceSelector` in create mode with the title pre-filled.
3. **Browse & link** (bottom sheet action): The `ItemDetailSheet` includes a "Lier une ressource" button that opens the existing `ResourceSelector` in browse mode.

**Rationale**: Tier 1 covers the most common case (resource already exists). Tier 2 handles new resources without leaving the flow, while reusing the existing `ResourceSelector` create form — no new form to build. Tier 3 handles edge cases where the user needs to browse/filter.

**Key detail**: When "Creer comme ressource" is tapped, the item is created first (via the normal Enter/add flow), then the `ResourceSelector` modal opens. This ensures the item always exists before resource linking — simpler mental model, no deferred creation.

### 5. Keep current Firestore architecture with transactions

**Decision**: Keep the single-document model with items array. Add Firestore transactions to read-modify-write operations to reduce (not eliminate) conflict risk.

**Rationale**: The conflict window is small for a church team (2-3 editors, infrequent simultaneous edits). Moving to subcollections would require significant data migration and query changes for marginal benefit. Transactions ensure atomic updates within the current model.

### 6. Component lifecycle

**Decision**: `ProgramItemForm.vue` is deleted once migration is complete. The 3-dot menu "Modifier" action opens `ItemDetailSheet` instead. "Ajouter un sous-element" in the 3-dot menu expands the item and focuses the sub-item add bar.

**Rationale**: No reason to maintain two parallel editing flows. The bottom sheet fully replaces the modal for all enrichment use cases.

## Risks / Trade-offs

**[Risk] Accidental item creation**: Users might press Enter prematurely, creating items with partial titles.
- Mitigation: Require non-empty title for Enter to create. Empty Enter is a no-op.

**[Risk] Bottom sheet field density on small screens**: The `ItemDetailSheet` has many fields — could feel cramped on small phones.
- Mitigation: Use the same accordion pattern for advanced fields (subtitle, notes, scripture) as the current form. Keep primary fields (type, resource, participants, duration) always visible.

**[Risk] Firestore write conflicts during rapid batch adding**: Two users adding items simultaneously could overwrite each other's additions.
- Mitigation: Use Firestore transactions. The `onSnapshot` listener will re-sync the UI immediately after any write, so lost writes are visible and recoverable.

**[Risk] Keyboard management on mobile**: The add bar needs the keyboard to stay open between adds for rapid entry.
- Mitigation: After Enter creates an item, programmatically re-focus the title input. Test on iOS and Android for keyboard behavior.

**[Trade-off] Bottom sheet vs inline expansion**: The bottom sheet partially covers the list, unlike a fully inline approach. But it provides enough space for all fields without distorting the list layout.

**[Trade-off] Type persistence could confuse**: If a user forgets they have "Chant" selected and adds what they think is a prayer, it'll be typed as "Chant". Mitigation: The selected type is visually highlighted in the type row, making the current selection always visible.
