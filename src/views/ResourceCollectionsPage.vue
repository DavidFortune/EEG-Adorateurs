<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/resources"></ion-back-button>
        </ion-buttons>
        <ion-title>Collections de ressources</ion-title>
        <ion-buttons slot="end" v-if="isAdmin">
          <ion-button @click="createCollection" fill="clear">
            <ion-icon :icon="addOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content :fullscreen="true">
      <ion-loading :is-open="loading" message="Chargement..."></ion-loading>
      
      <div class="ion-padding">
        <div v-if="!loading && collections.length === 0" class="empty-state ion-text-center">
          <ion-icon :icon="folderOutline" size="large" color="medium" />
          <h2>Aucune collection</h2>
          <p>Les collections permettent d'organiser vos ressources par thème.</p>
          <ion-button v-if="isAdmin" @click="createCollection" fill="outline">
            <ion-icon :icon="addOutline" slot="start" />
            Créer une collection
          </ion-button>
        </div>
        
        <ion-list v-else>
          <ion-item
            v-for="collection in collections"
            :key="collection.id"
            button
            @click="viewCollection(collection)"
          >
            <ion-icon :icon="folderOutline" slot="start" />
            <ion-label>
              <h2>{{ collection.name }}</h2>
              <p v-if="collection.description">{{ collection.description }}</p>
              <p class="collection-count">{{ getResourceCount(collection.id) }} ressource{{ getResourceCount(collection.id) !== 1 ? 's' : '' }}</p>
            </ion-label>
            <ion-buttons slot="end" v-if="isAdmin">
              <ion-button @click.stop="editCollection(collection)" fill="clear">
                <ion-icon :icon="pencilOutline" slot="icon-only" />
              </ion-button>
            </ion-buttons>
          </ion-item>
        </ion-list>
      </div>
      
      <!-- Collection Form Modal -->
      <ion-modal :is-open="showModal" @didDismiss="showModal = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ editingCollection ? 'Modifier' : 'Créer' }} une collection</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showModal = false">Annuler</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-list>
            <ion-item>
              <ion-label position="stacked">Nom *</ion-label>
              <ion-input 
                v-model="form.name" 
                placeholder="Nom de la collection"
                @ionInput="onNameInput"
                required
              ></ion-input>
            </ion-item>
            
            <ion-item>
              <ion-label position="stacked">Symbole *</ion-label>
              <ion-input 
                v-model="form.symbol" 
                placeholder="ABC"
                :maxlength="3"
                style="text-transform: uppercase"
                required
              ></ion-input>
              <ion-note slot="helper">2-3 caractères, généré automatiquement</ion-note>
            </ion-item>
            
            <ion-item>
              <ion-label position="stacked">Couleur *</ion-label>
              <div class="color-picker">
                <div 
                  v-for="color in COLLECTION_COLORS" 
                  :key="color"
                  class="color-option"
                  :class="{ selected: form.color === color }"
                  :style="{ backgroundColor: color }"
                  @click="form.color = color"
                >
                  <ion-icon v-if="form.color === color" :icon="checkmarkOutline" class="check-icon" />
                </div>
              </div>
            </ion-item>
            
            <ion-item>
              <ion-label position="stacked">Description</ion-label>
              <ion-textarea 
                v-model="form.description" 
                placeholder="Description de la collection"
                :rows="3"
              ></ion-textarea>
            </ion-item>
          </ion-list>
          
          <div class="modal-actions">
            <ion-button @click="saveCollection" expand="block" :disabled="!form.name?.trim() || !form.symbol?.trim() || !form.color">
              {{ editingCollection ? 'Modifier' : 'Créer' }}
            </ion-button>
            
            <ion-button 
              v-if="editingCollection" 
              @click="confirmDelete" 
              expand="block" 
              color="danger" 
              fill="outline"
            >
              Supprimer
            </ion-button>
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonList, IonItem, IonLabel, IonInput, IonTextarea,
  IonModal, IonLoading, IonNote, toastController, alertController
} from '@ionic/vue';
import {
  addOutline, folderOutline, pencilOutline, checkmarkOutline
} from 'ionicons/icons';
import { ResourceCollection } from '@/types/resource';
import { 
  getResourceCollections, 
  createResourceCollection as createCollectionService, 
  updateResourceCollection, 
  deleteResourceCollection,
  getResourcesByCollection,
  generateUniqueSymbol,
  COLLECTION_COLORS,
  getRandomColor
} from '@/firebase/resources';
import { useUser } from '@/composables/useUser';

const router = useRouter();
const { isAdmin } = useUser();

const loading = ref(false);
const showModal = ref(false);
const collections = ref<ResourceCollection[]>([]);
const resourceCounts = ref<Record<string, number>>({});
const editingCollection = ref<ResourceCollection | null>(null);

const form = ref<Partial<ResourceCollection>>({
  name: '',
  symbol: '',
  color: '#b5121b',
  description: ''
});

const loadCollections = async () => {
  loading.value = true;
  try {
    collections.value = await getResourceCollections();
    
    // Load resource counts for each collection
    for (const collection of collections.value) {
      const resources = await getResourcesByCollection(collection.id);
      resourceCounts.value[collection.id] = resources.length;
    }
  } catch (error) {
    console.error('Error loading collections:', error);
  } finally {
    loading.value = false;
  }
};

const getResourceCount = (collectionId: string) => {
  return resourceCounts.value[collectionId] || 0;
};

const createCollection = () => {
  editingCollection.value = null;
  form.value = {
    name: '',
    symbol: '',
    color: getRandomColor(),
    description: ''
  };
  showModal.value = true;
};

const editCollection = (collection: ResourceCollection) => {
  editingCollection.value = collection;
  form.value = {
    name: collection.name,
    symbol: collection.symbol,
    color: collection.color,
    description: collection.description
  };
  showModal.value = true;
};

const viewCollection = (collection: ResourceCollection) => {
  router.push({
    path: '/tabs/resources',
    query: { collection: collection.id }
  });
};

const saveCollection = async () => {
  if (!form.value.name?.trim() || !form.value.symbol?.trim() || !form.value.color) return;
  
  try {
    if (editingCollection.value) {
      const updateData: any = {
        name: form.value.name.trim(),
        symbol: form.value.symbol.trim(),
        color: form.value.color
      };
      
      // Only add description if it has a value
      if (form.value.description?.trim()) {
        updateData.description = form.value.description.trim();
      }
      
      await updateResourceCollection(editingCollection.value.id, updateData);
    } else {
      const collectionData: any = {
        name: form.value.name.trim(),
        symbol: form.value.symbol.trim(),
        color: form.value.color
      };
      
      // Only add description if it has a value
      if (form.value.description?.trim()) {
        collectionData.description = form.value.description.trim();
      }
      
      await createCollectionService(collectionData);
    }
    
    const toast = await toastController.create({
      message: editingCollection.value ? 'Collection modifiée' : 'Collection créée',
      duration: 2000,
      color: 'success'
    });
    await toast.present();
    
    showModal.value = false;
    loadCollections();
  } catch (error) {
    console.error('Error saving collection:', error);
    const toast = await toastController.create({
      message: 'Erreur lors de la sauvegarde',
      duration: 2000,
      color: 'danger'
    });
    await toast.present();
  }
};

const confirmDelete = async () => {
  if (!editingCollection.value) return;
  
  const resourceCount = getResourceCount(editingCollection.value.id);
  
  const alert = await alertController.create({
    header: 'Confirmer la suppression',
    message: resourceCount > 0 
      ? `Cette collection contient ${resourceCount} ressource${resourceCount > 1 ? 's' : ''}. Vous ne pouvez pas la supprimer.`
      : 'Êtes-vous sûr de vouloir supprimer cette collection ?',
    buttons: resourceCount > 0 
      ? [{ text: 'OK', role: 'cancel' }]
      : [
          { text: 'Annuler', role: 'cancel' },
          {
            text: 'Supprimer',
            role: 'destructive',
            handler: async () => {
              try {
                await deleteResourceCollection(editingCollection.value!.id);
                const toast = await toastController.create({
                  message: 'Collection supprimée',
                  duration: 2000,
                  color: 'success'
                });
                await toast.present();
                showModal.value = false;
                loadCollections();
              } catch (error) {
                console.error('Error deleting collection:', error);
                const toast = await toastController.create({
                  message: 'Erreur lors de la suppression',
                  duration: 2000,
                  color: 'danger'
                });
                await toast.present();
              }
            }
          }
        ]
  });
  
  await alert.present();
};

const onNameInput = async (event: any) => {
  const name = event.target.value;
  if (name && name.trim().length > 0) {
    try {
      const uniqueSymbol = await generateUniqueSymbol(name, editingCollection.value?.id);
      form.value.symbol = uniqueSymbol;
    } catch (error) {
      console.error('Error generating symbol:', error);
    }
  } else {
    form.value.symbol = '';
  }
};

onMounted(() => {
  loadCollections();
});
</script>

<style scoped>
.empty-state {
  padding: 2rem;
}

.empty-state ion-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h2 {
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--ion-color-medium);
  margin-bottom: 1.5rem;
}

.collection-count {
  color: var(--ion-color-medium);
  font-size: 0.875rem;
}

.modal-actions {
  padding: 1rem;
}

.modal-actions ion-button {
  margin-bottom: 0.5rem;
}

ion-item {
  --padding-start: 0;
}

.color-picker {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  padding: 8px 0;
}

.color-option {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  position: relative;
}

.color-option:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.color-option.selected {
  border-color: var(--ion-color-primary);
  box-shadow: 0 0 0 2px rgba(var(--ion-color-primary-rgb), 0.3);
}

.check-icon {
  font-size: 20px;
  color: white;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
}
</style>