### Requirement: System SHALL support full CRUD operations for services with all required fields
Administrators and team leaders SHALL be able to create, read, update, and delete services. Each service MUST include the following fields: title, start date/time, end date/time, category (service regulier or evenement special), availability deadline, and team requirements. The system SHALL validate that all required fields are provided before saving.

#### Scenario: Administrator creates a new service with all fields
- **WHEN** an administrator fills in the service creation form with a title, start date/time, end date/time, category, availability deadline, and team requirements
- **THEN** the system SHALL save the service to Firestore
- **AND** the service SHALL appear in the service list

#### Scenario: Team leader creates a new service
- **WHEN** a team leader fills in the service creation form with all required fields
- **THEN** the system SHALL save the service to Firestore
- **AND** the service SHALL appear in the service list

#### Scenario: User selects service category
- **WHEN** a user creating or editing a service selects the category field
- **THEN** the system SHALL offer exactly two options: "Service regulier" and "Evenement special"

#### Scenario: Service creation fails with missing required fields
- **WHEN** a user attempts to save a service without providing all required fields (e.g., missing title or start date)
- **THEN** the system SHALL display a validation error in French indicating which fields are missing
- **AND** the service SHALL NOT be saved

#### Scenario: Administrator edits an existing service
- **WHEN** an administrator modifies any field of an existing service and saves
- **THEN** the system SHALL update the service in Firestore with the new values
- **AND** the updated information SHALL be reflected wherever the service is displayed

#### Scenario: Administrator deletes a service
- **WHEN** an administrator deletes a service
- **THEN** the service SHALL be removed from the service list
- **AND** any related availability responses and assignments SHALL be handled appropriately

#### Scenario: Availability deadline is set
- **WHEN** a user sets an availability deadline on a service
- **THEN** the system SHALL store the deadline date
- **AND** members SHALL be expected to submit their availability before this deadline

#### Scenario: Team requirements are specified
- **WHEN** a user specifies team requirements for a service (e.g., which teams are needed)
- **THEN** the system SHALL store the team requirements
- **AND** only members of the required teams SHALL be prompted for availability

#### Scenario: Regular member cannot create a service
- **WHEN** a user with the "membre" role attempts to create a service
- **THEN** the system SHALL NOT allow the creation
- **AND** the create service option SHALL NOT be visible to the user

---

### Requirement: Service list SHALL display upcoming and past services with status badges, computed duration, and category filtering
The service list view SHALL display all services organized into upcoming and past sections. Each service entry MUST show a status badge indicating whether it is published or in draft mode. The computed duration (difference between start and end date/time) SHALL be displayed for each service. Users SHALL be able to filter the list by category.

#### Scenario: User views upcoming services
- **WHEN** a user navigates to the service list
- **THEN** the system SHALL display upcoming services (services with a start date/time in the future) sorted by date in ascending order

#### Scenario: User views past services
- **WHEN** a user scrolls to or selects the past services section
- **THEN** the system SHALL display past services (services with a start date/time in the past) sorted by date in descending order

#### Scenario: Status badge displays published state
- **WHEN** a service has been published
- **THEN** the service entry in the list SHALL display a "Publie" badge

#### Scenario: Status badge displays draft state
- **WHEN** a service is in draft mode
- **THEN** the service entry in the list SHALL display a "Brouillon" badge

#### Scenario: Computed duration is displayed
- **WHEN** a service has both a start and end date/time
- **THEN** the system SHALL compute and display the duration of the service (e.g., "2h30")

#### Scenario: User filters services by category
- **WHEN** a user applies a category filter (e.g., "Service regulier" or "Evenement special")
- **THEN** the service list SHALL display only services matching the selected category

#### Scenario: User clears category filter
- **WHEN** a user clears the category filter
- **THEN** the service list SHALL display all services regardless of category

---

### Requirement: Service detail page SHALL provide a tabbed interface with Programme, Ressources, and Membres tabs
The service detail page SHALL present information in a tabbed interface with three tabs: Programme, Ressources, and Membres. Each tab SHALL display the relevant content for the selected service. The user SHALL be able to switch between tabs without losing context.

#### Scenario: User opens service detail page
- **WHEN** a user taps on a service in the service list
- **THEN** the system SHALL navigate to the service detail page
- **AND** the page SHALL display the service title, date/time, category, and a tabbed interface

#### Scenario: User views the Programme tab
- **WHEN** a user selects the "Programme" tab on the service detail page
- **THEN** the system SHALL display the service program with its ordered list of elements (chants, prieres, lectures, etc.)

#### Scenario: User views the Ressources tab
- **WHEN** a user selects the "Ressources" tab on the service detail page
- **THEN** the system SHALL display all resources linked to the service (paroles, partitions, videos, etc.)

#### Scenario: User views the Membres tab
- **WHEN** a user selects the "Membres" tab on the service detail page
- **THEN** the system SHALL display the list of team members associated with the service, along with their availability status and assigned positions

#### Scenario: Tab state is preserved during navigation
- **WHEN** a user switches between tabs on the service detail page
- **THEN** the content of each tab SHALL load without losing the scroll position or state of previously viewed tabs

---

### Requirement: Services SHALL support sharing via WhatsApp, SMS, and email, and provide invitation links
The service detail page SHALL allow users to share the service via WhatsApp, SMS, and email using the device's native sharing capabilities. The system SHALL also generate shareable invitation links that allow members outside of teams to access the service as guests.

#### Scenario: User shares a service via native share sheet
- **WHEN** a user taps the share button on the service detail page
- **THEN** the system SHALL open the native share sheet (feuille de partage)
- **AND** the share sheet SHALL include options for WhatsApp, SMS, and email

#### Scenario: Shared content includes service details
- **WHEN** a user shares a service via any channel
- **THEN** the shared content SHALL include the service title, date/time, and an invitation link

#### Scenario: User generates an invitation link
- **WHEN** a user requests an invitation link for a service
- **THEN** the system SHALL generate a unique shareable URL for that service

#### Scenario: Guest accesses service via invitation link
- **WHEN** a person who is not a team member opens a service invitation link
- **THEN** the system SHALL grant the person guest access to view the service details
- **AND** the guest SHALL be able to indicate their availability for the service

#### Scenario: Invitation link remains valid
- **WHEN** an invitation link has been generated for a service
- **THEN** the link SHALL remain valid and accessible until the service date has passed or the link is explicitly revoked by an administrator
