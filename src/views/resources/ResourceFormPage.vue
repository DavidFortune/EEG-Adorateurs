<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="isEditMode ? `/resource-detail/${route.params.id}` : '/resources'"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ isEditMode ? 'Modifier la ressource' : 'Nouvelle ressource' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="saveResource" :disabled="!isFormValid">
            <ion-icon :icon="checkmarkOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content :fullscreen="true" class="ion-padding">
      <ion-loading :is-open="loading" message="Chargement..."></ion-loading>
      
      <div class="form-container">
        <!-- Basic Information -->
        <ion-list>
          <ion-item>
            <ion-label position="stacked">Titre *</ion-label>
            <ion-input
              v-model="form.title"
              placeholder="Titre de la ressource"
              required
            ></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Référence</ion-label>
            <ion-input
              v-model="form.reference"
              placeholder="Ex: Psaume 23, #145, etc."
            ></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Collection</ion-label>
            <ion-button
              @click="showCollectionSelector = true"
              fill="outline"
              expand="block"
              class="collection-selector-btn"
            >
              <ion-icon :icon="folderOutline" slot="start" />
              <span v-if="!form.collectionId">Sélectionner une collection</span>
              <span v-else>{{ getCollectionName(form.collectionId) }}</span>
            </ion-button>
          </ion-item>

          <!-- Music Properties -->
          <div class="music-properties-form">
            <ion-item>
              <ion-select
                v-model="form.musicKey"
                label="Tonalité"
                label-placement="stacked"
                interface="action-sheet"
                placeholder="Sélectionner..."
              >
                <ion-select-option value="">Aucune</ion-select-option>
                <ion-select-option v-for="option in musicKeys" :key="option.id" :value="option.id">
                  {{ option.name }}
                </ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item>
              <ion-select
                v-model="form.musicBeat"
                label="Signature"
                label-placement="stacked"
                interface="action-sheet"
                placeholder="Sélectionner..."
              >
                <ion-select-option value="">Aucune</ion-select-option>
                <ion-select-option v-for="option in musicBeats" :key="option.id" :value="option.id">
                  {{ option.name }}
                </ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item>
              <ion-select
                v-model="form.musicTempo"
                label="Tempo"
                label-placement="stacked"
                interface="action-sheet"
                placeholder="Sélectionner..."
              >
                <ion-select-option value="">Aucun</ion-select-option>
                <ion-select-option v-for="option in musicTempos" :key="option.id" :value="option.id">
                  {{ option.name }} <span v-if="option.label">({{ option.label }})</span>
                </ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item>
              <ion-select
                v-model="form.musicStyle"
                label="Style"
                label-placement="stacked"
                interface="action-sheet"
                placeholder="Sélectionner..."
              >
                <ion-select-option value="">Aucun</ion-select-option>
                <ion-select-option v-for="option in musicStyles" :key="option.id" :value="option.id">
                  {{ option.name }}
                </ion-select-option>
              </ion-select>
            </ion-item>
          </div>

          <!-- Notes -->
          <ion-item>
            <ion-label position="stacked">Notes</ion-label>
            <ion-textarea
              v-model="form.notes"
              placeholder="Notes, instructions ou informations supplémentaires..."
              :rows="4"
            ></ion-textarea>
          </ion-item>

          <!-- Tags - Hidden for now, will be re-enabled later
          <ion-item>
            <ion-label position="stacked">Tags</ion-label>
            <div class="tags-input-container">
              <div class="tags-chips">
                <ion-chip
                  v-for="(tag, index) in form.tags"
                  :key="index"
                  color="primary"
                  outline
                >
                  <ion-label>{{ tag }}</ion-label>
                  <ion-icon :icon="closeCircleOutline" @click="removeTag(index)" />
                </ion-chip>
              </div>
              <ion-input
                v-model="newTagInput"
                placeholder="Ajouter un tag..."
                @keydown.enter.prevent="addTag"
                @keydown.tab.prevent="addTag"
                @keydown.,="addTag"
              ></ion-input>
            </div>
          </ion-item>
          -->
        </ion-list>
        
      </div>

      <!-- Create Collection Modal -->
      <ion-modal :is-open="showCreateCollectionModal" @didDismiss="showCreateCollectionModal = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Créer une collection</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showCreateCollectionModal = false">Annuler</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-list>
            <ion-item>
              <ion-label position="stacked">Nom de la collection *</ion-label>
              <ion-input 
                v-model="collectionForm.name" 
                placeholder="Nom de la collection"
                @ionInput="onCollectionNameInput"
                required
              ></ion-input>
            </ion-item>
            
            <ion-item>
              <ion-label position="stacked">Symbole *</ion-label>
              <ion-input 
                v-model="collectionForm.symbol" 
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
                  :class="{ selected: collectionForm.color === color }"
                  :style="{ backgroundColor: color }"
                  @click="collectionForm.color = color"
                >
                  <ion-icon v-if="collectionForm.color === color" :icon="checkmarkOutline" class="check-icon" />
                </div>
              </div>
            </ion-item>
            
            <ion-item>
              <ion-label position="stacked">Description</ion-label>
              <ion-textarea 
                v-model="collectionForm.description" 
                placeholder="Description de la collection"
                :rows="3"
              ></ion-textarea>
            </ion-item>
          </ion-list>
          
          <div class="modal-actions">
            <ion-button @click="createNewCollection" expand="block" :disabled="!collectionForm.name?.trim() || !collectionForm.symbol?.trim() || !collectionForm.color">
              Créer la collection
            </ion-button>
          </div>
        </ion-content>
      </ion-modal>
      
      <!-- Collection Selector Modal -->
      <ion-modal :is-open="showCollectionSelector" @didDismiss="showCollectionSelector = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Sélectionner une collection</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showCollectionSelector = false">Fermer</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-button
            v-if="isAdmin"
            @click="openCreateCollectionModal"
            expand="block"
            fill="outline"
            class="create-collection-btn"
          >
            <ion-icon :icon="addOutline" slot="start" />
            Créer une collection
          </ion-button>

          <ion-list>
            <ion-item
              v-for="collection in collections"
              :key="collection.id"
              button
              @click="selectCollection(collection.id)"
              :class="{ 'selected-collection': form.collectionId === collection.id }"
            >
              <ion-icon
                v-if="form.collectionId === collection.id"
                :icon="checkmarkCircle"
                slot="start"
                color="primary"
              />
              <ion-icon
                v-else
                :icon="ellipseOutline"
                slot="start"
                color="medium"
              />
              <ion-label>
                <h3>{{ collection.name }}</h3>
                <p v-if="collection.description">{{ collection.description }}</p>
              </ion-label>
              <div slot="end" class="collection-badge" :style="{ backgroundColor: collection.color }">
                {{ collection.symbol }}
              </div>
            </ion-item>
          </ion-list>

          <div v-if="collections.length === 0 && !isAdmin" class="empty-state ion-text-center">
            <ion-icon :icon="folderOutline" size="large" color="medium" />
            <h2>Aucune collection</h2>
            <p>Aucune collection disponible.</p>
          </div>

          <div v-if="collections.length === 0 && isAdmin" class="empty-state ion-text-center">
            <ion-icon :icon="folderOutline" size="large" color="medium" />
            <h2>Aucune collection</h2>
            <p>Créez votre première collection pour organiser vos ressources.</p>
            <ion-button @click="openCreateCollectionModal" fill="outline">
              <ion-icon :icon="addOutline" slot="start" />
              Créer une collection
            </ion-button>
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonList, IonItem, IonLabel, IonInput, IonTextarea,
  IonModal, IonLoading, IonNote, IonSelect, IonSelectOption,
  toastController
} from '@ionic/vue';
import {
  checkmarkOutline, addOutline, folderOutline, checkmarkCircle, ellipseOutline
} from 'ionicons/icons';
import { Resource, ResourceMedia, ResourceCollection, CollectionType, ResourceOption } from '@/types/resource';
import {
  createResource,
  updateResource,
  getResourceById,
  getResourceCollections,
  createResourceCollection as createCollectionService,
  generateUniqueSymbol,
  COLLECTION_COLORS,
  getRandomColor,
  getAllResourceOptions
} from '@/firebase/resources';
import { useUser } from '@/composables/useUser';

const route = useRoute();
const router = useRouter();
const { user, isAdmin } = useUser();

const loading = ref(false);
const collections = ref<ResourceCollection[]>([]);
const showCreateCollectionModal = ref(false);
const showCollectionSelector = ref(false);

// Music options state
const musicKeys = ref<ResourceOption[]>([]);
const musicBeats = ref<ResourceOption[]>([]);
const musicTempos = ref<ResourceOption[]>([]);
const musicStyles = ref<ResourceOption[]>([]);

const form = ref({
  title: '',
  reference: '',
  collectionId: '',
  contents: [] as ResourceMedia[],
  tags: [] as string[],
  notes: '',
  musicKey: '' as string,
  musicBeat: '' as string,
  musicTempo: '' as string,
  musicStyle: '' as string
});

const collectionForm = ref<Partial<ResourceCollection>>({
  name: '',
  symbol: '',
  color: '#b5121b',
  description: ''
});

const isEditMode = computed(() => !!route.params.id);

const isFormValid = computed(() => {
  return form.value.title && form.value.title.trim().length > 0;
});

const loadResourceCollections = async () => {
  try {
    collections.value = await getResourceCollections();
  } catch (error) {
    console.error('Error loading collections:', error);
  }
};

const loadMusicOptions = async () => {
  try {
    const options = await getAllResourceOptions();
    musicKeys.value = options.musicKeys;
    musicBeats.value = options.musicBeats;
    musicTempos.value = options.musicTempos;
    musicStyles.value = options.musicStyles;
  } catch (error) {
    console.error('Error loading music options:', error);
  }
};

const loadResource = async () => {
  if (!isEditMode.value) return;

  const id = route.params.id as string;
  loading.value = true;

  try {
    const resource = await getResourceById(id);
    if (resource) {
      form.value = {
        title: resource.title,
        reference: resource.reference || '',
        collectionId: resource.collectionId || '',
        contents: [...resource.contents],
        tags: resource.tags || [],
        notes: resource.notes || '',
        musicKey: resource.musicKey || '',
        musicBeat: resource.musicBeat || '',
        musicTempo: resource.musicTempo || '',
        musicStyle: resource.musicStyle || ''
      };
    }
  } catch (error) {
    console.error('Error loading resource:', error);
  } finally {
    loading.value = false;
  }
};

const saveResource = async () => {
  if (!isFormValid.value) return;
  
  loading.value = true;
  
  try {
    console.log('Starting saveResource...');
    console.log('User:', user.value?.uid, user.value?.email);
    console.log('Form data:', JSON.parse(JSON.stringify(form.value)));

    // Build resource data, filtering out undefined values
    const resourceData: any = {
      title: form.value.title,
      collectionId: form.value.collectionId,
      contents: form.value.contents,
      tags: form.value.tags,
      createdBy: user.value?.uid || '',
      updatedBy: user.value?.uid || ''
    };

    // Add reference if provided
    if (form.value.reference?.trim()) {
      resourceData.reference = form.value.reference.trim();
    }

    // Add notes if provided
    if (form.value.notes?.trim()) {
      resourceData.notes = form.value.notes.trim();
    }

    // Add music properties if provided
    if (form.value.musicKey) {
      resourceData.musicKey = form.value.musicKey;
    }
    if (form.value.musicBeat) {
      resourceData.musicBeat = form.value.musicBeat;
    }
    if (form.value.musicTempo) {
      resourceData.musicTempo = form.value.musicTempo;
    }
    if (form.value.musicStyle) {
      resourceData.musicStyle = form.value.musicStyle;
    }
    
    console.log('Resource data to save:', JSON.parse(JSON.stringify(resourceData)));
    
    if (isEditMode.value) {
      const id = route.params.id as string;
      console.log('Updating resource with ID:', id);
      await updateResource(id, resourceData);
    } else {
      console.log('Creating new resource...');
      const resourceId = await createResource(resourceData as Omit<Resource, 'id' | 'createdAt' | 'updatedAt' | 'viewCount'>);
      console.log('Resource created with ID:', resourceId);
    }

    const toast = await toastController.create({
      message: isEditMode.value ? 'Ressource modifiée' : 'Ressource créée',
      duration: 2000,
      color: 'success'
    });
    await toast.present();

    // Clear form after creating a new resource
    if (!isEditMode.value) {
      form.value = {
        title: '',
        reference: '',
        collectionId: '',
        contents: [],
        tags: [],
        notes: '',
        musicKey: '',
        musicBeat: '',
        musicTempo: '',
        musicStyle: ''
      };
    }

    router.push('/resources');
  } catch (error) {
    console.error('Error saving resource:', error);
    const toast = await toastController.create({
      message: 'Erreur lors de la sauvegarde',
      duration: 2000,
      color: 'danger'
    });
    await toast.present();
  } finally {
    loading.value = false;
  }
};

const onCollectionNameInput = async (event: any) => {
  const name = event.target.value;
  if (name && name.trim().length > 0) {
    try {
      const uniqueSymbol = await generateUniqueSymbol(name);
      collectionForm.value.symbol = uniqueSymbol;
    } catch (error) {
      console.error('Error generating symbol:', error);
    }
  } else {
    collectionForm.value.symbol = '';
  }
};

const createNewCollection = async () => {
  if (!collectionForm.value.name?.trim() || !collectionForm.value.symbol?.trim() || !collectionForm.value.color) return;
  
  try {
    const newCollectionId = await createCollectionService({
      name: collectionForm.value.name.trim(),
      symbol: collectionForm.value.symbol.trim(),
      color: collectionForm.value.color,
      type: CollectionType.CORE,
      description: collectionForm.value.description?.trim() || undefined
    });
    
    // Reload collections to include the new one
    await loadResourceCollections();
    
    // Auto-select the newly created collection
    form.value.collectionId = newCollectionId;
    
    const toast = await toastController.create({
      message: 'Collection créée avec succès',
      duration: 2000,
      color: 'success'
    });
    await toast.present();
    
    // Reset form and close modal
    collectionForm.value = {
      name: '',
      symbol: '',
      color: getRandomColor(),
      description: ''
    };
    showCreateCollectionModal.value = false;
  } catch (error) {
    console.error('Error creating collection:', error);
    const toast = await toastController.create({
      message: 'Erreur lors de la création de la collection',
      duration: 2000,
      color: 'danger'
    });
    await toast.present();
  }
};

const getCollectionName = (collectionId: string): string => {
  const collection = collections.value.find(c => c.id === collectionId);
  return collection ? collection.name : 'Collection inconnue';
};

const selectCollection = (collectionId: string) => {
  form.value.collectionId = collectionId;
  showCollectionSelector.value = false;
};

const openCreateCollectionModal = () => {
  showCollectionSelector.value = false;
  showCreateCollectionModal.value = true;
};

onMounted(() => {
  loadResourceCollections();
  loadMusicOptions();
  loadResource();
});
</script>

<style scoped>
.form-container {
  padding: 1rem;
}

.tags-input-container {
  width: 100%;
  padding: 8px 0;
}

.tags-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.tags-chips ion-chip {
  margin: 0;
  height: 28px;
}

.tags-chips ion-chip ion-icon {
  cursor: pointer;
  margin-left: 4px;
}

.tags-input-container ion-input {
  --padding-start: 0;
  --padding-end: 0;
}

.create-collection-btn {
  margin-bottom: 16px;
}

/* Music properties form */
.music-properties-form {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0;
  margin-top: 0.5rem;
}

.music-properties-form ion-item {
  --padding-start: 16px;
}

@media (max-width: 480px) {
  .music-properties-form {
    grid-template-columns: 1fr;
  }
}

.modal-actions {
  padding: 1rem;
}

ion-item {
  --padding-start: 0;
}

.create-collection-btn {
  float: right;
  margin-top: -0.25rem;
  font-size: 0.8rem;
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

@media (max-width: 768px) {
  .form-container {
    padding: 0.5rem;
  }
  
  .create-collection-btn {
    float: none;
    display: block;
    margin-top: 0.5rem;
  }
  
  .color-picker {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Collection selector styles */
.collection-selector-btn {
  margin-top: 8px;
  --border-radius: 8px;
  justify-content: flex-start;
  text-align: left;
}

.collection-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: white;
  font-weight: bold;
  font-size: 0.75rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.empty-state {
  padding: 2rem;
  margin: 2rem 0;
}

.empty-state ion-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state h2 {
  margin-bottom: 0.5rem;
  color: var(--ion-color-medium);
}

.empty-state p {
  color: var(--ion-color-medium);
  margin-bottom: 1.5rem;
}
</style>