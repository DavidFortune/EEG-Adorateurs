### Requirement: Program items SHALL support multiple types with configurable details
The service program SHALL allow creating items of the following types: chant (song), priere (prayer), lecture biblique (bible reading), predication (sermon), titre de section (section title), annonce (announcement), offrande (offering), benediction (blessing), and additional custom types. Each program item MUST support the following configurable details: assigned participant, duration, lyrics/notes content, sub-items, linked resources, and bible reference. The system SHALL persist all item details in Firestore and synchronize them in real time across connected clients.

#### Scenario: Adding a song item with full details
- **WHEN** an admin creates a new program item of type "chant" and assigns a participant, sets a duration of 5 minutes, adds lyrics, links a resource from the library, and attaches a bible reference
- **THEN** the item SHALL appear in the program with all configured details visible and persisted

#### Scenario: Adding a prayer item with minimal details
- **WHEN** an admin creates a new program item of type "priere" and sets only a duration of 3 minutes without assigning a participant or adding notes
- **THEN** the item SHALL be saved with the specified duration and empty optional fields, displaying gracefully without errors

#### Scenario: Adding a section title item
- **WHEN** an admin creates a new program item of type "titre de section" with a title text
- **THEN** the item SHALL render as a visual separator/header in the program list, distinguishing it from performable items

---

### Requirement: Sub-items SHALL provide hierarchical structure for complex program elements
Program items MUST support a hierarchical sub-item structure, allowing items to contain nested child items. Each sub-item SHALL support its own lyrics/notes, bible reference, participant assignment, and duration. This structure SHALL enable complex arrangements such as a song medley containing individual songs, each with their own lyrics and verses.

#### Scenario: Creating a song medley with sub-items
- **WHEN** an admin creates a program item of type "chant" titled "Medley de louange" and adds three sub-items, each with individual song lyrics and durations
- **THEN** the parent item SHALL display the three sub-items in order, each with their own lyrics content, and the parent item's total duration SHALL reflect the sum of its sub-item durations

#### Scenario: Adding a bible reference to a sub-item
- **WHEN** an admin adds a bible reference "Jean 3:16" to a sub-item within a lecture biblique parent item
- **THEN** the sub-item SHALL independently parse and display the referenced verses, separate from any reference on the parent item

#### Scenario: Reordering sub-items within a parent
- **WHEN** an admin drags a sub-item from position 3 to position 1 within a parent item
- **THEN** the sub-items SHALL reorder accordingly and the new order SHALL persist and synchronize to all connected clients

---

### Requirement: Draft mode SHALL allow private preparation with authorized viewers and a publish workflow
The service program MUST support a draft mode that keeps the program private and invisible to general members until explicitly published. While in draft mode, administrators SHALL be able to add authorized viewers who can preview the program before publication. Publishing the program SHALL make it visible to all members with appropriate permissions. Only administrators SHALL be able to manage draft programs.

#### Scenario: Creating a program in draft mode
- **WHEN** an admin creates a new service program and begins adding items
- **THEN** the program SHALL be in draft status by default and SHALL NOT be visible to regular members or guests

#### Scenario: Adding authorized viewers to a draft program
- **WHEN** an admin adds two team leaders as authorized viewers to a draft program
- **THEN** those two team leaders SHALL be able to view the draft program, while other non-admin members SHALL still not see it

#### Scenario: Publishing a draft program
- **WHEN** an admin clicks the publish action on a draft program
- **THEN** the program status SHALL change from draft to published, and it SHALL become visible to all members and guests with view permissions

#### Scenario: Unauthorized member cannot see draft program
- **WHEN** a regular member navigates to the service detail page for a service whose program is in draft status and the member is not an authorized viewer
- **THEN** the program content SHALL NOT be displayed and the member SHALL see an indication that the program is not yet available

---

### Requirement: Worship leader assignment SHALL display the conductor in the program header
The service program MUST allow assigning a worship leader (chef de culte / conducteur) to the program. The assigned conductor's name and avatar SHALL be prominently displayed in the program header. If the conductor has an uploaded avatar, it SHALL render as a circular image; if not, initials fallback SHALL be used.

#### Scenario: Assigning a worship leader to the program
- **WHEN** an admin selects a member as the worship leader for a service program
- **THEN** the selected member's name and avatar SHALL appear in the program header area

#### Scenario: Worship leader with uploaded avatar
- **WHEN** the assigned worship leader has an uploaded avatar photo
- **THEN** the avatar SHALL render as a circular cover-fit image in the program header

#### Scenario: Worship leader without avatar
- **WHEN** the assigned worship leader does not have an uploaded avatar photo
- **THEN** the program header SHALL display the conductor's colored initials fallback in place of the avatar

---

### Requirement: Total program duration SHALL be calculated automatically
The system SHALL automatically compute and display the total duration of the service program by summing the durations of all program items. When an item contains sub-items with individual durations, the system SHALL use the sub-item durations to compute the parent item's effective duration. The total duration MUST update in real time as items are added, removed, or modified.

#### Scenario: Total duration reflects all items
- **WHEN** a program contains three items with durations of 5 minutes, 10 minutes, and 15 minutes
- **THEN** the displayed total program duration SHALL be 30 minutes

#### Scenario: Duration updates when an item is removed
- **WHEN** an admin removes the 10-minute item from the program described above
- **THEN** the total program duration SHALL immediately update to 20 minutes

#### Scenario: Duration accounts for sub-item durations
- **WHEN** a parent item has no explicit duration but contains two sub-items with durations of 4 minutes and 6 minutes
- **THEN** the parent item's effective duration SHALL be 10 minutes and SHALL be included in the total program duration calculation

#### Scenario: Duration updates when an item's duration is modified
- **WHEN** an admin changes the duration of a 5-minute item to 8 minutes
- **THEN** the total program duration SHALL immediately recalculate to reflect the 3-minute increase

---

### Requirement: Text export SHALL produce a complete textual representation of the program
The system SHALL provide a text export function that generates a complete, human-readable textual representation of the entire service program. The export MUST include all item types, titles, assigned participants, durations, lyrics/notes content, bible references, and sub-items. The exported text SHALL be suitable for sharing via messaging applications or printing.

#### Scenario: Exporting a full program as text
- **WHEN** an admin triggers the text export action on a program containing songs with lyrics, a bible reading with a reference, and a sermon with an assigned preacher
- **THEN** the system SHALL generate a text document listing all items in order with their details, including participant names, durations, lyrics content, and bible references

#### Scenario: Exported text includes sub-items
- **WHEN** the program contains a parent item with three sub-items, each having individual lyrics
- **THEN** the exported text SHALL include the parent item followed by each sub-item's content, clearly indicating the hierarchical structure

#### Scenario: Sharing the exported text
- **WHEN** the text export is generated
- **THEN** the user SHALL be able to copy the text to the clipboard or share it via the native share sheet (WhatsApp, SMS, courriel)

---

### Requirement: YouTube playlist SHALL be auto-generated from program songs
The system SHALL automatically generate a YouTube playlist from all song items in the program that have linked YouTube resources. The playlist SHALL present the videos in program order, allowing worship team members to preview or rehearse the music. The playlist MUST update dynamically as song items are added, removed, or reordered in the program.

#### Scenario: Generating a playlist from songs with YouTube links
- **WHEN** a program contains four song items, three of which have linked YouTube videos
- **THEN** the system SHALL generate a playlist containing those three YouTube videos in program order

#### Scenario: Song without YouTube link is excluded
- **WHEN** a program contains a song item that does not have a linked YouTube resource
- **THEN** that song SHALL be excluded from the generated YouTube playlist without causing an error

#### Scenario: Playlist order reflects program order
- **WHEN** an admin reorders the song items in the program
- **THEN** the generated YouTube playlist SHALL update to reflect the new order of songs

#### Scenario: Playlist updates when a song is removed
- **WHEN** an admin removes a song item that had a linked YouTube video from the program
- **THEN** the corresponding video SHALL be removed from the generated playlist
