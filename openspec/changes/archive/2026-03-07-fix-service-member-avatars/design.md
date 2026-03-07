## Context

Avatars in the app come from two sources: (1) Google Auth `photoURL` saved during onboarding, and (2) custom uploaded avatars via the My Account page. The `useUser` composable correctly prioritizes custom avatar over Google photo for the current user's header. However, when loading other members' data (e.g., in service team lists), only the Firestore `member.avatar` field is available — there's no fallback to Google Auth since we can't access other users' Firebase Auth profiles client-side.

Members created before the avatar feature, or whose Google `photoURL` was empty at onboarding time, have no `avatar` field in Firestore, causing initials to always show.

Additionally, `ServiceMembersPage` and `ServiceDetailPage` are missing the `object-fit: cover` CSS that was added to `MembersOverview` in the previous avatar-display-fix.

## Goals / Non-Goals

**Goals:**
- Ensure all service member views display avatars with proper circular cover-fit styling
- Sync Google photoURL to Firestore member.avatar on login for members who don't have a custom avatar

**Non-Goals:**
- Batch migration of existing members (users will get their avatar synced on next login)
- Changing the avatar upload or My Account flow

## Decisions

**Decision: Sync photoURL on auth state change in useUser**

When `loadMemberData()` runs in the `useUser` composable and finds a member without an `avatar` field but the Firebase Auth user has a `photoURL`, update the member's Firestore document with that URL. This is a lightweight, login-time sync that covers all members over time.

Only sync if the member has no avatar (don't overwrite custom uploads).

**Decision: Add CSS fix inline in each component**

Add `object-fit: cover` to avatar img elements in `ServiceMembersPage` and `ServiceDetailPage` scoped styles, matching the pattern already used in `MembersOverview`.

## Risks / Trade-offs

- [Risk] Google photoURL may expire or change -> Mitigation: re-synced on each login via auth state change
