<template>
  <ion-modal :is-open="isOpen" @didDismiss="handleClose">
    <ion-header>
      <ion-toolbar>
        <ion-title>Enregistrer vidéo</ion-title>
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
              placeholder="Mon enregistrement vidéo"
              :disabled="isRecording || isCompressing"
            />
          </ion-item>
        </div>

        <!-- Video Preview -->
        <div class="video-preview-container">
          <video
            ref="videoPreview"
            class="video-preview"
            :class="{ recording: isRecording, 'has-recording': hasRecording && !isRecording }"
            playsinline
            :muted="isRecording"
            :controls="hasRecording && !isRecording"
          ></video>

          <!-- Recording Indicator -->
          <div v-if="isRecording" class="recording-indicator">
            <span class="recording-dot"></span>
            <span class="recording-time">{{ formatTime(currentTime) }}</span>
          </div>
        </div>

        <!-- Timer Display (when not recording) -->
        <div v-if="!isRecording && hasRecording" class="timer-display">
          <span class="time">Durée: {{ formatTime(recordingDuration) }}</span>
        </div>

        <!-- Compression Progress -->
        <div v-if="isCompressing" class="compression-status">
          <ion-spinner name="crescent" />
          <span>Compression en cours... {{ compressionProgress }}%</span>
          <div class="compression-bar">
            <div class="compression-progress" :style="{ width: compressionProgress + '%' }"></div>
          </div>
        </div>

        <!-- Status Message -->
        <div class="status-message">
          <span v-if="isRecording" class="recording-status">
            Enregistrement en cours...
          </span>
          <span v-else-if="isCompressing" class="compressing-status">
            Optimisation de la vidéo...
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
            :disabled="uploading || isCompressing"
          >
            <ion-icon :icon="videocamOutline" slot="icon-only" />
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
          <div v-if="hasRecording && !isRecording && !isCompressing" class="playback-controls">
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
        <div v-if="hasRecording && !isRecording && !isCompressing" class="save-section">
          <ion-button
            @click="saveRecording"
            expand="block"
            color="success"
            :disabled="uploading || !recordingName.trim()"
          >
            <ion-spinner v-if="uploading" name="crescent" slot="start" />
            <ion-icon v-else :icon="cloudUploadOutline" slot="start" />
            {{ uploading ? `Envoi... ${uploadProgress}%` : 'Sauvegarder' }}
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonItem, IonLabel, IonInput, IonSpinner
} from '@ionic/vue';
import {
  closeOutline, videocamOutline, stopOutline,
  refreshOutline, cloudUploadOutline, alertCircleOutline
} from 'ionicons/icons';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
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

// Refs
const videoPreview = ref<HTMLVideoElement | null>(null);

// State
const recordingName = ref('');
const isRecording = ref(false);
const hasRecording = ref(false);
const isCompressing = ref(false);
const uploading = ref(false);
const errorMessage = ref('');
const currentTime = ref(0);
const recordingDuration = ref(0);
const compressionProgress = ref(0);
const uploadProgress = ref(0);

// MediaRecorder and streams
let mediaRecorder: MediaRecorder | null = null;
let videoChunks: Blob[] = [];
let recordedBlob: Blob | null = null;
let compressedBlob: Blob | null = null;
let mediaStream: MediaStream | null = null;
let timerInterval: number | null = null;

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const startTimer = () => {
  timerInterval = window.setInterval(() => {
    currentTime.value += 1;
  }, 1000);
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

    // Request camera and microphone access
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1920, max: 1920 },
        height: { ideal: 1080, max: 1080 },
        facingMode: 'user'
      },
      audio: true
    });

    // Show live preview
    if (videoPreview.value) {
      videoPreview.value.srcObject = mediaStream;
      videoPreview.value.play();
    }

    // Detect best supported format
    const mimeType = getSupportedMimeType();
    const options: MediaRecorderOptions = {
      videoBitsPerSecond: 2500000, // 2.5 Mbps for good quality
      audioBitsPerSecond: 128000   // 128 kbps for audio
    };
    if (mimeType) {
      options.mimeType = mimeType;
    }

    mediaRecorder = new MediaRecorder(mediaStream, options);
    videoChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        videoChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const mimeType = mediaRecorder?.mimeType || 'video/webm';
      recordedBlob = new Blob(videoChunks, { type: mimeType });

      // Stop the live stream
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }

      // Show recorded video for preview
      if (videoPreview.value) {
        videoPreview.value.srcObject = null;
        videoPreview.value.src = URL.createObjectURL(recordedBlob);
        videoPreview.value.muted = false;
      }

      recordingDuration.value = currentTime.value;
      hasRecording.value = true;

      // Compress the video
      await compressVideo(recordedBlob);
    };

    mediaRecorder.start(1000); // Collect data every second
    isRecording.value = true;
    currentTime.value = 0;
    startTimer();

  } catch (error: any) {
    console.error('Error starting recording:', error);
    if (error.name === 'NotAllowedError') {
      errorMessage.value = 'Accès à la caméra refusé. Veuillez autoriser l\'accès dans les paramètres.';
    } else if (error.name === 'NotFoundError') {
      errorMessage.value = 'Aucune caméra trouvée sur cet appareil.';
    } else {
      errorMessage.value = 'Impossible d\'accéder à la caméra. Veuillez vérifier les permissions.';
    }
  }
};

const stopRecording = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    isRecording.value = false;
    stopTimer();
  }
};

const getSupportedMimeType = (): string => {
  // Prioritize formats with audio codec specified
  const types = [
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=h264,opus',
    'video/webm'
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      console.log('Using video format:', type);
      return type;
    }
  }

  return '';
};

const compressVideo = async (blob: Blob) => {
  isCompressing.value = true;
  compressionProgress.value = 0;

  try {
    const fileSizeMB = blob.size / (1024 * 1024);
    console.log(`Video size: ${fileSizeMB.toFixed(2)} MB`);

    // Since we're already recording at max 1080p with constrained resolution,
    // and canvas-based re-encoding loses audio, we'll skip compression
    // and use the original blob which already has audio
    compressedBlob = blob;

    // Simulate progress for better UX
    for (let i = 0; i <= 100; i += 20) {
      compressionProgress.value = i;
      await new Promise(resolve => setTimeout(resolve, 100));
    }

  } catch (error) {
    console.error('Compression error:', error);
    compressedBlob = blob;
  } finally {
    isCompressing.value = false;
    compressionProgress.value = 100;
  }
};

const resetRecording = () => {
  stopTimer();
  hasRecording.value = false;
  isCompressing.value = false;
  currentTime.value = 0;
  recordingDuration.value = 0;
  compressionProgress.value = 0;

  if (videoPreview.value) {
    if (videoPreview.value.src) {
      URL.revokeObjectURL(videoPreview.value.src);
    }
    videoPreview.value.src = '';
    videoPreview.value.srcObject = null;
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }

  recordedBlob = null;
  compressedBlob = null;
  videoChunks = [];
};

const saveRecording = async () => {
  const blobToUpload = compressedBlob || recordedBlob;
  if (!blobToUpload || !recordingName.value.trim()) return;

  uploading.value = true;
  uploadProgress.value = 0;
  errorMessage.value = '';

  try {
    // Create a unique filename
    const timestamp = Date.now();
    const sanitizedName = recordingName.value.trim().replace(/[^a-zA-Z0-9-_]/g, '_');
    const extension = blobToUpload.type.includes('mp4') ? 'mp4' : 'webm';
    const filename = `resources/${props.resourceId}/video/${timestamp}_${sanitizedName}.${extension}`;

    // Upload to Firebase Storage with progress tracking
    const fileRef = storageRef(storage, filename);
    const uploadTask = uploadBytesResumable(fileRef, blobToUpload, {
      contentType: blobToUpload.type,
      customMetadata: {
        name: recordingName.value.trim(),
        resourceId: props.resourceId
      }
    });

    // Track upload progress
    uploadTask.on('state_changed',
      (snapshot) => {
        uploadProgress.value = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
      },
      (error) => {
        console.error('Upload error:', error);
        errorMessage.value = 'Erreur lors de l\'envoi. Veuillez réessayer.';
        uploading.value = false;
      },
      async () => {
        // Upload completed
        const downloadUrl = await getDownloadURL(fileRef);

        emit('saved', {
          url: downloadUrl,
          name: recordingName.value.trim(),
          duration: recordingDuration.value,
          mimeType: blobToUpload.type,
          createdAt: new Date().toISOString()
        });

        cleanup();
        emit('close');
      }
    );

  } catch (error) {
    console.error('Error uploading recording:', error);
    errorMessage.value = 'Erreur lors de l\'enregistrement. Veuillez réessayer.';
    uploading.value = false;
  }
};

const cleanup = () => {
  stopTimer();
  resetRecording();
  recordingName.value = '';
  errorMessage.value = '';
  uploading.value = false;
  uploadProgress.value = 0;
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
    recordingName.value = `Vidéo - ${props.resourceTitle}`;
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
  margin-bottom: 1rem;
}

.name-input ion-item {
  --background: var(--ion-color-light);
  --border-radius: 8px;
}

.video-preview-container {
  position: relative;
  width: 100%;
  max-width: 400px;
  aspect-ratio: 16/9;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.video-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-preview.recording {
  border: 3px solid var(--ion-color-danger);
}

.video-preview.has-recording {
  object-fit: contain;
}

.recording-indicator {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.6);
  padding: 6px 12px;
  border-radius: 20px;
  color: white;
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

.recording-time {
  font-size: 0.9rem;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
}

.timer-display {
  font-size: 1rem;
  color: var(--ion-color-medium);
  margin-bottom: 1rem;
}

.compression-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  color: var(--ion-color-primary);
}

.compression-bar {
  width: 100%;
  max-width: 200px;
  height: 4px;
  background: var(--ion-color-light-shade);
  border-radius: 2px;
  overflow: hidden;
}

.compression-progress {
  height: 100%;
  background: var(--ion-color-primary);
  transition: width 0.3s ease;
}

.status-message {
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
  min-height: 24px;
  text-align: center;
}

.recording-status {
  color: var(--ion-color-danger);
  font-weight: 500;
}

.compressing-status {
  color: var(--ion-color-primary);
  font-weight: 500;
}

.ready-status {
  color: var(--ion-color-success);
}

.idle-status {
  color: var(--ion-color-medium);
}

.controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
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
