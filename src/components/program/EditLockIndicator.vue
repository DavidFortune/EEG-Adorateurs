<template>
  <div class="lock-indicator">
    <div class="lock-indicator-content">
      <ion-icon :icon="lockClosedOutline" class="lock-indicator-icon" />
      <div class="lock-indicator-text">
        <strong>{{ lockHolder.userName }}</strong> est en train de modifier ce programme
      </div>
    </div>
    <ion-button v-if="isAdmin" @click="$emit('forceEnter')" fill="outline" color="warning" size="small">
      <ion-icon :icon="handRightOutline" slot="start" />
      Prendre le contrôle
    </ion-button>
  </div>
</template>

<script setup lang="ts">
import { IonButton, IonIcon } from '@ionic/vue';
import { lockClosedOutline, handRightOutline } from 'ionicons/icons';

defineProps<{
  lockHolder: { userName: string; expiresAt: Date };
  isAdmin: boolean;
}>();

defineEmits<{
  forceEnter: [];
}>();
</script>

<style scoped>
.lock-indicator {
  margin: 12px 16px;
  padding: 16px;
  background: rgba(var(--ion-color-warning-rgb), 0.1);
  border: 1px solid rgba(var(--ion-color-warning-rgb), 0.3);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.lock-indicator-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.lock-indicator-icon {
  font-size: 24px;
  color: var(--ion-color-warning);
  flex-shrink: 0;
}

.lock-indicator-text {
  font-size: 0.9rem;
  color: var(--ion-color-dark);
}
</style>
