<template>
  <ion-modal :is-open="isOpen" @didDismiss="handleClose">
    <ion-header>
      <ion-toolbar>
        <ion-title>Enregistrer audio</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleClose" fill="clear">
            <ion-icon :icon="closeOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="recorder-container">
        <!-- Recording Name Input -->
        <div class="name-input">
          <ion-item>
            <ion-label position="stacked">Nom de l'enregistrement</ion-label>
            <ion-input
              v-model="recordingName"
              placeholder="Mon enregistrement"
              :disabled="isRecording"
            />
          </ion-item>
        </div>

        <!-- Timer Display -->
        <div class="timer-display">
          <span class="time">{{ formatTime(currentTime) }}</span>
          <span v-if="recordingDuration > 0" class="duration">/ {{ formatTime(recordingDuration) }}</span>
        </div>

        <!-- Progress Bar -->
        <div class="progress-container">
          <div
            class="progress-bar"
            :style="{ width: progressPercentage + '%' }"
            :class="{ recording: isRecording, playing: isPlaying }"
          ></div>
        </div>

        <!-- Waveform Animation (during recording) -->
        <div v-if="isRecording" class="waveform">
          <div v-for="i in 5" :key="i" class="wave-bar" :style="{ animationDelay: (i * 0.1) + 's' }"></div>
        </div>

        <!-- Status Message -->
        <div class="status-message">
          <span v-if="isRecording" class="recording-status">
            <span class="recording-dot"></span>
            Enregistrement en cours...
          </span>
          <span v-else-if="isPlaying" class="playing-status">
            Lecture en cours...
          </span>
          <span v-else-if="hasRecording" class="ready-status">
            Enregistrement prêt
          </span>
          <span v-else class="idle-status">
            Appuyez sur le bouton pour commencer
          </span>
        </div>

        <!-- Control Buttons -->
        <div class="controls">
          <!-- Record Button -->
          <ion-button
            v-if="!isRecording && !hasRecording"
            @click="startRecording"
            color="danger"
            size="large"
            class="record-button"
            :disabled="uploading"
          >
            <ion-icon :icon="micOutline" slot="icon-only" />
          </ion-button>

          <!-- Stop Button (during recording) -->
          <ion-button
            v-if="isRecording"
            @click="stopRecording"
            color="dark"
            size="large"
            class="stop-button"
          >
            <ion-icon :icon="stopOutline" slot="icon-only" />
          </ion-button>

          <!-- Playback Controls (after recording) -->
          <div v-if="hasRecording && !isRecording" class="playback-controls">
            <!-- Play/Pause Button -->
            <ion-button
              @click="togglePlayback"
              color="primary"
              size="large"
              :disabled="uploading"
            >
              <ion-icon :icon="isPlaying ? pauseOutline : playOutline" slot="icon-only" />
            </ion-button>

            <!-- Re-record Button -->
            <ion-button
              @click="resetRecording"
              color="medium"
              fill="outline"
              :disabled="uploading"
            >
              <ion-icon :icon="refreshOutline" slot="start" />
              Recommencer
            </ion-button>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="error-message">
          <ion-icon :icon="alertCircleOutline" color="danger" />
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Save Button -->
        <div v-if="hasRecording && !isRecording" class="save-section">
          <ion-button
            @click="saveRecording"
            expand="block"
            color="success"
            :disabled="uploading || !recordingName.trim()"
          >
            <ion-spinner v-if="uploading" name="crescent" slot="start" />
            <ion-icon v-else :icon="cloudUploadOutline" slot="start" />
            {{ uploading ? 'Enregistrement...' : 'Sauvegarder' }}
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonItem, IonLabel, IonInput, IonSpinner
} from '@ionic/vue';
import {
  closeOutline, micOutline, stopOutline, playOutline, pauseOutline,
  refreshOutline, cloudUploadOutline, alertCircleOutline
} from 'ionicons/icons';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/firebase/config';

interface Props {
  isOpen: boolean;
  resourceId: string;
  resourceTitle: string;
}

interface Emits {
  (e: 'close'): void;
  (e: 'saved', data: { url: string; name: string; duration: number; mimeType: string; createdAt: string }): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// State
const recordingName = ref('');
const isRecording = ref(false);
const isPlaying = ref(false);
const hasRecording = ref(false);
const uploading = ref(false);
const errorMessage = ref('');
const currentTime = ref(0);
const recordingDuration = ref(0);

// MediaRecorder and Audio
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let audioBlob: Blob | null = null;
let audioUrl: string | null = null;
let audioElement: HTMLAudioElement | null = null;
let timerInterval: number | null = null;
let selectedMimeType: string = 'audio/webm';
let fileExtension: string = 'webm';

// Detect best supported audio format for recording
const getSupportedMimeType = (): { mimeType: string; extension: string } => {
  // Priority order: mp4/m4a for iOS compatibility, then webm for others
  const types = [
    { mimeType: 'audio/mp4', extension: 'mp4' },
    { mimeType: 'audio/aac', extension: 'aac' },
    { mimeType: 'audio/webm;codecs=opus', extension: 'webm' },
    { mimeType: 'audio/webm', extension: 'webm' },
    { mimeType: 'audio/ogg;codecs=opus', extension: 'ogg' },
    { mimeType: 'audio/wav', extension: 'wav' }
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type.mimeType)) {
      console.log('Using audio format:', type.mimeType);
      return type;
    }
  }

  // Fallback - let browser choose
  console.log('No preferred format supported, using browser default');
  return { mimeType: '', extension: 'webm' };
};

const progressPercentage = computed(() => {
  if (isRecording.value) {
    // During recording, show continuous progress (max 5 minutes)
    return Math.min((currentTime.value / 300) * 100, 100);
  }
  if (recordingDuration.value > 0) {
    return (currentTime.value / recordingDuration.value) * 100;
  }
  return 0;
});

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const startTimer = () => {
  timerInterval = window.setInterval(() => {
    currentTime.value += 0.1;
  }, 100);
};

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
};

const startRecording = async () => {
  try {
    errorMessage.value = '';
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Detect best supported format
    const format = getSupportedMimeType();
    selectedMimeType = format.mimeType;
    fileExtension = format.extension;

    // Create MediaRecorder with detected format
    const options: MediaRecorderOptions = {};
    if (format.mimeType) {
      options.mimeType = format.mimeType;
    }

    mediaRecorder = new MediaRecorder(stream, options);
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      // Use detected mimeType or fallback to actual recorded type
      const blobType = selectedMimeType || mediaRecorder?.mimeType || 'audio/webm';
      audioBlob = new Blob(audioChunks, { type: blobType });
      audioUrl = URL.createObjectURL(audioBlob);
      audioElement = new Audio(audioUrl);

      audioElement.onloadedmetadata = () => {
        recordingDuration.value = audioElement!.duration;
      };

      audioElement.onended = () => {
        isPlaying.value = false;
        currentTime.value = 0;
      };

      audioElement.ontimeupdate = () => {
        if (isPlaying.value) {
          currentTime.value = audioElement!.currentTime;
        }
      };

      hasRecording.value = true;

      // Stop all tracks
      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.start();
    isRecording.value = true;
    currentTime.value = 0;
    startTimer();

  } catch (error) {
    console.error('Error starting recording:', error);
    errorMessage.value = 'Impossible d\'accéder au microphone. Veuillez vérifier les permissions.';
  }
};

const stopRecording = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    isRecording.value = false;
    stopTimer();
    recordingDuration.value = currentTime.value;
    currentTime.value = 0;
  }
};

const togglePlayback = () => {
  if (!audioElement) return;

  if (isPlaying.value) {
    audioElement.pause();
    isPlaying.value = false;
    stopTimer();
  } else {
    audioElement.play();
    isPlaying.value = true;
  }
};

const resetRecording = () => {
  stopTimer();
  isPlaying.value = false;
  hasRecording.value = false;
  currentTime.value = 0;
  recordingDuration.value = 0;

  if (audioElement) {
    audioElement.pause();
    audioElement = null;
  }

  if (audioUrl) {
    URL.revokeObjectURL(audioUrl);
    audioUrl = null;
  }

  audioBlob = null;
  audioChunks = [];
};

const saveRecording = async () => {
  if (!audioBlob || !recordingName.value.trim()) return;

  uploading.value = true;
  errorMessage.value = '';

  try {
    // Create a unique filename with correct extension
    const timestamp = Date.now();
    const sanitizedName = recordingName.value.trim().replace(/[^a-zA-Z0-9-_]/g, '_');
    const filename = `resources/${props.resourceId}/audio/${timestamp}_${sanitizedName}.${fileExtension}`;

    // Get the actual content type from the blob or use detected type
    const contentType = audioBlob.type || selectedMimeType || 'audio/webm';

    // Upload to Firebase Storage
    const fileRef = storageRef(storage, filename);
    await uploadBytes(fileRef, audioBlob, {
      contentType: contentType,
      customMetadata: {
        name: recordingName.value.trim(),
        resourceId: props.resourceId
      }
    });

    // Get download URL
    const downloadUrl = await getDownloadURL(fileRef);

    // Emit saved event with audio data
    emit('saved', {
      url: downloadUrl,
      name: recordingName.value.trim(),
      duration: recordingDuration.value,
      mimeType: contentType,
      createdAt: new Date().toISOString()
    });

    // Reset and close
    cleanup();
    emit('close');

  } catch (error) {
    console.error('Error uploading recording:', error);
    errorMessage.value = 'Erreur lors de l\'enregistrement. Veuillez réessayer.';
  } finally {
    uploading.value = false;
  }
};

const cleanup = () => {
  stopTimer();
  resetRecording();
  recordingName.value = '';
  errorMessage.value = '';
};

const handleClose = () => {
  if (isRecording.value) {
    stopRecording();
  }
  cleanup();
  emit('close');
};

// Set default recording name when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    recordingName.value = `Audio - ${props.resourceTitle}`;
  }
});

// Cleanup on unmount
onUnmounted(() => {
  cleanup();
});
</script>

<style scoped>
.recorder-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  min-height: 400px;
}

.name-input {
  width: 100%;
  margin-bottom: 2rem;
}

.name-input ion-item {
  --background: var(--ion-color-light);
  --border-radius: 8px;
}

.timer-display {
  font-size: 3rem;
  font-weight: 300;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
  margin-bottom: 1rem;
  color: var(--ion-color-dark);
}

.timer-display .duration {
  font-size: 1.5rem;
  color: var(--ion-color-medium);
}

.progress-container {
  width: 100%;
  height: 6px;
  background: var(--ion-color-light-shade);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.progress-bar {
  height: 100%;
  background: var(--ion-color-primary);
  border-radius: 3px;
  transition: width 0.1s linear;
}

.progress-bar.recording {
  background: var(--ion-color-danger);
}

.progress-bar.playing {
  background: var(--ion-color-success);
}

.waveform {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 40px;
  margin-bottom: 1rem;
}

.wave-bar {
  width: 4px;
  height: 20px;
  background: var(--ion-color-danger);
  border-radius: 2px;
  animation: wave 0.5s ease-in-out infinite alternate;
}

@keyframes wave {
  from {
    height: 10px;
  }
  to {
    height: 35px;
  }
}

.status-message {
  font-size: 0.95rem;
  margin-bottom: 2rem;
  min-height: 24px;
}

.recording-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--ion-color-danger);
  font-weight: 500;
}

.recording-dot {
  width: 10px;
  height: 10px;
  background: var(--ion-color-danger);
  border-radius: 50%;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

.playing-status {
  color: var(--ion-color-success);
  font-weight: 500;
}

.ready-status {
  color: var(--ion-color-primary);
}

.idle-status {
  color: var(--ion-color-medium);
}

.controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.record-button,
.stop-button {
  --border-radius: 50%;
  width: 80px;
  height: 80px;
  font-size: 2rem;
}

.record-button ion-icon,
.stop-button ion-icon {
  font-size: 2rem;
}

.playback-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.playback-controls ion-button:first-child {
  --border-radius: 50%;
  width: 64px;
  height: 64px;
}

.playback-controls ion-button:first-child ion-icon {
  font-size: 1.5rem;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--ion-color-danger);
  font-size: 0.9rem;
  margin-bottom: 1rem;
  text-align: center;
}

.save-section {
  width: 100%;
  margin-top: auto;
}
</style>
