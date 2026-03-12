<template>
  <div class="edit-mode-controls">
    <!-- Not editing: Enter edit mode -->
    <ion-button v-if="!isEditing" @click="$emit('enter')" fill="solid" color="primary" expand="block" class="enter-edit-btn">
      <ion-icon :icon="pencilOutline" slot="start" />
      Modifier le programme
    </ion-button>
    <!-- Editing: Timer + Finish button -->
    <div v-else class="editing-controls">
      <ion-button
        fill="outline"
        :color="isTimerWarning ? 'warning' : 'medium'"
        size="small"
        class="countdown-timer-btn"
        :class="{ 'timer-warning': isTimerWarning }"
        @click="$emit('extend')"
      >
        <ion-icon :icon="timerOutline" slot="start" />
        {{ formattedLockTime }}
      </ion-button>
      <ion-button @click="$emit('exit')" fill="solid" color="success" expand="block" class="finish-edit-btn">
        <ion-icon :icon="checkmarkOutline" slot="start" />
        Terminer les modifications
      </ion-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonButton, IonIcon } from '@ionic/vue';
import { pencilOutline, timerOutline, checkmarkOutline } from 'ionicons/icons';

defineProps<{
  isEditing: boolean;
  isTimerWarning: boolean;
  formattedLockTime: string;
}>();

defineEmits<{
  enter: [];
  exit: [];
  extend: [];
}>();
</script>

<style scoped>
.edit-mode-controls {
  margin-bottom: 1rem;
}

.enter-edit-btn {
  --border-radius: 12px;
  font-weight: 600;
}

.editing-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.countdown-timer-btn {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  font-size: 0.8rem;
  --border-radius: 12px;
  flex-shrink: 0;
}

.countdown-timer-btn.timer-warning {
  animation: pulse-warning 1s ease-in-out infinite;
}

@keyframes pulse-warning {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.finish-edit-btn {
  --border-radius: 12px;
  font-weight: 600;
  flex: 1;
}
</style>
