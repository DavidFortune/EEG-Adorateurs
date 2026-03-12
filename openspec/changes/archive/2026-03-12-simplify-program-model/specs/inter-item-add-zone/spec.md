## MODIFIED Requirements

### Requirement: Subtle add zone between items
The system SHALL render a thin, subtle "+" button between each program item in edit mode.

#### Scenario: Add zone visibility
- **WHEN** program is in edit mode (admin)
- **THEN** a subtle "+" indicator is shown between each item pair

#### Scenario: Tapping the add zone
- **WHEN** admin taps the "+" zone between two items
- **THEN** it expands to show two options: "Element" (add a new program item) and "Groupe" (add a group header)

#### Scenario: Adding an item via the add zone
- **WHEN** admin taps "Element" in the expanded add zone
- **THEN** a new item is inserted at that position and the InlineAddBar pattern is used for entering the item details

#### Scenario: Adding a group via the add zone
- **WHEN** admin taps "Groupe" in the expanded add zone
- **THEN** a new group header item (`isGroup: true`) is inserted at that position
- **AND** inline title editing SHALL activate on the new group header

#### Scenario: Add zone collapses after action
- **WHEN** admin selects an action from the add zone or taps elsewhere
- **THEN** the add zone collapses back to its subtle "+" state
