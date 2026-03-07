## Why

Resources are being created as duplicates when users click the create/save button multiple times before the async operation completes. Multiple resource creation flows lack proper guards to prevent double-submission, resulting in duplicate entries visible on the ResourcesPage.

## What Changes

- Add loading/disabled guards to all resource creation buttons to prevent double-click submissions
- Ensure the `ResourceFormPage` save button is disabled while the save operation is in progress (currently only checks `isFormValid`, not `loading`)
- Ensure the `ResourceBottomSheet` create button is disabled while creation is in progress (currently only checks title, not `loading`)
- Verify `ResourceSelector` and `NaturalResourceSelector` guards are complete

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `resource-library`: Add requirement that all resource creation flows must prevent duplicate submissions via UI guards

## Impact

- `src/views/resources/ResourceFormPage.vue` - Save button needs `loading` guard
- `src/components/ResourceBottomSheet.vue` - Create button needs `loading` guard
- `src/components/ResourceSelector.vue` - Already has `creatingResource` guard (verify)
- `src/components/NaturalResourceSelector.vue` - Already has `creating` guard (verify)
