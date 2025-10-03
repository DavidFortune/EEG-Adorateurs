<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="`/team-detail/${teamId}`"></ion-back-button>
        </ion-buttons>
        <ion-title>Planning - {{ team?.name }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Planning - {{ team?.name }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <!-- Loading indicator -->
      <ion-loading :is-open="loading" message="Chargement des données..."></ion-loading>

      <div v-if="!loading && !team" class="empty-state ion-text-center ion-padding">
        <ion-icon :icon="alertCircleOutline" size="large" color="danger" />
        <h3>Équipe introuvable</h3>
        <p>Cette équipe n'existe pas ou a été supprimée.</p>
      </div>

      <div v-else-if="!loading && team">
        <!-- Event Selector -->
        <EventSelector
          :events="events"
          :active-event-index="filteredActiveEventIndex"
          @select="handleEventSelect"
        />

        <!-- Service Selection Prompt -->
        <div v-if="!hasSelectedService" class="service-selection-prompt ion-text-center ion-padding">
          <ion-icon :icon="calendarOutline" size="large" color="primary" />
          <h3>Sélectionnez un service</h3>
          <p>Veuillez choisir un service ci-dessus pour voir les assignations de l'équipe.</p>
        </div>

        <!-- Teams View (filtered for single team) -->
        <div v-else class="teams-container">
          <div v-if="filteredTeams.length === 0" class="empty-state ion-text-center ion-padding">
            <ion-icon :icon="peopleOutline" size="large" color="medium" />
            <h3>Aucune donnée</h3>
            <p>Cette équipe n'est pas requise pour le service sélectionné.</p>
          </div>

          <div v-else class="teams-list">
            <TeamCardNoPen
              v-for="teamData in filteredTeams"
              :key="teamData.id"
              :team="teamData"
              :status-color="getTeamStatusColor(teamData)"
              :status-label="getTeamStatusLabel(teamData)"
              @member-click="(memberId) => toggleMemberAssignment(teamData.id, memberId)"
            />
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonBackButton, IonButtons, IonIcon, IonLoading
} from '@ionic/vue';
import {
  alertCircleOutline, peopleOutline, calendarOutline
} from 'ionicons/icons';
import { useSchedulingStore } from '@/stores/schedulingStore';
import { teamsService } from '@/firebase/teams';
import { authService } from '@/firebase/auth';
import { serviceService } from '@/services/serviceService';
import EventSelector from '@/components/scheduling/EventSelector.vue';
import TeamCardNoPen from '@/components/scheduling/TeamCardNoPen.vue';
import type { Team } from '@/types/team';
import type { Service } from '@/types/service';

const route = useRoute();
const schedulingStore = useSchedulingStore();

// Get refs from scheduling store
const {
  activeEventIndex,
  events: allEvents,
  loading,
  filteredTeams: allFilteredTeams,
} = storeToRefs(schedulingStore);

// Get actions from scheduling store
const {
  setActiveEvent,
  toggleMemberAssignment,
  getTeamStatusColor,
  getTeamStatusLabel,
  loadServices,
  loadCurrentEventTeams,
  setCurrentUserId
} = schedulingStore;

const teamId = computed(() => route.params.id as string);
const team = ref<Team | null>(null);
const allServices = ref<Service[]>([]);

// Track if user has selected a service
const hasSelectedService = computed(() => {
  return activeEventIndex.value >= 0 && events.value.length > 0 && filteredActiveEventIndex.value >= 0;
});

// Filter events to show only future services where this team is required
const events = computed(() => {
  const now = new Date();
  const teamName = team.value?.name;

  if (!teamName) {
    return allEvents.value.filter(event => {
      const eventDate = new Date(event.datetime);
      return eventDate >= now;
    });
  }

  // Filter to show only events where this team is required
  const filteredEventIds = allServices.value
    .filter(service => {
      // Check if service has team requirements
      if (!service.teamRequirements || service.teamRequirements.length === 0) {
        return false;
      }

      // Check if this team is in the requirements
      const isTeamRequired = service.teamRequirements.some(
        req => req.isActive && req.teamName === teamName
      );

      return isTeamRequired;
    })
    .map(service => service.id);

  return allEvents.value.filter(event => {
    const eventDate = new Date(event.datetime);
    return eventDate >= now && filteredEventIds.includes(event.id);
  });
});

// Calculate the active event index relative to the filtered events
const filteredActiveEventIndex = computed(() => {
  if (!allEvents.value.length || activeEventIndex.value < 0) return -1;

  const activeEvent = allEvents.value[activeEventIndex.value];
  if (!activeEvent) return -1;

  return events.value.findIndex(event => event.id === activeEvent.id);
});

// Filter teams to show only the current team
const filteredTeams = computed(() => {
  if (!team.value) return [];
  return allFilteredTeams.value
    .filter(t => t.id === teamId.value)
    .map(team => ({
      ...team,
      // Sort members alphabetically by name
      members: [...team.members].sort((a, b) => {
        const nameA = a.name?.toLowerCase() || '';
        const nameB = b.name?.toLowerCase() || '';
        return nameA.localeCompare(nameB);
      })
    }));
});

// Load team data
const loadTeamData = async () => {
  try {
    team.value = await teamsService.getTeamById(teamId.value);
  } catch (error) {
    console.error('Error loading team data:', error);
  }
};

// Load all services
const loadAllServices = async () => {
  try {
    allServices.value = await serviceService.getAllServices();
  } catch (error) {
    console.error('Error loading services:', error);
  }
};

// Handle event selection and reload teams
async function handleEventSelect(index: number) {
  // Get the selected event from the filtered events
  const filteredEvent = events.value[index];
  if (!filteredEvent) return;

  // Find the original index in allEvents
  const originalIndex = allEvents.value.findIndex(e => e.id === filteredEvent.id);
  if (originalIndex === -1) return;

  setActiveEvent(originalIndex);
  if (allEvents.value.length > 0) {
    await loadCurrentEventTeams();
  }
}


// Load data when component mounts
onMounted(async () => {
  try {
    // Set current user ID for assignments
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUserId(user.uid);
    }

    // Load team data and all services in parallel
    await Promise.all([
      loadTeamData(),
      loadAllServices()
    ]);

    // Load services and teams
    await loadServices();
  } catch (error) {
    console.error('Error loading scheduling data:', error);
  }
});
</script>

<style scoped>
.teams-container {
  padding: 0 16px 16px 16px;
}

.teams-list {
  display: flex;
  flex-direction: column;
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


/* Service selection prompt styling */
.service-selection-prompt {
  margin-top: 3rem;
}

.service-selection-prompt ion-icon {
  margin-bottom: 1rem;
}

.service-selection-prompt h3 {
  color: var(--ion-color-primary);
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.service-selection-prompt p {
  color: var(--ion-color-medium);
  margin: 0;
  font-size: 0.9rem;
}
</style>