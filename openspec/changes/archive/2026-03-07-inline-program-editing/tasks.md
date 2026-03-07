## 1. Composable: Extend useProgramItems

- [x] 1.1 Add `quickAddItem(type, title, resourceId?)` method that creates an item with minimal fields and returns the created item ID
- [x] 1.2 Add `quickAddSubItem(parentItemId, type, title, resourceId?)` method that creates a sub-item with minimal fields and returns the created sub-item ID
- [x] 1.3 Add `inlineUpdateField(itemId, field, value)` generic method for field-level saves
- [x] 1.4 Add `inlineUpdateSubItemField(parentItemId, subItemId, field, value)` for sub-item field-level saves
- [x] 1.5 Remove modal-related methods (openAddItemModal, openEditItemModal, etc.) and form state (showFormModal, formMode, formInitialData)

## 2. Component: InlineAddBar

- [x] 2.1 Create `InlineAddBar.vue` with primary type icon row (Titre, Chant, Priere, Lecture biblique, Predication), title input, and Enter-to-create behavior
- [x] 2.2 Implement type persistence -- selected type stays after each add, input clears and re-focuses; Titre selected by default
- [x] 2.3 Integrate resource autocomplete using `getSmartSuggestions` with 300ms debounce -- only active for Chant type
- [x] 2.4 Add sticky "Creer [title] comme ressource" option as last item in suggestions dropdown
- [x] 2.5 Implement sticky create flow: create item first, then open ResourceSelector in create mode with pre-filled title, auto-link resource on creation (no confirm click)
- [x] 2.6 Handle `parentItemId` prop to switch between top-level item creation and sub-item creation
- [x] 2.7 Add scripture reference field for Predication type with Enter-to-focus flow (title -> scripture -> submit)

## 3. Component: ItemDetailSheet

- [x] 3.1 Create `ItemDetailSheet.vue` as an `ion-modal` with bottom sheet breakpoints (initialBreakpoint ~0.6, breakpoints [0, 0.6, 0.9])
- [x] 3.2 Add type selection grid with immediate save on selection
- [x] 3.3 Add subtitle text input with save on blur
- [x] 3.4 Add notes multiline textarea with save on blur
- [x] 3.5 Add resource section -- show linked resource card or "Lier une ressource" button that opens ResourceSelector
- [x] 3.6 Add scripture section -- reference input, "Chercher les versets" button, formatted preview
- [x] 3.7 Add ParticipantSelector integration with save on change
- [x] 3.8 Add DurationStepper integration with save on change
- [x] 3.9 Add "Ajouter un sous-element" shortcut (only for Titre type items, not sub-items)
- [x] 3.10 Add "Supprimer" action with confirmation dialog
- [x] 3.11 Ensure sheet fields update in real-time via onSnapshot

## 4. Integration: ServiceProgramPage

- [x] 4.1 Replace old add button with InlineAddBar at the bottom of the items list
- [x] 4.2 Add InlineAddBar inside expanded Titre items, below sub-items list, for sub-item creation
- [x] 4.3 Wire 3-dot menu "Modifier" action to open ItemDetailSheet
- [x] 4.4 Wire 3-dot menu "Ajouter un sous-element" action to expand item and focus sub-item InlineAddBar
- [x] 4.5 Wire sub-item 3-dot menu "Modifier" action to open ItemDetailSheet for sub-item editing
- [x] 4.6 Remove ProgramItemForm modal integration
- [x] 4.7 Make reorder always active (no toggle button), move drag handle to slot="end"
- [x] 4.8 Restrict sub-items to Titre type only (canHaveSubItems guard)
- [x] 4.9 Add section creation via 3-dot menu "Ajouter une section" (inserts after selected item)
- [x] 4.10 Auto-fetch scripture for Lecture biblique (using title) and Predication (using scripture reference)
- [x] 4.11 Auto-link resources on creation from ResourceSelector (no confirm click)
- [x] 4.12 Add inline quick action buttons (participant, duration, subtitle, notes) inside content column
- [x] 4.13 Add inline meta chips (duration, participants as compact pills) inside content column
- [x] 4.14 Mobile-optimized layout: reduced padding, compact order numbers, end-slot reorder + 3-dot vertically centered

## 5. Cleanup

- [x] 5.1 Delete `ProgramItemForm.vue` component
- [x] 5.2 Remove unused modal-related methods from `useProgramItems.ts`
- [x] 5.3 Remove unused imports, dead functions, and dead CSS from ServiceProgramPage
- [x] 5.4 Test full flow: create items, create sub-items, edit via bottom sheet, link resources via autocomplete, create resources via sticky option, delete, reorder
