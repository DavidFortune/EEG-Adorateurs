## Why

Editing program items currently requires navigating a 3-dot action menu and a popup detail sheet (bottom modal). This adds unnecessary taps — especially on mobile — and breaks the user's flow. Most fields already have inline editing patterns, but type change, resource linking, scripture fetch, and delete are still locked behind the menu/popup. By expanding items in-place, all editing happens where the content is, with zero popups.

## What Changes

- Replace 3-dot action menu + detail sheet popup with an **expandable item card** pattern
- Collapsed state: shows title, type icon, participants, duration chips (existing inline editing preserved)
- Expanded state: reveals all editable fields in-place — title, subtitle, type selector, participants, duration, resource link, scripture (as collapsible sub-section), notes, delete button
- Add a **subtle "+" drop zone between items** for adding new items or sections (replaces "add section" from 3-dot menu)
- **Scripture** and **type change** are tucked behind expandable sub-sections within the expanded card
- Sub-items follow the **same expand/collapse pattern** as parent items
- Remove `ItemDetailSheet.vue` component (popup modal) — no longer needed
- Remove 3-dot action menu button and popover from item rows
- Desktop adaptation: expanded cards use 2-column grid layout on wider screens (>768px)

## Capabilities

### New Capabilities
- `expandable-item-card`: Expand/collapse item cards in-place for full inline editing — collapsed shows summary, expanded reveals all fields
- `inter-item-add-zone`: Subtle "+" button between items to add new items or section dividers, replacing the 3-dot menu's "add section after" action

### Modified Capabilities
- `edit-mode-by-status`: Edit mode no longer uses 3-dot menu or detail sheet popup — all editing is inline via expandable cards

## Impact

- `src/views/services/ServiceProgramPage.vue` — major template refactor for item rendering, remove action popover logic
- `src/components/ItemDetailSheet.vue` — removed entirely
- `src/composables/useProgramItems.ts` — may need new expand/collapse state management
- Mobile UX: fewer taps, smoother editing flow
- Desktop UX: wider expanded cards with 2-column layout
