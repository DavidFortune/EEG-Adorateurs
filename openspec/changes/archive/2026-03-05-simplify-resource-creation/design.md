## Context

The resource creation flow in `ResourceFormPage.vue` currently creates a resource shell (title + optional metadata) and redirects to the resource list. Users must then navigate to `ResourceDetailPage.vue` to add actual content — lyrics, YouTube videos, audio files, PDF scores, etc. This two-phase, multi-screen flow makes creating a complete resource unnecessarily cumbersome.

The form also displays 4 music metadata fields (key, beat, tempo, style) at all times, even for non-musical resources like announcements or readings, adding visual noise.

Collection creation uses a nested modal pattern (collection selector modal → create collection modal), which is disorienting on mobile.

## Goals / Non-Goals

**Goals:**
- Reduce resource creation to a single screen by integrating media/content addition into `ResourceFormPage.vue`
- Collapse music metadata behind a toggle to reduce form clutter
- Flatten the collection creation flow to remove nested modals
- Navigate to the detail page (not the list) after creation so users can immediately review their resource

**Non-Goals:**
- Redesigning the resource detail page
- Changing the data model (`Resource`, `ResourceMedia` types)
- Modifying the quick selection bottom sheet (`ResourceBottomSheet.vue`)
- Changing the `ResourceSelector.vue` quick-create tab (it's already streamlined)
- Adding new resource types or fields

## Decisions

**Decision 1: Add a "Content" section to ResourceFormPage.vue below the basic fields**

The form will gain a new section after "Notes" where users can add media items. Each media item will be a card showing its type icon, title/preview, and a remove button. An "Add content" button will open a type picker (lyrics, YouTube, audio, file, etc.) and the appropriate input for each type.

For YouTube, the existing `NaturalResourceSelector` component is reused in `selectOnly` mode. This gives users the full YouTube search, preview, and selection experience (consistent with other parts of the app) instead of a plain URL input. The label reads "Insérer le lien ou rechercher une vidéo". If lyrics are entered in the selector, they are also added as a separate LYRICS content item.

Rationale: This keeps all resource creation in one screen. The existing `ResourceMedia` type and `createResource()` function already support a `contents` array — we just need to populate it before saving instead of after. Reusing `NaturalResourceSelector` avoids duplicating YouTube search logic and ensures a consistent UX.

Alternative considered: A wizard/stepper flow (basic info → content → review). Rejected because it adds steps rather than reducing them. A plain YouTube URL input was initially implemented but replaced with the full search experience for better usability.

**Decision 2: Wrap music metadata in an `ion-accordion` with a toggle**

The 4 music fields (key, beat, tempo, style) will be placed inside a collapsible `ion-accordion-group` defaulting to collapsed. The header will show "Propriétés musicales" with the number of filled fields as a badge when collapsed.

Rationale: Ionic's accordion component is already available in the project. This preserves all functionality while hiding complexity for non-musical resources.

Alternative considered: Moving music metadata to a separate modal. Rejected because it adds another modal to the flow.

**Decision 3: Replace nested collection modals with a single modal containing an embedded create form**

Instead of opening a modal that opens another modal, the collection selector uses a single modal with two views: a collection list view and an inline create form view. The list displays collections as full-width items with circular color avatars (showing the collection symbol) on the left and a checkmark for the selected collection. A "Nouvelle collection" button at the top switches to the create form view; a back arrow returns to the list.

Rationale: Eliminates modal nesting entirely. The single modal with view switching feels natural and makes good use of the modal width. Color avatars provide a visual anchor consistent with how collections are displayed elsewhere in the app.

**Decision 4: After creation, navigate to `/resource-detail/{id}` instead of `/resources`**

The `saveResource()` function will route to the new resource's detail page after successful creation, so users can immediately see the complete resource with all content they just added.

Rationale: Users expect to see the result of their work. Navigating to the list forces them to find and open the resource they just created.

## Risks / Trade-offs

- [Risk] Larger form page may feel overwhelming on small screens → Mitigation: sections are collapsible; content items are compact cards; the form scrolls naturally
- [Risk] Inline collection creation may be cramped on narrow devices → Mitigation: fallback to single modal with embedded create form if needed
- [Trade-off] More logic in ResourceFormPage vs. current separation of concerns → Accepted: the user experience improvement outweighs code complexity
