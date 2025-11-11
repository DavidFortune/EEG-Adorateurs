<template>
  <div class="natural-resource-selector">
    <!-- Search Input -->
    <div class="search-field">
      <ion-item>
        <ion-label position="stacked">Rechercher une chanson</ion-label>
        <ion-input
          v-model="searchQuery"
          placeholder="Ex: Amazing Grace"
          @keyup.enter="searchYouTube"
        ></ion-input>
        <ion-button
          slot="end"
          @click="searchYouTube"
          :disabled="!searchQuery || loading"
          fill="solid"
          size="small"
        >
          <ion-icon :icon="searchOutline" slot="icon-only" v-if="!loading" />
          <ion-spinner v-if="loading" name="crescent"></ion-spinner>
        </ion-button>
      </ion-item>
    </div>

    <!-- Search Results -->
    <div v-if="searchResults.length > 0" class="search-results">
      <h4>Résultats YouTube</h4>
      <div
        v-for="result in searchResults"
        :key="result.id"
        class="result-item"
        :class="{ selected: selectedResult?.id === result.id }"
      >
        <div class="result-thumbnail" @click="selectResult(result)">
          <img :src="result.thumbnail" :alt="result.title" />
          <div class="play-overlay">
            <ion-icon :icon="playCircleOutline" />
          </div>
        </div>
        <div class="result-info" @click="selectResult(result)">
          <h5 class="result-title">{{ result.title }}</h5>
          <p class="result-channel">{{ result.channel }}</p>
        </div>
        <div class="result-actions">
          <ion-button
            @click="previewVideo(result)"
            fill="clear"
            size="small"
            color="primary"
          >
            <ion-icon :icon="playCircleOutline" slot="icon-only" />
          </ion-button>
          <ion-icon
            :icon="selectedResult?.id === result.id ? checkmarkCircle : ellipseOutline"
            :color="selectedResult?.id === result.id ? 'primary' : 'medium'"
            class="selection-icon"
            @click="selectResult(result)"
          />
        </div>
      </div>
    </div>

    <!-- Video Preview Modal -->
    <ion-modal :is-open="showPreviewModal" @will-dismiss="closePreview">
      <ion-header>
        <ion-toolbar>
          <ion-title>Aperçu vidéo</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closePreview">
              <ion-icon :icon="closeOutline" />
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <div class="video-preview-container" v-if="previewingVideo">
          <iframe
            :src="`https://www.youtube.com/embed/${previewingVideo.id}`"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            class="video-iframe"
          ></iframe>
          <div class="video-info">
            <h3>{{ previewingVideo.title }}</h3>
            <p class="channel-name">{{ previewingVideo.channel }}</p>
          </div>
        </div>
      </ion-content>
      <ion-footer>
        <ion-toolbar>
          <div class="preview-actions">
            <ion-button @click="closePreview" fill="outline" color="medium">
              Fermer
            </ion-button>
            <ion-button @click="selectAndCreateFromPreview">
              <ion-icon :icon="addOutline" slot="start" />
              Créer et lier
            </ion-button>
          </div>
        </ion-toolbar>
      </ion-footer>
    </ion-modal>

    <!-- No Results -->
    <div v-if="searchPerformed && searchResults.length === 0 && !loading" class="no-results">
      <ion-icon :icon="searchOutline" />
      <p>Aucun résultat trouvé</p>
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="error-message">
      <ion-icon :icon="alertCircleOutline" color="danger" />
      <p>{{ errorMessage }}</p>
    </div>

    <!-- Lyrics Input (Optional) -->
    <div v-if="selectedResult" class="lyrics-section">
      <h4>Ajouter les paroles (optionnel)</h4>
      <ion-item>
        <ion-label position="stacked">Paroles</ion-label>
        <ion-textarea
          v-model="lyrics"
          placeholder="Collez les paroles ici..."
          :rows="6"
          @ion-input="handleLyricsInput"
        ></ion-textarea>
      </ion-item>
      <p class="lyrics-note">
        Note: Assurez-vous d'avoir les droits pour utiliser ces paroles.
        Le champ description de la vidéo peut parfois contenir les paroles.
      </p>
      <ion-button
        @click="fetchVideoMetadata"
        fill="outline"
        size="small"
        :disabled="loadingMetadata"
      >
        <ion-spinner v-if="loadingMetadata" name="crescent" slot="start"></ion-spinner>
        <ion-icon v-else :icon="documentTextOutline" slot="start" />
        {{ loadingMetadata ? 'Chargement...' : 'Voir la description de la vidéo' }}
      </ion-button>
    </div>

    <!-- Action Buttons -->
    <div v-if="selectedResult" class="action-buttons">
      <ion-button @click="createAndLinkResource" expand="block" :disabled="creating">
        <ion-spinner v-if="creating" name="crescent" slot="start"></ion-spinner>
        <ion-icon v-else :icon="addOutline" slot="start" />
        {{ creating ? 'Création en cours...' : 'Créer et lier la ressource' }}
      </ion-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  IonItem, IonLabel, IonInput, IonButton, IonIcon, IonSpinner,
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonContent, IonFooter,
  IonTextarea
} from '@ionic/vue';
import {
  searchOutline, checkmarkCircle, ellipseOutline, addOutline, alertCircleOutline,
  playCircleOutline, closeOutline, documentTextOutline
} from 'ionicons/icons';
import type { Resource } from '@/types/resource';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/firebase/config';

interface YouTubeSearchResult {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  videoUrl: string;
}

interface Props {
  modelValue: string | null;
}

interface Emits {
  (event: 'update:modelValue', value: string | null): void;
  (event: 'resource-created', resource: Resource): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// State
const searchQuery = ref('');
const searchResults = ref<YouTubeSearchResult[]>([]);
const selectedResult = ref<YouTubeSearchResult | null>(null);
const loading = ref(false);
const creating = ref(false);
const searchPerformed = ref(false);
const errorMessage = ref('');
const showPreviewModal = ref(false);
const previewingVideo = ref<YouTubeSearchResult | null>(null);
const lyrics = ref('');
const loadingMetadata = ref(false);

// Search YouTube using Firebase Functions
const searchYouTube = async () => {
  if (!searchQuery.value.trim()) return;

  loading.value = true;
  errorMessage.value = '';
  searchPerformed.value = true;

  try {
    const functions = getFunctions(app);
    const searchYouTubeFn = httpsCallable(functions, 'searchYouTube');
    const result = await searchYouTubeFn({ query: searchQuery.value });
    const data = result.data as { results: YouTubeSearchResult[] };
    searchResults.value = data.results || [];
  } catch (error: any) {
    console.error('Error searching YouTube:', error);
    errorMessage.value = error.message || 'Erreur lors de la recherche. Veuillez réessayer.';
    searchResults.value = [];
  } finally {
    loading.value = false;
  }
};

// Select a result
const selectResult = (result: YouTubeSearchResult) => {
  selectedResult.value = result;
};

// Preview video
const previewVideo = (result: YouTubeSearchResult) => {
  previewingVideo.value = result;
  showPreviewModal.value = true;
};

// Close preview
const closePreview = () => {
  showPreviewModal.value = false;
  previewingVideo.value = null;
};

// Select and create from preview
const selectAndCreateFromPreview = async () => {
  if (previewingVideo.value) {
    selectedResult.value = previewingVideo.value;
    closePreview();
    await createAndLinkResource();
  }
};

// Handle lyrics input
const handleLyricsInput = () => {
  // Just update the ref, no special handling needed
};

// Fetch video metadata (description)
const fetchVideoMetadata = async () => {
  if (!selectedResult.value) return;

  loadingMetadata.value = true;
  errorMessage.value = '';

  try {
    const functions = getFunctions(app);
    const getMetadataFn = httpsCallable(functions, 'getVideoMetadata');
    const result = await getMetadataFn({ videoId: selectedResult.value.id });
    const data = result.data as { description: string; metadata: any };

    if (data.description) {
      // Show the description - user can copy it if it contains lyrics
      alert(`Description de la vidéo:\n\n${data.description.substring(0, 500)}${data.description.length > 500 ? '...' : ''}`);
    } else {
      alert('Aucune description disponible pour cette vidéo.');
    }
  } catch (error: any) {
    console.error('Error fetching metadata:', error);
    errorMessage.value = 'Impossible de récupérer la description de la vidéo.';
  } finally {
    loadingMetadata.value = false;
  }
};

// Create resource and link it
const createAndLinkResource = async () => {
  if (!selectedResult.value) return;

  creating.value = true;
  errorMessage.value = '';

  try {
    const functions = getFunctions(app);
    const createResourceFn = httpsCallable(functions, 'createResourceFromYouTube');
    const result = await createResourceFn({
      title: selectedResult.value.title,
      videoUrl: selectedResult.value.videoUrl,
      thumbnail: selectedResult.value.thumbnail,
      channel: selectedResult.value.channel,
      lyrics: lyrics.value || null
    });

    const data = result.data as { resourceId: string; resource: Resource };
    const resourceId = data.resourceId;

    // Emit the resource ID to parent
    emit('update:modelValue', resourceId);
    emit('resource-created', data.resource);

    // Reset form
    searchQuery.value = '';
    searchResults.value = [];
    selectedResult.value = null;
    searchPerformed.value = false;
    lyrics.value = '';
  } catch (error: any) {
    console.error('Error creating resource:', error);
    errorMessage.value = error.message || 'Erreur lors de la création de la ressource. Veuillez réessayer.';
  } finally {
    creating.value = false;
  }
};
</script>

<style scoped>
.natural-resource-selector {
  padding: 1rem 0;
}

.search-field {
  margin-bottom: 1rem;
}

.search-results {
  margin-top: 1rem;
}

.search-results h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--ion-color-medium);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid var(--ion-color-light);
  border-radius: 8px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.result-item:hover {
  background: var(--ion-color-light-tint);
}

.result-item.selected {
  background: var(--ion-color-primary-tint);
  border-color: var(--ion-color-primary);
}

.result-thumbnail {
  position: relative;
  flex-shrink: 0;
  width: 80px;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
}

.result-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  opacity: 0;
  transition: opacity 0.2s;
}

.result-thumbnail:hover .play-overlay {
  opacity: 1;
}

.play-overlay ion-icon {
  font-size: 2rem;
  color: white;
}

.result-info {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.result-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.result-title {
  margin: 0 0 0.25rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--ion-color-dark);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.result-channel {
  margin: 0;
  font-size: 0.85rem;
  color: var(--ion-color-medium);
}

.selection-icon {
  flex-shrink: 0;
  font-size: 1.5rem;
}

.no-results,
.error-message {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--ion-color-medium);
}

.no-results ion-icon,
.error-message ion-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.error-message {
  color: var(--ion-color-danger);
}

/* Lyrics Section */
.lyrics-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--ion-color-light);
}

.lyrics-section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--ion-color-medium);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.lyrics-note {
  margin: 0.5rem 0 0.75rem 0;
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  font-style: italic;
}

.action-buttons {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--ion-color-light);
}

/* Video Preview Modal */
.video-preview-container {
  padding: 1rem;
}

.video-iframe {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.video-info {
  padding: 0 0.5rem;
}

.video-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--ion-color-dark);
}

.channel-name {
  margin: 0;
  font-size: 0.9rem;
  color: var(--ion-color-medium);
}

.preview-actions {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 0.75rem 1rem;
}
</style>
