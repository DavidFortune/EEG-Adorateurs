## MODIFIED Requirements

### Requirement: isDraft default value for published programs
The `isDraft` computed property in `ServiceProgramPage.vue` SHALL default to `false` when the program value is null or the `isDraft` field is undefined, consistent with the Firestore data layer and other components.

#### Scenario: Published program without isDraft field
- **WHEN** a published service program is loaded that does not have an explicit `isDraft` field
- **THEN** the `isDraft` computed property SHALL return `false`

#### Scenario: Edit button visible for admin on published program
- **WHEN** an admin user views a published service program (isDraft is false or undefined)
- **AND** no edit lock is held by another user
- **THEN** the "Modifier le programme" button SHALL be visible

#### Scenario: Edit button hidden during loading
- **WHEN** the program value is null (still loading)
- **THEN** the edit button SHALL not be visible because the `program` condition in the v-if is falsy (independent of isDraft default)

#### Scenario: Draft program still treated as draft
- **WHEN** a program has `isDraft` explicitly set to `true`
- **THEN** the `isDraft` computed property SHALL return `true`
- **AND** the edit button SHALL not be visible (draft programs auto-enter edit mode)
