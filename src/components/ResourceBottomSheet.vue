<template>
  <ion-modal
    :is-open="isOpen"
    :initial-breakpoint="0.5"
    :breakpoints="[0, 0.5, 0.75, 1]"
    :handle="true"
    :backdrop-dismiss="true"
    @did-dismiss="handleDismiss"
    class="resource-bottom-sheet"
  >
    <ion-header>
      <ion-toolbar>
        <ion-buttons v-if="currentView !== 'main'" slot="start">
          <ion-button @click="goBack">
            <ion-icon :icon="arrowBackOutline" />
          </ion-button>
        </ion-buttons>
        <ion-title>{{ viewTitle }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleDismiss">
            <ion-icon :icon="closeOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="sheet-content">
        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <ion-spinner name="crescent" />
          <p>Chargement...</p>
        </div>

        <!-- ===== MAIN VIEW ===== -->
        <div v-else-if="currentView === 'main'" class="main-view">
          <!-- Search Bar -->
          <div class="search-section">
            <ion-searchbar
              v-model="searchQuery"
              placeholder="Rechercher une ressource..."
              :debounce="300"
              @ion-input="handleSearch"
              @ion-clear="handleClearSearch"
            />
          </div>

          <!-- Search Results -->
          <div v-if="searchQuery.trim()" class="search-results">
            <!-- Your Resources -->
            <div v-if="filteredResources.length > 0" class="result-section">
              <div class="section-header">
                <ion-icon :icon="libraryOutline" />
                <span>Vos ressources</span>
              </div>
              <div class="resource-list">
                <div
                  v-for="resource in filteredResources.slice(0, 5)"
                  :key="resource.id"
                  class="resource-item"
                  @click="selectResource(resource)"
                >
                  <span class="resource-icon">{{ getResourceIcon(resource) }}</span>
                  <div class="resource-info">
                    <span class="resource-title">{{ resource.title }}</span>
                    <span class="resource-meta">{{ getResourceMeta(resource) }}</span>
                  </div>
                  <span v-if="getCollectionSymbol(resource)" class="resource-badge">
                    {{ getCollectionSymbol(resource) }}
                  </span>
                  <button class="add-btn" @click.stop="selectResource(resource)">
                    <ion-icon :icon="addOutline" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Create New Option -->
            <div class="result-section create-section">
              <button class="create-resource-btn" @click="navigateTo('create')">
                <ion-icon :icon="addCircleOutline" />
                <span>Créer "{{ searchQuery }}" comme nouvelle ressource</span>
              </button>
            </div>

            <!-- No Results -->
            <div v-if="filteredResources.length === 0" class="no-results">
              <ion-icon :icon="searchOutline" />
              <p>Aucune ressource trouvée pour "{{ searchQuery }}"</p>
            </div>
          </div>

          <!-- Default View (no search) -->
          <div v-else class="default-view">
            <!-- Smart Suggestions (based on item type/title) -->
            <div v-if="smartSuggestions.length > 0" class="result-section suggestions-section">
              <div class="section-header">
                <ion-icon :icon="sparklesOutline" color="primary" />
                <span>Suggestions</span>
              </div>
              <div class="resource-list">
                <div
                  v-for="resource in smartSuggestions"
                  :key="resource.id"
                  class="resource-item suggestion-item"
                  @click="selectResource(resource)"
                >
                  <span class="resource-icon">{{ getResourceIcon(resource) }}</span>
                  <div class="resource-info">
                    <span class="resource-title">{{ resource.title }}</span>
                    <span class="resource-meta">{{ getResourceMeta(resource) }}</span>
                  </div>
                  <span v-if="getCollectionSymbol(resource)" class="resource-badge">
                    {{ getCollectionSymbol(resource) }}
                  </span>
                  <button class="add-btn quick-link-btn" @click.stop="selectResource(resource)" title="Lier directement">
                    <ion-icon :icon="linkOutline" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Recent Resources -->
            <div v-if="recentResources.length > 0" class="result-section">
              <div class="section-header">
                <ion-icon :icon="timeOutline" />
                <span>Récents</span>
              </div>
              <div class="recent-chips">
                <button
                  v-for="resource in recentResources.slice(0, 8)"
                  :key="resource.id"
                  class="recent-chip"
                  @click="selectResource(resource)"
                >
                  <span class="chip-icon">{{ getResourceIcon(resource) }}</span>
                  <span class="chip-title">{{ truncateTitle(resource.title) }}</span>
                </button>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="quick-actions">
              <div class="section-header">
                <ion-icon :icon="flashOutline" />
                <span>Actions rapides</span>
              </div>
              <div class="action-buttons">
                <button class="action-btn" @click="navigateTo('existing')">
                  <div class="action-icon">📚</div>
                  <span>Existante</span>
                </button>
                <button class="action-btn" @click="navigateTo('youtube')">
                  <div class="action-icon">🔍</div>
                  <span>YouTube</span>
                </button>
                <button class="action-btn" @click="navigateTo('url')">
                  <div class="action-icon">🔗</div>
                  <span>Lien URL</span>
                </button>
                <button class="action-btn" @click="navigateTo('create')">
                  <div class="action-icon">✨</div>
                  <span>Créer</span>
                </button>
              </div>
            </div>

            <!-- All Resources Link -->
            <button class="view-all-btn" @click="navigateTo('existing')">
              Voir toutes les ressources
              <ion-icon :icon="chevronForwardOutline" />
            </button>
          </div>
        </div>

        <!-- ===== EXISTING RESOURCES VIEW ===== -->
        <div v-else-if="currentView === 'existing'" class="existing-view">
          <!-- Search Bar -->
          <div class="search-section">
            <ion-searchbar
              v-model="existingSearchQuery"
              placeholder="Rechercher dans vos ressources..."
              :debounce="300"
            />
          </div>

          <!-- Collection Filter Chips -->
          <div class="collection-filters">
            <button
              class="filter-chip"
              :class="{ active: selectedCollectionId === null }"
              @click="selectedCollectionId = null"
            >
              Tous
            </button>
            <button
              v-for="collection in collections"
              :key="collection.id"
              class="filter-chip"
              :class="{ active: selectedCollectionId === collection.id }"
              @click="selectedCollectionId = collection.id"
            >
              {{ collection.symbol || collection.name }}
            </button>
          </div>

          <!-- Resource List -->
          <div class="resource-list">
            <div
              v-for="resource in existingFilteredResources"
              :key="resource.id"
              class="resource-item"
              @click="selectResource(resource)"
            >
              <span class="resource-icon">{{ getResourceIcon(resource) }}</span>
              <div class="resource-info">
                <span class="resource-title">{{ resource.title }}</span>
                <span class="resource-meta">{{ getResourceMeta(resource) }}</span>
              </div>
              <span v-if="getCollectionSymbol(resource)" class="resource-badge">
                {{ getCollectionSymbol(resource) }}
              </span>
              <button class="add-btn" @click.stop="selectResource(resource)">
                <ion-icon :icon="addOutline" />
              </button>
            </div>
          </div>

          <div v-if="existingFilteredResources.length === 0" class="no-results">
            <ion-icon :icon="searchOutline" />
            <p>Aucune ressource trouvée</p>
          </div>
        </div>

        <!-- ===== YOUTUBE SEARCH VIEW ===== -->
        <div v-else-if="currentView === 'youtube'" class="youtube-view">
          <!-- Search Bar with Button -->
          <div class="youtube-search-section">
            <ion-searchbar
              v-model="youtubeSearchQuery"
              placeholder="Rechercher une vidéo YouTube..."
              :debounce="0"
              @keyup.enter="searchYouTube"
            />
            <ion-button @click="searchYouTube" :disabled="!youtubeSearchQuery.trim() || searchingYouTube">
              <ion-icon v-if="!searchingYouTube" :icon="searchOutline" slot="start" />
              <ion-spinner v-else name="crescent" />
              Chercher
            </ion-button>
          </div>

          <!-- Recent Searches -->
          <div v-if="!youtubeSearchQuery.trim() && recentYouTubeSearches.length > 0" class="result-section">
            <div class="section-header">
              <ion-icon :icon="timeOutline" />
              <span>Recherches récentes</span>
            </div>
            <div class="recent-searches">
              <button
                v-for="search in recentYouTubeSearches"
                :key="search"
                class="recent-search-chip"
                @click="youtubeSearchQuery = search; searchYouTube()"
              >
                {{ search }}
              </button>
            </div>
          </div>

          <!-- YouTube Results -->
          <div v-if="youtubeResults.length > 0" class="result-section">
            <div class="section-header">
              <ion-icon :icon="logoYoutube" color="danger" />
              <span>Résultats</span>
            </div>
            <div class="youtube-results">
              <div
                v-for="video in youtubeResults"
                :key="video.id"
                class="youtube-result-item"
              >
                <div class="youtube-thumb" v-if="video.thumbnail">
                  <img :src="video.thumbnail" :alt="video.title" />
                  <div class="youtube-duration" v-if="video.duration">{{ video.duration }}</div>
                </div>
                <div class="youtube-info">
                  <span class="youtube-title">{{ video.title }}</span>
                  <span class="youtube-channel">{{ video.channelTitle }}</span>
                  <span v-if="video.viewCount" class="youtube-views">{{ formatViewCount(video.viewCount) }} vues</span>
                </div>
                <div class="youtube-actions">
                  <ion-button fill="outline" size="small" @click="previewYouTubeVideo(video)">
                    <ion-icon :icon="playOutline" slot="start" />
                    Aperçu
                  </ion-button>
                  <ion-button fill="solid" size="small" @click="selectYouTubeVideo(video)">
                    <ion-icon :icon="linkOutline" slot="start" />
                    Lier
                  </ion-button>
                </div>
              </div>
            </div>
          </div>

          <!-- No Results -->
          <div v-if="youtubeSearchQuery.trim() && youtubeResults.length === 0 && !searchingYouTube && hasSearchedYouTube" class="no-results">
            <ion-icon :icon="logoYoutube" />
            <p>Aucune vidéo trouvée pour "{{ youtubeSearchQuery }}"</p>
          </div>
        </div>

        <!-- ===== URL PASTE VIEW ===== -->
        <div v-else-if="currentView === 'url'" class="url-view">
          <div class="url-input-section">
            <p class="url-instruction">Collez un lien YouTube, PDF, ou autre:</p>
            <ion-textarea
              v-model="urlInput"
              placeholder="https://youtube.com/watch?v=..."
              :rows="2"
              :auto-grow="true"
            />
            <ion-button expand="block" fill="outline" @click="pasteFromClipboard">
              <ion-icon :icon="clipboardOutline" slot="start" />
              Coller depuis presse-papiers
            </ion-button>
          </div>

          <!-- URL Preview -->
          <div v-if="urlPreview" class="url-preview">
            <div class="section-header">
              <ion-icon :icon="eyeOutline" />
              <span>Aperçu</span>
            </div>
            <div class="preview-card">
              <div v-if="urlPreview.thumbnail" class="preview-thumb">
                <img :src="urlPreview.thumbnail" :alt="urlPreview.title" />
              </div>
              <div class="preview-icon" v-else>
                {{ getUrlTypeIcon(urlPreview.type) }}
              </div>
              <div class="preview-info">
                <span class="preview-title">{{ urlPreview.title }}</span>
                <span class="preview-type">{{ urlPreview.typeName }}</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div v-if="urlInput.trim()" class="url-actions">
            <ion-button expand="block" @click="linkUrl" :disabled="!isValidUrl">
              <ion-icon :icon="linkOutline" slot="start" />
              Lier cette URL
            </ion-button>
          </div>
        </div>

        <!-- ===== CREATE RESOURCE VIEW ===== -->
        <div v-else-if="currentView === 'create'" class="create-view">
          <div class="create-form">
            <ion-item lines="none">
              <ion-label position="stacked">Titre</ion-label>
              <ion-input
                v-model="newResourceTitle"
                placeholder="Nom de la ressource"
                :clear-input="true"
              />
            </ion-item>

            <ion-item lines="none">
              <ion-label position="stacked">Collection</ion-label>
              <ion-select v-model="newResourceCollectionId" placeholder="Sélectionner">
                <ion-select-option :value="null">Aucune</ion-select-option>
                <ion-select-option v-for="c in collections" :key="c.id" :value="c.id">
                  {{ c.symbol ? `[${c.symbol}] ` : '' }}{{ c.name }}
                </ion-select-option>
              </ion-select>
            </ion-item>

            <div class="content-type-section">
              <ion-label>Type de contenu</ion-label>
              <div class="content-type-buttons">
                <button
                  v-for="type in contentTypes"
                  :key="type.value"
                  class="content-type-btn"
                  :class="{ active: newResourceContentType === type.value }"
                  @click="newResourceContentType = type.value"
                >
                  <span class="type-icon">{{ type.icon }}</span>
                  <span>{{ type.label }}</span>
                </button>
              </div>
            </div>
          </div>

          <ion-button
            expand="block"
            @click="createAndLinkResource"
            :disabled="!newResourceTitle.trim()"
            class="ion-margin-top"
          >
            <ion-icon :icon="addCircleOutline" slot="start" />
            Créer et lier
          </ion-button>
        </div>
      </div>
    </ion-content>

    <!-- YouTube Preview Modal -->
    <ion-modal :is-open="showYouTubePreview" @did-dismiss="showYouTubePreview = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>Aperçu</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="showYouTubePreview = false">
              <ion-icon :icon="closeOutline" />
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <div v-if="previewingVideo" class="youtube-preview-content">
          <iframe
            :src="`https://www.youtube.com/embed/${previewingVideo.videoId}`"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
          <div class="preview-video-info">
            <h3>{{ previewingVideo.title }}</h3>
            <p>{{ previewingVideo.channelTitle }}</p>
          </div>
          <ion-button expand="block" @click="selectYouTubeVideo(previewingVideo); showYouTubePreview = false">
            <ion-icon :icon="linkOutline" slot="start" />
            Lier cette vidéo
          </ion-button>
        </div>
      </ion-content>
    </ion-modal>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonIcon, IonSearchbar, IonSpinner, IonTextarea,
  IonItem, IonLabel, IonInput, IonSelect, IonSelectOption
} from '@ionic/vue';
import {
  closeOutline, addOutline, addCircleOutline, searchOutline,
  timeOutline, flashOutline, chevronForwardOutline, libraryOutline, logoYoutube,
  arrowBackOutline, playOutline, linkOutline, clipboardOutline, eyeOutline,
  sparklesOutline
} from 'ionicons/icons';
import { ResourceType, type Resource, type ResourceCollection } from '@/types/resource';
import { getResources, getResourceCollections, createResource } from '@/firebase/resources';
import { searchYouTubeVideos } from '@/services/youtubeService';
import { getSmartSuggestions } from '@/utils/resource-suggestions';

type ViewType = 'main' | 'existing' | 'youtube' | 'url' | 'create';

interface YouTubeResult {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail?: string;
  videoId: string;
  duration?: string;
  viewCount?: number;
}

interface UrlPreview {
  type: 'youtube' | 'pdf' | 'image' | 'link';
  typeName: string;
  title: string;
  thumbnail?: string;
  url: string;
}

interface Props {
  isOpen: boolean;
  excludeIds?: string[];
  userId?: string;
  itemType?: string;
  itemTitle?: string;
}

const props = withDefaults(defineProps<Props>(), {
  excludeIds: () => [],
  userId: '',
  itemType: '',
  itemTitle: ''
});

const emit = defineEmits<{
  'update:isOpen': [value: boolean];
  select: [resourceId: string];
  selectYouTube: [video: YouTubeResult];
  createNew: [title: string];
  openExisting: [];
  openYouTube: [];
  openUrl: [];
}>();

// View State
const currentView = ref<ViewType>('main');

// Main View State
const loading = ref(false);
const searchQuery = ref('');
const resources = ref<Resource[]>([]);
const collections = ref<ResourceCollection[]>([]);
const recentResourceIds = ref<string[]>([]);

// Existing View State
const existingSearchQuery = ref('');
const selectedCollectionId = ref<string | null>(null);

// YouTube View State
const youtubeSearchQuery = ref('');
const youtubeResults = ref<YouTubeResult[]>([]);
const searchingYouTube = ref(false);
const hasSearchedYouTube = ref(false);
const recentYouTubeSearches = ref<string[]>([]);
const showYouTubePreview = ref(false);
const previewingVideo = ref<YouTubeResult | null>(null);

// URL View State
const urlInput = ref('');
const urlPreview = ref<UrlPreview | null>(null);

// Create View State
const newResourceTitle = ref('');
const newResourceCollectionId = ref<string | null>(null);
const newResourceContentType = ref<string>('lyrics');

const contentTypes = [
  { value: 'lyrics', label: 'Paroles', icon: '🎵' },
  { value: 'youtube', label: 'YouTube', icon: '▶️' },
  { value: 'file', label: 'Fichier', icon: '📄' }
];

// Computed
const viewTitle = computed(() => {
  switch (currentView.value) {
    case 'existing': return 'Ressources existantes';
    case 'youtube': return 'Recherche YouTube';
    case 'url': return 'Coller un lien';
    case 'create': return 'Créer une ressource';
    default: return 'Ajouter une ressource';
  }
});

const filteredResources = computed(() => {
  if (!searchQuery.value.trim()) return [];

  const query = searchQuery.value.toLowerCase();
  return resources.value
    .filter(r => !props.excludeIds.includes(r.id))
    .filter(r =>
      r.title.toLowerCase().includes(query) ||
      r.tags?.some(t => t.toLowerCase().includes(query))
    );
});

const recentResources = computed(() => {
  return recentResourceIds.value
    .map(id => resources.value.find(r => r.id === id))
    .filter((r): r is Resource => r !== undefined && !props.excludeIds.includes(r.id))
    .slice(0, 8);
});

const existingFilteredResources = computed(() => {
  let filtered = resources.value.filter(r => !props.excludeIds.includes(r.id));

  if (selectedCollectionId.value) {
    filtered = filtered.filter(r => r.collectionId === selectedCollectionId.value);
  }

  if (existingSearchQuery.value.trim()) {
    const query = existingSearchQuery.value.toLowerCase();
    filtered = filtered.filter(r =>
      r.title.toLowerCase().includes(query) ||
      r.tags?.some(t => t.toLowerCase().includes(query))
    );
  }

  return filtered;
});

const isValidUrl = computed(() => {
  if (!urlInput.value.trim()) return false;
  try {
    new URL(urlInput.value.trim());
    return true;
  } catch {
    return false;
  }
});

// Smart suggestions based on item type and title
const smartSuggestions = computed(() => {
  if (!props.itemType && !props.itemTitle) return [];
  if (resources.value.length === 0) return [];

  return getSmartSuggestions(
    props.itemType,
    props.itemTitle,
    resources.value,
    props.excludeIds,
    5
  );
});

// Load data on mount
onMounted(() => {
  // Load recent resources
  const storedRecent = localStorage.getItem('recentResourceIds');
  if (storedRecent) {
    try {
      recentResourceIds.value = JSON.parse(storedRecent);
    } catch {
      recentResourceIds.value = [];
    }
  }

  // Load recent YouTube searches
  const storedYouTube = localStorage.getItem('recentYouTubeSearches');
  if (storedYouTube) {
    try {
      recentYouTubeSearches.value = JSON.parse(storedYouTube);
    } catch {
      recentYouTubeSearches.value = [];
    }
  }
});

// Watch for modal open
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    await loadResources();
  } else {
    resetState();
  }
});

// Watch URL input for preview
watch(urlInput, async (url) => {
  if (url.trim() && isValidUrl.value) {
    urlPreview.value = await generateUrlPreview(url.trim());
  } else {
    urlPreview.value = null;
  }
});

// Methods
const loadResources = async () => {
  if (resources.value.length > 0) return;

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

const resetState = () => {
  currentView.value = 'main';
  searchQuery.value = '';
  existingSearchQuery.value = '';
  selectedCollectionId.value = null;
  youtubeSearchQuery.value = '';
  youtubeResults.value = [];
  hasSearchedYouTube.value = false;
  urlInput.value = '';
  urlPreview.value = null;
  newResourceTitle.value = '';
  newResourceCollectionId.value = null;
  newResourceContentType.value = 'lyrics';
};

const handleDismiss = () => {
  emit('update:isOpen', false);
};

const goBack = () => {
  currentView.value = 'main';
};

const navigateTo = (view: ViewType) => {
  // Pre-fill create title from search query if navigating to create
  if (view === 'create' && searchQuery.value.trim()) {
    newResourceTitle.value = searchQuery.value.trim();
  }
  currentView.value = view;
};

const handleSearch = () => {
  // Just filter existing resources in main view
};

const handleClearSearch = () => {
  searchQuery.value = '';
};

const selectResource = (resource: Resource) => {
  addToRecent(resource.id);
  emit('select', resource.id);
  handleDismiss();
};

const selectYouTubeVideo = (video: YouTubeResult) => {
  emit('selectYouTube', video);
  handleDismiss();
};

const addToRecent = (resourceId: string) => {
  const recents = recentResourceIds.value.filter(id => id !== resourceId);
  recents.unshift(resourceId);
  recentResourceIds.value = recents.slice(0, 20);
  localStorage.setItem('recentResourceIds', JSON.stringify(recentResourceIds.value));
};

// YouTube Methods
const searchYouTube = async () => {
  if (!youtubeSearchQuery.value.trim() || searchingYouTube.value) return;

  try {
    searchingYouTube.value = true;
    hasSearchedYouTube.value = true;

    // Save to recent searches
    addToRecentYouTubeSearches(youtubeSearchQuery.value.trim());

    // Call YouTube API
    const results = await searchYouTubeVideos(youtubeSearchQuery.value.trim());
    youtubeResults.value = results.map(r => ({
      id: r.id,
      title: r.title,
      channelTitle: r.channelTitle,
      thumbnail: r.thumbnail,
      videoId: r.videoId,
      duration: r.duration,
      viewCount: r.viewCount
    }));
  } catch (error) {
    console.error('Error searching YouTube:', error);
    youtubeResults.value = [];
  } finally {
    searchingYouTube.value = false;
  }
};

const addToRecentYouTubeSearches = (search: string) => {
  const recents = recentYouTubeSearches.value.filter(s => s.toLowerCase() !== search.toLowerCase());
  recents.unshift(search);
  recentYouTubeSearches.value = recents.slice(0, 10);
  localStorage.setItem('recentYouTubeSearches', JSON.stringify(recentYouTubeSearches.value));
};

const previewYouTubeVideo = (video: YouTubeResult) => {
  previewingVideo.value = video;
  showYouTubePreview.value = true;
};

const formatViewCount = (count: number): string => {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(0) + 'K';
  }
  return count.toString();
};

// URL Methods
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText();
    urlInput.value = text;
  } catch (error) {
    console.error('Error reading clipboard:', error);
  }
};

const generateUrlPreview = async (url: string): Promise<UrlPreview | null> => {
  try {
    const urlObj = new URL(url);

    // YouTube detection
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      const videoId = urlObj.hostname.includes('youtu.be')
        ? urlObj.pathname.slice(1)
        : urlObj.searchParams.get('v');

      return {
        type: 'youtube',
        typeName: 'YouTube',
        title: 'Vidéo YouTube',
        thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : undefined,
        url
      };
    }

    // PDF detection
    if (url.toLowerCase().endsWith('.pdf')) {
      return {
        type: 'pdf',
        typeName: 'PDF',
        title: urlObj.pathname.split('/').pop() || 'Document PDF',
        url
      };
    }

    // Image detection
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) {
      return {
        type: 'image',
        typeName: 'Image',
        title: urlObj.pathname.split('/').pop() || 'Image',
        thumbnail: url,
        url
      };
    }

    // Default link
    return {
      type: 'link',
      typeName: 'Lien',
      title: urlObj.hostname,
      url
    };
  } catch {
    return null;
  }
};

const getUrlTypeIcon = (type: string): string => {
  switch (type) {
    case 'youtube': return '▶️';
    case 'pdf': return '📄';
    case 'image': return '🖼️';
    default: return '🔗';
  }
};

const linkUrl = () => {
  if (!isValidUrl.value) return;

  // Emit the URL - the parent can handle creating/linking it
  emit('openUrl');
  handleDismiss();
};

// Create Resource Methods
const createAndLinkResource = async () => {
  if (!newResourceTitle.value.trim()) return;

  try {
    loading.value = true;

    // Create the resource
    const resourceId = await createResource({
      title: newResourceTitle.value.trim(),
      collectionId: newResourceCollectionId.value || '',
      contents: [],
      tags: [],
      createdBy: props.userId,
      updatedBy: props.userId
    });

    // Select the newly created resource
    if (resourceId) {
      addToRecent(resourceId);
      emit('select', resourceId);
      handleDismiss();
    }
  } catch (error) {
    console.error('Error creating resource:', error);
  } finally {
    loading.value = false;
  }
};

// Helper Methods
const getResourceIcon = (resource: Resource): string => {
  if (!resource.contents || resource.contents.length === 0) return '📄';

  const types = resource.contents.map(c => c.type);
  if (types.includes(ResourceType.LYRICS)) return '🎵';
  if (types.includes(ResourceType.YOUTUBE)) return '▶️';
  if (types.includes(ResourceType.VIDEO)) return '🎥';
  if (types.includes(ResourceType.AUDIO)) return '🔊';
  if (types.includes(ResourceType.MUSIC_SHEET)) return '🎼';
  return '📄';
};

const getResourceMeta = (resource: Resource): string => {
  if (!resource.contents || resource.contents.length === 0) return '';

  const typeNames: Record<string, string> = {
    lyrics: 'Paroles',
    video: 'Vidéo',
    audio: 'Audio',
    music_sheet: 'Partition',
    youtube: 'YouTube',
    spotify: 'Spotify',
    file: 'Fichier'
  };

  return resource.contents
    .map(c => typeNames[c.type])
    .filter(Boolean)
    .join(' · ');
};

const getCollectionSymbol = (resource: Resource): string | null => {
  if (!resource.collectionId) return null;
  const collection = collections.value.find(c => c.id === resource.collectionId);
  return collection?.symbol || null;
};

const truncateTitle = (title: string, maxLength = 20): string => {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength - 3) + '...';
};
</script>

<style scoped>
.resource-bottom-sheet {
  --height: auto;
  --border-radius: 24px 24px 0 0;
}

.sheet-content {
  padding: 16px;
  padding-bottom: 32px;
  min-height: 300px;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--ion-color-medium);
}

.loading-state p {
  margin-top: 12px;
  font-size: 14px;
}

/* Search Section */
.search-section {
  margin-bottom: 16px;
}

.search-section ion-searchbar {
  --background: var(--ion-color-light);
  --border-radius: 12px;
  --box-shadow: none;
  --padding-start: 12px;
  --padding-end: 12px;
}

/* Section Header */
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--ion-color-medium);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-header ion-icon {
  font-size: 16px;
}

/* Result Section */
.result-section {
  margin-bottom: 24px;
}

/* Resource List */
.resource-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--ion-color-light);
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.resource-item:hover {
  background: var(--ion-color-light-shade);
}

.resource-item:active {
  transform: scale(0.99);
}

.resource-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.resource-info {
  flex: 1;
  min-width: 0;
}

.resource-title {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-color-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.resource-meta {
  display: block;
  font-size: 12px;
  color: var(--ion-color-medium);
  margin-top: 2px;
}

.resource-badge {
  font-size: 11px;
  font-weight: 600;
  color: var(--ion-color-primary);
  background: var(--ion-color-primary-tint);
  padding: 4px 8px;
  border-radius: 6px;
}

.add-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ion-color-primary);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.add-btn:hover {
  background: var(--ion-color-primary-shade);
  transform: scale(1.1);
}

.add-btn ion-icon {
  font-size: 20px;
}

/* Suggestions Section */
.suggestions-section {
  background: linear-gradient(135deg, var(--ion-color-primary-tint) 0%, transparent 100%);
  margin: -16px -16px 16px -16px;
  padding: 16px;
  border-radius: 0 0 16px 16px;
}

.suggestion-item {
  background: white;
  border: 1px solid var(--ion-color-primary-tint);
}

.suggestion-item:hover {
  background: var(--ion-color-primary-tint);
  border-color: var(--ion-color-primary);
}

.quick-link-btn {
  background: var(--ion-color-success);
}

.quick-link-btn:hover {
  background: var(--ion-color-success-shade);
}

/* Recent Chips */
.recent-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.recent-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--ion-color-light);
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.recent-chip:hover {
  background: var(--ion-color-primary-tint);
}

.recent-chip:active {
  transform: scale(0.95);
}

.chip-icon {
  font-size: 14px;
}

.chip-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--ion-color-dark);
}

/* Quick Actions */
.quick-actions {
  margin-bottom: 24px;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  background: var(--ion-color-light);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: var(--ion-color-light-shade);
}

.action-btn:active {
  transform: scale(0.95);
}

.action-icon {
  font-size: 24px;
}

.action-btn span {
  font-size: 12px;
  font-weight: 500;
  color: var(--ion-color-dark);
}

/* Create Resource Button */
.create-resource-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  background: var(--ion-color-primary-tint);
  color: var(--ion-color-primary);
  border: 1px dashed var(--ion-color-primary);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.create-resource-btn:hover {
  background: var(--ion-color-primary);
  color: white;
  border-style: solid;
}

.create-resource-btn ion-icon {
  font-size: 20px;
}

/* View All Button */
.view-all-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  background: transparent;
  color: var(--ion-color-primary);
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.view-all-btn ion-icon {
  font-size: 18px;
}

/* No Results */
.no-results {
  text-align: center;
  padding: 32px;
  color: var(--ion-color-medium);
}

.no-results ion-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.no-results p {
  font-size: 14px;
}

/* Collection Filters */
.collection-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.filter-chip {
  padding: 8px 16px;
  background: var(--ion-color-light);
  border: 1px solid transparent;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: var(--ion-color-dark);
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-chip:hover {
  background: var(--ion-color-light-shade);
}

.filter-chip.active {
  background: var(--ion-color-primary-tint);
  border-color: var(--ion-color-primary);
  color: var(--ion-color-primary);
}

/* YouTube View */
.youtube-search-section {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.youtube-search-section ion-searchbar {
  flex: 1;
  --background: var(--ion-color-light);
  --border-radius: 12px;
  --box-shadow: none;
}

.youtube-search-section ion-button {
  --padding-start: 16px;
  --padding-end: 16px;
}

.recent-searches {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.recent-search-chip {
  padding: 6px 12px;
  background: var(--ion-color-light);
  border: none;
  border-radius: 16px;
  font-size: 13px;
  color: var(--ion-color-dark);
  cursor: pointer;
  transition: all 0.2s ease;
}

.recent-search-chip:hover {
  background: var(--ion-color-primary-tint);
}

.youtube-results {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.youtube-result-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: var(--ion-color-light);
  border-radius: 12px;
}

.youtube-result-item .youtube-thumb {
  width: 120px;
  height: 68px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
}

.youtube-result-item .youtube-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.youtube-duration {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  font-size: 11px;
  padding: 2px 4px;
  border-radius: 4px;
}

.youtube-info {
  flex: 1;
  min-width: 0;
}

.youtube-title {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-color-dark);
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.youtube-channel {
  display: block;
  font-size: 12px;
  color: var(--ion-color-medium);
}

.youtube-views {
  display: block;
  font-size: 11px;
  color: var(--ion-color-medium);
  margin-top: 2px;
}

.youtube-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
}

.youtube-actions ion-button {
  --padding-start: 12px;
  --padding-end: 12px;
  font-size: 12px;
}

/* YouTube Preview */
.youtube-preview-content {
  padding: 16px;
}

.youtube-preview-content iframe {
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 12px;
}

.preview-video-info {
  padding: 16px 0;
}

.preview-video-info h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
}

.preview-video-info p {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 14px;
}

/* URL View */
.url-input-section {
  margin-bottom: 24px;
}

.url-instruction {
  font-size: 14px;
  color: var(--ion-color-medium);
  margin-bottom: 12px;
}

.url-input-section ion-textarea {
  --background: var(--ion-color-light);
  --padding-start: 12px;
  --padding-end: 12px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  border-radius: 12px;
  margin-bottom: 12px;
}

.url-preview {
  margin-bottom: 24px;
}

.preview-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--ion-color-light);
  border-radius: 12px;
}

.preview-thumb {
  width: 80px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.preview-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  background: var(--ion-color-light-shade);
  border-radius: 8px;
  flex-shrink: 0;
}

.preview-info {
  flex: 1;
  min-width: 0;
}

.preview-title {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-color-dark);
}

.preview-type {
  display: block;
  font-size: 12px;
  color: var(--ion-color-medium);
  margin-top: 2px;
}

.url-actions {
  margin-top: 16px;
}

/* Create View */
.create-form ion-item {
  --background: var(--ion-color-light);
  --border-radius: 12px;
  margin-bottom: 12px;
}

.content-type-section {
  margin-top: 16px;
}

.content-type-section ion-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
  color: var(--ion-color-medium);
}

.content-type-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.content-type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  background: var(--ion-color-light);
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.content-type-btn:hover {
  background: var(--ion-color-light-shade);
}

.content-type-btn.active {
  border-color: var(--ion-color-primary);
  background: var(--ion-color-primary-tint);
}

.content-type-btn .type-icon {
  font-size: 20px;
}

.content-type-btn span {
  font-size: 12px;
  font-weight: 500;
  color: var(--ion-color-dark);
}

/* Mobile optimizations */
@media (max-width: 400px) {
  .action-buttons {
    grid-template-columns: repeat(2, 1fr);
  }

  .youtube-result-item {
    flex-direction: column;
  }

  .youtube-result-item .youtube-thumb {
    width: 100%;
    height: auto;
    aspect-ratio: 16/9;
  }

  .youtube-actions {
    flex-direction: row;
    justify-content: flex-end;
  }
}
</style>
