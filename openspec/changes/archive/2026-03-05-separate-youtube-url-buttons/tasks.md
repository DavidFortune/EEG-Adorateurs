## 1. Add YouTube button and modal

- [x] 1.1 Add a "YouTube" button (with `logoYoutube` icon) to the "Ajouter un média" buttons row in `ResourceDetailPage.vue`
- [x] 1.2 Add a new YouTube modal that embeds `<NaturalResourceSelector :select-only="true" />` and import the component
- [x] 1.3 Handle the `video-selected` event to add the YouTube media to the resource's contents array (same save logic as existing YouTube code)

## 2. Simplify URL modal

- [x] 2.1 Remove the `ion-segment` switcher from the existing add media modal
- [x] 2.2 Remove the YouTube search/preview/select code from the URL modal (it now lives in the YouTube modal via NaturalResourceSelector)
- [x] 2.3 Clean up unused state variables related to the old combined modal (YouTube search results, selected video, preview state, etc.)

## 3. Verification

- [x] 3.1 Verify the "YouTube" button opens a dedicated modal with search/preview/select *(manual)*
- [x] 3.2 Verify the "Lien URL" button opens a simple URL-only modal without YouTube tab *(manual)*
- [x] 3.3 Verify adding a YouTube video from the new modal saves correctly to the resource *(manual)*
- [x] 3.4 Verify adding a URL from the simplified modal still works correctly *(manual)*
