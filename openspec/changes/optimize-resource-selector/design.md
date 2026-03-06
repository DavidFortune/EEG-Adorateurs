## Context

The ResourceSelector component (`ResourceSelector.vue`, ~600 lines) is used in the service program editor to link resources to items and sub-items. It currently has 3 segment tabs (Existantes, YouTube, Créer), a collection filter using a horizontal ion-segment showing only collection symbols, and a minimal quick-create form. The Resources section (ResourceFormPage.vue) has a full creation form with title, collection, reference, music properties, and content management.

## Goals / Non-Goals

**Goals:**
- Make the resource selection flow simpler and faster (single view, no tab switching)
- Fix collection filtering by showing all collections with full names in a dropdown
- Enable inline resource creation with the same field coverage as the Resources section
- After creating a resource inline, auto-select it and stay in the selector flow
- Keep YouTube resource creation accessible through the content creation flow

**Non-Goals:**
- Changing the ResourceSelector's props/emits interface (consumers don't need changes)
- Adding multi-content support to inline creation (one content type at a time is enough for quick creation)
- Changing the standalone resource creation page (ResourceFormPage.vue)
- Modifying how NaturalResourceSelector works internally

## Decisions

**Decision 1: Remove segment tabs, use a single-view layout**

The modal shows the resource list directly with a search bar and collection dropdown at the top. No tabs. A "Créer une ressource" button is placed prominently (either at the top of the list or as a floating action).

Rationale: Most users want to select an existing resource. Tabs add friction and hide the most common action. Users who need to create can click the create button.

**Decision 2: Replace collection filter segment with ion-select dropdown**

Replace the horizontal `ion-segment` (which only shows collection symbols and doesn't fit all collections) with an `ion-select` dropdown that shows full collection names. Include a "Toutes les collections" option as the default.

Rationale: Dropdowns scale to any number of collections and show meaningful names instead of cryptic symbols.

**Decision 3: Inline resource creation as a modal view swap**

When the user clicks "Créer une ressource", the modal content swaps to a creation form (same modal, different view state). The form includes: title, collection selector (ion-select), reference, music properties (key, beat, tempo, style), and a content section with action buttons for adding lyrics, YouTube video, audio/URL. After saving, the new resource is auto-selected and the view swaps back to the resource list.

Rationale: Staying within the same modal avoids losing context. The form fields match ResourceFormPage for consistency, but the flow stays contained.

**Decision 4: YouTube integration via content creation, not a tab**

YouTube search is accessible through the "Ajouter du contenu" flow in the create form (same as ResourceFormPage uses NaturalResourceSelector with selectOnly mode). This replaces the dedicated YouTube tab.

Rationale: YouTube is one type of content, not a separate resource selection mode. Treating it as a content type is more consistent.

**Decision 5: Use a `mode` ref to switch between 'browse' and 'create' views**

Instead of tabs, use a simple `mode` ref ('browse' | 'create') to swap the modal content. The browse view shows the resource list; the create view shows the creation form. A back arrow in the create view returns to browse.

Rationale: Simple state management, clean separation of concerns, easy to add more modes later if needed.

## Risks / Trade-offs

- [Risk] Larger modal with inline creation form → Mitigation: creation form is shown on demand, not by default; use scrollable content
- [Risk] Loss of quick YouTube search discoverability → Mitigation: YouTube is still accessible via "Ajouter du contenu" in the create form; most users create resources from the Resources section anyway
- [Trade-off] More complex ResourceSelector component → Accepted: the component is already ~600 lines; the restructure replaces complexity rather than adding to it
