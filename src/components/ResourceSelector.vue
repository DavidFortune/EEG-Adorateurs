<template>
  <div class="resource-selector">
    <!-- Single selection mode: show selected resource -->
    <template v-if="!modalOnly">
      <div class="selected-resource" v-if="selectedResource">
        <h4>Ressource liée</h4>
        <div class="selected-resource-item">
          <div class="resource-info">
            <div class="resource-avatar">
              <span>{{ getResourceTypeIcon(selectedResource) }}</span>
            </div>
            <div class="resource-details">
              <span class="resource-title">{{ selectedResource.title }}</span>
              <span class="resource-types">{{ getResourceTypeList(selectedResource) }}</span>
            </div>
          </div>
          <ion-button
            @click="removeResource()"
            fill="clear"
            size="small"
            color="danger"
          >
            <ion-icon :icon="closeOutline" slot="icon-only" />
          </ion-button>
        </div>
      </div>

      <div class="resource-search">
        <ion-button
          @click="openResourceModal"
          :fill="buttonFill"
          :size="buttonSize"
          :disabled="loading"
        >
          <ion-icon :icon="addOutline" slot="start" />
          {{ modelValue ? 'Changer la ressource' : 'Lier une ressource' }}
        </ion-button>
      </div>
    </template>

    <!-- Resource Selection Modal -->
    <ion-modal :is-open="actualModalOpen" @will-dismiss="closeResourceModal">
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start" v-if="mode === 'create'">
            <ion-button @click="backToBrowse">
              <ion-icon :icon="arrowBackOutline" slot="icon-only" />
            </ion-button>
          </ion-buttons>
          <ion-title>{{ mode === 'browse' ? 'Sélectionner une ressource' : 'Créer une ressource' }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeResourceModal" fill="clear">
              <ion-icon :icon="closeOutline" />
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content>
        <div class="modal-content">
          <!-- Browse View -->
          <template v-if="mode === 'browse'">
            <!-- Search Bar -->
            <ion-searchbar
              v-model="searchQuery"
              placeholder="Rechercher une ressource..."
              :debounce="300"
            />

            <!-- Collection Filter Dropdown -->
            <div class="filter-section" v-if="collections.length > 0">
              <ion-select
                :value="selectedCollectionId"
                @ion-change="(e: CustomEvent) => selectedCollectionId = e.detail.value"
                placeholder="Toutes les collections"
                interface="action-sheet"
                :interface-options="{ header: 'Filtrer par collection' }"
              >
                <ion-select-option value="">Toutes les collections</ion-select-option>
                <ion-select-option
                  v-for="collection in collections"
                  :key="collection.id"
                  :value="collection.id"
                >
                  {{ collection.symbol }} {{ collection.name }}
                </ion-select-option>
              </ion-select>
            </div>

            <!-- Resource List -->
            <div class="resource-list">
              <ion-loading :is-open="loading" message="Chargement..."></ion-loading>

              <div
                v-for="resource in filteredResources"
                :key="resource.id"
                class="resource-item"
                :class="{ 'selected': isResourceSelected(resource.id) }"
                @click="toggleResource(resource)"
              >
                <div class="resource-content">
                  <div class="resource-avatar">
                    <span>{{ getResourceTypeIcon(resource) }}</span>
                  </div>
                  <div class="resource-info">
                    <h4 class="resource-title">{{ resource.title }}</h4>
                    <div class="resource-meta">
                      <span class="resource-types">{{ getResourceTypeList(resource) }}</span>
                      <span class="resource-collections" v-if="getResourceCollectionNames(resource).length > 0">
                        {{ getResourceCollectionNames(resource).join(', ') }}
                      </span>
                    </div>
                  </div>
                  <div class="resource-actions">
                    <ion-button
                      v-if="getYouTubeVideoId(resource)"
                      @click.stop="previewYouTubeVideo(resource)"
                      fill="clear"
                      size="small"
                      color="danger"
                    >
                      <ion-icon :icon="playCircleOutline" slot="icon-only" />
                    </ion-button>
                    <ion-icon
                      :icon="isResourceSelected(resource.id) ? checkmarkCircle : ellipseOutline"
                      :color="isResourceSelected(resource.id) ? 'primary' : 'medium'"
                      class="selection-icon"
                    />
                  </div>
                </div>
              </div>

              <div v-if="filteredResources.length === 0 && !loading" class="no-resources">
                <ion-icon :icon="documentOutline" />
                <p>Aucune ressource trouvée</p>
              </div>
            </div>

            <!-- Create Resource Button -->
            <ion-button
              @click="switchToCreate"
              expand="block"
              fill="outline"
              class="create-resource-btn"
            >
              <ion-icon :icon="addOutline" slot="start" />
              Créer une ressource
            </ion-button>
          </template>

          <!-- Create View -->
          <template v-if="mode === 'create'">
            <div class="create-form">
              <!-- Title -->
              <ion-item class="form-item">
                <ion-label position="stacked">Titre *</ion-label>
                <ion-input
                  v-model="createForm.title"
                  placeholder="Ex: Gloire à Dieu"
                  :disabled="creatingResource"
                />
              </ion-item>

              <!-- Collection -->
              <ion-item class="form-item">
                <ion-label position="stacked">Collection *</ion-label>
                <ion-select
                  v-model="createForm.collectionId"
                  placeholder="Sélectionner une collection"
                  interface="action-sheet"
                  :interface-options="{ header: 'Collection' }"
                  :disabled="creatingResource"
                >
                  <ion-select-option
                    v-for="collection in collections"
                    :key="collection.id"
                    :value="collection.id"
                  >
                    {{ collection.symbol }} {{ collection.name }}
                  </ion-select-option>
                </ion-select>
              </ion-item>

              <!-- Reference -->
              <ion-item class="form-item">
                <ion-label position="stacked">Référence</ion-label>
                <ion-input
                  v-model="createForm.reference"
                  placeholder="Ex: Psaume 23, #145"
                  :disabled="creatingResource"
                />
              </ion-item>

              <!-- Music Properties (collapsible) -->
              <ion-accordion-group class="music-accordion">
                <ion-accordion value="music">
                  <ion-item slot="header">
                    <ion-label>Propriétés musicales</ion-label>
                    <ion-badge v-if="filledMusicCount > 0" slot="end" color="primary">{{ filledMusicCount }}/4</ion-badge>
                  </ion-item>
                  <div slot="content" class="music-fields">
                    <ion-item class="form-item">
                      <ion-label position="stacked">Tonalité</ion-label>
                      <ion-select
                        v-model="createForm.musicKey"
                        placeholder="Aucune"
                        interface="action-sheet"
                        :disabled="creatingResource"
                      >
                        <ion-select-option value="">Aucune</ion-select-option>
                        <ion-select-option v-for="option in musicKeys" :key="option.id" :value="option.id">
                          {{ option.name }}
                        </ion-select-option>
                      </ion-select>
                    </ion-item>
                    <ion-item class="form-item">
                      <ion-label position="stacked">Mesure</ion-label>
                      <ion-select
                        v-model="createForm.musicBeat"
                        placeholder="Aucune"
                        interface="action-sheet"
                        :disabled="creatingResource"
                      >
                        <ion-select-option value="">Aucune</ion-select-option>
                        <ion-select-option v-for="option in musicBeats" :key="option.id" :value="option.id">
                          {{ option.name }}
                        </ion-select-option>
                      </ion-select>
                    </ion-item>
                    <ion-item class="form-item">
                      <ion-label position="stacked">Tempo</ion-label>
                      <ion-select
                        v-model="createForm.musicTempo"
                        placeholder="Aucun"
                        interface="action-sheet"
                        :disabled="creatingResource"
                      >
                        <ion-select-option value="">Aucun</ion-select-option>
                        <ion-select-option v-for="option in musicTempos" :key="option.id" :value="option.id">
                          {{ option.name }}
                        </ion-select-option>
                      </ion-select>
                    </ion-item>
                    <ion-item class="form-item">
                      <ion-label position="stacked">Style</ion-label>
                      <ion-select
                        v-model="createForm.musicStyle"
                        placeholder="Aucun"
                        interface="action-sheet"
                        :disabled="creatingResource"
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

              <!-- Content Section -->
              <div class="content-section">
                <label class="section-label">Médias</label>

                <!-- Existing content items -->
                <div v-for="(media, index) in createForm.contents" :key="index" class="content-item">
                  <div class="content-item-info">
                    <span class="content-type-label">{{ getContentTypeLabel(media.type) }}</span>
                    <span class="content-preview">{{ getContentPreview(media) }}</span>
                  </div>
                  <ion-button fill="clear" size="small" color="danger" @click="removeContent(index)">
                    <ion-icon :icon="trashOutline" slot="icon-only" />
                  </ion-button>
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

                <!-- Add content button -->
                <ion-button
                  v-if="!showLyricsInput && !showUrlInput && !showYoutubeSearch"
                  @click="showContentTypePicker = true"
                  fill="outline"
                  expand="block"
                  class="add-content-btn"
                  :disabled="creatingResource"
                >
                  <ion-icon :icon="addCircleOutline" slot="start" />
                  Ajouter un média
                </ion-button>
              </div>

              <!-- Content Type Action Sheet -->
              <ion-action-sheet
                :is-open="showContentTypePicker"
                header="Type de média"
                :buttons="contentTypeButtons"
                @didDismiss="showContentTypePicker = false"
              ></ion-action-sheet>
            </div>
          </template>
        </div>
      </ion-content>

      <ion-footer>
        <ion-toolbar>
          <div class="modal-actions" v-if="mode === 'browse'">
            <ion-button @click="closeResourceModal" fill="outline" color="medium">
              Annuler
            </ion-button>
            <ion-button @click="confirmSelection" :disabled="!hasSelection">
              {{ multiple ? `Confirmer (${selectionCount})` : 'Confirmer' }}
            </ion-button>
          </div>
          <div class="modal-actions" v-else>
            <ion-button @click="backToBrowse" fill="outline" color="medium">
              Annuler
            </ion-button>
            <ion-button
              @click="handleCreateResource"
              :disabled="!createForm.title.trim() || !createForm.collectionId || creatingResource"
            >
              <ion-spinner v-if="creatingResource" name="crescent" slot="start" />
              {{ creatingResource ? 'Création...' : 'Créer et lier' }}
            </ion-button>
          </div>
        </ion-toolbar>
      </ion-footer>
    </ion-modal>

    <!-- YouTube Preview Modal -->
    <ion-modal :is-open="showYouTubePreview" @will-dismiss="closeYouTubePreview">
      <ion-header>
        <ion-toolbar>
          <ion-title>Aperçu vidéo</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeYouTubePreview">
              <ion-icon :icon="closeOutline" />
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <div class="youtube-preview-container" v-if="previewingResource">
          <iframe
            :src="`https://www.youtube.com/embed/${getYouTubeVideoId(previewingResource)}`"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            class="youtube-iframe"
          ></iframe>
          <div class="preview-info">
            <h3>{{ previewingResource.title }}</h3>
          </div>
        </div>
      </ion-content>
      <ion-footer>
        <ion-toolbar>
          <div class="preview-actions">
            <ion-button @click="closeYouTubePreview" fill="outline" color="medium">
              Fermer
            </ion-button>
            <ion-button @click="selectPreviewedResource">
              <ion-icon :icon="checkmarkCircle" slot="start" />
              Sélectionner
            </ion-button>
          </div>
        </ion-toolbar>
      </ion-footer>
    </ion-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import {
  IonButton, IonIcon, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonContent, IonFooter, IonSearchbar, IonSelect, IonSelectOption, IonLabel,
  IonLoading, IonItem, IonInput, IonTextarea, IonSpinner, IonAccordion,
  IonAccordionGroup, IonBadge, IonActionSheet, toastController
} from '@ionic/vue';
import {
  addOutline, closeOutline, checkmarkCircle, ellipseOutline, documentOutline,
  playCircleOutline, arrowBackOutline, addCircleOutline, trashOutline,
  documentTextOutline, logoYoutube, linkOutline
} from 'ionicons/icons';
import { ResourceType, type Resource, type ResourceCollection, type ResourceMedia, type ResourceOption } from '@/types/resource';
import { getResources, getResourceCollections, createResource, getAllResourceOptions } from '@/firebase/resources';
import NaturalResourceSelector from '@/components/NaturalResourceSelector.vue';
import { useUser } from '@/composables/useUser';

interface Props {
  modelValue?: string | null;
  selectedIds?: string[];
  excludeIds?: string[];
  multiple?: boolean;
  modalOnly?: boolean;
  isOpen?: boolean;
  buttonFill?: 'clear' | 'outline' | 'solid';
  buttonSize?: 'small' | 'default' | 'large';
}

interface Emits {
  (event: 'update:modelValue', value: string | null): void;
  (event: 'update:selectedIds', value: string[]): void;
  (event: 'update:isOpen', value: boolean): void;
  (event: 'confirm', selectedIds: string[]): void;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  selectedIds: () => [],
  excludeIds: () => [],
  multiple: false,
  modalOnly: false,
  isOpen: false,
  buttonFill: 'outline',
  buttonSize: 'default'
});
const emit = defineEmits<Emits>();

const { user } = useUser();

// Component state
const isModalOpen = ref(false);
const loading = ref(false);
const searchQuery = ref('');
const selectedCollectionId = ref('');
const mode = ref<'browse' | 'create'>('browse');

// Create form state
const createForm = ref({
  title: '',
  collectionId: '',
  reference: '',
  musicKey: '',
  musicBeat: '',
  musicTempo: '',
  musicStyle: '',
  contents: [] as ResourceMedia[]
});
const creatingResource = ref(false);

// Content input state
const showLyricsInput = ref(false);
const showUrlInput = ref(false);
const showYoutubeSearch = ref(false);
const showContentTypePicker = ref(false);
const lyricsInput = ref('');
const urlInput = ref('');

// Music options
const musicKeys = ref<ResourceOption[]>([]);
const musicBeats = ref<ResourceOption[]>([]);
const musicTempos = ref<ResourceOption[]>([]);
const musicStyles = ref<ResourceOption[]>([]);

// Data
const resources = ref<Resource[]>([]);
const collections = ref<ResourceCollection[]>([]);
const tempSelectedId = ref<string | null>(null);
const tempSelectedIds = ref<string[]>([]);

// YouTube preview state
const showYouTubePreview = ref(false);
const previewingResource = ref<Resource | null>(null);

// Computed for modal open state (internal or external control)
const actualModalOpen = computed(() => props.modalOnly ? props.isOpen : isModalOpen.value);

// Computed
const selectedResource = computed(() => {
  if (!props.modelValue) return null;
  return resources.value.find(resource => resource.id === props.modelValue) || null;
});

const filteredResources = computed(() => {
  let filtered = resources.value;

  // Exclude already selected/linked resources
  if (props.excludeIds.length > 0) {
    filtered = filtered.filter(resource => !props.excludeIds.includes(resource.id));
  }

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(resource =>
      resource.title.toLowerCase().includes(query) ||
      resource.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }

  // Filter by collection
  if (selectedCollectionId.value) {
    filtered = filtered.filter(resource =>
      resource.collectionId === selectedCollectionId.value
    );
  }

  return filtered;
});

// Computed: selection count for multi-select mode
const selectionCount = computed(() => tempSelectedIds.value.length);

const filledMusicCount = computed(() => {
  let count = 0;
  if (createForm.value.musicKey) count++;
  if (createForm.value.musicBeat) count++;
  if (createForm.value.musicTempo) count++;
  if (createForm.value.musicStyle) count++;
  return count;
});

const contentTypeButtons = computed(() => [
  { text: 'Paroles', icon: documentTextOutline, handler: () => { showLyricsInput.value = true; } },
  { text: 'YouTube', icon: logoYoutube, handler: () => { showYoutubeSearch.value = true; } },
  { text: 'URL', icon: linkOutline, handler: () => { showUrlInput.value = true; } },
  { text: 'Annuler', role: 'cancel' as const }
]);

// Methods
const openResourceModal = async () => {
  tempSelectedId.value = props.modelValue ?? null;
  tempSelectedIds.value = [...props.selectedIds];
  isModalOpen.value = true;
  await loadResources();
};

const closeResourceModal = () => {
  isModalOpen.value = false;
  emit('update:isOpen', false);
  searchQuery.value = '';
  selectedCollectionId.value = '';
  tempSelectedId.value = null;
  tempSelectedIds.value = [];
  mode.value = 'browse';
  resetCreateForm();
};

const loadResources = async () => {
  try {
    loading.value = true;
    const [resourcesData, collectionsData] = await Promise.all([
      getResources(),
      getResourceCollections()
    ]);
    resources.value = resourcesData;
    collections.value = collectionsData;
  } catch (error) {
    console.error('Error loading resources:', error);
  } finally {
    loading.value = false;
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

const toggleResource = (resource: Resource) => {
  if (props.multiple) {
    const index = tempSelectedIds.value.indexOf(resource.id);
    if (index === -1) {
      tempSelectedIds.value.push(resource.id);
    } else {
      tempSelectedIds.value.splice(index, 1);
    }
  } else {
    if (tempSelectedId.value === resource.id) {
      tempSelectedId.value = null;
    } else {
      tempSelectedId.value = resource.id;
    }
  }
};

const isResourceSelected = (resourceId: string) => {
  if (props.multiple) {
    return tempSelectedIds.value.includes(resourceId);
  }
  return tempSelectedId.value === resourceId;
};

const confirmSelection = () => {
  if (props.multiple) {
    emit('update:selectedIds', [...tempSelectedIds.value]);
    emit('confirm', [...tempSelectedIds.value]);
  } else {
    emit('update:modelValue', tempSelectedId.value);
  }
  closeResourceModal();
};

const hasSelection = computed(() => {
  if (props.multiple) {
    return tempSelectedIds.value.length > 0;
  }
  return tempSelectedId.value !== null;
});

const removeResource = () => {
  emit('update:modelValue', null);
};

// Mode switching
const switchToCreate = () => {
  mode.value = 'create';
  loadMusicOptions();
};

const backToBrowse = () => {
  mode.value = 'browse';
  resetCreateForm();
};

const resetCreateForm = () => {
  createForm.value = {
    title: '',
    collectionId: '',
    reference: '',
    musicKey: '',
    musicBeat: '',
    musicTempo: '',
    musicStyle: '',
    contents: []
  };
  showLyricsInput.value = false;
  showUrlInput.value = false;
  showYoutubeSearch.value = false;
  showContentTypePicker.value = false;
  lyricsInput.value = '';
  urlInput.value = '';
};

// Content management
const getContentTypeLabel = (type: ResourceType | string): string => {
  const labels: Record<string, string> = {
    lyrics: 'Paroles',
    youtube: 'YouTube',
    file: 'URL',
    audio: 'Audio',
    video: 'Vidéo',
    music_sheet: 'Partition',
    spotify: 'Spotify'
  };
  return labels[type] || type;
};

const getContentPreview = (media: ResourceMedia): string => {
  if (media.content) return media.content.substring(0, 50) + (media.content.length > 50 ? '...' : '');
  if (media.url) return media.url.substring(0, 50) + (media.url.length > 50 ? '...' : '');
  if (media.notes) return media.notes.substring(0, 50) + (media.notes.length > 50 ? '...' : '');
  return '';
};

const removeContent = (index: number) => {
  createForm.value.contents.splice(index, 1);
};

const confirmLyricsInput = () => {
  if (!lyricsInput.value.trim()) return;
  createForm.value.contents.push({
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

const confirmUrlInput = () => {
  if (!urlInput.value.trim()) return;
  createForm.value.contents.push({
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

const handleYoutubeVideoSelected = (video: { videoId: string; title: string; thumbnail: string; channel: string; videoUrl: string; lyrics: string | null }) => {
  createForm.value.contents.push({
    type: ResourceType.YOUTUBE,
    url: video.videoUrl,
    thumbnailUrl: video.thumbnail,
    notes: video.title,
    createdAt: new Date().toISOString()
  });
  if (video.lyrics) {
    createForm.value.contents.push({
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

// Create resource handler
const showToast = async (message: string, color: string = 'primary') => {
  const toast = await toastController.create({
    message,
    duration: 2000,
    color,
    position: 'bottom'
  });
  await toast.present();
};

const handleCreateResource = async () => {
  if (!createForm.value.title.trim()) {
    await showToast('Veuillez entrer un titre', 'warning');
    return;
  }
  if (!createForm.value.collectionId) {
    await showToast('Veuillez sélectionner une collection', 'warning');
    return;
  }

  creatingResource.value = true;
  try {
    const resourceData: any = {
      title: createForm.value.title.trim(),
      collectionId: createForm.value.collectionId,
      contents: createForm.value.contents,
      createdBy: user.value?.uid || '',
      updatedBy: user.value?.uid || ''
    };

    if (createForm.value.reference?.trim()) {
      resourceData.reference = createForm.value.reference.trim();
    }
    if (createForm.value.musicKey) resourceData.musicKey = createForm.value.musicKey;
    if (createForm.value.musicBeat) resourceData.musicBeat = createForm.value.musicBeat;
    if (createForm.value.musicTempo) resourceData.musicTempo = createForm.value.musicTempo;
    if (createForm.value.musicStyle) resourceData.musicStyle = createForm.value.musicStyle;

    const newResourceId = await createResource(resourceData);

    // Reload and auto-select
    await loadResources();
    tempSelectedId.value = newResourceId;
    mode.value = 'browse';
    resetCreateForm();

    await showToast('Ressource créée avec succès', 'success');
  } catch (error) {
    console.error('Error creating resource:', error);
    await showToast('Erreur lors de la création', 'danger');
  } finally {
    creatingResource.value = false;
  }
};

// Resource display helpers
const getResourceTypeIcon = (resource: Resource) => {
  if (resource.contents.length === 0) return '📄';

  const types = resource.contents.map(content => content.type);
  if (types.includes('lyrics' as ResourceType)) return '🎵';
  if (types.includes('video' as ResourceType)) return '🎥';
  if (types.includes('audio' as ResourceType)) return '🔊';
  if (types.includes('music_sheet' as ResourceType)) return '🎼';
  return '📄';
};

const getResourceTypeList = (resource: Resource) => {
  const typeNames: Record<ResourceType, string> = {
    lyrics: 'Paroles',
    video: 'Vidéo',
    audio: 'Audio',
    music_sheet: 'Partition',
    youtube: 'YouTube',
    spotify: 'Spotify',
    file: 'Fichier'
  };

  return resource.contents
    .map(content => typeNames[content.type])
    .filter(Boolean)
    .join(', ');
};

const getResourceCollectionNames = (resource: Resource) => {
  if (!resource.collectionId) return [];
  const collection = collections.value.find(c => c.id === resource.collectionId);
  return collection ? [collection.name] : [];
};

// YouTube preview functions
const getYouTubeVideoId = (resource: Resource): string | null => {
  const youtubeContent = resource.contents.find(c => c.type === 'youtube' || c.type === 'video');
  if (!youtubeContent || !youtubeContent.url) return null;

  const url = youtubeContent.url;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const previewYouTubeVideo = (resource: Resource) => {
  previewingResource.value = resource;
  showYouTubePreview.value = true;
};

const closeYouTubePreview = () => {
  showYouTubePreview.value = false;
  previewingResource.value = null;
};

const selectPreviewedResource = () => {
  if (previewingResource.value) {
    tempSelectedId.value = previewingResource.value.id;
    closeYouTubePreview();
  }
};

// Watch for external modal control
watch(() => props.isOpen, async (newVal) => {
  if (newVal && props.modalOnly) {
    tempSelectedIds.value = [...props.selectedIds];
    tempSelectedId.value = props.modelValue ?? null;
    await loadResources();
  }
});

// Load initial data if needed
onMounted(() => {
  if (props.modelValue) {
    loadResources();
  }
});
</script>

<style scoped>
.resource-selector {
  margin: 16px 0;
}

.selected-resource {
  margin-bottom: 16px;
}

.selected-resource h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-color-dark);
}

.selected-resource-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: var(--ion-color-light);
  border-radius: 8px;
  border: 1px solid var(--ion-color-medium-tint);
}

.resource-avatar {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background: var(--ion-color-primary-tint);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.resource-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.resource-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--ion-color-dark);
}

.resource-types {
  font-size: 12px;
  color: var(--ion-color-medium);
}

.modal-content {
  padding: 16px;
}

.filter-section {
  margin: 8px 0 16px;
}

.resource-list {
  margin-top: 8px;
}

.resource-item {
  padding: 16px;
  border-bottom: 1px solid var(--ion-color-light);
  cursor: pointer;
  transition: background-color 0.2s;
}

.resource-item:hover {
  background: var(--ion-color-light-tint);
}

.resource-item.selected {
  background: var(--ion-color-primary-tint);
}

.resource-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.resource-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.resource-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-color-dark);
}

.resource-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.resource-collections {
  font-size: 12px;
  color: var(--ion-color-primary);
  font-weight: 500;
}

.resource-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.selection-icon {
  font-size: 24px;
}

.no-resources {
  text-align: center;
  padding: 40px 20px;
  color: var(--ion-color-medium);
}

.no-resources ion-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.create-resource-btn {
  margin-top: 16px;
}

.modal-actions {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 12px 16px;
}

/* Create Form Styles */
.create-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-item {
  --background: var(--ion-color-light);
  --border-radius: 8px;
  --padding-start: 12px;
  --padding-end: 12px;
}

.music-accordion {
  margin-top: 8px;
}

.music-fields {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.content-section {
  margin-top: 16px;
}

.section-label {
  display: block;
  font-size: 14px;
  color: var(--ion-color-dark);
  margin-bottom: 8px;
  font-weight: 600;
}

.content-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--ion-color-light);
  border-radius: 8px;
  margin-bottom: 8px;
}

.content-item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.content-type-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--ion-color-primary);
}

.content-preview {
  font-size: 12px;
  color: var(--ion-color-medium);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inline-content-input {
  margin: 8px 0;
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

.youtube-search-container {
  min-height: 300px;
}

.add-content-btn {
  margin-top: 8px;
}

/* YouTube Preview Modal */
.youtube-preview-container {
  padding: 1rem;
}

.youtube-iframe {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.preview-info {
  padding: 0 0.5rem;
}

.preview-info h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--ion-color-dark);
}

.preview-actions {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 0.75rem 1rem;
}
</style>
