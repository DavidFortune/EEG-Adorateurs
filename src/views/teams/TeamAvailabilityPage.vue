<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/teams"></ion-back-button>
        </ion-buttons>
        <ion-title>Disponibilités de l'équipe</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="refreshData">
            <ion-icon :icon="refreshOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Disponibilités</ion-title>
        </ion-toolbar>
      </ion-header>

      <!-- Loading state -->
      <ion-loading :is-open="loading" message="Chargement des disponibilités..."></ion-loading>

      <!-- Team Header -->
      <div class="team-header" v-if="team">
        <div class="team-info-card">
          <div class="team-icon-wrapper">
            <ion-icon :icon="peopleOutline" class="team-main-icon" />
          </div>
          <div class="team-details">
            <h2 class="team-name">{{ team.name }}</h2>
            <p class="team-description">{{ team.description }}</p>
            <div class="team-stats">
              <ion-chip color="primary">
                <ion-icon :icon="peopleOutline" />
                <ion-label>{{ team.members.length }} membres</ion-label>
              </ion-chip>
            </div>
          </div>
        </div>
      </div>

      <!-- Service Filter -->
      <div class="filter-section">
        <ion-segment v-model="selectedServiceId" @ionChange="onServiceChange" scrollable>
          <ion-segment-button value="all">
            <ion-label>Tous</ion-label>
          </ion-segment-button>
          <ion-segment-button v-for="service in upcomingServices" :key="service.id" :value="service.id">
            <ion-label>
              <div class="service-segments">
                <div class="service-weekday">{{ formatServiceSegments(service.date, service.time).weekday }}</div>
                <div class="service-date">{{ formatServiceSegments(service.date, service.time).date }}</div>
                <div class="service-time">{{ formatServiceSegments(service.date, service.time).time }}</div>
              </div>
            </ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>

      <!-- Availability Grid -->
      <div class="availability-container" v-if="!loading && team">
        <!-- Summary Card -->
        <ion-card class="summary-card" v-if="selectedServiceId !== 'all'">
          <ion-card-content>
            <div class="summary-grid">
              <div class="summary-item available">
                <ion-icon :icon="checkmarkCircleOutline" />
                <div class="summary-count">{{ availabilitySummary.available }}</div>
                <div class="summary-label">Disponibles</div>
              </div>
              <div class="summary-item maybe">
                <ion-icon :icon="helpCircleOutline" />
                <div class="summary-count">{{ availabilitySummary.maybe }}</div>
                <div class="summary-label">Peut-être</div>
              </div>
              <div class="summary-item unavailable">
                <ion-icon :icon="closeCircleOutline" />
                <div class="summary-count">{{ availabilitySummary.unavailable }}</div>
                <div class="summary-label">Indisponibles</div>
              </div>
              <div class="summary-item no-response">
                <ion-icon :icon="alertCircleOutline" />
                <div class="summary-count">{{ availabilitySummary.noResponse }}</div>
                <div class="summary-label">Pas de réponse</div>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Members Availability List -->
        <div class="members-list">
          <ion-card v-for="member in teamMembersWithAvailability" :key="member.id" class="member-card">
            <ion-card-content>
              <div class="member-header">
                <div class="member-avatar">
                  <img v-if="member.avatar" :src="member.avatar" :alt="member.fullName" />
                  <span v-else class="avatar-initials">{{ getInitials(member.fullName) }}</span>
                </div>
                <div class="member-info">
                  <h3 class="member-name">{{ member.fullName }}</h3>
                  <p class="member-email">{{ member.email }}</p>
                </div>
                <div class="member-role">
                  <ion-badge :color="getRoleColor(member.role)">
                    {{ getRoleLabel(member.role) }}
                  </ion-badge>
                </div>
              </div>

              <!-- Availability Status for Selected Service -->
              <div v-if="selectedServiceId !== 'all'" class="availability-status">
                <div class="status-row" :class="getAvailabilityClass(member.availability[selectedServiceId])">
                  <ion-icon :icon="getAvailabilityIcon(member.availability[selectedServiceId])" />
                  <span class="status-text">{{ getAvailabilityLabel(member.availability[selectedServiceId]) }}</span>
                </div>
              </div>

              <!-- All Services Availability Grid -->
              <div v-else class="services-grid">
                <div v-for="service in upcomingServices" :key="service.id" class="service-availability">
                  <div class="service-label">
                    <div class="service-date-time-small">{{ formatServiceDateTimeShort(service.date, service.time) }}</div>
                  </div>
                  <ion-chip 
                    :color="getAvailabilityChipColor(member.availability[service.id])"
                    class="availability-chip"
                  >
                    <ion-icon :icon="getAvailabilityIcon(member.availability[service.id])" />
                  </ion-chip>
                </div>
              </div>
            </ion-card-content>
          </ion-card>
        </div>

        <!-- Empty State -->
        <div v-if="teamMembersWithAvailability.length === 0" class="empty-state">
          <ion-icon :icon="peopleOutline" />
          <h3>Aucun membre dans cette équipe</h3>
          <p>Ajoutez des membres à cette équipe pour voir leurs disponibilités</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonBackButton, IonIcon, IonCard, IonCardContent, IonSegment, IonSegmentButton,
  IonLabel, IonChip, IonBadge, IonLoading
} from '@ionic/vue';
import {
  refreshOutline, peopleOutline, checkmarkCircleOutline, closeCircleOutline,
  helpCircleOutline, alertCircleOutline
} from 'ionicons/icons';
import { teamsService } from '@/firebase/teams';
import { membersService } from '@/firebase/members';
import { firestoreService } from '@/firebase/firestore';
import type { Team } from '@/types/team';
import type { Member } from '@/types/member';
import type { Service } from '@/types/service';
import { timezoneUtils } from '@/utils/timezone';

const route = useRoute();
const teamId = route.params.id as string;

// State
const loading = ref(false);
const team = ref<Team | null>(null);
const teamMembers = ref<Member[]>([]);
const upcomingServices = ref<Service[]>([]);
const selectedServiceId = ref<string>('all');

// Computed
const teamMembersWithAvailability = computed(() => {
  if (!team.value) return [];
  
  return team.value.members.map(teamMember => {
    const memberDetails = teamMembers.value.find(m => m.id === teamMember.memberId);
    if (!memberDetails) return null;
    
    // Build availability map for this member
    const availability: Record<string, 'available' | 'unavailable' | 'maybe' | null> = {};
    
    upcomingServices.value.forEach(service => {
      availability[service.id] = memberDetails.availabilities?.[service.id] || null;
    });
    
    return {
      id: memberDetails.id,
      fullName: memberDetails.fullName,
      email: memberDetails.email,
      avatar: memberDetails.avatar,
      role: teamMember.role,
      availability
    };
  }).filter(m => m !== null);
});

const availabilitySummary = computed(() => {
  const summary = {
    available: 0,
    unavailable: 0,
    maybe: 0,
    noResponse: 0
  };
  
  if (selectedServiceId.value === 'all') return summary;
  
  teamMembersWithAvailability.value.forEach(member => {
    const status = member.availability[selectedServiceId.value];
    switch (status) {
      case 'available':
        summary.available++;
        break;
      case 'unavailable':
        summary.unavailable++;
        break;
      case 'maybe':
        summary.maybe++;
        break;
      default:
        summary.noResponse++;
    }
  });
  
  return summary;
});

// Methods
const loadTeamData = async () => {
  try {
    loading.value = true;
    
    // Load team details
    const teamData = await teamsService.getTeamById(teamId);
    if (!teamData) {
      console.error('Team not found');
      return;
    }
    team.value = teamData;
    
    // Load member details for all team members
    const memberIds = teamData.members.map(m => m.memberId);
    const allMembers = await membersService.getAllMembers();
    teamMembers.value = allMembers.filter(m => memberIds.includes(m.id));
    
    // Load upcoming services
    const services = await firestoreService.getAllServices();
    const now = new Date();
    upcomingServices.value = services
      .filter(s => new Date(`${s.date}T${s.time}`) >= now)
      .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
      .slice(0, 5); // Show next 5 services
      
  } catch (error) {
    console.error('Error loading team data:', error);
  } finally {
    loading.value = false;
  }
};

const refreshData = async () => {
  await loadTeamData();
};

const onServiceChange = () => {
  // Service change is handled by reactivity
};


const formatServiceDateTimeShort = (date: string, time: string): string => {
  return timezoneUtils.formatTeamDateTime(date, time);
};

const formatServiceSegments = (date: string, time: string) => {
  return timezoneUtils.formatTeamDateTimeSegments(date, time);
};

const getInitials = (name: string): string => {
  const names = name.split(' ').filter(n => n.length > 0);
  if (names.length === 0) return '?';
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  // Return first and last name initials
  return names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
};

const getRoleColor = (role: string): string => {
  switch (role) {
    case 'owner': return 'tertiary';
    case 'leader': return 'secondary';
    case 'member': return 'primary';
    default: return 'medium';
  }
};

const getRoleLabel = (role: string): string => {
  switch (role) {
    case 'owner': return 'Propriétaire';
    case 'leader': return 'Leader';
    case 'member': return 'Membre';
    case 'guest': return 'Invité';
    default: return role;
  }
};

const getAvailabilityClass = (status: 'available' | 'unavailable' | 'maybe' | null): string => {
  switch (status) {
    case 'available': return 'status-available';
    case 'unavailable': return 'status-unavailable';
    case 'maybe': return 'status-maybe';
    default: return 'status-no-response';
  }
};

const getAvailabilityIcon = (status: 'available' | 'unavailable' | 'maybe' | null) => {
  switch (status) {
    case 'available': return checkmarkCircleOutline;
    case 'unavailable': return closeCircleOutline;
    case 'maybe': return helpCircleOutline;
    default: return alertCircleOutline;
  }
};

const getAvailabilityLabel = (status: 'available' | 'unavailable' | 'maybe' | null): string => {
  switch (status) {
    case 'available': return 'Disponible';
    case 'unavailable': return 'Indisponible';
    case 'maybe': return 'Peut-être';
    default: return 'Pas de réponse';
  }
};

const getAvailabilityChipColor = (status: 'available' | 'unavailable' | 'maybe' | null): string => {
  switch (status) {
    case 'available': return 'success';
    case 'unavailable': return 'danger';
    case 'maybe': return 'warning';
    default: return 'medium';
  }
};

// Lifecycle
onMounted(() => {
  loadTeamData();
});
</script>

<style scoped>
.team-header {
  padding: 16px;
  background: var(--ion-color-light);
}

.team-info-card {
  display: flex;
  align-items: center;
  gap: 16px;
}

.team-icon-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: var(--ion-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.team-main-icon {
  font-size: 32px;
  color: white;
}

.team-details {
  flex: 1;
}

.team-name {
  margin: 0 0 4px 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ion-color-dark);
}

.team-description {
  margin: 0 0 8px 0;
  color: var(--ion-color-medium);
  font-size: 0.9rem;
}

.team-stats {
  display: flex;
  gap: 8px;
}

.filter-section {
  padding: 0 16px 16px;
  background: var(--ion-color-light);
}

.filter-section ion-segment-button {
  min-height: 60px;
  --padding-top: 8px;
  --padding-bottom: 8px;
}

.service-segments {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 2px 0;
}

.service-weekday {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--ion-color-primary);
  text-transform: uppercase;
}

.service-date {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--ion-color-dark);
}

.service-time {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--ion-color-dark);
}

.availability-container {
  padding: 16px;
}

.summary-card {
  margin-bottom: 16px;
  border-radius: 12px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 16px;
}

.summary-item {
  text-align: center;
  padding: 12px;
  border-radius: 8px;
  background: var(--ion-color-light);
}

.summary-item ion-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.summary-item.available {
  background: #e8f5e8;
  color: var(--ion-color-success);
}

.summary-item.maybe {
  background: #fff9e6;
  color: var(--ion-color-warning);
}

.summary-item.unavailable {
  background: #fde8e8;
  color: var(--ion-color-danger);
}

.summary-item.no-response {
  background: var(--ion-color-light);
  color: var(--ion-color-medium);
}

.summary-count {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 4px 0;
}

.summary-label {
  font-size: 0.85rem;
  font-weight: 500;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.member-card {
  border-radius: 12px;
}

.member-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.member-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--ion-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initials {
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name {
  margin: 0 0 2px 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--ion-color-dark);
}

.member-email {
  margin: 0;
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.member-role {
  flex-shrink: 0;
}

.availability-status {
  padding: 12px;
  border-radius: 8px;
  background: var(--ion-color-light);
}

.status-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.status-row ion-icon {
  font-size: 20px;
}

.status-available {
  color: var(--ion-color-success);
  background: #e8f5e8;
}

.status-unavailable {
  color: var(--ion-color-danger);
  background: #fde8e8;
}

.status-maybe {
  color: var(--ion-color-warning);
  background: #fff9e6;
}

.status-no-response {
  color: var(--ion-color-medium);
  background: var(--ion-color-light);
}

.services-grid {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 12px;
  background: var(--ion-color-light);
  border-radius: 8px;
}

.service-availability {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.service-label {
  text-align: center;
}

.service-date-time-small {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--ion-color-dark);
  text-align: center;
}

.availability-chip {
  --padding-start: 8px;
  --padding-end: 8px;
}

.availability-chip ion-icon {
  margin: 0;
  font-size: 18px;
}

.empty-state {
  text-align: center;
  padding: 48px 16px;
}

.empty-state ion-icon {
  font-size: 64px;
  color: var(--ion-color-medium);
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  color: var(--ion-color-dark);
}

.empty-state p {
  margin: 0;
  color: var(--ion-color-medium);
}

/* Responsive Design */
@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>