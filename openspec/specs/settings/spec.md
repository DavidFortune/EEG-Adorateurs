### Requirement: Push notification toggle SHALL allow users to enable or disable push notifications
The settings page MUST provide a toggle control that allows users to enable or disable push notifications. The toggle state MUST persist across sessions and SHALL reflect the current notification permission status. When notifications are disabled, the application MUST NOT send push notifications to the user's device.

#### Scenario: User enables push notifications
- **WHEN** a user toggles the push notification setting to enabled
- **THEN** the application SHALL request device notification permission and register the device for push notifications
- **THEN** the toggle state SHALL be persisted to the user's profile

#### Scenario: User disables push notifications
- **WHEN** a user toggles the push notification setting to disabled
- **THEN** the application SHALL unregister the device from push notifications
- **THEN** the toggle state SHALL be persisted to the user's profile
- **THEN** the user SHALL NOT receive any further push notifications until re-enabled

#### Scenario: Push notification toggle reflects denied device permission
- **WHEN** the device-level notification permission has been denied by the operating system
- **THEN** the toggle SHALL be displayed as disabled
- **THEN** a message SHALL inform the user that notifications must be enabled in device settings

---

### Requirement: Version display SHALL show the current application version with access to release notes
The settings page MUST display the current application version number. The version display MUST provide a way for the user to access release notes describing changes in the current and previous versions.

#### Scenario: Current version is displayed on the settings page
- **WHEN** a user navigates to the settings page
- **THEN** the current application version number SHALL be visible on the page

#### Scenario: User accesses release notes from version display
- **WHEN** a user taps on the version display element
- **THEN** the application SHALL present the release notes for the current version and previous versions

---

### Requirement: Legal pages SHALL provide access to about, privacy policy, and terms of use
The settings page MUST include navigation links to three legal pages: about, privacy policy, and terms of use. Each legal page MUST display its content in French. All legal pages MUST be accessible to any authenticated user regardless of role.

#### Scenario: User navigates to the about page
- **WHEN** a user taps the "A propos" link on the settings page
- **THEN** the application SHALL display the about page with information about the EEG Adorateurs application

#### Scenario: User navigates to the privacy policy page
- **WHEN** a user taps the "Politique de confidentialite" link on the settings page
- **THEN** the application SHALL display the privacy policy page in French

#### Scenario: User navigates to the terms of use page
- **WHEN** a user taps the "Conditions d'utilisation" link on the settings page
- **THEN** the application SHALL display the terms of use page in French

---

### Requirement: Language and timezone configuration SHALL default to French and America/Montreal
The application MUST use French as the default and only supported language. The application MUST use the America/Montreal timezone for all date and time display and calculations. These settings SHALL apply globally across all features and components.

#### Scenario: Application displays all content in French
- **WHEN** a user accesses any page of the application
- **THEN** all interface labels, messages, and content SHALL be displayed in French

#### Scenario: Dates and times use the America/Montreal timezone
- **WHEN** the application displays a date or time (e.g., service times, availability slots)
- **THEN** the displayed date and time SHALL be formatted according to the America/Montreal timezone

#### Scenario: Settings page displays the configured language and timezone
- **WHEN** a user navigates to the settings page
- **THEN** the configured language SHALL be displayed as "Francais"
- **THEN** the configured timezone SHALL be displayed as "America/Montreal"
