<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="isEditMode ? `/resource-detail/${route.params.id}` : '/resources'"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ isEditMode ? 'Modifier la ressource' : 'Nouvelle ressource' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="saveResource" :disabled="!isFormValid || loading">
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

          <!-- Music Properties (collapsible) -->
          <ion-accordion-group class="music-accordion">
            <ion-accordion value="music-props">
              <ion-item slot="header" color="light">
                <ion-icon :icon="musicalNotesOutline" slot="start" />
                <ion-label>Propriétés musicales</ion-label>
                <ion-badge v-if="filledMusicFieldsCount > 0" color="primary" slot="end">{{ filledMusicFieldsCount }}/4</ion-badge>
              </ion-item>
              <div slot="content" class="music-properties-form">
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
            </ion-accordion>
          </ion-accordion-group>

          <!-- Notes -->
          <ion-item>
            <ion-label position="stacked">Notes</ion-label>
            <ion-textarea
              v-model="form.notes"
              placeholder="Notes, instructions ou informations supplémentaires..."
              :rows="4"
            ></ion-textarea>
          </ion-item>

          <!-- Tags - Hidden for now, will be re-enabled later -->
        </ion-list>

        <!-- Content/Media Section -->
        <div class="content-section">
          <div class="section-header">
            <h3>Contenu</h3>
          </div>

          <!-- Added content items -->
          <div v-if="form.contents.length > 0" class="content-items">
            <div v-for="(media, index) in form.contents" :key="index" class="content-card">
              <ion-icon :icon="getContentTypeIcon(media.type)" class="content-type-icon" />
              <div class="content-card-info">
                <span class="content-type-label">{{ getContentTypeLabel(media.type) }}</span>
                <span class="content-preview">{{ getContentPreview(media) }}</span>
              </div>
              <ion-button fill="clear" size="small" color="danger" @click="removeContent(index)">
                <ion-icon :icon="trashOutline" slot="icon-only" />
              </ion-button>
            </div>
          </div>

          <!-- Inline lyrics editor -->
          <div v-if="showLyricsInput" class="inline-content-input">
            <ion-item>
              <ion-label position="stacked">Paroles</ion-label>
              <ion-textarea
                v-model="lyricsInput"
                placeholder="Saisissez les paroles..."
                :rows="6"
                :auto-grow="true"
              ></ion-textarea>
            </ion-item>
            <div class="inline-actions">
              <ion-button size="small" fill="outline" @click="cancelLyricsInput">Annuler</ion-button>
              <ion-button size="small" @click="confirmLyricsInput" :disabled="!lyricsInput.trim()">Ajouter</ion-button>
            </div>
          </div>

          <!-- Inline URL input -->
          <div v-if="showUrlInput" class="inline-content-input">
            <ion-item>
              <ion-label position="stacked">URL</ion-label>
              <ion-input
                v-model="urlInput"
                placeholder="https://..."
                type="url"
              ></ion-input>
            </ion-item>
            <div class="inline-actions">
              <ion-button size="small" fill="outline" @click="cancelUrlInput">Annuler</ion-button>
              <ion-button size="small" @click="confirmUrlInput" :disabled="!urlInput.trim()">Ajouter</ion-button>
            </div>
          </div>

          <!-- Inline YouTube search -->
          <div v-if="showYoutubeSearch" class="inline-content-input youtube-search-container">
            <div class="inline-actions" style="margin-top: 0; margin-bottom: 8px;">
              <ion-button size="small" fill="outline" @click="cancelYoutubeInput">Annuler</ion-button>
            </div>
            <NaturalResourceSelector :select-only="true" @video-selected="handleYoutubeVideoSelected" />
          </div>

          <!-- Inline file upload -->
          <div v-if="showFileUpload" class="inline-content-input">
            <ion-item>
              <ion-label position="stacked">{{ getContentTypeLabel(fileUploadType) }}</ion-label>
              <input
                ref="fileInput"
                type="file"
                :accept="getFileAccept(fileUploadType)"
                @change="handleFileSelected"
                class="file-input"
              />
            </ion-item>
            <div class="inline-actions">
              <ion-button size="small" fill="outline" @click="cancelFileUpload">Annuler</ion-button>
            </div>
          </div>

          <!-- Add content button -->
          <ion-button
            v-if="!showLyricsInput && !showUrlInput && !showYoutubeSearch && !showFileUpload"
            @click="showContentTypePicker = true"
            fill="outline"
            expand="block"
            class="add-content-btn"
          >
            <ion-icon :icon="addCircleOutline" slot="start" />
            Ajouter du contenu
          </ion-button>
        </div>

        <!-- Content Type Action Sheet -->
        <ion-action-sheet
          :is-open="showContentTypePicker"
          header="Type de contenu"
          :buttons="contentTypeButtons"
          @didDismiss="showContentTypePicker = false"
        ></ion-action-sheet>
        
      </div>

      <!-- Collection Selector Modal (with embedded create form) -->
      <ion-modal :is-open="showCollectionSelector" @didDismiss="closeCollectionSelector">
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start" v-if="showInlineCreateCollection">
              <ion-button @click="showInlineCreateCollection = false">
                <ion-icon :icon="arrowBackOutline" slot="icon-only" />
              </ion-button>
            </ion-buttons>
            <ion-title>{{ showInlineCreateCollection ? 'Nouvelle collection' : 'Collection' }}</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeCollectionSelector">
                <ion-icon :icon="closeOutline" slot="icon-only" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <!-- Collection list view -->
          <div v-if="!showInlineCreateCollection" class="collection-modal-content">
            <ion-button
              v-if="isAdmin"
              @click="showInlineCreateCollection = true"
              expand="block"
              fill="outline"
              class="new-collection-btn"
            >
              <ion-icon :icon="addOutline" slot="start" />
              Nouvelle collection
            </ion-button>

            <ion-list class="collection-list" lines="full">
              <ion-item
                v-for="collection in collections"
                :key="collection.id"
                button
                @click="selectCollection(collection.id)"
                class="collection-item"
                :class="{ 'collection-item--selected': form.collectionId === collection.id }"
              >
                <div slot="start" class="collection-avatar" :style="{ backgroundColor: collection.color }">
                  {{ collection.symbol }}
                </div>
                <ion-label>
                  <h3>{{ collection.name }}</h3>
                  <p v-if="collection.description">{{ collection.description }}</p>
                </ion-label>
                <ion-icon
                  v-if="form.collectionId === collection.id"
                  :icon="checkmarkCircle"
                  slot="end"
                  color="primary"
                  class="collection-check"
                />
              </ion-item>
            </ion-list>

            <div v-if="collections.length === 0" class="empty-state ion-text-center">
              <ion-icon :icon="folderOutline" size="large" color="medium" />
              <h2>Aucune collection</h2>
              <p v-if="isAdmin">Créez votre première collection pour organiser vos ressources.</p>
              <p v-else>Aucune collection disponible.</p>
              <ion-button v-if="isAdmin" @click="showInlineCreateCollection = true" fill="outline">
                <ion-icon :icon="addOutline" slot="start" />
                Nouvelle collection
              </ion-button>
            </div>
          </div>

          <!-- Inline create collection form -->
          <div v-else class="collection-modal-content">
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
  IonAccordionGroup, IonAccordion, IonBadge, IonChip, IonActionSheet,
  toastController
} from '@ionic/vue';
import {
  checkmarkOutline, addOutline, folderOutline, checkmarkCircle, ellipseOutline,
  musicalNotesOutline, addCircleOutline, closeCircleOutline,
  documentTextOutline, logoYoutube, volumeHighOutline, videocamOutline,
  documentOutline, linkOutline, trashOutline, arrowBackOutline, closeOutline
} from 'ionicons/icons';
import { Resource, ResourceMedia, ResourceCollection, CollectionType, ResourceOption, ResourceType } from '@/types/resource';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
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
import NaturalResourceSelector from '@/components/NaturalResourceSelector.vue';

const route = useRoute();
const router = useRouter();
const { user, isAdmin } = useUser();

const loading = ref(false);
const collections = ref<ResourceCollection[]>([]);
const showCollectionSelector = ref(false);
const showInlineCreateCollection = ref(false);

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

// Content/media inline state
const showContentTypePicker = ref(false);
const showLyricsInput = ref(false);
const showUrlInput = ref(false);
const showYoutubeSearch = ref(false);
const showFileUpload = ref(false);
const fileUploadType = ref<ResourceType>(ResourceType.FILE);
const lyricsInput = ref('');
const urlInput = ref('');
const fileInput = ref<HTMLInputElement | null>(null);

const isEditMode = computed(() => !!route.params.id);

const isFormValid = computed(() => {
  return form.value.title && form.value.title.trim().length > 0;
});

const filledMusicFieldsCount = computed(() => {
  let count = 0;
  if (form.value.musicKey) count++;
  if (form.value.musicBeat) count++;
  if (form.value.musicTempo) count++;
  if (form.value.musicStyle) count++;
  return count;
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
    
    let resourceId: string;

    if (isEditMode.value) {
      resourceId = route.params.id as string;
      console.log('Updating resource with ID:', resourceId);
      await updateResource(resourceId, resourceData);
    } else {
      console.log('Creating new resource...');
      resourceId = await createResource(resourceData as Omit<Resource, 'id' | 'createdAt' | 'updatedAt' | 'viewCount'>);
      console.log('Resource created with ID:', resourceId);
    }

    const toast = await toastController.create({
      message: isEditMode.value ? 'Ressource modifiée' : 'Ressource créée',
      duration: 2000,
      color: 'success'
    });
    await toast.present();

    // Navigate to the resource detail page
    router.push(`/resource-detail/${resourceId}`);
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
    showInlineCreateCollection.value = false;
    showCollectionSelector.value = false;
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

const closeCollectionSelector = () => {
  showCollectionSelector.value = false;
  showInlineCreateCollection.value = false;
};

// Content type helpers
const getContentTypeIcon = (type: ResourceType | string): string => {
  switch (type) {
    case ResourceType.LYRICS: return documentTextOutline;
    case ResourceType.YOUTUBE: return logoYoutube;
    case ResourceType.AUDIO: return volumeHighOutline;
    case ResourceType.VIDEO: return videocamOutline;
    case ResourceType.MUSIC_SHEET: return musicalNotesOutline;
    case ResourceType.FILE: return documentOutline;
    default: return linkOutline;
  }
};

const getContentTypeLabel = (type: ResourceType | string): string => {
  switch (type) {
    case ResourceType.LYRICS: return 'Paroles';
    case ResourceType.YOUTUBE: return 'YouTube';
    case ResourceType.AUDIO: return 'Audio';
    case ResourceType.VIDEO: return 'Vidéo';
    case ResourceType.MUSIC_SHEET: return 'Partition';
    case ResourceType.FILE: return 'Fichier';
    case ResourceType.SPOTIFY: return 'Spotify';
    default: return 'URL';
  }
};

const getContentPreview = (media: ResourceMedia): string => {
  if (media.content) return media.content.substring(0, 60) + (media.content.length > 60 ? '...' : '');
  if (media.url) return media.url.substring(0, 60) + (media.url.length > 60 ? '...' : '');
  return '';
};

const getFileAccept = (type: ResourceType): string => {
  switch (type) {
    case ResourceType.AUDIO: return 'audio/*';
    case ResourceType.VIDEO: return 'video/*';
    case ResourceType.MUSIC_SHEET: return 'application/pdf';
    case ResourceType.FILE: return '*/*';
    default: return '*/*';
  }
};

const removeContent = (index: number) => {
  form.value.contents.splice(index, 1);
};

// Content type picker buttons
const contentTypeButtons = computed(() => [
  { text: 'Paroles', icon: documentTextOutline, handler: () => { showLyricsInput.value = true; } },
  { text: 'YouTube', icon: logoYoutube, handler: () => { showYoutubeSearch.value = true; } },
  { text: 'Audio', icon: volumeHighOutline, handler: () => { fileUploadType.value = ResourceType.AUDIO; showFileUpload.value = true; } },
  { text: 'Vidéo', icon: videocamOutline, handler: () => { fileUploadType.value = ResourceType.VIDEO; showFileUpload.value = true; } },
  { text: 'Partition (PDF)', icon: musicalNotesOutline, handler: () => { fileUploadType.value = ResourceType.MUSIC_SHEET; showFileUpload.value = true; } },
  { text: 'Fichier', icon: documentOutline, handler: () => { fileUploadType.value = ResourceType.FILE; showFileUpload.value = true; } },
  { text: 'URL', icon: linkOutline, handler: () => { showUrlInput.value = true; } },
  { text: 'Annuler', role: 'cancel' }
]);

// Lyrics
const confirmLyricsInput = () => {
  if (!lyricsInput.value.trim()) return;
  form.value.contents.push({
    type: ResourceType.LYRICS,
    content: lyricsInput.value.trim(),
    createdAt: new Date().toISOString()
  });
  lyricsInput.value = '';
  showLyricsInput.value = false;
};

const cancelLyricsInput = () => {
  lyricsInput.value = '';
  showLyricsInput.value = false;
};

// URL
const confirmUrlInput = () => {
  if (!urlInput.value.trim()) return;
  form.value.contents.push({
    type: ResourceType.FILE,
    url: urlInput.value.trim(),
    createdAt: new Date().toISOString()
  });
  urlInput.value = '';
  showUrlInput.value = false;
};

const cancelUrlInput = () => {
  urlInput.value = '';
  showUrlInput.value = false;
};

// YouTube
const handleYoutubeVideoSelected = (video: { videoId: string; title: string; thumbnail: string; channel: string; videoUrl: string; lyrics: string | null }) => {
  form.value.contents.push({
    type: ResourceType.YOUTUBE,
    url: video.videoUrl,
    thumbnailUrl: video.thumbnail,
    notes: video.title,
    createdAt: new Date().toISOString()
  });
  if (video.lyrics) {
    form.value.contents.push({
      type: ResourceType.LYRICS,
      content: video.lyrics,
      createdAt: new Date().toISOString()
    });
  }
  showYoutubeSearch.value = false;
};

const cancelYoutubeInput = () => {
  showYoutubeSearch.value = false;
};

// File upload
const handleFileSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  loading.value = true;
  try {
    const storage = getStorage();
    const filePath = `resources/${user.value?.uid}/${Date.now()}_${file.name}`;
    const fileRef = storageRef(storage, filePath);
    await uploadBytes(fileRef, file);
    const downloadUrl = await getDownloadURL(fileRef);

    form.value.contents.push({
      type: fileUploadType.value,
      url: downloadUrl,
      mimeType: file.type,
      fileSize: file.size,
      notes: file.name,
      createdAt: new Date().toISOString()
    });

    const toast = await toastController.create({
      message: 'Fichier uploadé',
      duration: 1500,
      color: 'success'
    });
    await toast.present();
  } catch (error) {
    console.error('Error uploading file:', error);
    const toast = await toastController.create({
      message: 'Erreur lors de l\'upload du fichier',
      duration: 2000,
      color: 'danger'
    });
    await toast.present();
  } finally {
    loading.value = false;
    showFileUpload.value = false;
  }
};

const cancelFileUpload = () => {
  showFileUpload.value = false;
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

/* Collection modal */
.collection-modal-content {
  padding: 16px;
}

.new-collection-btn {
  margin-bottom: 16px;
}

/* Music accordion */
.music-accordion {
  margin-top: 0.5rem;
}

/* Music properties form */
.music-properties-form {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0;
  padding: 0.5rem 0;
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

.collection-list {
  padding: 0;
}

.collection-item {
  --padding-start: 16px;
  --inner-padding-end: 16px;
}

.collection-item--selected {
  --background: var(--ion-color-primary-tint);
}

.collection-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 0.8rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.collection-check {
  font-size: 1.4rem;
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

/* Content section */
.content-section {
  margin-top: 1.5rem;
  padding: 0 1rem;
}

.section-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--ion-color-dark);
  margin: 0 0 0.75rem 0;
}

.content-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.content-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--ion-color-light);
  border-radius: 8px;
}

.content-type-icon {
  font-size: 1.25rem;
  color: var(--ion-color-primary);
  flex-shrink: 0;
}

.content-card-info {
  flex: 1;
  min-width: 0;
}

.content-type-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--ion-color-dark);
}

.content-preview {
  display: block;
  font-size: 0.75rem;
  color: var(--ion-color-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.inline-content-input {
  margin-bottom: 12px;
  padding: 12px;
  background: var(--ion-color-light);
  border-radius: 8px;
}

.inline-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.add-content-btn {
  margin-top: 4px;
}

.file-input {
  padding: 8px 0;
  width: 100%;
}

</style>