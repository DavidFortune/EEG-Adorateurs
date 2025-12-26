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
            :color="selectedCollection ? 'primary' : undefined"
          >
            <ion-icon :icon="folderOutline" />
            <ion-label>
              {{ selectedCollection ? getCollectionName(selectedCollection) : 'Collection' }}
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
            v-if="selectedCollection"
            @click="clearCollectionFilter"
            color="primary"
          >
            <ion-label>{{ getCollectionName(selectedCollection) }}</ion-label>
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
            :detail="false"
            @click="goToResourceDetail(resource.id)"
          >
            <div slot="start" class="collection-badge" :style="{ backgroundColor: getCollectionColor(resource.collectionId) }">
              {{ getCollectionSymbol(resource.collectionId) }}
            </div>
            <ion-label>
              <div class="resource-title-row">
                <h2>{{ resource.title }}</h2>
                <span class="media-icons">
                  <ion-icon
                    v-for="type in getResourceTypes(resource)"
                    :key="type"
                    :icon="getTypeIcon(type)"
                    color="medium"
                  />
                </span>
              </div>
              <div class="resource-meta">
                <span class="music-props">
                  <span v-if="resource.musicKey" class="music-prop">{{ getMusicOptionName(resource.musicKey, musicKeys) }}</span>
                  <span v-if="resource.musicBeat" class="music-prop">{{ getMusicOptionName(resource.musicBeat, musicBeats) }}</span>
                  <span v-if="resource.musicTempo" class="music-prop">{{ getMusicOptionName(resource.musicTempo, musicTempos) }}</span>
                  <span v-if="resource.musicStyle" class="music-prop">{{ getMusicOptionName(resource.musicStyle, musicStyles) }}</span>
                </span>
                <span v-if="resource.viewCount" class="view-count">
                  <ion-icon :icon="eyeOutline" />
                  {{ resource.viewCount }}
                </span>
              </div>
            </ion-label>
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
            <ion-item
              button
              @click="selectCollectionFilter('')"
              :class="{ 'selected-item': !selectedCollection }"
            >
              <ion-label>Toutes les collections</ion-label>
              <ion-icon v-if="!selectedCollection" :icon="checkmarkOutline" slot="end" color="primary" />
            </ion-item>
            <ion-item
              v-for="collection in collections"
              :key="collection.id"
              button
              @click="selectCollectionFilter(collection.id)"
              :class="{ 'selected-item': selectedCollection === collection.id }"
            >
              <ion-label>{{ collection.name }}</ion-label>
              <ion-icon v-if="selectedCollection === collection.id" :icon="checkmarkOutline" slot="end" color="primary" />
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonSearchbar, IonList, IonItem, IonLabel, IonRefresher,
  IonRefresherContent, IonLoading, IonModal, IonCheckbox, IonActionSheet,
  onIonViewWillEnter
} from '@ionic/vue';
import {
  addOutline, folderOutline, swapVerticalOutline, closeCircle,
  documentTextOutline, eyeOutline, musicalNotesOutline,
  videocamOutline, volumeHighOutline, logoYoutube, documentOutline,
  checkmarkOutline
} from 'ionicons/icons';
import { Resource, ResourceCollection, ResourceType, SortOption, ResourceOption } from '@/types/resource';
import { getResourceCollections, subscribeToResources, getAllResourceOptions } from '@/firebase/resources';
import { useUser } from '@/composables/useUser';

const router = useRouter();
const { isAdmin } = useUser();

const loading = ref(false);
const resources = ref<Resource[]>([]);
const collections = ref<ResourceCollection[]>([]);
const searchQuery = ref('');
const selectedCollection = ref<string>('');
const sortOption = ref<SortOption>(SortOption.NEWEST);
const showCollectionFilter = ref(false);
const showSortOptions = ref(false);

// Music options
const musicKeys = ref<ResourceOption[]>([]);
const musicBeats = ref<ResourceOption[]>([]);
const musicTempos = ref<ResourceOption[]>([]);
const musicStyles = ref<ResourceOption[]>([]);

// Real-time subscription unsubscribe function
let unsubscribeResources: (() => void) | null = null;


const sortButtons = [
  {
    text: 'Plus récent',
    handler: () => {
      sortOption.value = SortOption.NEWEST;
    }
  },
  {
    text: 'Plus ancien',
    handler: () => {
      sortOption.value = SortOption.OLDEST;
    }
  },
  {
    text: 'Alphabétique (A-Z)',
    handler: () => {
      sortOption.value = SortOption.ALPHABETICAL_ASC;
    }
  },
  {
    text: 'Alphabétique (Z-A)',
    handler: () => {
      sortOption.value = SortOption.ALPHABETICAL_DESC;
    }
  },
  {
    text: 'Annuler',
    role: 'cancel'
  }
];

const hasActiveFilters = computed(() => {
  return !!selectedCollection.value;
});

const filteredResources = computed(() => {
  let filtered = [...resources.value];

  // Apply collection filter
  if (selectedCollection.value) {
    filtered = filtered.filter(resource =>
      resource.collectionId === selectedCollection.value
    );
  }

  // Apply search filter
  if (searchQuery.value.trim()) {
    const searchLower = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter(resource => {
      const searchableText = `${resource.title} ${resource.tags?.join(' ') || ''}`.toLowerCase();
      return searchableText.includes(searchLower);
    });
  }

  // Apply sorting
  switch (sortOption.value) {
    case SortOption.NEWEST:
      return filtered.sort((a, b) => {
        // Handle both Firebase Timestamp objects and ISO strings
        const timeA = getTimestamp(a.createdAt);
        const timeB = getTimestamp(b.createdAt);
        return timeB - timeA; // Newest first (descending)
      });

    case SortOption.OLDEST:
      return filtered.sort((a, b) => {
        // Handle both Firebase Timestamp objects and ISO strings
        const timeA = getTimestamp(a.createdAt);
        const timeB = getTimestamp(b.createdAt);
        return timeA - timeB; // Oldest first (ascending)
      });

    case SortOption.ALPHABETICAL_ASC:
      return filtered.sort((a, b) => a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' }));

    case SortOption.ALPHABETICAL_DESC:
      return filtered.sort((a, b) => b.title.localeCompare(a.title, 'fr', { sensitivity: 'base' }));

    default:
      return filtered;
  }
});

// Helper function to extract timestamp from Firebase Timestamp or ISO string
const getTimestamp = (date: any): number => {
  if (!date) return 0;

  // If it's a Firebase Timestamp object
  if (date && typeof date === 'object' && 'toDate' in date) {
    return date.toDate().getTime();
  }

  // If it's a string (ISO format)
  if (typeof date === 'string') {
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  }

  // If it's already a Date object
  if (date instanceof Date) {
    return date.getTime();
  }

  // If it's a number (timestamp)
  if (typeof date === 'number') {
    return date;
  }

  return 0;
};

const setupResourcesSubscription = () => {
  // Clean up previous subscription if exists
  if (unsubscribeResources) {
    unsubscribeResources();
    unsubscribeResources = null;
  }

  loading.value = true;

  // Set up real-time subscription
  unsubscribeResources = subscribeToResources(
    (updatedResources) => {
      resources.value = updatedResources;
      loading.value = false;
    },
    (error) => {
      console.error('Error in resources subscription:', error);
      loading.value = false;
    }
  );
};

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

const getMusicOptionName = (optionId: string | undefined, options: ResourceOption[]): string => {
  if (!optionId) return '';
  const option = options.find(o => o.id === optionId);
  return option?.name || '';
};

const handleSearch = () => {
  // Search filtering is now reactive through computed property, no need to reload
};

const handleRefresh = async (event: any) => {
  // Collections still need manual refresh, but resources are real-time
  await loadResourceCollections();
  event.target.complete();
};

const selectCollectionFilter = (collectionId: string) => {
  selectedCollection.value = collectionId;
  showCollectionFilter.value = false;
};

const clearCollectionFilter = () => {
  selectedCollection.value = '';
};

const clearAllFilters = () => {
  selectedCollection.value = '';
  searchQuery.value = '';
};

const getCollectionName = (collectionId: string): string => {
  const collection = collections.value.find(c => c.id === collectionId);
  return collection ? collection.name : 'Collection inconnue';
};

const getCollectionSymbol = (collectionId: string): string => {
  const collection = collections.value.find(c => c.id === collectionId);
  return collection ? collection.symbol : '?';
};

const getCollectionColor = (collectionId: string): string => {
  const collection = collections.value.find(c => c.id === collectionId);
  return collection ? collection.color : '#888888';
};

const getSortLabel = () => {
  switch (sortOption.value) {
    case SortOption.NEWEST:
      return 'Plus récent';
    case SortOption.OLDEST:
      return 'Plus ancien';
    case SortOption.ALPHABETICAL_ASC:
      return 'Alphabétique (A-Z)';
    case SortOption.ALPHABETICAL_DESC:
      return 'Alphabétique (Z-A)';
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


const getTypeIcon = (type: ResourceType) => {
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
      return documentOutline;
    default:
      return documentOutline;
  }
};

const getTypeColor = () => {
  return 'medium';
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
  setupResourcesSubscription();
  loadResourceCollections();
  loadMusicOptions();
});

// Clean up subscription on unmount
onUnmounted(() => {
  if (unsubscribeResources) {
    unsubscribeResources();
    unsubscribeResources = null;
  }
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

.collection-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  color: white;
  font-weight: bold;
  font-size: 0.75rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.resource-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.resource-title-row h2 {
  margin: 0;
}

.media-icons {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.media-icons ion-icon {
  font-size: 14px;
}

.resource-meta {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.25rem;
}

.music-props {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.music-prop {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
  background: var(--ion-color-light);
  padding: 2px 6px;
  border-radius: 4px;
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

  .resource-title-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .media-icons {
    margin-top: 0.25rem;
  }
}
</style>