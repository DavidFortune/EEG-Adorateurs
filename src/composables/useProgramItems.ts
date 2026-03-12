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

  const startInlineTitleEdit = (itemId: string) => {
    const item = program.value?.items.find(i => i.id === itemId);
    editingTitleInitialValue.value = item?.title || '';
    editingTitleItemId.value = itemId;
  };

  const cancelInlineTitleEdit = () => {
    editingTitleItemId.value = null;
  };

  const inlineUpdateTitle = async (itemId: string, newTitle: string) => {
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
        title: title.trim()
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
    // Reorder
    handleItemReorder,
    // Inline editing
    editingTitleItemId,
    editingTitleInitialValue,
    startInlineTitleEdit,
    cancelInlineTitleEdit,
    inlineUpdateTitle,
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
