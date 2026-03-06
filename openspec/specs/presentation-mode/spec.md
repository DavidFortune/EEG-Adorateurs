### Requirement: Presentation mode SHALL provide a full-screen slideshow
The system SHALL offer a full-screen presentation mode that transforms the service program into a slideshow, displaying one slide at a time. The presentation MUST occupy the entire screen, hiding all application chrome (navigation bars, toolbars, status bars). The system SHALL support entering and exiting full-screen mode. The presentation MUST be suitable for projection during a live church service.

#### Scenario: Entering full-screen presentation mode
- **WHEN** a user activates presentation mode from a service program
- **THEN** the application SHALL enter full-screen mode, hiding all navigation chrome, and SHALL display the first slide of the program

#### Scenario: Exiting presentation mode
- **WHEN** a user triggers the exit action (e.g., pressing Escape or tapping a close button) while in presentation mode
- **THEN** the application SHALL exit full-screen mode and return to the normal program view

#### Scenario: Presentation displays one slide at a time
- **WHEN** the presentation is active and displaying a slide
- **THEN** only the content for the current slide SHALL be visible, with no partial content from adjacent slides showing

---

### Requirement: Lyrics SHALL be paginated for long texts
When a song's lyrics exceed the displayable area of a single slide, the system SHALL automatically paginate the lyrics across multiple slides. Each paginated slide SHALL display a portion of the lyrics that fits within the visible area without requiring scrolling. The system MUST ensure that lyrics are split at logical boundaries (between stanzas, verses, or lines) rather than mid-word or mid-line.

#### Scenario: Short lyrics fit on a single slide
- **WHEN** a song item has lyrics that fit entirely within one slide's display area
- **THEN** the system SHALL display all lyrics on a single slide without pagination

#### Scenario: Long lyrics are paginated across multiple slides
- **WHEN** a song item has lyrics that exceed the display area of a single slide
- **THEN** the system SHALL split the lyrics into multiple paginated slides, each fitting within the visible area

#### Scenario: Lyrics split at logical boundaries
- **WHEN** lyrics are paginated across slides
- **THEN** the system SHALL split between stanzas or lines, and SHALL NOT split in the middle of a word or line

#### Scenario: Navigating between paginated lyrics slides
- **WHEN** a user advances from the first page of a paginated song's lyrics
- **THEN** the next page of the same song's lyrics SHALL be displayed before moving to the next program item

---

### Requirement: Bible verses SHALL be displayed with elegant formatting in presentation mode
The system SHALL display fetched bible verses in presentation mode with visually elegant formatting optimized for projection. Verse numbers SHALL appear as superscripts. The text SHALL be rendered in a large, readable font suitable for audience viewing at a distance. The bible reference (book, chapter, verse range) SHALL be displayed as a heading or label on the slide.

#### Scenario: Displaying bible verses on a presentation slide
- **WHEN** a program item with the bible reference "1 Corinthiens 13:4-7" is shown in presentation mode
- **THEN** the slide SHALL display the reference as a heading and the verse text with superscript verse numbers in a large, readable font

#### Scenario: Bible verse text is legible for projection
- **WHEN** bible verses are displayed in presentation mode
- **THEN** the font size SHALL be large enough for audience readability and the text SHALL have sufficient contrast against the background

#### Scenario: Long bible passages are paginated
- **WHEN** a bible reference spans many verses that exceed the displayable area of a single slide (e.g., "Psaume 119:1-20")
- **THEN** the system SHALL paginate the verses across multiple slides, splitting at verse boundaries

---

### Requirement: Navigation SHALL allow moving between program items
The presentation mode SHALL provide navigation controls that allow the user to move forward and backward through program items. Navigation MUST follow the program order. When an item has multiple pages (paginated lyrics or verses), navigation SHALL step through each page before advancing to the next program item. The system SHALL indicate the current position within the program.

#### Scenario: Advancing to the next program item
- **WHEN** a user presses the forward navigation control on a single-page slide
- **THEN** the presentation SHALL advance to the next program item's slide

#### Scenario: Going back to the previous program item
- **WHEN** a user presses the backward navigation control
- **THEN** the presentation SHALL return to the previous slide (or the last page of the previous item if it was paginated)

#### Scenario: Navigating through paginated slides before the next item
- **WHEN** a song has 3 pages of lyrics and the user is on page 1
- **THEN** pressing forward SHALL show page 2, then page 3, and then pressing forward again SHALL advance to the next program item

#### Scenario: Current position is indicated
- **WHEN** the presentation is showing a slide
- **THEN** the system SHALL display an indicator of the current position within the overall program (e.g., item number or progress bar)

---

### Requirement: Participant and conductor information SHALL be displayed on each slide
Each slide in presentation mode SHALL display the name of the assigned participant for the current program item, if one is assigned. The worship leader (conductor) information SHALL also be visible on slides. This allows the congregation and team to know who is leading each element of the service.

#### Scenario: Slide shows assigned participant
- **WHEN** a program item with an assigned participant named "Marie Dupont" is displayed in presentation mode
- **THEN** the slide SHALL show "Marie Dupont" as the participant for that item

#### Scenario: Slide shows conductor information
- **WHEN** the service program has an assigned worship leader named "Jean Martin"
- **THEN** each slide in the presentation SHALL display the conductor's name and/or avatar

#### Scenario: Slide with no assigned participant
- **WHEN** a program item without an assigned participant is displayed in presentation mode
- **THEN** the slide SHALL gracefully omit the participant area without displaying empty or broken content, while the conductor information SHALL still be visible

---

### Requirement: YouTube videos SHALL be playable as embedded content in presentation mode
When a program item has a linked YouTube video resource, the presentation mode SHALL embed the YouTube video player directly into the slide. The video MUST be playable within the full-screen presentation without leaving the application. The system SHALL display the video at an appropriate size for projection.

#### Scenario: Displaying an embedded YouTube video
- **WHEN** a program item with a linked YouTube video is shown in presentation mode
- **THEN** the slide SHALL display an embedded YouTube video player that the user can play, pause, and control

#### Scenario: Playing a YouTube video in full-screen presentation
- **WHEN** a user plays a YouTube video embedded in a presentation slide
- **THEN** the video SHALL play within the presentation view without navigating away from the application or exiting full-screen mode

#### Scenario: Program item without a YouTube link
- **WHEN** a program item that has no linked YouTube video is displayed in presentation mode
- **THEN** no video player SHALL be shown and the slide SHALL display the item's other content (lyrics, notes, verses) normally

---

### Requirement: Long passages SHALL be paginated across multiple slides
For any content type (lyrics, bible verses, notes) that exceeds the visible area of a single presentation slide, the system SHALL automatically paginate the content across multiple slides. Pagination MUST split content at natural boundaries: between stanzas for lyrics, between verses for bible text, and between paragraphs for notes. The system SHALL ensure no content is truncated or lost due to pagination.

#### Scenario: Long lyrics paginated across slides
- **WHEN** a song has lyrics containing 6 stanzas that cannot fit on a single slide
- **THEN** the system SHALL distribute the stanzas across multiple slides, keeping complete stanzas together on each slide

#### Scenario: Long bible passage paginated across slides
- **WHEN** a bible reference "Psaume 119:1-30" produces verse text exceeding one slide
- **THEN** the system SHALL paginate the verses across multiple slides, splitting only at verse boundaries so no verse is split across slides

#### Scenario: All content is preserved after pagination
- **WHEN** a long passage is paginated into multiple slides
- **THEN** the concatenation of all paginated slides' content SHALL equal the complete original passage with no text missing or duplicated

#### Scenario: Short content does not paginate
- **WHEN** a program item's content (lyrics, verses, or notes) fits within a single slide
- **THEN** the system SHALL display all content on one slide without any pagination indicators or unnecessary splitting
