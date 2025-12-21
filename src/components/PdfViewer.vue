<template>
  <ion-modal :is-open="isOpen" @didDismiss="handleClose" class="pdf-viewer-modal">
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="handleClose" fill="clear">
            <ion-icon :icon="arrowBackOutline" />
          </ion-button>
        </ion-buttons>
        <ion-title>{{ title || 'PDF Viewer' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openInNewTab" fill="clear">
            <ion-icon :icon="openOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <!-- Pagination toolbar -->
      <ion-toolbar v-if="pageCount > 0" class="pagination-toolbar">
        <div class="pagination-controls">
          <ion-button fill="clear" size="small" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">
            <ion-icon :icon="chevronBackOutline" />
          </ion-button>
          <span class="page-indicator">{{ currentPage }} / {{ pageCount }}</span>
          <ion-button fill="clear" size="small" :disabled="currentPage >= pageCount" @click="goToPage(currentPage + 1)">
            <ion-icon :icon="chevronForwardOutline" />
          </ion-button>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content class="pdf-viewer-content" :scroll-y="true">
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
        <VuePdfEmbed
          v-if="isOpen && pdfUrl"
          :source="pdfUrl"
          :page="currentPage"
          class="pdf-embed"
          @loaded="onDocumentLoaded"
          @loading-failed="onLoadError"
          @rendered="onPageRendered"
          @rendering-failed="onRenderError"
        />
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
  arrowBackOutline, alertCircleOutline, openOutline, chevronBackOutline, chevronForwardOutline
} from 'ionicons/icons';
import VuePdfEmbed from 'vue-pdf-embed';

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

const loading = ref(true);
const error = ref('');
const currentPage = ref(1);
const pageCount = ref(0);

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
  currentPage.value = 1;
};

const goToPage = (page: number) => {
  if (page >= 1 && page <= pageCount.value) {
    currentPage.value = page;
  }
};

const onDocumentLoaded = (pdf: { numPages: number }) => {
  pageCount.value = pdf.numPages;
  loading.value = false;
  error.value = '';
};

const onPageRendered = () => {
  loading.value = false;
};

const onLoadError = (err: Error) => {
  console.error('PDF loading error:', err);
  loading.value = false;
  error.value = 'Impossible de charger le PDF. Veuillez essayer de l\'ouvrir dans un nouvel onglet.';
};

const onRenderError = (err: Error) => {
  console.error('PDF rendering error:', err);
  loading.value = false;
  error.value = 'Erreur lors de l\'affichage du PDF.';
};

// Watch for modal open state
watch(() => props.isOpen, (isOpen) => {
  if (isOpen && props.pdfUrl) {
    loading.value = true;
    error.value = '';
    currentPage.value = 1;
    pageCount.value = 0;
  } else if (!isOpen) {
    loading.value = true;
    error.value = '';
    currentPage.value = 1;
    pageCount.value = 0;
  }
}, { immediate: true });

// Watch for PDF URL changes
watch(() => props.pdfUrl, (newUrl) => {
  if (newUrl && props.isOpen) {
    loading.value = true;
    error.value = '';
    currentPage.value = 1;
    pageCount.value = 0;
  }
});
</script>

<style scoped>
.pdf-viewer-modal {
  --width: 100%;
  --height: 100%;
}

.pdf-viewer-content {
  --background: #525659;
}

.pagination-toolbar {
  --background: var(--ion-toolbar-background);
  --border-width: 0;
}

.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
}

.page-indicator {
  font-size: 0.875rem;
  min-width: 60px;
  text-align: center;
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
  color: #fff;
}

.error-message {
  max-width: 400px;
  background: var(--ion-background-color);
  border-radius: 12px;
  padding: 1.5rem;
  color: var(--ion-text-color);
}

.error-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 1rem;
}

.pdf-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  min-height: 100%;
}

.pdf-embed {
  max-width: 100%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.pdf-embed :deep(canvas) {
  max-width: 100%;
  height: auto !important;
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

  .pdf-container {
    padding: 0.5rem;
  }
}
</style>
