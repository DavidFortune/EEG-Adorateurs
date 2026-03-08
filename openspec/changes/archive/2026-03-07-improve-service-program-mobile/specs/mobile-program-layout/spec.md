## ADDED Requirements

### Requirement: Program item cards SHALL have enhanced mobile spacing and visual hierarchy
Each program item card SHALL use increased vertical padding (minimum 12px top/bottom) and horizontal padding (minimum 16px) on screens narrower than 768px, with further reduction (10px/12px) on screens narrower than 480px. The gap between the order number badge, type icon, and content area SHALL be at least 12px. Items SHALL have a subtle bottom border to visually separate them from adjacent items. The content area (title, subtitle, metadata) SHALL have a minimum line-height of 1.4 for readability. Spacing values SHALL be defined as CSS custom properties (`--program-item-padding-v`, `--program-item-padding-h`, `--program-item-gap`, `--program-touch-target`) and overridden per breakpoint.

#### Scenario: Item card displays with proper mobile spacing
- **WHEN** the ServiceProgramPage is viewed on a screen narrower than 768px
- **THEN** each program item card SHALL have at least 12px vertical padding and 16px horizontal padding
- **AND** visual separators SHALL be visible between adjacent items

#### Scenario: Item card content maintains readable line spacing
- **WHEN** a program item has a title and subtitle displayed on mobile
- **THEN** the text content SHALL render with a minimum line-height of 1.4
- **AND** the gap between title and subtitle SHALL be at least 4px

### Requirement: Quick action buttons SHALL meet minimum touch target size via invisible tap area expansion
All quick action icon buttons (participant, duration, subtitle, notes) SHALL maintain a compact visual size (28px) but have a minimum tappable area of 44×44px achieved via an invisible `::before` pseudo-element overlay. The buttons SHALL be spaced with a compact gap (4px) visually while the expanded tap areas provide comfortable touch targets. The button row SHALL wrap to a second line if the container width cannot accommodate all buttons.

#### Scenario: Quick action buttons are touch-friendly on mobile
- **WHEN** an admin views a program item's quick action buttons on a screen narrower than 768px
- **THEN** each button SHALL have a tappable area of at least 44×44px via invisible tap expansion
- **AND** the visual button size SHALL remain compact (28px) to match the design

#### Scenario: Quick action buttons wrap when space is insufficient
- **WHEN** the item content area is too narrow to display all quick action buttons in a single row
- **THEN** the buttons SHALL wrap to a second line rather than overlapping or being truncated

### Requirement: Metadata chips SHALL have consistent sizing and touch targets on mobile
Duration and participant metadata chips SHALL have a minimum height of 32px and a minimum tappable area of 44px (using invisible `::before` pseudo-element for the tap target). Chips SHALL be displayed in a horizontal scrollable row (with hidden scrollbar) if they exceed the available width, rather than wrapping to multiple lines. Chip text SHALL use a minimum font-size of 13px on mobile.

#### Scenario: Metadata chips are tappable on mobile
- **WHEN** an admin taps a duration or participant chip on a screen narrower than 768px
- **THEN** the chip's tappable area SHALL be at least 44px in height
- **AND** the corresponding popover SHALL open

#### Scenario: Metadata chips scroll horizontally when overflowing
- **WHEN** a program item has more metadata chips than fit in the available width
- **THEN** the chips SHALL be horizontally scrollable without wrapping to a new line

### Requirement: Draft status area SHALL use a clean compact notice card
The draft status area SHALL display as a white card with subtle border and shadow (not a colored warning card). The layout SHALL include a lock icon and "Mode brouillon" title with description text in a horizontal layout, followed by two side-by-side buttons: "Gérer les accès" (outline, medium color) and "Publier le programme" (filled, dark color). Both buttons SHALL use small size and equal flex width. The header toolbar SHALL NOT display a separate draft badge chip.

#### Scenario: Draft notice displays with clean compact layout
- **WHEN** an admin views a draft program
- **THEN** the draft notice SHALL display as a white card with lock icon, bold title, and description
- **AND** the "Publier le programme" and "Gérer les accès" buttons SHALL be displayed side by side

#### Scenario: No draft badge in header toolbar
- **WHEN** a program is in draft mode
- **THEN** the header toolbar SHALL NOT display a "Brouillon" chip badge

### Requirement: Sub-item containers SHALL have clear visual grouping
Sub-items within a Titre item SHALL be visually grouped with a left border accent (2px, primary color at 30% opacity) and indented with at least 24px left margin. The sub-item container background SHALL have a subtle tint (3% opacity of the primary color) to distinguish it from the parent item, with a rounded right border (8px). The expand/collapse toggle SHALL have a 44px minimum tap target.

#### Scenario: Sub-items display with visual grouping on mobile
- **WHEN** a Titre item's sub-items are expanded on a screen narrower than 768px
- **THEN** the sub-items container SHALL display with a left border accent and subtle background tint
- **AND** sub-items SHALL be indented at least 24px from the parent item's content

#### Scenario: Expand/collapse toggle is touch-friendly
- **WHEN** an admin taps the expand/collapse toggle for a Titre item on mobile
- **THEN** the toggle's tappable area SHALL be at least 44×44px

### Requirement: Section dividers SHALL have strong visual separation on mobile
Section items SHALL display with full-width background in the danger/accent color, centered white text with a minimum font-size of 15px, and vertical padding of at least 12px. Sections SHALL have at least 16px of vertical margin above to create clear visual breaks in the program flow.

#### Scenario: Section dividers create clear visual breaks
- **WHEN** a section item is displayed between program items on mobile
- **THEN** the section SHALL have full-width colored background with centered white text
- **AND** there SHALL be at least 16px of vertical margin above the section

### Requirement: InlineAddBar SHALL be optimized for thumb-reach at screen bottom
The InlineAddBar at the bottom of the program list SHALL have increased vertical padding (minimum 12px) and the type selector icons SHALL meet the 44px minimum touch target. The text input SHALL have a minimum height of 44px. The add bar SHALL respect the device's bottom safe area inset via `env(safe-area-inset-bottom)`.

#### Scenario: InlineAddBar has comfortable touch targets at screen bottom
- **WHEN** an admin interacts with the InlineAddBar on a mobile device
- **THEN** the type selector icons SHALL have tappable areas of at least 44×44px
- **AND** the text input SHALL have a minimum height of 44px
- **AND** the add bar SHALL respect the device's bottom safe area inset

### Requirement: Program summary SHALL display as standalone stat boxes
The program summary section SHALL display item count and total duration as two equal-width standalone bordered boxes side by side (not wrapped in an ion-card). Each stat box SHALL show a large primary-colored number centered above a small gray label. Stat boxes SHALL have a border (1px, light shade), rounded corners (12px), white background, and at least 16px padding. The "Résumé du programme" heading SHALL be removed. Conductor information SHALL display separately below the stat boxes when available, with an edit button for admins. When no conductor is set, an "Ajouter un dirigeant" button SHALL be shown for admins.

#### Scenario: Summary stats display as standalone bordered boxes
- **WHEN** the ServiceProgramPage loads with a program
- **THEN** item count and duration SHALL display in two equal-width bordered rounded boxes
- **AND** each box SHALL show a primary-colored number above a gray label

#### Scenario: Conductor edit is accessible without conductor
- **WHEN** an admin views a program without a conductor assigned
- **THEN** an "Ajouter un dirigeant" button SHALL be displayed

### Requirement: YouTube promotion banner SHALL be removed
The YouTube feature notice banner ("Nouveauté ! Cliquez sur l'icône YouTube...") SHALL be removed from the ServiceProgramPage. The YouTube playlist functionality remains accessible via the YouTube icon button in the header toolbar.

#### Scenario: No YouTube promotion banner displayed
- **WHEN** the ServiceProgramPage loads with YouTube videos available
- **THEN** no promotional banner SHALL be displayed
- **AND** the YouTube icon button in the header toolbar SHALL remain functional
