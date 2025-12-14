<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/resources"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ resource?.title || 'Détail de la ressource' }}</ion-title>
        <ion-buttons slot="end" v-if="isAdmin && resource">
          <ion-button @click="editResource" fill="clear">
            <ion-icon :icon="pencilOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content :fullscreen="true">
      <ion-loading :is-open="loading" message="Chargement..."></ion-loading>
      
      <div v-if="resource" class="resource-detail">
        <!-- Resource Header -->
        <div class="resource-header">
          <h1>{{ resource.title }}</h1>

          <!-- Resource Collection -->
          <div v-if="resourceCollection" class="collections">
            <ion-chip color="primary">
              <ion-icon :icon="folderOutline" />
              <ion-label>{{ resourceCollection.name }}</ion-label>
            </ion-chip>
          </div>
          
          <!-- Tags -->
          <div v-if="resource.tags && resource.tags.length > 0" class="tags">
            <ion-chip v-for="tag in resource.tags" :key="tag" color="medium" outline>
              <ion-label>{{ tag }}</ion-label>
            </ion-chip>
          </div>
          
          <!-- Metadata -->
          <div class="metadata">
            <span class="meta-item">
              <ion-icon :icon="calendarOutline" />
              Créé le {{ formatDate(resource.createdAt) }}
            </span>
            <span v-if="resource.viewCount" class="meta-item">
              <ion-icon :icon="eyeOutline" />
              {{ resource.viewCount }} vue{{ resource.viewCount > 1 ? 's' : '' }}
            </span>
          </div>

          <!-- Music Properties Display (for all users) -->
          <div v-if="hasMusicProperties && !editingMusicProperties" class="music-properties-display">
            <ion-chip v-if="resource.musicKey" color="tertiary" outline>
              <ion-label>{{ getMusicOptionName(resource.musicKey, musicKeys) }}</ion-label>
            </ion-chip>
            <ion-chip v-if="resource.musicBeat" color="tertiary" outline>
              <ion-label>{{ getMusicOptionName(resource.musicBeat, musicBeats) }}</ion-label>
            </ion-chip>
            <ion-chip v-if="resource.musicTempo" color="tertiary" outline>
              <ion-label>{{ getMusicOptionName(resource.musicTempo, musicTempos) }}</ion-label>
            </ion-chip>
            <ion-chip v-if="resource.musicStyle" color="tertiary" outline>
              <ion-label>{{ getMusicOptionName(resource.musicStyle, musicStyles) }}</ion-label>
            </ion-chip>
            <ion-chip v-if="isAdmin" color="medium" @click="editingMusicProperties = true" class="edit-chip">
              <ion-icon :icon="pencilOutline" />
            </ion-chip>
          </div>
        </div>

        <!-- Music Properties Edit (Admin only) -->
        <div v-if="isAdmin && (editingMusicProperties || !hasMusicProperties)" class="music-properties-section">
          <div class="music-properties-header">
            <h4>Propriétés musicales</h4>
            <ion-button v-if="hasMusicProperties" fill="clear" size="small" @click="editingMusicProperties = false">
              <ion-icon :icon="closeOutline" />
            </ion-button>
          </div>
          <div class="music-properties-grid">
            <ion-item lines="none" class="music-select-item">
              <ion-select
                label="Tonalité"
                label-placement="stacked"
                interface="action-sheet"
                :value="resource.musicKey || null"
                @ionChange="(e: CustomEvent) => updateMusicMetadata('musicKey', e.detail.value)"
                placeholder="Sélectionner..."
              >
                <ion-select-option :value="null">Aucune</ion-select-option>
                <ion-select-option v-for="option in musicKeys" :key="option.id" :value="option.id">
                  {{ option.name }}
                </ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item lines="none" class="music-select-item">
              <ion-select
                label="Signature"
                label-placement="stacked"
                interface="action-sheet"
                :value="resource.musicBeat || null"
                @ionChange="(e: CustomEvent) => updateMusicMetadata('musicBeat', e.detail.value)"
                placeholder="Sélectionner..."
              >
                <ion-select-option :value="null">Aucune</ion-select-option>
                <ion-select-option v-for="option in musicBeats" :key="option.id" :value="option.id">
                  {{ option.name }}
                </ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item lines="none" class="music-select-item">
              <ion-select
                label="Tempo"
                label-placement="stacked"
                interface="action-sheet"
                :value="resource.musicTempo || null"
                @ionChange="(e: CustomEvent) => updateMusicMetadata('musicTempo', e.detail.value)"
                placeholder="Sélectionner..."
              >
                <ion-select-option :value="null">Aucun</ion-select-option>
                <ion-select-option v-for="option in musicTempos" :key="option.id" :value="option.id">
                  {{ option.name }} <span v-if="option.label">({{ option.label }})</span>
                </ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item lines="none" class="music-select-item">
              <ion-select
                label="Style"
                label-placement="stacked"
                interface="action-sheet"
                :value="resource.musicStyle || null"
                @ionChange="(e: CustomEvent) => updateMusicMetadata('musicStyle', e.detail.value)"
                placeholder="Sélectionner..."
              >
                <ion-select-option :value="null">Aucun</ion-select-option>
                <ion-select-option v-for="option in musicStyles" :key="option.id" :value="option.id">
                  {{ option.name }}
                </ion-select-option>
              </ion-select>
            </ion-item>
          </div>
        </div>

        <!-- Add Media Actions (Admin only) -->
        <div v-if="isAdmin" class="add-media-section">
          <h4>Ajouter un média</h4>
          <div class="add-media-buttons">
            <ion-button fill="outline" size="small" @click="addMediaFromUrl">
              <ion-icon :icon="linkOutline" slot="start" />
              Lien URL
            </ion-button>
            <ion-button fill="outline" size="small" @click="addMediaFromFile">
              <ion-icon :icon="cloudUploadOutline" slot="start" />
              Téléverser
            </ion-button>
            <ion-button fill="outline" size="small" @click="addMediaFromAudioRecording">
              <ion-icon :icon="micOutline" slot="start" />
              Enregistrer audio
            </ion-button>
            <ion-button fill="outline" size="small" @click="addMediaFromVideoRecording">
              <ion-icon :icon="videocamOutline" slot="start" />
              Enregistrer vidéo
            </ion-button>
          </div>
        </div>

        <!-- Resource Contents -->
        <div class="resource-contents">
          <ion-segment v-if="availableTypes.length > 1" :value="selectedContentType" @ionChange="(event) => selectedContentType = event.detail.value as ResourceType" scrollable>
            <ion-segment-button v-for="type in availableTypes" :key="type" :value="type">
              <ion-icon :icon="getContentIcon(type)" />
              <ion-label>{{ getContentLabel(type) }}</ion-label>
            </ion-segment-button>
          </ion-segment>

          <div class="content-display" v-if="selectedContents.length > 0">
            <!-- Lyrics Display -->
            <div v-if="selectedContentType === ResourceTypeEnum.LYRICS" class="lyrics-content">
              <div v-for="(content, index) in selectedContents" :key="index" class="content-item">
                <div v-if="content.notes" class="content-notes">
                  <ion-card>
                    <ion-card-header>
                      <ion-card-subtitle>Notes</ion-card-subtitle>
                    </ion-card-header>
                    <ion-card-content>
                      {{ content.notes }}
                    </ion-card-content>
                  </ion-card>
                </div>
                <pre>{{ content.content }}</pre>
              </div>
            </div>

            <!-- Video Display -->
            <div v-if="selectedContentType === ResourceTypeEnum.VIDEO" class="video-content">
              <div v-for="(content, index) in selectedContents" :key="index">
                <!-- YouTube video embedded as iframe -->
                <div v-if="content.url && (isYouTubeUrl(content.url) || content.type === ResourceTypeEnum.YOUTUBE)" class="content-item">
                  <div v-if="content.notes" class="content-notes">
                    <ion-card>
                      <ion-card-header>
                        <ion-card-subtitle>Notes</ion-card-subtitle>
                      </ion-card-header>
                      <ion-card-content>
                        {{ content.notes }}
                      </ion-card-content>
                    </ion-card>
                  </div>
                  <iframe
                    :src="getYouTubeEmbedUrl(content.url) || ''"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                    class="youtube-player"
                  ></iframe>
                </div>

                <!-- Recorded video - card style like audio -->
                <div v-else-if="content.url" class="video-item">
                  <div class="video-card" @click="openVideoPlayer(content.url!, getVideoTitle(content, index))">
                    <div class="video-icon">
                      <ion-icon :icon="filmOutline" />
                    </div>
                    <div class="video-info">
                      <span class="video-title">{{ getVideoTitle(content, index) }}</span>
                      <div class="video-meta">
                        <span v-if="content.duration" class="video-duration">{{ formatDuration(content.duration) }}</span>
                        <span v-if="content.duration && content.createdAt" class="video-separator">•</span>
                        <span v-if="content.createdAt" class="video-date">{{ formatMediaDate(content.createdAt) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Audio Display -->
            <div v-if="selectedContentType === ResourceTypeEnum.AUDIO" class="audio-content">
              <div v-for="(content, index) in selectedContents" :key="index" class="audio-item">
                <div class="audio-card" @click="content.url && openAudioPlayer(content.url, getAudioTitle(content, index))">
                  <div class="audio-icon">
                    <ion-icon :icon="playCircleOutline" />
                  </div>
                  <div class="audio-info">
                    <span class="audio-title">{{ getAudioTitle(content, index) }}</span>
                    <div class="audio-meta">
                      <span v-if="content.duration" class="audio-duration">{{ formatDuration(content.duration) }}</span>
                      <span v-if="content.duration && content.createdAt" class="audio-separator">•</span>
                      <span v-if="content.createdAt" class="audio-date">{{ formatMediaDate(content.createdAt) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Spotify Display -->
            <div v-if="selectedContentType === ResourceTypeEnum.SPOTIFY" class="spotify-content">
              <div v-for="(content, index) in selectedContents" :key="index" class="content-item">
                <div v-if="content.notes" class="content-notes">
                  <ion-card>
                    <ion-card-header>
                      <ion-card-subtitle>Notes</ion-card-subtitle>
                    </ion-card-header>
                    <ion-card-content>
                      {{ content.notes }}
                    </ion-card-content>
                  </ion-card>
                </div>
                <div v-if="content.url">
                  <iframe
                    :src="getSpotifyEmbedUrl(content.url) || ''"
                    width="100%"
                    height="352"
                    frameborder="0"
                    allowtransparency="true"
                    allow="encrypted-media"
                    class="spotify-player"
                  ></iframe>
                  <ion-button
                    :href="content.url"
                    target="_blank"
                    expand="block"
                    fill="outline"
                    style="margin-top: 1rem;"
                  >
                    <ion-icon :icon="musicalNoteOutline" slot="start" />
                    Ouvrir dans Spotify
                  </ion-button>
                </div>
              </div>
            </div>

            <!-- Music Sheet Display -->
            <div v-if="selectedContentType === ResourceTypeEnum.MUSIC_SHEET" class="chart-content">
              <div v-for="(content, index) in selectedContents" :key="index" class="content-item">
                <div v-if="content.notes" class="content-notes">
                  <ion-card>
                    <ion-card-header>
                      <ion-card-subtitle>Notes</ion-card-subtitle>
                    </ion-card-header>
                    <ion-card-content>
                      {{ content.notes }}
                    </ion-card-content>
                  </ion-card>
                </div>
                <div v-if="content.url" class="music-sheet-actions">
                  <ion-button
                    v-if="isPdfFile(content.url)"
                    @click="openPdfViewer(content.url)"
                    expand="block"
                    color="primary"
                  >
                    <ion-icon :icon="eyeOutline" slot="start" />
                    Voir la partition
                  </ion-button>
                  <ion-button
                    :href="content.url"
                    target="_blank"
                    expand="block"
                    fill="outline"
                    download=""
                  >
                    <ion-icon :icon="downloadOutline" slot="start" />
                    Télécharger
                  </ion-button>
                </div>
                <div v-if="content.content" class="chart-preview">
                  <pre>{{ content.content }}</pre>
                </div>
              </div>
            </div>

            <!-- File Display -->
            <div v-if="selectedContentType === ResourceTypeEnum.FILE" class="file-content">
              <div v-for="(content, index) in selectedContents" :key="index" class="content-item">
                <div v-if="content.notes" class="content-notes">
                  <ion-card>
                    <ion-card-header>
                      <ion-card-subtitle>Notes</ion-card-subtitle>
                    </ion-card-header>
                    <ion-card-content>
                      {{ content.notes }}
                    </ion-card-content>
                  </ion-card>
                </div>
                <ion-button
                  v-if="content.url"
                  :href="content.url"
                  target="_blank"
                  expand="block"
                  download=""
                >
                  <ion-icon :icon="downloadOutline" slot="start" />
                  Télécharger le fichier
                </ion-button>
                <div v-if="content.mimeType" class="file-info">
                  <p>Type: {{ content.mimeType }}</p>
                  <p v-if="content.fileSize">Taille: {{ formatFileSize(content.fileSize) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Admin Actions -->
        <div v-if="isAdmin" class="admin-actions">
          <ion-button @click="editResource" expand="block" color="primary">
            <ion-icon :icon="pencilOutline" slot="start" />
            Modifier cette ressource
          </ion-button>
          
          <ion-button @click="confirmDelete" expand="block" color="danger" fill="outline">
            <ion-icon :icon="trashOutline" slot="start" />
            Supprimer cette ressource
          </ion-button>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-else-if="!loading" class="empty-state ion-text-center ion-padding">
        <ion-icon :icon="alertCircleOutline" size="large" color="warning" />
        <h2>Ressource non trouvée</h2>
        <p>La ressource demandée n'existe pas ou a été supprimée.</p>
        <ion-button @click="goBack" fill="outline">
          Retour aux ressources
        </ion-button>
      </div>
    </ion-content>

    <!-- PDF Viewer Modal -->
    <PdfViewer
      :is-open="!!currentPdfUrl"
      :pdf-url="currentPdfUrl"
      :title="resource?.title || 'Partition'"
      @close="closePdfViewer"
    />

    <!-- Audio Recorder Modal -->
    <AudioRecorderModal
      :is-open="showAudioRecorder"
      :resource-id="resource?.id || ''"
      :resource-title="resource?.title || ''"
      @close="showAudioRecorder = false"
      @saved="handleAudioSaved"
    />

    <!-- Audio Player Modal -->
    <AudioPlayerModal
      :is-open="showAudioPlayer"
      :audio-url="currentAudioUrl"
      :title="currentAudioTitle"
      @close="closeAudioPlayer"
    />

    <!-- Video Recorder Modal -->
    <VideoRecorderModal
      :is-open="showVideoRecorder"
      :resource-id="resource?.id || ''"
      :resource-title="resource?.title || ''"
      @close="showVideoRecorder = false"
      @saved="handleVideoSaved"
    />

    <!-- Video Player Modal -->
    <VideoPlayerModal
      :is-open="showVideoPlayer"
      :video-url="currentVideoUrl"
      :title="currentVideoTitle"
      @close="closeVideoPlayer"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonChip, IonLabel, IonSegment, IonSegmentButton, IonLoading,
  IonCard, IonCardHeader, IonCardSubtitle, IonCardContent, IonItem, IonSelect, IonSelectOption,
  alertController, toastController
} from '@ionic/vue';
import PdfViewer from '@/components/PdfViewer.vue';
import AudioRecorderModal from '@/components/AudioRecorderModal.vue';
import AudioPlayerModal from '@/components/AudioPlayerModal.vue';
import VideoRecorderModal from '@/components/VideoRecorderModal.vue';
import VideoPlayerModal from '@/components/VideoPlayerModal.vue';
import {
  pencilOutline, folderOutline, calendarOutline, eyeOutline,
  downloadOutline, trashOutline, alertCircleOutline, logoYoutube,
  musicalNoteOutline, linkOutline, cloudUploadOutline, micOutline, videocamOutline,
  playCircleOutline, filmOutline, closeOutline
} from 'ionicons/icons';
import { getContentIcon, getContentLabel, formatFileSize, isYouTubeUrl, getYouTubeEmbedUrl, isPdfFile, getSpotifyEmbedUrl } from '@/utils/resource-utils';
import { Resource, ResourceCollection, ResourceType, ResourceMedia, ResourceOption } from '@/types/resource';
import { getResourceById, deleteResource, getResourceCollections, updateResource, subscribeToResource, getAllResourceOptions } from '@/firebase/resources';
import { useUser } from '@/composables/useUser';

const route = useRoute();
const router = useRouter();
const { isAdmin } = useUser();

const resource = ref<Resource | null>(null);
const collections = ref<ResourceCollection[]>([]);
const loading = ref(true);
const selectedContentType = ref<ResourceType | undefined>(undefined);
const currentPdfUrl = ref<string>('');

// Real-time subscription unsubscribe function
let unsubscribeResource: (() => void) | null = null;

// Audio recorder modal state
const showAudioRecorder = ref(false);

// Audio player modal state
const showAudioPlayer = ref(false);
const currentAudioUrl = ref('');
const currentAudioTitle = ref('');

// Video recorder modal state
const showVideoRecorder = ref(false);

// Video player modal state
const showVideoPlayer = ref(false);
const currentVideoUrl = ref('');
const currentVideoTitle = ref('');

// Make enum available in template
const ResourceTypeEnum = ResourceType;

// Music options state
const musicKeys = ref<ResourceOption[]>([]);
const musicBeats = ref<ResourceOption[]>([]);
const musicTempos = ref<ResourceOption[]>([]);
const musicStyles = ref<ResourceOption[]>([]);
const loadingOptions = ref(false);
const editingMusicProperties = ref(false);

// Check if resource has any music properties set
const hasMusicProperties = computed(() => {
  if (!resource.value) return false;
  return !!(resource.value.musicKey || resource.value.musicBeat || resource.value.musicTempo || resource.value.musicStyle);
});

const resourceCollection = computed(() => {
  if (!resource.value || !collections.value.length || !resource.value.collectionId) return null;
  return collections.value.find(c => c.id === resource.value!.collectionId) || null;
});

const contentsByType = computed(() => {
  if (!resource.value) return new Map();

  const grouped = new Map<ResourceType, typeof resource.value.contents>();
  resource.value.contents.forEach(content => {
    // Group VIDEO and YOUTUBE types together under VIDEO
    const groupType = content.type === ResourceType.YOUTUBE ? ResourceType.VIDEO : content.type;

    if (!grouped.has(groupType)) {
      grouped.set(groupType, []);
    }
    grouped.get(groupType)!.push(content);
  });

  // Sort each group by createdAt (newest first)
  grouped.forEach((contents, type) => {
    contents.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA; // Newest first
    });
  });

  return grouped;
});

const availableTypes = computed(() => {
  const typeOrder = [
    ResourceType.LYRICS,
    ResourceType.VIDEO,
    ResourceType.AUDIO,
    ResourceType.SPOTIFY,
    ResourceType.MUSIC_SHEET,
    ResourceType.FILE
  ];

  return typeOrder.filter(type => contentsByType.value.has(type));
});

const selectedContents = computed(() => {
  if (!selectedContentType.value) return [];
  return contentsByType.value.get(selectedContentType.value) || [];
});

const setupResourceSubscription = (resourceId: string) => {
  // Clean up previous subscription if exists
  if (unsubscribeResource) {
    unsubscribeResource();
    unsubscribeResource = null;
  }

  // Set up real-time subscription
  unsubscribeResource = subscribeToResource(
    resourceId,
    (updatedResource) => {
      resource.value = updatedResource;
      loading.value = false;

      // Auto-select first available content type if not set
      if (updatedResource && availableTypes.value.length > 0 && !selectedContentType.value) {
        selectedContentType.value = availableTypes.value[0];
      }
    },
    (error) => {
      console.error('Error in resource subscription:', error);
      loading.value = false;
    }
  );
};

const loadResourceOptions = async () => {
  loadingOptions.value = true;
  try {
    const options = await getAllResourceOptions();
    musicKeys.value = options.musicKeys;
    musicBeats.value = options.musicBeats;
    musicTempos.value = options.musicTempos;
    musicStyles.value = options.musicStyles;
  } catch (error) {
    console.error('Error loading resource options:', error);
  } finally {
    loadingOptions.value = false;
  }
};

const loadResource = async () => {
  const id = route.params.id as string;
  loading.value = true;

  try {
    // Load collections and resource options in parallel
    const [collectionsData] = await Promise.all([
      getResourceCollections(),
      loadResourceOptions()
    ]);
    collections.value = collectionsData;

    // Initial fetch to increment view count
    await getResourceById(id);

    // Set up real-time subscription for the resource
    setupResourceSubscription(id);
  } catch (error) {
    console.error('Error loading resource:', error);
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};


const editResource = () => {
  router.push(`/resource-form/${resource.value?.id}`);
};

const confirmDelete = async () => {
  const alert = await alertController.create({
    header: 'Confirmer la suppression',
    message: 'Êtes-vous sûr de vouloir supprimer cette ressource ? Cette action est irréversible.',
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel'
      },
      {
        text: 'Supprimer',
        role: 'destructive',
        handler: async () => {
          if (resource.value) {
            try {
              await deleteResource(resource.value.id);
              router.push('/resources');
            } catch (error) {
              console.error('Error deleting resource:', error);
            }
          }
        }
      }
    ]
  });
  
  await alert.present();
};


const openPdfViewer = (url: string) => {
  currentPdfUrl.value = url;
};

const closePdfViewer = () => {
  currentPdfUrl.value = '';
};


const goBack = () => {
  router.push('/resources');
};

// Update music metadata
const updateMusicMetadata = async (field: 'musicKey' | 'musicBeat' | 'musicTempo' | 'musicStyle', value: string | null) => {
  if (!resource.value) return;

  try {
    await updateResource(resource.value.id, { [field]: value || undefined });

    const toast = await toastController.create({
      message: 'Propriété mise à jour',
      duration: 1500,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  } catch (error) {
    console.error('Error updating music metadata:', error);
    const toast = await toastController.create({
      message: 'Erreur lors de la mise à jour',
      duration: 2000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }
};

// Get display name for music option
const getMusicOptionName = (optionId: string | undefined, options: ResourceOption[]): string => {
  if (!optionId) return '';
  const option = options.find(o => o.id === optionId);
  return option?.name || optionId;
};

// Add media stub functions (UI only, logic to be implemented)
const addMediaFromUrl = () => {
  // TODO: Implement URL link media addition
  console.log('Add media from URL');
};

const addMediaFromFile = () => {
  // TODO: Implement file upload
  console.log('Add media from file upload');
};

const addMediaFromAudioRecording = () => {
  showAudioRecorder.value = true;
};

const addMediaFromVideoRecording = () => {
  showVideoRecorder.value = true;
};

// Handle audio recording saved
const handleAudioSaved = async (data: { url: string; name: string; duration: number; mimeType: string; createdAt: string }) => {
  if (!resource.value) return;

  try {
    // Create new audio media with timestamp
    const newAudioMedia: ResourceMedia = {
      type: ResourceType.AUDIO,
      url: data.url,
      notes: data.name,
      duration: data.duration,
      mimeType: data.mimeType,
      createdAt: data.createdAt
    };

    // Add to existing contents
    const updatedContents = [...resource.value.contents, newAudioMedia];

    // Update resource in Firebase - real-time subscription will auto-update the UI
    await updateResource(resource.value.id, { contents: updatedContents });

    // Auto-select audio tab if not already selected
    if (selectedContentType.value !== ResourceType.AUDIO) {
      selectedContentType.value = ResourceType.AUDIO;
    }
  } catch (error) {
    console.error('Error saving audio to resource:', error);
  }
};

// Audio player functions
const openAudioPlayer = (url: string, title: string) => {
  currentAudioUrl.value = url;
  currentAudioTitle.value = title;
  showAudioPlayer.value = true;
};

const closeAudioPlayer = () => {
  showAudioPlayer.value = false;
  currentAudioUrl.value = '';
  currentAudioTitle.value = '';
};

// Handle video recording saved
const handleVideoSaved = async (data: { url: string; name: string; duration: number; mimeType: string; createdAt: string }) => {
  if (!resource.value) return;

  try {
    // Create new video media with timestamp
    const newVideoMedia: ResourceMedia = {
      type: ResourceType.VIDEO,
      url: data.url,
      notes: data.name,
      duration: data.duration,
      mimeType: data.mimeType,
      createdAt: data.createdAt
    };

    // Add to existing contents
    const updatedContents = [...resource.value.contents, newVideoMedia];

    // Update resource in Firebase - real-time subscription will auto-update the UI
    await updateResource(resource.value.id, { contents: updatedContents });

    // Auto-select video tab if not already selected
    if (selectedContentType.value !== ResourceType.VIDEO) {
      selectedContentType.value = ResourceType.VIDEO;
    }
  } catch (error) {
    console.error('Error saving video to resource:', error);
  }
};

// Video player functions
const openVideoPlayer = (url: string, title: string) => {
  currentVideoUrl.value = url;
  currentVideoTitle.value = title;
  showVideoPlayer.value = true;
};

const closeVideoPlayer = () => {
  showVideoPlayer.value = false;
  currentVideoUrl.value = '';
  currentVideoTitle.value = '';
};

// Get video title from notes or generate default
const getVideoTitle = (content: ResourceMedia, index: number): string => {
  if (content.notes) return content.notes;
  return `Vidéo ${index + 1}`;
};

// Check if video is a recorded video (not YouTube)
const isRecordedVideo = (content: ResourceMedia): boolean => {
  return content.type === ResourceType.VIDEO &&
         content.url !== undefined &&
         !isYouTubeUrl(content.url);
};

// Get audio title from notes or generate default
const getAudioTitle = (content: ResourceMedia, index: number): string => {
  if (content.notes) return content.notes;
  return `Audio ${index + 1}`;
};

// Format duration for display
const formatDuration = (seconds?: number): string => {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Format media timestamp for display
const formatMediaDate = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-CA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Initialize on mount
onMounted(() => {
  loadResource();
});

// Clean up subscription on unmount
onUnmounted(() => {
  if (unsubscribeResource) {
    unsubscribeResource();
    unsubscribeResource = null;
  }
});
</script>

<style scoped>
.resource-detail {
  padding: 1rem;
}

.resource-header {
  margin-bottom: 2rem;
}

.resource-header h1 {
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
}

.description {
  color: var(--ion-color-medium);
  margin-bottom: 1rem;
}

.collections, .tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--ion-color-medium);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.resource-contents {
  margin-bottom: 2rem;
}

.content-display {
  margin-top: 1rem;
  min-height: 200px;
}

.content-item {
  margin-bottom: 1.5rem;
}

.lyrics-content pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
  background: var(--ion-color-light);
  padding: 1rem;
  border-radius: 8px;
}

.video-player {
  width: 100%;
  max-width: 100%;
  border-radius: 8px;
}

/* Audio card styles */
.audio-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.audio-item {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.audio-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--ion-color-light);
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

.audio-card:hover {
  background: var(--ion-color-light-shade);
}

.audio-card:active {
  transform: scale(0.98);
}

.audio-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--ion-color-primary);
  border-radius: 50%;
  flex-shrink: 0;
}

.audio-icon ion-icon {
  font-size: 1.75rem;
  color: white;
}

.audio-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.audio-title {
  font-size: 1rem;
  font-weight: 500;
  color: var(--ion-color-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.audio-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.audio-duration {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
}

.audio-separator {
  font-size: 0.7rem;
  color: var(--ion-color-medium);
}

.audio-date {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
}

/* Video card styles */
.video-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.video-item {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.video-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--ion-color-light);
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

.video-card:hover {
  background: var(--ion-color-light-shade);
}

.video-card:active {
  transform: scale(0.98);
}

.video-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--ion-color-danger);
  border-radius: 50%;
  flex-shrink: 0;
}

.video-icon ion-icon {
  font-size: 1.75rem;
  color: white;
}

.video-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.video-title {
  font-size: 1rem;
  font-weight: 500;
  color: var(--ion-color-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.video-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.video-duration {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
}

.video-separator {
  font-size: 0.7rem;
  color: var(--ion-color-medium);
}

.video-date {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
}

.youtube-player {
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 8px;
}

.spotify-player {
  width: 100%;
  max-width: 100%;
  border-radius: 12px;
  margin-top: 1rem;
}

.chart-preview {
  margin-top: 1rem;
  background: var(--ion-color-light);
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
}

.admin-actions {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--ion-color-light-shade);
}

.admin-actions ion-button {
  margin-bottom: 0.5rem;
}

.empty-state {
  margin-top: 2rem;
}

.empty-state ion-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.content-notes {
  margin-bottom: 1rem;
}

.content-notes ion-card {
  background: var(--ion-color-light);
  border-left: 4px solid var(--ion-color-primary);
}

.content-item {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--ion-color-light-shade);
}

.content-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.music-sheet-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.add-media-section {
  margin-bottom: 1.5rem;
}

.add-media-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: var(--ion-color-medium-shade);
}

.add-media-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.add-media-buttons ion-button {
  --border-radius: 8px;
}

/* Music properties styles */
.music-properties-display {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.music-properties-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--ion-color-light);
  border-radius: 12px;
}

.music-properties-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.music-properties-header h4 {
  margin: 0;
  font-size: 1rem;
  color: var(--ion-color-medium-shade);
}

.music-properties-header ion-button {
  --padding-start: 8px;
  --padding-end: 8px;
}

.edit-chip {
  cursor: pointer;
  --background: transparent;
}

.edit-chip ion-icon {
  font-size: 1rem;
}

.music-properties-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.music-select-item {
  --background: var(--ion-background-color);
  --border-radius: 8px;
  --padding-start: 12px;
  --padding-end: 12px;
  --inner-padding-end: 0;
  border-radius: 8px;
}

.music-select-item ion-select {
  width: 100%;
}

@media (max-width: 768px) {
  .resource-header h1 {
    font-size: 1.5rem;
  }
  
  .metadata {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>