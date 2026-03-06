## Context

The resource detail page (`ResourceDetailPage.vue`) has an "Ajouter un média" section with 4 buttons: "Lien URL", "Téléverser", "Enregistrer audio", "Enregistrer vidéo". The "Lien URL" button opens a modal that contains an `ion-segment` with two tabs: "Lien URL" and "YouTube". This means YouTube is hidden behind a secondary navigation element inside the modal.

The `NaturalResourceSelector` component already supports a `selectOnly` mode that emits a `video-selected` event, which was recently added for the resource creation form. This same component can be reused here.

## Goals / Non-Goals

**Goals:**
- Give YouTube its own top-level button in the "Ajouter un média" section
- Give URL its own dedicated modal (no longer sharing with YouTube)
- Reuse `NaturalResourceSelector` in `selectOnly` mode for the YouTube modal
- Keep the same functionality — just reorganize the UI

**Non-Goals:**
- Changing the file upload, audio recording, or video recording flows
- Modifying the `NaturalResourceSelector` component itself
- Changing how media is stored or displayed after addition

## Decisions

**Decision 1: Add a dedicated "YouTube" button to the add media buttons row**

Add a fifth button labeled "YouTube" with the `logoYoutube` icon alongside the existing buttons. This makes YouTube a first-class media addition option, equally visible to URL, upload, and recording.

Rationale: YouTube is one of the most common media types users add. Hiding it behind a tab inside another modal adds friction.

**Decision 2: Reuse `NaturalResourceSelector` in the YouTube modal**

The YouTube modal will embed `<NaturalResourceSelector :select-only="true" />` and handle the `video-selected` event to add the YouTube media to the resource. This is the same pattern used in `ResourceFormPage.vue`.

Rationale: The component already has all the YouTube search, preview, and selection logic. No need to maintain duplicate implementations.

Alternative considered: Keep the existing inline YouTube search code in ResourceDetailPage. Rejected because it duplicates logic and won't benefit from future improvements to NaturalResourceSelector.

**Decision 3: Simplify the URL modal by removing the segment switcher**

The existing "Ajouter un média" modal currently has an `ion-segment` to switch between URL and YouTube. Since YouTube gets its own modal, the URL modal becomes a simple form: URL input + optional name + submit button. No segment needed.

Rationale: A focused single-purpose modal is simpler and faster to use.

## Risks / Trade-offs

- [Risk] Adding a 5th button to the row may feel crowded on small screens → Mitigation: buttons already use `size="small"` and wrap naturally; the YouTube button fits the existing pattern
- [Trade-off] Two modals instead of one combined modal → Accepted: each modal is simpler and more focused; net UX improvement
