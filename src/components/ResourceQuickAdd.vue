<template>
  <div class="resource-quick-add">
    <!-- Resource Linked State with Swipe Actions -->
    <div v-if="resource" class="swipe-container" :class="{ 'swiping': isSwiping }">
      <!-- Swipe Actions Background -->
      <div class="swipe-actions-bg">
        <div class="swipe-action swipe-action-left" :class="{ 'active': swipeDirection === 'right' }">
          <ion-icon :icon="swapHorizontalOutline" />
          <span>Remplacer</span>
        </div>
        <div class="swipe-action swipe-action-right" :class="{ 'active': swipeDirection === 'left' }">
          <ion-icon :icon="trashOutline" />
          <span>Supprimer</span>
        </div>
      </div>

      <!-- Resource Chip (swipeable) -->
      <div
        class="resource-chip"
        :style="{ transform: `translateX(${swipeOffset}px)` }"
        @click="handleChipClick"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <span class="resource-icon">{{ getResourceIcon(resource) }}</span>
        <div class="resource-info">
          <span class="resource-title">{{ resource.title }}</span>
          <span v-if="collectionSymbol" class="resource-badge">[{{ collectionSymbol }}]</span>
          <span class="resource-meta">{{ getResourceMeta(resource) }}</span>
        </div>
        <button
          v-if="editable"
          class="remove-btn"
          @click.stop="handleRemove"
          aria-label="Supprimer la ressource"
        >
          <ion-icon :icon="closeOutline" />
        </button>
      </div>
    </div>

    <!-- No Resource State -->
    <button
      v-else-if="editable"
      class="add-resource-btn"
      @click="$emit('add')"
    >
      <ion-icon :icon="addOutline" />
      <span>Ajouter une ressource</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { IonIcon, alertController } from '@ionic/vue';
import { addOutline, closeOutline, trashOutline, swapHorizontalOutline } from 'ionicons/icons';
import { ResourceType, type Resource, type ResourceCollection } from '@/types/resource';

interface Props {
  resource: Resource | null;
  collection?: ResourceCollection | null;
  editable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  collection: null,
  editable: false
});

const emit = defineEmits<{
  add: [];
  remove: [];
  replace: [];
  preview: [resource: Resource];
}>();

// Swipe state
const isSwiping = ref(false);
const swipeOffset = ref(0);
const swipeDirection = ref<'left' | 'right' | null>(null);
const touchStartX = ref(0);
const touchStartY = ref(0);
const isHorizontalSwipe = ref<boolean | null>(null);

const SWIPE_THRESHOLD = 80; // Minimum distance to trigger action
const MAX_SWIPE = 100; // Maximum swipe distance

const collectionSymbol = computed(() => {
  return props.collection?.symbol || null;
});

const getResourceIcon = (resource: Resource): string => {
  if (!resource.contents || resource.contents.length === 0) return '📄';

  const types = resource.contents.map(c => c.type);
  if (types.includes(ResourceType.LYRICS)) return '🎵';
  if (types.includes(ResourceType.YOUTUBE)) return '▶️';
  if (types.includes(ResourceType.VIDEO)) return '🎥';
  if (types.includes(ResourceType.AUDIO)) return '🔊';
  if (types.includes(ResourceType.MUSIC_SHEET)) return '🎼';
  return '📄';
};

const getResourceMeta = (resource: Resource): string => {
  if (!resource.contents || resource.contents.length === 0) return '';

  const typeNames: Record<string, string> = {
    lyrics: 'Paroles',
    video: 'Vidéo',
    audio: 'Audio',
    music_sheet: 'Partition',
    youtube: 'YouTube',
    spotify: 'Spotify',
    file: 'Fichier'
  };

  return resource.contents
    .map(c => typeNames[c.type])
    .filter(Boolean)
    .join(' · ');
};

// Touch handlers for swipe
const handleTouchStart = (e: TouchEvent) => {
  if (!props.editable) return;

  touchStartX.value = e.touches[0].clientX;
  touchStartY.value = e.touches[0].clientY;
  isHorizontalSwipe.value = null;
  isSwiping.value = true;
};

const handleTouchMove = (e: TouchEvent) => {
  if (!props.editable || !isSwiping.value) return;

  const currentX = e.touches[0].clientX;
  const currentY = e.touches[0].clientY;
  const diffX = currentX - touchStartX.value;
  const diffY = currentY - touchStartY.value;

  // Determine swipe direction on first significant move
  if (isHorizontalSwipe.value === null) {
    if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
      isHorizontalSwipe.value = Math.abs(diffX) > Math.abs(diffY);
    }
    return;
  }

  // Only handle horizontal swipes
  if (!isHorizontalSwipe.value) {
    isSwiping.value = false;
    return;
  }

  // Prevent vertical scroll while swiping horizontally
  e.preventDefault();

  // Clamp swipe offset
  const clampedOffset = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, diffX));
  swipeOffset.value = clampedOffset;

  // Update direction indicator
  if (clampedOffset < -SWIPE_THRESHOLD / 2) {
    swipeDirection.value = 'left';
  } else if (clampedOffset > SWIPE_THRESHOLD / 2) {
    swipeDirection.value = 'right';
  } else {
    swipeDirection.value = null;
  }
};

const handleTouchEnd = () => {
  if (!props.editable) return;

  const offset = swipeOffset.value;

  // Check if swipe threshold was met
  if (offset < -SWIPE_THRESHOLD) {
    // Swiped left - remove
    triggerHapticFeedback();
    handleRemove();
  } else if (offset > SWIPE_THRESHOLD) {
    // Swiped right - replace
    triggerHapticFeedback();
    emit('add'); // Reuse add to open selector for replacement
  }

  // Reset swipe state
  swipeOffset.value = 0;
  swipeDirection.value = null;
  isSwiping.value = false;
  isHorizontalSwipe.value = null;
};

const handleChipClick = () => {
  // Only trigger preview if not swiping
  if (!isSwiping.value && swipeOffset.value === 0 && props.resource) {
    emit('preview', props.resource);
  }
};

const triggerHapticFeedback = () => {
  // Use Capacitor Haptics if available
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
};

const handleRemove = async () => {
  const alert = await alertController.create({
    header: 'Supprimer la ressource',
    message: 'Voulez-vous vraiment supprimer cette ressource de l\'élément ?',
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel'
      },
      {
        text: 'Supprimer',
        role: 'destructive',
        handler: () => {
          emit('remove');
        }
      }
    ]
  });
  await alert.present();
};
</script>

<style scoped>
.resource-quick-add {
  margin-top: 8px;
}

/* Add Resource Button */
.add-resource-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  background: var(--ion-color-primary-tint);
  color: var(--ion-color-primary);
  border: 1px dashed var(--ion-color-primary);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-resource-btn:hover {
  background: var(--ion-color-primary);
  color: white;
  border-style: solid;
}

.add-resource-btn:active {
  transform: scale(0.98);
}

.add-resource-btn ion-icon {
  font-size: 18px;
}

/* Swipe Container */
.swipe-container {
  position: relative;
  overflow: hidden;
  border-radius: 10px;
}

/* Swipe Actions Background */
.swipe-actions-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  border-radius: 10px;
  overflow: hidden;
}

.swipe-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 16px;
  color: white;
  font-size: 12px;
  font-weight: 600;
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.swipe-action.active {
  opacity: 1;
}

.swipe-action ion-icon {
  font-size: 18px;
}

.swipe-action-left {
  background: var(--ion-color-primary);
  justify-content: flex-start;
  width: 50%;
}

.swipe-action-right {
  background: var(--ion-color-danger);
  justify-content: flex-end;
  width: 50%;
}

/* Resource Chip */
.resource-chip {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--ion-color-light);
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.1s ease, background-color 0.2s ease;
  z-index: 1;
}

.swipe-container:not(.swiping) .resource-chip {
  transition: transform 0.3s ease, background-color 0.2s ease;
}

.resource-chip:hover {
  background: var(--ion-color-light-shade);
}

.resource-chip:active {
  transform: scale(0.99);
}

.resource-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.resource-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.resource-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--ion-color-dark);
}

.resource-badge {
  font-size: 11px;
  font-weight: 600;
  color: var(--ion-color-primary);
  background: var(--ion-color-primary-tint);
  padding: 2px 6px;
  border-radius: 4px;
}

.resource-meta {
  font-size: 11px;
  color: var(--ion-color-medium);
  width: 100%;
}

/* Remove Button */
.remove-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ion-color-danger);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.remove-btn:hover {
  background: var(--ion-color-danger-shade);
  transform: scale(1.1);
}

.remove-btn:active {
  transform: scale(0.95);
}

.remove-btn ion-icon {
  font-size: 16px;
}

/* Mobile optimizations */
@media (max-width: 576px) {
  .add-resource-btn {
    padding: 14px 16px;
  }

  .resource-chip {
    padding: 12px 14px;
  }

  .remove-btn {
    width: 32px;
    height: 32px;
  }

  .swipe-action span {
    display: none; /* Hide text on mobile, show only icon */
  }
}
</style>
