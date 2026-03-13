<template>
  <div class="duration-stepper">
    <div class="stepper-row">
      <ion-button fill="clear" size="small" @click="decrement" :disabled="modelValue <= 0" class="stepper-btn">
        <ion-icon :icon="removeOutline" slot="icon-only" />
      </ion-button>
      <div class="stepper-value" @click="toggleDirectEntry">
        <ion-input
          v-if="isDirectEntry"
          type="number"
          :value="modelValue"
          min="0"
          autofocus
          class="direct-input"
          @ionBlur="handleDirectEntry($event)"
          @keydown.enter="handleDirectEntry($event)"
        />
        <span v-else>{{ modelValue }}</span>
      </div>
      <ion-button fill="clear" size="small" @click="increment" class="stepper-btn">
        <ion-icon :icon="addOutline" slot="icon-only" />
      </ion-button>
    </div>
    <div class="preset-chips">
      <ion-chip
        v-for="preset in presets"
        :key="preset"
        :outline="modelValue !== preset"
        :color="modelValue === preset ? 'primary' : undefined"
        @click="$emit('update:modelValue', preset)"
      >
        {{ preset }}
      </ion-chip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonButton, IonIcon, IonChip, IonInput } from '@ionic/vue';
import { addOutline, removeOutline } from 'ionicons/icons';

const props = defineProps<{
  modelValue: number;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: number];
}>();

const presets = [5, 10, 15, 30, 45];
const isDirectEntry = ref(false);

const increment = () => {
  emit('update:modelValue', props.modelValue + 1);
};

const decrement = () => {
  if (props.modelValue > 0) {
    emit('update:modelValue', props.modelValue - 1);
  }
};

const toggleDirectEntry = () => {
  isDirectEntry.value = true;
};

const handleDirectEntry = (event: Event) => {
  const target = event.target as HTMLIonInputElement;
  const val = parseInt(target.value as string, 10);
  if (!isNaN(val) && val >= 0) {
    emit('update:modelValue', val);
  }
  isDirectEntry.value = false;
};
</script>

<style scoped>
.duration-stepper {
  padding: 8px;
  min-width: 200px;
}

.stepper-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
}

.stepper-btn {
  --padding-start: 8px;
  --padding-end: 8px;
}

.stepper-value {
  font-size: 1.5rem;
  font-weight: 700;
  min-width: 60px;
  text-align: center;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  background: var(--ion-color-light);
}

.direct-input {
  font-size: 1.5rem;
  font-weight: 700;
  --padding-start: 0;
  --padding-end: 0;
  text-align: center;
  max-width: 60px;
}

.preset-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}

.preset-chips ion-chip {
  font-size: 0.8rem;
  height: 28px;
}
</style>
