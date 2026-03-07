## ADDED Requirements

### Requirement: Resource creation flows SHALL prevent duplicate submissions
All resource creation UI flows MUST disable the submit/create button while the creation operation is in progress. The button MUST remain disabled from the moment the user clicks it until the async operation completes (success or failure). The loading state MUST be reset in a `finally` block to guarantee cleanup.

#### Scenario: User double-clicks save on ResourceFormPage
- **WHEN** user clicks the save button on ResourceFormPage
- **THEN** the button SHALL be immediately disabled
- **AND** it SHALL remain disabled until the save operation completes or fails
- **AND** only one resource SHALL be created in Firestore

#### Scenario: User double-clicks create on ResourceBottomSheet
- **WHEN** user clicks "Creer et lier" on ResourceBottomSheet
- **THEN** the button SHALL be immediately disabled
- **AND** it SHALL remain disabled until the creation operation completes or fails
- **AND** only one resource SHALL be created in Firestore

#### Scenario: User double-clicks create on ResourceSelector
- **WHEN** user clicks "Creer et lier" on ResourceSelector
- **THEN** the button SHALL be immediately disabled (already implemented via `creatingResource` guard)
- **AND** only one resource SHALL be created in Firestore

#### Scenario: User double-clicks create on NaturalResourceSelector
- **WHEN** user clicks the create button on NaturalResourceSelector
- **THEN** the button SHALL be immediately disabled (already implemented via `creating` guard)
- **AND** only one resource SHALL be created in Firestore
