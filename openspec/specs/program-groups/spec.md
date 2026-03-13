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

### Requirement: Section items as visual dividers
Program items with `isSection: true` SHALL render as visual divider rows — a colored banner with a centered title. Sections are distinct from groups: sections are non-collapsible visual separators, groups are collapsible containers for child items.

#### Scenario: Section renders as colored banner
- **WHEN** an item has `isSection: true`
- **THEN** it renders as a full-width colored banner with centered bold title
- **THEN** it does not have an item number
- **THEN** it does not have duration, participant, or resource chips

#### Scenario: Section title is inline-editable in edit mode
- **WHEN** user taps a section title in edit mode
- **THEN** inline title editing activates

#### Scenario: Create section via quick-add button
- **WHEN** user taps "+ Section" quick-add button
- **THEN** a new item is created with `isSection: true` and title "Nouvelle section"

#### Scenario: Section items are not grouped
- **WHEN** a section item exists in the program
- **THEN** it does not have a `groupId` and is not treated as a group child

### Requirement: Add item to group from group header
In edit mode, each group header SHALL display an add button that creates a new item directly inside the group. The new item is positioned after the last existing child of the group (or right after the header if no children exist).

#### Scenario: Add item to group via header button
- **WHEN** user taps the add button on a group header in edit mode
- **THEN** a new item is created with `groupId` set to the group's ID
- **THEN** the item's order places it after the last child of the group
- **THEN** inline title editing activates on the new item
- **THEN** the group expands if it was collapsed

#### Scenario: Add button only visible in edit mode
- **WHEN** the program is not in edit mode
- **THEN** the add button is not visible on group headers

### Requirement: Group content modal
Each group header SHALL provide access to a modal that displays the aggregated content (lyrics, scripture, notes) from all child items in the group.

#### Scenario: Open group content modal
- **WHEN** user taps the content view button on a group header
- **THEN** a modal opens showing a scrollable list of child items with their lyrics, scripture text, and notes

#### Scenario: Child item with lyrics
- **WHEN** a child item has a linked resource with lyrics content
- **THEN** the modal displays the item title and the lyrics text

#### Scenario: Child item with scripture
- **WHEN** a child item has scripture text
- **THEN** the modal displays the scripture reference, version, and formatted text

#### Scenario: Child item with notes
- **WHEN** a child item has notes
- **THEN** the modal displays the notes text

#### Scenario: Content button visibility
- **WHEN** a group has child items with content (lyrics, scripture, or notes)
- **THEN** the content view button is visible on the group header
- **WHEN** a group has no children or no children with content
- **THEN** the content view button is not visible
