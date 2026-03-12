## MODIFIED Requirements

### Requirement: Quick-add buttons replace InlineAddBar
In edit mode, the bottom of the program list SHALL display three quick-add buttons instead of the InlineAddBar text input. The buttons SHALL be: "+ Élément", "+ Groupe", "+ Section". Each button SHALL create the corresponding row immediately with a default title and activate inline title editing.

#### Scenario: Add element via quick-add button
- **WHEN** user taps "+ Élément" button
- **THEN** a new item is created at the end of the program with title "Nouvel élément"
- **THEN** inline title editing is activated on the new item

#### Scenario: Add group via quick-add button
- **WHEN** user taps "+ Groupe" button
- **THEN** a new group header is created at the end of the program with title "Nouveau groupe"
- **THEN** inline title editing is activated on the new group

#### Scenario: Add section via quick-add button
- **WHEN** user taps "+ Section" button
- **THEN** a new section is created at the end of the program with title "Nouvelle section"
- **THEN** inline title editing is activated on the new section

## REMOVED Requirements

### Requirement: Title input with resource autocomplete
**Reason**: Replaced by quick-add buttons. Resources are now linked post-creation via the 3-dot action menu.
**Migration**: Use quick-add buttons to create items, then use 3-dot menu → "+ Ressource" to link resources.
