## 1. Composable: Track value and guard commits

- [x] 1.1 Add `editingTitleValue` ref to `useProgramItems` composable
- [x] 1.2 Update `startInlineTitleEdit` to set both `editingTitleInitialValue` and `editingTitleValue`
- [x] 1.3 Add `updateEditingTitleValue(value)` helper function
- [x] 1.4 Replace `inlineUpdateTitle` with `commitTitleEdit` that reads from `editingTitleValue` ref
- [x] 1.5 Add stale-blur guard: `if (editingTitleItemId.value !== itemId) return` at start of `commitTitleEdit`
- [x] 1.6 Export `editingTitleValue`, `updateEditingTitleValue`, and `commitTitleEdit` from composable

## 2. Template: Update all inline title inputs

- [x] 2.1 Update group header `ion-input`: replace `autofocus` with `ref`, add `@ionInput`, use `commitTitleEdit` for blur/enter
- [x] 2.2 Update section banner `ion-input`: same changes as 2.1
- [x] 2.3 Update regular item `ion-input`: same changes as 2.1
- [x] 2.4 Add `@click.stop` modifier on all three title `h4` click handlers
- [x] 2.5 Add `.prevent` on `@keydown.enter` to avoid form submission side effects

## 3. Focus management

- [x] 3.1 Add `inlineTitleInputRef` template ref
- [x] 3.2 Add `watch` on `editingTitleItemId` that calls `setFocus()` via `nextTick` + `setTimeout`
- [x] 3.3 Import `watch` from Vue

## 4. Wiring

- [x] 4.1 Destructure new exports (`editingTitleValue`, `updateEditingTitleValue`, `commitTitleEdit`) in ServiceProgramPage.vue
- [x] 4.2 Remove old `inlineUpdateTitle` references

## 5. Verify

- [x] 5.1 Build compiles with no type errors (`npx vue-tsc --noEmit`)
- [x] 5.2 Production build succeeds (`npx vite build`)
- [x] 5.3 Inline title edit works on first click
- [x] 5.4 Inline title edit works on consecutive rapid edits without state corruption
- [ ] 5.5 Stale blur from previous edit does not interfere with new edit
