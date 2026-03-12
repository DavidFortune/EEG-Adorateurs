## 1. Fix isDraft Default

- [x] 1.1 In `src/views/services/ServiceProgramPage.vue` line 1595, change `program.value?.isDraft ?? true` to `program.value?.isDraft ?? false`

## 2. Verification

- [x] 2.1 Verify the edit mode button v-if condition at line 86 will now correctly evaluate for published programs
- [x] 2.2 Verify draft auto-enter logic at line 3521 still works correctly (drafts with `isDraft: true` still auto-enter edit mode)
- [x] 2.3 Confirm consistency with `ProgramOverview.vue:118` and `programs.ts:62,111` which all use `?? false`
