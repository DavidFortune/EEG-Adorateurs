## Why

The ServiceProgramPage is the most-used screen in the app, yet its mobile experience has rough edges: cramped item cards, inconsistent touch target sizes, awkward spacing between metadata chips and quick-action buttons, and visual density that makes scanning a 10+ item program difficult. The Stitch "ServiceProgrammePage" screen provides a refined mobile-first design reference with better visual hierarchy, cleaner card spacing, and more intuitive touch interactions. Aligning the implementation with this design will significantly improve usability for the majority-mobile user base.

## What Changes

- Redesign program item cards for better mobile readability: larger touch targets (via invisible tap expansion), improved spacing, clearer visual separation between items
- Redesign draft status area from a yellow warning card to a clean white compact notice card with side-by-side action buttons
- Remove the "Brouillon" draft badge chip from the header toolbar
- Redesign program summary from an ion-card with header to two standalone bordered stat boxes (item count + duration)
- Add "Ajouter un dirigeant" button when no conductor is set
- Remove the YouTube promotion banner (feature remains accessible via header icon)
- Add section creation button to the InlineAddBar type row for quick section creation
- Optimize quick-action button sizing: compact visual size (28px) with invisible 44px tap target expansion
- Improve metadata chip layout: horizontal scrollable row, consistent sizing and touch targets
- Enhance sub-item containers with primary color left border accent, subtle background tint, and clear indentation
- Refine section dividers with increased padding and top margin for visual separation
- Optimize InlineAddBar for mobile: 44px type icons, 44px input height, safe area bottom padding
- Add CSS custom properties for spacing tokens with responsive overrides at 768px and 480px breakpoints

## Capabilities

### New Capabilities
- `mobile-program-layout`: Responsive layout refinements for ServiceProgramPage including redesigned draft notice, standalone stat boxes, YouTube banner removal, touch target expansion, sub-item grouping, section dividers, and InlineAddBar optimization

### Modified Capabilities
- `service-program`: Update section creation to also be available via InlineAddBar button (in addition to 3-dot menu), update mobile-optimized item layout with refined spacing and touch target expansion

## Impact

- **Code**: `src/views/services/ServiceProgramPage.vue` (template and styles), `src/components/InlineAddBar.vue` (section button, mobile touch targets)
- **Template changes**: Draft controls redesigned, summary stats restructured, YouTube banner removed, draft badge removed, conductor edit button relocated
- **Styles**: Scoped CSS with new CSS custom properties for spacing tokens, responsive breakpoints at 768px and 480px
- **Dependencies**: No new dependencies; leverages existing Ionic components
- **Risk**: Low — primarily CSS/template changes, one new event (`addSection`) on InlineAddBar
