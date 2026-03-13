## Why

Inline title editing in the service program editor was broken. The `ion-input` component's `ionBlur` event fires asynchronously in Ionic, causing stale blur events from a previous edit to overwrite the state of the next edit. After a few consecutive title edits, the input would stop responding correctly — saving wrong values or closing prematurely.

## What Changes

- **Replace event.target.value reading with tracked ref**: Instead of reading the typed value from `ionBlur`'s unreliable `event.target.value`, a `editingTitleValue` ref is updated on every `@ionInput` event and read on commit.
- **Guard against stale blur events**: `commitTitleEdit` checks that `editingTitleItemId` still matches the item being committed before saving, preventing async `ionBlur` from a previous edit from interfering with the current one.
- **Reliable focus management**: Replaced `autofocus` attribute (unreliable inside `ion-reorder-group`) with a `watch` + `nextTick` + `setFocus()` pattern.
- **Click propagation fix**: Added `@click.stop` on title elements to prevent `ion-item` and reorder group from intercepting tap events.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `program-edit-mode`: Inline title editing now uses a tracked value ref and stale-blur guard instead of reading from event target.

## Impact

- `src/composables/useProgramItems.ts` — Added `editingTitleValue` ref, `updateEditingTitleValue()`, replaced `inlineUpdateTitle()` with `commitTitleEdit()` (with stale-blur guard)
- `src/views/services/ServiceProgramPage.vue` — Updated all three inline title `ion-input` instances (group header, section, regular item) to use `@ionInput` tracking, `commitTitleEdit`, manual focus via watcher, and `@click.stop` on title elements
