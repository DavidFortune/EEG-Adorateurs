## Context

The `ServiceProgramPage.vue` component has an `isDraft` computed property that defaults to `true` when `program.value` is null/undefined. This conflicts with:
- The Firestore data layer (`programs.ts:62,111`) which defaults `isDraft` to `false`
- The `ProgramOverview.vue` component which also defaults to `false`

The edit mode button's v-if condition includes `!isDraft`, meaning the incorrect default hides the button whenever the program hasn't loaded yet or lacks the `isDraft` field.

## Goals / Non-Goals

**Goals:**
- Fix the `isDraft` default to align with the rest of the codebase (`false`)
- Ensure admin users can see and use the edit mode button on published service programs

**Non-Goals:**
- Changing the edit lock mechanism
- Modifying draft visibility logic
- Refactoring the broader edit mode flow

## Decisions

**Use `?? false` instead of `?? true`**
- Rationale: The Firestore layer already normalizes `isDraft` to `false` for existing programs. The computed property default should match this convention. Programs without `isDraft` are legacy published programs, not drafts.
- Alternative considered: Using `=== true` strict check — this would also work but `?? false` is consistent with the pattern used in `ProgramOverview.vue` and the data layer.

## Risks / Trade-offs

- [Risk: Briefly showing edit button before program loads] → Acceptable: the button also requires `program` to be truthy, so it won't render until the program is loaded anyway.
- [Risk: None significant] → This is a one-line fix aligning an inconsistent default value.
