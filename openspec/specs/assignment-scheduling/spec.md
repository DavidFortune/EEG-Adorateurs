### Requirement: The system SHALL provide a service overview with date-based navigation
The assignment scheduling view MUST display an overview of all services. Users SHALL be able to navigate between dates using previous/next controls or a date picker to view services for a specific day, week, or month. The overview SHALL show the service name, date, time, and a summary of assignment status.

#### Scenario: User views the service overview for the current week
- **WHEN** a user opens the assignment scheduling view
- **THEN** the system SHALL display all services for the current week, ordered chronologically, with each service showing its name, date, time, and assignment summary

#### Scenario: User navigates to a future date
- **WHEN** a user clicks the "suivant" (next) navigation control on the service overview
- **THEN** the system SHALL advance the view to the next time period and display the services for that period

#### Scenario: User selects a specific date using the date picker
- **WHEN** a user selects a specific date using the date picker control
- **THEN** the system SHALL display all services that fall on or near the selected date, updating the overview accordingly

#### Scenario: No services exist for the selected date range
- **WHEN** a user navigates to a date range that contains no services
- **THEN** the system SHALL display an empty state message indicating that no services are scheduled for the selected period

### Requirement: The system SHALL support both team-specific and global display modes for assignments
Users MUST be able to switch between two display modes: a team view that shows assignments filtered to a single team, and a global view that shows assignments across all teams. The currently active mode SHALL be clearly indicated in the interface. Switching modes SHALL preserve the currently selected date range.

#### Scenario: User switches to team view
- **WHEN** a user selects a specific team from the display mode selector
- **THEN** the system SHALL filter the assignment overview to show only services and assignments relevant to the selected team, and the selected date range SHALL remain unchanged

#### Scenario: User switches to global view
- **WHEN** a user selects the "vue globale" (global view) option from the display mode selector
- **THEN** the system SHALL display assignments across all teams for the current date range, grouped or labeled by team

#### Scenario: Active display mode is visually indicated
- **WHEN** the user is viewing assignments in either team view or global view
- **THEN** the system SHALL visually highlight the currently active display mode in the interface so the user knows which mode is selected

### Requirement: Leaders SHALL be able to assign members to services with a specific position
Leaders and owners MUST be able to assign a team member to a service and specify the position they will fill for that service. The list of available positions SHALL be drawn from the team's configured positions. The list of assignable members SHALL show only members of the relevant team. The assignment SHALL be saved and displayed in the assignment and scheduling views.

#### Scenario: Leader assigns a member to a service with a position
- **WHEN** a leader selects a service, chooses a team member, and assigns them the position "Chanteur"
- **THEN** the system SHALL record the assignment and display the member's name and position on the service's assignment list

#### Scenario: Leader changes a member's assigned position for a service
- **WHEN** a leader selects an existing assignment and changes the member's position from "Chanteur" to "Pianiste"
- **THEN** the system SHALL update the assignment to reflect the new position and display the change in the assignment view

#### Scenario: Leader removes a member's assignment from a service
- **WHEN** a leader selects an existing assignment and removes the member from the service
- **THEN** the system SHALL delete the assignment and the member SHALL no longer appear on the service's assignment list

#### Scenario: Only team members are shown as assignable
- **WHEN** a leader opens the member selection interface for assigning a member to a service
- **THEN** the system SHALL display only members belonging to the relevant team, and SHALL NOT show members from other teams

### Requirement: Availability status SHALL be displayed with color-coded visual indicators
Each member's availability status MUST be represented by a distinct color in all views where availability is shown. The color coding SHALL be consistent across the application: one color for "disponible" (available), a different color for "indisponible" (unavailable), and a third color for "peut-être" (maybe). Members who have not yet indicated their availability SHALL be displayed with a neutral or distinct visual style.

#### Scenario: Available member is shown with the correct color
- **WHEN** a member has set their availability to "disponible" for a service
- **THEN** the system SHALL display that member's availability indicator using the color designated for "disponible" in the assignment and availability views

#### Scenario: Unavailable member is shown with the correct color
- **WHEN** a member has set their availability to "indisponible" for a service
- **THEN** the system SHALL display that member's availability indicator using the color designated for "indisponible"

#### Scenario: Maybe member is shown with the correct color
- **WHEN** a member has set their availability to "peut-être" for a service
- **THEN** the system SHALL display that member's availability indicator using the color designated for "peut-être"

#### Scenario: Member with no availability indication is shown with a neutral style
- **WHEN** a member has not yet indicated their availability for a service
- **THEN** the system SHALL display that member with a neutral visual style distinct from the three availability status colors, indicating that no response has been provided

### Requirement: The system SHALL prevent double assignments of a member to simultaneous services
When a leader attempts to assign a member to a service that overlaps in time with another service where the member is already assigned, the system MUST block the assignment and display an error. The check SHALL be based on the date and time ranges of the services. The system SHALL identify the conflicting service in the error message.

#### Scenario: Double assignment is blocked for overlapping services
- **WHEN** a leader attempts to assign a member to a service that overlaps in time with another service where the member is already assigned
- **THEN** the system SHALL reject the assignment, display an error message identifying the conflicting service, and SHALL NOT create the new assignment

#### Scenario: Assignment is allowed for non-overlapping services
- **WHEN** a leader assigns a member to a service whose time range does not overlap with any other service where the member is assigned
- **THEN** the system SHALL create the assignment successfully without displaying any conflict error

#### Scenario: Conflict message identifies the overlapping service
- **WHEN** a double assignment is blocked due to a time conflict
- **THEN** the error message SHALL include the name and time of the conflicting service so the leader can resolve the scheduling issue
