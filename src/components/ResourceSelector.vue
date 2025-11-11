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
              <ion-label>Ressources existantes</ion-label>
            </ion-segment-button>
            <ion-segment-button value="youtube">
              <ion-label>Recherche YouTube</ion-label>
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
                  <p class="resource-description" v-if="resource.description">{{ resource.description }}</p>
                  <div class="resource-meta">
                    <span class="resource-types">{{ getResourceTypeList(resource) }}</span>
                    <span class="resource-collections" v-if="getResourceCollectionNames(resource).length > 0">
      {{ getResourceCollectionNames(resource).join(', ') }}
                    </span>
                  </div>
                </div>
                <div class="selection-indicator">
                  <ion-icon 
                    :icon="isResourceSelected(resource.id) ? checkmarkCircle : ellipseOutline" 
                    :color="isResourceSelected(resource.id) ? 'primary' : 'medium'"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  IonButton, IonIcon, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonContent, IonFooter, IonSearchbar, IonSegment, IonSegmentButton, IonLabel,
  IonLoading
} from '@ionic/vue';
import {
  addOutline, closeOutline, checkmarkCircle, ellipseOutline, documentOutline
} from 'ionicons/icons';
import type { Resource, ResourceCollection, ResourceType } from '@/types/resource';
import { getResources, getResourceCollections } from '@/firebase/resources';
import NaturalResourceSelector from '@/components/NaturalResourceSelector.vue';

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

// Component state
const isModalOpen = ref(false);
const loading = ref(false);
const searchQuery = ref('');
const selectedCollectionId = ref('');
const activeTab = ref<'existing' | 'youtube'>('existing');

// Data
const resources = ref<Resource[]>([]);
const collections = ref<ResourceCollection[]>([]);
const tempSelectedId = ref<string | null>(null);

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
      resource.description?.toLowerCase().includes(query) ||
      resource.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }

  // Filter by collection
  if (selectedCollectionId.value) {
    filtered = filtered.filter(resource =>
      resource.collectionIds.includes(selectedCollectionId.value)
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
  return resource.collectionIds
    .map(id => collections.value.find(c => c.id === id)?.name)
    .filter(Boolean) as string[];
};

const onResourceCreated = async (resource: Resource) => {
  // Reload resources to include the newly created one
  await loadResources();
  // Auto-select the new resource
  tempSelectedId.value = resource.id;
  // Switch back to existing resources tab to show selection
  activeTab.value = 'existing';
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

.resource-description {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: var(--ion-color-medium-shade);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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

.selection-indicator {
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
</style>