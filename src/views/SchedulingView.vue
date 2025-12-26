<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/services"></ion-back-button>
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
            @member-click="(memberId) => handleMemberClick(team.id, memberId)"
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
  IonBackButton,
  alertController,
  toastController
} from '@ionic/vue';
import { searchOutline, peopleOutline } from 'ionicons/icons';
import { timezoneUtils } from '@/utils/timezone';
import type { Service } from '@/types/service';
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
  setCurrentUserId,
  checkMemberConflictsForAssignment,
  setMemberUnavailableForServices
} = schedulingStore;

// Format service info for conflict display
const formatConflictService = (service: Service, teamName?: string): string => {
  const dateTime = timezoneUtils.formatDateTimeForDisplay(service.date, service.time);
  const teamText = teamName ? `\n   ${teamName}` : '';
  return `• ${service.title}\n   ${dateTime}${teamText}`;
};

// Handle member click with conflict checking
async function handleMemberClick(teamId: string, memberId: string) {
  const serviceId = currentEvent.value?.id;
  if (!serviceId) return;

  // Find the member to check if they're already assigned
  const teamData = filteredTeams.value.find(t => t.id === teamId);
  const member = teamData?.members.find(m => m.id === memberId);

  // If member is already assigned, just toggle (remove)
  if (member?.isAssigned) {
    await toggleMemberAssignment(teamId, memberId);
    await loadCurrentEventTeams();
    return;
  }

  // Check for conflicts before assigning
  const { canAssign, assignedConflicts, availabilityConflicts } =
    await checkMemberConflictsForAssignment(memberId, serviceId);

  // Block if member is already assigned to a conflicting service
  if (!canAssign) {
    const conflictDetails = assignedConflicts
      .map(c => formatConflictService(c.service, c.teamName))
      .join('\n\n');

    const alert = await alertController.create({
      header: 'Double réservation impossible',
      message: `Ce membre est déjà assigné à un service qui se chevauche:\n\n${conflictDetails}\n\nVeuillez d'abord retirer cette assignation.`,
      cssClass: 'conflict-alert',
      buttons: ['OK']
    });
    await alert.present();
    return;
  }

  // Show warning for availability conflicts
  if (availabilityConflicts.length > 0) {
    const conflictDetails = availabilityConflicts
      .map(s => formatConflictService(s))
      .join('\n\n');

    const alert = await alertController.create({
      header: 'Conflit de disponibilité',
      message: `Ce membre a des services qui se chevauchent:\n\n${conflictDetails}\n\nVoulez-vous continuer? Les services en conflit seront marqués comme indisponibles.`,
      cssClass: 'conflict-alert',
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        { text: 'Confirmer', role: 'confirm' }
      ]
    });

    await alert.present();
    const { role } = await alert.onDidDismiss();

    if (role !== 'confirm') return;

    await setMemberUnavailableForServices(
      memberId,
      availabilityConflicts.map(s => s.id)
    );
  }

  // Proceed with assignment
  await toggleMemberAssignment(teamId, memberId);
  await loadCurrentEventTeams();

  const toast = await toastController.create({
    message: 'Membre assigné avec succès',
    duration: 2000,
    color: 'success',
    position: 'top'
  });
  await toast.present();
}

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

<style>
/* Global styles for conflict alert (must be unscoped) */
.conflict-alert .alert-message {
  white-space: pre-line;
  text-align: left;
  font-size: 0.9rem;
  line-height: 1.5;
  max-height: 60vh;
  overflow-y: auto;
}
</style>