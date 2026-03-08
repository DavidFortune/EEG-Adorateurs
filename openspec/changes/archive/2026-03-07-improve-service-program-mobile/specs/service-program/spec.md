## MODIFIED Requirements

### Requirement: Sections SHALL be created via 3-dot menu or InlineAddBar
Section items SHALL be created via the 3-dot action menu on any non-section item, using "Ajouter une section" action. The new section SHALL be inserted after the selected item with proper order management. Section items SHALL also be creatable via a dedicated section button (dashed-border icon) in the main InlineAddBar type row (not shown in sub-item add bars). When created via the InlineAddBar, the section SHALL be appended at the end of the program. In both cases, inline title editing SHALL activate on the newly created section.

Section items SHALL display with full-width danger-colored background, centered white text, and no sub-items. The 3-dot menu for sections SHALL hide "Ajouter un sous-element" and "Ajouter une section" actions.

#### Scenario: Admin creates a section via 3-dot menu
- **WHEN** an admin taps the 3-dot menu on a non-section item and selects "Ajouter une section"
- **THEN** a new section SHALL be inserted after that item
- **AND** inline title editing SHALL activate on the new section

#### Scenario: Admin creates a section via InlineAddBar
- **WHEN** an admin taps the section button (dashed icon) in the InlineAddBar
- **THEN** a new section SHALL be appended at the end of the program
- **AND** inline title editing SHALL activate on the new section

#### Scenario: Section button is not shown in sub-item add bars
- **WHEN** an admin views the InlineAddBar inside a Titre item's sub-items area
- **THEN** the section button SHALL NOT be displayed

### Requirement: Mobile-optimized item layout
The item layout SHALL be optimized for mobile screens:
- The drag handle SHALL be in `slot="end"` (not in the item layout), alongside the 3-dot menu
- The 3-dot menu and reorder handle SHALL be vertically centered relative to the item
- Item padding SHALL be at least 12px vertical and 16px horizontal on screens narrower than 768px, with further reduction to 10px vertical on screens narrower than 480px
- The content column SHALL take full available width (no competing meta column)
- All interactive elements (quick action buttons, metadata chips, menu triggers) SHALL have a minimum tappable area of 44×44px, using invisible pseudo-element expansion where visual size must remain compact
- Item cards SHALL have visible separators (border or shadow) between them for clear visual distinction
- The order number badge SHALL be at least 28px diameter with centered text on mobile
- Gaps between item elements (order badge, type icon, content) SHALL be at least 12px on mobile

#### Scenario: Admin creates an item via inline add bar
- **WHEN** an admin selects a type in the InlineAddBar, types a title, and presses Enter
- **THEN** the item SHALL be created and appear in the program list immediately

#### Scenario: Admin edits an item via bottom sheet
- **WHEN** an admin taps the 3-dot menu on a program item and selects "Modifier"
- **THEN** the ItemDetailSheet SHALL open as a bottom sheet

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

#### Scenario: Touch targets meet minimum size on mobile
- **WHEN** the ServiceProgramPage is viewed on a screen narrower than 768px
- **THEN** all quick action buttons, metadata chips, and menu triggers SHALL have tappable areas of at least 44×44px
