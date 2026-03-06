## MODIFIED Requirements

### Requirement: Program items SHALL support multiple types with configurable details
The service program SHALL allow creating items of the following types: chant (song), prière (prayer), lecture biblique (bible reading), prédication (sermon), titre de section (section title), annonce (announcement), offrande (offering), bénédiction (blessing), and additional custom types. Each program item MUST support the following configurable details: assigned participant, duration, lyrics/notes content, sub-items, linked resources, and bible reference. The system SHALL persist all item details in Firestore and synchronize them in real time across connected clients.

The add/edit item form MUST be a single reusable component (`ProgramItemForm`) used for both items and sub-items across add and edit modes. The form MUST present resource linking as a dedicated section below the title field. When a resource is linked, the form MUST display an inline resource card showing the resource title, collection, media type icons, and music properties with one-tap "Changer" and "Délier" actions.

Participants and duration MUST be displayed in the main form body, not behind a collapsible section. Secondary fields (subtitle, notes) MUST be grouped under an expandable "Options avancées" section. Scripture fields for non-Lecture/Prédication types (sub-items only) SHALL also appear in the "Options avancées" section.

Scripture preview MUST use formatted HTML rendering with superscript verse numbers and display the scripture version in all modes. The default scripture version MUST be "LSG". Clearing scripture fields MUST be possible by sending null values on submit in all modes.

The type selection grid MUST organize types into two tiers: primary types (Chant, Prière, Lecture biblique, Prédication, Titre) SHALL be always visible, while additional types SHALL be accessible via an expandable "Plus de types" toggle. Section type SHALL NOT appear in the type selection grid — sections are created via a dedicated inline mechanism.

The duration field in the form MUST use a visual stepper with increment/decrement buttons and preset value chips (3, 5, 10, 15, 20 minutes). The center display MUST be tappable for direct number entry.

The title field autocomplete MUST use debounced input (300ms) instead of a setTimeout blur delay. The suggestion dropdown MUST remain visible when focus moves to a suggestion item.

The form MUST hide the resource link section when the selected type is Titre, as section titles do not have linked resources.

Admins SHALL NOT need to toggle an edit mode to access editing capabilities. All editing interactions (action menus, inline edits, add buttons, quick-unlink) SHALL be always available to admins. Non-admin users SHALL see the read-only view.

Program item actions (edit, delete, add sub-item) SHALL be accessed via a 3-dot menu button (`ellipsisVertical` icon) placed in the `slot="end"` of the `ion-item`, consistently right-aligned across all items. Tapping the button SHALL open a popover menu presenting labeled actions with colored icons and text. The 3-dot button SHALL only be visible to admins. The 3-dot button SHALL be hidden during reorder mode. The "Ajouter un sous-élément" action SHALL be available for all program item types.

A dedicated reorder mode SHALL be toggled via a "Réorganiser" button placed alongside the "Ajouter un élément" and "Section" buttons in the add-item row. When reorder mode is active, the add/section/reorder buttons SHALL be replaced by a "Terminer" button. Drag handles SHALL appear on all items and swipe actions SHALL be disabled.

Admins SHALL be able to edit an item's title inline by tapping the title text on the item card. The title text SHALL be replaced by an input field, and saving SHALL occur on blur or Enter. Escape SHALL cancel the edit.

Admins SHALL be able to edit an item's duration inline by tapping the duration badge. A popover SHALL appear with a stepper (+/- buttons) and preset chips. Changes SHALL save immediately.

Admins SHALL be able to edit an item's participants inline by tapping the participant area. A popover SHALL appear with the ParticipantSelector in compact mode. Changes SHALL save on dismiss.

Section items SHALL be created via a dedicated "Ajouter une section" button alongside the "Ajouter un élément" button, without opening a form modal. A new section SHALL be created immediately with a default title, and inline title editing SHALL activate automatically. Sections SHALL support inline title editing, drag-and-drop reordering, and deletion via the action menu. The action menu "Modifier" action on a section SHALL activate inline title editing instead of opening a form modal.

#### Scenario: Adding a song item with full details
- **WHEN** an admin creates a new program item of type "chant" and assigns a participant, sets a duration of 5 minutes, adds lyrics, links a resource from the library, and attaches a bible reference
- **THEN** the item SHALL appear in the program with all configured details visible and persisted

#### Scenario: Adding a prayer item with minimal details
- **WHEN** an admin creates a new program item of type "prière" and sets only a duration of 3 minutes without assigning a participant or adding notes
- **THEN** the item SHALL be saved with the specified duration and empty optional fields, displaying gracefully without errors

#### Scenario: Adding a section title item
- **WHEN** an admin taps "Ajouter une section"
- **THEN** a new section item SHALL be created immediately with a default title
- **AND** inline title editing SHALL activate on the new section automatically

#### Scenario: Resource linking section is visible and accessible in the item form
- **WHEN** an admin opens the add or edit item form
- **THEN** a dedicated resource section SHALL be displayed below the title field with a clear "Lier une ressource" button
- **AND** the resource selector SHALL NOT be embedded within the title input's end slot

#### Scenario: Resource section hidden for Titre type
- **WHEN** an admin selects the Titre type in the add item form
- **THEN** the resource link section SHALL be hidden

#### Scenario: Linked resource displays inline card in the item form
- **WHEN** an admin has linked a resource to a program item and opens the edit form
- **THEN** the form SHALL display an inline resource card showing the resource title, collection badge, media type icons, and music properties
- **AND** the card SHALL provide "Changer" and "Délier" action buttons

#### Scenario: Admin unlinks a resource from the item form
- **WHEN** an admin taps "Délier" on the inline resource card in the edit form
- **THEN** the resource link SHALL be removed from the item
- **AND** the "Lier une ressource" button SHALL reappear

#### Scenario: Participants and duration are in the main form body
- **WHEN** an admin opens the add or edit item form
- **THEN** participants and duration fields SHALL be visible in the main form body without expanding any accordion
- **AND** subtitle and notes SHALL remain under the "Options avancées" section

#### Scenario: Admin quick-unlinks a resource from the program view
- **WHEN** an admin taps the unlink icon on a program item card that has a linked resource
- **THEN** the resource link SHALL be removed from the item without opening the edit form
- **AND** a confirmation toast SHALL be displayed

#### Scenario: Scripture clearing works in all form modes
- **WHEN** an admin clears the scripture reference field and saves in any form mode (add item, edit item, add sub-item, edit sub-item)
- **THEN** the scripture fields SHALL be set to null in Firestore
- **AND** the scripture SHALL no longer display on the item or sub-item

#### Scenario: Scripture preview uses formatted rendering in all modes
- **WHEN** scripture text is fetched and displayed in any form mode
- **THEN** the preview SHALL use HTML rendering with superscript verse numbers
- **AND** the scripture version SHALL be displayed in the preview header

#### Scenario: Type selection shows primary types prominently
- **WHEN** an admin opens the add item form
- **THEN** the type grid SHALL show Chant, Prière, Lecture biblique, Prédication, and Titre as always-visible primary types
- **AND** additional types SHALL be accessible via a "Plus de types" expandable toggle
- **AND** Section type SHALL NOT appear in the type grid

#### Scenario: Duration field uses visual stepper
- **WHEN** an admin interacts with the duration field in the form
- **THEN** the field SHALL display +/- stepper buttons and preset chips (3, 5, 10, 15, 20 min)
- **AND** the center value SHALL be tappable for direct number entry

#### Scenario: Title autocomplete uses debounced input
- **WHEN** an admin types in the title field
- **THEN** suggestions SHALL appear after a 300ms debounce
- **AND** the dropdown SHALL remain visible when clicking a suggestion

#### Scenario: Editing capabilities always available for admins
- **WHEN** an admin views the program page
- **THEN** all editing interactions (action menus, inline edits, add buttons) SHALL be available without toggling an edit mode
- **AND** there SHALL be no edit mode toggle button

#### Scenario: Program item actions via 3-dot menu
- **WHEN** an admin taps the 3-dot menu button on a program item
- **THEN** a popover menu SHALL appear with labeled actions (colored icon + text): "Modifier", "Ajouter un sous-élément", and "Supprimer"
- **AND** the "Ajouter un sous-élément" action SHALL be available for all item types
- **AND** for section items, "Modifier" SHALL activate inline title editing

#### Scenario: 3-dot menu hidden during reorder mode
- **WHEN** reorder mode is active
- **THEN** the 3-dot menu buttons SHALL be hidden on all items and sub-items

#### Scenario: Reorder mode toggled from add-item row
- **WHEN** an admin taps the "Réorganiser" button in the add-item row
- **THEN** reorder mode SHALL activate with drag handles visible
- **AND** the add/section/reorder buttons SHALL be replaced by a "Terminer" button
- **AND** the toolbar SHALL NOT contain a reorder toggle

#### Scenario: Inline title editing
- **WHEN** an admin taps the title of a program item
- **THEN** the title text SHALL be replaced by an editable input field
- **AND** the input SHALL be auto-focused
- **AND** pressing Enter or blurring SHALL save the change
- **AND** pressing Escape SHALL cancel the edit

#### Scenario: Inline duration editing via popover
- **WHEN** an admin taps the duration badge on a program item
- **THEN** a popover SHALL appear with a stepper (+/- buttons) and preset chips
- **AND** changes SHALL save immediately on each interaction

#### Scenario: Inline participant editing via popover
- **WHEN** an admin taps the participant area on a program item
- **THEN** a popover SHALL appear with the ParticipantSelector
- **AND** changes SHALL save on popover dismiss

#### Scenario: Section edit via action menu activates inline editing
- **WHEN** an admin taps the 3-dot menu on a section item and selects "Modifier"
- **THEN** inline title editing SHALL activate on the section
- **AND** the form modal SHALL NOT open

---

### Requirement: Sub-items SHALL provide hierarchical structure for complex program elements
Program items MUST support a hierarchical sub-item structure, allowing items to contain nested child items. Each sub-item SHALL support its own type, title, subtitle, lyrics/notes, bible reference, participant assignment, duration, and linked resource. This structure SHALL enable complex arrangements such as a song medley containing individual songs, each with their own lyrics and verses.

The add/edit sub-item forms MUST use the same `ProgramItemForm` component as the parent item form, configured with a mode prop that controls the type list (excluding Section and Titre) and validation rules (type is optional for sub-items). The form layout, field order, and behavior MUST be identical to the item form except for the type list and validation differences.

When a sub-item type is set, the sub-item display in the program view SHALL show the type icon. When duration or participants are set, they SHALL be displayed alongside the sub-item title.

All new sub-item fields (type, subtitle, participants, duration) SHALL be optional to maintain backward compatibility with existing sub-items.

Sub-item actions (edit, delete) SHALL be accessed via a 3-dot menu button at the end of the sub-item row. Tapping the button SHALL open a popover menu with labeled actions (colored icon + text): "Modifier" and "Supprimer". The 3-dot button SHALL be hidden during reorder mode.

#### Scenario: Creating a song medley with sub-items
- **WHEN** an admin creates a program item of type "chant" titled "Medley de louange" and adds three sub-items, each with individual song lyrics and durations
- **THEN** the parent item SHALL display the three sub-items in order, each with their own lyrics content, and the parent item's total duration SHALL reflect the sum of its sub-item durations

#### Scenario: Adding a bible reference to a sub-item
- **WHEN** an admin adds a bible reference "Jean 3:16" to a sub-item within a lecture biblique parent item
- **THEN** the sub-item SHALL independently parse and display the referenced verses, separate from any reference on the parent item

#### Scenario: Reordering sub-items within a parent
- **WHEN** an admin drags a sub-item from position 3 to position 1 within a parent item
- **THEN** the sub-items SHALL reorder accordingly and the new order SHALL persist and synchronize to all connected clients

#### Scenario: Sub-item form uses same component as item form
- **WHEN** an admin opens the add or edit sub-item form
- **THEN** the form SHALL use the same `ProgramItemForm` component as the item form
- **AND** participants and duration SHALL be in the main form body
- **AND** the type grid SHALL exclude Section and Titre types
- **AND** type selection SHALL be optional (not required for submit)

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

#### Scenario: Sub-item actions via 3-dot menu
- **WHEN** an admin taps the 3-dot menu button on a sub-item
- **THEN** a popover menu SHALL appear with labeled actions: "Modifier" (edit) and "Supprimer" (delete)
- **AND** the 3-dot button SHALL be hidden during reorder mode
