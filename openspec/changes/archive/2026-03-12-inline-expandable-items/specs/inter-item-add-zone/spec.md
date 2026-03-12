## ADDED Requirements

### Requirement: Subtle add zone between items
The system SHALL render a thin, subtle "+" button between each program item in edit mode. This replaces the "add section after" action from the 3-dot menu.

#### Scenario: Add zone visibility
- **WHEN** program is in edit mode (admin)
- **THEN** a subtle "+" indicator is shown between each item pair

#### Scenario: Tapping the add zone
- **WHEN** admin taps the "+" zone between two items
- **THEN** it expands to show two options: "Element" (add a new program item) and "Section" (add a section divider)

#### Scenario: Adding an item via the add zone
- **WHEN** admin taps "Element" in the expanded add zone
- **THEN** a new item is inserted at that position and the InlineAddBar pattern is used for entering the item details

#### Scenario: Adding a section via the add zone
- **WHEN** admin taps "Section" in the expanded add zone
- **THEN** a new section divider is inserted at that position between the two items, with order values adjusted accordingly

#### Scenario: Add zone collapses after action
- **WHEN** admin selects an action from the add zone or taps elsewhere
- **THEN** the add zone collapses back to its subtle "+" state
