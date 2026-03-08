## MODIFIED Requirements

### Requirement: Program items SHALL support inline creation and editing
The service program SHALL allow creating items of the following types: Titre, Chant, Priere, Lecture biblique, Predication, Section, and additional types accessible via the ItemDetailSheet. Each program item MUST support: assigned participants, duration, subtitle, notes, sub-items (Titre type only), linked resources, and bible reference.

Program item creation SHALL use the InlineAddBar component, displayed at the bottom of the program items list. The InlineAddBar SHALL only be visible when the user is in edit mode (`isEditing`). The InlineAddBar SHALL allow admins to select a type (Titre default), type a title, and press Enter to instantly create an item. The selected type SHALL persist between consecutive adds.

Program item editing SHALL use the ItemDetailSheet component, a bottom sheet with field-level saves on blur. The 3-dot action menu "Modifier" action SHALL open the ItemDetailSheet. The 3-dot action menu SHALL only be visible in edit mode.

The `ProgramItemForm` component has been removed. All item creation is handled by InlineAddBar and all item editing is handled by ItemDetailSheet.

Resource autocomplete SHALL only be active for the Chant (song) type. When a resource is created via the sticky "Creer comme ressource" option, it SHALL be auto-linked immediately without requiring a confirmation click.

Scripture text SHALL be auto-fetched when creating items of type Lecture biblique (using the title as the reference) or Predication (using the scripture reference field).

#### Scenario: Admin in edit mode creates an item via inline add bar
- **WHEN** an admin in edit mode selects a type in the InlineAddBar, types a title, and presses Enter
- **THEN** the item SHALL be created and appear in the program list immediately

#### Scenario: Admin in read-only mode cannot create items
- **WHEN** an admin views a program in read-only mode
- **THEN** the InlineAddBar SHALL NOT be visible

### Requirement: Reorder mode SHALL be available only in edit mode
The reorder drag handles SHALL only be visible when the user is in edit mode (`isEditing`). In read-only mode, drag handles SHALL be hidden. When visible, drag handles SHALL be in `slot="end"` alongside the 3-dot menu. All editing interactions (action menus, inline edits, add bar, quick actions) SHALL only be available in edit mode.

#### Scenario: Admin in edit mode can reorder items
- **WHEN** an admin is in edit mode
- **THEN** reorder drag handles SHALL be visible on each item

#### Scenario: Admin in read-only mode cannot reorder items
- **WHEN** an admin views a program in read-only mode
- **THEN** reorder drag handles SHALL NOT be visible

### Requirement: Quick action buttons SHALL only be visible in edit mode
Each non-section program item SHALL display a row of quick action icon buttons (participant, duration, subtitle, notes) only when the user is in edit mode (`isEditing`). In read-only mode, the quick action buttons SHALL be hidden. Metadata chips (duration, participants) SHALL remain visible in read-only mode but SHALL NOT be interactive (tapping SHALL NOT open popovers).

#### Scenario: Admin in edit mode sees quick action buttons
- **WHEN** an admin is in edit mode viewing a non-section item
- **THEN** the quick action buttons row SHALL be visible

#### Scenario: Admin in read-only mode does not see quick action buttons
- **WHEN** an admin views a program in read-only mode
- **THEN** the quick action buttons row SHALL NOT be visible
- **AND** metadata chips SHALL be visible but not interactive

### Requirement: Inline editing SHALL only be active in edit mode
Clicking on item titles, subtitles, and notes SHALL only activate inline editing when the user is in edit mode (`isEditing`). In read-only mode, clicking these elements SHALL have no effect (no cursor change, no underline on hover).

#### Scenario: Admin in edit mode can inline-edit title
- **WHEN** an admin in edit mode clicks on an item title
- **THEN** the inline title editor SHALL activate

#### Scenario: Admin in read-only mode cannot inline-edit
- **WHEN** an admin in read-only mode clicks on an item title
- **THEN** nothing SHALL happen

### Requirement: Mobile-optimized item layout
The item layout SHALL be optimized for mobile screens:
- The drag handle SHALL be in `slot="end"` (not in the item layout), alongside the 3-dot menu — only visible in edit mode
- The 3-dot menu and reorder handle SHALL be vertically centered relative to the item — only visible in edit mode
- Item padding SHALL be at least 12px vertical and 16px horizontal on screens narrower than 768px, with further reduction to 10px vertical on screens narrower than 480px
- The content column SHALL take full available width (no competing meta column)
- All interactive elements (quick action buttons, metadata chips, menu triggers) SHALL have a minimum tappable area of 44×44px, using invisible pseudo-element expansion where visual size must remain compact
- Item cards SHALL have visible separators (border or shadow) between them for clear visual distinction
- The order number badge SHALL be at least 28px diameter with centered text on mobile
- Gaps between item elements (order badge, type icon, content) SHALL be at least 12px on mobile

#### Scenario: Touch targets meet minimum size on mobile in edit mode
- **WHEN** the ServiceProgramPage is viewed on a screen narrower than 768px in edit mode
- **THEN** all quick action buttons, metadata chips, and menu triggers SHALL have tappable areas of at least 44×44px
