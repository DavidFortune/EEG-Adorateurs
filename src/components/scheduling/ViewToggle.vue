<template>
  <div class="view-toggle-container">
    <ion-segment 
      :value="modelValue" 
      @ion-change="handleChange"
      class="view-toggle"
    >
      <ion-segment-button value="teams">
        <ion-label>Par équipes</ion-label>
      </ion-segment-button>
      <ion-segment-button value="overview">
        <ion-label>Vue d'ensemble</ion-label>
      </ion-segment-button>
    </ion-segment>
  </div>
</template>

<script setup lang="ts">
import { IonSegment, IonSegmentButton, IonLabel } from '@ionic/vue';
import type { ViewMode } from '@/types/scheduling';

interface Props {
  modelValue: ViewMode;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: ViewMode];
}>();

function handleChange(event: CustomEvent) {
  emit('update:modelValue', event.detail.value as ViewMode);
}
</script>

<style scoped>
.view-toggle-container {
  padding: 0 16px 16px 16px;
}

.view-toggle {
  --background: var(--ion-color-light);
  --indicator-color: white;
  --indicator-color-checked: white;
  border-radius: 12px;
}

ion-segment-button {
  --color: var(--ion-color-medium);
  --color-checked: var(--ion-color-dark);
  --indicator-box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-weight: 500;
}
</style>