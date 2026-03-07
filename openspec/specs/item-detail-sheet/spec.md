## ADDED Requirements

### Requirement: ItemDetailSheet SHALL provide a bottom sheet for enriching items and sub-items
The ItemDetailSheet component SHALL be an `ion-modal` configured as a bottom sheet (using `breakpoints` and `initialBreakpoint` props) that allows admins to view and edit all fields of an existing program item or sub-item. The sheet SHALL be dismissible by swiping down or tapping outside.

The sheet SHALL display the item's title as a header and provide the following editable fields:
- **Type**: Selectable type grid with immediate save on selection
- **Subtitle**: Text input with save on blur
- **Notes**: Multiline text area with save on blur
- **Resource**: Display linked resource card (with "Changer" and "Delier" actions) or a "Lier une ressource" button that opens the existing `ResourceSelector` modal
- **Scripture**: Scripture reference input with "Chercher les versets" button, scripture preview with formatted rendering
- **Participants**: ParticipantSelector component with save on change
- **Duration**: DurationStepper component with save on change

Each field SHALL save independently on blur or on change (for selectors), calling the appropriate `inlineUpdateField` or `inlineUpdateSubItemField` function. No "Submit" button is needed -- all changes are persisted as they are made.

The sheet SHALL also provide:
- An "Ajouter un sous-element" shortcut (ONLY for items of type Titre, not for other types or sub-items) that dismisses the sheet, expands the item, and focuses the sub-item add bar
- A "Supprimer" action (red, at the bottom) with confirmation dialog

The component SHALL accept either an item ID or a parent item ID + sub-item ID to determine which entity is being edited.

#### Scenario: Admin opens bottom sheet from 3-dot menu
- **WHEN** an admin taps the 3-dot menu on a program item and selects "Modifier"
- **THEN** the ItemDetailSheet SHALL open as a bottom sheet showing all fields for that item
- **AND** fields SHALL be pre-populated with the item's current values

#### Scenario: Admin edits subtitle via bottom sheet
- **WHEN** an admin types a new subtitle in the ItemDetailSheet and blurs the field
- **THEN** the subtitle SHALL be saved to Firestore immediately
- **AND** the item in the program list SHALL update to reflect the change

#### Scenario: Admin changes item type via bottom sheet
- **WHEN** an admin taps a different type in the type grid
- **THEN** the item's type SHALL be updated in Firestore immediately

#### Scenario: Admin links a resource via bottom sheet
- **WHEN** an admin taps "Lier une ressource" in the bottom sheet
- **THEN** the `ResourceSelector` modal SHALL open in browse mode
- **AND** when a resource is selected, the item's `resourceId` SHALL be updated

#### Scenario: Admin unlinks a resource via bottom sheet
- **WHEN** an admin taps "Delier" on the linked resource card in the bottom sheet
- **THEN** the item's `resourceId` SHALL be removed from Firestore

#### Scenario: Admin deletes item via bottom sheet
- **WHEN** an admin taps "Supprimer" in the bottom sheet
- **THEN** a confirmation dialog SHALL appear
- **AND** upon confirmation, the item SHALL be deleted from the program
- **AND** the bottom sheet SHALL dismiss

#### Scenario: Admin opens bottom sheet for a sub-item
- **WHEN** an admin taps the 3-dot menu on a sub-item and selects "Modifier"
- **THEN** the ItemDetailSheet SHALL open showing all fields for the sub-item
- **AND** the "Ajouter un sous-element" shortcut SHALL NOT appear

#### Scenario: Add-sub-item shortcut only for Titre type
- **WHEN** an admin opens the bottom sheet for an item of type Titre
- **THEN** the "Ajouter un sous-element" shortcut SHALL appear
- **WHEN** an admin opens the bottom sheet for an item of any other type
- **THEN** the "Ajouter un sous-element" shortcut SHALL NOT appear

#### Scenario: Bottom sheet reflects real-time updates from other users
- **WHEN** the bottom sheet is open and another user changes the same item
- **THEN** the fields in the bottom sheet SHALL update to reflect the other user's changes via the `onSnapshot` subscription
