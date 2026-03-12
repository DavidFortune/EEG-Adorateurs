<template>
  <div class="draft-controls">
    <div class="draft-notice">
      <div class="draft-notice-content">
        <ion-icon :icon="lockClosedOutline" class="draft-notice-icon" />
        <div class="draft-notice-text">
          <strong>Mode brouillon</strong>
          <span>Ce programme n'est pas encore visible pour les membres.</span>
        </div>
      </div>
      <div class="draft-actions">
        <ion-button @click="$emit('openViewers')" fill="outline" color="medium" size="small">
          Gérer les accès ({{ viewerCount }})
        </ion-button>
        <ion-button @click="$emit('publish')" fill="solid" color="dark" size="small">
          Publier le programme
        </ion-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonButton, IonIcon } from '@ionic/vue';
import { lockClosedOutline } from 'ionicons/icons';

defineProps<{
  viewerCount: number;
}>();

defineEmits<{
  openViewers: [];
  publish: [];
}>();
</script>

<style scoped>
.draft-controls {
  padding: 0 1rem;
  margin-bottom: 1rem;
}

.draft-notice {
  background: rgba(var(--ion-color-warning-rgb), 0.1);
  border: 1px solid rgba(var(--ion-color-warning-rgb), 0.3);
  border-radius: 12px;
  padding: 16px;
}

.draft-notice-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.draft-notice-icon {
  font-size: 24px;
  color: var(--ion-color-warning);
  flex-shrink: 0;
  margin-top: 2px;
}

.draft-notice-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.draft-notice-text strong {
  font-size: 0.95rem;
  color: var(--ion-color-dark);
}

.draft-notice-text span {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
}

.draft-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
