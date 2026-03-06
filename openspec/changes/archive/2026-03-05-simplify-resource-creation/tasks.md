## 1. Collapsible Music Metadata

- [x] 1.1 Wrap the 4 music metadata fields (key, beat, tempo, style) in an `ion-accordion-group` / `ion-accordion` in `ResourceFormPage.vue`, defaulting to collapsed
- [x] 1.2 Add a badge to the accordion header showing the count of filled music fields (e.g., "2/4") when collapsed

## 2. Inline Content/Media Section

- [x] 2.1 Add a "Contenu" section below Notes in `ResourceFormPage.vue` with an "Ajouter du contenu" button that opens a type picker (lyrics, YouTube, audio, video, PDF, file, URL)
- [x] 2.2 Implement inline lyrics input: when "Paroles" is selected, show a textarea that populates a `ResourceMedia` entry of type `LYRICS`
- [x] 2.3 Implement inline YouTube linking: when "YouTube" is selected, show `NaturalResourceSelector` in `selectOnly` mode (label: "Insérer le lien ou rechercher une vidéo"); handle `video-selected` event to add video + optional lyrics as `ResourceMedia` entries
- [x] 2.4 Implement inline file/audio/video/PDF upload: when a file-based type is selected, show a file picker and add the uploaded file as a `ResourceMedia` entry
- [x] 2.5 Implement inline URL input: when "URL" is selected, show a URL text input that populates a `ResourceMedia` entry
- [x] 2.6 Display added content items as compact cards (type icon, title/preview, remove button) in the Contenu section
- [x] 2.7 Wire the contents array into `saveResource()` so media items are included in the `createResource()` call

## 3. Flatten Collection Creation

- [x] 3.1 Replace the nested collection modals with a single modal containing two views (list with color avatars + embedded create form with back arrow), no modal-in-modal
- [x] 3.2 Auto-select the newly created collection after inline creation

## 4. Post-Creation Navigation

- [x] 4.1 Change `saveResource()` to navigate to `/resource-detail/{id}` after creating a new resource (instead of `/resources`)
- [x] 4.2 Keep existing behavior for edits: navigate to `/resource-detail/{id}` after saving an edit

## 5. Verification

- [x] 5.1 Verify a resource can be created with title + lyrics + YouTube link in a single form submission *(manual)*
- [x] 5.2 Verify music metadata accordion collapses/expands correctly and shows filled field count *(manual)*
- [x] 5.3 Verify collection creation works without nested modals *(manual)*
- [x] 5.4 Verify post-creation navigation goes to the detail page *(manual)*
- [x] 5.5 Verify creating a resource without content still works (empty contents array) *(manual)*
