# Service Direct Resources Feature Plan

## Status: IMPLEMENTED

## Overview
Add the ability to associate resources directly with a service, independent of program items. This allows resources to be linked to a service even without a detailed program.

## Current State
- Resources are currently extracted only from program items via `ProgramItem.resourceId` and `ProgramSubItem.resourceId`
- The `Service` type has no direct reference to resources
- `ResourcesOverview` component receives resources extracted from the program in `ServiceDetailPage`

## Proposed Changes

### 1. Data Structure Changes

#### 1.1 Update Service Type (`src/types/service.ts`)
Add a new optional field to store directly associated resource IDs:

```typescript
export interface Service {
  // ... existing fields ...
  resourceIds?: string[]; // Resource IDs directly associated with this service
}

export interface CreateServiceRequest {
  // ... existing fields ...
  resourceIds?: string[]; // Resource IDs directly associated with this service
}
```

#### 1.2 Backward Compatibility
- The `resourceIds` field is optional, so existing services without this field will continue to work
- Existing resources linked via program items will still be displayed
- No migration needed - the field will be `undefined` for existing services

### 2. Logic Changes

#### 2.1 Update ServiceDetailPage (`src/views/services/ServiceDetailPage.vue`)
- Modify `loadResources()` to merge resources from two sources:
  1. Resources extracted from program items (existing logic)
  2. Resources directly associated with the service via `service.resourceIds`
- Deduplicate resources by ID to avoid showing the same resource twice
- Pass service ID to ResourcesOverview for the add functionality

#### 2.2 Update ResourcesOverview (`src/components/service-detail/ResourcesOverview.vue`)
- Add summary row at the beginning with resource count and "Add" button
- Add props for:
  - `serviceId: string` - to associate new resources
  - `isAdmin: boolean` - to show/hide add button
- Add resource selector modal (reuse existing `ResourceSelector` component)
- Emit event when resource is added so parent can update the service

#### 2.3 Update Service Service (`src/services/serviceService.ts`)
- Ensure `updateService` handles the new `resourceIds` field
- No new methods needed - we'll use existing update functionality

### 3. UI Changes

#### 3.1 ResourcesOverview Summary Row
```
┌─────────────────────────────────────────────────────┐
│ 📁 3 ressources                    [+ Ajouter]     │
├─────────────────────────────────────────────────────┤
│ Resource 1...                                       │
│ Resource 2...                                       │
└─────────────────────────────────────────────────────┘
```

- White background with subtle shadow (similar to ProgramOverview)
- Resource count on the left with folder icon
- "Ajouter" button on the right (admin only)
- Button opens ResourceSelector modal

#### 3.2 Resource Selector Modal
- Reuse existing `ResourceSelector.vue` component
- Allow selecting one or multiple resources
- On selection, add resource ID(s) to service's `resourceIds` array

### 4. Files to Modify

| File | Changes |
|------|---------|
| `src/types/service.ts` | Add `resourceIds?: string[]` to Service and CreateServiceRequest |
| `src/components/service-detail/ResourcesOverview.vue` | Add summary row, add button, resource selector modal |
| `src/views/services/ServiceDetailPage.vue` | Update loadResources to merge both sources, pass new props |

### 5. Implementation Steps

1. **Update Service type** - Add `resourceIds` field
2. **Update ResourcesOverview** - Add summary row and add button UI
3. **Add resource selector modal** - Integrate ResourceSelector component
4. **Update loadResources logic** - Merge program and direct resources
5. **Wire up add functionality** - Save to service document
6. **Test backward compatibility** - Ensure existing services work

### 6. Resource Display Priority
When displaying resources, merge from both sources:
1. First, resources from `service.resourceIds` (direct association)
2. Then, resources from program items
3. Deduplicate by resource ID (keep first occurrence)

### 7. Removal of Direct Resources
- Each directly associated resource should have a way to be removed
- Add a small "x" or trash icon on resources that are directly associated (not from program)
- This requires tracking the source of each resource in the display

### 8. Design Decisions (Confirmed)

1. **Multiple selection**: Yes - the add modal allows selecting multiple resources at once
2. **Remove functionality**: No - only add functionality, no removal of directly associated resources
3. **Visual distinction**: Yes - a small icon hint to distinguish directly associated resources from program-linked ones
4. **Empty state**: Yes - the add button appears even when no resources exist

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking existing services | `resourceIds` is optional, no migration needed |
| Duplicate resources shown | Deduplication by ID in loadResources |
| Performance with many resources | Already handled - existing pattern |

## Estimated Scope
- **Types**: ~5 lines
- **ResourcesOverview**: ~80 lines (summary row, modal, logic)
- **ServiceDetailPage**: ~30 lines (merge logic, new props)
- **Total**: ~115 lines of new/modified code
