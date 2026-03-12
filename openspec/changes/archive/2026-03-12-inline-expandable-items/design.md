## Context

Currently, editing a program item requires:
1. Tap 3-dot menu → see 4 options
2. Tap "Edit" → opens `ItemDetailSheet.vue` (bottom modal)
3. Edit fields in the modal → changes save via `handleDetailSheetUpdateField`
4. Dismiss modal

Some fields (title, subtitle, notes, duration, participants) already have inline editing via quick action buttons and popovers. But type change, resource linking, scripture fetch, and structural actions (add sub-item, add section, delete) still require the 3-dot menu.

The expand/collapse pattern consolidates everything into a single interaction model: tap to expand, edit in-place, tap to collapse.

## Goals / Non-Goals

**Goals:**
- Eliminate the 3-dot action menu and detail sheet popup entirely
- All item editing happens in-place via expandable cards
- Mobile-first: reduce taps, keep everything reachable with one hand
- Desktop: use wider layout for expanded cards (2-column grid)
- Sub-items use the same expand/collapse pattern as parent items
- Add items/sections via subtle "+" zones between items

**Non-Goals:**
- Changing how the InlineAddBar at the bottom works (keep as-is)
- Changing the reorder mechanism (drag handle stays)
- Changing how data is saved (keep existing `inlineUpdateField` / Firebase functions)
- Auto-save or debounce changes (keep current save-on-blur behavior)

## Decisions

### 1. Expand/collapse state management

**Decision:** Track expanded item IDs in a reactive `Set<string>` in the component, similar to the existing `expandedItemIds` pattern used for sub-item expansion.

**Why:** Simple, local state. No need for persistence — expanded state resets on navigation. Already a proven pattern in this codebase.

```
expandedEditItemIds: Set<string>  // items currently expanded for editing
```

Only one item expanded at a time on mobile (auto-collapse others). Multiple on desktop.

### 2. Collapsed vs expanded field layout

**Decision:** Collapsed shows read-only summary with tappable chips. Expanded shows full editable form.

**Collapsed (always visible in edit mode):**
- Reorder handle (start)
- Item number + type icon
- Title (tap to inline edit — existing behavior)
- Participant chips + duration chip (tap for popover — existing behavior)
- Expand chevron (end)

**Expanded (revealed on tap):**
- Title input field
- Subtitle input field
- Participant selector (inline, not popover)
- Duration stepper (inline, not popover)
- Resource link card + change/unlink buttons
- Scripture section (collapsible ▸ sub-section)
- Type change (collapsible ▸ sub-section)
- Notes textarea
- [+ Sous-élément] button (for items that support sub-items)
- [Supprimer] button

### 3. Tucked sections for scripture and type change

**Decision:** Scripture input and type selector are behind collapsible `▸` toggles within the expanded card.

**Why:** These are used less frequently than title/participants/duration. Keeping them tucked reduces visual noise in the expanded view while keeping them accessible without a popup.

### 4. Inter-item add zone

**Decision:** A thin, subtle `+` button rendered between each `ion-item` in the reorder group. Tapping reveals two options: "Élément" (new item) and "Section" (section divider).

**Why:** Replaces "add section after" from the 3-dot menu. More discoverable — users can add content at any position, not just after the item they right-clicked.

**Implementation:** The add zone lives outside the `ion-item` but inside the `ion-reorder-group`. It's a simple div that expands on tap to show the two buttons, then collapses after selection.

### 5. Delete action

**Decision:** Visible trash icon button at the bottom of the expanded card (not swipe-to-delete).

**Why:** Swipe-to-delete conflicts with the reorder gesture on mobile. An explicit button with confirmation alert (existing pattern) is safer.

### 6. Remove ItemDetailSheet.vue

**Decision:** Delete the component entirely once all its fields are available in the expanded card.

**Why:** No fields remain that require the popup. Keeping it would create two paths to edit the same data.

### 7. Desktop 2-column layout

**Decision:** On screens > 768px, expanded card content uses CSS grid with 2 columns.

**Why:** Expanded cards can get tall on mobile. On desktop, spreading fields across 2 columns keeps the card compact and scannable.

## Risks / Trade-offs

**[Risk] Expanded card height on mobile** — An item with all fields visible (title, subtitle, participants, duration, resource, scripture expanded, type expanded, notes, buttons) could be very tall.
→ Mitigation: Scripture and type are tucked by default. Most items won't have all fields populated. The card only shows what's relevant.

**[Risk] Reorder group interaction with expand/collapse** — Ionic's `ion-reorder-group` may not handle variable-height items gracefully during drag.
→ Mitigation: Auto-collapse all expanded items when a reorder starts. Re-expand after reorder completes.

**[Risk] Single item expanded at a time (mobile)** — Could feel restrictive if user wants to compare two items.
→ Mitigation: Start with single-expand on mobile, allow multi-expand on desktop. Can revisit if users complain.

**[Trade-off] Losing the detail sheet's focused editing experience** — Some users may prefer the modal's focused, distraction-free editing.
→ Acceptance: The inline approach is faster for the common case. Power users editing complex items (scripture + resource + notes) can expand and scroll within the card.
