<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/services"></ion-back-button>
        </ion-buttons>
        <ion-title>Planning des services</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" color="dark">
            <ion-icon :icon="searchOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Planning des services</ion-title>
        </ion-toolbar>
      </ion-header>

      <!-- Loading indicator -->
      <ion-loading :is-open="loading" message="Chargement des données..."></ion-loading>

      <!-- Event Selector -->
      <EventSelector 
        :events="events"
        :active-event-index="activeEventIndex"
        @select="handleEventSelect"
      />

      <!-- View Toggle -->
      <ViewToggle 
        v-model="viewMode"
        @update:model-value="setViewMode"
      />

      <!-- Team Filter (only in teams view) -->
      <TeamFilter 
        v-model="selectedTeam"
        :options="teamOptions"
        :show="viewMode === 'teams'"
        @update:model-value="setSelectedTeam"
      />

      <!-- Teams View -->
      <div v-if="viewMode === 'teams'" class="teams-container">
        <div v-if="filteredTeams.length === 0" class="empty-state ion-text-center ion-padding">
          <ion-icon :icon="peopleOutline" size="large" color="medium" />
          <h3>Aucune équipe</h3>
          <p>Aucune équipe ne correspond aux critères sélectionnés.</p>
        </div>
        
        <div v-else class="teams-list">
          <TeamCard
            v-for="team in filteredTeams"
            :key="team.id"
            :team="team"
            :is-editing="editingTeam === team.id"
            :status-color="getTeamStatusColor(team)"
            :status-label="getTeamStatusLabel(team)"
            @enter-edit="enterEditMode(team.id)"
            @save="saveAndExitEditMode"
            @member-click="(memberId) => toggleMemberAssignment(team.id, memberId)"
          />
        </div>
      </div>

      <!-- Overview View -->
      <div v-if="viewMode === 'overview'" class="overview-container">
        <OverviewCard
          v-if="currentEvent"
          :event="currentEvent"
          :teams="Object.values(teams)"
          :global-stats="globalStats"
          @confirm="confirmScheduling"
          @save-draft="saveDraft"
          @cancel="cancelService"
        />
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButtons, 
  IonButton, 
  IonIcon,
  IonLoading,
  IonBackButton
} from '@ionic/vue';
import { searchOutline, peopleOutline } from 'ionicons/icons';
import { useSchedulingStore } from '@/stores/schedulingStore';
import { authService } from '@/firebase/auth';
import EventSelector from '@/components/scheduling/EventSelector.vue';
import ViewToggle from '@/components/scheduling/ViewToggle.vue';
import TeamFilter from '@/components/scheduling/TeamFilter.vue';
import TeamCard from '@/components/scheduling/TeamCard.vue';
import OverviewCard from '@/components/scheduling/OverviewCard.vue';

const schedulingStore = useSchedulingStore();

const {
  activeEventIndex,
  viewMode,
  selectedTeam,
  editingTeam,
  events,
  teams,
  loading,
  currentEvent,
  filteredTeams,
  globalStats,
  teamOptions
} = storeToRefs(schedulingStore);

const {
  setActiveEvent,
  setViewMode,
  setSelectedTeam,
  toggleMemberAssignment,
  enterEditMode,
  saveAndExitEditMode,
  getTeamStatusColor,
  getTeamStatusLabel,
  confirmScheduling,
  saveDraft,
  cancelService,
  loadServices,
  loadCurrentEventTeams,
  setCurrentUserId
} = schedulingStore;

// Load data when component mounts
onMounted(async () => {
  try {
    // Set current user ID for assignments
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUserId(user.uid);
    }
    
    // Load services and teams
    await loadServices();
  } catch (error) {
    console.error('Error loading scheduling data:', error);
  }
});

// Handle event selection and reload teams
async function handleEventSelect(index: number) {
  setActiveEvent(index);
  if (events.value.length > 0) {
    await loadCurrentEventTeams();
  }
}
</script>

<style scoped>
.teams-container {
  padding: 0 16px 16px 16px;
}

.teams-list {
  display: flex;
  flex-direction: column;
}

.overview-container {
  padding-bottom: 16px;
}

.empty-state {
  margin-top: 2rem;
}

.empty-state ion-icon {
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: var(--ion-color-medium);
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: var(--ion-color-medium);
  margin: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .teams-container {
    padding: 0 8px 16px 8px;
  }
}
</style>