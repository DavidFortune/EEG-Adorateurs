## Context

The ServiceProgramPage (`src/views/services/ServiceProgramPage.vue`) is a ~6,000 line Vue 3 component that serves as the primary program editing interface. It uses Ionic Framework components (ion-reorder-group, ion-item, ion-chip, etc.) with scoped CSS and a single `@media (max-width: 768px)` breakpoint for mobile adjustments. The Stitch project "EEG Adorateurs" contains a `ServiceProgrammePage` screen (mobile, 390px wide) that provides the target design direction with improved card spacing, touch-friendly layouts, and cleaner visual hierarchy.

Current mobile pain points:
- Item cards feel cramped with only minor padding reductions at 768px
- Quick action buttons are small and clustered, causing mis-taps
- Metadata chips (duration, participants) compete for space with titles
- Section dividers lack sufficient visual weight on small screens
- The service header / draft area doesn't surface the publish CTA prominently enough
- Sub-item containers have weak visual grouping

## Goals / Non-Goals

**Goals:**
- Align the ServiceProgramPage mobile layout with the Stitch ServiceProgrammePage design
- Improve touch target sizes to meet 44px minimum tap target guidelines
- Create clearer visual hierarchy between program sections, items, and sub-items
- Make the publish CTA more prominent in the draft status area
- Improve thumb-reach ergonomics for the InlineAddBar at screen bottom

**Non-Goals:**
- Desktop layout changes (focus is exclusively on < 768px)
- Functional changes to item creation, editing, or reorder logic
- Data model or API changes
- Presentation mode layout changes
- Adding new features or capabilities beyond layout refinements

## Decisions

### 1. CSS-only approach within existing component structure
**Decision**: Modify scoped styles and minimal template adjustments in ServiceProgramPage.vue rather than extracting new components.
**Rationale**: The changes are primarily spacing, sizing, and visual refinements. Creating new components would add unnecessary complexity for what is essentially a styling pass. The existing component structure (item cards, meta chips, quick actions) maps well to the Stitch design.
**Alternative considered**: Extract a `ProgramItemCard` component — rejected because it would require significant refactoring of the 6,000-line file for purely visual changes.

### 2. Add a 480px small-screen breakpoint
**Decision**: Introduce a `@media (max-width: 480px)` breakpoint alongside the existing 768px one for further refinements on small phones.
**Rationale**: The Stitch design targets 390px width. Items that look fine at 768px still need tighter adjustments on iPhone SE / small Android devices. Two breakpoints allow progressive enhancement.
**Alternative considered**: Single 768px breakpoint with more aggressive reductions — rejected because it would over-shrink elements on tablets.

### 3. Use CSS custom properties for spacing tokens
**Decision**: Define spacing tokens (`--program-item-padding`, `--program-item-gap`, etc.) at the component level and override them in media queries.
**Rationale**: Makes the responsive behavior easier to maintain and test. Changing a single variable updates multiple elements consistently.
**Alternative considered**: Hardcoded values in each media query — rejected for maintainability.

### 4. Minimum 44px touch targets for interactive elements
**Decision**: Ensure all tappable elements (quick action buttons, meta chips, menu triggers) have at least 44×44px hit areas, using padding/margin expansion where visual size should remain small.
**Rationale**: Apple HIG and Material Design both recommend 44px minimum. Current quick action buttons are ~32px.
**Alternative considered**: 48px (Material's recommendation) — 44px chosen as sufficient while preserving space in the compact mobile layout.

## Risks / Trade-offs

- **[Visual regression on edge cases]** → Mitigate with manual testing across iPhone SE, iPhone 14, and a mid-size Android. The CSS-only approach limits blast radius.
- **[6,000-line file complexity]** → Changes are isolated to the `<style scoped>` section and minor template class additions. No logic changes.
- **[Stitch design divergence]** → The Stitch screen is a reference, not a pixel-perfect target. Ionic component constraints (ion-item structure, slot system) mean some adaptation is necessary.
