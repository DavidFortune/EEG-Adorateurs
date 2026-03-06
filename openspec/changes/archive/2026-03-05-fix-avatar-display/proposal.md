## Why

Avatar images are not displayed properly for users who have uploaded a photo. Several components are missing CSS rules for the `<img>` element inside avatar containers, causing uploaded photos to render without proper sizing, circular clipping, or aspect ratio control. Users who upload avatars see broken or misaligned images instead of properly styled circular photos.

## What Changes

- Add missing `.member-avatar img` CSS rules in `MembersOverview.vue` (primary broken component — no img styling at all)
- Audit and fix avatar image CSS in `UserMenu.vue` and `ParticipantSelector.vue` which also lack explicit `img` styling
- Ensure all avatar-rendering components consistently apply `width: 100%`, `height: 100%`, `object-fit: cover`, and `border-radius: 50%` to avatar images

## Capabilities

### New Capabilities

- `avatar-display-fix`: Fix CSS styling for avatar images across all components that render user-uploaded photos

### Modified Capabilities


## Impact

- **Affected components:** `MembersOverview.vue`, `UserMenu.vue`, `ParticipantSelector.vue` (CSS-only changes)
- **Reference components (already correct):** `MyAccountPage.vue`, `MemberItem.vue`, `TeamDetailPage.vue`
- **No API, data, or dependency changes** — this is purely a CSS fix
- **No breaking changes** — initials fallback continues to work as before
