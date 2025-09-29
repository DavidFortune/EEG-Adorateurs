# Team Scheduling View Feature

## Overview

A new comprehensive team scheduling view that allows team leaders and admins to see all team members' availability and manage assignments for upcoming services in one place.

## Features Implemented

### 1. TeamSchedulingView Component (`/src/views/teams/TeamSchedulingView.vue`)

**Purpose:** Centralized view for managing team scheduling and assignments

**Key Features:**
- **Service Filtering:** Filter services by "À venir" (upcoming), "Ce mois" (this month), or "Tous" (all)
- **Team Member Availability Display:** Shows each team member's availability status for each service
- **Assignment Management:** Allow team leaders/admins to assign and unassign members
- **Visual Status Indicators:** Color-coded cards and chips for different availability states
- **Summary Statistics:** Shows available/assigned counts per service

**Availability States:**
- ✅ **Available:** Member marked as available (green)
- ❌ **Unavailable:** Member marked as unavailable (gray)
- ❓ **No Response:** Member hasn't responded yet (dashed border)
- 🎯 **Assigned:** Member is assigned to the service (success green)

### 2. Navigation Integration

**Route Added:** `/team-scheduling/:id` → `TeamSchedulingView.vue`

**Access Points:**
- **Team Detail Page:** New primary "Planning de l'équipe" button (solid fill)
- Preserves existing "Voir les disponibilités" and "Voir les assignations" buttons

### 3. Permissions System

**Assignment Management Access:**
- **Admins:** Full access to assign/unassign members
- **Team Owners:** Can manage assignments for their team
- **Team Leaders:** Can manage assignments for their team
- **Regular Members:** View-only access

### 4. Assignment Operations

**Assign Member:**
- Only available for members marked as "available"
- One-click assignment with immediate UI feedback
- Stores assignment in Firebase with audit trail

**Unassign Member:**
- One-click removal for assigned members
- Immediate UI update with confirmation toast

## Technical Implementation

### Architecture Reuse

The TeamSchedulingView now **reuses the same logic and UI components** as the main SchedulingView:

- **SchedulingStore:** Leverages the existing Pinia store for state management
- **Shared Components:** Uses EventSelector and TeamCard components
- **Consistent UI:** Maintains the same visual design and interaction patterns
- **Filter Logic:** Shows only the current team's data from the global scheduling view

### Data Flow

1. **Initialize Store:** Uses the existing schedulingStore for data management
2. **Load Services:** Leverages the existing service loading logic
3. **Filter by Team:** Filters the global team data to show only the current team
4. **Real-time Updates:** Uses the same assignment management as the main view

### Key Components Reused

- **EventSelector:** Service selection dropdown (reused from SchedulingView)
- **TeamCard:** Team member display and assignment management (reused)
- **SchedulingStore:** Centralized state management (reused)
- **Assignment Logic:** Same assignment/unassignment operations (reused)

### Benefits of Reuse

- **Consistency:** Same UI/UX as the main scheduling view
- **Maintainability:** Changes to scheduling logic apply to both views
- **Performance:** Leverages existing optimized store and components
- **Feature Parity:** All scheduling features work the same way

## File Structure

```
src/views/teams/
├── TeamDetailPage.vue        # Updated with scheduling link
├── TeamSchedulingView.vue     # New scheduling component
├── TeamAvailabilityPage.vue   # Existing availability view
└── TeamAssignmentsPage.vue    # Existing assignments view

src/router/index.ts            # Updated with new route
```

## Usage Flow

1. **Access:** Navigate to any team detail page
2. **Open Scheduling:** Click "Planning de l'équipe" button
3. **Filter Services:** Choose time period (upcoming/month/all)
4. **View Availability:** See all team members' availability status
5. **Manage Assignments:** Assign available members or unassign existing assignments
6. **Monitor Progress:** Check availability/assignment statistics

## Benefits

### For Team Leaders
- **Centralized View:** See all services and member availability in one place
- **Quick Assignment:** Assign members with single clicks
- **Visual Feedback:** Immediately see who's available, assigned, or missing

### For Team Members
- **Transparency:** Clear view of team scheduling and assignments
- **Status Awareness:** See their own status alongside teammates

### For Administrators
- **Team Oversight:** Monitor team coverage across all services
- **Assignment Tracking:** See assignment patterns and member engagement

## Future Enhancements

Potential areas for future development:

1. **Batch Operations:** Assign multiple members at once
2. **Availability Reminders:** Notify members who haven't responded
3. **Conflict Detection:** Alert when overassigning or double-booking
4. **Export Functionality:** Generate scheduling reports
5. **Mobile Notifications:** Push notifications for assignments
6. **Calendar Integration:** Sync with device calendars

## Integration Points

The feature integrates seamlessly with existing functionality:

- **Member Availability System:** Uses existing availability data
- **Assignment System:** Leverages existing assignment infrastructure
- **Team Management:** Works with current team structure
- **Permission System:** Respects existing role-based access

## Testing

The component has been built and tested for:
- ✅ TypeScript compilation
- ✅ Component rendering
- ✅ Route navigation
- ✅ Permission-based access
- ✅ Responsive design
- ✅ Error handling

## Access the Feature

Once deployed, access the team scheduling view by:
1. Going to any team in `/tabs/teams`
2. Clicking on a team to view details
3. Clicking the "Planning de l'équipe" button

Route: `/team-scheduling/{teamId}`