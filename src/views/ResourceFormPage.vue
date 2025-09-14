<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/resources"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ isEditMode ? 'Modifier la ressource' : 'Nouvelle ressource' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="saveResource" :disabled="!isFormValid">
            <ion-icon :icon="checkmarkOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content :fullscreen="true">
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
            <ion-label position="stacked">Description</ion-label>
            <ion-textarea 
              v-model="form.description" 
              placeholder="Description de la ressource"
              :rows="3"
            ></ion-textarea>
          </ion-item>
          
          <ion-item>
            <ion-label position="stacked">
              Collections de ressources
              <ion-button 
                v-if="isAdmin" 
                @click="showCreateCollectionModal = true" 
                size="small" 
                fill="clear" 
                color="primary"
                class="create-collection-btn"
              >
                <ion-icon :icon="addOutline" slot="start" />
                Créer une collection
              </ion-button>
            </ion-label>
            <ion-select 
              v-model="form.collectionIds" 
              multiple
              placeholder="Sélectionner les collections"
            >
              <ion-select-option 
                v-for="collection in collections" 
                :key="collection.id" 
                :value="collection.id"
              >
                {{ collection.name }}
              </ion-select-option>
            </ion-select>
          </ion-item>
          
          <ion-item>
            <ion-label position="stacked">Tags (séparés par des virgules)</ion-label>
            <ion-input 
              v-model="tagsInput" 
              placeholder="ex: louange, adoration, communion"
            ></ion-input>
          </ion-item>
        </ion-list>
        
        <!-- Content Items -->
        <div class="content-section">
          <div class="section-header">
            <h3>Médias</h3>
            <ion-button @click="addContent" size="small" fill="outline">
              <ion-icon :icon="addOutline" slot="start" />
              Ajouter
            </ion-button>
          </div>
          
          <ion-list v-if="form.contents.length > 0">
            <ion-item-sliding v-for="(content, index) in form.contents" :key="index">
              <ion-item>
                <ion-label>
                  <h3>{{ getContentLabel(content.type) }}</h3>
                  <p v-if="content.url">{{ content.url }}</p>
                  <p v-else-if="content.content">{{ content.content.substring(0, 50) }}...</p>
                  <p v-if="content.notes" class="content-notes">
                    <ion-icon :icon="documentTextOutline" /> {{ content.notes }}
                  </p>
                </ion-label>
                <ion-icon :icon="getContentIcon(content.type)" slot="start" />
              </ion-item>
              
              <ion-item-options side="end">
                <ion-item-option @click="editContent(index)" color="primary">
                  <ion-icon :icon="pencilOutline" />
                </ion-item-option>
                <ion-item-option @click="removeContent(index)" color="danger">
                  <ion-icon :icon="trashOutline" />
                </ion-item-option>
              </ion-item-options>
            </ion-item-sliding>
          </ion-list>
          
          <div v-else class="empty-content">
            <p>Aucun contenu ajouté</p>
          </div>
        </div>
      </div>
      
      <!-- Content Modal -->
      <ion-modal :is-open="showContentModal" @didDismiss="showContentModal = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ editingContentIndex >= 0 ? 'Modifier' : 'Ajouter' }} un média</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showContentModal = false">Annuler</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-list>
            <ion-item>
              <ion-label position="stacked">Type de média</ion-label>
              <ion-select v-model="contentForm.type" placeholder="Sélectionner le type">
                <ion-select-option :value="ResourceTypeEnum.LYRICS">Paroles</ion-select-option>
                <ion-select-option :value="ResourceTypeEnum.VIDEO">Vidéo</ion-select-option>
                <ion-select-option :value="ResourceTypeEnum.AUDIO">Audio</ion-select-option>
                <ion-select-option :value="ResourceTypeEnum.MUSIC_SHEET">Partition</ion-select-option>
                <ion-select-option :value="ResourceTypeEnum.FILE">Fichier</ion-select-option>
              </ion-select>
            </ion-item>
            
            <!-- Audio File Upload -->
            <div v-if="contentForm.type === ResourceTypeEnum.AUDIO">
              <ion-item>
                <ion-label position="stacked">Fichier Audio/Vidéo</ion-label>
                <input 
                  type="file" 
                  accept="audio/*,video/*" 
                  @change="onFileSelected" 
                  style="margin-top: 8px;"
                />
              </ion-item>
              
              <ion-item v-if="selectedFile">
                <ion-label>
                  <h3>{{ selectedFile.name }}</h3>
                  <p>{{ formatFileSize(selectedFile.size) }}</p>
                </ion-label>
                <ion-button slot="end" fill="clear" color="danger" @click="clearFile">
                  <ion-icon :icon="trashOutline" />
                </ion-button>
              </ion-item>
              
              <ion-item>
                <ion-label position="stacked">ou URL Audio</ion-label>
                <ion-input 
                  v-model="contentForm.url" 
                  placeholder="URL du fichier audio"
                  :disabled="!!selectedFile"
                ></ion-input>
              </ion-item>
            </div>
            
            <!-- File Upload -->
            <div v-if="contentForm.type === ResourceTypeEnum.FILE">
              <ion-item>
                <ion-label position="stacked">Fichier</ion-label>
                <input 
                  type="file" 
                  accept="*/*" 
                  @change="onFileSelected" 
                  style="margin-top: 8px;"
                />
              </ion-item>
              
              <ion-item v-if="selectedFile">
                <ion-label>
                  <h3>{{ selectedFile.name }}</h3>
                  <p>{{ formatFileSize(selectedFile.size) }}</p>
                </ion-label>
                <ion-button slot="end" fill="clear" color="danger" @click="clearFile">
                  <ion-icon :icon="trashOutline" />
                </ion-button>
              </ion-item>
              
              <ion-item>
                <ion-label position="stacked">ou URL du fichier</ion-label>
                <ion-input 
                  v-model="contentForm.url" 
                  placeholder="URL du fichier"
                  :disabled="!!selectedFile"
                ></ion-input>
              </ion-item>
            </div>
            
            <!-- URL Input for other media types -->
            <ion-item v-if="contentForm.type && [ResourceTypeEnum.VIDEO, ResourceTypeEnum.MUSIC_SHEET].includes(contentForm.type)">
              <ion-label position="stacked">URL</ion-label>
              <ion-input 
                v-model="contentForm.url" 
                :placeholder="getUrlPlaceholder()"
              ></ion-input>
            </ion-item>
            
            <!-- Text Content for lyrics and music sheets -->
            <ion-item v-if="contentForm.type && [ResourceTypeEnum.LYRICS, ResourceTypeEnum.MUSIC_SHEET].includes(contentForm.type)">
              <ion-label position="stacked">Contenu</ion-label>
              <ion-textarea 
                v-model="contentForm.content" 
                :placeholder="getContentPlaceholder()"
                :rows="10"
              ></ion-textarea>
            </ion-item>
            
            <!-- Thumbnail URL for videos -->
            <ion-item v-if="contentForm.type === ResourceTypeEnum.VIDEO">
              <ion-label position="stacked">URL de la vignette (optionnel)</ion-label>
              <ion-input 
                v-model="contentForm.thumbnailUrl" 
                placeholder="URL de l'image de prévisualisation"
              ></ion-input>
            </ion-item>
            
            <!-- Notes field for all content types -->
            <ion-item>
              <ion-label position="stacked">Notes (optionnel)</ion-label>
              <ion-textarea 
                v-model="contentForm.notes" 
                placeholder="Instructions, remarques ou informations supplémentaires..."
                :rows="3"
              ></ion-textarea>
            </ion-item>
          </ion-list>
          
          <div class="modal-actions">
            <ion-button @click="saveContent" expand="block" :disabled="!isContentValid || uploading">
              <ion-spinner v-if="uploading" name="crescent" />
              <span v-else>{{ editingContentIndex >= 0 ? 'Modifier' : 'Ajouter' }}</span>
            </ion-button>
          </div>
        </ion-content>
      </ion-modal>
      
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
        <ion-content>
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
                maxlength="3"
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
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonList, IonItem, IonLabel, IonInput, IonTextarea,
  IonSelect, IonSelectOption, IonItemSliding, IonItemOptions, IonItemOption,
  IonModal, IonLoading, IonNote, IonSpinner, toastController
} from '@ionic/vue';
import {
  checkmarkOutline, addOutline, pencilOutline, trashOutline,
  documentTextOutline, videocamOutline, volumeHighOutline,
  musicalNotesOutline, logoYoutube
} from 'ionicons/icons';
import { Resource, ResourceMedia, ResourceType, ResourceCollection } from '@/types/resource';
import { 
  createResource, 
  updateResource, 
  getResourceById, 
  getResourceCollections,
  createResourceCollection as createCollectionService,
  generateUniqueSymbol,
  COLLECTION_COLORS,
  getRandomColor
} from '@/firebase/resources';
import { useUser } from '@/composables/useUser';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

const route = useRoute();
const router = useRouter();
const { user, isAdmin } = useUser();

const loading = ref(false);
const collections = ref<ResourceCollection[]>([]);
const showContentModal = ref(false);
const showCreateCollectionModal = ref(false);
const editingContentIndex = ref(-1);
const uploading = ref(false);
const selectedFile = ref<File | null>(null);
const tagsInput = ref('');

// Make enum available in template
const ResourceTypeEnum = ResourceType;

const form = ref({
  title: '',
  description: '',
  collectionIds: [] as string[],
  contents: [] as ResourceMedia[],
  tags: [] as string[]
});

const contentForm = ref<Partial<ResourceMedia>>({
  type: ResourceType.LYRICS,
  content: '',
  url: '',
  thumbnailUrl: '',
  notes: ''
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

const isContentValid = computed(() => {
  const type = contentForm.value.type;
  if (!type) return false;
  
  if (type === ResourceTypeEnum.AUDIO || type === ResourceTypeEnum.FILE) {
    // For audio and files, either a file is selected or a URL is provided
    return !!selectedFile.value || (!!contentForm.value.url && contentForm.value.url.trim().length > 0);
  }
  
  if (type === ResourceTypeEnum.VIDEO) {
    return !!contentForm.value.url && contentForm.value.url.trim().length > 0;
  }
  
  if (type === ResourceTypeEnum.LYRICS) {
    return !!contentForm.value.content && contentForm.value.content.trim().length > 0;
  }
  
  if (type === ResourceTypeEnum.MUSIC_SHEET) {
    return (!!contentForm.value.url && contentForm.value.url.trim().length > 0) ||
           (!!contentForm.value.content && contentForm.value.content.trim().length > 0);
  }
  
  return false;
});

const loadResourceCollections = async () => {
  try {
    collections.value = await getResourceCollections();
  } catch (error) {
    console.error('Error loading collections:', error);
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
        description: resource.description || '',
        collectionIds: resource.collectionIds,
        contents: [...resource.contents],
        tags: resource.tags || []
      };
      tagsInput.value = resource.tags?.join(', ') || '';
    }
  } catch (error) {
    console.error('Error loading resource:', error);
  } finally {
    loading.value = false;
  }
};

const addContent = () => {
  editingContentIndex.value = -1;
  selectedFile.value = null;
  contentForm.value = {
    type: ResourceTypeEnum.LYRICS,
    content: '',
    url: '',
    thumbnailUrl: '',
    notes: ''
  };
  showContentModal.value = true;
};

const editContent = (index: number) => {
  editingContentIndex.value = index;
  const content = form.value.contents[index];
  contentForm.value = { ...content };
  showContentModal.value = true;
};

const removeContent = (index: number) => {
  form.value.contents.splice(index, 1);
};

const saveContent = async () => {
  if (!isContentValid.value) return;
  
  uploading.value = true;
  
  try {
    let audioUrl = contentForm.value.url;
    
    console.log('Starting save content process');
    console.log('User authenticated:', !!user.value?.uid, user.value?.uid);
    console.log('Content type:', contentForm.value.type);
    console.log('Selected file:', selectedFile.value?.name, selectedFile.value?.type);
    
    // Handle file upload for audio and file content
    if ((contentForm.value.type === ResourceType.AUDIO || contentForm.value.type === ResourceType.FILE) && selectedFile.value) {
      console.log('Starting file upload...');
      audioUrl = await uploadFileToStorage(selectedFile.value, contentForm.value.type);
      console.log('File upload completed, URL:', audioUrl);
    }
    
    const newContent: ResourceMedia = {
      type: contentForm.value.type!,
      content: contentForm.value.content || undefined,
      url: audioUrl || undefined,
      thumbnailUrl: contentForm.value.thumbnailUrl || undefined,
      fileSize: selectedFile.value?.size,
      mimeType: selectedFile.value?.type,
      notes: contentForm.value.notes || undefined
    };
    
    if (editingContentIndex.value >= 0) {
      form.value.contents[editingContentIndex.value] = newContent;
    } else {
      form.value.contents.push(newContent);
    }
    
    // Reset form
    selectedFile.value = null;
    contentForm.value = {
      type: ResourceType.LYRICS,
      content: '',
      url: '',
      thumbnailUrl: '',
      notes: ''
    };
    
    showContentModal.value = false;
    
    const toast = await toastController.create({
      message: 'Média ajouté avec succès',
      duration: 2000,
      color: 'success'
    });
    await toast.present();
    
  } catch (error) {
    console.error('Error uploading file:', error);
    const toast = await toastController.create({
      message: 'Erreur lors du téléchargement du fichier',
      duration: 3000,
      color: 'danger'
    });
    await toast.present();
  } finally {
    uploading.value = false;
  }
};

const saveResource = async () => {
  if (!isFormValid.value) return;
  
  loading.value = true;
  
  try {
    // Process tags
    const tags = tagsInput.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    const resourceData = {
      ...form.value,
      tags,
      createdBy: user.value?.uid || '',
      updatedBy: user.value?.uid || ''
    };
    
    if (isEditMode.value) {
      const id = route.params.id as string;
      await updateResource(id, resourceData);
    } else {
      await createResource(resourceData as Omit<Resource, 'id' | 'createdAt' | 'updatedAt' | 'viewCount'>);
    }
    
    const toast = await toastController.create({
      message: isEditMode.value ? 'Ressource modifiée' : 'Ressource créée',
      duration: 2000,
      color: 'success'
    });
    await toast.present();
    
    router.push('/tabs/resources');
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

const onFileSelected = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    selectedFile.value = input.files[0];
    contentForm.value.url = ''; // Clear URL when file is selected
  }
};

const clearFile = () => {
  selectedFile.value = null;
  // Reset file input
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
  if (fileInput) {
    fileInput.value = '';
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const uploadFileToStorage = async (file: File, contentType?: ResourceType): Promise<string> => {
  // Check if user is authenticated
  if (!user.value?.uid) {
    throw new Error('User must be authenticated to upload files');
  }
  
  const storage = getStorage();
  // Determine folder based on content type
  const folder = contentType === ResourceType.FILE ? 'files' : 'audio';
  const filename = `${folder}/${Date.now()}_${file.name}`;
  const fileRef = storageRef(storage, filename);
  
  // Add metadata including who uploaded the file
  const metadata = {
    customMetadata: {
      uploadedBy: user.value.uid,
      originalName: file.name,
      uploadDate: new Date().toISOString()
    }
  };
  
  console.log('Uploading file:', filename, 'by user:', user.value.uid);
  
  try {
    const snapshot = await uploadBytes(fileRef, file, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Upload successful, download URL:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};

const createNewCollection = async () => {
  if (!collectionForm.value.name?.trim() || !collectionForm.value.symbol?.trim() || !collectionForm.value.color) return;
  
  try {
    const newCollectionId = await createCollectionService({
      name: collectionForm.value.name.trim(),
      symbol: collectionForm.value.symbol.trim(),
      color: collectionForm.value.color,
      description: collectionForm.value.description?.trim() || undefined
    });
    
    // Reload collections to include the new one
    await loadResourceCollections();
    
    // Auto-select the newly created collection
    if (!form.value.collectionIds.includes(newCollectionId)) {
      form.value.collectionIds.push(newCollectionId);
    }
    
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

const getContentIcon = (type: ResourceType) => {
  switch (type) {
    case ResourceType.LYRICS:
      return documentTextOutline;
    case ResourceType.VIDEO:
      return videocamOutline;
    case ResourceType.AUDIO:
      return volumeHighOutline;
    case ResourceType.MUSIC_SHEET:
      return musicalNotesOutline;
    case ResourceType.YOUTUBE:
      return logoYoutube;
    case ResourceType.FILE:
      return documentTextOutline;
    default:
      return documentTextOutline;
  }
};

const getContentLabel = (type: ResourceType) => {
  switch (type) {
    case ResourceType.LYRICS:
      return 'Paroles';
    case ResourceType.VIDEO:
      return 'Vidéo';
    case ResourceType.AUDIO:
      return 'Audio';
    case ResourceType.MUSIC_SHEET:
      return 'Partition';
    case ResourceType.YOUTUBE:
      return 'YouTube';
    case ResourceType.FILE:
      return 'Fichier';
    default:
      return type;
  }
};

const getUrlPlaceholder = () => {
  switch (contentForm.value.type) {
    case ResourceType.VIDEO:
    case ResourceType.AUDIO:
      return 'URL du fichier média';
    case ResourceType.MUSIC_SHEET:
      return 'URL du fichier PDF ou image';
    default:
      return 'https://...';
  }
};

const getContentPlaceholder = () => {
  switch (contentForm.value.type) {
    case ResourceType.LYRICS:
      return 'Entrez les paroles ici...';
    case ResourceType.MUSIC_SHEET:
      return 'Entrez les accords ou la notation (optionnel si URL fournie)';
    default:
      return 'Entrez le contenu...';
  }
};

onMounted(() => {
  loadResourceCollections();
  loadResource();
});
</script>

<style scoped>
.form-container {
  padding: 1rem;
}

.content-section {
  margin-top: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h3 {
  margin: 0;
}

.empty-content {
  text-align: center;
  padding: 2rem;
  color: var(--ion-color-medium);
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

/* File input styling */
input[type="file"] {
  width: 100%;
  padding: 8px 0;
  border: 2px dashed var(--ion-color-medium);
  border-radius: 8px;
  background: var(--ion-color-light);
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

input[type="file"]:hover {
  border-color: var(--ion-color-primary);
  background: var(--ion-color-primary-tint);
}

.content-notes {
  color: var(--ion-color-medium);
  font-style: italic;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.content-notes ion-icon {
  font-size: 0.875rem;
  vertical-align: middle;
  margin-right: 0.25rem;
}
</style>