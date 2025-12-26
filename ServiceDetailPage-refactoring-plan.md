# ServiceDetailPage Refactoring Plan

## Goal
Refactor ServiceDetailPage.vue based on the mockup to:
1. Simplify the header with service info (category, status, title, datetime)
2. Add segment tabs for Programme, Ressources, and Members
3. Create modular, reusable sub-components for each tab

## Mockup Analysis

```
┌─────────────────────────────────────────────────────┐
│ ← Détails du Service                            ✎  │
├─────────────────────────────────────────────────────┤
│ [Category] [Status]                                 │
│ Title                                               │
│ Start day, Start time (duration)                    │
├─────────────────────────────────────────────────────┤
│ [Programme] [Ressources] [Members]   ← Segments     │
├─────────────────────────────────────────────────────┤
│ Programme Tab:           │ Members Tab:             │
│ ① Title           type   │ Section Title (team)     │
│   subtitle               │ ③ Title        type      │
│ ② Title           type   │   subtitle               │
│                          │ ④ Title        type      │
└─────────────────────────────────────────────────────┘
```

## Component Architecture

### New Components (in `src/components/service-detail/`)

1. **ServiceInfoHeader.vue** - Compact service info display
   - Props: `service: Service`, `program: ServiceProgram | null`
   - Displays: category chip, status chip, title, datetime with duration

2. **ProgramOverview.vue** - Simplified program list
   - Props: `program: ServiceProgram | null`, `loading: boolean`
   - Displays: numbered list of program items with title, subtitle (participant), type chip
   - Shows empty state when no program

3. **ResourcesOverview.vue** - Resources list from program
   - Props: `resources: Resource[]`, `loading: boolean`
   - Displays: list of resources with title, subtitle (collection), type chip
   - Resources extracted from program items that have `resourceId`

4. **MembersOverview.vue** - Members grouped by team
   - Props: `teamAssignments: TeamAssignmentGroup[]`, `guestMembers: Member[]`, `loading: boolean`
   - Displays: teams as sections, members with avatar, name, role
   - Shows guests section if any

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/service-detail/ServiceInfoHeader.vue` | Service info header with chips, title, datetime |
| `src/components/service-detail/ProgramOverview.vue` | Simplified program items list |
| `src/components/service-detail/ResourcesOverview.vue` | Resources extracted from program |
| `src/components/service-detail/MembersOverview.vue` | Members grouped by team |

## File to Modify

| File | Changes |
|------|---------|
| `src/views/services/ServiceDetailPage.vue` | Major refactor - use new components, add segment tabs |

## Implementation Details

### 1. ServiceInfoHeader.vue (~80 lines)
- Display category and status as chips
- Show service title prominently
- Format datetime with duration (using existing timezoneUtils)
- Compute duration from service start/end times

### 2. ProgramOverview.vue (~120 lines)
- Receive program as prop
- Map items to numbered list with:
  - Item number (① ② ③ etc or 1. 2. 3.)
  - Title
  - Subtitle (participant name if any)
  - Type chip (colored by ProgramItemType)
- Empty state: "Aucun programme" with optional create CTA

### 3. ResourcesOverview.vue (~100 lines)
- Receive resources array as prop (parent extracts from program)
- Display each resource with:
  - Title
  - Collection name (subtitle)
  - Resource type chip (audio, video, lyrics, etc.)
- Empty state: "Aucune ressource"

### 4. MembersOverview.vue (~150 lines)
- Receive teamAssignments and guestMembers as props
- For each team:
  - Team name as section header
  - List members with avatar, name
- Guests section at bottom if any
- Empty state: "Aucun membre assigné"

### 5. ServiceDetailPage.vue Refactoring
Keep existing:
- Header toolbar with back button
- Admin actions (edit, publish/unpublish)
- Realtime subscription to service
- Guest management modal
- Delete confirmation

Replace with:
- ServiceInfoHeader component
- ion-segment for tabs (programme, ressources, members)
- Conditional rendering of tab content

Add:
- selectedSegment ref
- Resource extraction from program
- Assignment loading (reuse from ServiceMembersPage logic)

## Data Types Reference

```typescript
// From program.ts
interface ProgramItem {
  id: string;
  order: number;
  type: ProgramItemType; // SONG, PRAYER, SCRIPTURE, etc.
  title: string;
  subtitle?: string;
  participant?: ProgramParticipant;
  resourceId?: string;
}

// From resource.ts
interface Resource {
  id: string;
  title: string;
  collectionId: string;
  contents: ResourceMedia[];
}

// From assignment.ts
interface ServiceAssignment {
  teamId: string;
  teamName: string;
  memberId: string;
  memberName: string;
}
```

## Resource Extraction Logic
```typescript
const extractResourceIds = (program: ServiceProgram): string[] => {
  const ids: string[] = [];
  program.items.forEach(item => {
    if (item.resourceId) ids.push(item.resourceId);
    item.subItems?.forEach(sub => {
      if (sub.resourceId) ids.push(sub.resourceId);
    });
  });
  return [...new Set(ids)]; // dedupe
};
```

## Segment Tab Behavior
- Default to "programme" tab
- All tabs available regardless of publish status
- Show appropriate empty states per tab
- **Read-only display** - items are not clickable, for viewing only

## Admin Actions
- **Header only** - all admin actions via edit icon in toolbar
- Remove bottom "Modifier" and "Supprimer" buttons
- Edit icon opens action sheet with options:
  - Modifier le service
  - Gérer les invités
  - Publier/Dépublier
  - Supprimer (danger)
- Guest modal remains for managing guests

## Summary
1. Create 4 new component files in `src/components/service-detail/`
2. Refactor ServiceDetailPage.vue to use segment-based navigation
3. Keep existing admin functionality (reorganized)
4. Extract resources from program items
5. Reuse assignment grouping logic from ServiceMembersPage
