## ADDED Requirements

### Requirement: Program items SHALL support grouping via group headers
The system SHALL support grouping program items under named group headers. A group is a `ProgramItem` with `isGroup: true`. Items belonging to a group SHALL have a `groupId` field referencing the group item's ID. Group headers and regular items SHALL coexist in the same flat `items[]` array, ordered by the `order` field.

#### Scenario: Creating a group
- **WHEN** admin creates a group via the add zone or InlineAddBar
- **THEN** a new item with `isGroup: true` SHALL be inserted at the specified position
- **AND** the group title SHALL activate inline editing

#### Scenario: Group header display
- **WHEN** a program contains an item with `isGroup: true`
- **THEN** it SHALL render as a visually distinct header row (bold title, background color) spanning full width

#### Scenario: Items within a group
- **WHEN** items have a `groupId` matching a group item's ID
- **THEN** they SHALL render visually indented under that group header

### Requirement: Groups SHALL be collapsible in both view and edit mode
Groups SHALL be collapsible by tapping the group header. The default state SHALL be expanded. Collapsed groups SHALL hide their child items and show only the group header with an expand indicator.

#### Scenario: Collapsing a group
- **WHEN** user taps the collapse toggle on an expanded group header
- **THEN** all child items (items with matching `groupId`) SHALL be hidden
- **AND** the group header SHALL show a collapsed indicator (chevron right)

#### Scenario: Expanding a group
- **WHEN** user taps the expand toggle on a collapsed group header
- **THEN** all child items SHALL become visible
- **AND** the group header SHALL show an expanded indicator (chevron down)

#### Scenario: Default group state
- **WHEN** a program is loaded
- **THEN** all groups SHALL be expanded by default

### Requirement: Read-time migration SHALL promote legacy sub-items to grouped items
The system SHALL migrate legacy data on read without requiring a batch migration script. Legacy `subItems[]` arrays SHALL be promoted to top-level items within a group.

#### Scenario: Migrating sub-items
- **WHEN** a program is loaded containing an item with `subItems[]`
- **THEN** each sub-item SHALL be promoted to a top-level `ProgramItem` with `groupId` set to the parent item's ID
- **AND** the parent item SHALL have `isGroup: true` set
- **AND** promoted items SHALL have `order` values that place them sequentially after the parent
- **AND** the `subItems` array SHALL be removed from the parent

#### Scenario: Migrating Section-type items
- **WHEN** a program is loaded containing an item with `type === 'Section'`
- **THEN** the item SHALL have `isGroup: true` set
- **AND** items that were visually after the section (until the next section or end) SHALL NOT be auto-assigned to the group (only explicit sub-items are migrated)

#### Scenario: Migration is idempotent
- **WHEN** a program that has already been migrated is loaded again
- **THEN** no duplicate items SHALL be created
- **AND** the data SHALL remain unchanged

### Requirement: Group CRUD operations
The system SHALL support creating, renaming, and deleting groups.

#### Scenario: Renaming a group
- **WHEN** admin taps the group title in edit mode
- **THEN** the title SHALL become an editable input field
- **AND** changes SHALL save on blur

#### Scenario: Deleting a group
- **WHEN** admin deletes a group header
- **THEN** a confirmation alert SHALL be shown
- **AND** upon confirmation, the group header SHALL be removed
- **AND** child items SHALL become ungrouped (groupId removed), not deleted

### Requirement: Reordering SHALL work uniformly for groups and items
Groups and items SHALL be reorderable via the same drag handle mechanism. Dragging a group header SHALL move the header and all its child items together.

#### Scenario: Reordering a group header
- **WHEN** admin drags a group header to a new position
- **THEN** the group header and all its child items SHALL move together
- **AND** order values SHALL be recalculated for all affected items

#### Scenario: Moving an item into or out of a group
- **WHEN** admin drags an item to a position within a group's range
- **THEN** the item SHALL acquire the group's `groupId`
- **WHEN** admin drags a grouped item to a position outside any group
- **THEN** the item's `groupId` SHALL be removed
