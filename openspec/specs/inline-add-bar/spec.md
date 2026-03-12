### Requirement: Quick-add buttons for item creation
In edit mode, the bottom of the program list SHALL display three quick-add buttons instead of a text input. The buttons SHALL be: "+ Element", "+ Groupe", "+ Section". Each button SHALL create the corresponding row immediately with a default title and activate inline title editing.

The component SHALL only be visible to admin users.

#### Scenario: Add element via quick-add button
- **WHEN** user taps "+ Element" button
- **THEN** a new item is created at the end of the program with title "Nouvel element"
- **THEN** inline title editing is activated on the new item

#### Scenario: Add group via quick-add button
- **WHEN** user taps "+ Groupe" button
- **THEN** a new group header is created at the end of the program with title "Nouveau groupe"
- **THEN** inline title editing is activated on the new group

#### Scenario: Add section via quick-add button
- **WHEN** user taps "+ Section" button
- **THEN** a new section is created at the end of the program with title "Nouvelle section"
- **THEN** inline title editing is activated on the new section
