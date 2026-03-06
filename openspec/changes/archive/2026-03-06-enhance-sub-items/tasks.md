## 1. Data Model

- [x] 1.1 Extend `ProgramSubItem` interface in `src/types/program.ts` with optional `type?: ProgramItemType`, `subtitle?: string`, `participants?: ProgramParticipant[]`, `duration?: number` fields

## 2. Sub-Item Form State

- [x] 2.1 Add `type`, `subtitle`, `participants`, `duration` fields to `addSubItemForm` and `editSubItemForm` refs
- [x] 2.2 Add `subItemTypes` computed that returns `ProgramItemType` values excluding `SECTION` and `TITLE`
- [x] 2.3 Add sub-item title autocomplete state: `showAddSubItemTitleSuggestions`, `showEditSubItemTitleSuggestions`, and computed suggestions using the same resource matching logic as items
- [x] 2.4 Add sub-item title input handlers: `handleAddSubItemTitleInput`, `handleAddSubItemTitleBlur`, `handleEditSubItemTitleInput`, `handleEditSubItemTitleBlur`, and `selectAddSubItemTitleSuggestion`, `selectEditSubItemTitleSuggestion`

## 3. Restructure Add Sub-Item Modal

- [x] 3.1 Add type selection button grid (using `subItemTypes`) above the title field
- [x] 3.2 Wrap title input in `title-autocomplete-wrapper` with suggestions dropdown and auto-link behavior
- [x] 3.3 Group notes, scripture, subtitle, participants, and duration under "Options avancées" accordion
- [x] 3.4 Wire the add sub-item form submission to include new fields (type, subtitle, participants, duration)

## 4. Restructure Edit Sub-Item Modal

- [x] 4.1 Add type selection button grid (using `subItemTypes`) with current type pre-selected
- [x] 4.2 Wrap title input in `title-autocomplete-wrapper` with suggestions dropdown and auto-link behavior
- [x] 4.3 Group notes, scripture, subtitle, participants, and duration under "Options avancées" accordion
- [x] 4.4 Wire the edit sub-item form to populate and save new fields

## 5. Update Sub-Item Display in Program View

- [x] 5.1 Show type icon next to sub-item title when `subItem.type` is set
- [x] 5.2 Show duration next to sub-item content when `subItem.duration` is set
- [x] 5.3 Show participant names/avatars next to sub-item content when `subItem.participants` is set

## 6. Verification

- [x] 6.1 Verify type selection works in add/edit sub-item modals (excludes Section and Titre) *(manual)*
- [x] 6.2 Verify title autocomplete suggests resources and auto-links in sub-item modals *(manual)*
- [x] 6.3 Verify new fields (subtitle, participants, duration) save and display correctly *(manual)*
- [x] 6.4 Verify existing sub-items without new fields display without errors *(manual)*
- [x] 6.5 Verify sub-item type icon, duration, and participants show in program view *(manual)*
