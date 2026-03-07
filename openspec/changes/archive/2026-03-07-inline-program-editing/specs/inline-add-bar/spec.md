## ADDED Requirements

### Requirement: InlineAddBar SHALL enable rapid item creation without a modal
The InlineAddBar component SHALL be a reusable inline widget for creating program items and sub-items. It SHALL display a row of primary type icons (Titre, Chant, Priere, Lecture biblique, Predication) with Titre selected by default. When the user selects a type and presses Enter (or taps a submit button) with a non-empty title, the item SHALL be created immediately and added to the program. The input SHALL clear after creation and retain focus for the next entry. The selected type SHALL persist between consecutive adds.

The component SHALL accept a `parentItemId` prop. When null, it creates top-level items. When set to an item ID, it creates sub-items under that parent. A label SHALL indicate the context: "Ajouter un element" for top-level, "Ajouter un sous-element" for sub-items.

The component SHALL only be visible to admin users.

#### Scenario: Admin creates a song item via inline add bar
- **WHEN** an admin taps the song type icon and types "Grand Dieu nous te benissons" then presses Enter
- **THEN** a new program item of type "Chant" with title "Grand Dieu nous te benissons" SHALL be created and appear in the program list
- **AND** the title input SHALL clear and retain focus
- **AND** the song type SHALL remain selected

#### Scenario: Admin creates multiple items of the same type
- **WHEN** an admin selects the song type, adds "Song A" via Enter, then types "Song B" and presses Enter again
- **THEN** both items SHALL be created as type "Chant"
- **AND** the song type SHALL still be selected after both additions

#### Scenario: Enter with empty title does nothing
- **WHEN** an admin presses Enter with an empty or whitespace-only title
- **THEN** no item SHALL be created
- **AND** no error SHALL be shown

#### Scenario: Sub-item add bar appears inside expanded item
- **WHEN** an admin expands a program item of type Titre (the only type that supports sub-items)
- **THEN** an InlineAddBar SHALL appear at the bottom of the sub-items list with `parentItemId` set to the parent item's ID

#### Scenario: Admin creates a sub-item via inline add bar
- **WHEN** an admin types a title in the sub-item add bar and presses Enter
- **THEN** a new sub-item SHALL be created under the parent item
- **AND** the parent item SHALL remain expanded
- **AND** the input SHALL clear and retain focus

---

### Requirement: InlineAddBar SHALL provide resource autocomplete for songs only
The InlineAddBar title input SHALL trigger resource autocomplete suggestions ONLY when the selected type is Chant (song). After the user types at least 2 characters, `getSmartSuggestions` SHALL be called with a 300ms debounce. Suggestions SHALL appear in a dropdown below the input.

When the user selects a suggestion, the item SHALL be created with the suggestion's title and `resourceId` auto-linked.

A sticky "Creer [title] comme ressource" option SHALL always appear as the last item in the suggestions dropdown when the title has 2+ characters. When tapped, it SHALL:
1. Create the item with the current title (same as pressing Enter)
2. Open the existing `ResourceSelector` modal in create mode with the title pre-filled
3. When the resource is created in the modal, auto-link it to the just-created item immediately (no confirmation click needed)

#### Scenario: Autocomplete only appears for song type
- **WHEN** an admin has the Chant type selected and types "Kache" in the add bar
- **THEN** matching resources SHALL appear in a dropdown after 300ms
- **WHEN** an admin has any other type selected and types text
- **THEN** no autocomplete dropdown SHALL appear

#### Scenario: Selecting a suggestion creates item with linked resource
- **WHEN** an admin taps a resource suggestion "Kache mwen anba zel ou"
- **THEN** an item SHALL be created with the title "Kache mwen anba zel ou"
- **AND** the item's `resourceId` SHALL be set to the selected resource's ID

#### Scenario: Sticky create auto-links resource without confirmation
- **WHEN** an admin taps "Creer [title] comme ressource" and completes the resource form
- **THEN** the resource SHALL be created and immediately linked to the item
- **AND** the ResourceSelector SHALL close automatically (no confirm button needed)

---

### Requirement: InlineAddBar SHALL support scripture reference for Predication type
When the selected type is Predication (sermon), a second input field SHALL appear below the title input with a bible icon and placeholder "Passage biblique (ex: Jean 3:16)...". Pressing Enter on the title field when the scripture field is empty SHALL focus the scripture field instead of submitting. Pressing Enter on the scripture field (or on the title field when scripture is filled) SHALL submit the item with the scripture reference included.

The parent page SHALL auto-fetch the scripture text when a Predication item is created with a scripture reference.

#### Scenario: Sermon with scripture reference
- **WHEN** an admin selects Predication type, types a title, and presses Enter
- **THEN** focus SHALL move to the scripture reference field
- **WHEN** the admin types "Jean 3:16" and presses Enter
- **THEN** the item SHALL be created with the title and scripture reference
- **AND** the scripture text SHALL be auto-fetched from the bible service
