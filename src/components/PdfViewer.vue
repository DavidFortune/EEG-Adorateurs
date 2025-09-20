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
          <ion-button @click="toggleFullscreen" fill="clear">
            <ion-icon :icon="isFullscreen ? contractOutline : expandOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="isFullscreen" class="pdf-viewer-content">
      <div v-if="loading" class="loading-container">
        <ion-spinner name="crescent" />
        <p>Chargement du PDF...</p>
      </div>

      <div v-else-if="error" class="error-container">
        <ion-icon :icon="alertCircleOutline" color="danger" />
        <p>{{ error }}</p>
        <ion-button @click="loadPdf" fill="outline">Réessayer</ion-button>
      </div>

      <div v-else class="pdf-container" :class="{ 'fullscreen': isFullscreen }">
        <!-- Page counter -->
        <div class="page-info" v-if="totalPages > 0">
          <span>{{ currentPage }} / {{ totalPages }}</span>
        </div>

        <!-- PDF pages with swiper -->
        <div class="pdf-swiper-container" ref="swiperContainer">
          <div class="swiper-wrapper">
            <div
              v-for="pageNum in totalPages"
              :key="pageNum"
              class="swiper-slide"
            >
              <div class="page-container">
                <canvas
                  :ref="el => setCanvasRef(el, pageNum)"
                  class="pdf-canvas"
                  @touchstart="handleTouchStart"
                  @touchmove="handleTouchMove"
                  @touchend="handleTouchEnd"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation controls -->
        <div class="navigation-controls" v-if="totalPages > 1">
          <ion-button
            @click="previousPage"
            :disabled="currentPage <= 1"
            fill="clear"
            size="large"
            class="nav-button prev-button"
          >
            <ion-icon :icon="chevronBackOutline" />
          </ion-button>

          <ion-button
            @click="nextPage"
            :disabled="currentPage >= totalPages"
            fill="clear"
            size="large"
            class="nav-button next-button"
          >
            <ion-icon :icon="chevronForwardOutline" />
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonSpinner
} from '@ionic/vue';
import {
  arrowBackOutline, expandOutline, contractOutline, alertCircleOutline,
  chevronBackOutline, chevronForwardOutline
} from 'ionicons/icons';
import * as pdfjsLib from 'pdfjs-dist';
import { Swiper } from 'swiper';
import 'swiper/css';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

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
const currentPage = ref(1);
const totalPages = ref(0);
const isFullscreen = ref(false);
const swiperContainer = ref<HTMLElement>();
const swiper = ref<Swiper>();
const pdfDocument = ref<any>(null);
const canvasRefs = ref<Map<number, HTMLCanvasElement>>(new Map());

// Touch handling for zoom
const initialDistance = ref(0);
const currentScale = ref(1);
const maxScale = 3;
const minScale = 0.5;

const setCanvasRef = (el: any, pageNum: number) => {
  if (el && el instanceof HTMLCanvasElement) {
    canvasRefs.value.set(pageNum, el);
  }
};

const handleClose = () => {
  emit('close');
};

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

const loadPdf = async () => {
  if (!props.pdfUrl) return;

  loading.value = true;
  error.value = '';

  try {
    const loadingTask = pdfjsLib.getDocument(props.pdfUrl);
    pdfDocument.value = await loadingTask.promise;
    totalPages.value = pdfDocument.value.numPages;

    await nextTick();
    await initSwiper();
    await renderAllPages();
  } catch (err: any) {
    console.error('Error loading PDF:', err);
    error.value = 'Erreur lors du chargement du PDF. Vérifiez que le lien est valide.';
  } finally {
    loading.value = false;
  }
};

const initSwiper = async () => {
  await nextTick();

  if (swiperContainer.value && !swiper.value) {
    swiper.value = new Swiper(swiperContainer.value, {
      direction: 'horizontal',
      spaceBetween: 10,
      centeredSlides: true,
      slidesPerView: 1,
      allowTouchMove: true,
      resistanceRatio: 0.3,
      on: {
        slideChange: (swiperInstance) => {
          currentPage.value = swiperInstance.activeIndex + 1;
        }
      }
    });
  }
};

const renderAllPages = async () => {
  if (!pdfDocument.value) return;

  for (let pageNum = 1; pageNum <= totalPages.value; pageNum++) {
    await renderPage(pageNum);
  }
};

const renderPage = async (pageNum: number) => {
  if (!pdfDocument.value) return;

  const canvas = canvasRefs.value.get(pageNum);
  if (!canvas) return;

  const page = await pdfDocument.value.getPage(pageNum);
  const context = canvas.getContext('2d');

  if (!context) return;

  // Calculate scale to fit screen width
  const containerWidth = canvas.parentElement?.clientWidth || window.innerWidth;
  const viewport = page.getViewport({ scale: 1 });
  const scale = (containerWidth * 0.95) / viewport.width * currentScale.value;

  const scaledViewport = page.getViewport({ scale });

  canvas.height = scaledViewport.height;
  canvas.width = scaledViewport.width;

  const renderContext = {
    canvasContext: context,
    viewport: scaledViewport
  };

  await page.render(renderContext).promise;
};

const previousPage = () => {
  if (swiper.value && currentPage.value > 1) {
    swiper.value.slidePrev();
  }
};

const nextPage = () => {
  if (swiper.value && currentPage.value < totalPages.value) {
    swiper.value.slideNext();
  }
};

// Touch handling for pinch-to-zoom
const handleTouchStart = (event: TouchEvent) => {
  if (event.touches.length === 2) {
    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    initialDistance.value = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  }
};

const handleTouchMove = (event: TouchEvent) => {
  if (event.touches.length === 2) {
    event.preventDefault();
    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    const currentDistance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );

    if (initialDistance.value > 0) {
      const scaleChange = currentDistance / initialDistance.value;
      const newScale = Math.max(minScale, Math.min(maxScale, currentScale.value * scaleChange));

      if (newScale !== currentScale.value) {
        currentScale.value = newScale;
        renderPage(currentPage.value);
      }
    }
  }
};

const handleTouchEnd = () => {
  initialDistance.value = 0;
};

// Watch for PDF URL changes
watch(() => props.pdfUrl, (newUrl) => {
  if (newUrl && props.isOpen) {
    loadPdf();
  }
});

// Watch for modal open state
watch(() => props.isOpen, (isOpen) => {
  if (isOpen && props.pdfUrl) {
    currentPage.value = 1;
    currentScale.value = 1;
    loadPdf();
  } else if (!isOpen) {
    // Cleanup
    if (swiper.value) {
      swiper.value.destroy();
      swiper.value = undefined;
    }
    canvasRefs.value.clear();
    pdfDocument.value = null;
  }
});

onUnmounted(() => {
  if (swiper.value) {
    swiper.value.destroy();
  }
});
</script>

<style scoped>
.pdf-viewer-content {
  --background: #1a1a1a;
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
}

.pdf-container {
  position: relative;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.pdf-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
  background: #1a1a1a;
}

.page-info {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  z-index: 10;
}

.pdf-swiper-container {
  flex: 1;
  width: 100%;
  height: 100%;
}

.swiper-slide {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #1a1a1a;
}

.page-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 10px;
}

.pdf-canvas {
  max-width: 100%;
  max-height: 100%;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

.navigation-controls {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  pointer-events: none;
  z-index: 5;
}

.nav-button {
  pointer-events: auto;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  --border-radius: 50%;
  width: 48px;
  height: 48px;
  margin: 0 16px;
}

.nav-button ion-icon {
  font-size: 24px;
}

.prev-button {
  align-self: flex-start;
}

.next-button {
  align-self: flex-end;
}

/* Mobile specific styles */
@media (max-width: 768px) {
  .page-info {
    top: 5px;
    right: 5px;
    padding: 6px 10px;
    font-size: 0.8rem;
  }

  .nav-button {
    width: 40px;
    height: 40px;
    margin: 0 8px;
  }

  .nav-button ion-icon {
    font-size: 20px;
  }

  .page-container {
    padding: 5px;
  }
}
</style>