## ADDED Requirements

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
