<template>
  <ion-modal :is-open="isOpen" @didDismiss="handleClose" :initial-breakpoint="1" :breakpoints="[0, 1]">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ title || 'PDF Viewer' }}</ion-title>
        <ion-buttons slot="start">
          <ion-button @click="handleClose" fill="clear">
            <ion-icon :icon="arrowBackOutline" />
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button @click="openInNewTab" fill="clear">
            <ion-icon :icon="openOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="pdf-viewer-content">
      <div v-if="loading" class="loading-container">
        <ion-spinner name="crescent" />
        <p>Chargement du PDF...</p>
      </div>

      <div v-else-if="error" class="error-container">
        <div class="error-message">
          <ion-icon :icon="alertCircleOutline" color="danger" />
          <p>{{ error }}</p>
          <div class="error-actions">
            <ion-button @click="retryLoad" fill="outline">
              Réessayer
            </ion-button>
            <ion-button @click="openInNewTab" fill="solid" color="primary">
              Ouvrir dans un nouvel onglet
            </ion-button>
          </div>
        </div>
      </div>

      <div v-else class="pdf-container">
        <!-- PDF iframe using browser's default PDF viewer -->
        <iframe
          :src="pdfUrl + '#toolbar=1&navpanes=1&scrollbar=1'"
          class="pdf-iframe"
          frameborder="0"
          @load="onIframeLoad"
          @error="onIframeError"
        ></iframe>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonSpinner
} from '@ionic/vue';
import {
  arrowBackOutline, alertCircleOutline, openOutline
} from 'ionicons/icons';

interface Props {
  isOpen: boolean;
  pdfUrl: string;
  title?: string;
}

interface Emits {
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const loading = ref(false);
const error = ref('');

const handleClose = () => {
  emit('close');
};

const openInNewTab = () => {
  if (props.pdfUrl) {
    window.open(props.pdfUrl, '_blank');
  }
};

const retryLoad = () => {
  loading.value = true;
  error.value = '';
  // The iframe will reload automatically when the error is cleared
  setTimeout(() => {
    loading.value = false;
  }, 1000);
};

const onIframeLoad = () => {
  loading.value = false;
  error.value = '';
};

const onIframeError = () => {
  loading.value = false;
  error.value = 'Impossible de charger le PDF. Veuillez essayer de l\'ouvrir dans un nouvel onglet.';
};

// Watch for PDF URL changes
watch(() => props.pdfUrl, (newUrl) => {
  if (newUrl && props.isOpen) {
    loading.value = true;
    error.value = '';
  }
});

// Watch for modal open state
watch(() => props.isOpen, (isOpen) => {
  if (isOpen && props.pdfUrl) {
    loading.value = true;
    error.value = '';
  } else if (!isOpen) {
    loading.value = false;
    error.value = '';
  }
});
</script>

<style scoped>
.pdf-viewer-content {
  --background: #f5f5f5;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  gap: 1rem;
  padding: 2rem;
}

.error-message {
  max-width: 400px;
}

.error-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 1rem;
}

.pdf-container {
  position: relative;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.pdf-iframe {
  flex: 1;
  width: 100%;
  height: 100%;
  border: none;
  background: white;
}

/* Mobile specific styles */
@media (max-width: 768px) {
  .loading-container,
  .error-container {
    padding: 1rem;
  }

  .error-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>