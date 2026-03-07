## 1. ResourceFormPage - Add loading guard to save button

- [x] 1.1 In `src/views/resources/ResourceFormPage.vue`, update the save button's `:disabled` binding from `!isFormValid` to `!isFormValid || loading` to prevent double-click submissions

## 2. ResourceBottomSheet - Add loading guard to create button

- [x] 2.1 In `src/components/ResourceBottomSheet.vue`, update the "Creer et lier" button's `:disabled` binding from `!newResourceTitle.trim()` to `!newResourceTitle.trim() || loading` to prevent double-click submissions

## 3. Verify existing guards

- [x] 3.1 Verify `ResourceSelector.vue` create button already has `creatingResource` in its `:disabled` binding (confirmed: line 360)
- [x] 3.2 Verify `NaturalResourceSelector.vue` create button already has `creating` in its `:disabled` binding (confirmed: line 147)
