## MODIFIED Requirements

### Requirement: InlineAddBar SHALL enable rapid item creation without a modal
The InlineAddBar component SHALL be a reusable inline widget for creating program items. It SHALL display a title input field. When the user presses Enter (or taps a submit button) with a non-empty title, the item SHALL be created immediately and added to the program. The input SHALL clear after creation and retain focus for the next entry.

The component SHALL only be visible to admin users.

#### Scenario: Admin creates an item via inline add bar
- **WHEN** an admin types "Grand Dieu nous te benissons" and presses Enter
- **THEN** a new program item with that title SHALL be created and appear in the program list
- **AND** the title input SHALL clear and retain focus

#### Scenario: Admin creates multiple items consecutively
- **WHEN** an admin adds "Item A" via Enter, then types "Item B" and presses Enter again
- **THEN** both items SHALL be created
- **AND** the input SHALL retain focus after each creation

#### Scenario: Enter with empty title does nothing
- **WHEN** an admin presses Enter with an empty or whitespace-only title
- **THEN** no item SHALL be created
- **AND** no error SHALL be shown

### Requirement: InlineAddBar SHALL provide resource autocomplete
The InlineAddBar title input SHALL trigger resource autocomplete suggestions for all items. After the user types at least 2 characters, `getSmartSuggestions` SHALL be called with a 300ms debounce. Suggestions SHALL appear in a dropdown below the input.

When the user selects a suggestion, the item SHALL be created with the suggestion's title and `resourceId` auto-linked.

A sticky "Creer [title] comme ressource" option SHALL always appear as the last item in the suggestions dropdown when the title has 2+ characters. When tapped, it SHALL:
1. Create the item with the current title (same as pressing Enter)
2. Open the existing `ResourceSelector` modal in create mode with the title pre-filled
3. When the resource is created in the modal, auto-link it to the just-created item immediately

#### Scenario: Autocomplete appears for all items
- **WHEN** an admin types "Kache" in the add bar
- **THEN** matching resources SHALL appear in a dropdown after 300ms

#### Scenario: Selecting a suggestion creates item with linked resource
- **WHEN** an admin taps a resource suggestion "Kache mwen anba zel ou"
- **THEN** an item SHALL be created with that title
- **AND** the item's `resourceId` SHALL be set to the selected resource's ID

#### Scenario: Sticky create auto-links resource without confirmation
- **WHEN** an admin taps "Creer [title] comme ressource" and completes the resource form
- **THEN** the resource SHALL be created and immediately linked to the item

## REMOVED Requirements

### Requirement: InlineAddBar SHALL support scripture reference for Predication type
**Reason**: Item types are removed. Scripture is managed via the expanded card's tucked scripture section, not during creation.
**Migration**: Use the expanded card's scripture section after creating the item.

### Requirement: Type selector in InlineAddBar
**Reason**: Item types are removed from the model. No type selection needed during creation.
**Migration**: Items are created without a type. All items are generic.
