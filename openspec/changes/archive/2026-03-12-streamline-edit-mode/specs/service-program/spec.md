## MODIFIED Requirements

### Requirement: Item row layout in edit mode
Each item row in edit mode SHALL display: reorder drag handle (start slot), item number, tap-to-edit title, meta chips (duration, participant, resource title, scripture reference, notes indicator), and a 3-dot action menu button (end slot).

#### Scenario: Item with linked resource shows resource chip
- **WHEN** an item has a linked resource
- **THEN** the item row displays a chip with the resource title

#### Scenario: Item with scripture shows scripture chip
- **WHEN** an item has a scripture reference
- **THEN** the item row displays a chip with the scripture reference text

#### Scenario: Item with notes shows notes indicator
- **WHEN** an item has notes text
- **THEN** the item row displays a notes indicator icon

#### Scenario: Tapping duration chip opens duration popover
- **WHEN** user taps the duration chip on an item in edit mode
- **THEN** the DurationStepper popover opens (existing behavior preserved)

#### Scenario: Tapping participant chip opens participant popover
- **WHEN** user taps a participant chip on an item in edit mode
- **THEN** the ParticipantSelector popover opens (existing behavior preserved)

### Requirement: Item creation via quick-add buttons
In edit mode, three quick-add buttons SHALL be displayed at the bottom of the program list. The InlineAddBar component SHALL no longer be used.

#### Scenario: Quick-add buttons visible in edit mode only
- **WHEN** user is in edit mode
- **THEN** three buttons are visible: "+ Élément", "+ Groupe", "+ Section"
- **WHEN** user is not in edit mode
- **THEN** the quick-add buttons are not visible

### Requirement: Item editing via 3-dot action menu
Each item SHALL have a 3-dot menu button in edit mode providing contextual actions for resource, scripture, notes, and delete. The expandable card pattern SHALL NOT be used.

#### Scenario: 3-dot menu visible only in edit mode
- **WHEN** user is in edit mode
- **THEN** each item row shows a 3-dot menu button in the end slot
- **WHEN** user is not in edit mode
- **THEN** the 3-dot menu button is not visible

## REMOVED Requirements

### Requirement: Item editing via expandable card pattern
**Reason**: Replaced by inline editing + 3-dot action menu for a simpler, faster workflow.
**Migration**: Title editing is inline. All other fields accessible via 3-dot menu modals.

### Requirement: Item creation via InlineAddBar
**Reason**: Replaced by quick-add buttons (+ Élément, + Groupe, + Section).
**Migration**: Use quick-add buttons to create items, then 3-dot menu to link resources.
