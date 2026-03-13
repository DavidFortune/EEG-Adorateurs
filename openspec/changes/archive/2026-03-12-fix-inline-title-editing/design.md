## Context

Inline title editing in the service program editor uses Ionic's `ion-input` component inside an `ion-reorder-group`. Three types of items support inline title editing: regular items, group headers, and section banners. The previous implementation read the typed value from `event.target.value` on `ionBlur`, which is unreliable because Ionic's `ionBlur` is a CustomEvent that fires asynchronously — after the native blur event and potentially after a new edit has already started.

## Goals / Non-Goals

**Goals:**
- Inline title editing works reliably across consecutive edits
- Stale blur events from a previous edit do not interfere with the current edit
- Input receives focus reliably when edit mode activates

**Non-Goals:**
- Changing the inline editing UX or adding new editing features
- Refactoring the overall program item architecture

## Decisions

### 1. Track value via `@ionInput` instead of reading on blur

**Choice:** Maintain an `editingTitleValue` ref updated on every `@ionInput` event. On commit (blur/enter), read from the ref.

**Rationale:** `ionBlur`'s `event.target.value` is unreliable across Ionic versions and platforms. The `ionInput` event fires synchronously on each keystroke and `event.detail.value` is the canonical way to read input values in Ionic.

**Alternative considered:** `v-model` — not well-supported on `ion-input` in Ionic Vue without `@ionic/vue` v-model adapter.

### 2. Guard `commitTitleEdit` against stale blur events

**Choice:** Check `editingTitleItemId.value === itemId` at the start of `commitTitleEdit`. If they don't match, return early.

**Rationale:** When user clicks title B while editing title A, the sequence is:
1. `startInlineTitleEdit(B)` runs (sets state for B)
2. A's `ionBlur` fires asynchronously → `commitTitleEdit(A)` called
3. Without guard: saves B's value to A, resets `editingTitleItemId` to null

The guard ensures stale blur events are discarded. Also prevents double-fire when DOM removal triggers a second blur.

### 3. Manual focus via `watch` + `nextTick` + `setFocus()`

**Choice:** Replace `autofocus` attribute with a watcher on `editingTitleItemId` that calls `setFocus()` on the `ion-input` ref after a short delay.

**Rationale:** The `autofocus` HTML attribute is unreliable inside `ion-reorder-group` on mobile devices. Ionic's `setFocus()` method is the recommended programmatic focus approach.

### 4. `@click.stop` on title elements

**Choice:** Added `.stop` modifier on the `@click` handler of all title `h4` elements.

**Rationale:** Prevents `ion-item` and `ion-reorder-group` from intercepting the tap event before it reaches the title click handler.

## Risks / Trade-offs

- **[Risk] `setFocus()` timing** — The 50ms delay in `setTimeout` is a heuristic. If Ionic's rendering is slower on some devices, focus may not work. → Mitigation: Fallback is that the user taps the input manually; editing still works.
- **[Risk] Double save on Enter + blur** — When user presses Enter, `commitTitleEdit` sets `editingTitleItemId = null` and removes the input. If blur fires before the guard check, it could attempt a second save. → Mitigation: The guard (`editingTitleItemId !== itemId`) catches this because `editingTitleItemId` is already null.
