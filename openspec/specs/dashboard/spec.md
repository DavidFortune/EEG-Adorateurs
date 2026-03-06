### Requirement: Dashboard SHALL display a personalized greeting with the user's first name
When a user navigates to the dashboard (Accueil), the system SHALL display a personalized greeting that includes the user's first name. The greeting MUST be in French and SHALL reflect the current time of day when appropriate.

#### Scenario: User sees personalized greeting on dashboard
- **WHEN** a user navigates to the dashboard
- **THEN** the system SHALL display a greeting message that includes the user's first name (prenom)

#### Scenario: User with updated name sees current first name
- **WHEN** a user who has recently changed their first name in their profile navigates to the dashboard
- **THEN** the greeting SHALL reflect the updated first name

---

### Requirement: Dashboard SHALL display cards for services pending availability response
The dashboard MUST show a list of service cards for upcoming services where the current user has not yet responded with their availability. Each card SHALL display enough information for the user to identify the service and take action.

#### Scenario: User sees pending availability cards
- **WHEN** a user with pending availability requests opens the dashboard
- **THEN** the system SHALL display a card for each upcoming service where the user has not yet indicated their availability
- **AND** each card SHALL show the service title, date, and time

#### Scenario: User responds to availability from dashboard card
- **WHEN** a user taps on a pending availability service card
- **THEN** the system SHALL allow the user to indicate their availability (disponible, indisponible, or peut-etre) for that service

#### Scenario: No pending availability requests
- **WHEN** a user who has responded to all upcoming services opens the dashboard
- **THEN** the system SHALL NOT display any pending availability cards
- **AND** the system MAY display a message indicating that all availability responses are up to date

#### Scenario: Card disappears after availability response
- **WHEN** a user submits their availability response for a service from the dashboard
- **THEN** the corresponding pending availability card SHALL be removed from the dashboard

---

### Requirement: Dashboard SHALL display profile completion suggestions
The dashboard MUST show suggestions to the user for completing their profile when key information is missing. Suggestions SHALL include adding a phone number and configuring an avatar. Suggestions MUST be dismissible or disappear once the user completes the suggested action.

#### Scenario: User without phone number sees suggestion
- **WHEN** a user who has not added a phone number opens the dashboard
- **THEN** the system SHALL display a suggestion card prompting the user to add their phone number

#### Scenario: User without avatar sees suggestion
- **WHEN** a user who has not configured a profile avatar opens the dashboard
- **THEN** the system SHALL display a suggestion card prompting the user to upload or configure an avatar

#### Scenario: Suggestion disappears after completing action
- **WHEN** a user adds their phone number or configures an avatar after seeing the suggestion
- **THEN** the corresponding suggestion card SHALL no longer be displayed on the dashboard

#### Scenario: User with complete profile sees no suggestions
- **WHEN** a user who has both a phone number and an avatar opens the dashboard
- **THEN** the system SHALL NOT display any profile completion suggestions

---

### Requirement: Dashboard data SHALL synchronize in real time
All data displayed on the dashboard MUST be synchronized in real time via Firestore. When underlying data changes (new services, availability updates, profile changes), the dashboard SHALL reflect these changes without requiring the user to manually refresh the page.

#### Scenario: New service appears on dashboard in real time
- **WHEN** an administrator creates a new service that requires the user's availability response
- **THEN** the dashboard SHALL display a new pending availability card for that service without the user refreshing the page

#### Scenario: Availability update by another user reflects in real time
- **WHEN** another team member submits their availability for a service that is visible on the current user's dashboard
- **THEN** any related data on the dashboard SHALL update in real time

#### Scenario: Profile update reflects on dashboard in real time
- **WHEN** a user updates their first name from another device or browser tab
- **THEN** the dashboard greeting SHALL update to reflect the new first name without requiring a page refresh

#### Scenario: Service cancellation removes card in real time
- **WHEN** an administrator deletes or cancels a service for which the user has a pending availability card
- **THEN** the corresponding card SHALL be removed from the dashboard in real time
