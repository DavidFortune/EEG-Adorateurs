<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/resources"></ion-back-button>
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
          <p v-if="resource.description" class="description">{{ resource.description }}</p>
          
          <!-- Resource Collections -->
          <div v-if="resourceCollections.length > 0" class="collections">
            <ion-chip v-for="collection in resourceCollections" :key="collection.id" color="primary">
              <ion-icon :icon="folderOutline" />
              <ion-label>{{ collection.name }}</ion-label>
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
        </div>
        
        <!-- Resource Contents -->
        <div class="resource-contents">
          <ion-segment v-if="resource.contents.length > 1" v-model="selectedContentIndex" scrollable>
            <ion-segment-button v-for="(content, index) in resource.contents" :key="index" :value="index">
              <ion-icon :icon="getContentIcon(content.type)" />
              <ion-label>{{ getContentLabel(content.type) }}</ion-label>
            </ion-segment-button>
          </ion-segment>
          
          <div class="content-display" v-if="selectedContent">
            <!-- Notes Display -->
            <div v-if="selectedContent.notes" class="content-notes">
              <ion-card>
                <ion-card-header>
                  <ion-card-subtitle>Notes</ion-card-subtitle>
                </ion-card-header>
                <ion-card-content>
                  {{ selectedContent.notes }}
                </ion-card-content>
              </ion-card>
            </div>
            
            <!-- Lyrics Display -->
            <div v-if="selectedContent.type === ResourceTypeEnum.LYRICS" class="lyrics-content">
              <pre>{{ selectedContent.content }}</pre>
            </div>
            
            <!-- Video Display -->
            <div v-if="selectedContent.type === ResourceTypeEnum.VIDEO" class="video-content">
              <!-- YouTube video embedded as iframe -->
              <iframe
                v-if="selectedContent.url && isYouTubeUrl(selectedContent.url)"
                :src="getYouTubeEmbedUrl(selectedContent.url) || ''"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
                class="video-player"
              ></iframe>
              <!-- Regular video file -->
              <video 
                v-else-if="selectedContent.url" 
                :src="selectedContent.url" 
                controls 
                class="video-player"
                :poster="selectedContent.thumbnailUrl"
              ></video>
            </div>
            
            <!-- Audio Display -->
            <div v-if="selectedContent.type === ResourceTypeEnum.AUDIO" class="audio-content">
              <audio 
                v-if="selectedContent.url" 
                :src="selectedContent.url" 
                controls 
                class="audio-player"
              ></audio>
            </div>
            
            <!-- YouTube Display -->
            <div v-if="selectedContent.type === ResourceTypeEnum.YOUTUBE" class="youtube-content">
              <iframe
                v-if="getYouTubeEmbedUrl(selectedContent.url)"
                :src="getYouTubeEmbedUrl(selectedContent.url) || undefined"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
                class="youtube-player"
              ></iframe>
              <ion-button 
                v-else-if="selectedContent.url" 
                :href="selectedContent.url" 
                target="_blank" 
                expand="block"
              >
                <ion-icon :icon="logoYoutube" slot="start" />
                Ouvrir sur YouTube
              </ion-button>
            </div>
            
            <!-- Music Sheet Display -->
            <div v-if="selectedContent.type === ResourceTypeEnum.MUSIC_SHEET" class="chart-content">
              <ion-button 
                v-if="selectedContent.url" 
                :href="selectedContent.url" 
                target="_blank" 
                expand="block"
                download=""
              >
                <ion-icon :icon="downloadOutline" slot="start" />
                Télécharger la partition
              </ion-button>
              <div v-if="selectedContent.content" class="chart-preview">
                <pre>{{ selectedContent.content }}</pre>
              </div>
            </div>
            
            <!-- File Display -->
            <div v-if="selectedContent.type === ResourceTypeEnum.FILE" class="file-content">
              <ion-button 
                v-if="selectedContent.url" 
                :href="selectedContent.url" 
                target="_blank" 
                expand="block"
                download=""
              >
                <ion-icon :icon="downloadOutline" slot="start" />
                Télécharger le fichier
              </ion-button>
              <div v-if="selectedContent.mimeType" class="file-info">
                <p>Type: {{ selectedContent.mimeType }}</p>
                <p v-if="selectedContent.fileSize">Taille: {{ formatFileSize(selectedContent.fileSize) }}</p>
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
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonChip, IonLabel, IonSegment, IonSegmentButton, IonLoading,
  IonCard, IonCardHeader, IonCardSubtitle, IonCardContent,
  alertController
} from '@ionic/vue';
import {
  pencilOutline, folderOutline, calendarOutline, eyeOutline, documentTextOutline,
  videocamOutline, volumeHighOutline, musicalNotesOutline, logoYoutube,
  downloadOutline, trashOutline, alertCircleOutline
} from 'ionicons/icons';
import { Resource, ResourceCollection, ResourceType } from '@/types/resource';
import { getResourceById, deleteResource, getResourceCollections } from '@/firebase/resources';
import { useUser } from '@/composables/useUser';

const route = useRoute();
const router = useRouter();
const { isAdmin } = useUser();

const resource = ref<Resource | null>(null);
const collections = ref<ResourceCollection[]>([]);
const loading = ref(true);
const selectedContentIndex = ref(0);

// Make enum available in template
const ResourceTypeEnum = ResourceType;

const resourceCollections = computed(() => {
  if (!resource.value || !collections.value.length) return [];
  return collections.value.filter(c => resource.value!.collectionIds.includes(c.id));
});

const selectedContent = computed(() => {
  if (!resource.value || resource.value.contents.length === 0) return null;
  return resource.value.contents[selectedContentIndex.value];
});

const loadResource = async () => {
  const id = route.params.id as string;
  loading.value = true;
  
  try {
    const [resourceData, collectionsData] = await Promise.all([
      getResourceById(id),
      getResourceCollections()
    ]);
    
    resource.value = resourceData;
    collections.value = collectionsData;
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

const getContentIcon = (type: ResourceType) => {
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
      return documentTextOutline;
    default:
      return documentTextOutline;
  }
};

const getContentLabel = (type: ResourceType) => {
  switch (type) {
    case ResourceType.LYRICS:
      return 'Paroles';
    case ResourceType.VIDEO:
      return 'Vidéo';
    case ResourceType.AUDIO:
      return 'Audio';
    case ResourceType.MUSIC_SHEET:
      return 'Partition';
    case ResourceType.YOUTUBE:
      return 'YouTube';
    case ResourceType.FILE:
      return 'Fichier';
    default:
      return type;
  }
};

const isYouTubeUrl = (url?: string): boolean => {
  if (!url) return false;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/,
    /^[a-zA-Z0-9_-]{11}$/ // Just a YouTube video ID
  ];
  return patterns.some(pattern => pattern.test(url));
};

const getYouTubeEmbedUrl = (url?: string) => {
  if (!url) return null;
  
  // Extract video ID from various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }
  
  // Check if it's already just a video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return `https://www.youtube.com/embed/${url}`;
  }
  
  return null;
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
              router.push('/tabs/resources');
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

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const goBack = () => {
  router.push('/tabs/resources');
};

onMounted(() => {
  loadResource();
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

.lyrics-content pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
  background: var(--ion-color-light);
  padding: 1rem;
  border-radius: 8px;
}

.video-player, .audio-player {
  width: 100%;
  max-width: 100%;
  border-radius: 8px;
}

.video-player[src*="youtube.com"] {
  aspect-ratio: 16/9;
  height: auto;
}

.youtube-player {
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 8px;
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