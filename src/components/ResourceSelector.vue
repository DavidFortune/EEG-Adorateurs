<template>
  <div class="resource-selector">
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

    <!-- Resource Selection Modal -->
    <ion-modal :is-open="isModalOpen" @will-dismiss="closeResourceModal">
      <ion-header>
        <ion-toolbar>
          <ion-title>Sélectionner une ressource</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeResourceModal" fill="clear">
              <ion-icon :icon="closeOutline" />
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      
      <ion-content>
        <div class="modal-content">
          <!-- Tab Selector -->
          <ion-segment :value="activeTab" @ion-change="changeTab">
            <ion-segment-button value="existing">
              <ion-label>Existantes</ion-label>
            </ion-segment-button>
            <ion-segment-button value="youtube">
              <ion-label>YouTube</ion-label>
            </ion-segment-button>
            <ion-segment-button value="create">
              <ion-label>Créer</ion-label>
            </ion-segment-button>
          </ion-segment>

          <!-- Existing Resources Tab -->
          <div v-if="activeTab === 'existing'" class="tab-content">
            <!-- Search Bar -->
            <ion-searchbar
              v-model="searchQuery"
              placeholder="Rechercher une ressource..."
              :debounce="300"
              @ion-input="searchResources"
            />

            <!-- Collection Filter -->
            <div class="filter-section" v-if="collections.length > 0">
              <ion-segment :value="selectedCollectionId" @ion-change="filterByCollection">
                <ion-segment-button value="">
                  <ion-label>Toutes</ion-label>
                </ion-segment-button>
                <ion-segment-button
                  v-for="collection in collections"
                  :key="collection.id"
                  :value="collection.id"
                >
                  <ion-label>{{ collection.symbol }}</ion-label>
                </ion-segment-button>
              </ion-segment>
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
          </div>

          <!-- YouTube Search Tab -->
          <div v-if="activeTab === 'youtube'" class="tab-content">
            <NaturalResourceSelector
              v-model="tempSelectedId"
              @resource-created="onResourceCreated"
            />
          </div>

          <!-- Quick Create Tab -->
          <div v-if="activeTab === 'create'" class="tab-content create-tab">
            <div class="create-form">
              <ion-item class="form-item">
                <ion-label position="stacked">Titre *</ion-label>
                <ion-input
                  v-model="quickCreateForm.title"
                  placeholder="Ex: Gloire à Dieu"
                  :disabled="creatingResource"
                />
              </ion-item>

              <div class="collection-section">
                <label class="section-label">Collection *</label>
                <ion-segment
                  :value="quickCreateForm.collectionId"
                  @ion-change="(e: CustomEvent) => quickCreateForm.collectionId = e.detail.value"
                  :disabled="creatingResource"
                  class="collection-segment"
                >
                  <ion-segment-button
                    v-for="collection in collections"
                    :key="collection.id"
                    :value="collection.id"
                  >
                    <ion-label>{{ collection.symbol }}</ion-label>
                  </ion-segment-button>
                </ion-segment>
                <p v-if="collections.length === 0" class="no-collections">
                  Aucune collection disponible
                </p>
              </div>

              <ion-item class="form-item lyrics-item">
                <ion-label position="stacked">Paroles (optionnel)</ion-label>
                <ion-textarea
                  v-model="quickCreateForm.lyrics"
                  placeholder="Entrez les paroles ici..."
                  :rows="6"
                  :disabled="creatingResource"
                />
              </ion-item>

              <ion-button
                @click="handleQuickCreate"
                expand="block"
                :disabled="!quickCreateForm.title.trim() || !quickCreateForm.collectionId || creatingResource"
                class="create-button"
              >
                <ion-spinner v-if="creatingResource" name="crescent" slot="start" />
                {{ creatingResource ? 'Création...' : 'Créer et lier' }}
              </ion-button>
            </div>
          </div>
        </div>
      </ion-content>
      
      <ion-footer>
        <ion-toolbar>
          <div class="modal-actions">
            <ion-button @click="closeResourceModal" fill="outline" color="medium">
              Annuler
            </ion-button>
            <ion-button @click="confirmSelection" :disabled="!tempSelectedId">
              Confirmer
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
import { ref, computed, onMounted } from 'vue';
import {
  IonButton, IonIcon, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonContent, IonFooter, IonSearchbar, IonSegment, IonSegmentButton, IonLabel,
  IonLoading, IonItem, IonInput, IonTextarea, IonSpinner, toastController
} from '@ionic/vue';
import {
  addOutline, closeOutline, checkmarkCircle, ellipseOutline, documentOutline, playCircleOutline
} from 'ionicons/icons';
import { ResourceType, type Resource, type ResourceCollection, type ResourceMedia } from '@/types/resource';
import { getResources, getResourceCollections, createResource } from '@/firebase/resources';
import NaturalResourceSelector from '@/components/NaturalResourceSelector.vue';
import { useUser } from '@/composables/useUser';

interface Props {
  modelValue: string | null;
  buttonFill?: 'clear' | 'outline' | 'solid';
  buttonSize?: 'small' | 'default' | 'large';
}

interface Emits {
  (event: 'update:modelValue', value: string | null): void;
}

const props = withDefaults(defineProps<Props>(), {
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
const activeTab = ref<'existing' | 'youtube' | 'create'>('existing');

// Quick create form state
const quickCreateForm = ref({
  title: '',
  collectionId: '',
  lyrics: ''
});
const creatingResource = ref(false);

// Data
const resources = ref<Resource[]>([]);
const collections = ref<ResourceCollection[]>([]);
const tempSelectedId = ref<string | null>(null);

// YouTube preview state
const showYouTubePreview = ref(false);
const previewingResource = ref<Resource | null>(null);

// Computed
const selectedResource = computed(() => {
  if (!props.modelValue) return null;
  return resources.value.find(resource => resource.id === props.modelValue) || null;
});

const filteredResources = computed(() => {
  let filtered = resources.value;

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

// Methods
const openResourceModal = async () => {
  tempSelectedId.value = props.modelValue;
  isModalOpen.value = true;
  await loadResources();
};

const closeResourceModal = () => {
  isModalOpen.value = false;
  searchQuery.value = '';
  selectedCollectionId.value = '';
  tempSelectedId.value = null;
  activeTab.value = 'existing';
  // Reset quick create form
  quickCreateForm.value = { title: '', collectionId: '', lyrics: '' };
};

const changeTab = (event: CustomEvent) => {
  activeTab.value = event.detail.value;
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

const searchResources = () => {
  // Search is handled by computed property
};

const filterByCollection = (event: CustomEvent) => {
  selectedCollectionId.value = event.detail.value;
};

const toggleResource = (resource: Resource) => {
  if (tempSelectedId.value === resource.id) {
    tempSelectedId.value = null;
  } else {
    tempSelectedId.value = resource.id;
  }
};

const isResourceSelected = (resourceId: string) => {
  return tempSelectedId.value === resourceId;
};

const confirmSelection = () => {
  emit('update:modelValue', tempSelectedId.value);
  closeResourceModal();
};

const removeResource = () => {
  emit('update:modelValue', null);
};

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

  // Extract video ID from YouTube URL
  const url = youtubeContent.url;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
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

const onResourceCreated = async (resource: Resource) => {
  // Reload resources to include the newly created one
  await loadResources();
  // Auto-select the new resource
  tempSelectedId.value = resource.id;
  // Switch back to existing resources tab to show selection
  activeTab.value = 'existing';
};

// Quick create helper
const showToast = async (message: string, color: string = 'primary') => {
  const toast = await toastController.create({
    message,
    duration: 2000,
    color,
    position: 'bottom'
  });
  await toast.present();
};

const handleQuickCreate = async () => {
  if (!quickCreateForm.value.title.trim()) {
    await showToast('Veuillez entrer un titre', 'warning');
    return;
  }
  if (!quickCreateForm.value.collectionId) {
    await showToast('Veuillez sélectionner une collection', 'warning');
    return;
  }

  creatingResource.value = true;
  try {
    const contents: ResourceMedia[] = [];
    if (quickCreateForm.value.lyrics.trim()) {
      contents.push({ type: ResourceType.LYRICS, content: quickCreateForm.value.lyrics.trim() });
    }

    const newResourceId = await createResource({
      title: quickCreateForm.value.title.trim(),
      collectionId: quickCreateForm.value.collectionId,
      contents,
      createdBy: user.value?.uid || '',
      updatedBy: user.value?.uid || ''
    });

    // Reload and auto-select
    await loadResources();
    tempSelectedId.value = newResourceId;
    activeTab.value = 'existing';

    // Reset form
    quickCreateForm.value = { title: '', collectionId: '', lyrics: '' };

    await showToast('Ressource créée avec succès', 'success');
  } catch (error) {
    console.error('Error creating resource:', error);
    await showToast('Erreur lors de la création', 'danger');
  } finally {
    creatingResource.value = false;
  }
};

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

.resource-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
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
  margin: 16px 0;
}

.resource-list {
  margin-top: 16px;
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

.modal-actions {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 12px 16px;
}

.tab-content {
  margin-top: 1rem;
}

/* Quick Create Tab Styles */
.create-tab {
  padding-bottom: 20px;
}

.create-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-item {
  --background: var(--ion-color-light);
  --border-radius: 8px;
  --padding-start: 12px;
  --padding-end: 12px;
}

.collection-section {
  margin-top: 8px;
}

.section-label {
  display: block;
  font-size: 12px;
  color: var(--ion-color-medium);
  margin-bottom: 8px;
  font-weight: 500;
}

.collection-segment {
  --background: var(--ion-color-light);
}

.collection-segment ion-segment-button {
  --indicator-color: var(--ion-color-primary);
  min-width: auto;
  flex: 1;
}

.no-collections {
  font-size: 14px;
  color: var(--ion-color-medium);
  text-align: center;
  padding: 16px;
}

.lyrics-item ion-textarea {
  --padding-start: 0;
  --padding-end: 0;
  min-height: 120px;
}

.create-button {
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