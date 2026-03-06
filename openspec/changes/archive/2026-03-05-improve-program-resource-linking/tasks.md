## 1. Restructure Add/Edit Item Modal

- [x] 1.1 Move ResourceSelector out of the title field's `slot="end"` and into its own dedicated section below the title field, with a full-width "Lier une ressource" outline button when no resource is linked
- [x] 1.2 When a resource is linked (`itemForm.resourceId`), display an inline resource card showing: title, collection badge, media type icons (Paroles, YouTube, Audio, etc.), music properties if set, "Changer" button, and "Délier" (X) button
- [x] 1.3 Wire the "Délier" button to clear `itemForm.resourceId` and the "Changer" button to open the ResourceSelector
- [x] 1.4 Group secondary fields (subtitle, participants, duration, notes) under a collapsible `ion-accordion` labeled "Options avancées", collapsed by default

## 2. Restructure Sub-Item Modals

- [x] 2.1 In the Add Sub-Item modal, replace the `ion-item` + `ResourceSelector` pattern with the same dedicated resource section (button + inline card) as the parent item modal
- [x] 2.2 In the Edit Sub-Item modal, apply the same dedicated resource section pattern with inline card, "Changer", and "Délier" actions

## 3. Quick Unlink from Program View

- [x] 3.1 In edit mode, add an unlink icon button (close-circle) on program item cards that have a linked resource, positioned near the resource info section
- [x] 3.2 Wire the unlink button to call `updateItemInProgram` with `{ resourceId: null }` and show a confirmation toast

## 4. Verification

- [x] 4.1 Verify linking a resource from the new dedicated section works correctly *(manual)*
- [x] 4.2 Verify the inline resource card displays correct info (title, collection, media types, music props) *(manual)*
- [x] 4.3 Verify unlinking from the modal and from the program view both work *(manual)*
- [x] 4.4 Verify "Options avancées" accordion collapses/expands and all fields still save correctly *(manual)*
- [x] 4.5 Verify sub-item resource linking uses the new pattern *(manual)*
- [x] 4.6 Verify title suggestions + auto-link still work after the layout change *(manual)*
