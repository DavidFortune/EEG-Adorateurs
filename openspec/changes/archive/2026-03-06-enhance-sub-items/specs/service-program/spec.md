## MODIFIED Requirements

### Requirement: Sub-items SHALL provide hierarchical structure for complex program elements
Program items MUST support a hierarchical sub-item structure, allowing items to contain nested child items. Each sub-item SHALL support its own type, title, subtitle, lyrics/notes, bible reference, participant assignment, duration, and linked resource. This structure SHALL enable complex arrangements such as a song medley containing individual songs, each with their own lyrics and verses.

The add/edit sub-item modals MUST use the same form pattern as the parent item modal: type selection button grid, title input with autocomplete and resource suggestions, dedicated resource section with inline card, and an "Options avancées" collapsible section for secondary fields (subtitle, participants, duration, notes). The type selection SHALL exclude Section and Titre types, which are structural and only apply at the top level.

When a sub-item type is set, the sub-item display in the program view SHALL show the type icon. When duration or participants are set, they SHALL be displayed alongside the sub-item title.

All new sub-item fields (type, subtitle, participants, duration) SHALL be optional to maintain backward compatibility with existing sub-items.

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

#### Scenario: Sub-item type selection excludes structural types
- **WHEN** an admin opens the add sub-item modal
- **THEN** the type selection SHALL display all program item types except Section and Titre
- **AND** the admin SHALL be able to select a type for the sub-item

#### Scenario: Sub-item title autocomplete suggests resources
- **WHEN** an admin types at least 2 characters in the sub-item title field
- **THEN** matching resources SHALL be suggested in a dropdown
- **AND** selecting a suggestion SHALL set the title and auto-link the resource

#### Scenario: Sub-item with participants and duration displays in program view
- **WHEN** a sub-item has a type, assigned participants, and a duration set
- **THEN** the program view SHALL display the type icon, participant names, and duration alongside the sub-item title

#### Scenario: Existing sub-items without new fields display gracefully
- **WHEN** a sub-item was created before the enhancement and lacks type, subtitle, participants, or duration
- **THEN** the sub-item SHALL display without errors, showing only the fields that are set
