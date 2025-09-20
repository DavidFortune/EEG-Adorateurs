# Changelog

All notable changes to EEG Adorateurs will be documented in this file.

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