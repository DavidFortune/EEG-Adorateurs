## Why

Member avatars in service team views (ServiceMembersPage, ServiceDetailPage) are broken in two ways: (1) members who have Google profile photos or custom avatars sometimes show only initials because the avatar field is missing from their Firestore document, and (2) when avatars do display, they appear distorted due to missing `object-fit: cover` CSS styling. This was partially addressed in a previous avatar-display-fix but the service member views were missed.

## What Changes

- Add `object-fit: cover` and `border-radius: 50%` CSS to avatar `<img>` elements in `ServiceMembersPage` and `ServiceDetailPage`
- Ensure Google `photoURL` is persisted to the member's Firestore `avatar` field during login/auth state changes (not just onboarding), so that all members have avatars available when loaded via `getMemberById()`

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `avatar-display-fix`: Extend avatar CSS fix requirement to cover ServiceMembersPage and ServiceDetailPage components

## Impact

- `src/views/services/ServiceMembersPage.vue` - Add avatar image CSS
- `src/views/services/ServiceDetailPage.vue` - Add avatar image CSS
- `src/composables/useUser.ts` or auth flow - Sync Google photoURL to Firestore member avatar field on login
