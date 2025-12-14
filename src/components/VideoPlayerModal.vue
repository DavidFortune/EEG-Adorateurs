<template>
  <ion-modal :is-open="isOpen" @didDismiss="handleClose" :initial-breakpoint="1" :breakpoints="[0, 1]">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ title || 'Vidéo' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleClose" fill="clear">
            <ion-icon :icon="closeOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="player-container">
        <!-- Video Player -->
        <div class="video-wrapper">
          <video
            ref="videoPlayer"
            class="video-player"
            controls
            playsinline
            :poster="thumbnailUrl"
          ></video>

          <!-- Loading Spinner -->
          <div v-if="isLoading" class="loading-overlay">
            <ion-spinner name="crescent" />
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="error-message">
          <ion-icon :icon="alertCircleOutline" color="danger" />
          <span>{{ errorMessage }}</span>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonSpinner
} from '@ionic/vue';
import { closeOutline, alertCircleOutline } from 'ionicons/icons';

interface Props {
  isOpen: boolean;
  videoUrl: string;
  title?: string;
  thumbnailUrl?: string;
}

interface Emits {
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Refs
const videoPlayer = ref<HTMLVideoElement | null>(null);

// State
const isLoading = ref(false);
const errorMessage = ref('');

const initVideo = () => {
  if (!props.videoUrl || !videoPlayer.value) return;

  isLoading.value = true;
  errorMessage.value = '';

  videoPlayer.value.src = props.videoUrl;

  videoPlayer.value.onloadeddata = () => {
    isLoading.value = false;
  };

  videoPlayer.value.onerror = () => {
    isLoading.value = false;
    errorMessage.value = 'Impossible de charger la vidéo.';
  };

  videoPlayer.value.onwaiting = () => {
    isLoading.value = true;
  };

  videoPlayer.value.oncanplay = () => {
    isLoading.value = false;
  };
};

const cleanup = () => {
  if (videoPlayer.value) {
    videoPlayer.value.pause();
    videoPlayer.value.src = '';
  }
  isLoading.value = false;
  errorMessage.value = '';
};

const handleClose = () => {
  cleanup();
  emit('close');
};

// Initialize video when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen && props.videoUrl) {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      initVideo();
    }, 100);
  } else if (!isOpen) {
    cleanup();
  }
});

// Re-initialize if URL changes while open
watch(() => props.videoUrl, (newUrl) => {
  if (props.isOpen && newUrl) {
    initVideo();
  }
});

// Cleanup on unmount
onUnmounted(() => {
  cleanup();
});
</script>

<style scoped>
.player-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.video-wrapper {
  position: relative;
  width: 100%;
  max-width: 100%;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
}

.video-player {
  width: 100%;
  max-height: 70vh;
  display: block;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
}

.loading-overlay ion-spinner {
  --color: white;
  width: 48px;
  height: 48px;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--ion-color-danger);
  font-size: 0.9rem;
  margin-top: 1rem;
  text-align: center;
}
</style>
