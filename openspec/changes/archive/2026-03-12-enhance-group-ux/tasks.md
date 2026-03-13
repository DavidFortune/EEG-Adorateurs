## 1. Add Item to Group

- [x] 1.1 Add `quickAddItemToGroup(groupId: string)` to `useProgramItems` composable — calculates order after last group child, creates item with `groupId`, returns item ID
- [x] 1.2 Add `quickAddItemToGroup` to the destructured return in `ServiceProgramPage.vue`
- [x] 1.3 Add add-button (`addOutline` icon) to group header actions area (before delete button, edit mode only)
- [x] 1.4 Wire button handler: call `quickAddItemToGroup`, expand group if collapsed, activate inline title edit on new item

## 2. Group Content Modal

- [x] 2.1 Add computed helper `getGroupChildren(groupId)` returning sorted child items for a group
- [x] 2.2 Add `groupHasContent(groupId)` helper — returns true if any child has lyrics (via linked resource), scripture, or notes
- [x] 2.3 Add content-view button (`readerOutline` icon) to group header actions, visible when `groupHasContent` is true
- [x] 2.4 Add group content modal template: scrollable list with numbered child items showing lyrics, scripture (reference + version + text), and notes
- [x] 2.5 Add modal state (`groupContentModalOpen`, `groupContentModalId`) and open/close handlers
- [x] 2.6 Add CSS for modal content (numbered items, scripture tinted block with left border, pre-formatted lyrics, muted notes)

## 3. Verify

- [x] 3.1 Build compiles with no errors (`npx vue-tsc --noEmit`)
- [ ] 3.2 Add-to-group button creates item inside group with correct order and groupId
- [ ] 3.3 Group content modal displays lyrics, scripture, and notes from child items correctly
- [ ] 3.4 Content button hidden when group has no content-bearing children
