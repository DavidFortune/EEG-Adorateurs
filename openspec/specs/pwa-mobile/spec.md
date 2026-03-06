### Requirement: Application SHALL be installable as a progressive web app on the home screen
The application MUST be a valid progressive web app (PWA) that can be installed on a user's device home screen. The application MUST include a valid web app manifest with appropriate icons, name, and display mode. When installed, the application SHALL launch in standalone mode without browser chrome.

#### Scenario: User installs the PWA on their home screen
- **WHEN** a user accesses the application in a supported browser and chooses to install it
- **THEN** the application SHALL be added to the device's home screen with the EEG Adorateurs icon and name

#### Scenario: Installed PWA launches in standalone mode
- **WHEN** a user opens the application from the home screen after installation
- **THEN** the application SHALL launch in standalone display mode without browser navigation chrome

#### Scenario: Web app manifest is valid and complete
- **WHEN** a browser fetches the application's web app manifest
- **THEN** the manifest SHALL include the application name, icons in required sizes, start URL, display mode set to standalone, and theme color

---

### Requirement: Offline support SHALL be provided via Service Worker
The application MUST register a Service Worker that provides offline support. The Service Worker MUST cache essential application assets so that users can access previously loaded content when the device is offline. The application SHALL display an appropriate indicator when operating in offline mode.

#### Scenario: Application loads while the device is offline
- **WHEN** a user opens the previously loaded application while the device has no network connectivity
- **THEN** the application shell SHALL load from the Service Worker cache
- **THEN** previously cached content SHALL be accessible

#### Scenario: Service Worker caches application assets on first load
- **WHEN** a user loads the application for the first time with network connectivity
- **THEN** the Service Worker SHALL cache the application shell and essential static assets

#### Scenario: Offline indicator is displayed when network is unavailable
- **WHEN** the device loses network connectivity while the application is open
- **THEN** the application SHALL display a visible indicator informing the user that they are offline

---

### Requirement: Application SHALL automatically check for updates every 30 minutes
The application MUST implement an automatic update check mechanism that polls for new versions every 30 minutes while the application is active. When a new version is detected, the application MUST notify the user and provide a way to apply the update. The update check interval MUST NOT be less than 30 minutes.

#### Scenario: Update check runs every 30 minutes
- **WHEN** the application has been active for 30 minutes since the last update check
- **THEN** the application SHALL perform an update check by querying the Service Worker for a new version

#### Scenario: New version detected during update check
- **WHEN** an automatic update check detects a new version of the application
- **THEN** the application SHALL notify the user that an update is available
- **THEN** the application SHALL provide an option to reload and apply the update

#### Scenario: No update available during check
- **WHEN** an automatic update check determines the application is already up to date
- **THEN** the application SHALL continue operating normally without any user-facing notification

#### Scenario: Update check does not run when application is in background
- **WHEN** the application is not in the foreground or active state
- **THEN** the automatic update check timer SHALL NOT trigger until the application returns to the foreground

---

### Requirement: Native device features SHALL be accessible via Capacitor plugins
The application MUST integrate Capacitor plugins to provide access to native device features including: local notifications, haptic feedback, share sheet, status bar customization, keyboard management, and screen wake lock. Each native feature MUST degrade gracefully when running in a browser environment without native support.

#### Scenario: Local notifications are triggered for scheduled events
- **WHEN** the application needs to notify a user about an upcoming service or schedule change
- **THEN** the application SHALL use the Capacitor local notifications plugin to schedule and display a device notification

#### Scenario: Haptic feedback is triggered on supported interactions
- **WHEN** a user performs an interaction that warrants tactile feedback (e.g., toggling a switch, confirming an action)
- **THEN** the application SHALL trigger haptic feedback via the Capacitor haptics plugin on supported devices

#### Scenario: Share sheet is invoked for sharing content
- **WHEN** a user taps a share action (e.g., sharing a service program)
- **THEN** the application SHALL open the native share sheet via the Capacitor share plugin with the appropriate content

#### Scenario: Status bar is customized for the application theme
- **WHEN** the application is running as a native or installed PWA application
- **THEN** the status bar style and color SHALL be configured via the Capacitor status bar plugin to match the application theme

#### Scenario: Keyboard management adjusts the viewport
- **WHEN** the on-screen keyboard opens on a mobile device
- **THEN** the application SHALL use the Capacitor keyboard plugin to adjust the viewport and ensure input fields remain visible

#### Scenario: Screen wake lock prevents display from sleeping during presentation
- **WHEN** the application is in presentation mode or a feature requiring sustained screen visibility
- **THEN** the application SHALL activate the screen wake lock via Capacitor to prevent the display from sleeping

#### Scenario: Native features degrade gracefully in browser environment
- **WHEN** the application is running in a standard browser without Capacitor native runtime
- **THEN** native feature calls SHALL fail silently or provide web-based fallback behavior without causing errors
