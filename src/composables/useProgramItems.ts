import { ref, type Ref } from 'vue';
import { toastController, alertController } from '@ionic/vue';
import type { ServiceProgram, ProgramItem, ProgramParticipant, ProgramSubItem } from '@/types/program';
import { ProgramItemType } from '@/types/program';
import type { Resource } from '@/types/resource';
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

export type FormMode = 'add-item' | 'edit-item' | 'add-sub-item' | 'edit-sub-item';

export interface ProgramItemFormData {
  type: ProgramItemType | '';
  title: string;
  subtitle: string;
  participants: ProgramParticipant[];
  duration: number;
  notes: string;
  resourceId: string | null;
  scriptureReference: string;
  scriptureText: string;
  scriptureVersion: string;
}

interface UseProgramItemsParams {
  program: Ref<ServiceProgram | null>;
  linkedResources: Ref<Map<string, Resource>>;
  user: Ref<{ uid: string } | null>;
  expandedItems: Ref<Set<string>>;
  loading: Ref<boolean>;
  loadProgram: () => Promise<void>;
  allResources: Ref<Resource[]>;
  loadResourcesForAutocomplete: () => Promise<void>;
}

export function useProgramItems(params: UseProgramItemsParams) {
  const { program, linkedResources, user, expandedItems, loading, loadProgram, allResources, loadResourcesForAutocomplete } = params;

  // Form modal state (replaces 3 separate modal booleans and 3 form refs)
  const showFormModal = ref(false);
  const formMode = ref<FormMode>('add-item');
  const formInitialData = ref<Partial<ProgramItemFormData>>({});

  // Internal tracking for which item/sub-item is being edited
  const editingItemId = ref<string | null>(null);
  const parentItemId = ref<string | null>(null);
  const editingSubItemId = ref<string | null>(null);

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

  // --- Modal Openers ---

  const openAddItemModal = (preselectedType?: ProgramItemType) => {
    editingItemId.value = null;
    parentItemId.value = null;
    editingSubItemId.value = null;
    formMode.value = 'add-item';
    formInitialData.value = preselectedType ? { type: preselectedType } : {};
    showFormModal.value = true;
    if (allResources.value.length === 0) loadResourcesForAutocomplete();
  };

  const openEditItemModal = (item: ProgramItem) => {
    editingItemId.value = item.id;
    parentItemId.value = null;
    editingSubItemId.value = null;
    formMode.value = 'edit-item';

    // Handle migration from single participant to multiple
    let participants: ProgramParticipant[] = [];
    if (item.participants && item.participants.length > 0) {
      participants = item.participants;
    } else if (item.participant) {
      participants = [item.participant];
    }

    formInitialData.value = {
      type: item.type,
      title: item.title,
      subtitle: item.subtitle || '',
      participants,
      duration: item.duration || 0,
      notes: item.notes || '',
      resourceId: item.resourceId || null,
      scriptureReference: item.scriptureReference || '',
      scriptureText: item.scriptureText || '',
      scriptureVersion: item.scriptureVersion || 'LSG' // normalization 4.2
    };
    showFormModal.value = true;
  };

  const openAddSubItemModal = (itemId: string) => {
    editingItemId.value = null;
    parentItemId.value = itemId;
    editingSubItemId.value = null;
    formMode.value = 'add-sub-item';
    formInitialData.value = {};
    showFormModal.value = true;
    if (allResources.value.length === 0) loadResourcesForAutocomplete();
  };

  const openEditSubItemModal = (itemId: string, subItem: ProgramSubItem) => {
    editingItemId.value = null;
    parentItemId.value = itemId;
    editingSubItemId.value = subItem.id;
    formMode.value = 'edit-sub-item';
    formInitialData.value = {
      type: (subItem.type || '') as ProgramItemType | '',
      title: subItem.title,
      subtitle: subItem.subtitle || '',
      resourceId: subItem.resourceId || null,
      participants: subItem.participants || [],
      duration: subItem.duration || 0,
      notes: subItem.notes || '',
      scriptureReference: subItem.scriptureReference || '',
      scriptureText: subItem.scriptureText || '',
      scriptureVersion: subItem.scriptureVersion || 'LSG' // normalization 4.2
    };
    showFormModal.value = true;
    if (allResources.value.length === 0) loadResourcesForAutocomplete();
  };

  const closeFormModal = () => {
    showFormModal.value = false;
    editingItemId.value = null;
    parentItemId.value = null;
    editingSubItemId.value = null;
  };

  // --- Submit Dispatcher ---

  const handleFormSubmit = async (data: ProgramItemFormData) => {
    switch (formMode.value) {
      case 'add-item': await handleAddItem(data); break;
      case 'edit-item': await handleUpdateItem(data); break;
      case 'add-sub-item': await handleAddSubItem(data); break;
      case 'edit-sub-item': await handleUpdateSubItem(data); break;
    }
  };

  // --- CRUD: Items ---

  const handleAddItem = async (data: ProgramItemFormData) => {
    if (!program.value || !user.value) return;
    try {
      loading.value = true;
      const newItem: any = {
        order: program.value.items.length,
        type: data.type,
        title: data.title
      };
      if (data.subtitle) newItem.subtitle = data.subtitle;
      if (data.participants?.length) {
        newItem.participants = cleanParticipants(data.participants);
      }
      if (data.duration) newItem.duration = data.duration;
      if (data.notes) newItem.notes = data.notes;
      if (data.resourceId) newItem.resourceId = data.resourceId;
      // Scripture - normalization 4.1: consistent handling
      if (data.scriptureReference) {
        newItem.scriptureReference = data.scriptureReference;
        newItem.scriptureText = data.scriptureText;
        newItem.scriptureVersion = data.scriptureVersion;
      }

      await addItemToProgram(program.value.id, newItem, user.value.uid);
      closeFormModal();
      await showToast('Élément ajouté avec succès', 'success');
    } catch (error) {
      console.error('Error adding item:', error);
      await showToast('Erreur lors de l\'ajout de l\'élément', 'danger');
    } finally {
      loading.value = false;
    }
  };

  const handleUpdateItem = async (data: ProgramItemFormData) => {
    if (!program.value || !user.value || !editingItemId.value) return;
    try {
      loading.value = true;
      const updates: any = {
        type: data.type,
        title: data.title
      };
      if (data.subtitle) updates.subtitle = data.subtitle;
      if (data.participants?.length) {
        updates.participants = cleanParticipants(data.participants);
      }
      updates.participant = undefined; // Clear deprecated field
      if (data.duration) updates.duration = data.duration;
      if (data.notes) updates.notes = data.notes;
      if (data.resourceId) updates.resourceId = data.resourceId;
      // Scripture - normalization 4.1: send null for empty in all modes
      updates.scriptureReference = data.scriptureReference || null;
      updates.scriptureText = data.scriptureText || null;
      updates.scriptureVersion = data.scriptureVersion || null;

      await updateItemInProgram(program.value.id, editingItemId.value, updates, user.value.uid);
      closeFormModal();
      await showToast('Élément mis à jour', 'success');
    } catch (error) {
      console.error('Error updating item:', error);
      await showToast('Erreur lors de la mise à jour', 'danger');
    } finally {
      loading.value = false;
    }
  };

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

  // --- CRUD: Sub-Items ---

  const handleAddSubItem = async (data: ProgramItemFormData) => {
    if (!program.value || !parentItemId.value || !user.value) return;
    try {
      loading.value = true;
      const parentItem = program.value.items.find(i => i.id === parentItemId.value);
      const currentSubItems = parentItem?.subItems || [];

      const newSubItem: any = {
        title: data.title,
        order: currentSubItems.length
      };
      if (data.type) newSubItem.type = data.type;
      if (data.subtitle) newSubItem.subtitle = data.subtitle;
      if (data.resourceId) newSubItem.resourceId = data.resourceId;
      if (data.participants?.length) {
        newSubItem.participants = cleanParticipants(data.participants);
      }
      if (data.duration) newSubItem.duration = data.duration;
      if (data.notes) newSubItem.notes = data.notes;
      // Scripture - normalization 4.1: consistent handling
      if (data.scriptureReference) {
        newSubItem.scriptureReference = data.scriptureReference;
        newSubItem.scriptureText = data.scriptureText;
        newSubItem.scriptureVersion = data.scriptureVersion;
      }

      await addSubItemToItem(program.value.id, parentItemId.value, newSubItem, user.value.uid);
      expandedItems.value.add(parentItemId.value);
      closeFormModal();
      await showToast('Sous-élément ajouté', 'success');
    } catch (error) {
      console.error('Error adding sub-item:', error);
      await showToast('Erreur lors de l\'ajout', 'danger');
    } finally {
      loading.value = false;
    }
  };

  const handleUpdateSubItem = async (data: ProgramItemFormData) => {
    if (!program.value || !parentItemId.value || !editingSubItemId.value || !user.value) return;
    try {
      loading.value = true;
      const updates: any = {
        title: data.title
      };
      if (data.type) updates.type = data.type;
      if (data.subtitle) updates.subtitle = data.subtitle;
      if (data.resourceId) updates.resourceId = data.resourceId;
      if (data.participants?.length) {
        updates.participants = cleanParticipants(data.participants);
      }
      if (data.duration) updates.duration = data.duration;
      if (data.notes) updates.notes = data.notes;
      // Scripture - normalization 4.1: send null for empty in all modes
      updates.scriptureReference = data.scriptureReference || null;
      updates.scriptureText = data.scriptureText || null;
      updates.scriptureVersion = data.scriptureVersion || null;

      await updateSubItemInItem(
        program.value.id, parentItemId.value, editingSubItemId.value, updates, user.value.uid
      );
      closeFormModal();
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
    // Form modal state
    showFormModal,
    formMode,
    formInitialData,
    // Modal openers
    openAddItemModal,
    openEditItemModal,
    openAddSubItemModal,
    openEditSubItemModal,
    closeFormModal,
    // Submit handler
    handleFormSubmit,
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
    // Quick actions
    quickUnlinkResource
  };
}
