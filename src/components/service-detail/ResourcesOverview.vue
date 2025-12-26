<template>
  <div class="resources-overview">
    <!-- Summary Row (always visible) -->
    <div class="resources-summary">
      <div class="summary-info">
        <ion-icon :icon="folderOutline" />
        <span>{{ resources.length }} ressource{{ resources.length !== 1 ? 's' : '' }}</span>
      </div>
      <ion-button v-if="isAdmin" fill="clear" size="small" @click="openAddModal">
        <ion-icon :icon="addOutline" slot="start" />
        Ajouter
      </ion-button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <ion-spinner name="crescent" />
      <span>Chargement des ressources...</span>
    </div>

    <!-- Empty State -->
    <div v-else-if="resources.length === 0" class="empty-state">
      <ion-icon :icon="folderOpenOutline" size="large" color="medium" />
      <h3>Aucune ressource</h3>
      <p>Ce service n'a pas de ressources associées.</p>
    </div>

    <!-- Resources List -->
    <div v-else class="resources-list">
      <div
        v-for="resource in resources"
        :key="resource.id"
        class="resource-item"
        @click="goToResource(resource.id)"
      >
        <div class="resource-icon">
          <ion-icon :icon="getResourceIcon(resource)" :color="getResourceColor(resource)" />
        </div>
        <div class="resource-content">
          <div class="resource-header">
            <span class="resource-title-row">
              <span class="resource-title">{{ resource.title }}</span>
              <ion-icon
                v-if="resource.isDirect"
                :icon="linkOutline"
                class="direct-icon"
                color="tertiary"
              />
            </span>
            <ion-chip :color="getResourceColor(resource)" size="small" class="type-chip">
              {{ getResourceTypeLabel(resource) }}
            </ion-chip>
          </div>
          <p v-if="resource.collectionName" class="resource-subtitle">
            {{ resource.collectionName }}
          </p>
        </div>
      </div>
    </div>

    <!-- Add Resources Modal -->
    <ion-modal :is-open="isModalOpen" @will-dismiss="closeModal">
      <ion-header>
        <ion-toolbar>
          <ion-title>Ajouter des ressources</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeModal" fill="clear">
              <ion-icon :icon="closeOutline" />
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
        <ion-toolbar>
          <ion-searchbar
            v-model="searchQuery"
            placeholder="Rechercher une ressource..."
            :debounce="300"
          />
        </ion-toolbar>
      </ion-header>

      <ion-content>
        <div class="modal-content">
          <!-- Collection Filter -->
          <div v-if="collections.length > 0" class="collection-filter">
            <ion-segment :value="selectedCollectionId" @ion-change="onCollectionChange" scrollable>
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

          <!-- Loading -->
          <div v-if="loadingResources" class="modal-loading">
            <ion-spinner name="crescent" />
          </div>

          <!-- Resource List -->
          <div v-else class="modal-resource-list">
            <div
              v-for="resource in filteredAvailableResources"
              :key="resource.id"
              class="modal-resource-item"
              :class="{ selected: selectedResourceIds.includes(resource.id) }"
              @click="toggleResourceSelection(resource.id)"
            >
              <div class="modal-resource-info">
                <span class="modal-resource-title">{{ resource.title }}</span>
                <span class="modal-resource-collection">{{ getCollectionName(resource.collectionId) }}</span>
              </div>
              <ion-icon
                :icon="selectedResourceIds.includes(resource.id) ? checkmarkCircle : ellipseOutline"
                :color="selectedResourceIds.includes(resource.id) ? 'primary' : 'medium'"
                class="selection-icon"
              />
            </div>

            <div v-if="filteredAvailableResources.length === 0" class="no-results">
              <p>Aucune ressource trouvée</p>
            </div>
          </div>
        </div>
      </ion-content>

      <ion-footer>
        <ion-toolbar>
          <div class="modal-actions">
            <ion-button @click="closeModal" fill="outline" color="medium">
              Annuler
            </ion-button>
            <ion-button @click="confirmSelection" :disabled="selectedResourceIds.length === 0">
              Ajouter ({{ selectedResourceIds.length }})
            </ion-button>
          </div>
        </ion-toolbar>
      </ion-footer>
    </ion-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonSpinner, IonIcon, IonChip, IonButton, IonModal, IonHeader, IonToolbar,
  IonTitle, IonButtons, IonContent, IonFooter, IonSearchbar, IonSegment,
  IonSegmentButton, IonLabel
} from '@ionic/vue';
import {
  folderOpenOutline,
  folderOutline,
  musicalNotesOutline,
  videocamOutline,
  documentTextOutline,
  logoYoutube,
  musicalNoteOutline,
  documentOutline,
  addOutline,
  closeOutline,
  checkmarkCircle,
  ellipseOutline,
  linkOutline
} from 'ionicons/icons';
import type { Resource, ResourceType, ResourceCollection } from '@/types/resource';
import { getResources, getResourceCollections } from '@/firebase/resources';

const router = useRouter();

interface ResourceWithCollection extends Resource {
  collectionName?: string;
  isDirect?: boolean; // true if directly associated with service, false if from program
}

interface Props {
  resources: ResourceWithCollection[];
  loading: boolean;
  serviceId: string;
  isAdmin: boolean;
  existingResourceIds: string[]; // IDs already associated (to filter out from modal)
}

const props = defineProps<Props>();

const emit = defineEmits<{
  addResources: [resourceIds: string[]];
}>();

// Modal state
const isModalOpen = ref(false);
const loadingResources = ref(false);
const searchQuery = ref('');
const selectedCollectionId = ref('');
const selectedResourceIds = ref<string[]>([]);

// Data for modal
const allResources = ref<Resource[]>([]);
const collections = ref<ResourceCollection[]>([]);

const goToResource = (resourceId: string) => {
  router.push(`/resource-detail/${resourceId}`);
};

// Filter resources for modal (exclude already associated)
const filteredAvailableResources = computed(() => {
  let filtered = allResources.value.filter(
    r => !props.existingResourceIds.includes(r.id)
  );

  // Filter by search
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(r =>
      r.title.toLowerCase().includes(query) ||
      r.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }

  // Filter by collection
  if (selectedCollectionId.value) {
    filtered = filtered.filter(r => r.collectionId === selectedCollectionId.value);
  }

  return filtered;
});

const getCollectionName = (collectionId: string): string => {
  const collection = collections.value.find(c => c.id === collectionId);
  return collection?.name || '';
};

const openAddModal = async () => {
  isModalOpen.value = true;
  selectedResourceIds.value = [];
  searchQuery.value = '';
  selectedCollectionId.value = '';

  if (allResources.value.length === 0) {
    loadingResources.value = true;
    try {
      const [resourcesData, collectionsData] = await Promise.all([
        getResources(),
        getResourceCollections()
      ]);
      allResources.value = resourcesData;
      collections.value = collectionsData;
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      loadingResources.value = false;
    }
  }
};

const closeModal = () => {
  isModalOpen.value = false;
};

const onCollectionChange = (event: CustomEvent) => {
  selectedCollectionId.value = event.detail.value;
};

const toggleResourceSelection = (resourceId: string) => {
  const index = selectedResourceIds.value.indexOf(resourceId);
  if (index === -1) {
    selectedResourceIds.value.push(resourceId);
  } else {
    selectedResourceIds.value.splice(index, 1);
  }
};

const confirmSelection = () => {
  if (selectedResourceIds.value.length > 0) {
    emit('addResources', [...selectedResourceIds.value]);
  }
  closeModal();
};

const getResourceIcon = (resource: Resource): string => {
  if (!resource.contents || resource.contents.length === 0) return documentOutline;

  const primaryType = resource.contents[0].type;
  const icons: Record<ResourceType, string> = {
    'lyrics': documentTextOutline,
    'video': videocamOutline,
    'audio': musicalNotesOutline,
    'music_sheet': documentOutline,
    'youtube': logoYoutube,
    'spotify': musicalNoteOutline,
    'file': documentOutline
  };
  return icons[primaryType] || documentOutline;
};

const getResourceColor = (resource: Resource): string => {
  if (!resource.contents || resource.contents.length === 0) return 'medium';

  const primaryType = resource.contents[0].type;
  const colors: Record<ResourceType, string> = {
    'lyrics': 'primary',
    'video': 'danger',
    'audio': 'success',
    'music_sheet': 'warning',
    'youtube': 'danger',
    'spotify': 'success',
    'file': 'medium'
  };
  return colors[primaryType] || 'medium';
};

const getResourceTypeLabel = (resource: Resource): string => {
  if (!resource.contents || resource.contents.length === 0) return 'Fichier';

  const primaryType = resource.contents[0].type;
  const labels: Record<ResourceType, string> = {
    'lyrics': 'Paroles',
    'video': 'Vidéo',
    'audio': 'Audio',
    'music_sheet': 'Partition',
    'youtube': 'YouTube',
    'spotify': 'Spotify',
    'file': 'Fichier'
  };
  return labels[primaryType] || 'Fichier';
};
</script>

<style scoped>
.resources-overview {
  padding: 16px;
}

.resources-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: white;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.summary-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--ion-color-dark);
}

.summary-info ion-icon {
  font-size: 1rem;
  color: var(--ion-color-primary);
}

.resources-summary ion-button {
  --padding-start: 10px;
  --padding-end: 10px;
  font-size: 0.8rem;
  font-weight: 500;
  height: 32px;
  margin: 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  gap: 12px;
  color: var(--ion-color-medium);
}

.empty-state {
  text-align: center;
  padding: 32px 16px;
}

.empty-state ion-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-state h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--ion-color-dark);
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 0.9rem;
  color: var(--ion-color-medium);
  margin: 0;
}

.resources-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.resource-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: var(--ion-color-light);
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.resource-item:active {
  background: var(--ion-color-light-shade);
}

.resource-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 8px;
  flex-shrink: 0;
}

.resource-icon ion-icon {
  font-size: 1.25rem;
}

.resource-content {
  flex: 1;
  min-width: 0;
}

.resource-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.resource-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.resource-title {
  font-weight: 600;
  color: var(--ion-color-dark);
  font-size: 0.95rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.direct-icon {
  font-size: 0.85rem;
  flex-shrink: 0;
}

.type-chip {
  height: 22px;
  font-size: 0.7rem;
  --padding-start: 6px;
  --padding-end: 6px;
  margin: 0;
  flex-shrink: 0;
}

.resource-subtitle {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  margin: 4px 0 0 0;
}

/* Modal Styles */
.modal-content {
  padding: 16px;
}

.collection-filter {
  margin-bottom: 16px;
}

.modal-loading {
  display: flex;
  justify-content: center;
  padding: 32px;
}

.modal-resource-list {
  display: flex;
  flex-direction: column;
}

.modal-resource-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 12px;
  border-bottom: 1px solid var(--ion-color-light);
  cursor: pointer;
  transition: background-color 0.2s;
}

.modal-resource-item:active,
.modal-resource-item.selected {
  background: var(--ion-color-primary-tint);
}

.modal-resource-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.modal-resource-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--ion-color-dark);
}

.modal-resource-collection {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
}

.selection-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.no-results {
  text-align: center;
  padding: 32px;
  color: var(--ion-color-medium);
}

.modal-actions {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 8px 16px;
}
</style>
