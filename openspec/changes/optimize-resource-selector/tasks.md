## 1. Remove segment tabs and restructure browse view

- [x] 1.1 Remove the `ion-segment` tab bar (Existantes/YouTube/Créer) and `activeTab` state from the template and script
- [x] 1.2 Show existing resources content directly (search bar + resource list) as the default view without tab wrapping
- [x] 1.3 Add a `mode` ref (`'browse' | 'create'`) and conditionally render browse vs create views
- [x] 1.4 Add a "Créer une ressource" button below the resource list in browse view

## 2. Replace collection filter with ion-select dropdown

- [x] 2.1 Replace the collection filter `ion-segment` with an `ion-select` dropdown showing full collection names
- [x] 2.2 Add a "Toutes les collections" default option that shows all resources (value: empty string)

## 3. Build inline creation form

- [x] 3.1 Add create view template with back arrow header, title input, collection `ion-select`, and reference input
- [x] 3.2 Add music properties section (key, beat, tempo, style) in a collapsible `ion-accordion` matching ResourceFormPage
- [x] 3.3 Add content section with "Ajouter du contenu" button and action sheet for content type selection (lyrics, YouTube, audio, URL)
- [x] 3.4 Add inline content editors: lyrics textarea, NaturalResourceSelector (selectOnly) for YouTube
- [x] 3.5 Add form state refs and validation for the inline creation form

## 4. Inline creation save and auto-select flow

- [x] 4.1 Implement save handler that creates the resource via `createResource`, reloads the list, auto-selects the new resource, and swaps back to browse mode
- [x] 4.2 Wire the back arrow to discard form data and return to browse mode

## 5. Cleanup and modal adjustments

- [x] 5.1 Remove the old quick create form template, styles, and related script code (`quickCreateForm`, `handleQuickCreate`, `changeTab`)
- [x] 5.2 Update the modal header to show "Sélectionner une ressource" in browse mode and "Créer une ressource" with back arrow in create mode
- [x] 5.3 Update footer: show confirm/cancel buttons only in browse mode, show save/cancel in create mode
- [x] 5.4 Clean up unused CSS (tab-specific styles, old create form styles)
