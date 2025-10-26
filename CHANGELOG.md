# Changelog

All notable changes to EEG Adorateurs will be documented in this file.

## [1.8.0] - 2025-10-26

### Added
- **SMS Notification System**: Complete SMS notification functionality for service programs
  - Cloud Function `sendProgramAvailableSMS` for sending SMS via Twilio
  - Cloud Function `getServiceMembersPhones` to retrieve member phone numbers by service
  - SMS modal component with member selection and message preview
  - Search bar to filter members (appears with 5+ members)
  - "Select All" / "Deselect All" quick selection buttons
  - Visual selection counter showing selected/total members
  - Custom note field for personalized messages (100 character limit)
  - Real-time message preview with service details and URL
  - Development mode for testing without Twilio credentials
  - Production mode with real SMS sending via Twilio

### Enhanced
- **SMS Modal UX**: Improved user interface for SMS notifications
  - Individual member selection with checkboxes
  - Segment control for "All members" vs "Specific members"
  - Responsive design with scrollable member list
  - Success/error alerts with detailed feedback
  - Phone number formatting (North American format support)
  - Public URL generation using custom domain (adorateurs.eglisegalilee.com)

### Fixed
- **Cloud Functions Database Connection**: Fixed Firestore database configuration
  - Functions now connect to correct named database `eeg-adorateurs-db`
  - Fixed admin authentication using `firebaseUserId` field
  - Resolved variable naming conflict in SMS sending logic
  - Improved error handling and logging throughout functions

### Technical
- **Environment Configuration**: Proper setup for Twilio integration
  - Firebase Functions v2 parameters with `defineString()`
  - Environment variables loaded from `.env` file
  - SMS_DEV_MODE flag for development/production switching
  - Secure Twilio credentials configuration
- **Phone Number Formatting**: Automatic formatting for international numbers
  - E.164 format support with +1 prefix for North American numbers
  - Validation and error handling for invalid phone numbers
- **URL Generation**: Service program links in SMS
  - Custom domain support (https://adorateurs.eglisegalilee.com)
  - Direct links to `/service-program/[serviceId]` route

## [1.7.2] - 2025-10-19

### Added
- **Section View Modal**: New popup for continuous display of section content
  - Clickable section headers open modal showing all items with titles and lyrics
  - Edge-to-edge layout maximizing screen space usage
  - Streamlined display focusing on essential information (titles and lyrics)
  - Works in non-edit mode only to avoid conflicts with editing actions

### Enhanced
- **Program Section Interaction**: Improved user experience for viewing section content
  - Section headers now clickable (non-edit mode) with hover effect for visual feedback
  - Edit/delete buttons use click.stop to prevent modal trigger during editing
  - Clean, minimal styling for optimal readability of lyrics and titles

### Technical
- **Component Updates**: ServiceProgramPage enhancements
  - Added section view modal state management
  - Implemented showSectionView() and closeSectionView() functions
  - Lean CSS styling for compact display without unnecessary padding
  - Simple border separators between items for clean visual hierarchy

## [1.7.1] - 2025-10-04

### Added
- **Error Tracking and Monitoring System**: Comprehensive error tracking with automatic categorization
  - Automatic error categorization by type (Network, Authentication, Validation, Firestore, Storage, Performance, UI)
  - Error severity classification (Low, Medium, High, Critical)
  - Error rate metrics tracking (errors per minute, recovery rate)
  - Real-time error monitoring dashboard with visual analytics
  - Integration with Firebase Analytics for centralized error logging
  - Automatic error recovery strategies with configurable retry logic
  - Global error handlers for unhandled errors and promise rejections
  - User-friendly error notifications with context-aware messages
  - Error frequency tracking and most common errors identification
  - Export functionality for error reports in JSON format

- **Error Tracking Composable**: Vue composable for easy error handling in components
  - `handleError()` function for tracking individual errors with context
  - `withErrorHandling()` wrapper for async functions with automatic retry
  - `getMetrics()` to access error statistics and recovery rates
  - Built-in retry logic with exponential backoff
  - Custom recovery strategies per error category

- **Enhanced Onboarding Test Suite**: Comprehensive E2E testing for onboarding flow
  - Added 12 new test cases (total: 18 tests)
  - Team selection and deselection interactions testing
  - Form validation edge cases (special characters, hyphenated names, whitespace)
  - Phone number format validation (dashes, parentheses, spaces)
  - Progress bar verification across onboarding steps
  - Data persistence testing during back/forward navigation
  - First name extraction and display on congratulations page
  - Empty team list handling and error scenarios
  - Complete flow testing with and without optional steps

### Enhanced
- **Error Dashboard Component**: Visual monitoring interface for error tracking
  - Real-time error metrics display (total errors, error rate, recovery rate, critical errors)
  - Errors by category visualization with percentage bars
  - Errors by severity with color-coded badges
  - Most frequent errors list with occurrence counts
  - Recent errors timeline with recovery status indicators
  - Auto-refresh every 10 seconds for live monitoring
  - Export error reports as downloadable JSON files
  - Clear history functionality with confirmation

- **Global Error Handling**: Application-wide error management
  - Window error event handler with automatic tracking
  - Unhandled promise rejection handler
  - User ID tracking for authenticated error context
  - Severity-based user notifications (critical/high errors only)
  - Context preservation with filename, line number, column number
  - Automatic cleanup on component unmount

### Technical
- **Error Types and Interfaces**: Comprehensive TypeScript definitions
  - `ErrorCategory` enum with 9 categories
  - `ErrorSeverity` enum with 4 levels
  - `TrackedError` interface with full context and metadata
  - `ErrorRateMetrics` interface for analytics
  - `ErrorFrequency` tracking for pattern detection
  - `ErrorRecoveryStrategy` interface for recovery workflows

- **Error Tracking Service**: Core service with advanced features
  - In-memory storage of last 200 errors for performance
  - Error frequency tracking with Map data structure
  - Automatic message truncation for analytics (100 chars)
  - Recovery rate calculation (percentage of recovered errors)
  - Time-range filtered error queries
  - Critical error detection and filtering
  - Unrecovered error identification
  - Export error summary with formatted timestamps

- **Documentation**: Complete error tracking documentation
  - `ERROR_TRACKING.md` with full API documentation
  - `INTEGRATION_EXAMPLE.md` with real-world usage examples
  - Code examples for common scenarios
  - Best practices guide for error handling
  - Testing examples with simulated error scenarios

### Performance
- **Bundle Optimization**: Production build improvements
  - Modern bundle: 1.8 MB (426 KB gzipped)
  - Legacy bundle: 1.9 MB (421 KB gzipped)
  - CSS optimization: 44.43 KB (7.16 KB gzipped)
  - 152 optimized files for efficient caching
  - Code splitting for improved initial load time

## [1.6.5] - 2025-09-29

### Fixed
- **Team Scheduling Display Issues**: Resolved assignment state inconsistencies in Audio Visuel team
  - Fixed team assignment count calculation to use actual assigned members rather than database count
  - Corrected member styling priority to ensure assigned styling always takes precedence over availability status
  - Enhanced CSS specificity in TeamCardNoPen component to prevent style conflicts
  - Member assignment styling now consistently shows light green background regardless of original availability

### Enhanced
- **Member State Visualization**: Improved visual consistency between scheduling views
  - Updated TeamCardNoPen styling to match DisponibilitesPage card styling exactly
  - Assigned members: Light green background (#ECFDF5) with green border (#10B981)
  - Available members: White background with green border
  - Unavailable members: White background with red border
  - No response members: White background with grey border

### Technical
- **Scheduling Store Optimization**: Improved data consistency and calculation accuracy
  - Added debugging capabilities for team assignment tracking
  - Changed assignment counting logic to use filtered member states rather than raw database counts
  - Enhanced CSS selector specificity using `:not()` pseudo-class to prevent style override conflicts

## [1.6.0] - 2025-09-21

### Added
- **Phone Request Modal**: New user engagement system for phone number collection
  - Auto-display modal with 5-second delay on AccueilPage for users without phone numbers
  - Bottom-sheet overlay style modal optimized for mobile and desktop
  - Real-time phone validation with (XXX) XXX-XXXX formatting enforcement
  - Maximum 10-digit validation with last block limited to 4 digits

- **Availability Management**: Enhanced service availability system
  - Segment control filtering (All/Answered/Unanswered) in DisponibilitésPage
  - Service count notifications in AccueilPage showing unanswered availability requests
  - Encouragement cards promoting user engagement with availability responses
  - Smart filtering logic accounting for assigned vs unassigned services

### Enhanced
- **Navigation Experience**: Improved tab navigation and readability
  - Reordered navigation tabs: Accueil, Disponibilités, Équipes, Services, Ressources
  - Enhanced CSS with font smoothing, proper sizing, and GPU acceleration for crisp text/icons
  - Improved contrast and visual clarity across all navigation elements

- **AccueilPage Design**: Modernized home page layout and functionality
  - Services content now displays directly on background without card wrapper
  - Red alert cards for pending availability responses with specific count display
  - Blue encouragement cards with positive messaging for user engagement
  - Responsive design optimizations for mobile and desktop

- **Services Management**: Improved service filtering and date handling
  - Fixed timezone comparison issues for proper upcoming/past service categorization
  - Enhanced date validation to filter out services with invalid date/time data
  - Cleaned up service filtering logic with consistent HH:MM time format handling

### Fixed
- **DateTime Picker Issues**: Resolved calendar display problems in service forms
  - Fixed modal sizing and positioning for proper datetime picker visibility
  - Added proper CSS styling for datetime containers with adequate spacing
  - Ensured consistent YYYY-MM-DDTHH:MM format handling without seconds
  - Removed complex timezone conversions that caused display issues

- **Time Format Consistency**: Standardized time handling across all forms
  - Service times now consistently saved in HH:MM format (e.g., "11:00", "14:30")
  - Fixed datetime picker extraction to remove seconds from time values
  - Manual date formatting replaces problematic toISOString() usage
  - Consistent time format in both service creation and deadline setting

- **Phone Validation Issues**: Corrected phone input handling across multiple forms
  - Fixed validation in MyAccountPage, PhonePage (onboarding), and PhoneRequestModal
  - Enforced 10-digit maximum with proper last block validation (max 4 digits)
  - Consistent (XXX) XXX-XXXX formatting with proper input masking

### Technical
- **Component Architecture**: Improved component structure and data flow
  - Cleaned up DisponibilitésPage by removing assignments section and detailed availability button
  - Updated availability card styles with specific border/background color specifications
  - Enhanced computed properties for service filtering and availability counting
  - Better error handling for invalid service dates

- **CSS Improvements**: Enhanced styling and visual consistency
  - Tab navigation CSS with font smoothing and contrast filters
  - Availability card styling: grey border (no answer), green (available/assigned), red (unavailable)
  - Modal styling improvements for datetime pickers with proper responsive design
  - Removed rounded borders and unnecessary visual clutter

- **Date/Time Processing**: Robust datetime handling improvements
  - Invalid date filtering to prevent JavaScript errors
  - Consistent date comparison logic for service categorization
  - Proper timezone handling without complex conversion issues
  - Manual date formatting for reliability across different environments

## [1.5.0] - 2025-09-20

### Added
- **Phone Number Input Masking**: Enhanced user experience with real-time phone number formatting
  - Progressive phone input masking in onboarding (PhonePage) with format (438) 123-4567
  - Phone input masking in profile forms (MyAccountPage) for consistent data entry
  - Support for both Canadian and US phone number formats with auto-formatting

- **Service Publishing System**: Complete publish/unpublish functionality for service management
  - Toggle button in service detail page header to publish/unpublish services
  - Visual feedback with eye/eye-off icons and disabled states
  - Conditional access control - service links only appear when services are published
  - Lock icons and disabled styling for unpublished service actions

- **Enhanced Phone Data Persistence**: Improved onboarding data management
  - Phone numbers now properly saved during onboarding completion process
  - Phone field included in member creation and updates in Firestore
  - Phone validation with optional field support in profile forms

### Enhanced
- **Service Display Logic**: Improved service filtering and access control
  - Team and Program buttons only displayed for published services
  - Clear visual indicators for published vs unpublished status
  - Admin-only access to publish/unpublish functionality

- **Past Services Sorting**: Improved chronological organization
  - Past services now display from most recent to oldest order
  - Better user experience when reviewing historical service data

- **Input Validation**: Enhanced form validation and user feedback
  - Phone number validation with support for multiple formats
  - Real-time input formatting with visual feedback
  - Improved error messaging for invalid phone numbers

### Fixed
- **TypeScript Build Issues**: Resolved compilation errors for production builds
  - Fixed missing `setAvailability` method in onboarding store
  - Removed references to non-existent properties (reference, lyrics, participantRole)
  - Added proper null safety checks in ServiceProgramPage
  - Ensured clean production builds with no TypeScript errors

- **Data Consistency**: Improved data handling across components
  - Fixed phone number persistence through onboarding flow
  - Resolved null pointer exceptions in resource linking
  - Corrected form data validation and submission processes

### Technical
- **Store Management**: Enhanced Pinia store functionality
  - Added `setAvailability` method to onboarding store for service availability tracking
  - Improved type safety and method consistency across stores
  - Better state management for form data persistence

- **Build Process**: Optimized production build configuration
  - Successful webpack/vite builds with proper code splitting
  - Optimized bundle sizes with legacy browser support
  - Firebase hosting deployment automation with 145 files successfully uploaded

- **Component Architecture**: Improved component structure and data flow
  - Better separation of concerns in service management components
  - Enhanced prop validation and TypeScript interfaces
  - Modular approach to form validation and data handling

## [1.4.0] - 2025-09-14

### Added
- **Service Program Management**: Complete program creation and management system for services
  - Create, edit, and delete program items (songs, prayers, reading, annonces, etc.)
  - Create, edit, and delete program sections with customizable positioning
  - Support for lyrics storage and display for songs
  - Drag-and-drop reordering of program items within sections
  - Edit mode toggle for admins with comprehensive CRUD operations
  - Visual program flow display with time-based section organization

- **Service Members Management**: Dedicated interface for managing service assignments
  - View all assigned members for a service
  - Add/remove member assignments through intuitive interface  
  - Visual team grouping with member counts
  - Role-based access control (admin-only modifications)

- **Enhanced Service Details**: Dynamic service information display
  - Real-time program status with item counts
  - Member assignment count display
  - Visual indicators for program availability
  - Direct navigation to program and member management

### Enhanced
- **Permissions System**: Refined access control across services
  - All users can view services and programs
  - Admin-only access for creating and modifying services
  - Admin-only access for program and member management
  - Scheduling restricted to administrators

- **UI/UX Improvements**:
  - Improved service filters ("À venir" and "Passés")
  - Default to upcoming services view
  - Removed unnecessary padding from filter segments
  - Mobile-responsive layouts for all new features
  - Consistent styling with existing design system

### Fixed
- Fixed edit mode toggle visibility issue in ServiceProgramPage
- Corrected isAdmin destructuring from useUser composable
- Resolved lyrics storage and display issues for songs
- Fixed empty section deletion restrictions

### Technical
- **Firestore Integration**:
  - New programs collection for service programs
  - Complete CRUD operations for programs, sections, and items
  - Optimized data structure for efficient queries
  - Updated security rules for program access

- **Component Architecture**:
  - New ServiceProgramPage component with comprehensive editing
  - New ServiceMembersPage for assignment management
  - Modular edit modals for items and sections
  - TypeScript interfaces for program data structures

## [1.3.1] - 2025-09-05

### Fixed
- **Team Section Avatar Display**: Fixed avatar display issues across all Team components
  - Added proper circular styling with `border-radius: 50%` for avatar initials
  - Added `object-fit: cover` to avatar images for proper scaling
  - Standardized `getInitials` functions to use consistent `fullName.split()` approach
  - Ensured first and last name initials are returned (e.g., "John Smith" → "JS")

### Enhanced
- **Date Formatting**: Improved date formatting consistency in Team section
  - Centralized timezone utilities for French Canadian locale with America/Toronto timezone
  - Implemented 3-line layout for segments in TeamAvailabilityPage for better mobile display
  - Updated date format to display as "Dim 7 sept 2025 à 11:00"

- **Mobile Layout**: Enhanced mobile experience for Team pages
  - Side-by-side availability and assignment buttons in TeamsPage team cards
  - Better responsive design for Team detail and management pages
  - Removed clutter by removing unnecessary assignment info lines

### Technical
- **Code Quality**: Cleaned up unused imports and functions across Team components
- **CSS Consistency**: Standardized avatar styling with CSS variables for consistent theming

## [1.3.0] - 2025-09-04

### Added
- **Complete Scheduling System**: New admin-only scheduling interface for service planning
  - Real-time team and member availability display
  - Interactive member assignment with drag-and-drop-like functionality
  - Visual status indicators for team completion (complete/partial/empty)
  - Missing members warnings with count display

- **Member Availability Management**: 
  - Members can submit availability for services through dedicated interface
  - Availability data integrated with member profiles (member.availabilities field)
  - Support for "available", "maybe", "unavailable", and "no response" states
  - Real-time availability updates reflected in scheduling

- **Team Requirements System**:
  - Dynamic team requirements configuration in service forms
  - Specify number of members needed per team for each service
  - Team requirements stored in Firestore and dynamically loaded

- **Enhanced Service Management**:
  - Added availability deadline feature for services (datetime format)
  - Improved service form with compact modal datetime pickers
  - Mobile-optimized font sizes for better mobile experience

### Enhanced
- **Admin Security**: Scheduling interface restricted to admin users only
  - Calendar icon hidden for non-admin users in services header
  - Route-level protection with automatic redirect for unauthorized access

- **Visual Design**: Applied consistent styling matching design specifications
  - Light green background for assigned members
  - Light yellow background for missing member warnings
  - Consistent 12px border radius throughout interface
  - Professional color scheme and typography

- **User Experience**: 
  - Team filter functionality in scheduling view
  - Ability to assign members with "no response" status
  - Member avatars displayed throughout interface
  - Responsive design optimizations

### Technical
- **Database Integration**: 
  - New Firestore collections for assignments and availability
  - Updated security rules for proper access control
  - Member availability stored directly in member documents

- **Component Architecture**:
  - Modular scheduling components (EventSelector, TeamCard, MemberItem, etc.)
  - Reusable availability submission component
  - Comprehensive TypeScript types for scheduling system

### Fixed
- Resolved "Pas de réponse" display issue in scheduling
- Fixed team filter functionality with proper Vue reactivity
- Corrected Firestore data retrieval and member ID mapping

## [1.2.0] - Previous Release
- Initial team management features
- Basic service creation and management
- Member onboarding system