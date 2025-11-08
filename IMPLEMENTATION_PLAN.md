# ServiceProgramPage Refactoring - Implementation Plan

## Approach

Given the complexity of ServiceProgramPage.vue (3500+ lines), we'll implement the refactoring in focused, incremental steps.

## Step 1: Update Import Statements

Add new Firebase functions for sub-item management:

```typescript
import {
  getProgramByServiceId,
  createProgram,
  updateProgram,
  addItemToProgram,
  updateItemInProgram,
  deleteItemFromProgram,
  updateProgramOrder,
  addSubItemToItem,          // NEW
  updateSubItemInItem,       // NEW
  deleteSubItemFromItem      // NEW
  // Remove section-related imports
} from '@/firebase/programs';
```

## Step 2: Update Reactive State

### Remove Section-Related State
```typescript
// REMOVE these:
const showAddSectionModalState = ref(false);
const newSectionName = ref('');
const insertAfterSectionId = ref<string | null>(null);
const showEditSectionModalState = ref(false);
const editSectionForm = ref({ id: '', title: '' });
const showSectionViewModal = ref(false);
const selectedSection = ref<ProgramSection | null>(null);
const insertionSectionId = ref<string | null>(null);
const addItemSectionId = ref<string | null>(null);
```

### Add Sub-Item State
```typescript
// ADD these:
const showAddSubItemModal = ref(false);
const parentItemIdForSubItem = ref<string | null>(null);
const addSubItemForm = ref({
  title: '',
  resourceId: null as string | null,
  notes: ''
});
const showEditSubItemModal = ref(false);
const editSubItemForm = ref({
  id: '',
  title: '',
  resourceId: null as string | null,
  notes: ''
});
const expandedItems = ref<Set<string>>(new Set()); // Track which items with sub-items are expanded
```

## Step 3: Update Computed Properties

### Remove Section-Related Computed
```typescript
// REMOVE:
const sortedSections = computed(() => { ... });
const getSectionItems = (sectionId: string) => { ... };
const getSectionItemsCount = (sectionId: string) => { ... };
const getSectionDuration = (sectionId: string) => { ... };
```

### Add Flat Item List Computed
```typescript
// ADD:
const sortedItems = computed(() => {
  if (!program.value) return [];
  return [...program.value.items].sort((a, b) => a.order - b.order);
});

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
```

## Step 4: Update Template - Remove Section UI

### Remove from Template
1. Line 84-89: Remove "Ajouter une section" button
2. Line 94-121: Remove section header and section-related structure
3. Line 330-334: Remove bottom "Ajouter une section" button
4. Lines 480-576: Remove Add Section Modal
5. Lines 538-576: Remove Edit Section Modal
6. Line 1042-end: Remove Section View Modal

## Step 5: Update Template - Add Flat Item View

Replace the sections view with:

```vue
<!-- Program Items (Flat List) -->
<div v-if="program && program.items.length > 0" class="program-content">
  <div class="flat-items-view">
    <template v-for="(item, index) in sortedItems" :key="item.id">
      <!-- Insertion indicator before item -->
      <div
        v-if="isDragging && shouldShowInsertionLine(item, index)"
        class="insertion-indicator"
      ></div>

      <div
        class="program-item"
        :class="[
          `item-${item.type.toLowerCase().replace(/\s+/g, '-')}`,
          { 'dragging': draggedItemId === item.id },
          { 'has-subitems': hasSubItems(item) },
          { 'expanded': isItemExpanded(item.id) }
        ]"
        :data-item-id="item.id"
      >
        <div class="item-layout">
          <!-- Drag Handle (Edit Mode) -->
          <div v-if="isEditMode" class="item-column item-handle-column">
            <div class="drag-handle" @mousedown="startDrag($event, item)" @touchstart="startDrag($event, item)">
              <ion-icon :icon="reorderThreeOutline" />
            </div>
          </div>

          <!-- Order Number -->
          <div class="item-column item-order-column">
            <div class="item-order">{{ item.order }}</div>
          </div>

          <!-- Details -->
          <div class="item-column item-details-column">
            <div class="item-type">
              <ion-icon :icon="getItemIcon(item.type)" />
              {{ item.type }}
            </div>
            <h4 class="item-title">
              {{ item.resourceId && getLinkedResource(item.resourceId) ? getLinkedResource(item.resourceId)?.title : item.title }}
            </h4>
            <p v-if="item.subtitle" class="item-subtitle">{{ item.subtitle }}</p>

            <!-- Notes -->
            <div v-if="item.notes" class="item-notes">
              <ion-icon :icon="documentTextOutline" />
              {{ item.notes }}
            </div>

            <!-- Resource Links -->
            <div v-if="item.resourceId && getLinkedResource(item.resourceId)" class="item-resources">
              <div class="media-buttons">
                <button
                  v-for="content in getLinkedResource(item.resourceId)?.contents"
                  :key="content.type"
                  @click="showMediaContent(content, getLinkedResource(item.resourceId)?.title)"
                  class="media-chip-button"
                >
                  <ion-icon :icon="getMediaTypeIcon(content.type)" />
                  <span>{{ formatMediaType(content.type) }}</span>
                </button>
              </div>
            </div>

            <!-- Expand/Collapse Button for Sub-Items -->
            <div v-if="hasSubItems(item)" class="subitem-toggle">
              <ion-button
                @click="toggleItemExpansion(item.id)"
                fill="clear"
                size="small"
              >
                <ion-icon
                  :icon="isItemExpanded(item.id) ? chevronDownOutline : chevronForwardOutline"
                  slot="start"
                />
                {{ item.subItems!.length }} {{ item.subItems!.length > 1 ? 'éléments' : 'élément' }}
              </ion-button>
            </div>
          </div>

          <!-- Duration and Participant -->
          <div class="item-column item-meta-column">
            <div v-if="item.duration" class="item-duration">
              <ion-icon :icon="timeOutline" />
              {{ item.duration }}min
            </div>
            <div v-if="item.participant" class="item-participant">
              <ion-icon :icon="personOutline" />
              {{ item.participant.name }}
              <span v-if="item.participant.role" class="participant-role">({{ item.participant.role }})</span>
            </div>
          </div>

          <!-- Edit/Delete Actions (Edit Mode) -->
          <div v-if="isEditMode" class="item-column item-actions-column">
            <div class="item-actions">
              <ion-button @click="showAddSubItemModalForItem(item.id)" fill="clear" size="small" color="success">
                <ion-icon :icon="addOutline" slot="icon-only" />
              </ion-button>
              <ion-button @click="showEditItemModal(item)" fill="clear" size="small" color="primary">
                <ion-icon :icon="createOutline" slot="icon-only" />
              </ion-button>
              <ion-button @click="deleteItem(item.id)" fill="clear" size="small" color="danger">
                <ion-icon :icon="trashOutline" slot="icon-only" />
              </ion-button>
            </div>
          </div>
        </div>

        <!-- Sub-Items (Expanded) -->
        <div v-if="hasSubItems(item) && isItemExpanded(item.id)" class="sub-items-container">
          <div
            v-for="(subItem, subIndex) in item.subItems"
            :key="subItem.id"
            class="sub-item"
          >
            <div class="sub-item-layout">
              <div class="sub-item-bullet">•</div>
              <div class="sub-item-content">
                <span class="sub-item-title">
                  {{ subItem.resourceId && getLinkedResource(subItem.resourceId) ? getLinkedResource(subItem.resourceId)?.title : subItem.title }}
                </span>
                <span v-if="subItem.notes" class="sub-item-notes">{{ subItem.notes }}</span>

                <!-- Resource Links for Sub-Item -->
                <div v-if="subItem.resourceId && getLinkedResource(subItem.resourceId)" class="sub-item-resources">
                  <button
                    v-for="content in getLinkedResource(subItem.resourceId)?.contents"
                    :key="content.type"
                    @click="showMediaContent(content, getLinkedResource(subItem.resourceId)?.title)"
                    class="media-chip-button small"
                  >
                    <ion-icon :icon="getMediaTypeIcon(content.type)" />
                  </button>
                </div>
              </div>

              <!-- Sub-Item Actions (Edit Mode) -->
              <div v-if="isEditMode" class="sub-item-actions">
                <ion-button @click="showEditSubItemModalForItem(item.id, subItem)" fill="clear" size="small" color="primary">
                  <ion-icon :icon="createOutline" slot="icon-only" />
                </ion-button>
                <ion-button @click="deleteSubItem(item.id, subItem.id)" fill="clear" size="small" color="danger">
                  <ion-icon :icon="trashOutline" slot="icon-only" />
                </ion-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</div>
```

## Step 6: Add Sub-Item Modals

```vue
<!-- Add Sub-Item Modal -->
<ion-modal :is-open="showAddSubItemModal" @ionModalDidDismiss="closeAddSubItemModal">
  <ion-header>
    <ion-toolbar>
      <ion-title>Ajouter un sous-élément</ion-title>
      <ion-buttons slot="end">
        <ion-button @click="closeAddSubItemModal">
          <ion-icon :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
  <ion-content class="ion-padding">
    <ion-item>
      <ion-label position="stacked">Titre</ion-label>
      <ion-input v-model="addSubItemForm.title" placeholder="Ex: Kache mwen anba zel ou"></ion-input>
    </ion-item>

    <ion-item>
      <ion-label position="stacked">Lier à une ressource (optionnel)</ion-label>
      <ResourceSelector
        v-model="addSubItemForm.resourceId"
        resource-type="song"
      />
    </ion-item>

    <ion-item>
      <ion-label position="stacked">Notes (optionnel)</ion-label>
      <ion-textarea v-model="addSubItemForm.notes" rows="3"></ion-textarea>
    </ion-item>

    <ion-button
      @click="addSubItem"
      expand="block"
      class="ion-margin-top"
      :disabled="!addSubItemForm.title"
    >
      Ajouter
    </ion-button>
  </ion-content>
</ion-modal>

<!-- Edit Sub-Item Modal -->
<ion-modal :is-open="showEditSubItemModal" @ionModalDidDismiss="closeEditSubItemModal">
  <ion-header>
    <ion-toolbar>
      <ion-title>Modifier le sous-élément</ion-title>
      <ion-buttons slot="end">
        <ion-button @click="closeEditSubItemModal">
          <ion-icon :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
  <ion-content class="ion-padding">
    <ion-item>
      <ion-label position="stacked">Titre</ion-label>
      <ion-input v-model="editSubItemForm.title"></ion-input>
    </ion-item>

    <ion-item>
      <ion-label position="stacked">Lier à une ressource (optionnel)</ion-label>
      <ResourceSelector
        v-model="editSubItemForm.resourceId"
        resource-type="song"
      />
    </ion-item>

    <ion-item>
      <ion-label position="stacked">Notes (optionnel)</ion-label>
      <ion-textarea v-model="editSubItemForm.notes" rows="3"></ion-textarea>
    </ion-item>

    <ion-button
      @click="updateSubItem"
      expand="block"
      class="ion-margin-top"
      :disabled="!editSubItemForm.title"
    >
      Mettre à jour
    </ion-button>
  </ion-content>
</ion-modal>
```

## Step 7: Add Sub-Item Functions

```typescript
// Show Add Sub-Item Modal
const showAddSubItemModalForItem = (itemId: string) => {
  parentItemIdForSubItem.value = itemId;
  addSubItemForm.value = {
    title: '',
    resourceId: null,
    notes: ''
  };
  showAddSubItemModal.value = true;
};

// Close Add Sub-Item Modal
const closeAddSubItemModal = () => {
  showAddSubItemModal.value = false;
  parentItemIdForSubItem.value = null;
};

// Add Sub-Item
const addSubItem = async () => {
  if (!program.value || !parentItemIdForSubItem.value || !user.value) return;

  try {
    loading.value = true;

    await addSubItemToItem(
      program.value.id,
      parentItemIdForSubItem.value,
      {
        title: addSubItemForm.value.title,
        resourceId: addSubItemForm.value.resourceId || undefined,
        notes: addSubItemForm.value.notes || undefined,
        order: 0 // Will be calculated
      },
      user.value.uid
    );

    // Reload program
    await loadProgram();

    // Auto-expand the parent item
    expandedItems.value.add(parentItemIdForSubItem.value);

    closeAddSubItemModal();

    await showToast('Sous-élément ajouté avec succès', 'success');
  } catch (error) {
    console.error('Error adding sub-item:', error);
    await showToast('Erreur lors de l\'ajout du sous-élément', 'danger');
  } finally {
    loading.value = false;
  }
};

// Show Edit Sub-Item Modal
const showEditSubItemModalForItem = (itemId: string, subItem: ProgramSubItem) => {
  parentItemIdForSubItem.value = itemId;
  editSubItemForm.value = {
    id: subItem.id,
    title: subItem.title,
    resourceId: subItem.resourceId || null,
    notes: subItem.notes || ''
  };
  showEditSubItemModal.value = true;
};

// Close Edit Sub-Item Modal
const closeEditSubItemModal = () => {
  showEditSubItemModal.value = false;
  parentItemIdForSubItem.value = null;
};

// Update Sub-Item
const updateSubItem = async () => {
  if (!program.value || !parentItemIdForSubItem.value || !user.value) return;

  try {
    loading.value = true;

    await updateSubItemInItem(
      program.value.id,
      parentItemIdForSubItem.value,
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
    await showToast('Erreur lors de la mise à jour', 'danger');
  } finally {
    loading.value = false;
  }
};

// Delete Sub-Item
const deleteSubItem = async (itemId: string, subItemId: string) => {
  if (!program.value || !user.value) return;

  const confirmed = await confirmAction('Supprimer ce sous-élément ?');
  if (!confirmed) return;

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
    await showToast('Erreur lors de la suppression', 'danger');
  } finally {
    loading.value = false;
  }
};
```

## Step 8: Update Add Item Modal

Remove section selection, add "Has Sub-Items" toggle:

```vue
<ion-item>
  <ion-label>A des sous-éléments</ion-label>
  <ion-toggle v-model="addItemForm.hasSubItems"></ion-toggle>
</ion-item>

<div v-if="addItemForm.hasSubItems" class="sub-items-section">
  <h4>Sous-éléments</h4>
  <!-- List of sub-items added -->
  <!-- Add sub-item button -->
</div>
```

## Step 9: Update Styles

Add styles for sub-items:

```css
.sub-items-container {
  margin-left: 3rem;
  margin-top: 0.5rem;
  border-left: 2px solid var(--ion-color-light-shade);
  padding-left: 1rem;
}

.sub-item {
  margin-bottom: 0.5rem;
}

.sub-item-layout {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.sub-item-bullet {
  font-size: 1.2rem;
  color: var(--ion-color-medium);
  margin-top: 0.2rem;
}

.sub-item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.sub-item-title {
  font-size: 0.95rem;
  color: var(--ion-color-dark);
}

.sub-item-notes {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  font-style: italic;
}

.sub-item-actions {
  display: flex;
  gap: 0.25rem;
}

.program-item.has-subitems {
  border-left: 3px solid var(--ion-color-primary);
}

.program-item.expanded {
  background-color: var(--ion-color-light);
}

.subitem-toggle {
  margin-top: 0.5rem;
}
```

## Implementation Order

1. ✅ Update types (completed)
2. ✅ Update Firebase functions (completed)
3. Update import statements
4. Add new reactive state
5. Remove section-related state and computed
6. Add flat list computed properties
7. Update template - remove section UI
8. Update template - add flat item view
9. Add sub-item modals
10. Add sub-item functions
11. Update styles
12. Test thoroughly

## Testing Checklist

- [ ] Create new program with flat structure
- [ ] Add items to program
- [ ] Add sub-items to items
- [ ] Edit sub-items
- [ ] Delete sub-items
- [ ] Reorder items (drag/drop)
- [ ] Expand/collapse items with sub-items
- [ ] Link resources to sub-items
- [ ] View media from sub-items
- [ ] Backward compatibility with old section-based programs
