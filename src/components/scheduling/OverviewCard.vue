<template>
  <ion-card class="overview-card">
    <!-- Service Header -->
    <div class="service-header">
      <div class="service-info">
        <h2 class="service-title">{{ event.title }}</h2>
        <div class="service-datetime">
          {{ event.date }} à {{ event.time }}
        </div>
        <ion-badge 
          :color="getStatusColor(event.status)" 
          class="service-status"
        >
          {{ event.status }}
        </ion-badge>
      </div>
    </div>

    <ion-card-content class="overview-content">
      <!-- Global Progress -->
      <div class="global-progress">
        <div class="progress-header">
          <div class="progress-text">
            <div class="progress-bar-container">
              <div class="progress-bar">
                <div 
                  class="progress-fill"
                  :style="{ width: `${globalStats.completionPercentage}%` }"
                  :class="getProgressClass(globalStats.completionPercentage)"
                ></div>
              </div>
              <span class="progress-percentage">
                {{ globalStats.completionPercentage }}% complété ({{ globalStats.totalAssigned }}/{{ globalStats.totalRequired }})
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Teams Status -->
      <div class="teams-status">
        <h3 class="status-title">État des équipes:</h3>
        <div class="teams-list">
          <div 
            v-for="team in teams" 
            :key="team.id"
            class="team-status-row"
          >
            <div class="team-name">{{ team.name }}</div>
            <div class="team-progress">
              <span class="team-count">{{ team.assigned }}/{{ team.required }}</span>
              <div class="mini-progress-bar">
                <div 
                  class="mini-progress-fill"
                  :style="{ width: `${getTeamProgressPercentage(team)}%` }"
                  :class="getTeamProgressClass(team)"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <ion-button 
          v-if="event.status !== 'confirmé'"
          @click="$emit('confirm')"
          expand="block" 
          color="success"
          class="action-button"
          :disabled="!canConfirm"
        >
          <ion-icon :icon="checkmarkOutline" slot="start" />
          Confirmer le planning
        </ion-button>
        
        <div class="secondary-buttons">
          <ion-button 
            @click="$emit('saveDraft')"
            fill="outline" 
            color="primary"
            size="default"
            class="secondary-button"
          >
            <ion-icon :icon="saveOutline" slot="start" />
            Sauver brouillon
          </ion-button>
          
          <ion-button 
            v-if="event.status !== 'annulé'"
            @click="$emit('cancel')"
            fill="outline" 
            color="danger"
            size="default"
            class="secondary-button"
          >
            <ion-icon :icon="closeOutline" slot="start" />
            Annuler le service
          </ion-button>
        </div>
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
  checkmarkOutline, 
  saveOutline, 
  closeOutline 
} from 'ionicons/icons';
import type { SchedulingEvent, TeamAssignment } from '@/types/scheduling';

interface GlobalStats {
  totalRequired: number;
  totalAssigned: number;
  completionPercentage: number;
  isComplete: boolean;
}

interface Props {
  event: SchedulingEvent;
  teams: TeamAssignment[];
  globalStats: GlobalStats;
}

const props = defineProps<Props>();

defineEmits<{
  confirm: [];
  saveDraft: [];
  cancel: [];
}>();

const canConfirm = computed(() => {
  return props.globalStats.completionPercentage >= 75; // Require at least 75% completion
});

function getStatusColor(status: string): string {
  switch (status) {
    case 'brouillon': return 'primary';
    case 'confirmé': return 'success';
    case 'annulé': return 'danger';
    default: return 'medium';
  }
}

function getProgressClass(percentage: number): string {
  if (percentage >= 100) return 'progress-complete';
  if (percentage >= 75) return 'progress-good';
  if (percentage >= 50) return 'progress-medium';
  return 'progress-low';
}

function getTeamProgressPercentage(team: TeamAssignment): number {
  return team.required > 0 ? Math.round((team.assigned / team.required) * 100) : 0;
}

function getTeamProgressClass(team: TeamAssignment): string {
  const percentage = getTeamProgressPercentage(team);
  if (percentage >= 100) return 'mini-progress-complete';
  if (percentage >= 50) return 'mini-progress-partial';
  return 'mini-progress-empty';
}
</script>

<style scoped>
.overview-card {
  --border-radius: 16px;
  margin: 16px;
}

.service-header {
  padding: 20px;
  background: linear-gradient(135deg, var(--ion-color-primary-tint), var(--ion-color-primary));
  color: white;
}

.service-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.service-datetime {
  font-size: 1.125rem;
  font-weight: 500;
  margin-bottom: 12px;
  opacity: 0.9;
}

.service-status {
  --color: white;
  --background: rgba(255, 255, 255, 0.2);
  font-weight: 600;
  font-size: 0.875rem;
}

.overview-content {
  padding: 20px !important;
}

.global-progress {
  margin-bottom: 24px;
}

.progress-bar-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-bar {
  height: 12px;
  background: var(--ion-color-light);
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.progress-complete {
  background: var(--ion-color-success);
}

.progress-good {
  background: var(--ion-color-success);
}

.progress-medium {
  background: var(--ion-color-warning);
}

.progress-low {
  background: var(--ion-color-danger);
}

.progress-percentage {
  font-weight: 600;
  font-size: 1rem;
  color: var(--ion-color-dark);
}

.teams-status {
  margin-bottom: 24px;
}

.status-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--ion-color-dark);
  margin: 0 0 16px 0;
}

.teams-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.team-status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--ion-color-light);
}

.team-status-row:last-child {
  border-bottom: none;
}

.team-name {
  font-weight: 500;
  font-size: 1rem;
  color: var(--ion-color-dark);
  min-width: 120px;
}

.team-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.team-count {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--ion-color-medium);
  min-width: 40px;
}

.mini-progress-bar {
  flex: 1;
  height: 8px;
  background: var(--ion-color-light);
  border-radius: 4px;
  overflow: hidden;
  max-width: 120px;
}

.mini-progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.mini-progress-complete {
  background: var(--ion-color-success);
}

.mini-progress-partial {
  background: var(--ion-color-warning);
}

.mini-progress-empty {
  background: var(--ion-color-danger);
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-button {
  --border-radius: 12px;
  font-weight: 600;
  height: 48px;
}

.secondary-buttons {
  display: flex;
  gap: 12px;
}

.secondary-button {
  --border-radius: 12px;
  flex: 1;
  font-weight: 500;
  height: 44px;
}

@media (max-width: 768px) {
  .secondary-buttons {
    flex-direction: column;
  }
  
  .team-status-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .team-progress {
    width: 100%;
  }
  
  .mini-progress-bar {
    max-width: none;
  }
}
</style>