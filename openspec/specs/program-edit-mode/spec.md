## Requirements

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

### Requirement: Draft programs SHALL auto-enter edit mode
When an admin opens a draft program, the page SHALL automatically attempt to acquire the edit lock. If successful, the page SHALL display in edit mode immediately (preserving current draft UX). If the lock is held by another user, the page SHALL display the lock indicator with the holder's info.

#### Scenario: Admin opens draft program with no active lock
- **WHEN** an admin navigates to a draft program with no editLock or an expired editLock
- **THEN** the page SHALL automatically acquire the lock and enter edit mode

#### Scenario: Admin opens draft program locked by another user
- **WHEN** an admin navigates to a draft program locked by another admin
- **THEN** the page SHALL display in read-only mode with the lock holder indicator

### Requirement: Edit mode SHALL display a countdown timer in the toolbar
When in edit mode, the header toolbar SHALL display a countdown timer showing remaining lock time in MM:SS format. The timer SHALL count down from the `expiresAt` timestamp. The timer text SHALL turn warning color (orange/amber) when 2 minutes or less remain. A toast notification SHALL appear when 30 seconds remain ("Votre session d'édition expire bientôt"). Tapping the timer SHALL extend the lock by re-acquiring with a fresh 10-minute TTL.

#### Scenario: Timer displays remaining lock time
- **WHEN** an admin is in edit mode
- **THEN** the toolbar SHALL display a countdown timer in MM:SS format

#### Scenario: Timer warns at 2 minutes remaining
- **WHEN** the countdown reaches 2:00 or less
- **THEN** the timer text SHALL change to warning color

#### Scenario: Timer warns at 30 seconds remaining
- **WHEN** the countdown reaches 0:30
- **THEN** a toast notification SHALL appear with the expiry warning

#### Scenario: Admin taps timer to extend
- **WHEN** an admin taps the countdown timer
- **THEN** the lock SHALL be re-acquired with a fresh 10-minute TTL
- **AND** the countdown SHALL reset

### Requirement: Edit mode SHALL display a "Terminer" button to exit
When in edit mode, the header toolbar SHALL display a "Terminer" (checkmark) button. Tapping it SHALL release the edit lock and return the page to read-only mode (for published programs) or attempt to re-acquire (for draft programs, if desired — TBD).

#### Scenario: Admin exits edit mode on published program
- **WHEN** an admin taps "Terminer" while editing a published program
- **THEN** the edit lock SHALL be released
- **AND** the page SHALL return to read-only mode with the "Modifier" button visible

### Requirement: Lock indicator SHALL show when another user is editing
When the program's editLock is held by a different user and has not expired, the page SHALL display a lock indicator showing the holder's name and remaining lock time. An admin SHALL see a "Prendre le contrôle" button to force-acquire the lock.

#### Scenario: Admin sees lock held by another user
- **WHEN** an admin views a program locked by another admin
- **THEN** a lock indicator SHALL display the editor's name and remaining time
- **AND** a "Prendre le contrôle" button SHALL be available

#### Scenario: Admin force-acquires the lock
- **WHEN** an admin taps "Prendre le contrôle"
- **THEN** the lock SHALL be force-acquired
- **AND** the page SHALL enter edit mode
- **AND** the previous editor SHALL see a toast notification that they lost edit control

### Requirement: Edit lock SHALL auto-release on timer expiry
When the countdown timer reaches zero, the client SHALL automatically release the edit lock and transition to read-only mode. A toast notification SHALL inform the user ("Session d'édition expirée").

#### Scenario: Lock expires while editing
- **WHEN** the edit lock countdown reaches 0:00
- **THEN** the lock SHALL be released
- **AND** the page SHALL transition to read-only mode
- **AND** a toast notification SHALL display "Session d'édition expirée"

### Requirement: Edit lock SHALL be released on page navigation
When the user navigates away from ServiceProgramPage (via back button, route change, or browser close), the edit lock SHALL be released if held by the current user. The release SHALL happen in `onUnmounted` and `window.beforeunload`.

#### Scenario: Admin navigates away while editing
- **WHEN** an admin navigates away from the page while holding the edit lock
- **THEN** the edit lock SHALL be released

#### Scenario: Admin closes browser while editing
- **WHEN** an admin closes the browser tab while holding the edit lock
- **THEN** the `beforeunload` handler SHALL attempt to release the lock
- **AND** if the release fails, the lock SHALL expire after 10 minutes via TTL

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
