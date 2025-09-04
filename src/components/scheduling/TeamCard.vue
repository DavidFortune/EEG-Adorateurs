<template>
  <ion-card class="team-card" :class="teamCardClasses">
    <!-- Team Header -->
    <div class="team-header">
      <div class="team-info">
        <div class="team-name">
          <ion-icon :icon="peopleOutline" class="team-icon" />
          {{ team.name }}
        </div>
        <div class="team-stats">
          👥 {{ team.assigned }}/{{ team.required }} assignés • 
          {{ availableCount }} disponibles
          <ion-badge 
            :color="statusColor" 
            class="team-status-badge"
          >
            {{ statusLabel }}
          </ion-badge>
        </div>
      </div>
      
      <div class="team-actions">
        <ion-button 
          v-if="!isEditing"
          @click="$emit('enterEdit')"
          fill="clear" 
          size="small"
          class="edit-button"
        >
          <ion-icon :icon="createOutline" />
        </ion-button>
        
        <ion-button 
          v-if="isEditing"
          @click="$emit('save')"
          fill="clear" 
          size="small"
          color="success"
          class="save-button"
        >
          <ion-icon :icon="saveOutline" />
        </ion-button>
      </div>
    </div>

    <!-- Edit Mode Indicator -->
    <div v-if="isEditing" class="edit-mode-indicator">
      <ion-badge color="danger" class="edit-badge">
        Mode édition
      </ion-badge>
      <div class="edit-instructions">
        Cliquez sur un membre disponible pour l'assigner/désassigner
      </div>
    </div>

    <!-- Members List -->
    <ion-card-content class="team-content">
      <div class="members-list">
        <MemberItem
          v-for="member in team.members"
          :key="member.id"
          :member="member"
          :is-editing="isEditing"
          @click="handleMemberClick"
        />
      </div>
      
      <!-- Missing Members Warning -->
      <div v-if="missingCount > 0" class="missing-members">
        <ion-icon :icon="warningOutline" class="warning-icon" />
        <span>{{ missingCount }} personne{{ missingCount > 1 ? 's' : '' }} manquante{{ missingCount > 1 ? 's' : '' }}</span>
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { 
  IonCard, 
  IonCardContent, 
  IonButton, 
  IonIcon, 
  IonBadge 
} from '@ionic/vue';
import { 
  peopleOutline, 
  createOutline, 
  saveOutline, 
  warningOutline 
} from 'ionicons/icons';
import type { TeamAssignment } from '@/types/scheduling';
import MemberItem from './MemberItem.vue';

interface Props {
  team: TeamAssignment;
  isEditing: boolean;
  statusColor: string;
  statusLabel: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  enterEdit: [];
  save: [];
  memberClick: [memberId: string];
}>();

const teamCardClasses = computed(() => ({
  'team-card--editing': props.isEditing,
  'team-card--complete': props.team.assigned >= props.team.required,
  'team-card--partial': props.team.assigned > 0 && props.team.assigned < props.team.required,
  'team-card--empty': props.team.assigned === 0
}));

const availableCount = computed(() => 
  props.team.members.filter(m => m.availability === 'available').length
);

const missingCount = computed(() => 
  Math.max(0, props.team.required - props.team.assigned)
);

function handleMemberClick(memberId: string) {
  emit('memberClick', memberId);
}
</script>

<style scoped>
.team-card {
  --border-radius: 16px;
  margin-bottom: 16px;
  overflow: hidden;
}

.team-card--editing {
  border: 2px solid var(--ion-color-danger);
  box-shadow: 0 4px 16px rgba(220, 38, 38, 0.1);
}

/* Removed left border styling for cleaner look */

.team-header {
  padding: 16px;
  background: var(--ion-color-light-tint);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid var(--ion-color-light-shade);
}

.team-info {
  flex: 1;
}

.team-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 1.125rem;
  color: var(--ion-color-dark);
  margin-bottom: 6px;
}

.team-icon {
  font-size: 1.25rem;
  color: var(--ion-color-primary);
}

.team-stats {
  font-size: 0.875rem;
  color: var(--ion-color-medium);
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.team-status-badge {
  font-size: 0.75rem;
  --padding-start: 6px;
  --padding-end: 6px;
  --padding-top: 2px;
  --padding-bottom: 2px;
}

.team-actions {
  margin-left: 16px;
}

.edit-button,
.save-button {
  --padding-start: 8px;
  --padding-end: 8px;
  --padding-top: 8px;
  --padding-bottom: 8px;
  --border-radius: 8px;
}

.edit-mode-indicator {
  padding: 12px 16px;
  background: var(--ion-color-danger-tint);
  border-bottom: 1px solid var(--ion-color-danger-shade);
}

.edit-badge {
  display: inline-block;
  margin-bottom: 4px;
  font-size: 0.75rem;
}

.edit-instructions {
  font-size: 0.875rem;
  color: var(--ion-color-danger-shade);
  font-style: italic;
}

.team-content {
  padding: 16px !important;
}

.members-list {
  margin-bottom: 12px;
}

.missing-members {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--ion-color-warning-tint);
  border-radius: 8px;
  color: var(--ion-color-warning-shade);
  font-weight: 500;
  font-size: 0.875rem;
}

.warning-icon {
  font-size: 1.25rem;
  color: var(--ion-color-warning);
}
</style>