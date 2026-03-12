<template>
  <ion-modal :is-open="isOpen" @ionModalDidDismiss="handleClose" class="youtube-playlist-modal fullscreen-modal">
    <ion-header>
      <ion-toolbar>
        <ion-title>
          <ion-icon :icon="logoYoutube" style="vertical-align: middle; margin-right: 0.5rem;" />
          Playlist YouTube
        </ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleClose">
            <ion-icon :icon="closeOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="fullscreen-content">
      <div class="youtube-player-container">
        <!-- Main Video Player -->
        <div v-if="videos.length > 0" class="main-player-section">
          <div class="current-video-info">
            <div class="video-counter">
              Vidéo {{ currentVideoIndex + 1 }} / {{ videos.length }}
            </div>
            <h2 class="current-video-title">{{ videos[currentVideoIndex].title }}</h2>
            <p v-if="videos[currentVideoIndex].subtitle" class="current-video-subtitle">
              {{ videos[currentVideoIndex].subtitle }}
            </p>
          </div>

          <div
            class="main-video-wrapper"
            @touchstart="handleTouchStart"
            @touchmove="handleTouchMove"
            @touchend="handleTouchEnd"
          >
            <iframe
              :id="`youtube-player-${currentVideoIndex}`"
              :key="currentVideoIndex"
              :src="getAutoplayEmbedUrl(videos[currentVideoIndex].embedUrl)"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowfullscreen
              class="main-video-iframe"
            ></iframe>
            <div v-if="showPlayPrompt" class="play-prompt-overlay" @click="dismissPlayPrompt">
              <div class="play-prompt-content">
                <ion-icon :icon="playCircleOutline" class="play-prompt-icon" />
                <p class="play-prompt-text">Appuyez sur la vidéo pour démarrer la lecture</p>
              </div>
            </div>
          </div>

          <!-- Player Controls -->
          <div class="player-controls">
            <ion-button
              @click="previousVideo"
              :disabled="currentVideoIndex === 0"
              fill="solid"
              color="danger"
              class="nav-button"
            >
              <ion-icon :icon="playBackOutline" slot="start" class="hide-mobile" />
              <ion-icon :icon="playBackOutline" slot="icon-only" class="show-mobile" />
              <span class="hide-mobile">Précédent</span>
            </ion-button>

            <div class="progress-indicator">
              <div
                v-for="(video, index) in videos"
                :key="index"
                :class="['progress-dot', { 'active': index === currentVideoIndex, 'played': index < currentVideoIndex }]"
                @click="goToVideo(index)"
              ></div>
            </div>

            <ion-button
              @click="nextVideo"
              :disabled="currentVideoIndex === videos.length - 1"
              fill="solid"
              color="danger"
              class="nav-button"
            >
              <span class="hide-mobile">Suivant</span>
              <ion-icon :icon="playForwardOutline" slot="icon-only" class="show-mobile" />
              <ion-icon :icon="playForwardOutline" slot="end" class="hide-mobile" />
            </ion-button>
          </div>
        </div>

        <!-- Playlist Queue -->
        <div class="playlist-queue">
          <h3 class="queue-title">File d'attente ({{ videos.length }})</h3>
          <div class="queue-list">
            <div
              v-for="(video, index) in videos"
              :key="index"
              :class="['queue-item', { 'active': index === currentVideoIndex, 'played': index < currentVideoIndex }]"
              @click="goToVideo(index)"
            >
              <div class="queue-item-number">{{ index + 1 }}</div>
              <div class="queue-item-info">
                <div class="queue-item-title">{{ video.title }}</div>
                <div class="queue-item-subtitle-group">
                  <div v-if="video.subtitle" class="queue-item-subtitle">{{ video.subtitle }}</div>
                  <div v-if="video.programItemNumber && video.programItemTitle" class="queue-item-context">
                    #{{ video.programItemNumber }} - {{ video.programItemTitle }}
                  </div>
                </div>
              </div>
              <ion-icon
                v-if="index === currentVideoIndex"
                :icon="playCircleOutline"
                class="queue-item-playing"
              />
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
} from '@ionic/vue';
import {
  closeOutline,
  playCircleOutline,
  playBackOutline,
  playForwardOutline,
  logoYoutube,
} from 'ionicons/icons';

interface YouTubeVideo {
  title: string;
  subtitle?: string;
  embedUrl: string;
  programItemNumber?: number;
  programItemTitle?: string;
}

const props = defineProps<{
  isOpen: boolean;
  videos: YouTubeVideo[];
}>();

const emit = defineEmits<{
  close: [];
}>();

// State
const currentVideoIndex = ref(0);
const showPlayPrompt = ref(false);

// Touch/Swipe state
const touchStartX = ref(0);
const touchEndX = ref(0);
const touchStartY = ref(0);
const touchEndY = ref(0);

// Close handler
const handleClose = () => {
  currentVideoIndex.value = 0;
  showPlayPrompt.value = false;
  emit('close');
};

// Video navigation
const nextVideo = () => {
  if (currentVideoIndex.value < props.videos.length - 1) {
    currentVideoIndex.value++;
    showPlayPrompt.value = false;
  }
};

const previousVideo = () => {
  if (currentVideoIndex.value > 0) {
    currentVideoIndex.value--;
    showPlayPrompt.value = false;
  }
};

const goToVideo = (index: number) => {
  currentVideoIndex.value = index;
  showPlayPrompt.value = false;
};

const dismissPlayPrompt = () => {
  showPlayPrompt.value = false;
};

const getAutoplayEmbedUrl = (embedUrl: string): string => {
  // Add autoplay parameter and enable JS API to YouTube embed URL
  const separator = embedUrl.includes('?') ? '&' : '?';
  return `${embedUrl}${separator}autoplay=1&rel=0&enablejsapi=1`;
};

// Touch/Swipe handlers
const handleTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.touches[0].clientX;
  touchStartY.value = e.touches[0].clientY;
};

const handleTouchMove = (e: TouchEvent) => {
  touchEndX.value = e.touches[0].clientX;
  touchEndY.value = e.touches[0].clientY;
};

const handleTouchEnd = () => {
  const deltaX = touchStartX.value - touchEndX.value;
  const deltaY = Math.abs(touchStartY.value - touchEndY.value);

  // Minimum swipe distance (in pixels)
  const minSwipeDistance = 50;

  // Check if horizontal swipe is dominant (not vertical scroll)
  if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaX) > deltaY * 2) {
    if (deltaX > 0) {
      // Swiped left - next video
      if (currentVideoIndex.value < props.videos.length - 1) {
        nextVideo();
      }
    } else {
      // Swiped right - previous video
      if (currentVideoIndex.value > 0) {
        previousVideo();
      }
    }
  }

  // Reset values
  touchStartX.value = 0;
  touchEndX.value = 0;
  touchStartY.value = 0;
  touchEndY.value = 0;
};

// YouTube Player API integration for auto-advance
const setupYouTubeAPIListener = () => {
  // Load YouTube IFrame API if not already loaded
  if (!(window as any).YT) {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Setup callback for when API is ready
    (window as any).onYouTubeIframeAPIReady = () => {
      initYouTubePlayer();
    };
  } else {
    initYouTubePlayer();
  }
};

const initYouTubePlayer = () => {
  // Wait for iframe to be available
  setTimeout(() => {
    const iframe = document.querySelector('.main-video-iframe') as HTMLIFrameElement;
    if (!iframe || !iframe.contentWindow) return;

    // Initialize YouTube player with event listeners
    new (window as any).YT.Player(iframe, {
      events: {
        onStateChange: (event: any) => {
          // YT.PlayerState.ENDED = 0
          if (event.data === 0) {
            // Video ended, play next
            if (currentVideoIndex.value < props.videos.length - 1) {
              nextVideo();
            }
          }
        }
      }
    });
  }, 1000);
};

// Watch for video changes to reinitialize player
watch(currentVideoIndex, () => {
  if (props.isOpen) {
    initYouTubePlayer();
  }
});

// Setup API when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen && props.videos.length > 0) {
    setupYouTubeAPIListener();

    // Show play prompt on mobile after a short delay
    setTimeout(() => {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        showPlayPrompt.value = true;
      }
    }, 500);
  }
});
</script>

<style scoped>
/* Fullscreen Modal */
.fullscreen-modal {
  --width: 100%;
  --height: 100%;
  --border-radius: 0;
}

.fullscreen-content {
  --padding-top: 0;
  --padding-bottom: 0;
  --padding-start: 0;
  --padding-end: 0;
}

.youtube-playlist-modal {
  --width: 100%;
  --height: 100%;
  --border-radius: 0;
}

.youtube-player-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #000;
}

/* Main Player Section */
.main-player-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #000;
}

.current-video-info {
  padding: 1rem;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.7));
  color: white;
}

.video-counter {
  font-size: 0.85rem;
  color: var(--ion-color-danger);
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.current-video-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  line-height: 1.3;
}

.current-video-subtitle {
  margin: 0.25rem 0 0 0;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
}

.main-video-wrapper {
  flex: 1;
  position: relative;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-video-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.play-prompt-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  cursor: pointer;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.play-prompt-content {
  text-align: center;
  color: white;
  padding: 2rem;
}

.play-prompt-icon {
  font-size: 4rem;
  color: #EF4444;
  margin-bottom: 1rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.play-prompt-text {
  font-size: 1.1rem;
  font-weight: 500;
  margin: 0;
  line-height: 1.5;
}

/* Player Controls */
.player-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.7));
  gap: 1rem;
}

.progress-indicator {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.5rem 0;
}

.progress-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.progress-dot:hover {
  background: rgba(255, 255, 255, 0.5);
  transform: scale(1.2);
}

.progress-dot.active {
  background: var(--ion-color-danger);
  width: 16px;
  height: 16px;
}

.progress-dot.played {
  background: rgba(255, 255, 255, 0.6);
}

/* Playlist Queue */
.playlist-queue {
  background: var(--ion-color-light);
  border-top: 2px solid var(--ion-color-medium);
  max-height: 40%;
  overflow-y: auto;
}

.queue-title {
  margin: 0;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--ion-color-dark);
  background: white;
  border-bottom: 1px solid var(--ion-color-light-shade);
  sticky: top;
  top: 0;
  z-index: 1;
}

.queue-list {
  display: flex;
  flex-direction: column;
}

.queue-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: white;
  border-bottom: 1px solid var(--ion-color-light);
  cursor: pointer;
  transition: all 0.2s ease;
}

.queue-item:hover {
  background: var(--ion-color-light-tint);
}

.queue-item.active {
  background: var(--ion-color-danger);
  border-left: 4px solid var(--ion-color-danger-shade);
}

.queue-item.played {
  opacity: 0.6;
}

.queue-item-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--ion-color-light);
  color: var(--ion-color-dark);
  font-weight: 600;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.queue-item.active .queue-item-number {
  background: rgba(255, 255, 255, 0.3);
  color: white;
}

.queue-item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.queue-item-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--ion-color-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.queue-item.active .queue-item-title {
  color: white;
}

.queue-item-subtitle-group {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.queue-item-subtitle {
  font-size: 0.8rem;
  color: var(--ion-color-medium-shade);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.queue-item.active .queue-item-subtitle {
  color: rgba(255, 255, 255, 0.85);
}

.queue-item-context {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
  font-style: italic;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.queue-item.active .queue-item-context {
  color: rgba(255, 255, 255, 0.7);
}

.queue-item-playing {
  font-size: 1.5rem;
  color: white;
  flex-shrink: 0;
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

/* Responsive adjustments */
@media (max-width: 768px) {
  .current-video-title {
    font-size: 1.2rem;
  }

  .player-controls {
    flex-direction: row;
    gap: 0.5rem;
    padding: 0.75rem;
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

  .progress-indicator {
    flex: 1;
    gap: 0.35rem;
    padding: 0;
  }

  .progress-dot {
    width: 10px;
    height: 10px;
  }

  .progress-dot.active {
    width: 14px;
    height: 14px;
  }

  .playlist-queue {
    max-height: 50%;
  }
}
</style>
