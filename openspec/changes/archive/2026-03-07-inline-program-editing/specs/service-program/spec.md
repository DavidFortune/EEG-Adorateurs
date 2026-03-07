## MODIFIED Requirements

### Requirement: Program items SHALL support inline creation and editing
The service program SHALL allow creating items of the following types: Titre, Chant, Priere, Lecture biblique, Predication, Section, and additional types accessible via the ItemDetailSheet. Each program item MUST support: assigned participants, duration, subtitle, notes, sub-items (Titre type only), linked resources, and bible reference.

Program item creation SHALL use the InlineAddBar component, displayed at the bottom of the program items list. The InlineAddBar SHALL allow admins to select a type (Titre default), type a title, and press Enter to instantly create an item. The selected type SHALL persist between consecutive adds.

Program item editing SHALL use the ItemDetailSheet component, a bottom sheet with field-level saves on blur. The 3-dot action menu "Modifier" action SHALL open the ItemDetailSheet.

The `ProgramItemForm` component has been removed. All item creation is handled by InlineAddBar and all item editing is handled by ItemDetailSheet.

Resource autocomplete SHALL only be active for the Chant (song) type. When a resource is created via the sticky "Creer comme ressource" option, it SHALL be auto-linked immediately without requiring a confirmation click.

Scripture text SHALL be auto-fetched when creating items of type Lecture biblique (using the title as the reference) or Predication (using the scripture reference field).

### Requirement: Reorder mode SHALL be always active
The reorder drag handles SHALL always be visible on each item (in `slot="end"` alongside the 3-dot menu). There is no toggle button to enter/exit reorder mode. All editing interactions (action menus, inline edits, add bar, quick actions) SHALL be always available alongside drag handles.

### Requirement: Sub-items SHALL only be available for Titre type items
Only items of type Titre SHALL support sub-items. The expand/collapse button, sub-items container, and sub-item InlineAddBar SHALL only appear for Titre type items. The 3-dot menu "Ajouter un sous-element" action SHALL only appear for Titre type items. The ItemDetailSheet "Ajouter un sous-element" shortcut SHALL only appear for Titre type items.

### Requirement: Sections SHALL be created via 3-dot menu
Section items SHALL be created via the 3-dot action menu on any non-section item, using "Ajouter une section" action. The new section SHALL be inserted after the selected item with proper order management. Sections SHALL NOT be created via the InlineAddBar.

Section items SHALL display with full-width danger-colored background, centered white text, and no sub-items. The 3-dot menu for sections SHALL hide "Ajouter un sous-element" and "Ajouter une section" actions.

### Requirement: Quick action buttons SHALL enable inline field editing
Each non-section program item SHALL display a row of quick action icon buttons inside the item content area (below the title/subtitle). The buttons SHALL be:
- **Participant** (personAddOutline): Opens the participants popover
- **Duration** (timeOutline): Opens the duration stepper popover
- **Subtitle** (textOutline): Toggles an inline text input for editing the subtitle
- **Notes** (chatbubbleOutline): Toggles an inline textarea for editing notes

Buttons SHALL highlight in primary color when their corresponding field has a value. The subtitle input SHALL save on blur or Enter, and cancel on Escape. The notes textarea SHALL save on blur and cancel on Escape. Clicking existing subtitle or notes text SHALL also open the inline editor for admins.

Quick action buttons SHALL only be visible to admin users.

### Requirement: Item metadata SHALL display as inline chips
Duration and participant information SHALL display as compact pill-shaped chips (meta-chips) inside the item content column, below the title/subtitle. Duration chips SHALL show the time icon and value (e.g., "5min"). Participant chips SHALL show the participant's avatar/initials and name. Chips SHALL be tappable by admins to open the corresponding popover for editing.

### Requirement: Mobile-optimized item layout
The item layout SHALL be optimized for mobile screens:
- The drag handle SHALL be in `slot="end"` (not in the item layout), alongside the 3-dot menu
- The 3-dot menu and reorder handle SHALL be vertically centered relative to the item
- Item padding, order number size, and gaps SHALL be reduced on screens narrower than 768px
- The content column SHALL take full available width (no competing meta column)

#### Scenario: Admin creates an item via inline add bar
- **WHEN** an admin selects a type in the InlineAddBar, types a title, and presses Enter
- **THEN** the item SHALL be created and appear in the program list immediately

#### Scenario: Admin edits an item via bottom sheet
- **WHEN** an admin taps the 3-dot menu on a program item and selects "Modifier"
- **THEN** the ItemDetailSheet SHALL open as a bottom sheet

#### Scenario: Admin creates a section via 3-dot menu
- **WHEN** an admin taps the 3-dot menu on a non-section item and selects "Ajouter une section"
- **THEN** a new section SHALL be inserted after that item
- **AND** inline title editing SHALL activate on the new section

#### Scenario: Admin uses quick action buttons
- **WHEN** an admin taps the subtitle quick action button on an item
- **THEN** an inline text input SHALL appear for editing the subtitle
- **WHEN** the admin types a subtitle and presses Enter or blurs the field
- **THEN** the subtitle SHALL be saved to Firestore

#### Scenario: Auto-fetch scripture on creation
- **WHEN** an admin creates a Lecture biblique item with title "Psaumes 23"
- **THEN** the scripture text for Psaumes 23 SHALL be auto-fetched and saved to the item
- **WHEN** an admin creates a Predication item with scripture reference "Jean 3:16"
- **THEN** the scripture text for Jean 3:16 SHALL be auto-fetched and saved to the item

---

### Requirement: Sub-items SHALL provide hierarchical structure for Titre items
Titre type items MUST support a hierarchical sub-item structure. Each sub-item SHALL support its own type, title, subtitle, notes, bible reference, participant assignment, duration, and linked resource.

Sub-item creation SHALL use the InlineAddBar component displayed inside the expanded parent item. Sub-item editing SHALL use the ItemDetailSheet component. The "Ajouter un sous-element" shortcut SHALL NOT appear in the sheet when editing a sub-item.

Sub-item actions (edit, delete) SHALL be accessed via a 3-dot menu button at the end of the sub-item row.

All sub-item fields SHALL be optional to maintain backward compatibility.
