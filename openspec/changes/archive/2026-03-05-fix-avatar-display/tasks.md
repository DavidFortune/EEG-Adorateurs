## 1. Fix Avatar Image CSS in Affected Components

- [x] 1.1 Add `.member-avatar img` CSS rules to `src/components/service-detail/MembersOverview.vue` (`width: 100%`, `height: 100%`, `object-fit: cover`, `border-radius: 50%`)
- [x] 1.2 Add `.menu-avatar img` CSS rules to `src/components/UserMenu.vue` (`width: 100%`, `height: 100%`, `object-fit: cover`, `border-radius: 50%`)
- [x] 1.3 Add `.participant-avatar img` CSS rules to `src/components/ParticipantSelector.vue` (`width: 100%`, `height: 100%`, `object-fit: cover`, `border-radius: 50%`)

## 2. Verification

- [x] 2.1 Visually verify avatar images render correctly in MembersOverview (44px circular, cover-fit) *(manual)*
- [x] 2.2 Visually verify avatar images render correctly in UserMenu (48px circular, cover-fit) *(manual)*
- [x] 2.3 Visually verify avatar images render correctly in ParticipantSelector (36px circular, cover-fit) *(manual)*
- [x] 2.4 Verify initials fallback still displays correctly in all three components *(manual)*
