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

                <!-- YouTube video embedded as iframe -->
                <iframe
                  v-if="content.url && (isYouTubeUrl(content.url) || content.type === ResourceTypeEnum.YOUTUBE)"
                  :src="getYouTubeEmbedUrl(content.url) || ''"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                  class="video-player"
                ></iframe>
                <!-- Regular video file -->
                <video
                  v-else-if="content.url"
                  :src="content.url"
                  controls
                  class="video-player"
                  :poster="content.thumbnailUrl"
                ></video>
                <ion-button
                  v-else-if="content.url && content.type === ResourceTypeEnum.YOUTUBE"
                  :href="content.url"
                  target="_blank"
                  expand="block"
                >
                  <ion-icon :icon="logoYoutube" slot="start" />
                  Ouvrir sur YouTube
                </ion-button>
              </div>
            </div>

            <!-- Audio Display -->
            <div v-if="selectedContentType === ResourceTypeEnum.AUDIO" class="audio-content">
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
                <audio
                  v-if="content.url"
                  :src="content.url"
                  controls
                  class="audio-player"
                ></audio>
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
import PdfViewer from '@/components/PdfViewer.vue';
import {
  pencilOutline, folderOutline, calendarOutline, eyeOutline,
  downloadOutline, trashOutline, alertCircleOutline, logoYoutube
} from 'ionicons/icons';
import { getContentIcon, getContentLabel, formatFileSize, isYouTubeUrl, getYouTubeEmbedUrl, isPdfFile } from '@/utils/resource-utils';
import { Resource, ResourceCollection, ResourceType } from '@/types/resource';
import { getResourceById, deleteResource, getResourceCollections } from '@/firebase/resources';
import { useUser } from '@/composables/useUser';

const route = useRoute();
const router = useRouter();
const { isAdmin } = useUser();

const resource = ref<Resource | null>(null);
const collections = ref<ResourceCollection[]>([]);
const loading = ref(true);
const selectedContentType = ref<ResourceType | undefined>(undefined);
const currentPdfUrl = ref<string>('');

// Make enum available in template
const ResourceTypeEnum = ResourceType;

const resourceCollections = computed(() => {
  if (!resource.value || !collections.value.length) return [];
  return collections.value.filter(c => resource.value!.collectionIds.includes(c.id));
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

  return grouped;
});

const availableTypes = computed(() => {
  const typeOrder = [
    ResourceType.LYRICS,
    ResourceType.VIDEO,
    ResourceType.AUDIO,
    ResourceType.MUSIC_SHEET,
    ResourceType.FILE
  ];

  return typeOrder.filter(type => contentsByType.value.has(type));
});

const selectedContents = computed(() => {
  if (!selectedContentType.value) return [];
  return contentsByType.value.get(selectedContentType.value) || [];
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


// Auto-select first available content type
onMounted(() => {
  loadResource().then(() => {
    if (availableTypes.value.length > 0 && !selectedContentType.value) {
      selectedContentType.value = availableTypes.value[0];
    }
  });
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