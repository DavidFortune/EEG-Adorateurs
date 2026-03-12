## Why

The "Modifier le programme" (Edit Program) button is not visible for admin users on published service programs. This is caused by an inconsistent default value in the `isDraft` computed property in `ServiceProgramPage.vue`, which defaults to `true` instead of `false` — contradicting the Firestore data layer and `ProgramOverview.vue` which both default to `false` for existing programs.

## What Changes

- Fix the `isDraft` computed property in `ServiceProgramPage.vue` to use `?? false` instead of `?? true`, aligning with the Firestore data layer (`programs.ts:62,111`) and `ProgramOverview.vue:118`
- This ensures the edit mode button is visible for admins on published programs, even during the brief moment when `program.value` may be loading

## Capabilities

### New Capabilities

_None — this is a bug fix._

### Modified Capabilities

- `program-edit-mode`: Fix incorrect `isDraft` default that prevents edit button visibility for admins

## Impact

- **File**: `src/views/services/ServiceProgramPage.vue` (line 1595)
- **Scope**: Single line change — `?? true` → `?? false`
- **Risk**: Low — aligns with existing behavior in the data layer and other components
- **Affected users**: All admin users who couldn't see the edit button on published service programs
