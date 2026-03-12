## MODIFIED Requirements

### Requirement: Items expand in-place to reveal all editable fields
The system SHALL allow admin users to tap an expand chevron to expand a program item card in-place, revealing all editable fields without opening a popup or modal.

#### Scenario: Expanding an item
- **WHEN** admin taps the expand chevron on a collapsed item in edit mode
- **THEN** the item card expands in-place showing: title input, subtitle input, participant selector, duration stepper, resource link card, tucked scripture section, notes textarea, and delete button

#### Scenario: Collapsing an item
- **WHEN** admin taps the collapse chevron on an expanded item
- **THEN** the item card collapses back to its summary view (title, participant/duration chips)

#### Scenario: Single expand on mobile
- **WHEN** admin expands an item on a screen narrower than 768px and another item is already expanded
- **THEN** the previously expanded item SHALL auto-collapse

#### Scenario: Multiple expand on desktop
- **WHEN** admin expands an item on a screen 768px or wider
- **THEN** other expanded items SHALL remain expanded

### Requirement: Collapsed item shows summary with tappable chips
The system SHALL display collapsed items with: reorder handle, item number, title (tap to inline edit), participant chips, duration chip, and expand chevron.

#### Scenario: Collapsed item display
- **WHEN** an item is in collapsed state in edit mode
- **THEN** the item row shows reorder handle at start, item number, title text, participant avatars, duration badge, and expand chevron at end

#### Scenario: Inline title edit from collapsed state
- **WHEN** admin taps the title text on a collapsed item in edit mode
- **THEN** the title becomes an editable input field (existing behavior preserved)

### Requirement: Expanded card shows tucked section for scripture
The system SHALL display scripture input as a collapsible sub-section within the expanded card, hidden by default behind a toggle.

#### Scenario: Opening scripture section
- **WHEN** admin taps "Passage biblique" toggle in an expanded item
- **THEN** the section expands to show scripture reference input, fetch button, and scripture text preview

## REMOVED Requirements

### Requirement: Expanded card shows tucked sections for scripture and type change
**Reason**: Item types are removed from the model. Type change section is no longer needed.
**Migration**: Scripture tucked section is preserved as its own requirement above.

### Requirement: Sub-items use the same expand/collapse pattern
**Reason**: Sub-items are replaced by the group model. Items within groups are top-level items with their own expand/collapse behavior.
**Migration**: Use group collapsing for hierarchical views.
