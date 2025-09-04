<template>
  <div class="team-filter-container" v-if="show">
    <ion-item class="team-filter">
      <ion-select
        :value="modelValue"
        @selection-change="handleChange"
        placeholder="Sélectionner une équipe"
        interface="popover"
        class="team-select"
      >
        <ion-select-option 
          v-for="option in options" 
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </ion-select-option>
      </ion-select>
      <ion-icon :icon="chevronDownOutline" slot="end" />
    </ion-item>
  </div>
</template>

<script setup lang="ts">
import { IonItem, IonSelect, IonSelectOption, IonIcon } from '@ionic/vue';
import { chevronDownOutline } from 'ionicons/icons';

interface TeamOption {
  value: string;
  label: string;
}

interface Props {
  modelValue: string;
  options: TeamOption[];
  show: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

function handleChange(event: CustomEvent) {
  emit('update:modelValue', event.detail.value);
}
</script>

<style scoped>
.team-filter-container {
  padding: 0 16px 16px 16px;
}

.team-filter {
  --background: white;
  --border-radius: 12px;
  --padding-start: 16px;
  --padding-end: 16px;
  --inner-padding-end: 0;
  border: 1px solid var(--ion-color-light-shade);
}

.team-select {
  --placeholder-color: var(--ion-color-medium);
  --color: var(--ion-color-dark);
  font-weight: 500;
}

ion-icon {
  color: var(--ion-color-medium);
  font-size: 1.2rem;
}
</style>