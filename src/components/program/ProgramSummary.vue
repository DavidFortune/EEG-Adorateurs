<template>
  <div class="program-summary">
    <div class="summary-stats">
      <div class="stat-box">
        <span class="stat-value">{{ itemCount }}</span>
        <span class="stat-label">Éléments</span>
      </div>
      <div class="stat-box">
        <span class="stat-value">{{ totalDuration }}</span>
        <span class="stat-label">Minutes</span>
      </div>
    </div>

    <!-- Conductor Information -->
    <div v-if="conductor" class="conductor-info">
      <div class="conductor-section">
        <ion-avatar v-if="conductor.avatar && !failedAvatars.has('conductor')" class="conductor-avatar">
          <img :src="conductor.avatar" :alt="conductor.name" @error="failedAvatars.add('conductor')" />
        </ion-avatar>
        <div v-else class="conductor-initials">
          {{ getParticipantInitials(conductor.name) }}
        </div>
        <div class="conductor-details">
          <span class="conductor-label">Dirigeant</span>
          <span class="conductor-name">{{ conductor.name }}</span>
          <span v-if="conductor.role" class="conductor-role">{{ conductor.role }}</span>
        </div>
        <ion-button v-if="isEditing" @click="$emit('editProgram')" fill="clear" size="small" color="primary" class="conductor-edit-btn">
          <ion-icon :icon="createOutline" slot="icon-only" />
        </ion-button>
      </div>
    </div>
    <div v-else-if="isEditing" class="conductor-info">
      <ion-button @click="$emit('editProgram')" fill="clear" size="small" color="primary">
        <ion-icon :icon="createOutline" slot="start" />
        Ajouter un dirigeant
      </ion-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonAvatar, IonButton, IonIcon } from '@ionic/vue';
import { createOutline } from 'ionicons/icons';
import type { ProgramParticipant } from '@/types/program';

defineProps<{
  itemCount: number;
  totalDuration: number;
  conductor: ProgramParticipant | null | undefined;
  isEditing: boolean;
  failedAvatars: Set<string>;
}>();

defineEmits<{
  editProgram: [];
}>();

const getParticipantInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};
</script>

<style scoped>
.program-summary {
  margin-bottom: 1.5rem;
}

.summary-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 1rem;
}

.stat-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 12px;
  border: 1px solid var(--ion-color-light-shade);
  border-radius: 12px;
  background: white;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--ion-color-primary);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  margin-top: 2px;
}

.conductor-edit-btn {
  margin-left: auto;
}

.conductor-info {
  border-top: 1px solid var(--ion-color-light);
  padding-top: 1rem;
  margin-top: 1rem;
}

.conductor-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.conductor-avatar {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.conductor-initials {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ion-color-primary);
  color: white;
  font-size: 14px;
  font-weight: 600;
  border-radius: 50%;
}

.conductor-details {
  display: flex;
  flex-direction: column;
}

.conductor-label {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
}

.conductor-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--ion-color-dark);
}

.conductor-role {
  font-size: 0.9rem;
  color: var(--ion-color-medium);
  font-style: italic;
}
</style>
