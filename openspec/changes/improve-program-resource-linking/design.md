## Context

The service program editor (`ServiceProgramPage.vue`, ~3,900 lines) uses `ResourceSelector` to link resources to program items. Currently, the ResourceSelector is placed inside the title field's `slot="end"` — a small button squeezed next to the title input. This makes it hard to discover and feels cramped. The form modal also feels heavy with many fields stacked vertically without visual grouping.

The resource library section was recently improved with compact content cards, clear action buttons, and a lighter feel. The program's resource linking should follow the same patterns.

## Goals / Non-Goals

**Goals:**
- Make resource linking/unlinking a prominent, easy-to-find action in item modals
- Show linked resource details (title, collection, media types) inline in the modal
- Allow one-tap unlink both in the modal and from the program item card in edit mode
- Reduce visual weight of the add/edit item modal
- Apply the same improved pattern to sub-item modals
- Maintain all existing functionality (title suggestions, auto-link, etc.)

**Non-Goals:**
- Changing the ResourceSelector component's internal implementation
- Changing the data model (resourceId 1:1 relationship stays the same)
- Redesigning the program item cards in view mode (non-edit)
- Changing how media content is displayed or played
- Modifying the resource creation flow within ResourceSelector

## Decisions

**Decision 1: Move ResourceSelector to its own section below the title field**

Instead of `slot="end"` on the title ion-item, the ResourceSelector gets its own dedicated section after the title. When no resource is linked, show a full-width "Lier une ressource" outline button. When a resource is linked, show a compact resource card with the resource title, collection badge, media type icons, and an unlink button.

Rationale: The current `slot="end"` placement makes the selector barely visible and hard to tap on mobile. A dedicated section with clear affordances makes resource linking a first-class action.

**Decision 2: Show inline resource card when a resource is linked**

When `itemForm.resourceId` is set and the linked resource is loaded, display a card showing:
- Resource title
- Collection name (if any)
- Media type chips (Paroles, YouTube, Audio, etc.)
- Music properties (key, beat, tempo, style) if set
- "Changer" button to swap resource
- "Délier" button (X icon) to remove the link

Rationale: Users need to see what's linked without opening another modal. The card also provides quick actions to change or unlink.

**Decision 3: Add quick unlink action on program item cards in edit mode**

In edit mode, each program item card that has a linked resource shows a small unlink icon button (close-circle) next to the resource info. Tapping it removes the `resourceId` with a confirmation toast.

Rationale: Common action (unlinking) shouldn't require opening the full edit modal.

**Decision 4: Visually group optional fields in the item modal**

Group the secondary fields (subtitle, participants, duration, notes) under a collapsible "Options avancées" section or use lighter visual separators to reduce the perceived form weight. Keep title, type, and resource as the primary visible fields.

Rationale: Most items only need type + title + resource. Showing all fields equally makes the form feel overwhelming.

**Decision 5: Apply the same resource section pattern to sub-item modals**

The add/edit sub-item modals get the same treatment: dedicated resource section with inline card display and unlink button, instead of the current `ion-item` with embedded ResourceSelector.

Rationale: Consistency across all resource linking contexts.

## Risks / Trade-offs

- [Risk] Larger modal template code → Mitigation: extract repeated resource card pattern into a shared template section or component if needed
- [Risk] Loading linked resource data in the modal requires an async fetch → Mitigation: use the existing `linkedResources` map; resource is already loaded if item was displayed in the program
- [Trade-off] More visual space used for resource section → Accepted: resource linking is a primary action and deserves the space
