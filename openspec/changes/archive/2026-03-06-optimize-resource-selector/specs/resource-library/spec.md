## MODIFIED Requirements

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

## ADDED Requirements

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
