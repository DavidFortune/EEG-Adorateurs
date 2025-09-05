# Changelog

All notable changes to EEG Adorateurs will be documented in this file.

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