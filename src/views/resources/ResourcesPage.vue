<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Ressources</ion-title>
        <ion-buttons slot="end">
          <ion-button v-if="isAdmin" @click="goToCollections" fill="clear">
            <ion-icon :icon="folderOutline" />
          </ion-button>
          <ion-button v-if="isAdmin" @click="goToCreateResource" fill="clear">
            <ion-icon :icon="addOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Ressources</ion-title>
        </ion-toolbar>
      </ion-header>
      
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>
      
      <ion-loading :is-open="loading" message="Chargement des ressources..."></ion-loading>
      
      <div class="ion-padding">
        <!-- Search Bar -->
        <ion-searchbar
          v-model="searchQuery"
          placeholder="Rechercher des ressources..."
          :debounce="500"
          @ionInput="handleSearch"
          show-clear-button="focus"
        ></ion-searchbar>
        
        <!-- Filters -->
        <div class="filters-section">
          <ion-chip
            @click="showCollectionFilter = true"
            outline
            :color="selectedCollections.length > 0 ? 'primary' : undefined"
          >
            <ion-icon :icon="folderOutline" />
            <ion-label>
              Collections de ressources
              <span v-if="selectedCollections.length > 0">({{ selectedCollections.length }})</span>
            </ion-label>
          </ion-chip>
          
          <ion-chip
            @click="showTypeFilter = true"
            outline
            :color="selectedTypes.length > 0 ? 'primary' : undefined"
          >
            <ion-icon :icon="filterOutline" />
            <ion-label>
              Types
              <span v-if="selectedTypes.length > 0">({{ selectedTypes.length }})</span>
            </ion-label>
          </ion-chip>
          
          <ion-chip
            @click="showSortOptions = true"
            outline
          >
            <ion-icon :icon="swapVerticalOutline" />
            <ion-label>{{ getSortLabel() }}</ion-label>
          </ion-chip>
        </div>
        
        <!-- Active Filters Display -->
        <div v-if="hasActiveFilters" class="active-filters">
          <ion-chip
            v-for="collection in getSelectedCollectionNames()"
            :key="collection.id"
            @click="removeCollectionFilter(collection.id)"
            color="primary"
          >
            <ion-label>{{ collection.name }}</ion-label>
            <ion-icon :icon="closeCircle" />
          </ion-chip>
          
          <ion-chip
            v-for="type in selectedTypes"
            :key="type"
            @click="removeTypeFilter(type)"
            color="secondary"
          >
            <ion-label>{{ getTypeLabel(type) }}</ion-label>
            <ion-icon :icon="closeCircle" />
          </ion-chip>
          
          <ion-chip @click="clearAllFilters" color="medium">
            <ion-label>Effacer tout</ion-label>
            <ion-icon :icon="closeCircle" />
          </ion-chip>
        </div>
        
        <!-- Resources List -->
        <div v-if="!loading && filteredResources.length === 0" class="empty-state ion-text-center">
          <ion-icon :icon="documentTextOutline" size="large" color="medium" />
          <h2>Aucune ressource</h2>
          <p>{{ getEmptyMessage() }}</p>
          <ion-button v-if="isAdmin" @click="goToCreateResource" fill="outline">
            <ion-icon :icon="addOutline" slot="start" />
            Créer une ressource
          </ion-button>
        </div>
        
        <ion-list v-else>
          <ion-item
            v-for="resource in filteredResources"
            :key="resource.id"
            button
            @click="goToResourceDetail(resource.id)"
          >
            <ion-icon :icon="getResourceIcon(resource)" slot="start" />
            <ion-label>
              <h2>{{ resource.title }}</h2>
              <p v-if="resource.description">{{ resource.description }}</p>
              <div class="resource-meta">
                <ion-chip
                  v-for="type in getResourceTypes(resource)"
                  :key="type"
                  size="small"
                  :color="getTypeColor(type)"
                >
                  {{ getTypeLabel(type) }}
                </ion-chip>
                <span v-if="resource.viewCount" class="view-count">
                  <ion-icon :icon="eyeOutline" />
                  {{ resource.viewCount }}
                </span>
              </div>
            </ion-label>
            <ion-buttons slot="end" v-if="isAdmin">
              <ion-button @click.stop="editResource(resource.id)" fill="clear">
                <ion-icon :icon="pencilOutline" slot="icon-only" />
              </ion-button>
            </ion-buttons>
          </ion-item>
        </ion-list>
      </div>
      
      <!-- Collection Filter Modal -->
      <ion-modal :is-open="showCollectionFilter" @didDismiss="showCollectionFilter = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Filtrer par collection</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showCollectionFilter = false">Fermer</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-list>
            <ion-item v-for="collection in collections" :key="collection.id">
              <ion-checkbox
                :checked="selectedCollections.includes(collection.id)"
                @ionChange="toggleCollectionFilter(collection.id)"
              >
                {{ collection.name }}
              </ion-checkbox>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>
      
      <!-- Type Filter Modal -->
      <ion-modal :is-open="showTypeFilter" @didDismiss="showTypeFilter = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Filtrer par type</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showTypeFilter = false">Fermer</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-list>
            <ion-item v-for="type in resourceTypes" :key="type.value">
              <ion-checkbox
                :checked="selectedTypes.includes(type.value)"
                @ionChange="toggleTypeFilter(type.value)"
              >
                {{ type.label }}
              </ion-checkbox>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>
      
      <!-- Sort Options Action Sheet -->
      <ion-action-sheet
        :is-open="showSortOptions"
        @didDismiss="showSortOptions = false"
        header="Trier par"
        :buttons="sortButtons"
      ></ion-action-sheet>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonSearchbar, IonList, IonItem, IonLabel, IonChip, IonRefresher,
  IonRefresherContent, IonLoading, IonModal, IonCheckbox, IonActionSheet, actionSheetController,
  onIonViewWillEnter
} from '@ionic/vue';
import {
  addOutline, folderOutline, filterOutline, swapVerticalOutline, closeCircle,
  documentTextOutline, eyeOutline, pencilOutline, musicalNotesOutline,
  videocamOutline, volumeHighOutline, logoYoutube, documentOutline
} from 'ionicons/icons';
import { Resource, ResourceCollection, ResourceType, SortOption, ResourceFilter } from '@/types/resource';
import { getResources, getResourceCollections } from '@/firebase/resources';
import { useUser } from '@/composables/useUser';

const router = useRouter();
const { isAdmin } = useUser();

const loading = ref(false);
const resources = ref<Resource[]>([]);
const collections = ref<ResourceCollection[]>([]);
const searchQuery = ref('');
const selectedCollections = ref<string[]>([]);
const selectedTypes = ref<ResourceType[]>([]);
const sortOption = ref<SortOption>(SortOption.RECENT);
const showCollectionFilter = ref(false);
const showTypeFilter = ref(false);
const showSortOptions = ref(false);

const resourceTypes = [
  { value: ResourceType.LYRICS, label: 'Paroles' },
  { value: ResourceType.VIDEO, label: 'Vidéo' },
  { value: ResourceType.AUDIO, label: 'Audio' },
  { value: ResourceType.MUSIC_SHEET, label: 'Partition' },
  { value: ResourceType.YOUTUBE, label: 'YouTube' },
  { value: ResourceType.FILE, label: 'Fichier' }
];

const sortButtons = [
  {
    text: 'Plus récent',
    handler: () => {
      sortOption.value = SortOption.RECENT;
      loadResources();
    }
  },
  {
    text: 'Plus pertinent',
    handler: () => {
      sortOption.value = SortOption.RELEVANT;
      loadResources();
    }
  },
  {
    text: 'Alphabétique',
    handler: () => {
      sortOption.value = SortOption.ALPHABETICAL;
      loadResources();
    }
  },
  {
    text: 'Annuler',
    role: 'cancel'
  }
];

const hasActiveFilters = computed(() => {
  return selectedCollections.value.length > 0 || selectedTypes.value.length > 0;
});

const filteredResources = computed(() => {
  return resources.value;
});

const loadResources = async () => {
  loading.value = true;
  try {
    const filter: ResourceFilter = {
      searchQuery: searchQuery.value || undefined,
      collectionIds: selectedCollections.value.length > 0 ? selectedCollections.value : undefined,
      resourceTypes: selectedTypes.value.length > 0 ? selectedTypes.value : undefined,
      sortBy: sortOption.value
    };
    
    resources.value = await getResources(filter);
  } catch (error) {
    console.error('Error loading resources:', error);
  } finally {
    loading.value = false;
  }
};

const loadResourceCollections = async () => {
  try {
    collections.value = await getResourceCollections();
  } catch (error) {
    console.error('Error loading collections:', error);
  }
};

const handleSearch = () => {
  loadResources();
};

const handleRefresh = async (event: any) => {
  await Promise.all([loadResources(), loadResourceCollections()]);
  event.target.complete();
};

const toggleCollectionFilter = (collectionId: string) => {
  const index = selectedCollections.value.indexOf(collectionId);
  if (index > -1) {
    selectedCollections.value.splice(index, 1);
  } else {
    selectedCollections.value.push(collectionId);
  }
  loadResources();
};

const toggleTypeFilter = (type: ResourceType) => {
  const index = selectedTypes.value.indexOf(type);
  if (index > -1) {
    selectedTypes.value.splice(index, 1);
  } else {
    selectedTypes.value.push(type);
  }
  loadResources();
};

const removeCollectionFilter = (collectionId: string) => {
  const index = selectedCollections.value.indexOf(collectionId);
  if (index > -1) {
    selectedCollections.value.splice(index, 1);
    loadResources();
  }
};

const removeTypeFilter = (type: ResourceType) => {
  const index = selectedTypes.value.indexOf(type);
  if (index > -1) {
    selectedTypes.value.splice(index, 1);
    loadResources();
  }
};

const clearAllFilters = () => {
  selectedCollections.value = [];
  selectedTypes.value = [];
  searchQuery.value = '';
  loadResources();
};

const getSelectedCollectionNames = () => {
  return collections.value.filter(c => selectedCollections.value.includes(c.id));
};

const getSortLabel = () => {
  switch (sortOption.value) {
    case SortOption.RECENT:
      return 'Plus récent';
    case SortOption.RELEVANT:
      return 'Plus pertinent';
    case SortOption.ALPHABETICAL:
      return 'Alphabétique';
    default:
      return 'Trier';
  }
};

const getResourceIcon = (resource: Resource) => {
  if (resource.contents.length === 0) return documentOutline;
  
  const firstType = resource.contents[0].type;
  switch (firstType) {
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
      return documentOutline;
  }
};

const getResourceTypes = (resource: Resource) => {
  const types = new Set(resource.contents.map(c => c.type));
  return Array.from(types);
};

const getTypeLabel = (type: ResourceType) => {
  const found = resourceTypes.find(t => t.value === type);
  return found ? found.label : type;
};

const getTypeColor = (type: ResourceType) => {
  switch (type) {
    case ResourceType.LYRICS:
      return 'primary';
    case ResourceType.VIDEO:
    case ResourceType.YOUTUBE:
      return 'danger';
    case ResourceType.AUDIO:
      return 'success';
    case ResourceType.MUSIC_SHEET:
      return 'warning';
    case ResourceType.FILE:
      return 'secondary';
    default:
      return 'medium';
  }
};

const getEmptyMessage = () => {
  if (searchQuery.value) {
    return `Aucune ressource trouvée pour "${searchQuery.value}"`;
  }
  if (hasActiveFilters.value) {
    return 'Aucune ressource ne correspond aux filtres sélectionnés';
  }
  return 'Aucune ressource disponible pour le moment';
};

const goToResourceDetail = (resourceId: string) => {
  router.push(`/resource-detail/${resourceId}`);
};

const goToCreateResource = () => {
  router.push('/resource-form');
};

const goToCollections = () => {
  router.push('/collections');
};

const editResource = (resourceId: string) => {
  router.push(`/resource-form/${resourceId}`);
};

onMounted(() => {
  loadResources();
  loadResourceCollections();
});

// Refresh resources every time the page is displayed
onIonViewWillEnter(() => {
  loadResources();
});
</script>

<style scoped>
.filters-section {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin: 1rem 0;
}

.active-filters {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.resource-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.view-count {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: var(--ion-color-medium);
  margin-left: auto;
}

.view-count ion-icon {
  font-size: 1rem;
}

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

ion-searchbar {
  --background: var(--ion-color-light);
  --border-radius: 8px;
}

@media (max-width: 768px) {
  .filters-section {
    overflow-x: auto;
    flex-wrap: nowrap;
    -webkit-overflow-scrolling: touch;
  }
}
</style>