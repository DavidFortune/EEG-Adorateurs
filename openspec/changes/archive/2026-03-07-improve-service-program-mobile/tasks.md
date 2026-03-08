## 1. CSS Custom Properties & Foundation

- [x] 1.1 Define CSS custom properties for mobile spacing tokens (`--program-item-padding-v`, `--program-item-padding-h`, `--program-item-gap`, `--program-touch-target`) in ServiceProgramPage.vue scoped styles
- [x] 1.2 Add `@media (max-width: 480px)` breakpoint with tighter overrides for small phone screens
- [x] 1.3 Override spacing tokens in the existing 768px and new 480px media queries

## 2. Program Item Card Spacing & Separators

- [x] 2.1 Update `.program-item` padding to use spacing tokens (min 12px vertical, 16px horizontal on mobile)
- [x] 2.2 Add visible bottom border separator between item cards
- [x] 2.3 Set content area line-height to minimum 1.4 and add 4px gap between title and subtitle
- [x] 2.4 Ensure gaps between order badge, type icon, and content area are at least 12px on mobile

## 3. Touch Target Improvements

- [x] 3.1 Set quick action buttons to 28px visual size with 44px invisible tap target via `::before` pseudo-element
- [x] 3.2 Add 4px visual gap between quick action buttons (44px tap targets overlap provides adequate spacing)
- [x] 3.3 Add flex-wrap to quick action button row so buttons wrap when space is insufficient
- [x] 3.4 Increase metadata chip minimum height to 32px with 44px tappable area via `::before` pseudo-element
- [x] 3.5 Ensure 3-dot menu trigger has 44×44px min tap target

## 4. Metadata Chips Layout

- [x] 4.1 Set metadata chips to horizontal scrollable row (overflow-x: auto, hidden scrollbar) instead of wrapping
- [x] 4.2 Set chip text minimum font-size to 13px on mobile
- [x] 4.3 Ensure consistent chip height (32px min) across duration and participant chips

## 5. Draft Status Redesign

- [x] 5.1 Replace `ion-card color="warning"` with clean white notice card (subtle border + shadow)
- [x] 5.2 Layout: lock icon + "Mode brouillon" title + description text in horizontal arrangement
- [x] 5.3 Two side-by-side buttons: "Gérer les accès" (outline, medium) and "Publier le programme" (filled, dark)
- [x] 5.4 Remove "Brouillon" draft badge chip from header toolbar

## 6. Program Summary Redesign

- [x] 6.1 Replace `ion-card` wrapper with two standalone bordered stat boxes (12px border-radius, white bg)
- [x] 6.2 Each stat box: large primary-colored number centered above small gray label
- [x] 6.3 Remove "Résumé du programme" heading
- [x] 6.4 Move edit button to conductor section; add "Ajouter un dirigeant" fallback when no conductor

## 7. Sub-item Container Styling

- [x] 7.1 Add left border accent (2px, primary color at 30% opacity) to sub-item containers
- [x] 7.2 Add subtle background tint (3% primary color opacity) to sub-item containers
- [x] 7.3 Ensure sub-items have at least 24px left indent from parent item content
- [x] 7.4 Increase expand/collapse toggle tappable area to 44×44px

## 8. Section Dividers

- [x] 8.1 Increase section item vertical padding to at least 12px and text to minimum 15px font-size
- [x] 8.2 Add at least 16px vertical margin above section items for clear visual breaks

## 9. InlineAddBar Optimization

- [x] 9.1 Increase InlineAddBar vertical padding to minimum 12px on mobile
- [x] 9.2 Ensure type selector icons have 44×44px tappable areas on mobile
- [x] 9.3 Set text input minimum height to 44px
- [x] 9.4 Add bottom safe area inset padding (env(safe-area-inset-bottom)) to InlineAddBar
- [x] 9.5 Add section button (dashed-border, removeOutline icon) to InlineAddBar type row (main bar only, not sub-item bars)
- [x] 9.6 Wire section button to create a new section at end of program with inline title editing

## 10. Cleanup

- [x] 10.1 Remove YouTube promotion banner template and all associated CSS
- [x] 10.2 Remove unused CSS classes (draft-controls-header, draft-description, program-header, notice-*, inline-icon)

## 11. Verification

- [x] 11.1 Build passes without errors
- [x] 11.2 No references to removed template elements or CSS classes remain
