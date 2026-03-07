## MODIFIED Requirements

### Requirement: Avatar images SHALL render as circular cover-fit images in all components
All components that display user avatars MUST apply consistent CSS styling to `<img>` elements inside avatar containers: `width: 100%`, `height: 100%`, `object-fit: cover`, and `border-radius: 50%`.

#### Scenario: Uploaded avatar displays correctly in MembersOverview
- **WHEN** a member with an uploaded avatar photo is displayed in the MembersOverview component
- **THEN** the avatar image SHALL render as a 44px circular image with cover-fit scaling

#### Scenario: Uploaded avatar displays correctly in UserMenu
- **WHEN** a user with an uploaded avatar photo opens the UserMenu
- **THEN** the avatar image SHALL render as a 48px circular image with cover-fit scaling

#### Scenario: Uploaded avatar displays correctly in ParticipantSelector
- **WHEN** a member with an uploaded avatar photo is shown in the ParticipantSelector
- **THEN** the avatar image SHALL render as a 36px circular image with cover-fit scaling

#### Scenario: Uploaded avatar displays correctly in ServiceMembersPage
- **WHEN** a member with an avatar is displayed in the ServiceMembersPage team list
- **THEN** the avatar image SHALL render as a 40px circular image with cover-fit scaling

#### Scenario: Uploaded avatar displays correctly in ServiceDetailPage
- **WHEN** a member with an avatar is displayed in the ServiceDetailPage members section
- **THEN** the avatar image SHALL render as a circular image with cover-fit scaling

#### Scenario: Non-square images display without distortion
- **WHEN** a user uploads a non-square (e.g., landscape or portrait) photo as their avatar
- **THEN** the image SHALL be cropped and scaled using `object-fit: cover` to fill the circular container without distortion

#### Scenario: Initials fallback remains unchanged
- **WHEN** a member does not have an uploaded avatar photo
- **THEN** the initials fallback SHALL continue to display as before with no visual change

## ADDED Requirements

### Requirement: Avatar images SHALL fall back to initials when the image URL fails to load
All avatar `<img>` elements MUST include an `@error` handler that triggers the initials fallback when the image URL is broken, expired, or unreachable. The `v-if` condition on the `<img>` MUST check both that the avatar field exists AND that it has not previously failed to load. This ensures users never see broken image icons.

#### Scenario: Avatar URL is broken or expired
- **WHEN** a member's avatar URL fails to load (HTTP error, expired Google URL, etc.)
- **THEN** the `<img>` element SHALL be hidden
- **AND** the initials fallback SHALL be displayed instead

#### Scenario: Avatar URL loads successfully
- **WHEN** a member's avatar URL loads without error
- **THEN** the avatar image SHALL be displayed normally
- **AND** no initials fallback SHALL be shown

#### Scenario: All avatar components are protected
- **WHEN** any component in the app renders a member avatar
- **THEN** it MUST use the `@error` fallback pattern
- **AND** broken image icons MUST never be visible to the user

### Requirement: Google photoURL SHALL be synced to Firestore member avatar on login
When a member logs in and their Firestore member document has no `avatar` field, the system MUST check if the Firebase Auth user has a `photoURL` and, if so, update the member's Firestore `avatar` field with that URL. This sync MUST NOT overwrite a custom-uploaded avatar.

#### Scenario: Member without avatar logs in with Google photo
- **WHEN** a member with no `avatar` field in Firestore logs in and their Firebase Auth user has a `photoURL`
- **THEN** the system SHALL update the member's Firestore document to set `avatar` to the Google `photoURL`

#### Scenario: Member with custom avatar logs in
- **WHEN** a member who has a custom-uploaded `avatar` in Firestore logs in
- **THEN** the system SHALL NOT overwrite the existing `avatar` field

#### Scenario: Member without avatar and without Google photo logs in
- **WHEN** a member with no `avatar` field logs in and the Firebase Auth user has no `photoURL`
- **THEN** the system SHALL NOT set the `avatar` field
- **AND** the initials fallback SHALL be displayed
