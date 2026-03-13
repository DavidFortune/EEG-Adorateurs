## ADDED Requirements

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
