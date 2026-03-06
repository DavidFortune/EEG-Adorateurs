## ADDED Requirements

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

#### Scenario: Non-square images display without distortion
- **WHEN** a user uploads a non-square (e.g., landscape or portrait) photo as their avatar
- **THEN** the image SHALL be cropped and scaled using `object-fit: cover` to fill the circular container without distortion

#### Scenario: Initials fallback remains unchanged
- **WHEN** a member does not have an uploaded avatar photo
- **THEN** the initials fallback SHALL continue to display as before with no visual change
