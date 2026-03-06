### Requirement: French bible reference parsing SHALL support abbreviations and variants for all 66 books
The system SHALL parse bible references written in French, supporting full book names, standard French abbreviations, and common variants for all 66 books of the Bible. The parser MUST correctly handle references in the following formats: "Psaume 23:1-6" (full name), "1 Corinthiens 13:4-7" (numbered book with full name), "Gen 1:1" (abbreviation), and similar patterns. The parser SHALL extract the book name, chapter number, and verse range (single verse or verse range) from each reference. The parser MUST handle books with numeric prefixes (e.g., "1 Corinthiens", "2 Timothee", "3 Jean") and books with single-chapter structures (e.g., "Jude", "Philemon").

#### Scenario: Parsing a full book name with chapter and verse range
- **WHEN** a user enters the bible reference "Psaume 23:1-6"
- **THEN** the system SHALL parse it as book "Psaumes", chapter 23, verses 1 through 6

#### Scenario: Parsing a numbered book with full name
- **WHEN** a user enters the bible reference "1 Corinthiens 13:4-7"
- **THEN** the system SHALL parse it as book "1 Corinthiens", chapter 13, verses 4 through 7

#### Scenario: Parsing an abbreviated book name
- **WHEN** a user enters the bible reference "Gen 1:1"
- **THEN** the system SHALL parse it as book "Genese", chapter 1, verse 1

#### Scenario: Parsing a single verse reference
- **WHEN** a user enters the bible reference "Jean 3:16"
- **THEN** the system SHALL parse it as book "Jean", chapter 3, verse 16 (single verse, not a range)

#### Scenario: Parsing a reference with accented characters
- **WHEN** a user enters the bible reference "Deuteronome 6:4-9" or "Deuteronome 6:4-9"
- **THEN** the system SHALL correctly parse the reference regardless of whether accents are included or omitted

#### Scenario: Handling an unrecognized reference
- **WHEN** a user enters an invalid or unrecognizable bible reference such as "Foobar 1:1"
- **THEN** the system SHALL indicate that the reference could not be parsed and SHALL NOT attempt to fetch verses

---

### Requirement: Verses SHALL be fetched automatically from the bolls.life API using the Louis Segond 1910 translation
When a valid bible reference is parsed, the system SHALL automatically fetch the corresponding verses from the bolls.life API using the Louis Segond 1910 (LSG) translation. The fetch MUST be triggered when a bible reference is entered or modified on a program item or sub-item. The system SHALL handle API errors gracefully, displaying an appropriate message if verses cannot be retrieved. Fetched verse content SHALL be cached or stored to minimize redundant API calls.

#### Scenario: Fetching verses for a valid reference
- **WHEN** a user enters the bible reference "Romains 8:28-30" on a program item
- **THEN** the system SHALL call the bolls.life API requesting the LSG translation for Romans chapter 8, verses 28 through 30, and SHALL display the returned verse text

#### Scenario: Fetching a single verse
- **WHEN** a user enters the bible reference "Jean 3:16" on a program item
- **THEN** the system SHALL fetch and display the single verse text from the bolls.life API in the LSG translation

#### Scenario: Handling API unavailability
- **WHEN** a user enters a valid bible reference but the bolls.life API is unavailable or returns an error
- **THEN** the system SHALL display a user-friendly error message in French indicating that the verses could not be retrieved, and SHALL NOT crash or block the program editing workflow

#### Scenario: Updating verses when reference changes
- **WHEN** a user modifies an existing bible reference on a program item from "Jean 3:16" to "Jean 3:16-18"
- **THEN** the system SHALL fetch the updated verse range from the API and replace the previously displayed content with the newly fetched verses

---

### Requirement: Fetched verses SHALL be displayed with superscript verse numbers and elegant formatting
The system SHALL render fetched bible verses with each verse number displayed as a superscript preceding its verse text. The verse text MUST flow continuously as a formatted paragraph rather than one verse per line (unless a natural paragraph break exists in the source text). The formatting SHALL be visually consistent across program item detail views, the presentation mode, and text exports.

#### Scenario: Displaying verses with superscript numbers
- **WHEN** the system displays fetched verses for "Psaume 23:1-3"
- **THEN** each verse number (1, 2, 3) SHALL appear as a superscript immediately before its corresponding verse text, rendered inline as a continuous passage

#### Scenario: Displaying a single verse with superscript number
- **WHEN** the system displays a fetched single verse for "Jean 3:16"
- **THEN** the verse number 16 SHALL appear as a superscript before the verse text

#### Scenario: Verses render consistently in program detail and presentation mode
- **WHEN** a program item with bible verses is viewed in the program detail view and then opened in presentation mode
- **THEN** the verse formatting (superscript numbers, continuous text flow) SHALL be consistent in both views, adapted to the respective display context

---

### Requirement: Bible references SHALL be supported in both main program items and sub-items
The system SHALL allow attaching a bible reference to any main program item as well as to any sub-item within a hierarchical program structure. Each item and sub-item SHALL independently parse, fetch, and display its own bible reference. A parent item and its sub-items MAY each have different bible references simultaneously.

#### Scenario: Bible reference on a main program item
- **WHEN** an admin adds the bible reference "Romains 12:1-2" to a main program item of type "lecture biblique"
- **THEN** the system SHALL parse the reference, fetch the verses, and display them within that program item's detail view

#### Scenario: Bible reference on a sub-item
- **WHEN** an admin adds the bible reference "Philippiens 4:13" to a sub-item within a parent program item
- **THEN** the system SHALL parse and fetch the verses independently for the sub-item and display them within the sub-item's detail area

#### Scenario: Parent and sub-items with different references
- **WHEN** a parent item has the bible reference "Psaume 100:1-5" and its first sub-item has "Psaume 23:1-6" and its second sub-item has "Psaume 150:1-6"
- **THEN** each item and sub-item SHALL display its own fetched verses independently, without interference or overwriting

#### Scenario: Removing a bible reference from a sub-item
- **WHEN** an admin clears the bible reference from a sub-item that previously had "Jean 1:1" assigned
- **THEN** the sub-item SHALL no longer display any bible verse content, and the parent item's own reference (if any) SHALL remain unaffected
