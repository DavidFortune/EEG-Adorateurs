### Requirement: Resource collections SHALL be organized by scope with distinct symbols and colors
The system SHALL support four collection scopes: global, per team, per service, and personal. Each collection MUST be visually identified by a unique symbol and color. Global collections SHALL be accessible to all users. Team collections SHALL be scoped to the members of that team. Service collections SHALL be scoped to a specific service. Personal collections SHALL be private to the user who created them.

#### Scenario: Global collection is accessible to all users
- **WHEN** an administrator creates a resource in a global collection
- **THEN** the resource SHALL be visible to all authenticated users
- **AND** the collection SHALL display its assigned symbol and color

#### Scenario: Team collection is scoped to team members
- **WHEN** a resource is added to a team collection
- **THEN** only members of that team SHALL see the resource in their library
- **AND** the collection SHALL display a symbol and color distinct from other collection scopes

#### Scenario: Service collection is scoped to a specific service
- **WHEN** a resource is added to a service collection
- **THEN** the resource SHALL appear in the resources tab of that service
- **AND** the collection SHALL display its assigned symbol and color

#### Scenario: Personal collection is private to the owner
- **WHEN** a user creates a resource in their personal collection
- **THEN** only that user SHALL be able to view the resource
- **AND** the collection SHALL display its assigned symbol and color

---

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

---

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

---

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

---

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

---

### Requirement: Resource creation SHALL navigate to detail page after save
After successfully creating a new resource, the system MUST navigate the user to the newly created resource's detail page, not to the resource list.

#### Scenario: User saves a new resource
- **WHEN** a user completes the resource creation form and saves
- **THEN** the system SHALL navigate to `/resource-detail/{newResourceId}`
- **AND** the user SHALL immediately see the complete resource with all content they added

#### Scenario: User saves an edited resource
- **WHEN** a user edits an existing resource and saves
- **THEN** the system SHALL navigate to `/resource-detail/{resourceId}`

---

### Requirement: NaturalResourceSelector SHALL support a select-only mode
The NaturalResourceSelector component MUST support a `selectOnly` prop that, when true, emits a `video-selected` event with video details (videoId, title, thumbnail, channel, videoUrl, lyrics) instead of creating a Firebase resource. This allows the component to be reused in contexts where the caller manages resource creation (e.g., inline content addition in the resource form).

---

### Requirement: A resource SHALL support multiple media attachments
A single resource MUST be able to contain multiple media items of different types simultaneously. For example, a song resource SHALL be able to contain lyrics, a YouTube video, a PDF score, and an audio track all at once. Each media attachment MUST be independently viewable within the resource detail view.

#### Scenario: Song resource contains lyrics, YouTube video, PDF score, and audio
- **WHEN** a user views a song resource that has lyrics, a YouTube video, a PDF score, and an audio track attached
- **THEN** the system SHALL display all four media items within the resource detail view
- **AND** each media item SHALL be independently accessible

#### Scenario: User adds a second media attachment to an existing resource
- **WHEN** a user adds an audio track to a resource that already contains lyrics
- **THEN** the resource SHALL contain both the lyrics and the audio track
- **AND** neither attachment SHALL be removed or replaced

---

### Requirement: Resources SHALL support musical metadata
Each resource MUST support the following musical metadata fields: key (tonalite), time signature (mesure), tempo, and style. These fields SHALL be optional and editable. Musical metadata MUST be displayed on the resource detail view and SHALL be searchable.

#### Scenario: User sets musical metadata on a resource
- **WHEN** a user sets the key to "Do majeur", the time signature to "4/4", the tempo to "120 BPM", and the style to "Louange" on a resource
- **THEN** the resource detail view SHALL display all four metadata values

#### Scenario: Musical metadata fields are optional
- **WHEN** a user creates a resource without specifying any musical metadata
- **THEN** the resource SHALL be created successfully with empty metadata fields
- **AND** no validation error SHALL occur

---

### Requirement: The system SHALL provide full-text search with smart suggestions
The resource library MUST provide full-text search across resource titles, tags, and notes. The search MUST return results as the user types. The system SHALL provide smart suggestions based on partial input to help users find resources quickly.

#### Scenario: User searches by title
- **WHEN** a user types a partial resource title in the search field
- **THEN** the system SHALL return all resources whose titles match the search query
- **AND** results SHALL update as the user continues typing

#### Scenario: User searches by tag
- **WHEN** a user types a tag name in the search field
- **THEN** the system SHALL return all resources that have a matching tag

#### Scenario: User searches by notes content
- **WHEN** a user types text that appears in a resource's notes field
- **THEN** the system SHALL return resources whose notes contain the matching text

#### Scenario: Smart suggestions appear during search
- **WHEN** a user begins typing in the search field
- **THEN** the system SHALL display smart suggestions based on the partial input
- **AND** suggestions MUST include matching titles, tags, and notes

---

### Requirement: The system SHALL support integrated audio and video recording
Users MUST be able to record audio or video directly from within the application. Recorded media SHALL be saved as a media attachment on a resource. The recording interface MUST provide start, stop, and cancel controls.

#### Scenario: User records audio from the app
- **WHEN** a user initiates an audio recording from the resource creation or editing interface
- **THEN** the system SHALL capture audio using the device microphone
- **AND** upon stopping the recording, the audio file SHALL be attached to the resource

#### Scenario: User records video from the app
- **WHEN** a user initiates a video recording from the resource creation or editing interface
- **THEN** the system SHALL capture video using the device camera
- **AND** upon stopping the recording, the video file SHALL be attached to the resource

#### Scenario: User cancels a recording
- **WHEN** a user cancels an in-progress recording
- **THEN** no media file SHALL be saved or attached to the resource

---

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

---

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

---

### Requirement: The PDF viewer SHALL display scores with page navigation
The system MUST provide a built-in PDF viewer for displaying score (partition) resources. The viewer SHALL support page-by-page navigation. Users MUST be able to navigate forward and backward through the pages of a multi-page PDF.

#### Scenario: User views a single-page PDF score
- **WHEN** a user opens a PDF score resource that contains one page
- **THEN** the PDF viewer SHALL display the full page content
- **AND** no page navigation controls SHALL be active

#### Scenario: User navigates a multi-page PDF score
- **WHEN** a user opens a PDF score resource that contains multiple pages
- **THEN** the PDF viewer SHALL display the first page by default
- **AND** the user SHALL be able to navigate to subsequent pages using forward and backward controls

#### Scenario: User reaches the last page of a PDF score
- **WHEN** a user navigates to the last page of a multi-page PDF score
- **THEN** the forward navigation control SHALL be disabled
- **AND** the backward navigation control SHALL remain active

---

### Requirement: Quick selection SHALL provide a bottom sheet with tabbed navigation
The ResourceSelector component MUST present a single-view modal for resource selection. The default view (browse mode) SHALL display a search bar, a collection dropdown filter, and the full resource list. A "Créer une ressource" button SHALL be displayed below the resource list to allow inline creation. No segment tabs SHALL be used to switch between selection and creation views.

#### Scenario: User opens the resource selector modal
- **WHEN** the user opens the ResourceSelector modal
- **THEN** the modal SHALL display the browse view directly with a search bar, a collection dropdown, and the list of existing resources
- **AND** no segment tabs (Existantes, YouTube, Créer) SHALL be shown

#### Scenario: User filters resources by collection using dropdown
- **WHEN** the user taps the collection dropdown in the browse view
- **THEN** an `ion-select` dropdown SHALL display all available collections by full name
- **AND** a "Toutes les collections" option SHALL be listed as the default selection
- **AND** selecting a collection SHALL filter the resource list to show only resources from that collection

#### Scenario: User searches for a resource
- **WHEN** the user types in the search bar in the browse view
- **THEN** the resource list SHALL filter to show only resources matching the search query
- **AND** results SHALL update as the user types

#### Scenario: User selects an existing resource
- **WHEN** the user taps a resource in the browse view
- **THEN** the resource SHALL be marked as selected
- **AND** the user SHALL be able to confirm the selection

#### Scenario: User initiates inline resource creation
- **WHEN** the user taps the "Créer une ressource" button in the browse view
- **THEN** the modal content SHALL swap to the creation form view
- **AND** a back arrow SHALL be displayed in the header to return to the browse view

---

### Requirement: Inline resource creation SHALL provide the same fields as the Resources section
When the user switches to the creation view within the ResourceSelector modal, the form SHALL include: title, collection selector (ion-select dropdown), reference, music properties (key, beat, tempo, style) in a collapsible section, and a content section with action buttons for adding lyrics, YouTube video, audio, or URL. After saving, the new resource SHALL be auto-selected and the view SHALL swap back to the browse list.

#### Scenario: User creates a resource inline with title and collection
- **WHEN** the user fills in the title and selects a collection in the inline creation form
- **THEN** the user SHALL be able to save the resource
- **AND** the newly created resource SHALL be automatically selected in the browse view
- **AND** the modal SHALL swap back to the browse view showing the selection

#### Scenario: User adds music properties during inline creation
- **WHEN** the user expands the music properties section in the inline creation form
- **THEN** the form SHALL display fields for key, beat, tempo, and style
- **AND** these fields SHALL use `ion-select` dropdowns matching the ResourceFormPage behavior

#### Scenario: User adds content during inline creation
- **WHEN** the user taps "Ajouter du contenu" in the inline creation form
- **THEN** the form SHALL present content type options (lyrics, YouTube, audio, URL)
- **AND** selecting YouTube SHALL display the NaturalResourceSelector in select-only mode
- **AND** the content SHALL be included in the resource when saved

#### Scenario: User cancels inline creation
- **WHEN** the user taps the back arrow during inline creation
- **THEN** the modal SHALL swap back to the browse view
- **AND** any unsaved form data SHALL be discarded

#### Scenario: Inline creation auto-selects and stays in modal
- **WHEN** the user saves a new resource via the inline creation form
- **THEN** the system SHALL NOT navigate to the resource detail page
- **AND** the new resource SHALL appear in the browse list and be auto-selected
- **AND** the user SHALL remain in the ResourceSelector modal to confirm the selection

---

### Requirement: Resource creation flows SHALL prevent duplicate submissions
All resource creation UI flows MUST disable the submit/create button while the creation operation is in progress. The button MUST remain disabled from the moment the user clicks it until the async operation completes (success or failure). The loading state MUST be reset in a `finally` block to guarantee cleanup.

#### Scenario: User double-clicks save on ResourceFormPage
- **WHEN** user clicks the save button on ResourceFormPage
- **THEN** the button SHALL be immediately disabled
- **AND** it SHALL remain disabled until the save operation completes or fails
- **AND** only one resource SHALL be created in Firestore

#### Scenario: User double-clicks create on ResourceBottomSheet
- **WHEN** user clicks "Creer et lier" on ResourceBottomSheet
- **THEN** the button SHALL be immediately disabled
- **AND** it SHALL remain disabled until the creation operation completes or fails
- **AND** only one resource SHALL be created in Firestore

#### Scenario: User double-clicks create on ResourceSelector
- **WHEN** user clicks "Creer et lier" on ResourceSelector
- **THEN** the button SHALL be immediately disabled (already implemented via `creatingResource` guard)
- **AND** only one resource SHALL be created in Firestore

#### Scenario: User double-clicks create on NaturalResourceSelector
- **WHEN** user clicks the create button on NaturalResourceSelector
- **THEN** the button SHALL be immediately disabled (already implemented via `creating` guard)
- **AND** only one resource SHALL be created in Firestore
