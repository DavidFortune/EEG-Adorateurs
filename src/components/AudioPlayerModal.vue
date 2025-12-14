<template>
  <ion-modal :is-open="isOpen" @didDismiss="handleClose" :initial-breakpoint="0.4" :breakpoints="[0, 0.4, 0.6]">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ title || 'Audio' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleClose" fill="clear">
            <ion-icon :icon="closeOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="player-container">
        <!-- Title -->
        <div class="audio-title">
          <ion-icon :icon="musicalNoteOutline" />
          <span>{{ title }}</span>
        </div>

        <!-- Timer Display -->
        <div class="timer-display">
          <span class="current-time">{{ formatTime(currentTime) }}</span>
          <span class="separator">/</span>
          <span class="total-time">{{ formatTime(duration) }}</span>
        </div>

        <!-- Progress Bar -->
        <div class="progress-container" @click="seekTo">
          <div class="progress-track">
            <div
              class="progress-bar"
              :style="{ width: progressPercentage + '%' }"
            ></div>
            <div
              class="progress-thumb"
              :style="{ left: progressPercentage + '%' }"
            ></div>
          </div>
        </div>

        <!-- Control Buttons -->
        <div class="controls">
          <!-- Rewind 10s -->
          <ion-button fill="clear" @click="skip(-10)" :disabled="!isLoaded">
            <ion-icon :icon="playBackOutline" />
          </ion-button>

          <!-- Play/Pause Button -->
          <ion-button
            @click="togglePlayback"
            color="primary"
            size="large"
            class="play-button"
            :disabled="!isLoaded"
          >
            <ion-spinner v-if="isLoading" name="crescent" />
            <ion-icon v-else :icon="isPlaying ? pauseOutline : playOutline" slot="icon-only" />
          </ion-button>

          <!-- Forward 10s -->
          <ion-button fill="clear" @click="skip(10)" :disabled="!isLoaded">
            <ion-icon :icon="playForwardOutline" />
          </ion-button>
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
import {
  closeOutline, playOutline, pauseOutline, playBackOutline, playForwardOutline,
  musicalNoteOutline, alertCircleOutline
} from 'ionicons/icons';

interface Props {
  isOpen: boolean;
  audioUrl: string;
  title?: string;
}

interface Emits {
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// State
const isPlaying = ref(false);
const isLoading = ref(false);
const isLoaded = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const errorMessage = ref('');
const progressPercentage = ref(0);

// Audio element
let audioElement: HTMLAudioElement | null = null;

const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const initAudio = () => {
  if (!props.audioUrl) return;

  cleanup();
  isLoading.value = true;
  errorMessage.value = '';

  audioElement = new Audio(props.audioUrl);

  audioElement.onloadedmetadata = () => {
    duration.value = audioElement!.duration;
    isLoaded.value = true;
    isLoading.value = false;
  };

  audioElement.ontimeupdate = () => {
    currentTime.value = audioElement!.currentTime;
    if (duration.value > 0) {
      progressPercentage.value = (currentTime.value / duration.value) * 100;
    }
  };

  audioElement.onended = () => {
    isPlaying.value = false;
    currentTime.value = 0;
    progressPercentage.value = 0;
  };

  audioElement.onerror = () => {
    isLoading.value = false;
    errorMessage.value = 'Impossible de charger l\'audio.';
  };

  audioElement.onwaiting = () => {
    isLoading.value = true;
  };

  audioElement.oncanplay = () => {
    isLoading.value = false;
  };
};

const togglePlayback = () => {
  if (!audioElement) return;

  if (isPlaying.value) {
    audioElement.pause();
    isPlaying.value = false;
  } else {
    audioElement.play();
    isPlaying.value = true;
  }
};

const skip = (seconds: number) => {
  if (!audioElement) return;
  const newTime = Math.max(0, Math.min(audioElement.currentTime + seconds, duration.value));
  audioElement.currentTime = newTime;
};

const seekTo = (event: MouseEvent) => {
  if (!audioElement || !isLoaded.value) return;

  const container = event.currentTarget as HTMLElement;
  const rect = container.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const percentage = clickX / rect.width;
  const newTime = percentage * duration.value;

  audioElement.currentTime = newTime;
};

const cleanup = () => {
  if (audioElement) {
    audioElement.pause();
    audioElement.src = '';
    audioElement = null;
  }
  isPlaying.value = false;
  isLoaded.value = false;
  isLoading.value = false;
  currentTime.value = 0;
  progressPercentage.value = 0;
  errorMessage.value = '';
};

const handleClose = () => {
  cleanup();
  emit('close');
};

// Initialize audio when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen && props.audioUrl) {
    initAudio();
  } else if (!isOpen) {
    cleanup();
  }
});

// Re-initialize if URL changes while open
watch(() => props.audioUrl, (newUrl) => {
  if (props.isOpen && newUrl) {
    initAudio();
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
  padding: 1rem;
}

.audio-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--ion-color-dark);
  margin-bottom: 1.5rem;
  text-align: center;
}

.audio-title ion-icon {
  color: var(--ion-color-primary);
  font-size: 1.3rem;
}

.timer-display {
  font-size: 1rem;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
  margin-bottom: 1rem;
  color: var(--ion-color-medium);
}

.timer-display .current-time {
  color: var(--ion-color-dark);
  font-weight: 500;
}

.timer-display .separator {
  margin: 0 0.25rem;
}

.progress-container {
  width: 100%;
  padding: 0.5rem 0;
  cursor: pointer;
  margin-bottom: 1.5rem;
}

.progress-track {
  position: relative;
  width: 100%;
  height: 6px;
  background: var(--ion-color-light-shade);
  border-radius: 3px;
}

.progress-bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--ion-color-primary);
  border-radius: 3px;
  transition: width 0.1s linear;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 14px;
  height: 14px;
  background: var(--ion-color-primary);
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: left 0.1s linear;
}

.controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.controls ion-button:not(.play-button) {
  --color: var(--ion-color-medium);
  font-size: 1.5rem;
}

.play-button {
  --border-radius: 50%;
  width: 64px;
  height: 64px;
}

.play-button ion-icon {
  font-size: 1.5rem;
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
