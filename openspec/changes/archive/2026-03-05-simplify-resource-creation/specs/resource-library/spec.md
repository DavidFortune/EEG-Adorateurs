## ADDED Requirements

### Requirement: Resource creation form SHALL allow adding media content inline
The resource creation form MUST include a "Contenu" section where users can add media items (lyrics, YouTube links, audio, video, PDF scores, files, URLs) directly during resource creation. Users MUST NOT be required to navigate to a separate page to add content to a newly created resource.

#### Scenario: User adds lyrics during resource creation
- **WHEN** a user is creating a new resource and taps "Ajouter du contenu" then selects "Paroles"
- **THEN** a lyrics text area SHALL appear in the form
- **AND** the entered lyrics SHALL be saved as a media attachment when the resource is created

#### Scenario: User adds a YouTube link during resource creation
- **WHEN** a user is creating a new resource and taps "Ajouter du contenu" then selects "YouTube"
- **THEN** the YouTube search interface (NaturalResourceSelector in select-only mode) SHALL appear inline with the label "Insérer le lien ou rechercher une vidéo"
- **AND** the user SHALL be able to search YouTube videos, preview them, and select one
- **AND** the selected video SHALL be added to the resource's contents array on save
- **AND** if lyrics were entered in the selector, they SHALL also be added as a separate LYRICS content item

#### Scenario: User adds multiple content items during creation
- **WHEN** a user adds both lyrics and a YouTube link to a new resource before saving
- **THEN** the resource SHALL be created with both media items in its contents array

#### Scenario: User creates a resource without adding content
- **WHEN** a user fills in the title but does not add any content items
- **THEN** the resource SHALL be created successfully with an empty contents array
- **AND** no validation error SHALL occur

### Requirement: Music metadata SHALL be collapsible
The four music metadata fields (key, time signature, tempo, style) MUST be placed inside a collapsible section that defaults to collapsed. The section header MUST display the count of filled fields when collapsed.

#### Scenario: Music metadata section is collapsed by default
- **WHEN** a user opens the resource creation form
- **THEN** the music metadata fields SHALL be hidden inside a collapsed section labeled "Propriétés musicales"

#### Scenario: User expands music metadata section
- **WHEN** a user taps the "Propriétés musicales" section header
- **THEN** the four music metadata fields (key, time signature, tempo, style) SHALL become visible

#### Scenario: Collapsed section shows count of filled fields
- **WHEN** a user has filled 2 of 4 music metadata fields and collapses the section
- **THEN** the section header SHALL display a badge indicating "2/4"

### Requirement: Collection creation SHALL be flattened without nested modals
Creating a new collection during resource creation MUST NOT require opening a modal inside another modal. The collection creation form MUST be accessible inline or within a single-level modal.

#### Scenario: User creates a collection inline
- **WHEN** a user taps "Nouvelle collection" in the collection selector modal
- **THEN** the modal SHALL switch to a collection creation form (name, symbol, color, description) with a back arrow to return to the list
- **AND** no additional modal SHALL be opened on top of the current one

#### Scenario: Collection selector displays collections with color avatars
- **WHEN** the collection selector modal is open
- **THEN** each collection SHALL be displayed as a full-width list item with a circular color avatar (showing the collection symbol) on the left
- **AND** the selected collection SHALL be highlighted with a checkmark icon on the right

#### Scenario: Newly created collection is auto-selected
- **WHEN** a user completes the inline collection creation form and confirms
- **THEN** the new collection SHALL be automatically selected for the resource being created
- **AND** the collection creation form SHALL close

### Requirement: Resource creation SHALL navigate to detail page after save
After successfully creating a new resource, the system MUST navigate the user to the newly created resource's detail page, not to the resource list.

#### Scenario: User saves a new resource
- **WHEN** a user completes the resource creation form and saves
- **THEN** the system SHALL navigate to `/resource-detail/{newResourceId}`
- **AND** the user SHALL immediately see the complete resource with all content they added

#### Scenario: User saves an edited resource
- **WHEN** a user edits an existing resource and saves
- **THEN** the system SHALL navigate to `/resource-detail/{resourceId}`

## MODIFIED Requirements

### Requirement: NaturalResourceSelector SHALL support a select-only mode
The NaturalResourceSelector component MUST support a `selectOnly` prop that, when true, emits a `video-selected` event with video details (videoId, title, thumbnail, channel, videoUrl, lyrics) instead of creating a Firebase resource. This allows the component to be reused in contexts where the caller manages resource creation (e.g., inline content addition in the resource form).

### Requirement: The system SHALL support multiple resource types
The system MUST support the following resource types: lyrics (paroles), video, audio, PDF score (partition PDF), YouTube link, Spotify link, file, and URL. Each resource type MUST be distinguishable by its type identifier and rendered with appropriate UI controls for its content. Media of any supported type MUST be addable both during resource creation (on the form page) and during resource editing (on the detail page).

#### Scenario: User creates a lyrics resource
- **WHEN** a user creates a resource of type lyrics
- **THEN** the system SHALL store and display the lyrics text content

#### Scenario: User creates a PDF score resource
- **WHEN** a user creates a resource of type PDF score
- **THEN** the system SHALL accept a PDF file upload and display it using the PDF viewer

#### Scenario: User creates a YouTube link resource
- **WHEN** a user creates a resource of type YouTube link
- **THEN** the system SHALL accept a YouTube URL and display an embedded video player

#### Scenario: User creates a Spotify link resource
- **WHEN** a user creates a resource of type Spotify link
- **THEN** the system SHALL accept a Spotify URL and store it as a playable link

#### Scenario: User creates an audio resource
- **WHEN** a user creates a resource of type audio
- **THEN** the system SHALL accept an audio file and provide playback controls

#### Scenario: User creates a video resource
- **WHEN** a user creates a resource of type video
- **THEN** the system SHALL accept a video file and provide playback controls

#### Scenario: User creates a file resource
- **WHEN** a user creates a resource of type file
- **THEN** the system SHALL accept any file upload and provide a download link

#### Scenario: User creates a URL resource
- **WHEN** a user creates a resource of type URL
- **THEN** the system SHALL accept a web URL and display it as a clickable external link

#### Scenario: User adds media during resource creation
- **WHEN** a user adds a media item of any supported type on the resource creation form
- **THEN** the media SHALL be included in the resource's contents array when saved
