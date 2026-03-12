## ADDED Requirements

### Requirement: Pure refactor — no behavior changes

This change SHALL NOT alter any user-facing behavior. All existing functionality MUST be preserved exactly as-is after component extraction.

#### Scenario: Build succeeds after refactor
- **WHEN** the refactored code is compiled with `npx vue-tsc --noEmit`
- **THEN** there are zero type errors
