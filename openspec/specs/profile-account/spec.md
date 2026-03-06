### Requirement: User profile SHALL include full name, email, and phone number with format validation
The system MUST store and display the user's full name, email address, and phone number. The email field MUST be validated for proper email format. The phone number field MUST be validated for proper phone number format. The system SHALL reject invalid values and display appropriate validation error messages in French.

#### Scenario: User enters a valid profile with all fields
- **WHEN** a user provides a full name, a valid email address, and a valid phone number
- **THEN** the system SHALL accept and save all profile fields successfully

#### Scenario: User enters an invalid email format
- **WHEN** a user enters an email address that does not conform to standard email format (e.g., missing "@" or domain)
- **THEN** the system SHALL display a validation error message
- **AND** the profile SHALL NOT be saved until the email is corrected

#### Scenario: User enters an invalid phone number format
- **WHEN** a user enters a phone number that does not conform to the expected format
- **THEN** the system SHALL display a validation error message
- **AND** the profile SHALL NOT be saved until the phone number is corrected

#### Scenario: User updates their full name
- **WHEN** a user modifies their full name in the profile settings
- **THEN** the updated name SHALL be persisted and reflected across the application

---

### Requirement: Custom avatar upload SHALL be limited to 10 MB and automatically optimized to 400x400px
The system MUST allow users to upload a custom avatar image. The uploaded file MUST NOT exceed 10 MB in size. Upon upload, the system SHALL automatically resize and optimize the image to 400x400 pixels. The optimized image SHALL be stored and used as the user's avatar throughout the application.

#### Scenario: User uploads a valid avatar image under 10 MB
- **WHEN** a user uploads an image file that is under 10 MB
- **THEN** the system SHALL accept the file, resize it to 400x400px, and save it as the user's avatar

#### Scenario: User uploads an image exceeding 10 MB
- **WHEN** a user attempts to upload an image file that exceeds 10 MB
- **THEN** the system SHALL reject the upload
- **AND** the system SHALL display an error message indicating the maximum file size

#### Scenario: Uploaded image is automatically optimized
- **WHEN** a user uploads a high-resolution image (e.g., 3000x2000px)
- **THEN** the system SHALL automatically resize the image to 400x400px
- **AND** the original aspect ratio SHALL be handled using cover-fit cropping to fill the square dimensions

---

### Requirement: Initials fallback with colored background SHALL display when no avatar is set
When a user does not have a custom avatar uploaded, the system MUST display the user's initials as a fallback. The initials SHALL be derived from the user's full name (first letter of first name and first letter of last name). The initials MUST be displayed on a colored circular background. The background color SHALL be consistently assigned to the user.

#### Scenario: User without an avatar sees initials fallback
- **WHEN** a user who has not uploaded a custom avatar is displayed in any avatar component
- **THEN** the system SHALL render the user's initials on a colored circular background

#### Scenario: Initials are derived from full name
- **WHEN** a user's full name is "Jean Dupont"
- **THEN** the initials displayed SHALL be "JD"

#### Scenario: Color assignment is consistent
- **WHEN** a user without an avatar is displayed across multiple views or sessions
- **THEN** the colored background for their initials SHALL remain the same color each time

#### Scenario: User uploads an avatar after using initials fallback
- **WHEN** a user who previously had the initials fallback uploads a custom avatar
- **THEN** the system SHALL replace the initials fallback with the uploaded avatar image in all components

---

### Requirement: Avatar display SHALL be consistent across all components
The user's avatar (or initials fallback) MUST be displayed consistently in the application header, member lists, and participant selectors. All avatar components MUST render the image as a circular element with cover-fit scaling. The avatar size MAY vary by component, but the rendering style MUST remain uniform.

#### Scenario: Avatar displays in the application header
- **WHEN** a user with a custom avatar is logged in
- **THEN** the header SHALL display the user's avatar as a circular image

#### Scenario: Avatar displays in member lists
- **WHEN** a member list is rendered (e.g., team members view)
- **THEN** each member's avatar or initials fallback SHALL be displayed as a circular element next to their name

#### Scenario: Avatar displays in participant selectors
- **WHEN** a participant selector is rendered (e.g., assigning a member to a program element)
- **THEN** each selectable member's avatar or initials fallback SHALL be displayed as a circular element

#### Scenario: Initials fallback is consistent across all components
- **WHEN** a user without a custom avatar appears in the header, a member list, and a participant selector
- **THEN** the initials and background color SHALL be identical across all three components
