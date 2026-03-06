## 1. Create ProgramItemForm component

- [x] 1.1 Create `src/components/ProgramItemForm.vue` with props interface: `mode`, `types`, `typeRequired`, `initialData`, `serviceId`, `allResources`, `linkedResources`, `resourceCollections`, `musicKeys`, `musicBeats`, `musicTempos`, `musicStyles`
- [x] 1.2 Add internal form state ref and initialize from `initialData` prop (with watcher for when modal opens with new data)
- [x] 1.3 Build type selection button grid template, driven by `types` prop, with required indicator controlled by `typeRequired`
- [x] 1.4 Build title input with integrated autocomplete (internal `showSuggestions` ref, `getSmartSuggestions` call, select handler that sets resourceId and caches in linkedResources)
- [x] 1.5 Build resource link section: "Lier une ressource" button, inline resource card with collection/media/music display, "Changer"/"Délier" actions, embedded ResourceSelector (modalOnly)
- [x] 1.6 Build scripture section (conditional on type = Lecture biblique / Prédication) with reference input, fetch button, v-html preview with formatScriptureWithSuperscript, version display, clear button
- [x] 1.7 Add participants section (ParticipantSelector component) in main form body
- [x] 1.8 Add duration input (minutes) in main form body
- [x] 1.9 Build "Options avancées" accordion with subtitle, notes, and scripture for non-Lecture/Prédication sub-items
- [x] 1.10 Add submit emit (`submit(formData)`) and cancel emit, with header text and button text driven by `mode` prop
- [x] 1.11 Add component styles (reuse existing form-item, resource-link-section, scripture, accordion patterns)

## 2. Create useProgramItems composable

- [x] 2.1 Create `src/composables/useProgramItems.ts` with function signature taking `program`, `linkedResources`, `resourceCollections`, `user` refs as parameters
- [x] 2.2 Move form modal state: single `showFormModal` ref + `formMode` ref + `formInitialData` ref, replacing the 3 separate modal booleans and 3 form refs
- [x] 2.3 Move modal openers: `openAddItemModal()`, `openEditItemModal(item)`, `openAddSubItemModal(parentId)`, `openEditSubItemModal(parentId, subItem)` — each sets mode, populates initialData, and opens modal
- [x] 2.4 Move submit handlers: `handleFormSubmit(data)` that dispatches to addItem/updateItem/addSubItem/updateSubItem based on `formMode`
- [x] 2.5 Move CRUD functions: `addItem`, `updateItem`, `deleteItem`, `addSubItem`, `updateSubItem`, `deleteSubItem` with consistent scripture null-clearing and participant cleaning
- [x] 2.6 Move reorder handlers: `handleItemReorder`, `handleSubItemReorder`
- [x] 2.7 Move `quickUnlinkResource` function
- [x] 2.8 Move helper functions: `confirmAction`, `showToast`
- [x] 2.9 Return all state and functions needed by ServiceProgramPage template

## 3. Integrate into ServiceProgramPage

- [x] 3.1 Import and use `useProgramItems` composable in ServiceProgramPage, passing required refs
- [x] 3.2 Replace the 3 modal templates (add/edit item ~lines 472-659, add sub-item ~lines 662-881, edit sub-item ~lines 884-1102) with a single `<ProgramItemForm>` modal using composable state
- [x] 3.3 Remove triplicated script code: 3 form refs, 3 modal booleans, 9 title autocomplete functions, 3 title suggestion computeds, 6 scripture functions, 3 resource selector booleans, CRUD functions, reorder functions
- [x] 3.4 Wire template event handlers to composable functions (edit/delete buttons, add sub-item buttons, reorder events, quick-unlink)
- [x] 3.5 Verify type check passes (`vue-tsc --noEmit`)

## 4. Normalize inconsistencies

- [x] 4.1 Ensure all submit paths send `null` for empty scripture fields (not just edit-sub-item)
- [x] 4.2 Default `scriptureVersion` to `'LSG'` in all modes (was `''` for items)
- [x] 4.3 Use `v-html` with `formatScriptureWithSuperscript()` for scripture preview in all modes (was plain text for sub-items)
- [x] 4.4 Show `scriptureVersion` in scripture preview header in all modes (was missing for sub-items)
- [x] 4.5 Apply participant cleaning (strip undefined avatar/role) in all submit paths (was only in item submit)
