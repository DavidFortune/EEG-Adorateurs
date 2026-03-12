## ADDED Requirements

### Requirement: 3-dot action menu on program items
Each program item row SHALL display a 3-dot menu button (`ellipsisVerticalOutline` icon) in the end slot, visible only in edit mode. Tapping the button SHALL open an `ion-popover` with contextual actions.

#### Scenario: Menu on regular item without linked data
- **WHEN** user taps 3-dot menu on an item with no resource, no scripture, and no notes
- **THEN** popover shows: "+ Ressource", "+ Passage biblique", "+ Note", "Supprimer"

#### Scenario: Menu on regular item with all linked data
- **WHEN** user taps 3-dot menu on an item that has a linked resource, scripture text, and notes
- **THEN** popover shows: "Modifier la ressource", "Modifier le passage", "Modifier la note", "Supprimer"

#### Scenario: Menu on group header
- **WHEN** user taps 3-dot menu on a group header item
- **THEN** popover shows only: "Supprimer"

#### Scenario: Menu on section
- **WHEN** user taps 3-dot menu on a section item
- **THEN** popover shows only: "Supprimer"

### Requirement: Resource action opens ResourceSelector modal
Selecting the resource action SHALL open the existing ResourceSelector component in modal mode. When a resource is selected, it SHALL be linked to the item. The modal SHALL include a "Dissocier la ressource" button when a resource is already linked.

#### Scenario: Link resource via menu
- **WHEN** user selects "+ Ressource" from the 3-dot menu
- **THEN** ResourceSelector modal opens
- **WHEN** user selects a resource
- **THEN** resource is linked to the item and modal closes

#### Scenario: Unlink resource from edit modal
- **WHEN** user opens "Modifier la ressource" and taps "Dissocier la ressource"
- **THEN** resource is removed from the item

### Requirement: Scripture action opens scripture edit modal
Selecting the scripture action SHALL open a modal with a scripture reference input field, a fetch button, and the fetched text display. The modal SHALL include a "Supprimer le passage" button when scripture text exists.

#### Scenario: Add scripture via menu
- **WHEN** user selects "+ Passage biblique" from the 3-dot menu
- **THEN** scripture modal opens with empty reference field
- **WHEN** user enters a reference and taps fetch
- **THEN** scripture text is fetched and displayed
- **WHEN** user confirms
- **THEN** scripture reference, text, and version are saved to the item

#### Scenario: Edit existing scripture
- **WHEN** user selects "Modifier le passage" from the 3-dot menu
- **THEN** scripture modal opens pre-filled with current reference and text

#### Scenario: Remove scripture
- **WHEN** user taps "Supprimer le passage" in the scripture modal
- **THEN** scripture reference, text, and version are removed from the item

### Requirement: Notes action opens notes edit modal
Selecting the notes action SHALL open a modal with a textarea for notes. The modal SHALL include a "Supprimer la note" button when notes exist.

#### Scenario: Add notes via menu
- **WHEN** user selects "+ Note" from the 3-dot menu
- **THEN** notes modal opens with empty textarea
- **WHEN** user types notes and confirms
- **THEN** notes are saved to the item

#### Scenario: Edit existing notes
- **WHEN** user selects "Modifier la note" from the 3-dot menu
- **THEN** notes modal opens pre-filled with current notes text

#### Scenario: Remove notes
- **WHEN** user taps "Supprimer la note" in the notes modal
- **THEN** notes are removed from the item

### Requirement: Delete action with confirmation
Selecting "Supprimer" SHALL show a confirmation alert before deleting the item.

#### Scenario: Delete item via menu
- **WHEN** user selects "Supprimer" from the 3-dot menu
- **THEN** confirmation alert appears
- **WHEN** user confirms
- **THEN** item is deleted from the program
