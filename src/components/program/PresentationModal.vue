<template>
  <ion-modal :is-open="isOpen" @ionModalDidDismiss="$emit('close')" class="presentation-modal fullscreen-modal">
    <ion-content class="presentation-content" :fullscreen="true">
      <div class="presentation-container"
        @touchstart="handlePresentationTouchStart"
        @touchmove="handlePresentationTouchMove"
        @touchend="handlePresentationTouchEnd"
      >
        <!-- Close Button -->
        <div class="presentation-close-btn">
          <ion-button @click="$emit('close')" fill="clear" color="light">
            <ion-icon :icon="closeOutline" />
          </ion-button>
        </div>

        <!-- Slide Display -->
        <div v-if="slides.length > 0" class="slide-section">
          <!-- Slide Counter -->
          <div class="slide-counter">
            {{ currentSlideIndex + 1 }} / {{ slides.length }}
          </div>

          <!-- Main Slide -->
          <div class="slide-wrapper">
            <!-- Scripture Slide (for Lecture biblique or Prédication with scripture) -->
            <div v-if="currentSlide?.scriptureReference" class="slide-fullscreen slide-scripture-mode">
              <!-- Scripture Header -->
              <div class="scripture-slide-header">
                <div class="scripture-badge">
                  <ion-icon :icon="currentSlide.type === 'Prédication' ? micOutline : libraryOutline" />
                  <span>{{ currentSlide.type === 'Prédication' ? 'Prédication' : 'Lecture biblique' }}</span>
                </div>
                <div class="scripture-header-right">
                  <div v-if="currentSlide.scripturePage && currentSlide.scriptureTotal && currentSlide.scriptureTotal > 1" class="scripture-page-indicator">
                    {{ currentSlide.scripturePage }}/{{ currentSlide.scriptureTotal }}
                  </div>
                  <div v-if="currentSlide.itemNumber" class="slide-number">#{{ currentSlide.itemNumber }}</div>
                </div>
              </div>

              <!-- Scripture Content -->
              <div class="scripture-slide-body">
                <!-- For sermons, show the title first (only on first page) -->
                <div v-if="currentSlide.type === 'Prédication' && currentSlide.title && (!currentSlide.scripturePage || currentSlide.scripturePage === 1)" class="sermon-title">{{ currentSlide.title }}</div>

                <div class="scripture-reference-large">{{ currentSlide.scriptureReference }}</div>
                <div class="scripture-divider"></div>
                <div v-if="currentSlide.scriptureText" class="scripture-text-large scripture-text-formatted" v-html="formatScriptureForDisplay(currentSlide.scriptureText)"></div>
                <div v-else class="scripture-no-text">
                  <ion-icon :icon="bookOutline" />
                  <span>Texte non disponible</span>
                </div>
              </div>

              <!-- Scripture Footer -->
              <div v-if="currentSlide.participant || currentSlide.duration" class="scripture-slide-footer">
                <div v-if="currentSlide.participant" class="slide-participant">
                  <ion-icon :icon="personOutline" />
                  <span>{{ currentSlide.participant }}</span>
                </div>
                <div v-if="currentSlide.duration" class="slide-duration">
                  <ion-icon :icon="timeOutline" />
                  <span>{{ currentSlide.duration }} min</span>
                </div>
              </div>
            </div>

            <!-- Lyrics Slide (sub-item or regular song) -->
            <div v-else-if="currentSlide?.isLyricsSlide" class="slide-fullscreen slide-lyrics-mode">
              <!-- Lyrics Header -->
              <div class="slide-header-compact">
                <div class="slide-parent-info">
                  <span v-if="currentSlide.parentTitle" class="parent-title">{{ currentSlide.parentTitle }}</span>
                </div>
                <div v-if="currentSlide.lyricsTotal && currentSlide.lyricsTotal > 1" class="lyrics-page-indicator">
                  Page {{ currentSlide.lyricsPage }} / {{ currentSlide.lyricsTotal }}
                </div>
              </div>

              <!-- Song Title -->
              <div class="slide-song-header">
                <ion-icon :icon="musicalNoteOutline" class="song-icon" />
                <h1 class="slide-song-title">{{ currentSlide.title }}</h1>
              </div>

              <!-- Lyrics Display -->
              <div class="slide-lyrics-full">
                <div v-if="currentSlide.lyrics" class="lyrics-text">{{ currentSlide.lyrics }}</div>
                <div v-else class="no-lyrics-message">
                  <ion-icon :icon="documentTextOutline" />
                  <span>Aucune parole disponible</span>
                </div>
              </div>

              <!-- Notes (only on first page) -->
              <div v-if="currentSlide.notes" class="slide-notes-bottom">
                <ion-icon :icon="documentTextOutline" />
                <span>{{ currentSlide.notes }}</span>
              </div>
            </div>

            <!-- Regular Slide (non-lyrics) -->
            <div v-else class="slide-fullscreen" :class="{ 'is-section': currentSlide?.isSection }">
              <!-- Slide Header -->
              <div class="slide-header">
                <div class="slide-type-badge">
                  <ion-icon :icon="getSlideTypeIcon(currentSlide?.type || 'Chant')" />
                  <span>{{ getSlideTypeLabel(currentSlide?.type || 'Chant') }}</span>
                </div>
                <div v-if="currentSlide && !currentSlide.isSection && currentSlide.itemNumber" class="slide-number">
                  #{{ currentSlide.itemNumber }}
                </div>
              </div>

              <!-- Slide Content -->
              <div class="slide-body">
                <h1 class="slide-title">{{ currentSlide?.title }}</h1>
                <p v-if="currentSlide?.subtitle" class="slide-subtitle">
                  {{ currentSlide.subtitle }}
                </p>

                <!-- Notes -->
                <div v-if="currentSlide?.notes" class="slide-notes">
                  <ion-icon :icon="documentTextOutline" />
                  <span>{{ currentSlide.notes }}</span>
                </div>
              </div>

              <!-- Slide Footer -->
              <div class="slide-footer">
                <div v-if="currentSlide?.participant" class="slide-participant">
                  <ion-icon :icon="personOutline" />
                  <span>{{ currentSlide.participant }}</span>
                </div>
                <div v-if="currentSlide?.duration" class="slide-duration">
                  <ion-icon :icon="timeOutline" />
                  <span>{{ currentSlide.duration }} min</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Navigation Controls -->
          <div class="presentation-controls">
            <ion-button
              @click="previousSlide"
              :disabled="currentSlideIndex === 0"
              fill="solid"
              color="light"
              class="nav-button"
            >
              <ion-icon :icon="playBackOutline" slot="start" class="hide-mobile" />
              <ion-icon :icon="playBackOutline" slot="icon-only" class="show-mobile" />
              <span class="hide-mobile">Précédent</span>
            </ion-button>

            <div class="slide-progress-indicator">
              <div
                v-for="(slide, index) in slides"
                :key="index"
                :class="['slide-progress-dot', { 'active': index === currentSlideIndex, 'viewed': index < currentSlideIndex, 'is-section': slide.isSection, 'is-lyrics': slide.isLyricsSlide }]"
                @click="goToSlide(index)"
                :title="slide.lyricsPage ? `${slide.title} (${slide.lyricsPage}/${slide.lyricsTotal})` : slide.title"
              ></div>
            </div>

            <ion-button
              @click="nextSlide"
              :disabled="currentSlideIndex === slides.length - 1"
              fill="solid"
              color="light"
              class="nav-button"
            >
              <span class="hide-mobile">Suivant</span>
              <ion-icon :icon="playForwardOutline" slot="icon-only" class="show-mobile" />
              <ion-icon :icon="playForwardOutline" slot="end" class="hide-mobile" />
            </ion-button>
          </div>
        </div>

        <!-- No slides -->
        <div v-else class="no-slides">
          <ion-icon :icon="documentTextOutline" class="no-slides-icon" />
          <p>Aucun élément dans le programme</p>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  IonModal,
  IonContent,
  IonButton,
  IonIcon,
} from '@ionic/vue';
import {
  closeOutline,
  micOutline,
  libraryOutline,
  musicalNoteOutline,
  handLeftOutline,
  bookOutline,
  documentTextOutline,
  personOutline,
  timeOutline,
  playBackOutline,
  playForwardOutline,
} from 'ionicons/icons';

export interface PresentationSlide {
  type?: string;
  title: string;
  subtitle?: string;
  participant?: string;
  duration?: number;
  notes?: string;
  scriptureReference?: string;
  scriptureText?: string;
  lyrics?: string;
  lyricsPage?: number;
  lyricsTotal?: number;
  scripturePage?: number;
  scriptureTotal?: number;
  isScriptureSlide?: boolean;
  itemNumber: number;
  isSection?: boolean;
  isLyricsSlide?: boolean;
  parentTitle?: string;
}

const props = defineProps<{
  isOpen: boolean;
  slides: PresentationSlide[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

// Current slide tracking
const currentSlideIndex = ref(0);

const currentSlide = computed(() => {
  if (props.slides.length === 0) return null;
  return props.slides[currentSlideIndex.value];
});

// Reset slide index when modal opens
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    currentSlideIndex.value = 0;
  }
});

// Presentation touch/swipe handling
const presentationTouchStartX = ref(0);
const presentationTouchEndX = ref(0);
const presentationTouchStartY = ref(0);
const presentationTouchEndY = ref(0);

const nextSlide = () => {
  if (currentSlideIndex.value < props.slides.length - 1) {
    currentSlideIndex.value++;
  }
};

const previousSlide = () => {
  if (currentSlideIndex.value > 0) {
    currentSlideIndex.value--;
  }
};

const goToSlide = (index: number) => {
  currentSlideIndex.value = index;
};

const handlePresentationTouchStart = (e: TouchEvent) => {
  presentationTouchStartX.value = e.touches[0].clientX;
  presentationTouchStartY.value = e.touches[0].clientY;
};

const handlePresentationTouchMove = (e: TouchEvent) => {
  presentationTouchEndX.value = e.touches[0].clientX;
  presentationTouchEndY.value = e.touches[0].clientY;
};

const handlePresentationTouchEnd = () => {
  const deltaX = presentationTouchStartX.value - presentationTouchEndX.value;
  const deltaY = Math.abs(presentationTouchStartY.value - presentationTouchEndY.value);

  const minSwipeDistance = 50;

  if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaX) > deltaY * 2) {
    if (deltaX > 0) {
      nextSlide();
    } else {
      previousSlide();
    }
  }

  presentationTouchStartX.value = 0;
  presentationTouchEndX.value = 0;
  presentationTouchStartY.value = 0;
  presentationTouchEndY.value = 0;
};

const getSlideTypeIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    'Chant': musicalNoteOutline,
    'Prière': handLeftOutline,
    'Lecture biblique': libraryOutline,
    'Prédication': micOutline,
    'Section': bookOutline,
    'Titre': bookOutline,
  };
  return iconMap[type] || documentTextOutline;
};

const getSlideTypeLabel = (type: string): string => {
  const labelMap: Record<string, string> = {
    'Chant': 'Chant',
    'Prière': 'Prière',
    'Lecture biblique': 'Lecture biblique',
    'Prédication': 'Prédication',
    'Section': 'Section',
    'Titre': 'Titre',
  };
  return labelMap[type] || type;
};

const formatScriptureForDisplay = (text: string): string => {
  if (!text) return '';
  // Style the verse number at the start
  return text.replace(/^(\d{1,3})\s+/, '<span class="verse-number">$1</span> ');
};
</script>

<style scoped>
/* Fullscreen Modal */
.fullscreen-modal {
  --width: 100%;
  --height: 100%;
  --border-radius: 0;
}

/* Presentation Modal (Fullscreen 16:9) */
.presentation-modal {
  --width: 100%;
  --height: 100%;
  --border-radius: 0;
}

.presentation-content {
  --background: #000;
}

.presentation-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: #000;
  position: relative;
}

/* Close Button */
.presentation-close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 100;
}

.presentation-close-btn ion-button {
  --color: rgba(255, 255, 255, 0.8);
  font-size: 1.5rem;
}

.presentation-close-btn ion-button:hover {
  --color: white;
}

.slide-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.slide-counter {
  position: absolute;
  top: 1rem;
  left: 1rem;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
  z-index: 100;
  background: rgba(0, 0, 0, 0.5);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
}

.slide-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  overflow: hidden;
}

/* Fullscreen Slide Container */
.slide-fullscreen {
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* Lyrics Mode Slide */
.slide-fullscreen.slide-lyrics-mode {
  background: linear-gradient(145deg, #0a0a15 0%, #1a1a2e 100%);
}

/* Scripture Mode Slide */
.slide-fullscreen.slide-scripture-mode {
  background: linear-gradient(145deg, #1a0a0a 0%, #2e1a1a 50%, #1a1a2e 100%);
}

.scripture-slide-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 3rem;
  flex-shrink: 0;
}

.scripture-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 1.25rem;
  background: rgba(181, 18, 27, 0.9);
  color: white;
  border-radius: 30px;
  font-size: 1.1rem;
  font-weight: 600;
}

.scripture-badge ion-icon {
  font-size: 1.4rem;
}

.scripture-slide-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem 4rem;
  text-align: center;
}

.sermon-title {
  font-size: 2.2rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1rem;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.scripture-reference-large {
  font-size: 2rem;
  font-weight: 700;
  color: #e8c4a0;
  margin-bottom: 1rem;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  font-family: Georgia, 'Times New Roman', serif;
  flex-shrink: 0;
}

.scripture-divider {
  width: 80px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #e8c4a0, transparent);
  margin-bottom: 1rem;
  flex-shrink: 0;
}

.scripture-text-large {
  font-size: 2.8rem;
  color: #f5f0e8;
  line-height: 1.6;
  max-width: 85%;
  font-family: Georgia, 'Times New Roman', serif;
  font-style: italic;
  text-align: center;
  padding: 1rem 2rem;
}

.scripture-no-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: rgba(255, 255, 255, 0.4);
}

.scripture-no-text ion-icon {
  font-size: 4rem;
}

.scripture-no-text span {
  font-size: 1.25rem;
}

.scripture-slide-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 3rem;
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.6);
  flex-shrink: 0;
}

.scripture-header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.scripture-page-indicator {
  background: rgba(232, 196, 160, 0.2);
  color: #e8c4a0;
  padding: 0.4rem 0.9rem;
  border-radius: 20px;
  font-size: 1rem;
  font-weight: 600;
  border: 1px solid rgba(232, 196, 160, 0.3);
}

.scripture-text-formatted {
  text-align: left;
  text-align-last: left;
}

.scripture-text-formatted :deep(.verse-number) {
  display: inline-block;
  color: #e8c4a0;
  font-weight: 700;
  font-size: 0.8em;
  vertical-align: super;
  margin-right: 0.2em;
  font-style: normal;
}

/* Slide Header */
.slide-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.slide-header-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.4);
  flex-shrink: 0;
}

.slide-parent-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.parent-title {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.subitem-counter {
  font-size: 0.9rem;
  color: var(--ion-color-primary);
  font-weight: 700;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
}

.lyrics-page-indicator {
  font-size: 1rem;
  color: white;
  font-weight: 700;
  background: var(--ion-color-primary);
  padding: 0.35rem 1rem;
  border-radius: 20px;
}

.slide-notes-bottom {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.3);
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  flex-shrink: 0;
}

.slide-notes-bottom ion-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.slide-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--ion-color-primary);
  color: white;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
}

.slide-type-badge ion-icon {
  font-size: 1.2rem;
}

.slide-number {
  font-size: 2rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
}

/* Song Header for Lyrics Mode */
.slide-song-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1.5rem 2rem;
  flex-shrink: 0;
}

.song-icon {
  font-size: 2.5rem;
  color: var(--ion-color-primary);
}

.slide-song-title {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  text-align: center;
}

/* Slide Body */
.slide-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem 4rem;
  text-align: center;
  overflow-y: auto;
}

.slide-title {
  margin: 0;
  font-size: 4rem;
  font-weight: 700;
  color: white;
  line-height: 1.2;
  max-width: 90%;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.slide-subtitle {
  margin: 1rem 0 0 0;
  font-size: 1.75rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

/* Scripture Display */
.slide-scripture {
  margin-top: 2rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  max-width: 80%;
  border-left: 4px solid var(--ion-color-primary);
}

.slide-scripture .scripture-reference {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ion-color-primary);
  margin-bottom: 1rem;
}

.slide-scripture .scripture-text {
  font-size: 1.5rem;
  color: white;
  font-style: italic;
  line-height: 1.8;
  max-height: none;
  overflow-y: visible;
}

/* Sub-items List */
.slide-subitems {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-align: left;
  max-width: 70%;
}

.subitem {
  display: flex;
  gap: 1rem;
  font-size: 1.75rem;
  color: white;
  padding: 0.5rem 0;
}

.subitem-number {
  font-weight: 700;
  color: var(--ion-color-primary);
  min-width: 2.5rem;
}

.subitem-title {
  flex: 1;
}

/* Full Lyrics Display */
.slide-lyrics-full {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 2rem;
  overflow: hidden;
  width: 100%;
}

.lyrics-text {
  font-size: 2rem;
  color: white;
  white-space: pre-line;
  line-height: 1.7;
  text-align: center;
  max-width: 90%;
}

.no-lyrics-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: rgba(255, 255, 255, 0.5);
}

.no-lyrics-message ion-icon {
  font-size: 4rem;
}

.no-lyrics-message span {
  font-size: 1.5rem;
}

/* Notes */
.slide-notes {
  margin-top: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.7);
  max-width: 70%;
  text-align: left;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.slide-notes ion-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
  margin-top: 2px;
}

/* Slide Footer */
.slide-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.3);
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.7);
  flex-shrink: 0;
}

.slide-participant, .slide-duration {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.slide-participant ion-icon, .slide-duration ion-icon {
  font-size: 1.2rem;
}

/* Presentation Controls */
.presentation-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  gap: 1rem;
  background: rgba(0, 0, 0, 0.8);
  flex-shrink: 0;
}

.presentation-controls .nav-button {
  --border-radius: 8px;
  --background: rgba(255, 255, 255, 0.15);
  --color: white;
  font-weight: 600;
}

.presentation-controls .nav-button:hover {
  --background: rgba(255, 255, 255, 0.25);
}

.slide-progress-indicator {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.5rem 0;
}

.slide-progress-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.slide-progress-dot:hover {
  background: rgba(255, 255, 255, 0.5);
  transform: scale(1.2);
}

.slide-progress-dot.active {
  background: var(--ion-color-primary);
  width: 16px;
  height: 16px;
  box-shadow: 0 0 10px var(--ion-color-primary);
}

.slide-progress-dot.viewed {
  background: rgba(255, 255, 255, 0.6);
}

.slide-progress-dot.is-lyrics {
  background: rgba(255, 255, 255, 0.25);
  width: 6px;
  height: 6px;
}

.slide-progress-dot.is-lyrics.active {
  background: var(--ion-color-primary);
  width: 10px;
  height: 10px;
}

.slide-progress-dot.is-lyrics.viewed {
  background: rgba(255, 255, 255, 0.5);
}

/* No slides state */
.no-slides {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
}

.no-slides-icon {
  font-size: 5rem;
  margin-bottom: 1.5rem;
}

.no-slides p {
  font-size: 1.5rem;
  margin: 0;
}

/* Utility classes for responsive display */
.hide-mobile {
  display: inline;
}

.show-mobile {
  display: none;
}

/* Navigation buttons */
.nav-button {
  --padding-start: 1rem;
  --padding-end: 1rem;
}

/* Responsive adjustments for presentation */
@media (max-width: 1024px) {
  .slide-title {
    font-size: 3rem;
  }

  .slide-song-title {
    font-size: 2rem;
  }

  .lyrics-text {
    font-size: 1.5rem;
  }

  .sermon-title {
    font-size: 1.8rem;
  }

  .scripture-reference-large {
    font-size: 1.8rem;
  }

  .scripture-text-large {
    font-size: 2.2rem;
    line-height: 1.5;
  }

  .subitem {
    font-size: 1.5rem;
  }
}

@media (max-width: 768px) {
  .slide-header {
    padding: 1rem 1.5rem;
  }

  .slide-type-badge {
    font-size: 0.85rem;
    padding: 0.4rem 0.8rem;
  }

  .slide-number {
    font-size: 1.5rem;
  }

  .slide-body {
    padding: 1.5rem 2rem;
  }

  .slide-title {
    font-size: 2rem;
  }

  .slide-subtitle {
    font-size: 1.25rem;
  }

  .slide-song-title {
    font-size: 1.5rem;
  }

  .song-icon {
    font-size: 1.75rem;
  }

  .lyrics-text {
    font-size: 1.2rem;
    line-height: 1.6;
  }

  .scripture-slide-header {
    padding: 1rem 1.5rem;
  }

  .scripture-badge {
    font-size: 0.9rem;
    padding: 0.4rem 0.8rem;
  }

  .scripture-slide-body {
    padding: 1.5rem 2rem;
  }

  .sermon-title {
    font-size: 1.4rem;
    margin-bottom: 0.75rem;
  }

  .scripture-reference-large {
    font-size: 1.4rem;
    margin-bottom: 0.75rem;
  }

  .scripture-divider {
    width: 60px;
    margin-bottom: 1rem;
  }

  .scripture-text-large {
    font-size: 1.5rem;
    line-height: 1.5;
    max-width: 95%;
    padding: 0.5rem 1rem;
  }

  .scripture-slide-footer {
    padding: 0.75rem 1.5rem;
    font-size: 0.95rem;
  }

  .subitem {
    font-size: 1.2rem;
  }

  .slide-footer {
    padding: 0.75rem 1.5rem;
    font-size: 0.95rem;
  }

  .presentation-controls {
    padding: 0.75rem 1rem;
  }

  .slide-progress-dot {
    width: 10px;
    height: 10px;
  }

  .slide-progress-dot.active {
    width: 14px;
    height: 14px;
  }

  .slide-counter {
    font-size: 0.85rem;
    top: 0.75rem;
    left: 0.75rem;
  }

  .presentation-close-btn {
    top: 0.5rem;
    right: 0.5rem;
  }

  .nav-button {
    --padding-start: 0.5rem;
    --padding-end: 0.5rem;
    min-width: 44px;
    flex-shrink: 0;
  }

  .hide-mobile {
    display: none;
  }

  .show-mobile {
    display: inline;
  }
}

@media (max-width: 480px) {
  .slide-title {
    font-size: 1.5rem;
  }

  .lyrics-text {
    font-size: 1rem;
  }

  .slide-subitems {
    max-width: 90%;
  }

  .subitem {
    font-size: 1rem;
    gap: 0.5rem;
  }

  .subitem-number {
    min-width: 1.5rem;
  }
}

/* Hide/Show mobile elements in presentation controls */
@media (min-width: 768px) {
  .presentation-controls .show-mobile {
    display: none !important;
  }
}

@media (max-width: 768px) {
  .presentation-controls .hide-mobile {
    display: none !important;
  }
}
</style>
