## MODIFIED Requirements

### Requirement: The system SHALL provide in-app YouTube search and linking
Users MUST be able to search for YouTube videos directly within the application without leaving it. Search results SHALL display video thumbnails and titles. Users MUST be able to select a video from the results to link it to a resource as a YouTube media attachment. On the resource detail page, the YouTube search SHALL be accessible via a dedicated "YouTube" button in the "Ajouter un média" section, opening its own modal with the full search/preview/select experience.

#### Scenario: User searches for a YouTube video within the app
- **WHEN** a user opens the YouTube search interface and types a search query
- **THEN** the system SHALL query the YouTube Data API and display matching video results with thumbnails and titles

#### Scenario: User links a YouTube video to a resource
- **WHEN** a user selects a video from the YouTube search results
- **THEN** the system SHALL attach the YouTube video link as a media item on the current resource

#### Scenario: User adds YouTube media from the resource detail page
- **WHEN** an admin taps the "YouTube" button in the "Ajouter un média" section of the resource detail page
- **THEN** a dedicated YouTube modal SHALL open with the NaturalResourceSelector search interface
- **AND** the URL and YouTube flows SHALL NOT share the same modal

## ADDED Requirements

### Requirement: URL and YouTube media addition SHALL have separate dedicated buttons and modals on the resource detail page
The "Ajouter un média" section on the resource detail page MUST present "Lien URL" and "YouTube" as separate buttons, each opening its own focused modal. The URL modal SHALL contain only the URL input form. The YouTube modal SHALL contain the YouTube search/preview/select interface (NaturalResourceSelector in select-only mode). No segment switcher or tab navigation SHALL be used to switch between URL and YouTube within a single modal.

#### Scenario: Admin sees separate URL and YouTube buttons
- **WHEN** an admin views the resource detail page
- **THEN** the "Ajouter un média" section SHALL display separate "Lien URL" and "YouTube" buttons

#### Scenario: Admin adds a URL via the dedicated URL modal
- **WHEN** an admin taps the "Lien URL" button
- **THEN** a modal SHALL open with a URL input field and an optional name field
- **AND** no YouTube tab or segment SHALL be present in this modal

#### Scenario: Admin adds a YouTube video via the dedicated YouTube modal
- **WHEN** an admin taps the "YouTube" button
- **THEN** a modal SHALL open with the YouTube search interface (NaturalResourceSelector)
- **AND** no URL input tab or segment SHALL be present in this modal
