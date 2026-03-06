## MODIFIED Requirements

### Requirement: Program items SHALL support multiple types with configurable details
The service program SHALL allow creating items of the following types: chant (song), priere (prayer), lecture biblique (bible reading), predication (sermon), titre de section (section title), annonce (announcement), offrande (offering), benediction (blessing), and additional custom types. Each program item MUST support the following configurable details: assigned participant, duration, lyrics/notes content, sub-items, linked resources, and bible reference. The system SHALL persist all item details in Firestore and synchronize them in real time across connected clients.

The add/edit item modal MUST present resource linking as a dedicated section below the title field, not embedded within the title input. When a resource is linked, the modal MUST display an inline resource card showing the resource title, collection, media type icons, and music properties. The resource card MUST provide one-tap "Changer" and "Délier" actions. Secondary fields (subtitle, participants, duration, notes) MUST be grouped under an expandable "Options avancées" section to reduce form weight.

#### Scenario: Adding a song item with full details
- **WHEN** an admin creates a new program item of type "chant" and assigns a participant, sets a duration of 5 minutes, adds lyrics, links a resource from the library, and attaches a bible reference
- **THEN** the item SHALL appear in the program with all configured details visible and persisted

#### Scenario: Adding a prayer item with minimal details
- **WHEN** an admin creates a new program item of type "priere" and sets only a duration of 3 minutes without assigning a participant or adding notes
- **THEN** the item SHALL be saved with the specified duration and empty optional fields, displaying gracefully without errors

#### Scenario: Adding a section title item
- **WHEN** an admin creates a new program item of type "titre de section" with a title text
- **THEN** the item SHALL render as a visual separator/header in the program list, distinguishing it from performable items

#### Scenario: Resource linking section is visible and accessible in the item modal
- **WHEN** an admin opens the add or edit item modal
- **THEN** a dedicated resource section SHALL be displayed below the title field with a clear "Lier une ressource" button
- **AND** the resource selector SHALL NOT be embedded within the title input's end slot

#### Scenario: Linked resource displays inline card in the item modal
- **WHEN** an admin has linked a resource to a program item and opens the edit modal
- **THEN** the modal SHALL display an inline resource card showing the resource title, collection badge, media type icons, and music properties
- **AND** the card SHALL provide "Changer" and "Délier" action buttons

#### Scenario: Admin unlinks a resource from the item modal
- **WHEN** an admin taps "Délier" on the inline resource card in the edit modal
- **THEN** the resource link SHALL be removed from the item
- **AND** the "Lier une ressource" button SHALL reappear

#### Scenario: Secondary fields are grouped under expandable section
- **WHEN** an admin opens the add item modal
- **THEN** subtitle, participants, duration, and notes fields SHALL be grouped under an "Options avancées" section
- **AND** the section SHALL be collapsed by default to reduce form weight

#### Scenario: Admin quick-unlinks a resource from the program view
- **WHEN** an admin is in edit mode and taps the unlink icon on a program item card that has a linked resource
- **THEN** the resource link SHALL be removed from the item without opening the edit modal
- **AND** a confirmation toast SHALL be displayed

### Requirement: Sub-items SHALL provide hierarchical structure for complex program elements
Program items MUST support a hierarchical sub-item structure, allowing items to contain nested child items. Each sub-item SHALL support its own lyrics/notes, bible reference, participant assignment, and duration. This structure SHALL enable complex arrangements such as a song medley containing individual songs, each with their own lyrics and verses.

The add/edit sub-item modals MUST use the same dedicated resource section pattern as the parent item modal: a "Lier une ressource" button when no resource is linked, and an inline resource card with "Changer" and "Délier" actions when a resource is linked. The resource selector SHALL NOT be embedded within an ion-item label.

#### Scenario: Creating a song medley with sub-items
- **WHEN** an admin creates a program item of type "chant" titled "Medley de louange" and adds three sub-items, each with individual song lyrics and durations
- **THEN** the parent item SHALL display the three sub-items in order, each with their own lyrics content, and the parent item's total duration SHALL reflect the sum of its sub-item durations

#### Scenario: Adding a bible reference to a sub-item
- **WHEN** an admin adds a bible reference "Jean 3:16" to a sub-item within a lecture biblique parent item
- **THEN** the sub-item SHALL independently parse and display the referenced verses, separate from any reference on the parent item

#### Scenario: Reordering sub-items within a parent
- **WHEN** an admin drags a sub-item from position 3 to position 1 within a parent item
- **THEN** the sub-items SHALL reorder accordingly and the new order SHALL persist and synchronize to all connected clients

#### Scenario: Sub-item resource linking uses dedicated section pattern
- **WHEN** an admin opens the add or edit sub-item modal
- **THEN** resource linking SHALL be presented as a dedicated section with a "Lier une ressource" button
- **AND** when a resource is linked, an inline resource card SHALL be displayed with "Changer" and "Délier" actions
