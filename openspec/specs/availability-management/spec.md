### Requirement: Members SHALL indicate their availability per service as available, unavailable, or maybe with an optional comment
Each member MUST be able to set their availability status for any given service. The status options SHALL be exactly three: "disponible" (available), "indisponible" (unavailable), and "peut-être" (maybe). When setting a status, the member MAY provide an optional free-text comment to give additional context (e.g., reason for unavailability or conditions for a maybe).

#### Scenario: Member sets availability to available for a service
- **WHEN** a member selects a service and chooses the "disponible" status
- **THEN** the system SHALL record the member's availability as "disponible" for that service and display the status accordingly

#### Scenario: Member sets availability to unavailable with a comment
- **WHEN** a member selects a service, chooses the "indisponible" status, and enters a comment such as "En déplacement"
- **THEN** the system SHALL record the member's availability as "indisponible" with the associated comment, and both SHALL be visible to leaders and admins

#### Scenario: Member sets availability to maybe without a comment
- **WHEN** a member selects a service and chooses the "peut-être" status without entering a comment
- **THEN** the system SHALL record the member's availability as "peut-être" with no comment, and the status SHALL be displayed without requiring the comment field to be filled

#### Scenario: Member updates an existing availability indication
- **WHEN** a member who has already indicated their availability for a service changes their status or comment
- **THEN** the system SHALL update the recorded availability to reflect the new status and comment, replacing the previous values

### Requirement: Availability lists SHALL be filterable by team and by status
Users with appropriate permissions MUST be able to filter the availability view to show only members of a specific team, only members with a specific status, or a combination of both filters. The filters SHALL apply immediately and update the displayed list without requiring a page reload.

#### Scenario: Admin filters availability by team
- **WHEN** an admin selects a specific team from the team filter on the availability view
- **THEN** the system SHALL display only the availability indications of members belonging to the selected team

#### Scenario: Admin filters availability by status
- **WHEN** an admin selects the "indisponible" status filter on the availability view
- **THEN** the system SHALL display only members whose availability for the current service is set to "indisponible"

#### Scenario: Admin filters availability by team and status combined
- **WHEN** an admin selects a specific team and the "peut-être" status filter simultaneously
- **THEN** the system SHALL display only members of the selected team whose availability is set to "peut-être"

#### Scenario: No members match the applied filters
- **WHEN** an admin applies a combination of team and status filters that matches no members
- **THEN** the system SHALL display an empty list with a message indicating that no members match the selected filters

### Requirement: The system SHALL automatically detect and alert on conflicts when two services overlap
When a member indicates availability for a service that overlaps in time with another service for which they are already marked as available or assigned, the system MUST detect the conflict and display an automatic alert. The conflict detection SHALL be based on the date and time ranges of the services.

#### Scenario: Conflict detected when member is available for two overlapping services
- **WHEN** a member sets their availability to "disponible" for a service whose time range overlaps with another service where they are already marked "disponible"
- **THEN** the system SHALL display a conflict alert indicating the two overlapping services, including their names and times

#### Scenario: No conflict when services do not overlap
- **WHEN** a member sets their availability to "disponible" for a service whose time range does not overlap with any other service where they are available
- **THEN** the system SHALL record the availability without displaying any conflict alert

#### Scenario: Conflict alert shown to admin viewing assignments
- **WHEN** an admin views the availability or assignment screen and a member has conflicting availability across overlapping services
- **THEN** the system SHALL visually highlight the conflict on the admin's view so that the admin can resolve it

### Requirement: Admins SHALL be able to send availability requests via SMS to team members
Admin users MUST have the ability to send an SMS message to one or more team members requesting that they indicate their availability for a specific service or set of services. The SMS SHALL contain a clear message identifying the service(s) and a link or instructions for the member to respond.

#### Scenario: Admin sends an SMS availability request to all members of a team
- **WHEN** an admin selects a team and a service, then triggers the "Envoyer demande de disponibilité par SMS" action
- **THEN** the system SHALL send an SMS to each member of the selected team who has a phone number on file, with a message requesting their availability for the specified service

#### Scenario: Admin sends an SMS availability request to a single member
- **WHEN** an admin selects a single team member and triggers the SMS availability request for a specific service
- **THEN** the system SHALL send an SMS to that member's registered phone number requesting their availability for the specified service

#### Scenario: SMS not sent to member without a phone number
- **WHEN** an admin triggers an SMS availability request for a team that includes a member without a registered phone number
- **THEN** the system SHALL skip that member, send SMS to all other eligible members, and display a notification to the admin listing the members who could not be reached
