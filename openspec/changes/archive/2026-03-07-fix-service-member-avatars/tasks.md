## 1. Fix avatar CSS in service member views

- [x] 1.1 Add `object-fit: cover`, `width: 100%`, `height: 100%`, `border-radius: 50%` to avatar `<img>` elements in `src/views/services/ServiceMembersPage.vue`
- [x] 1.2 Add `object-fit: cover`, `width: 100%`, `height: 100%`, `border-radius: 50%` to avatar `<img>` elements in `src/views/services/ServiceDetailPage.vue`

## 2. Sync Google photoURL to Firestore on login

- [x] 2.1 In `src/composables/useUser.ts` `loadMemberData()`, after loading the member, check if `member.avatar` is empty and `user.photoURL` exists — if so, update the Firestore member document with the Google photoURL and set the local member ref's avatar

## 3. Handle broken avatar URLs with @error fallback across entire app

- [x] 3.1 Add `@error` handler + `failedAvatars` reactive Set to `MembersOverview.vue` (2 images)
- [x] 3.2 Add `@error` handler + `failedAvatars` reactive Set to `ServiceMembersPage.vue` (2 images)
- [x] 3.3 Add `@error` handler + `failedAvatars` reactive Set to `ServiceDetailPage.vue` (1 image)
- [x] 3.4 Add `@error` handler to `ParticipantSelector.vue` (1 image)
- [x] 3.5 Add `@error` handler to `MyAccountPage.vue` (1 image)
- [x] 3.6 Add `@error` handler to `TeamAvailabilityPage.vue` (1 image)
- [x] 3.7 Add `@error` handler to `TeamAssignmentsPage.vue` (2 images)
- [x] 3.8 Add `@error` handler to `ServiceProgramPage.vue` (4 images: conductor, participants, draft viewers)
- [x] 3.9 Add `@error` handler to `TeamDetailPage.vue` (5 images: pending, approved, role/approve/position modals)
- [x] 3.10 Add `@error` handler to `UserMenu.vue` (1 image)
- [x] 3.11 Add `@error` handler to `AccueilPage.vue` (1 image)
- [x] 3.12 Add `@error` handler to `MemberItem.vue` (1 image)
