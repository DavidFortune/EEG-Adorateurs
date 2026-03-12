## Context

ServiceProgramPage.vue is ~7000 lines. A significant chunk is sub-item handling (~160 template lines, 3 Firebase functions, 4 composable functions) and type-specific logic (18+ type icons, type grid selector, type-conditional rendering). The current model nests `ProgramSubItem[]` inside `ProgramItem` — this creates a 2-level hierarchy that complicates reordering, editing, and rendering. Item types drive icon display but no real behavioral differences beyond Section (visual divider).

Current Firestore structure: a single `programs` document per service containing a flat `items: ProgramItem[]` array, where some items have nested `subItems: ProgramSubItem[]`.

## Goals / Non-Goals

**Goals:**
- Flatten the data model: all items are top-level, grouped by optional `groupId`
- Remove `ProgramItemType` enum — items are generic, Section becomes a group header
- Remove all sub-item code paths (CRUD, reorder, template, composable)
- Backward-compatible read-time migration for existing data
- Reduce ServiceProgramPage.vue by ~500+ lines

**Non-Goals:**
- Changing Firestore document structure (still one doc per service with `items[]`)
- Migrating existing Firestore data in batch — read-time lazy migration only
- Changing the edit lock mechanism
- Redesigning the presentation mode (will adapt to new model)

## Decisions

### 1. Group model: lightweight header items, not a separate collection

**Decision:** A group is a `ProgramItem` with `isGroup: true`. Child items reference their group via `groupId: string`. Groups are ordered alongside regular items in the flat `items[]` array.

**Why not a separate `groups[]` array?** Keeping everything in `items[]` means reordering works uniformly — a group header can be dragged like any item. No separate ordering system needed.

**Why not nested arrays (like sub-items)?** That's what we're removing. Flat is simpler for CRUD, reorder, and rendering.

```typescript
// New ProgramItem shape
interface ProgramItem {
  id: string;
  order: number;
  title: string;
  subtitle?: string;
  notes?: string;
  participants?: ProgramParticipant[];
  duration?: number;
  resourceId?: string;
  lyrics?: string;
  scriptureReference?: string;
  scriptureText?: string;
  scriptureVersion?: string;
  // Group support
  isGroup?: boolean;      // true = this item is a group header
  groupId?: string;       // ID of parent group (if item belongs to a group)
  // Legacy (read-only, never written)
  type?: string;          // Preserved from existing data, not used in new UI
  subItems?: any[];       // Read during migration, never written
  sectionId?: string;     // Already deprecated
  participant?: any;      // Already deprecated
}
```

### 2. Read-time migration strategy

**Decision:** When reading a program from Firestore, transform legacy data:

1. If an item has `subItems[]`: promote each sub-item to a top-level item with `groupId = parentItem.id`. Set `isGroup: true` on the parent. Assign `order` values that place promoted items after their parent.
2. If an item has `type === 'Section'`: convert to `isGroup: true` with no children.
3. Strip `type` from the active model but preserve it in Firestore for rollback safety.

**Why read-time?** Avoids batch migration script, handles data lazily, and any write-back from editing will save the new format.

### 3. Remove ProgramItemType completely

**Decision:** Delete the enum. The UI no longer distinguishes between item types. All items are rendered identically: title, optional subtitle, participants, duration, resource link.

**What about icons?** Remove all type-specific icons. Items show a generic drag handle + order number. If a resource is linked, the resource type can provide context.

**What about Section dividers?** Sections become groups (`isGroup: true`). Visually distinct via CSS (bold header, background color), not via a type enum.

### 4. InlineAddBar simplification

**Decision:** Remove type selector from InlineAddBar. New items are created with just a title (and optional resource link via autocomplete). No type, no sub-item mode.

### 5. Expanded card simplification

**Decision:** Remove from expanded card:
- Type change tucked section (no types)
- Sub-item expand/collapse (no sub-items)
- Add sub-item button (no sub-items)

Keep: title, subtitle, participants, duration, resource, scripture, notes, delete.

### 6. Inter-item add zone update

**Decision:** Replace "Section" button with "Groupe" button. Tapping "Groupe" inserts a new group header item (`isGroup: true`) at that position.

## Risks / Trade-offs

**[Risk] Existing programs with sub-items may look different after migration** → Mitigation: promoted sub-items retain their title, participants, duration, and resource. The visual change is that they appear as top-level items within a group instead of nested under a parent. This is functionally equivalent.

**[Risk] Removing types loses visual variety (icons per type)** → Mitigation: The user explicitly requested this simplification. Resource-linked items can derive visual context from the resource itself in the future.

**[Risk] Read-time migration runs on every load until document is saved** → Mitigation: Any edit triggers a save that writes the new format, which is then cached. Most active programs will migrate on first edit.

**[Risk] Presentation mode may depend on item types** → Mitigation: Check and adapt. Slide rendering should work with title-based items. Type-based filtering (e.g., "show only songs") is removed.

## Migration Plan

1. Update types — new `ProgramItem` shape with `isGroup`/`groupId`, remove `ProgramSubItem` and `ProgramItemType`
2. Add migration function in `programs.ts` — transforms legacy items on read
3. Update Firebase CRUD — remove sub-item functions, add group-aware operations
4. Update composable — remove sub-item helpers, add group helpers
5. Update template — remove sub-item sections, add group rendering
6. Update InlineAddBar — remove type selector
7. Clean up — remove unused imports, icons, CSS
8. Verify — build, test all editing flows

## Resolved Questions

- **Groups collapsible in view mode?** Yes — groups are collapsible in both view and edit mode. Default state is expanded.
- **Preserve `type` field in UI?** No — `type` is fully removed from the UI. Legacy `type` values are kept in Firestore for rollback safety but never displayed.
