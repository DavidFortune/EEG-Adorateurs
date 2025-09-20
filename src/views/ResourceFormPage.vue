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
            <ion-button 
              @click="showCollectionSelector = true" 
              fill="outline" 
              expand="block"
              class="collection-selector-btn"
            >
              <ion-icon :icon="folderOutline" slot="start" />
              <span v-if="form.collectionIds.length === 0">Sélectionner les collections</span>
              <span v-else-if="form.collectionIds.length === 1">{{ getCollectionName(form.collectionIds[0]) }}</span>
              <span v-else>{{ form.collectionIds.length }} collections sélectionnées</span>
            </ion-button>
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
                  
                  <!-- Video Preview -->
                  <div v-if="content.type === ResourceTypeEnum.VIDEO && content.url" class="media-preview">
                    <!-- YouTube video -->
                    <iframe 
                      v-if="isYouTubeUrl(content.url)"
                      :src="getYouTubeEmbedUrl(content.url) || ''"
                      frameborder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowfullscreen
                      class="preview-video"
                    ></iframe>
                    <!-- Regular video file -->
                    <video 
                      v-else
                      :src="content.url" 
                      controls 
                      class="preview-video" 
                      :poster="content.thumbnailUrl"
                    ></video>
                  </div>
                  
                  <!-- Audio Preview -->
                  <div v-if="content.type === ResourceTypeEnum.AUDIO && content.url" class="media-preview">
                    <audio :src="content.url" controls class="preview-audio"></audio>
                  </div>
                  
                  <!-- Music Sheet Preview -->
                  <div v-if="content.type === ResourceTypeEnum.MUSIC_SHEET && content.url" class="media-preview">
                    <div class="file-preview">
                      <ion-icon :icon="musicalNotesOutline" />
                      <span class="file-name">{{ getFileName(content.url) }}</span>
                      <ion-button size="small" fill="clear" @click="editContent(index)">
                        <ion-icon :icon="pencilOutline" slot="icon-only" />
                      </ion-button>
                    </div>
                  </div>
                  
                  <!-- Lyrics Preview -->
                  <div v-if="content.type === ResourceTypeEnum.LYRICS && content.content" class="media-preview">
                    <div class="lyrics-preview">
                      <span class="lyrics-text">{{ getPreviewText(content.content) }}</span>
                      <ion-button size="small" fill="clear" @click="editContent(index)">
                        <ion-icon :icon="pencilOutline" slot="icon-only" />
                      </ion-button>
                    </div>
                  </div>
                  
                  <!-- Fallback for content without preview -->
                  <div v-if="!hasPreview(content)" class="media-preview">
                    <div v-if="content.url" class="fallback-preview">
                      <span class="fallback-url">{{ content.url }}</span>
                      <ion-button size="small" fill="clear" @click="editContent(index)">
                        <ion-icon :icon="pencilOutline" slot="icon-only" />
                      </ion-button>
                    </div>
                    <div v-else-if="content.content" class="fallback-preview">
                      <span class="fallback-content">{{ content.content.substring(0, 50) }}...</span>
                      <ion-button size="small" fill="clear" @click="editContent(index)">
                        <ion-icon :icon="pencilOutline" slot="icon-only" />
                      </ion-button>
                    </div>
                  </div>
                  
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
        <ion-content class="ion-padding">
          <ion-list>
            <ion-item>
              <ion-label position="stacked">Type de média</ion-label>
              <div class="media-type-buttons">
                <ion-button 
                  @click="contentForm.type = ResourceTypeEnum.LYRICS"
                  :fill="contentForm.type === ResourceTypeEnum.LYRICS ? 'solid' : 'outline'"
                  :color="contentForm.type === ResourceTypeEnum.LYRICS ? 'primary' : 'medium'"
                  class="media-type-button"
                >
                  <div class="button-content">
                    <ion-icon :icon="documentTextOutline" />
                    <span>Paroles</span>
                  </div>
                </ion-button>
                
                <ion-button 
                  @click="contentForm.type = ResourceTypeEnum.VIDEO"
                  :fill="contentForm.type === ResourceTypeEnum.VIDEO ? 'solid' : 'outline'"
                  :color="contentForm.type === ResourceTypeEnum.VIDEO ? 'primary' : 'medium'"
                  class="media-type-button"
                >
                  <div class="button-content">
                    <ion-icon :icon="videocamOutline" />
                    <span>Vidéo</span>
                  </div>
                </ion-button>
                
                <ion-button 
                  @click="contentForm.type = ResourceTypeEnum.AUDIO"
                  :fill="contentForm.type === ResourceTypeEnum.AUDIO ? 'solid' : 'outline'"
                  :color="contentForm.type === ResourceTypeEnum.AUDIO ? 'primary' : 'medium'"
                  class="media-type-button"
                >
                  <div class="button-content">
                    <ion-icon :icon="volumeHighOutline" />
                    <span>Audio</span>
                  </div>
                </ion-button>
                
                <ion-button 
                  @click="contentForm.type = ResourceTypeEnum.MUSIC_SHEET"
                  :fill="contentForm.type === ResourceTypeEnum.MUSIC_SHEET ? 'solid' : 'outline'"
                  :color="contentForm.type === ResourceTypeEnum.MUSIC_SHEET ? 'primary' : 'medium'"
                  class="media-type-button"
                >
                  <div class="button-content">
                    <ion-icon :icon="musicalNotesOutline" />
                    <span>Partition</span>
                  </div>
                </ion-button>
                
              </div>
            </ion-item>
            
            <!-- Audio File Upload -->
            <div v-if="contentForm.type === ResourceTypeEnum.AUDIO">
              <ion-item>
                <ion-label position="stacked">Fichier Audio</ion-label>
                <input 
                  type="file" 
                  accept="audio/*" 
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
            
            <!-- Video File Upload -->
            <div v-if="contentForm.type === ResourceTypeEnum.VIDEO">
              <ion-item>
                <ion-label position="stacked">Fichier Vidéo</ion-label>
                <input 
                  type="file" 
                  accept="video/*" 
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
                <ion-label position="stacked">ou URL Vidéo</ion-label>
                <ion-input 
                  v-model="contentForm.url" 
                  placeholder="URL du fichier vidéo"
                  :disabled="!!selectedFile"
                ></ion-input>
              </ion-item>
            </div>
            
            <!-- Music Sheet File Upload -->
            <div v-if="contentForm.type === ResourceTypeEnum.MUSIC_SHEET">
              <ion-item>
                <ion-label position="stacked">Fichier Partition</ion-label>
                <input 
                  type="file" 
                  accept="application/pdf,image/*" 
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
                <ion-label position="stacked">ou URL Partition</ion-label>
                <ion-input 
                  v-model="contentForm.url" 
                  placeholder="URL du fichier PDF ou image"
                  :disabled="!!selectedFile"
                ></ion-input>
              </ion-item>
            </div>
            
            
            <!-- Text Content for lyrics -->
            <ion-item v-if="contentForm.type === ResourceTypeEnum.LYRICS">
              <ion-label position="stacked">Contenu</ion-label>
              <ion-textarea 
                v-model="contentForm.content" 
                :placeholder="getContentPlaceholder()"
                :rows="10"
              ></ion-textarea>
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
            <ion-title>Sélectionner les collections</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showCollectionSelector = false">Fermer</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-list>
            <ion-item v-for="collection in collections" :key="collection.id">
              <ion-checkbox
                :checked="form.collectionIds.includes(collection.id)"
                @ionChange="toggleCollection(collection.id)"
              ></ion-checkbox>
              <ion-label class="ion-margin-start">
                <h3>{{ collection.name }}</h3>
                <p v-if="collection.description">{{ collection.description }}</p>
              </ion-label>
              <div slot="end" class="collection-badge" :style="{ backgroundColor: collection.color }">
                {{ collection.symbol }}
              </div>
            </ion-item>
          </ion-list>
          
          <div v-if="collections.length === 0" class="empty-state ion-text-center">
            <ion-icon :icon="folderOutline" size="large" color="medium" />
            <h2>Aucune collection</h2>
            <p>Créez votre première collection pour organiser vos ressources.</p>
            <ion-button v-if="isAdmin" @click="showCreateCollectionModal = true; showCollectionSelector = false" fill="outline">
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
  IonItemSliding, IonItemOptions, IonItemOption, IonCheckbox,
  IonModal, IonLoading, IonNote, IonSpinner, toastController
} from '@ionic/vue';
import {
  checkmarkOutline, addOutline, pencilOutline, trashOutline,
  documentTextOutline, videocamOutline, volumeHighOutline,
  musicalNotesOutline, logoYoutube, folderOutline
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
const showCollectionSelector = ref(false);
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
  
  if (type === ResourceTypeEnum.AUDIO || type === ResourceTypeEnum.VIDEO || type === ResourceTypeEnum.MUSIC_SHEET) {
    // For audio, video, and music sheet, either a file is selected or a URL is provided
    return !!selectedFile.value || (!!contentForm.value.url && contentForm.value.url.trim().length > 0);
  }
  
  if (type === ResourceTypeEnum.LYRICS) {
    return !!contentForm.value.content && contentForm.value.content.trim().length > 0;
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
    let mediaUrl = contentForm.value.url;
    
    console.log('Starting save content process');
    console.log('User authenticated:', !!user.value?.uid, user.value?.uid);
    console.log('Content type:', contentForm.value.type);
    console.log('Selected file:', selectedFile.value?.name, selectedFile.value?.type);
    
    // Handle file upload for audio, video, and music sheet content
    if ((contentForm.value.type === ResourceType.AUDIO || contentForm.value.type === ResourceType.VIDEO || contentForm.value.type === ResourceType.MUSIC_SHEET) && selectedFile.value) {
      console.log('Starting file upload...');
      mediaUrl = await uploadFileToStorage(selectedFile.value, contentForm.value.type);
      console.log('File upload completed, URL:', mediaUrl);
    }
    
    const newContent: ResourceMedia = {
      type: contentForm.value.type!
    };
    
    // Only add properties that have values to avoid undefined fields
    if (contentForm.value.content && contentForm.value.content.trim()) {
      newContent.content = contentForm.value.content.trim();
    }
    if (mediaUrl) {
      newContent.url = mediaUrl;
    }
    if (contentForm.value.thumbnailUrl && contentForm.value.thumbnailUrl.trim()) {
      newContent.thumbnailUrl = contentForm.value.thumbnailUrl.trim();
    }
    if (selectedFile.value?.size) {
      newContent.fileSize = selectedFile.value.size;
    }
    if (selectedFile.value?.type) {
      newContent.mimeType = selectedFile.value.type;
    }
    if (contentForm.value.notes && contentForm.value.notes.trim()) {
      newContent.notes = contentForm.value.notes.trim();
    }
    
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
    console.log('Starting saveResource...');
    console.log('User:', user.value?.uid, user.value?.email);
    console.log('Form data:', JSON.parse(JSON.stringify(form.value)));
    
    // Process tags
    const tags = tagsInput.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    // Build resource data, filtering out undefined values
    const resourceData: any = {
      title: form.value.title,
      collectionIds: form.value.collectionIds,
      contents: form.value.contents,
      tags,
      createdBy: user.value?.uid || '',
      updatedBy: user.value?.uid || ''
    };
    
    // Only add description if it has a value
    if (form.value.description && form.value.description.trim()) {
      resourceData.description = form.value.description.trim();
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
        description: '',
        collectionIds: [],
        contents: [],
        tags: []
      };
      tagsInput.value = '';
      selectedFile.value = null;
    }

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

const isYouTubeUrl = (url: string): boolean => {
  if (!url) return false;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/,
    /^[a-zA-Z0-9_-]{11}$/ // Just a YouTube video ID
  ];
  return patterns.some(pattern => pattern.test(url));
};

const getYouTubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  
  // Extract video ID from various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }
  
  // Check if it's already just a video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return `https://www.youtube.com/embed/${url}`;
  }
  
  return null;
};

const uploadFileToStorage = async (file: File, contentType?: ResourceType): Promise<string> => {
  // Check if user is authenticated
  if (!user.value?.uid) {
    throw new Error('User must be authenticated to upload files');
  }
  
  const storage = getStorage();
  // Determine folder based on content type
  let folder = 'files'; // default
  if (contentType === ResourceType.AUDIO) {
    folder = 'audio';
  } else if (contentType === ResourceType.VIDEO) {
    folder = 'media'; // videos go to media folder
  } else if (contentType === ResourceType.MUSIC_SHEET) {
    folder = 'files'; // music sheets go to files folder
  }
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
    default:
      return type;
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

const getFileName = (url: string): string => {
  if (!url) return '';
  
  // Extract filename from URL, handling Firebase URLs and regular URLs
  try {
    const urlObj = new URL(url);
    const pathName = urlObj.pathname;
    const segments = pathName.split('/');
    let filename = segments[segments.length - 1];
    
    // For Firebase URLs, remove query parameters and decode
    if (filename.includes('?')) {
      filename = filename.split('?')[0];
    }
    
    // Decode URI component
    filename = decodeURIComponent(filename);
    
    // Remove timestamp prefix if present (e.g., "1234567890_filename.pdf")
    if (filename.includes('_')) {
      const parts = filename.split('_');
      if (parts.length > 1 && /^\d+$/.test(parts[0])) {
        filename = parts.slice(1).join('_');
      }
    }
    
    return filename || 'Fichier';
  } catch (error) {
    // Fallback for invalid URLs
    const lastSlash = url.lastIndexOf('/');
    return lastSlash >= 0 ? url.substring(lastSlash + 1) : 'Fichier';
  }
};

const getPreviewText = (content: string): string => {
  if (!content) return '';
  
  // Get first few words (up to 50 characters)
  const preview = content.trim().substring(0, 50);
  return preview + (content.length > 50 ? '...' : '');
};

const hasPreview = (content: any): boolean => {
  const hasVideoPreview = content.type === ResourceType.VIDEO && content.url;
  const hasAudioPreview = content.type === ResourceType.AUDIO && content.url;
  const hasMusicSheetPreview = content.type === ResourceType.MUSIC_SHEET && content.url;
  const hasLyricsPreview = content.type === ResourceType.LYRICS && content.content;
  
  return hasVideoPreview || hasAudioPreview || hasMusicSheetPreview || hasLyricsPreview;
};

const getCollectionName = (collectionId: string): string => {
  const collection = collections.value.find(c => c.id === collectionId);
  return collection ? collection.name : 'Collection inconnue';
};

const toggleCollection = (collectionId: string) => {
  const index = form.value.collectionIds.indexOf(collectionId);
  if (index > -1) {
    form.value.collectionIds.splice(index, 1);
  } else {
    form.value.collectionIds.push(collectionId);
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

/* Media type buttons */
.media-type-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-top: 8px;
}

.media-type-button {
  --border-radius: 8px;
  font-size: 0.75rem;
  height: 60px;
  min-width: 0;
  flex: 1;
}

.button-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  pointer-events: none;
}

.button-content ion-icon {
  font-size: 1.5rem;
}

.button-content span {
  font-size: 0.7rem;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
}

@media (max-width: 600px) {
  .media-type-buttons {
    grid-template-columns: repeat(4, 1fr);
    gap: 3px;
  }
  
  .media-type-button {
    font-size: 0.6rem;
    height: 50px;
    min-width: 0;
  }
  
  .button-content span {
    font-size: 0.6rem;
  }
  
  .button-content ion-icon {
    font-size: 1.3rem;
  }
}

@media (max-width: 480px) {
  .media-type-buttons {
    grid-template-columns: repeat(4, 1fr);
    gap: 2px;
  }
  
  .media-type-button {
    height: 45px;
    font-size: 0.55rem;
    min-width: 0;
  }
  
  .button-content {
    gap: 2px;
  }
  
  .button-content span {
    font-size: 0.55rem;
    line-height: 0.9;
  }
  
  .button-content ion-icon {
    font-size: 1.1rem;
  }
}

@media (max-width: 360px) {
  .media-type-buttons {
    gap: 1px;
  }
  
  .media-type-button {
    height: 42px;
    font-size: 0.5rem;
  }
  
  .button-content span {
    font-size: 0.5rem;
    line-height: 0.8;
  }
  
  .button-content ion-icon {
    font-size: 1rem;
  }
}

/* Media preview styles */
.media-preview {
  margin: 8px 0;
  max-width: 100%;
}

.preview-video {
  width: 100%;
  max-width: 300px;
  height: auto;
  border-radius: 8px;
  background: var(--ion-color-light);
}

.preview-video[src*="youtube.com"] {
  aspect-ratio: 16/9;
  height: auto;
}

.preview-audio {
  width: 100%;
  max-width: 300px;
  height: 40px;
}

.file-preview, .lyrics-preview, .fallback-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: var(--ion-color-light);
  border-radius: 8px;
}

.file-name {
  flex: 1;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--ion-color-dark);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lyrics-text {
  flex: 1;
  font-size: 0.9rem;
  color: var(--ion-color-medium);
  font-style: italic;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fallback-url, .fallback-content {
  flex: 1;
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  word-break: break-all;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-preview ion-icon {
  font-size: 1.2rem;
  color: var(--ion-color-primary);
  flex-shrink: 0;
}

.lyrics-preview ion-icon {
  font-size: 1rem;
  color: var(--ion-color-medium);
}

@media (max-width: 480px) {
  .preview-video {
    max-width: 250px;
  }
  
  .preview-audio {
    max-width: 250px;
  }
  
  .file-name, .lyrics-text {
    font-size: 0.8rem;
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