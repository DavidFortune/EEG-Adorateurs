# Flutter Migration Plan - EEG Adorateurs

## Executive Summary

**Current Stack:** Ionic Vue.js + TypeScript + Firebase + Capacitor
**Target Stack:** Flutter + Dart + Firebase + FlutterFire
**Estimated Duration:** 30-40 working days (solo experienced Flutter developer)
**Recommended Team Size:** 2-3 developers for 15-20 days

---

## Codebase Inventory

| Category | Count |
|----------|-------|
| Vue Pages/Views | 34 |
| Components | 28 |
| Pinia Stores | 2 |
| Firebase Services | 11 |
| Type Definitions | 10 |
| Composables | 2 |
| Utilities | 2 |
| Services | 9 |
| **Total Modules** | **98** |

---

## Phase 1: Project Setup & Architecture (Days 1-3)

### Day 1: Flutter Project Initialization
- [ ] Create Flutter project with proper package name
- [ ] Configure iOS/Android settings (bundle ID, package name)
- [ ] Set up folder structure:
  ```
  lib/
  ├── main.dart
  ├── app/
  │   ├── app.dart
  │   └── routes.dart
  ├── core/
  │   ├── constants/
  │   ├── theme/
  │   └── utils/
  ├── data/
  │   ├── models/
  │   ├── repositories/
  │   └── services/
  ├── features/
  │   ├── auth/
  │   ├── services/
  │   ├── teams/
  │   ├── resources/
  │   ├── scheduling/
  │   └── onboarding/
  └── shared/
      ├── widgets/
      └── providers/
  ```

### Day 2: Firebase & Dependencies Setup
- [ ] Add FlutterFire packages:
  ```yaml
  dependencies:
    firebase_core: ^2.24.2
    firebase_auth: ^4.16.0
    cloud_firestore: ^4.14.0
    firebase_storage: ^11.6.0
    firebase_messaging: ^14.7.9
    firebase_analytics: ^10.8.0
  ```
- [ ] Configure firebase_options.dart (flutterfire configure)
- [ ] Add additional dependencies:
  ```yaml
  dependencies:
    flutter_riverpod: ^2.4.9      # State management
    go_router: ^13.2.0            # Navigation
    freezed_annotation: ^2.4.1    # Immutable models
    json_annotation: ^4.8.1       # JSON serialization
    intl: ^0.18.1                 # i18n & date formatting
    url_launcher: ^6.2.4          # Open external URLs
    share_plus: ^7.2.1            # Share content
    webview_flutter: ^4.4.4       # YouTube/Spotify embeds
    pdfx: ^2.6.0                  # PDF viewer
    audioplayers: ^5.2.1          # Audio playback
  ```

### Day 3: Core Architecture
- [ ] Set up Riverpod providers structure
- [ ] Configure GoRouter with all routes
- [ ] Create base theme (matching Ionic iOS style)
- [ ] Set up timezone utilities (America/Toronto)
- [ ] Create error handling infrastructure

---

## Phase 2: Data Models & Firebase Services (Days 4-7)

### Day 4: Core Models (Freezed)
- [ ] Member model
- [ ] Service model
- [ ] Team model (with TeamMember, TeamPosition, TeamRole)
- [ ] Resource model (with ResourceMedia, ResourceType)

### Day 5: Supporting Models
- [ ] Assignment model
- [ ] Availability model
- [ ] Program model (ProgramItem, ProgramSubItem, ProgramParticipant)
- [ ] Bible types (BibleReference, BibleVerse)
- [ ] Scheduling types

### Day 6: Firebase Services (Part 1)
- [ ] AuthService (email/password, email link)
- [ ] MembersService (CRUD, onboarding status)
- [ ] TeamsService (CRUD, positions, member management)
- [ ] ServicesService (CRUD, team requirements)

### Day 7: Firebase Services (Part 2)
- [ ] AssignmentsService
- [ ] AvailabilityService
- [ ] ResourcesService (with collections)
- [ ] ProgramsService
- [ ] MinistriesService

---

## Phase 3: Shared Widgets & Components (Days 8-12)

### Day 8: Layout Components
- [ ] AppScaffold (with SideMenu)
- [ ] CustomAppBar
- [ ] BottomNavBar (TabsPage equivalent)
- [ ] EmptyState widget
- [ ] LoadingIndicator

### Day 9: Member & Team Components
- [ ] MemberItem (with avatar, availability status, position)
- [ ] MemberAvatar (initials fallback)
- [ ] TeamCard / TeamCardNoPen
- [ ] TeamFilter

### Day 10: Scheduling Components
- [ ] EventSelector (horizontal scrolling service cards)
- [ ] OverviewCard
- [ ] ViewToggle
- [ ] AvailabilitySubmission

### Day 11: Resource Components
- [ ] ResourceCard
- [ ] ResourceSelector (multi-tab: Existantes, YouTube, Créer)
- [ ] VideoPlayerModal (YouTube embed)
- [ ] AudioPlayerModal
- [ ] PdfViewer

### Day 12: Form & Modal Components
- [ ] ParticipantSelector
- [ ] Custom modals (AlertDialog, BottomSheet patterns)
- [ ] Form inputs matching Ionic style
- [ ] Action sheets

---

## Phase 4: Feature Modules - Authentication & Onboarding (Days 13-15)

### Day 13: Authentication
- [ ] LoginPage (email/password, email link)
- [ ] AuthProvider (state management)
- [ ] Auth guards for routes
- [ ] Session management

### Day 14: Onboarding Flow (Part 1)
- [ ] WelcomePage
- [ ] PersonalInfoPage
- [ ] PhonePage
- [ ] OnboardingProvider (step tracking)

### Day 15: Onboarding Flow (Part 2)
- [ ] TeamSelectionPage
- [ ] CongratulationsPage
- [ ] Onboarding completion logic
- [ ] Route guards for onboarding status

---

## Phase 5: Feature Modules - Teams (Days 16-19)

### Day 16: Teams List & Detail
- [ ] TeamsPage (list with search)
- [ ] TeamDetailPage (info, members, positions)
- [ ] Team member management UI

### Day 17: Team Forms & Actions
- [ ] TeamFormPage (create/edit)
- [ ] Position management (add/edit/delete/reorder)
- [ ] Member role management
- [ ] Transfer ownership

### Day 18: Team Scheduling
- [ ] TeamSchedulingView
- [ ] Member assignment with conflict detection
- [ ] Position override per service

### Day 19: Team Availability & Assignments
- [ ] TeamAvailabilityPage
- [ ] TeamAssignmentsPage
- [ ] Availability status display

---

## Phase 6: Feature Modules - Services (Days 20-24)

### Day 20: Services List
- [ ] ServicesPage (upcoming, past, drafts)
- [ ] Service cards with status badges
- [ ] Service filtering

### Day 21: Service Detail
- [ ] ServiceDetailPage (tabbed: Programme, Ressources, Membres)
- [ ] ServiceInfoHeader
- [ ] MembersOverview
- [ ] Quick actions

### Day 22: Service Form
- [ ] ServiceFormPage (create/edit)
- [ ] Date/time picker (Toronto timezone)
- [ ] Team requirements configuration
- [ ] Category selection

### Day 23: Service Program
- [ ] ServiceProgramPage
- [ ] Program item types (Chant, Prière, Lecture, Prédication, Titre, Section)
- [ ] Add/edit/delete items
- [ ] Sub-items support

### Day 24: Program Advanced Features
- [ ] Drag-and-drop reordering
- [ ] Participant assignment
- [ ] Scripture reference picker
- [ ] Bible verse fetching (bolls.life API)

---

## Phase 7: Feature Modules - Resources (Days 25-27)

### Day 25: Resources List & Detail
- [ ] ResourcesPage (grid/list view)
- [ ] ResourceDetailPage
- [ ] Media type detection and display

### Day 26: Resource Form & Collections
- [ ] ResourceFormPage
- [ ] ResourceCollectionsPage
- [ ] Media upload (Storage)
- [ ] YouTube/Spotify link support

### Day 27: Media Players
- [ ] YouTube WebView player
- [ ] Spotify embed support
- [ ] Audio player
- [ ] PDF viewer integration

---

## Phase 8: Feature Modules - Scheduling & Availability (Days 28-30)

### Day 28: Main Scheduling View
- [ ] SchedulingView (admin view)
- [ ] Event selection
- [ ] Team/overview toggle
- [ ] Member assignment flow

### Day 29: Availability Management
- [ ] DisponibilitesPage
- [ ] Availability submission
- [ ] Conflict detection
- [ ] Status indicators

### Day 30: Scheduling Store Migration
- [ ] SchedulingProvider (Riverpod)
- [ ] Real-time Firestore listeners
- [ ] Optimistic updates
- [ ] Error handling

---

## Phase 9: Supporting Features (Days 31-33)

### Day 31: Dashboard & Navigation
- [ ] AccueilPage (dashboard)
- [ ] Upcoming services summary
- [ ] Quick actions
- [ ] User menu

### Day 32: Settings & Account
- [ ] SettingsPage
- [ ] MyAccountPage
- [ ] Profile editing
- [ ] Notification preferences

### Day 33: Static Pages & Misc
- [ ] AboutPage
- [ ] TermsPage
- [ ] PrivacyPage
- [ ] ReleasesPage
- [ ] InvitePage (invitation links)

---

## Phase 10: Push Notifications & Polish (Days 34-36)

### Day 34: Push Notifications
- [ ] FCM setup and configuration
- [ ] Foreground message handling
- [ ] Background message handling
- [ ] Notification permissions flow

### Day 35: Performance & Analytics
- [ ] Firebase Analytics integration
- [ ] Screen view tracking
- [ ] Custom events
- [ ] Performance monitoring

### Day 36: UI Polish
- [ ] Consistent theming
- [ ] Loading states
- [ ] Error states
- [ ] Animations and transitions
- [ ] Platform-specific tweaks (iOS/Android)

---

## Phase 11: Testing & Bug Fixes (Days 37-40)

### Day 37-38: Integration Testing
- [ ] Auth flow testing
- [ ] CRUD operations testing
- [ ] Scheduling workflow testing
- [ ] Edge cases

### Day 39-40: Bug Fixes & Refinement
- [ ] Address discovered issues
- [ ] Performance optimization
- [ ] Memory leak checks
- [ ] Final polish

---

## Technical Considerations

### State Management: Riverpod
```dart
// Example provider structure
final membersProvider = StreamProvider<List<Member>>((ref) {
  return FirebaseFirestore.instance
      .collection('members')
      .snapshots()
      .map((snapshot) => snapshot.docs.map(Member.fromFirestore).toList());
});

final currentUserProvider = StateNotifierProvider<CurrentUserNotifier, Member?>((ref) {
  return CurrentUserNotifier(ref);
});
```

### Navigation: GoRouter
```dart
final router = GoRouter(
  routes: [
    GoRoute(path: '/', builder: (_, __) => const AccueilPage()),
    GoRoute(path: '/login', builder: (_, __) => const LoginPage()),
    GoRoute(path: '/teams', builder: (_, __) => const TeamsPage()),
    GoRoute(path: '/team/:id', builder: (_, state) => TeamDetailPage(id: state.pathParameters['id']!)),
    // ... more routes
  ],
  redirect: (context, state) {
    // Auth guards, onboarding guards
  },
);
```

### Firebase Firestore Patterns
```dart
// Repository pattern
class TeamsRepository {
  final FirebaseFirestore _firestore;

  Stream<List<Team>> watchTeams() {
    return _firestore.collection('teams').snapshots().map(
      (snapshot) => snapshot.docs.map(Team.fromFirestore).toList(),
    );
  }

  Future<void> updateTeam(String id, Map<String, dynamic> data) {
    return _firestore.collection('teams').doc(id).update(data);
  }
}
```

---

## Risk Factors & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Drag-and-drop complexity | High | Use flutter_reorderable_list or built-in ReorderableListView |
| YouTube/Spotify embeds | Medium | WebView with proper configuration |
| Bible API integration | Low | Direct HTTP calls, same API |
| French localization | Low | intl package, same strings |
| Timezone handling | Medium | Use timezone package, same logic |
| PDF viewing | Low | pdfx package works well |
| FCM on iOS | Medium | Proper APNs configuration required |

---

## Recommended Parallel Work Distribution

### If 2 Developers (20 days):

**Developer A (Frontend Focus):**
- Days 1-3: Project setup, theme
- Days 4-7: All 34 screens/pages
- Days 8-12: UI polish, animations

**Developer B (Backend/Data Focus):**
- Days 1-3: Firebase setup, models
- Days 4-7: All services & providers
- Days 8-12: Integration, testing

### If 3 Developers (15 days):

**Developer A:** Auth, Onboarding, Settings, Account
**Developer B:** Teams, Scheduling, Availability
**Developer C:** Services, Resources, Programs

---

## Success Metrics

- [ ] All 34 screens functional
- [ ] Firebase operations matching current behavior
- [ ] Push notifications working on iOS/Android
- [ ] YouTube/Spotify playback working
- [ ] Bible verse fetching working
- [ ] Offline capability (Firestore persistence)
- [ ] Performance comparable to Ionic version
- [ ] App Store / Play Store ready

---

## Post-Migration Considerations

1. **Beta Testing:** 1-2 weeks with core users
2. **Data Migration:** None needed (same Firebase backend)
3. **Phased Rollout:** Consider gradual release
4. **Support:** Document changes for users
5. **Monitoring:** Set up Crashlytics for Flutter

---

*Plan created: January 5, 2026*
*Estimated effort: 30-40 person-days*
