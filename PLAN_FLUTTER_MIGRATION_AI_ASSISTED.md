# Flutter Migration Plan - AI-Assisted (2 Developers + Claude)

## Executive Summary

**Team:** 2 Experienced Flutter Developers + Claude AI
**Duration:** 10-12 working days (2 weeks)
**Approach:** AI-augmented parallel development

---

## Team Roles

### Developer A (Frontend Lead)
- UI screens and widgets
- Theme and styling
- Animations and polish
- Platform-specific adjustments

### Developer B (Backend Lead)
- Firebase services and providers
- Data models and repositories
- Business logic
- Push notifications

### Claude AI (Pair Programming Assistant)
- Code generation from Vue→Flutter
- Boilerplate creation
- Test generation
- Code review assistance
- Documentation

---

## Daily Breakdown

### Day 1: Foundation

#### Developer A - Morning
- [ ] Create Flutter project: `flutter create --org com.eegadorateurs eeg_adorateurs`
- [ ] **Claude task:** "Generate folder structure for feature-based architecture"
- [ ] Set up theme matching Ionic iOS style
- [ ] Configure fonts and colors from variables.css

#### Developer A - Afternoon
- [ ] **Claude task:** "Convert these Ionic color variables to Flutter ThemeData"
- [ ] Create AppScaffold, CustomAppBar widgets
- [ ] Set up BottomNavigationBar (TabsPage)

#### Developer B - Morning
- [ ] Run `flutterfire configure` for Firebase
- [ ] Add all dependencies to pubspec.yaml
- [ ] **Claude task:** "Generate pubspec.yaml with all required dependencies for this project"

#### Developer B - Afternoon
- [ ] **Claude task:** "Convert these 10 TypeScript interfaces to Freezed models"
  - Input: All files from src/types/
  - Output: Dart Freezed classes with JSON serialization
- [ ] Run build_runner to generate code

**Day 1 Deliverables:**
- ✅ Project structure complete
- ✅ Firebase configured
- ✅ All 10 data models created
- ✅ Basic theme and navigation shell

---

### Day 2: Firebase Services

#### Developer A - Full Day
- [ ] **Claude task:** "Convert MemberItem.vue to Flutter widget"
- [ ] **Claude task:** "Convert TeamCard.vue to Flutter widget"
- [ ] **Claude task:** "Convert TeamCardNoPen.vue to Flutter widget"
- [ ] **Claude task:** "Convert EventSelector.vue to Flutter widget"
- [ ] Review and refine all generated widgets
- [ ] Create MemberAvatar widget (initials fallback)

#### Developer B - Morning
- [ ] **Claude task:** "Convert src/firebase/auth.ts to Flutter AuthService"
- [ ] **Claude task:** "Convert src/firebase/members.ts to Flutter MembersRepository"
- [ ] **Claude task:** "Convert src/firebase/teams.ts to Flutter TeamsRepository"

#### Developer B - Afternoon
- [ ] **Claude task:** "Convert src/firebase/firestore.ts (services) to Flutter ServicesRepository"
- [ ] **Claude task:** "Convert src/firebase/assignments.ts to Flutter AssignmentsRepository"
- [ ] **Claude task:** "Convert src/firebase/availability.ts to Flutter AvailabilityRepository"
- [ ] Review all generated services, test basic CRUD

**Day 2 Deliverables:**
- ✅ 6 core widgets created
- ✅ 6 Firebase repositories created
- ✅ Basic CRUD operations working

---

### Day 3: More Services + Auth Flow

#### Developer A - Morning
- [ ] **Claude task:** "Convert LoginPage.vue to Flutter"
- [ ] Implement email/password login
- [ ] Implement email link authentication

#### Developer A - Afternoon
- [ ] **Claude task:** "Convert WelcomePage.vue to Flutter"
- [ ] **Claude task:** "Convert PersonalInfoPage.vue to Flutter"
- [ ] **Claude task:** "Convert PhonePage.vue to Flutter"
- [ ] Wire up navigation between screens

#### Developer B - Morning
- [ ] **Claude task:** "Convert src/firebase/resources.ts to Flutter ResourcesRepository"
- [ ] **Claude task:** "Convert src/firebase/programs.ts to Flutter ProgramsRepository"
- [ ] **Claude task:** "Convert src/firebase/ministries.ts to Flutter MinistriesRepository"

#### Developer B - Afternoon
- [ ] **Claude task:** "Create Riverpod providers for all repositories"
- [ ] Set up GoRouter with auth guards
- [ ] **Claude task:** "Convert src/stores/onboarding.ts to Riverpod StateNotifier"

**Day 3 Deliverables:**
- ✅ All 9 Firebase repositories complete
- ✅ Auth flow working
- ✅ 4 onboarding screens created
- ✅ Riverpod state management set up

---

### Day 4: Complete Onboarding + Teams List

#### Developer A - Morning
- [ ] **Claude task:** "Convert TeamSelectionPage.vue to Flutter"
- [ ] **Claude task:** "Convert CongratulationsPage.vue to Flutter"
- [ ] Complete onboarding flow end-to-end
- [ ] Test onboarding with real Firebase

#### Developer A - Afternoon
- [ ] **Claude task:** "Convert TeamsPage.vue to Flutter"
- [ ] **Claude task:** "Convert TeamDetailPage.vue to Flutter"
- [ ] Implement team member list display

#### Developer B - Morning
- [ ] **Claude task:** "Convert src/composables/useUser.ts to Riverpod provider"
- [ ] Implement current user provider with auth state
- [ ] Add role-based access helpers (isAdmin, isTeamLeader)

#### Developer B - Afternoon
- [ ] **Claude task:** "Convert src/utils/timezone.ts to Dart"
- [ ] **Claude task:** "Convert src/utils/resource-utils.ts to Dart"
- [ ] Implement YouTube/Spotify URL detection
- [ ] Test timezone formatting (America/Toronto)

**Day 4 Deliverables:**
- ✅ Onboarding flow complete and tested
- ✅ Teams list and detail pages
- ✅ User provider with roles
- ✅ All utilities converted

---

### Day 5: Team Management + Forms

#### Developer A - Full Day
- [ ] **Claude task:** "Convert TeamFormPage.vue to Flutter"
- [ ] Implement team creation/editing
- [ ] Position management (add/edit/delete/reorder)
- [ ] **Claude task:** "Create drag-and-drop reorderable list for positions"
- [ ] Member role management UI
- [ ] Transfer ownership dialog

#### Developer B - Full Day
- [ ] **Claude task:** "Convert src/stores/schedulingStore.ts to Riverpod"
- [ ] Implement scheduling state management
- [ ] Real-time Firestore listeners for assignments
- [ ] Conflict detection logic
- [ ] **Claude task:** "Write unit tests for conflict detection"

**Day 5 Deliverables:**
- ✅ Team form with all features
- ✅ Position management working
- ✅ Scheduling store complete
- ✅ Conflict detection tested

---

### Day 6: Team Scheduling Views

#### Developer A - Morning
- [ ] **Claude task:** "Convert TeamSchedulingView.vue to Flutter"
- [ ] Event selector integration
- [ ] Member assignment UI

#### Developer A - Afternoon
- [ ] **Claude task:** "Convert TeamAvailabilityPage.vue to Flutter"
- [ ] **Claude task:** "Convert TeamAssignmentsPage.vue to Flutter"
- [ ] Availability status display

#### Developer B - Morning
- [ ] **Claude task:** "Convert OverviewCard.vue to Flutter"
- [ ] **Claude task:** "Convert ViewToggle.vue to Flutter"
- [ ] **Claude task:** "Convert TeamFilter.vue to Flutter"

#### Developer B - Afternoon
- [ ] Wire up scheduling providers to UI
- [ ] Test member assignment flow end-to-end
- [ ] Position override per service feature
- [ ] **Claude task:** "Write integration tests for assignment flow"

**Day 6 Deliverables:**
- ✅ All team scheduling screens complete
- ✅ Member assignment working
- ✅ Position override working
- ✅ Integration tests passing

---

### Day 7: Services Module

#### Developer A - Full Day
- [ ] **Claude task:** "Convert ServicesPage.vue to Flutter"
- [ ] **Claude task:** "Convert ServiceDetailPage.vue to Flutter"
- [ ] Service tabs (Programme, Ressources, Membres)
- [ ] **Claude task:** "Convert ServiceInfoHeader.vue to Flutter"
- [ ] **Claude task:** "Convert MembersOverview.vue to Flutter"

#### Developer B - Full Day
- [ ] **Claude task:** "Convert ServiceFormPage.vue to Flutter"
- [ ] Date/time picker with timezone
- [ ] Team requirements configuration
- [ ] Category selection (Service, Événement spécial)
- [ ] Service publishing workflow

**Day 7 Deliverables:**
- ✅ Services list page
- ✅ Service detail page with tabs
- ✅ Service form complete
- ✅ Service CRUD working

---

### Day 8: Program Builder

#### Developer A - Morning
- [ ] **Claude task:** "Convert ServiceProgramPage.vue to Flutter"
- [ ] Program item list display
- [ ] Item type icons and styling

#### Developer A - Afternoon
- [ ] Add/edit program item dialogs
- [ ] **Claude task:** "Create drag-and-drop reorderable program list"
- [ ] Sub-items support (songs under worship)

#### Developer B - Morning
- [ ] **Claude task:** "Convert src/services/bibleService.ts to Dart"
- [ ] Bible reference parsing (French)
- [ ] bolls.life API integration
- [ ] Verse fetching and display

#### Developer B - Afternoon
- [ ] **Claude task:** "Convert ParticipantSelector.vue to Flutter"
- [ ] Scripture reference picker
- [ ] Participant assignment UI
- [ ] **Claude task:** "Write tests for Bible reference parsing"

**Day 8 Deliverables:**
- ✅ Program builder complete
- ✅ Drag-and-drop reordering
- ✅ Bible verse fetching working
- ✅ Participant assignment working

---

### Day 9: Resources Module

#### Developer A - Morning
- [ ] **Claude task:** "Convert ResourcesPage.vue to Flutter"
- [ ] Grid/list view toggle
- [ ] Resource type filters

#### Developer A - Afternoon
- [ ] **Claude task:** "Convert ResourceDetailPage.vue to Flutter"
- [ ] **Claude task:** "Convert ResourceFormPage.vue to Flutter"
- [ ] Media type display

#### Developer B - Morning
- [ ] **Claude task:** "Convert ResourceCollectionsPage.vue to Flutter"
- [ ] **Claude task:** "Convert ResourceSelector.vue to Flutter"
- [ ] Collection management

#### Developer B - Afternoon
- [ ] **Claude task:** "Convert VideoPlayerModal.vue to Flutter WebView"
- [ ] YouTube embed player
- [ ] **Claude task:** "Create Spotify embed player"
- [ ] **Claude task:** "Create AudioPlayerModal in Flutter"

**Day 9 Deliverables:**
- ✅ Resources list and detail
- ✅ Resource form with upload
- ✅ Collections management
- ✅ Media players working

---

### Day 10: Dashboard, Settings, Scheduling

#### Developer A - Morning
- [ ] **Claude task:** "Convert AccueilPage.vue to Flutter"
- [ ] Dashboard cards
- [ ] Upcoming services summary
- [ ] Quick actions

#### Developer A - Afternoon
- [ ] **Claude task:** "Convert SettingsPage.vue to Flutter"
- [ ] **Claude task:** "Convert MyAccountPage.vue to Flutter"
- [ ] Profile editing
- [ ] App preferences

#### Developer B - Morning
- [ ] **Claude task:** "Convert SchedulingView.vue to Flutter"
- [ ] Admin scheduling view
- [ ] Team/overview toggle

#### Developer B - Afternoon
- [ ] **Claude task:** "Convert DisponibilitesPage.vue to Flutter"
- [ ] Availability submission
- [ ] **Claude task:** "Convert AvailabilitySubmission.vue to Flutter"

**Day 10 Deliverables:**
- ✅ Dashboard complete
- ✅ Settings and account pages
- ✅ Main scheduling view
- ✅ Availability management

---

### Day 11: Static Pages + Push Notifications

#### Developer A - Morning
- [ ] **Claude task:** "Convert AboutPage.vue to Flutter"
- [ ] **Claude task:** "Convert TermsPage.vue to Flutter"
- [ ] **Claude task:** "Convert PrivacyPage.vue to Flutter"
- [ ] **Claude task:** "Convert ReleasesPage.vue to Flutter"

#### Developer A - Afternoon
- [ ] **Claude task:** "Convert InvitePage.vue to Flutter"
- [ ] SideMenu implementation
- [ ] UserMenu dropdown
- [ ] Navigation polish

#### Developer B - Full Day
- [ ] **Claude task:** "Convert src/services/fcmService.ts to Flutter"
- [ ] Firebase Messaging setup
- [ ] iOS APNs configuration
- [ ] Foreground/background message handling
- [ ] **Claude task:** "Convert src/services/pushNotificationService.ts to Flutter"
- [ ] Permission request flow
- [ ] Local notifications

**Day 11 Deliverables:**
- ✅ All static pages complete
- ✅ Push notifications working (iOS + Android)
- ✅ Navigation complete
- ✅ All 34 screens implemented

---

### Day 12: Polish, Testing, Bug Fixes

#### Developer A - Full Day
- [ ] UI consistency review
- [ ] Animation polish (page transitions, list animations)
- [ ] Loading states for all screens
- [ ] Error states and empty states
- [ ] Platform-specific adjustments (iOS/Android)
- [ ] **Claude task:** "Review all screens for UI consistency issues"

#### Developer B - Full Day
- [ ] **Claude task:** "Generate widget tests for core components"
- [ ] **Claude task:** "Generate integration tests for auth flow"
- [ ] End-to-end testing
- [ ] Performance profiling
- [ ] Memory leak checks
- [ ] Bug fixes from testing

**Day 12 Deliverables:**
- ✅ All UI polished
- ✅ Tests written and passing
- ✅ Performance optimized
- ✅ Ready for beta release

---

## AI Prompt Templates

### Converting Vue Components
```
Convert this Vue component to Flutter.
Use Riverpod for state management.
Match the styling as closely as possible.
Use Material 3 widgets where appropriate.

[paste Vue component code]
```

### Converting Firebase Services
```
Convert this TypeScript Firebase service to Dart.
Use the cloud_firestore package.
Return Streams for real-time data.
Include error handling.

[paste TypeScript service code]
```

### Converting Stores to Riverpod
```
Convert this Pinia store to Riverpod providers.
Use StateNotifier for mutable state.
Use StreamProvider for Firestore listeners.
Include all computed properties as derived providers.

[paste Pinia store code]
```

### Generating Tests
```
Write Flutter tests for this widget/service.
Include:
- Unit tests for business logic
- Widget tests for UI components
- Mock Firebase using fake_cloud_firestore

[paste Dart code]
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| AI generates incorrect code | Both devs review all AI output |
| Complex drag-drop issues | Allocate extra time, use proven packages |
| iOS push notification issues | Test on real device early (Day 11) |
| YouTube embed issues | Test WebView configuration early |
| Timezone bugs | Comprehensive timezone tests |

---

## Daily Sync Schedule

```
9:00 AM  - Morning standup (15 min)
           Review yesterday, plan today

12:00 PM - Midday check-in (10 min)
           Blockers? Need help?

5:00 PM  - End of day review (20 min)
           Demo completed work
           Update task list
           Plan next day
```

---

## Definition of Done

Each feature is complete when:
- [ ] UI matches original design
- [ ] Firebase operations work correctly
- [ ] Error states handled
- [ ] Loading states implemented
- [ ] Works on both iOS and Android
- [ ] Code reviewed by other developer
- [ ] Basic tests written

---

## Final Checklist (Day 12 End)

### Functionality
- [ ] All 34 screens implemented
- [ ] Auth flow (login, logout, email link)
- [ ] Onboarding flow complete
- [ ] Teams CRUD + scheduling
- [ ] Services CRUD + program builder
- [ ] Resources CRUD + media playback
- [ ] Availability management
- [ ] Push notifications

### Quality
- [ ] No crashes on iOS
- [ ] No crashes on Android
- [ ] Smooth 60fps animations
- [ ] Fast cold start (<3s)
- [ ] Offline mode works (Firestore persistence)

### Ready for Release
- [ ] App icons set
- [ ] Splash screen configured
- [ ] Version number set
- [ ] Firebase Analytics working
- [ ] Crashlytics configured (optional)

---

## Post-Migration (Week 3)

- **Days 13-14:** Internal beta testing
- **Day 15:** Bug fixes from beta
- **Day 16:** App Store / Play Store submission
- **Day 17-19:** Review period
- **Day 20:** Production release

---

*Plan created: January 5, 2026*
*Team: 2 Developers + Claude AI*
*Estimated duration: 10-12 working days*
