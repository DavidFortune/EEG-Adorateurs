## Why

On the resource detail page, the "Ajouter un média" section groups YouTube and URL link into a single modal with a segment selector. YouTube is effectively hidden behind a tab, making it hard to discover. Since YouTube is a primary way users add content to resources, it deserves its own dedicated button — just as prominent as "Téléverser" or "Enregistrer audio".

## What Changes

- Split the current combined "Lien URL" modal into two separate flows:
  - A **YouTube** button that opens a dedicated modal with the YouTube search/preview/select experience (reusing `NaturalResourceSelector` in `selectOnly` mode)
  - A **Lien URL** button that opens a simple modal with a URL input form
- Remove the `ion-segment` tab switcher from the add media modal
- Each modal is focused on a single task, reducing cognitive load

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `resource-library`: The resource detail page media addition buttons change from a combined URL/YouTube modal to separate dedicated modals for each type

## Impact

- `src/views/resources/ResourceDetailPage.vue` — restructure the "Ajouter un média" buttons and split the combined modal into two
- `src/components/NaturalResourceSelector.vue` — reused in the YouTube modal (already supports `selectOnly` mode)
