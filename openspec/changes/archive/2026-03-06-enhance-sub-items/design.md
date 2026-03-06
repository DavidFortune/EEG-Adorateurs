## Context

The service program editor (`ServiceProgramPage.vue`) has a rich add/edit item modal with type selection, title autocomplete with resource suggestions, participant assignment, duration, subtitle, and an "Options avancées" collapsible section. Sub-items, however, use a minimal form with only title, resource link, notes, and scripture reference. This forces worship leaders to use workarounds when building complex program structures. The `ProgramSubItem` interface lacks `type`, `subtitle`, `participants`, and `duration` fields.

## Goals / Non-Goals

**Goals:**
- Give sub-items the same form capabilities as parent items (type, title autocomplete, participants, duration, subtitle)
- Filter out `Section` type from sub-item type selection (sections don't nest)
- Show type icon, duration, and participants in the sub-item display within the program view
- Maintain backward compatibility with existing sub-items that lack the new fields

**Non-Goals:**
- Adding sub-sub-items (no deeper nesting)
- Changing how sub-items are stored in Firestore (they remain embedded in the parent item)
- Adding a separate "Options avancées" accordion for sub-items (keep the form flat for simplicity, since sub-items already have fewer fields)

## Decisions

**Decision 1: Extend the ProgramSubItem interface**

Add `type?: ProgramItemType`, `subtitle?: string`, `participants?: ProgramParticipant[]`, and `duration?: number` to `ProgramSubItem`. All new fields are optional for backward compatibility with existing data.

Rationale: Optional fields mean existing sub-items keep working without migration. The Firebase functions already use `Partial<ProgramSubItem>` for updates.

**Decision 2: Reuse the same form pattern in sub-item modals**

The add/edit sub-item modals adopt the same layout as the item modal:
1. Type selection button grid (filtered to exclude Section)
2. Title input with autocomplete/suggestions and auto-link
3. Resource section (already done)
4. Scripture section (already exists)
5. "Options avancées" accordion with subtitle, participants, duration, notes

Rationale: Consistency between items and sub-items. Users learn one pattern.

**Decision 3: Filter available types for sub-items**

Create a `subItemTypes` computed that returns `ProgramItemType` values excluding `SECTION` and `TITLE`. Sub-items can be songs, prayers, scripture readings, sermons, etc. but not structural separators.

Rationale: Section/Title types are structural and only make sense at the top level.

**Decision 4: Reuse title autocomplete for sub-items**

Add sub-item-specific title suggestion state (`showSubItemTitleSuggestions`, `subItemTitleSuggestions`) using the same resource matching logic as items. When a suggestion is selected, auto-link the resource and set the title.

Rationale: The main value of title autocomplete is quick resource linking, which is equally useful for sub-items.

**Decision 5: Update sub-item display in program view**

In the program item card's sub-item section, show: type icon (if set), duration (if set), and participant names (if set) alongside the existing title and resource info.

Rationale: These details are only useful if they're visible in the program view, not just in the edit modal.

## Risks / Trade-offs

- [Risk] More complex sub-item modals increase template size → Mitigation: the pattern is already established for items, mostly copy-and-adapt
- [Risk] Existing sub-items won't have type set → Mitigation: display without type icon gracefully (already handled by optional chaining)
- [Trade-off] Sub-item form becomes heavier with more fields → Mitigation: use "Options avancées" accordion to keep the primary view clean
