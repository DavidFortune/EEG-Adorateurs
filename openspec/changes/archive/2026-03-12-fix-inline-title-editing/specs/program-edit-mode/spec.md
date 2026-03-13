## MODIFIED Requirements

### Requirement: Published programs SHALL display in read-only mode by default
When an admin opens a published (non-draft) program, the page SHALL display in read-only mode. All editing surfaces (quick actions, InlineAddBar, 3-dot menus, reorder handles, inline edit click handlers, resource unlink buttons, music props edit buttons) SHALL be hidden. View-only features (presentation, download, YouTube buttons) SHALL remain visible. A "Modifier le programme" button SHALL be displayed for admins to enter edit mode.

#### Scenario: Admin opens published program
- **WHEN** an admin navigates to a published program's ServiceProgramPage
- **THEN** the page SHALL display in read-only mode with no editing controls visible
- **AND** a "Modifier le programme" button SHALL be displayed

#### Scenario: Non-admin opens program
- **WHEN** a non-admin user navigates to a program's ServiceProgramPage
- **THEN** the page SHALL display in read-only mode
- **AND** no "Modifier le programme" button SHALL be displayed

## ADDED Requirements

### Requirement: Inline title editing SHALL track value via ionInput events
When a user activates inline title editing on any item (regular item, group header, or section), the system SHALL track the typed value via `@ionInput` events in a dedicated ref. On commit (blur or Enter key), the system SHALL read the value from the tracked ref, not from `event.target.value`.

#### Scenario: User edits a title and blurs
- **WHEN** a user activates inline title editing, types a new title, and the input loses focus
- **THEN** the system SHALL save the value tracked via ionInput events
- **AND** the saved title SHALL match what the user typed

#### Scenario: User edits a title and presses Enter
- **WHEN** a user activates inline title editing, types a new title, and presses Enter
- **THEN** the system SHALL save the value tracked via ionInput events
- **AND** the inline editing mode SHALL close

### Requirement: Stale blur events SHALL be discarded
When a user clicks on a new item's title while another item is being edited, the blur event from the previous input SHALL NOT interfere with the new edit. The system SHALL guard against stale blur events by verifying the editing item ID matches before committing.

#### Scenario: User clicks title B while editing title A
- **WHEN** a user is editing item A's title and clicks on item B's title
- **THEN** the stale ionBlur from item A's input SHALL be discarded
- **AND** item B's inline title editing SHALL activate correctly
- **AND** item A's title SHALL retain its last committed value

#### Scenario: Rapid consecutive edits
- **WHEN** a user edits and commits titles on multiple items in quick succession
- **THEN** each title SHALL save the correct value
- **AND** the editing state SHALL remain consistent

### Requirement: Inline title input SHALL receive focus programmatically
When inline title editing activates, the system SHALL programmatically set focus on the ion-input using Ionic's `setFocus()` method after the component renders, rather than relying on the `autofocus` HTML attribute.

#### Scenario: User activates inline edit on a regular item
- **WHEN** a user taps a regular item's title in edit mode
- **THEN** the ion-input SHALL appear and receive focus programmatically

#### Scenario: User activates inline edit on a group header
- **WHEN** a user taps a group header's title in edit mode
- **THEN** the ion-input SHALL appear and receive focus programmatically

#### Scenario: User activates inline edit on a section
- **WHEN** a user taps a section banner's title in edit mode
- **THEN** the ion-input SHALL appear and receive focus programmatically
