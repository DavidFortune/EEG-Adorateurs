<template>
  <ion-card class="team-card" :class="teamCardClasses">
    <div class="team-header">
      <div class="team-info">
        <div class="team-name">{{ team.name }}</div>
        <div class="team-stats">
          <span class="stat-item">
            <ion-icon :icon="peopleOutline" />
            {{ team.assigned }}/{{ team.required }} assignés
          </span>
          <span class="separator">•</span>
          <span class="stat-item">
            <ion-icon :icon="checkmarkCircleOutline" />
            {{ availableCount }} disponibles
          </span>
        </div>
      </div>

      <div class="team-status">
        <ion-badge :color="statusColor" class="status-badge">
          {{ statusLabel }}
        </ion-badge>
      </div>
    </div>

    <!-- Members List -->
    <ion-card-content class="team-content">
      <div class="members-list">
        <MemberItem
          v-for="member in team.members"
          :key="member.id"
          :member="member"
          :is-editing="true"
          @click="handleMemberClick"
        />
      </div>

      <!-- Missing Members Warning -->
      <div v-if="missingCount > 0" class="missing-members">
        <ion-icon :icon="warningOutline" color="warning" />
        <span>{{ missingCount }} membre(s) manquant(s)</span>
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IonCard, IonCardContent, IonIcon, IonBadge } from '@ionic/vue';
import {
  peopleOutline,
  checkmarkCircleOutline,
  warningOutline
} from 'ionicons/icons';
import MemberItem from './MemberItem.vue';
import type { TeamAssignment } from '@/types/scheduling';

interface Props {
  team: TeamAssignment;
  statusColor: string;
  statusLabel: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  memberClick: [memberId: string];
}>();

const teamCardClasses = computed(() => ({
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

.team-card--complete {
  border-left: 4px solid var(--ion-color-success);
}

.team-card--partial {
  border-left: 4px solid var(--ion-color-warning);
}

.team-card--empty {
  border-left: 4px solid var(--ion-color-danger);
}

.team-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 16px 0 16px;
}

.team-info {
  flex: 1;
}

.team-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--ion-color-dark);
  margin-bottom: 8px;
}

.team-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--ion-color-medium);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-item ion-icon {
  font-size: 0.9rem;
}

.separator {
  opacity: 0.5;
}

.team-status {
  margin-left: 12px;
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 4px 8px;
}

.team-content {
  padding: 16px;
  padding-top: 0;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.missing-members {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px 12px;
  background: var(--ion-color-warning-tint);
  border-radius: 8px;
  font-size: 0.85rem;
  color: var(--ion-color-warning-shade);
}

.missing-members ion-icon {
  font-size: 1rem;
}

/* Custom member styling for TeamSchedulingView - matching DisponibilitesPage */
/* ASSIGNED takes priority over all other states */
:deep(.member-item--assigned) {
  background: #ECFDF5 !important;
  border-color: #10B981 !important;
  border-width: 2px !important;
  opacity: 1 !important;
}

/* Only apply these styles when NOT assigned */
:deep(.member-item--available:not(.member-item--assigned)) {
  background: #FFFFFF !important;
  border-color: #10B981 !important;
  border-width: 2px !important;
}

:deep(.member-item--unavailable:not(.member-item--assigned)) {
  background: #FFFFFF !important;
  border-color: #EF4444 !important;
  border-width: 2px !important;
  opacity: 1 !important;
}

:deep(.member-item--no-response:not(.member-item--assigned)) {
  background: #FFFFFF !important;
  border-color: #E5E7EB !important;
  border-width: 2px !important;
  opacity: 1 !important;
}

:deep(.member-item--maybe:not(.member-item--assigned)) {
  background: #FFFFFF !important;
  border-color: var(--ion-color-warning) !important;
  border-width: 2px !important;
}
</style>