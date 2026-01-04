# Program Item Reordering Feature Plan

## Overview
Add drag-and-drop reordering for program items and sub-items in ServiceProgramPage, optimized for mobile touch interactions.

## Current State
- Program items displayed in a flat list with `order` property
- Sub-items nested within parent items with their own `order` property
- Visual drag handle already exists (reorderThreeOutline icon) but not functional
- `updateProgramOrder()` function exists in `src/firebase/programs.ts`
- Edit mode toggle already implemented

## Technical Approach

### Use Ionic Reorder Components
Ionic provides native reorder components that are mobile-optimized:
- `<ion-reorder-group>` - Container for reorderable items
- `<ion-reorder>` - The drag handle element

These components provide:
- Native touch gestures
- Smooth animations
- Haptic feedback on iOS
- Accessibility support

### Alternative Considered
- **vuedraggable/sortablejs**: More flexible but requires additional dependency and CSS tuning for mobile
- **Up/Down buttons**: Less intuitive, more clicks required
- **Recommendation**: Use Ionic's built-in reorder for best mobile UX and consistency

## Implementation Steps

### Step 1: Add Ionic Reorder Components to Template

**File**: `src/views/services/ServiceProgramPage.vue`

```vue
<!-- Wrap items list with ion-reorder-group -->
<ion-reorder-group
  :disabled="!isEditMode"
  @ion-item-reorder="handleItemReorder"
>
  <div v-for="(item, index) in sortedItems" :key="item.id" class="program-item-wrapper">
    <!-- Existing item content -->
    <div class="program-item">
      <!-- Replace visual handle with functional ion-reorder -->
      <ion-reorder v-if="isEditMode" slot="start">
        <ion-icon :icon="reorderThreeOutline" />
      </ion-reorder>
      <!-- ... rest of item content ... -->
    </div>
  </div>
</ion-reorder-group>
```

### Step 2: Implement Reorder Handler for Items

```typescript
const handleItemReorder = async (event: CustomEvent) => {
  const { from, to } = event.detail;

  // Reorder the items array
  const itemsCopy = [...program.value!.items];
  const [movedItem] = itemsCopy.splice(from, 1);
  itemsCopy.splice(to, 0, movedItem);

  // Update order property for all items
  itemsCopy.forEach((item, index) => {
    item.order = index;
  });

  // Optimistic UI update
  program.value!.items = itemsCopy;

  // Complete the reorder animation
  event.detail.complete();

  // Persist to Firebase
  try {
    await updateProgramOrder(
      program.value!.id,
      program.value!.sections,
      itemsCopy,
      user.value!.uid
    );
  } catch (error) {
    console.error('Error saving item order:', error);
    // Reload to revert on error
    await loadProgram();
    showToast('Erreur lors de la réorganisation', 'danger');
  }
};
```

### Step 3: Sub-Item Reordering (Nested Reorder)

When item is expanded, show reorderable sub-items:

```vue
<!-- Sub-items with reorder -->
<div v-if="isItemExpanded(item.id) && hasSubItems(item)" class="sub-items-container">
  <ion-reorder-group
    :disabled="!isEditMode"
    @ion-item-reorder="(e) => handleSubItemReorder(e, item.id)"
  >
    <div v-for="subItem in item.subItems" :key="subItem.id" class="sub-item">
      <ion-reorder v-if="isEditMode">
        <ion-icon :icon="reorderTwoOutline" />
      </ion-reorder>
      <span class="sub-item-title">{{ subItem.title }}</span>
    </div>
  </ion-reorder-group>
</div>
```

### Step 4: Implement Sub-Item Reorder Handler

```typescript
const handleSubItemReorder = async (event: CustomEvent, parentItemId: string) => {
  const { from, to } = event.detail;

  const parentItem = program.value!.items.find(i => i.id === parentItemId);
  if (!parentItem?.subItems) return;

  // Reorder sub-items
  const subItemsCopy = [...parentItem.subItems];
  const [movedSubItem] = subItemsCopy.splice(from, 1);
  subItemsCopy.splice(to, 0, movedSubItem);

  // Update order property
  subItemsCopy.forEach((subItem, index) => {
    subItem.order = index;
  });

  // Update parent item
  parentItem.subItems = subItemsCopy;

  event.detail.complete();

  // Persist to Firebase
  try {
    await updateItemInProgram(
      program.value!.id,
      parentItemId,
      { subItems: subItemsCopy },
      user.value!.uid
    );
  } catch (error) {
    console.error('Error saving sub-item order:', error);
    await loadProgram();
    showToast('Erreur lors de la réorganisation', 'danger');
  }
};
```

### Step 5: Add Required Imports

```typescript
import { IonReorderGroup, IonReorder } from '@ionic/vue';
import { reorderTwoOutline } from 'ionicons/icons';
```

### Step 6: Style Adjustments

```css
/* Drag handle styling */
ion-reorder {
  cursor: grab;
  touch-action: none;
}

ion-reorder:active {
  cursor: grabbing;
}

/* Visual feedback during drag */
.program-item-wrapper.ion-reorder-active {
  background: var(--ion-color-light-shade);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
}

/* Sub-item reorder handle - smaller */
.sub-item ion-reorder ion-icon {
  font-size: 1rem;
  color: var(--ion-color-medium);
}

/* Indent sub-items for visual hierarchy */
.sub-items-container {
  margin-left: 24px;
  border-left: 2px solid var(--ion-color-light-shade);
  padding-left: 12px;
}
```

## Firebase Functions

### Existing Functions (No Changes Needed)
- `updateProgramOrder()` - Updates entire items array with new order
- `updateItemInProgram()` - Updates single item including subItems

### Optional: Add Dedicated Sub-Item Reorder Function
If performance becomes an issue with large programs:

```typescript
export const reorderSubItems = async (
  programId: string,
  itemId: string,
  newSubItemsOrder: ProgramSubItem[],
  userId: string
): Promise<void> => {
  const programRef = doc(db, PROGRAMS_COLLECTION, programId);
  const program = await getDoc(programRef);

  if (!program.exists()) throw new Error('Program not found');

  const items = program.data().items.map((item: ProgramItem) => {
    if (item.id === itemId) {
      return { ...item, subItems: newSubItemsOrder };
    }
    return item;
  });

  await updateDoc(programRef, {
    items,
    updatedAt: serverTimestamp(),
    updatedBy: userId
  });
};
```

## UX Considerations

### Mobile Touch Gestures
1. **Long press NOT required** - Ionic reorder works on immediate touch of handle
2. **Handle size** - Large enough for thumb (min 44x44px touch target)
3. **Visual feedback** - Item elevates/shadows during drag
4. **Haptic feedback** - Automatic on iOS when item is grabbed

### Edit Mode Requirement
- Reordering only available in edit mode
- Prevents accidental reordering during viewing
- Clear visual distinction (handle only visible in edit mode)

### Accessibility
- `aria-label` on reorder handles
- Keyboard support via Ionic's built-in a11y
- Screen reader announces "reorder handle"

## Testing Checklist

### Items Reordering
- [ ] Drag item up in list
- [ ] Drag item down in list
- [ ] Drag item to top of list
- [ ] Drag item to bottom of list
- [ ] Cancel drag (release without moving)
- [ ] Verify order persists after page reload
- [ ] Verify order persists in Firebase

### Sub-Items Reordering
- [ ] Expand item with sub-items
- [ ] Drag sub-item within parent
- [ ] Verify sub-item order persists
- [ ] Collapse and re-expand, verify order maintained

### Edge Cases
- [ ] Single item in list (handle visible but no-op)
- [ ] Reorder while offline (error handling)
- [ ] Rapid reordering (debounce if needed)
- [ ] Section items (should reorder like other items)

### Visual
- [ ] Handle aligned properly
- [ ] Drag shadow/elevation effect
- [ ] Smooth animation
- [ ] No layout shifts during drag

## Implementation Checklist

- [x] **Step 1**: Add IonReorderGroup and IonReorder imports to ServiceProgramPage.vue
- [x] **Step 2**: Wrap program items list with ion-reorder-group
- [x] **Step 3**: Replace visual drag handle with functional ion-reorder component
- [x] **Step 4**: Implement handleItemReorder() function for main items
- [x] **Step 5**: Add ion-reorder-group for sub-items within expanded items
- [x] **Step 6**: Implement handleSubItemReorder() function for sub-items
- [x] **Step 7**: Add CSS styles for drag states and visual feedback
- [x] **Step 8**: Build and test the implementation

---

## Estimated Effort

| Task | Complexity |
|------|------------|
| Add ion-reorder-group to items | Low |
| Implement item reorder handler | Low |
| Add sub-item reordering | Medium |
| Style adjustments | Low |
| Testing | Medium |
| **Total** | **~2-3 hours** |

## Future Enhancements

1. **Move to Section**: Allow dragging item into a different section
2. **Bulk Move**: Select multiple items to move together
3. **Undo/Redo**: Add undo for accidental reorders
4. **Cross-Item Sub-Item Move**: Drag sub-item from one parent to another

## Files to Modify

1. `src/views/services/ServiceProgramPage.vue`
   - Add IonReorderGroup, IonReorder imports
   - Wrap items list with ion-reorder-group
   - Add ion-reorder to item template
   - Add sub-item reorder group
   - Implement handleItemReorder()
   - Implement handleSubItemReorder()
   - Add CSS for drag states

2. `src/firebase/programs.ts` (optional)
   - Add reorderSubItems() if performance needed

## Dependencies

None - Uses Ionic Framework's built-in components already included in the project.
