### Requirement: Push notifications SHALL be delivered via Firebase Cloud Messaging (FCM)
The system MUST send push notifications to users via Firebase Cloud Messaging (FCM). Users MUST be able to receive push notifications on mobile devices (iOS, Android) and web browsers that support FCM. The system SHALL request notification permissions from the user and register the device token with FCM upon granting permission.

#### Scenario: User grants notification permission and receives push notifications
- **WHEN** a user grants push notification permission on their device
- **THEN** the system SHALL register the device token with FCM
- **AND** the user SHALL receive push notifications for relevant events

#### Scenario: User denies notification permission
- **WHEN** a user denies push notification permission on their device
- **THEN** the system SHALL NOT send push notifications to that device
- **AND** the application SHALL continue to function normally without push notifications

#### Scenario: Push notification is delivered when app is in background
- **WHEN** the application is in the background or closed and a relevant event occurs
- **THEN** the system SHALL deliver a push notification to the user's device via FCM

---

### Requirement: SMS SHALL be used for availability requests and program distribution
The system MUST support sending SMS messages to team members for two purposes: requesting availability responses for upcoming services and distributing service programs. Only administrators SHALL be authorized to send SMS messages. The SMS content MUST include relevant service details.

#### Scenario: Administrator sends availability request via SMS
- **WHEN** an administrator triggers an SMS availability request for a service
- **THEN** the system SHALL send an SMS to each targeted team member
- **AND** the SMS MUST include the service date, time, and a prompt to indicate availability

#### Scenario: Administrator distributes a program via SMS
- **WHEN** an administrator triggers program distribution via SMS for a published service
- **THEN** the system SHALL send an SMS to the relevant team members
- **AND** the SMS MUST include the service details and program information or a link to view the program

#### Scenario: Non-administrator cannot send SMS
- **WHEN** a user without administrator privileges attempts to send an SMS
- **THEN** the system SHALL deny the action
- **AND** the SMS sending controls SHALL NOT be visible or accessible to non-administrators

---

### Requirement: Service invitations SHALL be shareable via native share sheet
The system MUST generate shareable invitation links for services. Users MUST be able to share these links using the device's native share sheet, which includes options such as WhatsApp, SMS, and email. The invitation link MUST allow the recipient to view the service details upon opening it.

#### Scenario: User shares a service invitation via the native share sheet
- **WHEN** a user taps the share button on a service detail page
- **THEN** the system SHALL generate an invitation link for the service
- **AND** the device's native share sheet SHALL open with the invitation link ready to share

#### Scenario: Recipient opens a shared service invitation link
- **WHEN** a recipient opens a service invitation link received via WhatsApp, SMS, or email
- **THEN** the system SHALL display the service details to the recipient
- **AND** the recipient SHALL be able to view the service as a guest if they are not a registered member

#### Scenario: Share sheet includes multiple sharing options
- **WHEN** the native share sheet is opened for a service invitation
- **THEN** the available sharing options SHALL include at least WhatsApp, SMS, and email, depending on the apps installed on the device

---

### Requirement: In-app update notifications SHALL inform users when a new version is available
The system MUST automatically check for new application versions. When a new version is detected, the system SHALL display an in-app notification to the user. The notification MUST inform the user that an update is available and provide a way to initiate the update or dismiss the notification.

#### Scenario: New version is detected and notification is displayed
- **WHEN** the system detects that a newer version of the application is available
- **THEN** an in-app notification SHALL be displayed to the user informing them of the update

#### Scenario: User initiates update from the notification
- **WHEN** a user interacts with the in-app update notification and chooses to update
- **THEN** the system SHALL initiate the update process (e.g., reload the PWA to apply the new service worker)

#### Scenario: User dismisses the update notification
- **WHEN** a user dismisses the in-app update notification
- **THEN** the notification SHALL be hidden
- **AND** the system SHALL re-notify the user on a subsequent check or session

#### Scenario: Application checks for updates periodically
- **WHEN** the application is running
- **THEN** the system SHALL periodically check for new versions in the background
- **AND** if no new version is found, no notification SHALL be displayed
