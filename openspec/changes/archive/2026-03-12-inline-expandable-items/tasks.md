## 1. Expand/Collapse State Management

- [x] 1.1 Add `expandedEditItemIds` reactive Set and toggle helpers in ServiceProgramPage.vue
- [x] 1.2 Add mobile single-expand behavior (auto-collapse others on screens < 768px)
- [x] 1.3 Auto-collapse all expanded items when reorder drag starts (`ionItemReorder`)

## 2. Expanded Item Card Template

- [x] 2.1 Create expanded card layout inside each `ion-item`: title input, subtitle input, participants selector, duration stepper, resource link card, notes textarea, add sub-item button, delete button
- [x] 2.2 Add tucked scripture sub-section (collapsible toggle with reference input, fetch button, text preview)
- [x] 2.3 Add tucked type change sub-section (collapsible toggle showing type grid buttons)
- [x] 2.4 Wire all expanded fields to existing `inlineUpdateField` / save-on-blur handlers

## 3. Collapsed Item Row Update

- [x] 3.1 Replace expand chevron: add `▼/▲` toggle at `slot="end"` that triggers expand/collapse
- [x] 3.2 Keep existing collapsed-state inline editing (title click, participant/duration chip popovers)

## 4. Inter-Item Add Zone

- [x] 4.1 Add subtle "+" drop zone div between each `ion-item` in the reorder group
- [x] 4.2 On tap, expand to show "Element" and "Section" buttons
- [x] 4.3 Wire "Element" to insert a new item at that position (reuse InlineAddBar pattern)
- [x] 4.4 Wire "Section" to insert a section divider at that position with order adjustment

## 5. Sub-Item Expand/Collapse

- [x] 5.1 Apply same expand/collapse pattern to sub-items within expanded parent items
- [x] 5.2 Wire sub-item expanded fields to `inlineUpdateSubItemField` handlers

## 6. Remove Old Editing UI

- [x] 6.1 Remove 3-dot action menu button and `openItemActionPopover` / `openSubItemActionPopover` logic
- [x] 6.2 Remove `ItemDetailSheet.vue` component and all references (import, template, handlers)
- [x] 6.3 Clean up unused state: `actionPopoverOpen`, `actionPopoverItem`, `detailSheetOpen`, `detailSheetItem`, related handlers

## 7. Desktop Layout

- [x] 7.1 Add CSS grid 2-column layout for expanded cards on screens >= 768px
- [x] 7.2 Verify collapsed/expanded states render correctly on both mobile and desktop

## 8. Verify

- [x] 8.1 Build compiles with no errors
- [x] 8.2 All item fields editable via expanded card (title, subtitle, type, participants, duration, resource, scripture, notes)
- [x] 8.3 Add zone inserts items and sections at correct positions
- [x] 8.4 Delete works from expanded card
- [x] 8.5 Sub-items expand/collapse and edit correctly
- [x] 8.6 Reorder auto-collapses expanded items
