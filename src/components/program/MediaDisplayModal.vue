<template>
  <ion-modal :is-open="isOpen" @ionModalDidDismiss="$emit('close')" class="media-modal fullscreen-modal">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ title }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="$emit('close')">
            <ion-icon :icon="closeOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content v-if="content">
      <!-- YouTube Video -->
      <div v-if="(content.type === 'video' || content.type === 'youtube') && content.url && isYouTubeUrl(content.url)" class="video-container">
        <iframe
          :src="getYouTubeEmbedUrl(content.url) || ''"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          class="youtube-iframe"
        ></iframe>
      </div>

      <!-- Regular Video Content -->
      <div v-else-if="content.type === 'video' && content.url" class="video-container">
        <video controls :src="content.url" class="full-width-video"></video>
      </div>

      <!-- Spotify Content -->
      <div v-if="content.type === 'spotify' && content.url" class="spotify-container">
        <iframe
          :src="getSpotifyEmbedUrl(content.url) || ''"
          width="100%"
          height="352"
          frameborder="0"
          allowtransparency="true"
          allow="encrypted-media"
          class="spotify-iframe"
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

      <!-- Audio Content -->
      <div v-if="content.type === 'audio' && content.url" class="audio-container">
        <audio controls :src="content.url" class="full-width-audio"></audio>
      </div>

      <!-- Lyrics Content -->
      <div v-if="content.type === 'lyrics'" class="lyrics-container">
        <div class="lyrics-content">
          <pre>{{ content.content }}</pre>
        </div>
      </div>

      <!-- PDF/Document Content -->
      <div v-if="content.type === 'music_sheet' && content.url" class="document-container">
        <ion-button @click="openInNewTab(content.url)" expand="block" fill="outline">
          <ion-icon :icon="documentOutline" slot="start" />
          Ouvrir la partition
        </ion-button>
      </div>

      <!-- Debug/Fallback - Show if no content matched -->
      <div v-if="!['video', 'youtube', 'spotify', 'audio', 'lyrics', 'music_sheet'].includes(content.type)" class="debug-container" style="padding: 1rem;">
        <p><strong>Type:</strong> {{ content.type }}</p>
        <p><strong>URL:</strong> {{ content.url }}</p>
        <p><strong>Content:</strong> {{ content.content }}</p>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
} from '@ionic/vue';
import { closeOutline, musicalNoteOutline, documentOutline } from 'ionicons/icons';
import { isYouTubeUrl, getYouTubeEmbedUrl, getSpotifyEmbedUrl } from '@/utils/resource-utils';

defineProps<{
  isOpen: boolean;
  content: any;
  title: string;
}>();

defineEmits<{
  (e: 'close'): void;
}>();

const openInNewTab = (url: string) => {
  window.open(url, '_blank');
};
</script>

<style scoped>
/* Media Modal */
.media-modal {
  --width: 90%;
  --height: 80%;
  --border-radius: 12px;
}

.fullscreen-modal {
  --width: 100%;
  --height: 100%;
  --border-radius: 0;
}

.video-container,
.audio-container,
.spotify-container,
.lyrics-container,
.document-container {
  padding: 1rem;
}

.full-width-video,
.full-width-audio {
  width: 100%;
}

.youtube-iframe {
  width: 100%;
  aspect-ratio: 16/9;
  min-height: 315px;
  border-radius: 8px;
}

.spotify-iframe {
  width: 100%;
  border-radius: 12px;
}

.lyrics-content {
  background: var(--ion-color-light);
  padding: 1.5rem;
  border-radius: 8px;
}

.lyrics-content pre {
  white-space: pre-wrap;
  font-family: var(--ion-font-family);
  font-size: 1rem;
  line-height: 1.6;
  margin: 0;
}
</style>
