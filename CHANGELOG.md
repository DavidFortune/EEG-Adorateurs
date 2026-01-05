# Changelog

All notable changes to EEG Adorateurs will be documented in this file.

## [1.12.10] - 2026-01-04

### Enhanced
- **Service Card Date Display**: Added 3-letter month abbreviation to service cards in TeamSchedulingView
  - Now shows "Dim 14 jan" instead of just "Dimanche 14"
  - Uses short weekday and short month for compact display

### Security
- **TeamSchedulingView Access Control**: Restricted scheduling access to authorized users only
  - Admins can manage all teams
  - Team owners and leaders can manage their own team
  - Unauthorized users see "Accès restreint" message

### Fixed
- **Assignment Position Error**: Fixed Firebase error when assigning members without a position
  - Position fields now default to null instead of undefined
  - Firebase rejects undefined values but accepts null

## [1.12.9] - 2026-01-04

### Added
- **Position (Poste) Feature**: New position management system for team members
  - Define positions per team (e.g., Guitariste, Chef de louange)
  - Assign default positions to team members
  - Drag-and-drop reordering of positions
  - Position displayed in team member list and scheduling view
  - Position ID format: `teamname-positionname` (lowercase, hyphenated)

### Enhanced
- **Scheduling Integration**: Positions now integrated with member scheduling
  - Member's default position automatically assigned when scheduling
  - Position displayed in MemberItem during scheduling
  - Position stored with service assignments

### Fixed
- **Resource Collection Error**: Fixed Firebase error when loading resources without a collection
  - Added guard for empty/undefined collectionId in getResourceCollectionById

## [1.12.8] - 2026-01-04

### Added
- **Program Item Reordering**: Drag-and-drop reordering for program items and sub-items
  - Touch-optimized using Ionic's native reorder components
  - Reorder main program items in edit mode
  - Reorder sub-items within expanded items
  - Visual feedback during drag operations
  - Automatic persistence to Firebase

- **Add Item Button at Bottom**: Duplicate "Ajouter un élément" button at the end of the program list in edit mode for easier access

### Enhanced
- **Resource Selector for Services**: Reused ResourceSelector component in ServiceDetailPage
  - Multi-select mode with tabs (Existantes, YouTube, Créer)
  - Excludes already linked resources from selection

### Fixed
- **Scheduling Conflict Assignment**: Fixed Firebase permissions error when assigning members with conflicts
  - Updated Firestore rules to allow updating `availabilities` field on member documents

- **Smarter Conflict Detection**: Improved conflict checking when assigning team members
  - Now only checks conflicts for services where the member's teams are required
  - Prevents false conflict warnings for unrelated services

## [1.12.7] - 2025-12-30

### Added
- **Multiple Participants**: Support for multiple participants per program item
  - New multi-select mode in ParticipantSelector component
  - Display list of selected participants with avatars and roles
  - Easy add/remove functionality for each participant

- **YouTube Video Preview**: Preview videos before selection
  - Play button in ResourceSelector to preview existing YouTube resources
  - Play button in ResourceDetailPage "Add media" modal for search results
  - Embedded YouTube player in preview modal

- **Full Chapter Scripture Fetch**: Fetch entire Bible chapters
  - When no verse range is specified (e.g., "Psaumes 100"), fetches all verses
  - Made verseStart optional in BibleReference type

### Enhanced
- **ServiceDetailPage Segments**: Restored resources tab with responsive design
  - Three segments: Programme, Ressources, Membres
  - Icons displayed on all screen sizes
  - Labels hidden on mobile (< 576px) for compact view

- **Program Item Subitems**: Re-enabled for songs and prayers
  - Add subitems button for 'Chant' and 'Prière' types only
  - Removed for other item types to reduce clutter

- **Section Display**: Improved section item styling
  - Removed "Section" label (icon only)
  - White edit/delete buttons in edit mode for better visibility
  - Default duration set to 0

### Fixed
- **Firestore Undefined Values**: Prevented errors from undefined field values
  - Cleanup in addItemToProgram, updateProgramInfo, addItem, updateItem
  - ParticipantSelector no longer sets undefined avatar/role properties

### Technical
- Added fix-broken-avatars.js script for cleaning invalid avatar URLs
- Added serviceAccountKey.json to .gitignore

## [1.10.2] - 2025-11-15

### Added
- **Mobile Autoplay Prompt**: Enhanced YouTube playlist player for mobile devices
  - Visual play prompt overlay for iOS and Android devices
  - Animated pulsing play icon with clear instructions
  - Automatic detection of mobile browsers (iPhone, iPad, iPod, Android)
  - Auto-dismisses when user taps or changes videos
  - Addresses mobile browser autoplay restrictions

### Enhanced
- **Touch Gestures**: Added swipe support for YouTube playlist
  - Swipe left to go to next video
  - Swipe right to go to previous video
  - Intelligent swipe detection (minimum 50px, horizontal dominance check)
  - Natural mobile navigation experience

### Fixed
- Code quality improvements (removed unused variables and fixed linting issues)
- Improved Promise handling in confirmation dialogs

## [1.10.1] - 2025-11-15

### Added
- **YouTube Playlist Player**: New feature for service programs
  - Click YouTube icon in program header to access playlist
  - Full-screen video player with navigation controls (previous/next)
  - Auto-play next video when current video ends
  - Visual progress indicator with clickable dots
  - Queue view showing all videos with program context
  - Mobile-optimized controls (icon-only buttons)
  - Feature announcement banner with consistent app styling

### Enhanced
- **Lyrics Display Modal**: Improved readability for worship
  - Full-screen display mode
  - Minimized padding and margins for maximum content space
  - Added subtitle (reference) below song title
  - Added program item notes below subtitle
  - Optimized font sizes (1.1rem for lyrics, 1.2rem for title)
  - Better contrast for active queue items (white text on red background)

### Technical
- Integrated YouTube IFrame API for video state detection
- Added program item context to video metadata (item number and title)
- Improved type checking for both 'video' and 'youtube' content types

## [1.10.0] - 2025-11-11

### Added
- **YouTube Integration**: Complete YouTube search and resource creation system
  - New NaturalResourceSelector component for searching YouTube videos directly
  - Cloud Functions for YouTube Data API v3 integration (searchYouTube, getVideoMetadata, createResourceFromYouTube)
  - Video preview modal with embedded YouTube player
  - Lyrics extraction and input functionality with video description fetching
  - Integrated into ResourceSelector via tabbed interface (Existing Resources / YouTube Search)
  - Auto-selection and auto-population of resource details after creation

- **Visual Type Selection**: Icon-based program item type selector
  - Replaced dropdown with visual button grid showing icons and labels
  - Red text for unselected types, white text on hover/selection
  - Improved UX with larger, more intuitive selection interface

### Enhanced
- **Program Item Types**: Simplified and streamlined type system
  - Reduced from 18 types to 5 essential types: Chant, Prière, Lecture biblique, Prédication, Titre
  - Removed redundant types: Annonce, Offrande, Bénédiction, Mot de bienvenue, Salutations, Numéro spécial, Collecte, Adoration, Louange, Chant final, Chant de clôture, Autre
  - Cleaner, more focused program creation experience

- **Data Structure Normalization**: Reference field moved to Resource type
  - Moved reference field from ProgramItem to Resource for better data organization
  - References (Bible verses, song numbers) now stored at resource level
  - Eliminates duplication across multiple program items

- **Program Item Form UI**: Improved modal interface design
  - Back button positioned top-left, action button (Add/Modify) top-right
  - Resource selector integrated inline with title field (right side)
  - Removed duplicate "Add Element" buttons
  - Auto-population of title when resource is selected
  - Compact button styling (solid fill, small size)

### Fixed
- TypeScript compilation errors for removed program item types
- Icon mapping updated to reflect new simplified type system

## [1.9.1] - 2025-11-09

### Fixed
- **Team Member Management**: Critical bug fix for team member acceptance and role assignment
  - Fixed Firestore update operations that were failing due to 'id' field being included in update calls
  - Member acceptance now works correctly when approving pending requests
  - Role assignment during approval process now persists properly to database
  - All team member operations now update successfully in Firestore
  - Affected operations: updateTeam, addMemberToTeam, requestToJoinTeam, approvePendingMember, rejectPendingMember, removeMemberFromTeam, updateMemberRole, transferOwnership

## [1.9.0] - 2025-11-08

### Added
- **Spotify Integration**: Full support for Spotify content across the application
  - Added Spotify resource type to resource types enum
  - Spotify URL detection and embed URL conversion utilities
  - Spotify player display in resource detail pages
  - Spotify playback support in service program media modals
  - Spotify embed iframes with "Open in Spotify" fallback buttons

- **Program Structure Refactoring**: New flat program structure with sub-items
  - Created ServiceProgramPageFlat.vue component with simplified hierarchy
  - Program items can now contain optional sub-items for nested content
  - Updated Firebase program operations to support flat structure
  - Migrated from section-based to item-based program organization

- **Lyrics View Modal**: New feature for viewing all lyrics in program items
  - "View All Lyrics" button for items with sub-items containing lyrics
  - Modal displays all sub-item lyrics in numbered card layout
  - Prominent primary-colored button for easy access
  - Clean, organized display of lyrics for worship leaders

### Enhanced
- **YouTube Video Support**: Improved YouTube playback in service programs
  - YouTube URL detection and embed conversion
  - iframe-based playback replacing standard video tags
  - 16:9 aspect ratio optimization for YouTube embeds

- **Media Display Improvements**: Better visual organization of program resources
  - Horizontal flexbox layout for sub-item media buttons
  - Proper wrapping and spacing for media type buttons
  - Improved alignment and visual hierarchy

### Fixed
- Spotify resource validation enabling save button
- Media type icon and label mappings for Spotify content
- Horizontal alignment for media buttons in program sub-items

### Technical
- Updated router to use ServiceProgramPageFlat.vue component
- Enhanced resource utilities with Spotify and YouTube helpers
- Comprehensive CSS styling for new modal components
- TypeScript type updates for program sub-items structure

## [1.8.2] - 2025-10-26

### Enhanced
- **Navigation Hierarchy Optimization**: Improved back button navigation to reflect logical page hierarchy
  - Service detail pages (members, program) now return to their parent service detail page
  - Team detail pages (availability, assignments, scheduling) now return to their parent team detail page
  - Resource edit form now returns to resource detail page
  - Settings-related pages (about, privacy, terms) now return to settings page
  - More intuitive navigation flow respecting parent-child relationships
  - Better user orientation throughout the application

## [1.8.1] - 2025-10-26

### Changed
- **URL Structure Simplification**: Removed `/tabs/` segment from all application URLs
  - Simplified routing from `/tabs/accueil` to `/accueil`
  - Updated all navigation guards and redirects
  - Modified tab bar navigation to use direct paths
  - Cleaner, more intuitive URL structure throughout the application
  - Updated availability request SMS URLs to use new path structure

### Added
- **Availability Request SMS System**: New SMS notification feature for requesting member availability
  - Admin-only SMS button in Disponibilités page
  - AvailabilityRequestSMSModal component with flexible recipient selection
  - Three recipient modes: All members, Specific team, or Specific members
  - Search functionality for individual member selection
  - Cloud Functions: `sendAvailabilityRequestSMS`, `getAllMembersPhones`, `getTeams`, `getTeamMembersPhones`
  - Customizable message with availability URL link

### Enhanced
- **SMS Message Format**: Simplified program update SMS messages
  - Changed to more concise format: "MàJ du programme [Nom] [Message] [Lien]"
  - Updated service program URLs to use custom domain

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