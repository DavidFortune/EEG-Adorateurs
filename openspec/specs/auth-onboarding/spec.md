### Requirement: User authentication SHALL support Google OAuth and email/password via Firebase Auth
The system SHALL allow users to authenticate using either Google OAuth or an email/password combination. Authentication MUST be handled through Firebase Authentication. Upon successful authentication, the user SHALL be granted access to the application and redirected to the appropriate screen (onboarding for new users, dashboard for returning users).

#### Scenario: User logs in with Google OAuth
- **WHEN** a user taps the "Connexion avec Google" button on the login screen
- **THEN** the system SHALL initiate the Google OAuth flow via Firebase Auth
- **AND** upon successful Google authentication, the user SHALL be redirected to the onboarding flow if they are a new user, or to the dashboard if they have already completed onboarding

#### Scenario: User logs in with email and password
- **WHEN** a user enters a valid email and password and submits the login form
- **THEN** the system SHALL authenticate the credentials via Firebase Auth
- **AND** upon successful authentication, the user SHALL be redirected to the onboarding flow if they are a new user, or to the dashboard if they have already completed onboarding

#### Scenario: User provides invalid email/password credentials
- **WHEN** a user enters an incorrect email or password and submits the login form
- **THEN** the system SHALL display an error message in French indicating that the credentials are invalid
- **AND** the user SHALL remain on the login screen

#### Scenario: User registers a new account with email/password
- **WHEN** a new user provides a valid email and a password that meets the minimum requirements
- **THEN** the system SHALL create a new account via Firebase Auth
- **AND** the user SHALL be redirected to step 1 (bienvenue) of the onboarding flow

#### Scenario: Returning authenticated user opens the app
- **WHEN** a user who is already authenticated opens the application
- **THEN** the system SHALL restore the Firebase Auth session automatically
- **AND** the user SHALL be taken directly to the dashboard without seeing the login screen

---

### Requirement: Onboarding SHALL guide new users through a 6-step flow with a progress bar
New users MUST complete a guided onboarding flow consisting of exactly 6 steps: (1) bienvenue (welcome), (2) informations personnelles (personal info), (3) telephone (phone number), (4) selection d'equipes (team selection), (5) disponibilites initiales (initial availability), and (6) confirmation. A progress bar MUST be displayed throughout the flow indicating the current step and overall progress. Users SHALL be able to navigate forward and backward between steps.

#### Scenario: New user sees the welcome step
- **WHEN** a newly registered user enters the onboarding flow
- **THEN** the system SHALL display step 1 "Bienvenue" with a welcome message
- **AND** the progress bar SHALL indicate step 1 of 6

#### Scenario: User progresses through personal info step
- **WHEN** the user completes the welcome step and advances to step 2
- **THEN** the system SHALL display the "Informations personnelles" form requesting the user's full name
- **AND** the progress bar SHALL update to indicate step 2 of 6

#### Scenario: User enters phone number
- **WHEN** the user advances to step 3
- **THEN** the system SHALL display the "Telephone" form for entering a phone number
- **AND** the phone number field SHALL validate the format before allowing the user to proceed

#### Scenario: User selects teams to join
- **WHEN** the user advances to step 4
- **THEN** the system SHALL display a list of available teams for the user to select
- **AND** the user SHALL be able to select one or more teams to request membership

#### Scenario: User sets initial availability
- **WHEN** the user advances to step 5
- **THEN** the system SHALL display upcoming services for which the user can indicate initial availability
- **AND** the user SHALL be able to mark each service as disponible, indisponible, or peut-etre

#### Scenario: User completes onboarding at confirmation step
- **WHEN** the user reaches step 6 "Confirmation"
- **THEN** the system SHALL display a summary of the information provided
- **AND** upon confirmation, the user SHALL be redirected to the dashboard

#### Scenario: User navigates backward during onboarding
- **WHEN** the user is on any step after step 1 and taps the back button
- **THEN** the system SHALL navigate to the previous step
- **AND** the progress bar SHALL update accordingly
- **AND** any data previously entered on the current step SHALL be preserved

#### Scenario: Progress bar reflects current step
- **WHEN** the user is on step N of the onboarding flow
- **THEN** the progress bar SHALL visually indicate that N out of 6 steps have been reached

---

### Requirement: Team membership SHALL require leader approval
When a user requests to join a team during onboarding or at any later time, the request MUST be submitted for approval. A team leader (responsable) or administrator SHALL be notified of the pending request. The requesting user SHALL NOT be granted team membership until the request is explicitly approved by an authorized person.

#### Scenario: User requests to join a team during onboarding
- **WHEN** a user selects one or more teams during step 4 of the onboarding flow
- **THEN** the system SHALL create a pending membership request for each selected team
- **AND** the user's membership status for those teams SHALL be "en attente" (pending)

#### Scenario: Team leader views pending membership requests
- **WHEN** a team leader navigates to their team management view
- **THEN** the system SHALL display a list of all pending membership requests for that team
- **AND** each request SHALL show the requesting member's name and the date of the request

#### Scenario: Team leader approves a membership request
- **WHEN** a team leader approves a pending membership request
- **THEN** the requesting user SHALL be added to the team as a member
- **AND** the user SHALL gain access to that team's services, resources, and planning views

#### Scenario: Team leader denies a membership request
- **WHEN** a team leader denies a pending membership request
- **THEN** the requesting user SHALL NOT be added to the team
- **AND** the pending request SHALL be removed from the team leader's queue

#### Scenario: Administrator approves a membership request
- **WHEN** an administrator approves a pending membership request for any team
- **THEN** the requesting user SHALL be added to the team as a member
- **AND** the behavior SHALL be identical to a team leader approval
