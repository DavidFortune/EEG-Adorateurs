## Context

The current edit mode uses expandable item cards (tap chevron → full inline form) and a single InlineAddBar at the bottom with resource autocomplete. Inter-item add zones provide "+" buttons between items. The user wants a simpler, faster editing experience: quick-add buttons, no expandable form, and a 3-dot menu for secondary actions.

## Goals / Non-Goals

**Goals:**
- Replace InlineAddBar + inter-item add zones with 3 quick-add buttons at the bottom: "+ Élément", "+ Groupe", "+ Section"
- Remove expandable item card pattern — no more expand/collapse edit forms
- Keep inline editing for title (tap to edit), duration and participant (popovers — already exist)
- Add 3-dot popover menu on each item with contextual actions: resource, scripture, notes, delete
- Each action opens a focused modal for that specific data
- Show linked resource, scripture, and notes as chips/indicators on the item row
- Reintroduce Section as a visual divider (distinct from Group which is a collapsible container)

**Non-Goals:**
- Changing view mode (non-edit) display
- Changing the data model fundamentally (sections will use existing item model with a flag)
- Changing resource, scripture, or presentation features

## Decisions

### 1. Section model: `isSection?: boolean` on ProgramItem

Sections are visual dividers — a colored banner with a title, like the old `type: 'Section'` but using a dedicated boolean field instead of the removed type system. Sections cannot have resources, scripture, or notes — they only have a title. This keeps them distinct from Groups (which are collapsible containers for child items).

### 2. Quick-add buttons replace InlineAddBar

Three buttons in a row at the bottom of the program (edit mode only):
- "+ Élément" → creates item with default title "Nouvel élément", activates inline title edit
- "+ Groupe" → creates group header with default title "Nouveau groupe", activates inline title edit
- "+ Section" → creates section with default title "Nouvelle section", activates inline title edit

The resource autocomplete from InlineAddBar is removed from the creation flow. Resources are now linked post-creation via the 3-dot menu.

### 3. 3-dot menu replaces expandable card

Each item row gets an `ion-button` with `ellipsisVerticalOutline` icon in the end slot (edit mode only). Tapping opens an `ion-popover` with:

| Item state | Menu option | Action |
|---|---|---|
| No resource linked | "+ Ressource" | Opens ResourceSelector modal |
| Resource linked | "Modifier la ressource" | Opens ResourceSelector modal (pre-selected) |
| No scripture | "+ Passage biblique" | Opens scripture edit modal |
| Has scripture | "Modifier le passage" | Opens scripture edit modal (pre-filled) |
| No notes | "+ Note" | Opens notes edit modal |
| Has notes | "Modifier la note" | Opens notes edit modal (pre-filled) |
| Always | "Supprimer" | Confirmation alert → delete |

Group headers get a simplified menu: just "Supprimer" (rename is inline).
Sections get a simplified menu: just "Supprimer" (rename is inline).

### 4. Edit modals for resource, scripture, notes

**Resource modal:** Reuse existing `ResourceSelector` component in modal mode. On select, link resource to item. Include "Dissocier la ressource" button when a resource is already linked.

**Scripture modal:** `ion-modal` with scripture reference input + fetch button + text display. Reuse existing `bibleService.getScripture()`. Include "Supprimer le passage" button when scripture exists.

**Notes modal:** `ion-modal` with `ion-textarea` for notes. Include "Supprimer la note" button when notes exist.

### 5. Item row layout in edit mode

```
[drag] [#] [title............] [chips...] [...]
```

Where:
- `[drag]` = reorder handle (existing)
- `[#]` = item number (existing)
- `[title]` = tap-to-edit title (existing inline edit)
- `[chips]` = duration chip + participant chips + resource chip + scripture chip + notes indicator
- `[...]` = 3-dot menu button

In view mode (not editing), the row is the same minus drag handle and 3-dot menu.

### 6. Remove inter-item add zones

The "+" buttons between items are removed. New items are always added at the bottom via the quick-add buttons. Reordering handles item positioning.

## Risks / Trade-offs

- **Risk:** Losing resource autocomplete at creation time → Mitigation: Resource linking via 3-dot menu is only one extra tap, and keeps the creation flow clean
- **Risk:** More modal dialogs → Mitigation: Each modal is focused on a single action, so they're quick to complete
- **Risk:** Section vs Group confusion → Mitigation: Clear visual differentiation (section = colored banner divider, group = collapsible container with children)
