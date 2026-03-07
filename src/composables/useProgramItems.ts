import { ref, type Ref } from 'vue';
import { toastController, alertController } from '@ionic/vue';
import type { ServiceProgram, ProgramParticipant } from '@/types/program';
import { ProgramItemType } from '@/types/program';
import {
  addItemToProgram,
  updateItemInProgram,
  deleteItemFromProgram,
  addSubItemToItem,
  updateSubItemInItem,
  deleteSubItemFromItem,
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

  // Clean participants - strip undefined avatar/role (normalization 4.5)
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
    const confirmed = await confirmAction('Supprimer cet élément du programme ?');
    if (!confirmed) return;
    try {
      loading.value = true;
      await deleteItemFromProgram(program.value.id, itemId, user.value.uid);
      await showToast('Élément supprimé', 'success');
    } catch (error) {
      console.error('Error deleting item:', error);
      await showToast('Erreur lors de la suppression', 'danger');
    } finally {
      loading.value = false;
    }
  };

  const deleteSubItem = async (itemId: string, subItemId: string) => {
    if (!program.value || !user.value) return;
    const confirmed = await confirmAction('Supprimer ce sous-élément ?');
    if (!confirmed) return;
    try {
      loading.value = true;
      await deleteSubItemFromItem(program.value.id, itemId, subItemId, user.value.uid);
      await showToast('Sous-élément supprimé', 'success');
    } catch (error) {
      console.error('Error deleting sub-item:', error);
      await showToast('Erreur', 'danger');
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
    const [movedItem] = itemsCopy.splice(from, 1);
    itemsCopy.splice(to, 0, movedItem);
    itemsCopy.forEach((item, index) => { item.order = index; });
    program.value.items = itemsCopy;
    event.detail.complete();
    try {
      await updateProgramOrder(program.value.id, program.value.sections, itemsCopy, user.value.uid);
    } catch (error) {
      console.error('Error saving item order:', error);
      await loadProgram();
      await showToast('Erreur lors de la réorganisation', 'danger');
    }
  };

  const handleSubItemReorder = async (event: CustomEvent, parentId: string) => {
    if (!program.value || !user.value) {
      event.detail.complete();
      return;
    }
    const { from, to } = event.detail;
    if (from === to) {
      event.detail.complete();
      return;
    }
    const parentItem = program.value.items.find(i => i.id === parentId);
    if (!parentItem?.subItems) {
      event.detail.complete();
      return;
    }
    const subItemsCopy = [...parentItem.subItems];
    const [movedSubItem] = subItemsCopy.splice(from, 1);
    subItemsCopy.splice(to, 0, movedSubItem);
    subItemsCopy.forEach((subItem, index) => { subItem.order = index; });
    parentItem.subItems = subItemsCopy;
    event.detail.complete();
    try {
      await updateItemInProgram(program.value.id, parentId, { subItems: subItemsCopy }, user.value.uid);
    } catch (error) {
      console.error('Error saving sub-item order:', error);
      await loadProgram();
      await showToast('Erreur lors de la réorganisation', 'danger');
    }
  };

  // --- Inline Editing ---

  const editingTitleItemId = ref<string | null>(null);

  const startInlineTitleEdit = (itemId: string) => {
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

  const addSectionInline = async (): Promise<string | null> => {
    if (!program.value || !user.value) return null;
    try {
      loading.value = true;
      const newItem: any = {
        order: program.value.items.length,
        type: 'Section',
        title: 'Nouvelle section'
      };
      const created = await addItemToProgram(program.value.id, newItem, user.value.uid);
      return created.id;
    } catch (error) {
      console.error('Error adding section:', error);
      await showToast('Erreur lors de l\'ajout de la section', 'danger');
      return null;
    } finally {
      loading.value = false;
    }
  };

  // --- Quick Add (Inline) ---

  const quickAddItem = async (type: ProgramItemType, title: string, resourceId?: string): Promise<string | null> => {
    if (!program.value || !user.value || !title.trim()) return null;
    try {
      const newItem: any = {
        order: program.value.items.length,
        type,
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

  const quickAddSubItem = async (parentId: string, type: ProgramItemType | '', title: string, resourceId?: string): Promise<string | null> => {
    if (!program.value || !user.value || !title.trim()) return null;
    try {
      const parentItem = program.value.items.find(i => i.id === parentId);
      const currentSubItems = parentItem?.subItems || [];
      const newSubItem: any = {
        title: title.trim(),
        order: currentSubItems.length
      };
      if (type) newSubItem.type = type;
      if (resourceId) newSubItem.resourceId = resourceId;
      const created = await addSubItemToItem(program.value.id, parentId, newSubItem, user.value.uid);
      expandedItems.value.add(parentId);
      return created.id;
    } catch (error) {
      console.error('Error quick-adding sub-item:', error);
      await showToast('Erreur lors de l\'ajout du sous-élément', 'danger');
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

  const inlineUpdateSubItemField = async (parentId: string, subItemId: string, field: string, value: any) => {
    if (!program.value || !user.value) return;
    try {
      await updateSubItemInItem(program.value.id, parentId, subItemId, { [field]: value }, user.value.uid);
    } catch (error) {
      console.error(`Error updating sub-item ${field}:`, error);
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
    deleteSubItem,
    // Reorder
    handleItemReorder,
    handleSubItemReorder,
    // Inline editing
    editingTitleItemId,
    startInlineTitleEdit,
    cancelInlineTitleEdit,
    inlineUpdateTitle,
    inlineUpdateDuration,
    inlineUpdateParticipants,
    addSectionInline,
    // Quick add (inline)
    quickAddItem,
    quickAddSubItem,
    // Inline field updates
    inlineUpdateField,
    inlineUpdateSubItemField,
    // Quick actions
    quickUnlinkResource
  };
}
