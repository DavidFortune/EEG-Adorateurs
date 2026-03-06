### Requirement: Application SHALL enforce a four-tier role hierarchy of Admin, Leader, Member, and Guest
The application MUST support exactly four roles: Admin, Leader, Member, and Guest. Each user MUST be assigned exactly one role. The role hierarchy from highest to lowest privilege SHALL be: Admin, Leader, Member, Guest. Role assignment MUST be stored in the user's profile and enforced on both the client and server side.

#### Scenario: Each user has exactly one assigned role
- **WHEN** a user account exists in the system
- **THEN** the user SHALL have exactly one role assigned from the set: Admin, Leader, Member, Guest

#### Scenario: Role hierarchy is enforced for permission checks
- **WHEN** the application evaluates a permission for a user action
- **THEN** the permission check SHALL be based on the user's assigned role within the four-tier hierarchy

#### Scenario: Role is persisted in the user profile
- **WHEN** a user's role is assigned or changed
- **THEN** the role SHALL be stored in the user's profile in Firebase and reflected immediately in the application

---

### Requirement: Admin role SHALL have full access to all application features
Users with the Admin role MUST have unrestricted access to every feature in the application. This includes: viewing, creating, and editing services; creating and editing teams; managing team members; approving requests; viewing and editing programs; managing resources; indicating and viewing availability; assigning members; sending SMS; managing drafts; and editing their avatar.

#### Scenario: Admin can view all services
- **WHEN** a user with the Admin role navigates to the services list
- **THEN** all services SHALL be visible to the user

#### Scenario: Admin can create and edit services
- **WHEN** a user with the Admin role attempts to create or edit a service
- **THEN** the operation SHALL be permitted

#### Scenario: Admin can create and edit teams
- **WHEN** a user with the Admin role attempts to create or edit a team
- **THEN** the operation SHALL be permitted

#### Scenario: Admin can manage team members
- **WHEN** a user with the Admin role attempts to add or remove team members
- **THEN** the operation SHALL be permitted

#### Scenario: Admin can approve requests
- **WHEN** a user with the Admin role views pending requests
- **THEN** the user SHALL be able to approve or reject the requests

#### Scenario: Admin can view and edit programs
- **WHEN** a user with the Admin role accesses a service program
- **THEN** the user SHALL be able to both view and edit the program

#### Scenario: Admin can manage resources
- **WHEN** a user with the Admin role accesses the resource library
- **THEN** the user SHALL be able to create, edit, and delete resources

#### Scenario: Admin can indicate and view availability
- **WHEN** a user with the Admin role accesses the availability feature
- **THEN** the user SHALL be able to indicate their own availability and view the availability of all other users

#### Scenario: Admin can assign members to services
- **WHEN** a user with the Admin role accesses member assignment for a service
- **THEN** the user SHALL be able to assign and unassign members

#### Scenario: Admin can send SMS
- **WHEN** a user with the Admin role accesses the SMS feature
- **THEN** the user SHALL be able to compose and send SMS messages

#### Scenario: Admin can manage drafts
- **WHEN** a user with the Admin role accesses the drafts feature
- **THEN** the user SHALL be able to create, edit, and delete drafts

#### Scenario: Admin can edit their avatar
- **WHEN** a user with the Admin role accesses their profile
- **THEN** the user SHALL be able to upload or change their avatar image

---

### Requirement: Leader role SHALL have permissions for service management, team management, availability viewing, and member assignment
Users with the Leader role MUST be able to: view, create, and edit services; manage team members; approve requests; view programs (but not edit them); indicate their own availability and view the availability of others; assign members to services; and edit their avatar. Leaders MUST NOT be able to: create or edit teams, edit programs, manage resources, send SMS, or manage drafts.

#### Scenario: Leader can view all services
- **WHEN** a user with the Leader role navigates to the services list
- **THEN** all services SHALL be visible to the user

#### Scenario: Leader can create and edit services
- **WHEN** a user with the Leader role attempts to create or edit a service
- **THEN** the operation SHALL be permitted

#### Scenario: Leader can manage team members
- **WHEN** a user with the Leader role attempts to add or remove members from a team
- **THEN** the operation SHALL be permitted

#### Scenario: Leader can approve requests
- **WHEN** a user with the Leader role views pending requests
- **THEN** the user SHALL be able to approve or reject the requests

#### Scenario: Leader can view programs but cannot edit them
- **WHEN** a user with the Leader role accesses a service program
- **THEN** the program content SHALL be visible
- **THEN** the edit controls SHALL NOT be available to the user

#### Scenario: Leader can indicate and view availability
- **WHEN** a user with the Leader role accesses the availability feature
- **THEN** the user SHALL be able to indicate their own availability and view the availability of all other users

#### Scenario: Leader can assign members to services
- **WHEN** a user with the Leader role accesses member assignment for a service
- **THEN** the user SHALL be able to assign and unassign members

#### Scenario: Leader can edit their avatar
- **WHEN** a user with the Leader role accesses their profile
- **THEN** the user SHALL be able to upload or change their avatar image

#### Scenario: Leader cannot create or edit teams
- **WHEN** a user with the Leader role attempts to create or edit a team
- **THEN** the operation SHALL be denied and the team creation/editing controls SHALL NOT be available

#### Scenario: Leader cannot edit programs
- **WHEN** a user with the Leader role attempts to modify a service program
- **THEN** the edit operation SHALL be denied

#### Scenario: Leader cannot manage resources
- **WHEN** a user with the Leader role attempts to access resource management
- **THEN** the resource management controls SHALL NOT be available

#### Scenario: Leader cannot send SMS
- **WHEN** a user with the Leader role attempts to access the SMS feature
- **THEN** the SMS sending controls SHALL NOT be available

#### Scenario: Leader cannot manage drafts
- **WHEN** a user with the Leader role attempts to access the drafts feature
- **THEN** the draft management controls SHALL NOT be available

---

### Requirement: Member role SHALL be limited to viewing services and programs, indicating availability, and editing their avatar
Users with the Member role MUST be able to: view services, view programs, indicate their own availability, and edit their avatar. Members MUST NOT be able to: create or edit services, create or edit teams, manage team members, approve requests, edit programs, manage resources, view other users' availability, assign members, send SMS, or manage drafts.

#### Scenario: Member can view services
- **WHEN** a user with the Member role navigates to the services list
- **THEN** the services SHALL be visible to the user

#### Scenario: Member can view programs
- **WHEN** a user with the Member role accesses a service program
- **THEN** the program content SHALL be visible to the user

#### Scenario: Member can indicate their own availability
- **WHEN** a user with the Member role accesses the availability feature
- **THEN** the user SHALL be able to indicate their own availability

#### Scenario: Member can edit their avatar
- **WHEN** a user with the Member role accesses their profile
- **THEN** the user SHALL be able to upload or change their avatar image

#### Scenario: Member cannot create or edit services
- **WHEN** a user with the Member role attempts to create or edit a service
- **THEN** the operation SHALL be denied and the service creation/editing controls SHALL NOT be available

#### Scenario: Member cannot create or edit teams
- **WHEN** a user with the Member role attempts to create or edit a team
- **THEN** the operation SHALL be denied and the team management controls SHALL NOT be available

#### Scenario: Member cannot manage team members
- **WHEN** a user with the Member role attempts to add or remove team members
- **THEN** the operation SHALL be denied

#### Scenario: Member cannot approve requests
- **WHEN** a user with the Member role views the application
- **THEN** the request approval controls SHALL NOT be available

#### Scenario: Member cannot view other users' availability
- **WHEN** a user with the Member role accesses the availability feature
- **THEN** only their own availability SHALL be visible and other users' availability SHALL be hidden

#### Scenario: Member cannot assign members to services
- **WHEN** a user with the Member role views a service
- **THEN** the member assignment controls SHALL NOT be available

---

### Requirement: Guest role SHALL be limited to viewing invited services, indicating availability, viewing programs, and editing their avatar
Users with the Guest role MUST only be able to view services to which they have been explicitly invited. Guests MUST be able to: view programs for invited services, indicate their own availability, and edit their avatar. Guests MUST NOT be able to: create or edit services, create or edit teams, manage team members, approve requests, edit programs, manage resources, view other users' availability, assign members, send SMS, or manage drafts.

#### Scenario: Guest can view only services they are invited to
- **WHEN** a user with the Guest role navigates to the services list
- **THEN** only services to which the user has been explicitly invited SHALL be visible

#### Scenario: Guest cannot view services they are not invited to
- **WHEN** a user with the Guest role attempts to access a service they have not been invited to
- **THEN** the service SHALL NOT be visible and access SHALL be denied

#### Scenario: Guest can view programs for invited services
- **WHEN** a user with the Guest role accesses the program for a service they are invited to
- **THEN** the program content SHALL be visible to the user

#### Scenario: Guest can indicate their own availability
- **WHEN** a user with the Guest role accesses the availability feature
- **THEN** the user SHALL be able to indicate their own availability

#### Scenario: Guest can edit their avatar
- **WHEN** a user with the Guest role accesses their profile
- **THEN** the user SHALL be able to upload or change their avatar image

#### Scenario: Guest cannot create or edit services
- **WHEN** a user with the Guest role attempts to create or edit a service
- **THEN** the operation SHALL be denied and the service creation/editing controls SHALL NOT be available

#### Scenario: Guest cannot create or edit teams
- **WHEN** a user with the Guest role attempts to access team management
- **THEN** the team management controls SHALL NOT be available

#### Scenario: Guest cannot manage team members
- **WHEN** a user with the Guest role attempts to add or remove team members
- **THEN** the operation SHALL be denied

#### Scenario: Guest cannot approve requests
- **WHEN** a user with the Guest role views the application
- **THEN** the request approval controls SHALL NOT be available

#### Scenario: Guest cannot view other users' availability
- **WHEN** a user with the Guest role accesses the availability feature
- **THEN** only their own availability SHALL be visible and other users' availability SHALL be hidden
