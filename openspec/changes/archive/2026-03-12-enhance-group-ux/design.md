## Context

Groups are collapsible containers for program items. The group header shows a title, delete button (edit mode), and collapse/expand chevron. Currently, adding items to a group requires creating at the bottom then dragging into position. The old sub-item lyrics modal (removed during simplification) showed all lyrics, scripture, and notes for children — this needs to come back adapted to the new flat group model.

## Goals / Non-Goals

**Goals:**
- One-tap "add item to group" from the group header in edit mode
- Group content modal showing lyrics, scripture, and notes from all child items — like the old sub-item lyrics modal
- Keep it visually clean and consistent with existing patterns

**Non-Goals:**
- Changing how groups expand/collapse
- Changing how drag-to-reorder assigns groupId
- Presentation mode changes (PresentationModal already handles groups)

## Decisions

### 1. Add-to-group button placement

Place a small `addOutline` icon button in the group header actions area, before the delete button (edit mode only). On tap, create a new item with `groupId` set to the group's ID and `order` positioned right after the last child of that group. Activate inline title edit on the new item. Auto-expand the group if collapsed.

### 2. Group content modal — button on group header

Add a view-content button (e.g. `readerOutline` icon) in the group header actions area, visible always (not just edit mode). Opens an `ion-modal` that shows a scrollable list of the group's children with their content:

For each child item (numbered):
- Item number + title
- Linked resource lyrics (if any, from `resource.contents` where `type === 'lyrics'`)
- Scripture text with reference and version (if any)
- Notes (if any)

Style like the old sub-item lyrics modal: numbered items, scripture in a tinted block with left border, lyrics in pre-formatted text, notes in muted style.

### 3. Lyrics retrieval

Child items link to resources via `resourceId`. The lyrics come from `linkedResources.get(resourceId)?.contents.find(c => c.type === 'lyrics')?.url` — but `url` in lyrics type actually holds the lyrics text directly. Reuse the same pattern as `collectPresentationSlides()`.

## Risks / Trade-offs

- **Risk:** Lyrics stored in resource content `url` field is unintuitive → Already an established pattern, no change needed
- **Risk:** Modal for empty groups → Don't show the button if group has no children with content
