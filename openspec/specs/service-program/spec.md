## MODIFIED Requirements

### Requirement: Program items SHALL support inline creation and editing
The service program SHALL allow creating program items, group headers, and sections. Each program item MUST support: assigned participants, duration, subtitle, notes, linked resources, and bible reference. Group headers MUST support: title and collapsible child items.

Program item creation SHALL use quick-add buttons displayed at the bottom of the program items list. The quick-add buttons SHALL only be visible when the user is in edit mode (`isEditing`). The buttons SHALL allow admins to create elements, groups, or sections with a single tap.

Program item editing SHALL use inline editing combined with a 3-dot action menu. Tapping the title activates inline editing. The 3-dot menu provides access to resource, scripture, notes, and delete actions via modals.

Scripture text SHALL be auto-fetched when the scripture reference field is filled and the fetch button is tapped.

#### Scenario: Admin in edit mode creates an item via quick-add button
- **WHEN** an admin in edit mode taps "+ Element"
- **THEN** a new item SHALL be created with a default title and inline title editing SHALL activate

#### Scenario: Admin in read-only mode cannot create items
- **WHEN** an admin views a program in read-only mode
- **THEN** the quick-add buttons SHALL NOT be visible

#### Scenario: Admin creates a group via quick-add button
- **WHEN** an admin taps "+ Groupe"
- **THEN** a new group header SHALL be inserted at the end of the program
- **AND** inline title editing SHALL activate on the new group header

#### Scenario: Touch targets meet minimum size on mobile in edit mode
- **WHEN** the ServiceProgramPage is viewed on a screen narrower than 768px in edit mode
- **THEN** all interactive elements SHALL have tappable areas of at least 44x44px

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
- **THEN** three buttons are visible: "+ Element", "+ Groupe", "+ Section"
- **WHEN** user is not in edit mode
- **THEN** the quick-add buttons are not visible

### Requirement: Item editing via 3-dot action menu
Each item SHALL have a 3-dot menu button in edit mode providing contextual actions for resource, scripture, notes, and delete. The expandable card pattern SHALL NOT be used.

#### Scenario: 3-dot menu visible only in edit mode
- **WHEN** user is in edit mode
- **THEN** each item row shows a 3-dot menu button in the end slot
- **WHEN** user is not in edit mode
- **THEN** the 3-dot menu button is not visible

### Requirement: Reorder mode SHALL be available only in edit mode
The reorder drag handles SHALL only be visible when the user is in edit mode (`isEditing`). In read-only mode, drag handles SHALL be hidden. When visible, drag handles SHALL be in `slot="start"`. All editing interactions (inline edits, quick-add buttons) SHALL only be available in edit mode.

#### Scenario: Admin in edit mode can reorder items
- **WHEN** an admin is in edit mode
- **THEN** reorder drag handles SHALL be visible on each item

#### Scenario: Admin in read-only mode cannot reorder items
- **WHEN** an admin views a program in read-only mode
- **THEN** reorder drag handles SHALL NOT be visible
