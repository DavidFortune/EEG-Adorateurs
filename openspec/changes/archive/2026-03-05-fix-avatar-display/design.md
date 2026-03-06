## Context

The application uses circular avatar components across 7+ Vue/Ionic components. When users upload a profile photo, the image URL is stored in Firestore and rendered via `<img>` tags inside `<ion-avatar>` containers. Three components (`MembersOverview.vue`, `UserMenu.vue`, `ParticipantSelector.vue`) are missing CSS rules for avatar `<img>` elements, causing uploaded photos to render incorrectly — without proper sizing, circular clipping, or aspect ratio preservation.

Components that already work correctly (`MyAccountPage.vue`, `MemberItem.vue`, `TeamDetailPage.vue`) all apply `width: 100%`, `height: 100%`, `object-fit: cover`, and `border-radius: 50%` to avatar images.

## Goals / Non-Goals

**Goals:**
- Fix avatar image display in all affected components so uploaded photos render as properly-sized, circular, cover-fit images
- Ensure visual consistency with components that already display avatars correctly

**Non-Goals:**
- Refactoring avatar rendering into a shared component (future improvement)
- Changing avatar upload, storage, or optimization logic
- Modifying the initials fallback behavior

## Decisions

**Decision: Add CSS rules directly to each affected component (not a shared utility class)**

Rationale: The project currently styles avatars per-component with scoped CSS. Introducing a shared CSS class or extracting a shared avatar component would be a larger refactoring effort that goes beyond the scope of this bug fix. Each component has slightly different avatar sizes (44px, 48px, 36px), so per-component styling is appropriate.

Alternative considered: Creating a shared `BaseAvatar.vue` component. Rejected because it changes component structure beyond what's needed for this fix.

**Decision: Match the proven CSS pattern from working components**

The fix applies the same CSS properties used in `TeamDetailPage.vue` and `MemberItem.vue`:
```css
img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}
```

## Risks / Trade-offs

- [Low risk] Ionic's `<ion-avatar>` may apply its own default image styling → Mitigation: scoped CSS with specific selectors will override defaults
- [Trade-off] Per-component CSS duplication vs. shared component → Accepted: keeps fix minimal and focused
