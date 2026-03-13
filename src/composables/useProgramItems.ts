import { ref, type Ref } from 'vue';
import { toastController, alertController } from '@ionic/vue';
import type { ServiceProgram, ProgramParticipant, ProgramItem } from '@/types/program';
import {
  addItemToProgram,
  updateItemInProgram,
  deleteItemFromProgram,
  createGroupItem,
  createSectionItem,
  updateProgramOrder
} from '@/firebase/programs';
import { deleteField } from 'firebase/firestore';

interface UseProgramItemsParams {
  program: Ref<ServiceProgram | null>;
  user: Ref<{ uid: string } | null>;
  expandedItems: Ref<Set<string>>;
  loading: Ref<boolean>;
  loadProgram: () => Promise<void>;
}

export function useProgramItems(params: UseProgramItemsParams) {
  const { program, user, expandedItems, loading, loadProgram } = params;

  // Toast helper
  const showToast = async (message: string, color: 'success' | 'danger' | 'warning' = 'success') => {
    const toast = await toastController.create({ message, duration: 3000, color, position: 'bottom' });
    await toast.present();
  };

  // Confirm helper
  const confirmAction = async (message: string): Promise<boolean> => {
    const alert = await alertController.create({
      header: 'Confirmation',
      message,
      buttons: [
        { text: 'Annuler', role: 'cancel', handler: () => { alert.dismiss(false); } },
        { text: 'Confirmer', handler: () => { alert.dismiss(true); } }
      ]
    });
    await alert.present();
    const { data } = await alert.onDidDismiss();
    return data === true;
  };

  // Clean participants - strip undefined avatar/role
  const cleanParticipants = (participants: ProgramParticipant[]): ProgramParticipant[] => {
    return participants.map(p => {
      const cleaned: ProgramParticipant = { id: p.id, name: p.name, isCustom: p.isCustom };
      if (p.avatar) cleaned.avatar = p.avatar;
      if (p.role) cleaned.role = p.role;
      return cleaned;
    });
  };

  // --- CRUD ---

  const deleteItem = async (itemId: string) => {
    if (!program.value || !user.value) return;
    const item = program.value.items.find(i => i.id === itemId);
    const message = item?.isGroup
      ? 'Supprimer ce groupe ? Les éléments du groupe seront conservés.'
      : 'Supprimer cet élément du programme ?';
    const confirmed = await confirmAction(message);
    if (!confirmed) return;
    try {
      loading.value = true;
      await deleteItemFromProgram(program.value.id, itemId, user.value.uid);
      await showToast(item?.isGroup ? 'Groupe supprimé' : 'Élément supprimé', 'success');
    } catch (error) {
      console.error('Error deleting item:', error);
      await showToast('Erreur lors de la suppression', 'danger');
    } finally {
      loading.value = false;
    }
  };

  // --- Group Operations ---

  const createGroup = async (title: string, order: number): Promise<string | null> => {
    if (!program.value || !user.value) return null;
    try {
      loading.value = true;
      const created = await createGroupItem(program.value.id, title, order, user.value.uid);
      return created.id;
    } catch (error) {
      console.error('Error creating group:', error);
      await showToast('Erreur lors de la création du groupe', 'danger');
      return null;
    } finally {
      loading.value = false;
    }
  };

  // --- Section Operations ---

  const createSection = async (title: string, order: number): Promise<string | null> => {
    if (!program.value || !user.value) return null;
    try {
      loading.value = true;
      const created = await createSectionItem(program.value.id, title, order, user.value.uid);
      return created.id;
    } catch (error) {
      console.error('Error creating section:', error);
      await showToast('Erreur lors de la création de la section', 'danger');
      return null;
    } finally {
      loading.value = false;
    }
  };

  // --- Add Item to Group ---

  const quickAddItemToGroup = async (groupId: string): Promise<string | null> => {
    if (!program.value || !user.value) return null;
    try {
      // Find the last child of this group by order, or the group header itself
      const sorted = [...program.value.items].sort((a, b) => a.order - b.order);
      const groupHeader = sorted.find(i => i.id === groupId);
      if (!groupHeader) return null;

      const children = sorted.filter(i => i.groupId === groupId);
      const lastChild = children.length > 0 ? children[children.length - 1] : groupHeader;
      const insertOrder = lastChild.order + 1;

      // Create new item
      const newItem: ProgramItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        order: insertOrder,
        title: 'Nouvel élément',
        duration: 5,
        groupId
      };

      // Build full items array: bump orders at/after insert position, add new item
      const allItems = program.value.items.map(item => ({
        ...item,
        order: item.order >= insertOrder ? item.order + 1 : item.order
      }));
      allItems.push(newItem);

      // Single atomic write with all items
      await updateProgramOrder(program.value.id, allItems, user.value.uid);
      await showToast('Élément ajouté au groupe', 'success');

      return newItem.id;
    } catch (error) {
      console.error('Error adding item to group:', error);
      await showToast('Erreur lors de l\'ajout dans le groupe', 'danger');
      return null;
    }
  };

  // --- Reorder Handlers ---

  const handleItemReorder = async (event: CustomEvent) => {
    if (!program.value || !user.value) {
      event.detail.complete();
      return;
    }
    const { from, to } = event.detail;
    if (from === to) {
      event.detail.complete();
      return;
    }
    const itemsCopy = [...program.value.items];
    const movedItem = itemsCopy[from];

    // If moving a group header, collect its children too
    if (movedItem.isGroup) {
      const groupId = movedItem.id;
      // Find all children indices
      const childIndices = itemsCopy
        .map((item, idx) => item.groupId === groupId ? idx : -1)
        .filter(idx => idx !== -1);

      // Remove group + children (in reverse to keep indices stable)
      const allIndices = [from, ...childIndices].sort((a, b) => b - a);
      const removedItems: ProgramItem[] = [];
      for (const idx of allIndices) {
        removedItems.unshift(itemsCopy.splice(idx, 1)[0]);
      }

      // Insert at new position (adjust for removed items before target)
      const adjustedTo = to > from ? to - removedItems.length + 1 : to;
      itemsCopy.splice(adjustedTo, 0, ...removedItems);
    } else {
      const [removed] = itemsCopy.splice(from, 1);
      itemsCopy.splice(to, 0, removed);

      // Assign/remove groupId based on drop position
      const prevItem = to > 0 ? itemsCopy[to - 1] : null;
      if (prevItem?.isGroup) {
        removed.groupId = prevItem.id;
      } else if (prevItem?.groupId) {
        removed.groupId = prevItem.groupId;
      } else {
        delete removed.groupId;
      }
    }

    itemsCopy.forEach((item, index) => { item.order = index; });
    program.value.items = itemsCopy;
    event.detail.complete();
    try {
      await updateProgramOrder(program.value.id, itemsCopy, user.value.uid);
    } catch (error) {
      console.error('Error saving item order:', error);
      await loadProgram();
      await showToast('Erreur lors de la réorganisation', 'danger');
    }
  };

  // --- Inline Editing ---

  const editingTitleItemId = ref<string | null>(null);
  const editingTitleInitialValue = ref('');
  const editingTitleValue = ref('');

  const startInlineTitleEdit = (itemId: string) => {
    const item = program.value?.items.find(i => i.id === itemId);
    const title = item?.title || '';
    editingTitleInitialValue.value = title;
    editingTitleValue.value = title;
    editingTitleItemId.value = itemId;
  };

  const cancelInlineTitleEdit = () => {
    editingTitleItemId.value = null;
  };

  const updateEditingTitleValue = (value: string) => {
    editingTitleValue.value = value;
  };

  const commitTitleEdit = async (itemId: string) => {
    // Ignore stale blur events from a previous edit
    if (editingTitleItemId.value !== itemId) return;
    const newTitle = editingTitleValue.value;
    editingTitleItemId.value = null;
    if (!program.value || !user.value || !newTitle.trim()) return;
    try {
      await updateItemInProgram(program.value.id, itemId, { title: newTitle.trim() }, user.value.uid);
    } catch (error) {
      console.error('Error updating title:', error);
      await showToast('Erreur lors de la mise à jour du titre', 'danger');
    }
  };

  const inlineUpdateDuration = async (itemId: string, newDuration: number) => {
    if (!program.value || !user.value) return;
    try {
      await updateItemInProgram(program.value.id, itemId, { duration: newDuration }, user.value.uid);
    } catch (error) {
      console.error('Error updating duration:', error);
      await showToast('Erreur lors de la mise à jour de la durée', 'danger');
    }
  };

  const inlineUpdateParticipants = async (itemId: string, participants: ProgramParticipant[]) => {
    if (!program.value || !user.value) return;
    try {
      await updateItemInProgram(
        program.value.id, itemId,
        { participants: cleanParticipants(participants) },
        user.value.uid
      );
    } catch (error) {
      console.error('Error updating participants:', error);
      await showToast('Erreur lors de la mise à jour des participants', 'danger');
    }
  };

  // --- Quick Add (Inline) ---

  const quickAddItem = async (title: string, resourceId?: string): Promise<string | null> => {
    if (!program.value || !user.value || !title.trim()) return null;
    try {
      const newItem: any = {
        order: program.value.items.length,
        title: title.trim(),
        duration: 5
      };
      if (resourceId) newItem.resourceId = resourceId;
      const created = await addItemToProgram(program.value.id, newItem, user.value.uid);
      return created.id;
    } catch (error) {
      console.error('Error quick-adding item:', error);
      await showToast('Erreur lors de l\'ajout de l\'élément', 'danger');
      return null;
    }
  };

  // --- Inline Field Updates ---

  const inlineUpdateField = async (itemId: string, field: string, value: any) => {
    if (!program.value || !user.value) return;
    try {
      await updateItemInProgram(program.value.id, itemId, { [field]: value }, user.value.uid);
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      await showToast('Erreur lors de la mise à jour', 'danger');
    }
  };

  // --- Quick Actions ---

  const quickUnlinkResource = async (itemId: string) => {
    if (!program.value || !user.value) return;
    try {
      await updateItemInProgram(
        program.value.id, itemId, { resourceId: deleteField() as unknown as string }, user.value.uid
      );
      await showToast('Ressource déliée', 'success');
    } catch (error) {
      console.error('Error unlinking resource:', error);
      await showToast('Erreur lors de la suppression du lien', 'danger');
    }
  };

  return {
    // CRUD
    deleteItem,
    // Groups
    createGroup,
    // Sections
    createSection,
    // Add to group
    quickAddItemToGroup,
    // Reorder
    handleItemReorder,
    // Inline editing
    editingTitleItemId,
    editingTitleInitialValue,
    editingTitleValue,
    startInlineTitleEdit,
    cancelInlineTitleEdit,
    updateEditingTitleValue,
    commitTitleEdit,
    inlineUpdateDuration,
    inlineUpdateParticipants,
    // Quick add (inline)
    quickAddItem,
    // Inline field updates
    inlineUpdateField,
    // Quick actions
    quickUnlinkResource
  };
}
