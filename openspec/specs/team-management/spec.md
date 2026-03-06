### Requirement: Users with appropriate roles SHALL be able to create and edit teams with a name, description, and icon
Team creation MUST require a name and MUST allow an optional description and a selection from the 13 predefined ministry icons. The name SHALL be unique across the organization. Editing a team SHALL allow modification of the name, description, and icon. Only users with the owner or leader role SHALL be permitted to create or edit teams.

#### Scenario: Owner creates a new team with all fields
- **WHEN** an owner fills in the team name "Louange", enters a description "Équipe de louange et d'adoration", and selects a ministry icon, then submits the form
- **THEN** the system SHALL create the team with the specified name, description, and icon, and the team SHALL appear in the team list

#### Scenario: Leader edits an existing team's description and icon
- **WHEN** a leader navigates to a team they lead, updates the description, and selects a different icon from the 13 available ministry icons
- **THEN** the system SHALL save the updated description and icon, and the changes SHALL be reflected in the team detail view

#### Scenario: Team creation fails when name is missing
- **WHEN** a user attempts to create a team without providing a name
- **THEN** the system SHALL display a validation error indicating that the team name is required and SHALL NOT create the team

#### Scenario: Team creation fails when name already exists
- **WHEN** a user attempts to create a team with a name that is already used by another team
- **THEN** the system SHALL display an error indicating that the team name must be unique and SHALL NOT create the team

### Requirement: The system SHALL enforce a role hierarchy of owner, leader, member, and guest
The system MUST support exactly four roles in descending order of privilege: propriétaire (owner), responsable (leader), membre (member), and invité (guest). Each role SHALL inherit the permissions of all roles below it. The owner SHALL have full administrative control over the team. The leader SHALL be able to manage members, positions, and assignments. The member SHALL be able to view team information and manage their own availability. The guest SHALL have read-only access to limited team information.

#### Scenario: Owner assigns the leader role to a member
- **WHEN** an owner selects a team member and changes their role to "responsable"
- **THEN** the system SHALL update the member's role to "responsable" and the member SHALL gain leader-level permissions for that team

#### Scenario: Leader cannot promote a member to owner
- **WHEN** a leader attempts to change a member's role to "propriétaire"
- **THEN** the system SHALL deny the action and display a message indicating that only owners can assign the owner role

#### Scenario: Guest has read-only access
- **WHEN** a user with the "invité" role accesses the team detail view
- **THEN** the system SHALL display team information in read-only mode and SHALL NOT show editing controls, assignment actions, or availability management options

#### Scenario: Member manages their own availability but cannot manage others
- **WHEN** a user with the "membre" role accesses the team view
- **THEN** the system SHALL allow them to set and update their own availability but SHALL NOT display options to manage other members' roles, positions, or assignments

### Requirement: Teams SHALL support configurable positions specific to each team
Each team MUST allow the definition of custom positions relevant to its ministry (e.g., chanteur, pianiste, batteur for a worship team). Positions SHALL be created, edited, and deleted by owners or leaders. Each position SHALL have a unique name within the team. Members MAY be assigned one or more positions within a team.

#### Scenario: Leader adds a new position to the team
- **WHEN** a leader navigates to the team settings and adds a new position named "Pianiste"
- **THEN** the system SHALL save the position and it SHALL appear in the list of available positions for that team

#### Scenario: Leader deletes an existing position
- **WHEN** a leader deletes the position "Guitariste" from the team
- **THEN** the system SHALL remove the position from the team's position list and SHALL remove the position assignment from any members who held it

#### Scenario: Position name must be unique within the team
- **WHEN** a leader attempts to add a position with a name that already exists in the same team
- **THEN** the system SHALL display an error indicating that the position name must be unique within the team and SHALL NOT create the duplicate

#### Scenario: Member is assigned a position within the team
- **WHEN** a leader assigns the position "Chanteur" to a team member
- **THEN** the system SHALL record the position assignment and the member's position SHALL be visible in the team detail and assignment views

### Requirement: The system SHALL provide a membership request and approval workflow
Non-members MUST be able to request membership to a team. The request SHALL be visible to the team's owners and leaders. Owners and leaders MUST be able to approve or reject membership requests. Upon approval, the new member SHALL be assigned the "membre" role by default.

#### Scenario: User requests to join a team
- **WHEN** a user who is not a member of a team submits a membership request
- **THEN** the system SHALL record the request and notify the team's owners and leaders that a new membership request is pending

#### Scenario: Leader approves a membership request
- **WHEN** a leader views a pending membership request and approves it
- **THEN** the system SHALL add the user as a member of the team with the "membre" role, and the user SHALL be notified of the approval

#### Scenario: Owner rejects a membership request
- **WHEN** an owner views a pending membership request and rejects it
- **THEN** the system SHALL remove the request from the pending list and the user SHALL be notified that their request was not approved

#### Scenario: Duplicate membership request is prevented
- **WHEN** a user who already has a pending request or is already a member of the team attempts to submit a membership request
- **THEN** the system SHALL display a message indicating that a request is already pending or that the user is already a member, and SHALL NOT create a duplicate request

### Requirement: The system SHALL provide dedicated team views for detail, scheduling, availability, and assignments
Each team MUST have the following distinct views accessible to authorized users: a detail view showing team information and member list, a scheduling view showing upcoming services, an availability view showing member availability per service, and an assignments view showing who is assigned to which service and position. Navigation between these views SHALL be clear and consistent.

#### Scenario: User navigates to the team detail view
- **WHEN** a user selects a team from the team list
- **THEN** the system SHALL display the team detail view showing the team name, description, icon, member list with their roles and positions

#### Scenario: Leader accesses the scheduling view
- **WHEN** a leader navigates to the scheduling view for their team
- **THEN** the system SHALL display a list of upcoming services relevant to the team, ordered by date

#### Scenario: Leader accesses the availability view for a specific service
- **WHEN** a leader navigates to the availability view and selects a specific service
- **THEN** the system SHALL display each team member's availability status (disponible, indisponible, peut-être) for that service, along with any comments

#### Scenario: Leader accesses the assignments view
- **WHEN** a leader navigates to the assignments view for their team
- **THEN** the system SHALL display a list of services with the assigned members and their positions for each service
