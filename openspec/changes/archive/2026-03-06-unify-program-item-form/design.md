## Context

ServiceProgramPage.vue is 7,180 lines with 67 reactive refs, 14 modals, and triplicated form logic. The add/edit item modal (lines 472-659), add sub-item modal (lines 662-881), and edit sub-item modal (lines 884-1102) share 90% identical template and script. Each has its own form ref, its own title autocomplete handlers (3 sets of input/blur/select functions), its own scripture fetch handlers (3 copies), its own resource selector boolean, and its own submit logic. The actual differences are: type list (all vs no SECTION/TITLE), type-required validation, header/button text, submit API call, and minor scripture rendering inconsistencies.

## Goals / Non-Goals

**Goals:**
- Replace 3 duplicate modal forms with a single `ProgramItemForm.vue` component
- Extract item/sub-item CRUD and reorder logic into a `useProgramItems` composable
- Promote participants and duration from "Options avancées" into the main form body
- Fix inconsistencies: scripture clearing, scripture rendering, default scriptureVersion, participant cleaning
- Reduce ServiceProgramPage by ~1,500+ lines

**Non-Goals:**
- Inline editing (that's a follow-up change)
- Extracting presentation, YouTube playlist, or other non-form features (follow-up)
- Changing the program view layout (item cards stay as-is)
- Changing the props/emits interface of ServiceProgramPage (parent pages don't need changes)

## Decisions

**Decision 1: Single `ProgramItemForm.vue` component with mode prop**

The component accepts a `mode` prop: `'add-item' | 'edit-item' | 'add-sub-item' | 'edit-sub-item'`. This controls:
- Header text (dynamic: "Ajouter un élément" / "Modifier l'élément" / "Ajouter un sous-élément" / "Modifier le sous-élément")
- Submit button text ("Ajouter" / "Modifier")
- Type list (`programItemTypes` for items, `subItemTypes` for sub-items)
- Type required validation (required for items, optional for sub-items)
- Submit disabled condition (items: `!type || !title`, sub-items: `!title`)

The form emits `submit(data)` and `cancel()`. The parent handles the Firebase call (addItemToProgram, updateItemInProgram, addSubItemToItem, updateSubItemInItem) — keeping Firebase logic in the composable, not the form component.

Rationale: The form component handles UI/UX only. Business logic stays in the composable. This makes the form reusable and testable.

**Decision 2: `useProgramItems` composable for CRUD + state**

Extract into `src/composables/useProgramItems.ts`:
- `addItem()`, `updateItem()`, `deleteItem()`
- `addSubItem()`, `updateSubItem()`, `deleteSubItem()`
- `handleItemReorder()`, `handleSubItemReorder()`
- `quickUnlinkResource()`
- Form state refs (single `formData` ref instead of 3 separate refs)
- Modal visibility refs (single `showFormModal` + `formMode` instead of 3 booleans)
- `showAddItemModal()`, `showEditItemModal(item)`, `showAddSubItemModal(parentId)`, `showEditSubItemModal(parentId, subItem)` — these set the mode and populate the form

The composable takes `program`, `linkedResources`, and `user` as parameters (injected from the page).

Rationale: The composable owns the state and logic. ServiceProgramPage becomes a thin orchestrator.

**Decision 3: Form field layout — promote participants and duration**

New form layout (top to bottom):
1. Type button grid
2. Title with autocomplete
3. Resource link section
4. Scripture (if Lecture biblique / Prédication)
5. Participants (with ParticipantSelector)
6. Duration (minutes input)
7. Options avancées accordion:
   - Subtitle
   - Notes
   - Scripture (if NOT Lecture/Prédication, for sub-items only)

Rationale: Participants and duration are core data for a worship service. Burying them behind "Options avancées" adds unnecessary friction.

**Decision 4: Normalize scripture handling**

- All modes use `v-html` with `formatScriptureWithSuperscript()` for scripture preview (currently only items do this, sub-items use plain text)
- All modes show `scriptureVersion` in the preview header
- Default `scriptureVersion` is `'LSG'` everywhere (currently items default to `''`)
- All submit handlers send `null` for empty scripture fields (currently only edit-sub-item does this, meaning you can never clear scripture from items or newly-added sub-items)
- Single `handleFetchScripture(formRef)` function parameterized by form ref, instead of 3 copies

**Decision 5: Title autocomplete as internal form concern**

The title autocomplete state (suggestions, showSuggestions, input/blur/select handlers) moves into `ProgramItemForm.vue` as internal state. The form receives `allResources` and `linkedResources` as props. The `getSmartSuggestions` utility is called inside the form component.

This eliminates 9 duplicated functions and 3 duplicated computeds from ServiceProgramPage.

## Risks / Trade-offs

- [Risk] Large refactor touching a 7,180-line file → Mitigation: The extraction is mechanical — move template blocks into component, move functions into composable, wire with props/emits. No logic changes except the normalization fixes.
- [Risk] Regression in form behavior → Mitigation: The unified form matches the existing item form behavior (the most complete of the three). Sub-item forms gain consistency, not lose features.
- [Trade-off] `ProgramItemForm` has many props → Accepted: better than maintaining 3 separate forms. The props are well-typed and the component is focused on one concern.
- [Trade-off] `useProgramItems` composable will be large (~400-500 lines) → Accepted: it's cohesive (all CRUD for one entity type) and much smaller than what it replaces in ServiceProgramPage.
