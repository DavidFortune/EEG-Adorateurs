## MODIFIED Requirements

### Requirement: Program items SHALL support inline creation and editing
The service program SHALL allow creating program items and group headers. Each program item MUST support: assigned participants, duration, subtitle, notes, linked resources, and bible reference. Group headers MUST support: title and collapsible child items.

Program item creation SHALL use the InlineAddBar component, displayed at the bottom of the program items list. The InlineAddBar SHALL only be visible when the user is in edit mode (`isEditing`). The InlineAddBar SHALL allow admins to type a title and press Enter to instantly create an item.

Program item editing SHALL use the expandable item card pattern — tapping the expand chevron reveals all editable fields inline. All fields SHALL save on blur or selection.

Resource autocomplete SHALL be active for all items. When a resource is created via the sticky "Creer comme ressource" option, it SHALL be auto-linked immediately without requiring a confirmation click.

Scripture text SHALL be auto-fetched when the scripture reference field is filled and the fetch button is tapped.

#### Scenario: Admin in edit mode creates an item via inline add bar
- **WHEN** an admin in edit mode types a title in the InlineAddBar and presses Enter
- **THEN** the item SHALL be created and appear in the program list immediately

#### Scenario: Admin in read-only mode cannot create items
- **WHEN** an admin views a program in read-only mode
- **THEN** the InlineAddBar SHALL NOT be visible

#### Scenario: Admin creates a group via add zone
- **WHEN** an admin taps "Groupe" in the inter-item add zone
- **THEN** a new group header SHALL be inserted at that position

#### Scenario: Touch targets meet minimum size on mobile in edit mode
- **WHEN** the ServiceProgramPage is viewed on a screen narrower than 768px in edit mode
- **THEN** all interactive elements SHALL have tappable areas of at least 44x44px

### Requirement: Reorder mode SHALL be available only in edit mode
The reorder drag handles SHALL only be visible when the user is in edit mode (`isEditing`). In read-only mode, drag handles SHALL be hidden. When visible, drag handles SHALL be in `slot="start"`. All editing interactions (inline edits, add bar, expand cards) SHALL only be available in edit mode.

#### Scenario: Admin in edit mode can reorder items
- **WHEN** an admin is in edit mode
- **THEN** reorder drag handles SHALL be visible on each item

#### Scenario: Admin in read-only mode cannot reorder items
- **WHEN** an admin views a program in read-only mode
- **THEN** reorder drag handles SHALL NOT be visible

## REMOVED Requirements

### Requirement: Sub-items SHALL only be available for Titre type items
**Reason**: Sub-items are replaced by the group model. All items are top-level.
**Migration**: Existing sub-items are promoted to top-level items within their parent's group via read-time migration.

### Requirement: Sub-items SHALL provide hierarchical structure for Titre items
**Reason**: Sub-items are replaced by the group model.
**Migration**: Same as above.

### Requirement: Sections SHALL be created via 3-dot menu or InlineAddBar
**Reason**: Sections are replaced by groups. The 3-dot menu has been removed. Groups are created via the inter-item add zone.
**Migration**: Existing Section-type items are converted to group headers via read-time migration.

### Requirement: Quick action buttons SHALL only be visible in edit mode
**Reason**: Quick action buttons are replaced by the expandable item card pattern. All editing fields are inside the expanded card.
**Migration**: Use expand chevron to access all editable fields.
