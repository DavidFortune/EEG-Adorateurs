# UI Changes Needed for ServiceProgramPage.vue

## Status

✅ **Completed**:
- Updated import statements (removed section functions, added sub-item functions)
- Added chevron icons for expand/collapse
- Added sub-item reactive state
- Updated getItemIcon to support new item types
- Commented out section-related state

❌ **Remaining** (Too many errors to fix incrementally):
The file has 3523 lines with many interdependent section-related functions.

## Recommendation

Given the complexity, I recommend one of these approaches:

### Option 1: Feature Flag Approach (SAFEST - Recommended)
Keep the existing section-based UI and add the new flat UI side-by-side with a feature flag.

**Steps**:
1. Add feature flag: `const useFlatStructure = ref(true)`
2. In template, use `v-if="!useFlatStructure"` for old section UI
3. Add `v-else` for new flat UI
4. Test both modes
5. Remove old code when confident

### Option 2: Clean Component Rewrite (FASTER)
Create a new component `ServiceProgramPageFlat.vue` from scratch

**Benefits**:
- Clean slate, no legacy code
- Easier to understand and maintain
- Can reference old component
- Easy to switch routes

**Estimated time**: 1-2 days vs 3-4 days modifying existing

### Option 3: Major Refactoring (RISKY)
Continue modifying the existing file, but it requires:
- Removing/commenting ~40 section-related functions
- Updating ~200 template lines
- Fixing ~50+ TypeScript errors
- Testing every change

## Key Functions To Remove/Comment

```typescript
// Lines ~1397-1530: Section Management Functions
- showAddSectionModal()
- closeAddSectionModal()
- addSection()
- showEditSectionModal()
- closeEditSectionModal()
- updateSection()
- showSectionView()
- closeSectionViewModal()
- deleteSection()
- canDeleteSection()
- getSectionItems()
- getSectionItemsCount()
- getSectionDuration()
```

## Key Template Sections To Remove

```vue
<!-- Lines 84-89: Add Section Button (top) -->
<!-- Lines 94-121: Section Header Structure -->
<!-- Lines 330-334: Add Section Button (bottom) -->
<!-- Lines 480-537: Add Section Modal -->
<!-- Lines 538-576: Edit Section Modal -->
<!-- Lines 578-650: Section View Modal -->
```

## New Functions To Add

```typescript
// Sub-Item Management
const hasSubItems = (item: ProgramItem): boolean => {
  return !!(item.subItems && item.subItems.length > 0);
};

const isItemExpanded = (itemId: string): boolean => {
  return expandedItems.value.has(itemId);
};

const toggleItemExpansion = (itemId: string) => {
  if (expandedItems.value.has(itemId)) {
    expandedItems.value.delete(itemId);
  } else {
    expandedItems.value.add(itemId);
  }
};

const showAddSubItemModalForItem = (itemId: string) => {
  parentItemIdForSubItem.value = itemId;
  addSubItemForm.value = { title: '', resourceId: null, notes: '' };
  showAddSubItemModal.value = true;
};

const closeAddSubItemModal = () => {
  showAddSubItemModal.value = false;
  parentItemIdForSubItem.value = null;
};

const addSubItem = async () => {
  if (!program.value || !parentItemIdForSubItem.value || !user.value) return;

  try {
    loading.value = true;

    const parentItem = program.value.items.find(i => i.id === parentItemIdForSubItem.value);
    const currentSubItems = parentItem?.subItems || [];

    await addSubItemToItem(
      program.value.id,
      parentItemIdForSubItem.value,
      {
        title: addSubItemForm.value.title,
        resourceId: addSubItemForm.value.resourceId || undefined,
        notes: addSubItemForm.value.notes || undefined,
        order: currentSubItems.length
      },
      user.value.uid
    );

    await loadProgram();
    expandedItems.value.add(parentItemIdForSubItem.value);
    closeAddSubItemModal();

    await showToast('Sous-élément ajouté', 'success');
  } catch (error) {
    console.error('Error adding sub-item:', error);
    await showToast('Erreur lors de l\'ajout', 'danger');
  } finally {
    loading.value = false;
  }
};

const showEditSubItemModalForItem = (itemId: string, subItem: ProgramSubItem) => {
  parentItemIdForSubItem.value = itemId;
  editSubItemForm.value = {
    id: subItem.id,
    parentItemId: itemId,
    title: subItem.title,
    resourceId: subItem.resourceId || null,
    notes: subItem.notes || ''
  };
  showEditSubItemModal.value = true;
};

const closeEditSubItemModal = () => {
  showEditSubItemModal.value = false;
  parentItemIdForSubItem.value = null;
};

const updateSubItem = async () => {
  if (!program.value || !editSubItemForm.value.parentItemId || !user.value) return;

  try {
    loading.value = true;

    await updateSubItemInItem(
      program.value.id,
      editSubItemForm.value.parentItemId,
      editSubItemForm.value.id,
      {
        title: editSubItemForm.value.title,
        resourceId: editSubItemForm.value.resourceId || undefined,
        notes: editSubItemForm.value.notes || undefined
      },
      user.value.uid
    );

    await loadProgram();
    closeEditSubItemModal();

    await showToast('Sous-élément mis à jour', 'success');
  } catch (error) {
    console.error('Error updating sub-item:', error);
    await showToast('Erreur', 'danger');
  } finally {
    loading.value = false;
  }
};

const deleteSubItem = async (itemId: string, subItemId: string) => {
  if (!program.value || !user.value) return;

  // Add confirmation dialog here

  try {
    loading.value = true;

    await deleteSubItemFromItem(
      program.value.id,
      itemId,
      subItemId,
      user.value.uid
    );

    await loadProgram();
    await showToast('Sous-élément supprimé', 'success');
  } catch (error) {
    console.error('Error deleting sub-item:', error);
    await showToast('Erreur', 'danger');
  } finally {
    loading.value = false;
  }
};
```

## My Recommendation

**Create `ServiceProgramPageFlat.vue`** - A clean, new component

**Reasons**:
1. The existing file is too complex (3523 lines)
2. Section logic is deeply integrated
3. Cleaner code, easier to maintain
4. Can keep old component as fallback
5. Faster development (1-2 days vs 3-4 days)
6. Less risk of breaking existing functionality

**Steps**:
1. Copy the backup file as starting point
2. Strip out all section-related code
3. Implement flat structure from scratch
4. Test thoroughly
5. Update route to use new component
6. Delete old component after confidence period

Would you like me to create the new `ServiceProgramPageFlat.vue` component?
