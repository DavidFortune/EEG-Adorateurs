## ADDED Requirements

### Requirement: Items expand in-place to reveal all editable fields
The system SHALL allow admin users to tap an expand chevron (or the item row) to expand a program item card in-place, revealing all editable fields without opening a popup or modal.

#### Scenario: Expanding an item
- **WHEN** admin taps the expand chevron on a collapsed item in edit mode
- **THEN** the item card expands in-place showing: title input, subtitle input, participant selector, duration stepper, resource link card, tucked scripture section, tucked type change section, notes textarea, add sub-item button, and delete button

#### Scenario: Collapsing an item
- **WHEN** admin taps the collapse chevron on an expanded item
- **THEN** the item card collapses back to its summary view (type icon, title, participant/duration chips)

#### Scenario: Single expand on mobile
- **WHEN** admin expands an item on a screen narrower than 768px and another item is already expanded
- **THEN** the previously expanded item SHALL auto-collapse

#### Scenario: Multiple expand on desktop
- **WHEN** admin expands an item on a screen 768px or wider
- **THEN** other expanded items SHALL remain expanded

### Requirement: Collapsed item shows summary with tappable chips
The system SHALL display collapsed items with: reorder handle, item number, type icon, title (tap to inline edit), participant chips, duration chip, and expand chevron.

#### Scenario: Collapsed item display
- **WHEN** an item is in collapsed state in edit mode
- **THEN** the item row shows reorder handle at start, item number, type icon, title text, participant avatars, duration badge, and expand chevron at end

#### Scenario: Inline title edit from collapsed state
- **WHEN** admin taps the title text on a collapsed item in edit mode
- **THEN** the title becomes an editable input field (existing behavior preserved)

### Requirement: Expanded card shows tucked sections for scripture and type change
The system SHALL display scripture input and type selector as collapsible sub-sections within the expanded card, hidden by default behind a toggle.

#### Scenario: Opening scripture section
- **WHEN** admin taps "Passage biblique" toggle in an expanded item
- **THEN** the section expands to show scripture reference input, fetch button, and scripture text preview

#### Scenario: Opening type change section
- **WHEN** admin taps "Changer le type" toggle in an expanded item
- **THEN** the section expands to show a grid of type buttons (Chant, Priere, Lecture, Predication, etc.)

#### Scenario: Type change section shows current type
- **WHEN** the type change toggle is collapsed
- **THEN** it SHALL display the current type name and icon (e.g., "Changer le type (Chant)")

### Requirement: All fields save on blur or change
The system SHALL save field changes immediately on blur (text fields) or on selection (chips, selectors, type buttons), using existing `inlineUpdateField` patterns.

#### Scenario: Saving a field change
- **WHEN** admin edits a field in the expanded card and blurs the input or selects a value
- **THEN** the change is saved to Firestore immediately without requiring a save button

### Requirement: Delete action in expanded card
The system SHALL show a delete button at the bottom of the expanded card that triggers a confirmation alert before deleting the item.

#### Scenario: Deleting an item from expanded card
- **WHEN** admin taps the delete button in the expanded card
- **THEN** a confirmation alert is shown, and upon confirmation the item is deleted

### Requirement: Sub-items use the same expand/collapse pattern
Sub-items within an expanded parent item SHALL follow the same expand/collapse card pattern as parent items, with the same set of editable fields.

#### Scenario: Expanding a sub-item
- **WHEN** admin taps the expand chevron on a sub-item
- **THEN** the sub-item expands in-place showing the same field layout as parent items (title, subtitle, participants, duration, resource, scripture, type, notes, delete)

#### Scenario: Sub-item add bar visible with zero sub-items
- **WHEN** a parent item is edit-expanded and can have sub-items
- **THEN** the sub-items container and InlineAddBar SHALL be visible even if the item currently has zero sub-items, allowing the first sub-item to be added

### Requirement: Auto-collapse during reorder
The system SHALL auto-collapse all expanded items when a reorder drag operation begins.

#### Scenario: Starting a reorder
- **WHEN** admin begins dragging an item via the reorder handle
- **THEN** all expanded items collapse to their summary view

### Requirement: Desktop 2-column layout for expanded cards
On screens 768px or wider, the expanded card content SHALL use a 2-column CSS grid layout to reduce card height and improve scannability.

#### Scenario: Expanded card on desktop
- **WHEN** an item is expanded on a screen 768px or wider
- **THEN** the editable fields are arranged in a 2-column grid layout
