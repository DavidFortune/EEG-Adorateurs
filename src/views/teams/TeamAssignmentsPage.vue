<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/teams"></ion-back-button>
        </ion-buttons>
        <ion-title>Assignations de l'équipe</ion-title>
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
          <ion-title size="large">Assignations</ion-title>
        </ion-toolbar>
      </ion-header>

      <!-- Loading state -->
      <ion-loading :is-open="loading" message="Chargement des assignations..."></ion-loading>

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
              <ion-chip color="success" v-if="totalAssignments > 0">
                <ion-icon :icon="checkmarkDoneOutline" />
                <ion-label>{{ totalAssignments }} assignations</ion-label>
              </ion-chip>
            </div>
          </div>
        </div>
      </div>

      <!-- View Mode Toggle -->
      <div class="view-toggle">
        <ion-segment v-model="viewMode" @ionChange="onViewModeChange">
          <ion-segment-button value="by-service">
            <ion-label>Par service</ion-label>
          </ion-segment-button>
          <ion-segment-button value="by-member">
            <ion-label>Par membre</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>

      <!-- Assignments Container -->
      <div class="assignments-container" v-if="!loading && team">
        
        <!-- View by Service -->
        <div v-if="viewMode === 'by-service'" class="services-view">
          <ion-card v-for="service in servicesWithAssignments" :key="service.id" class="service-card">
            <ion-card-header>
              <div class="service-header">
                <div class="service-info">
                  <ion-card-title class="service-title">{{ service.title }}</ion-card-title>
                  <ion-card-subtitle class="service-datetime">
                    <ion-icon :icon="calendarOutline" />
                    {{ formatServiceDateTime(service.date, service.time) }}
                  </ion-card-subtitle>
                </div>
                <ion-badge 
                  v-if="canViewTeamRequirements"
                  :color="service.assignments.length >= getRequiredMembers(service) ? 'success' : 'warning'"
                  class="assignment-badge"
                >
                  {{ service.assignments.length }}/{{ getRequiredMembers(service) }}
                </ion-badge>
                <ion-badge 
                  v-else
                  color="primary"
                  class="assignment-badge"
                >
                  {{ service.assignments.length }} membre{{ service.assignments.length > 1 ? 's' : '' }}
                </ion-badge>
              </div>
            </ion-card-header>
            
            <ion-card-content>
              <!-- Assigned Members List -->
              <div class="assigned-members" v-if="service.assignments.length > 0">
                <h4 class="section-title">Membres assignés</h4>
                <div class="members-list">
                  <div 
                    v-for="assignment in service.assignments" 
                    :key="assignment.id"
                    class="assigned-member"
                  >
                    <div class="member-avatar">
                      <img v-if="assignment.member?.avatar" :src="assignment.member.avatar" :alt="assignment.memberName" />
                      <span v-else class="avatar-initials">{{ getInitials(assignment.memberName) }}</span>
                    </div>
                    <div class="member-details">
                      <span class="member-name">{{ assignment.memberName }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Missing Members Alert -->
              <div 
                v-if="canViewTeamRequirements && service.assignments.length < getRequiredMembers(service)" 
                class="missing-alert"
              >
                <ion-icon :icon="alertCircleOutline" />
                <span>{{ getRequiredMembers(service) - service.assignments.length }} membre(s) manquant(s)</span>
              </div>

              <!-- No Assignments -->
              <div v-if="service.assignments.length === 0" class="no-assignments">
                <ion-icon :icon="peopleCircleOutline" />
                <p>Aucun membre assigné pour ce service</p>
              </div>
            </ion-card-content>
          </ion-card>

          <!-- Empty State for Services -->
          <div v-if="servicesWithAssignments.length === 0" class="empty-state">
            <ion-icon :icon="calendarOutline" />
            <h3>Aucun service à venir</h3>
            <p>Il n'y a pas de services programmés pour cette équipe</p>
          </div>
        </div>

        <!-- View by Member -->
        <div v-if="viewMode === 'by-member'" class="members-view">
          <ion-card v-for="member in membersWithAssignments" :key="member.id" class="member-card">
            <ion-card-content>
              <div class="member-header">
                <div class="member-avatar">
                  <img v-if="member.avatar" :src="member.avatar" :alt="member.fullName" />
                  <span v-else class="avatar-initials">{{ getInitials(member.fullName) }}</span>
                </div>
                <div class="member-info">
                  <h3 class="member-name">{{ member.fullName }}</h3>
                  <p class="member-email">{{ member.email }}</p>
                  <ion-badge :color="getRoleColor(member.role)" class="role-badge">
                    {{ getRoleLabel(member.role) }}
                  </ion-badge>
                </div>
                <div class="assignment-count">
                  <ion-chip color="primary">
                    <ion-label>{{ member.assignments.length }} service(s)</ion-label>
                  </ion-chip>
                </div>
              </div>

              <!-- Member's Assignments -->
              <div class="member-assignments" v-if="member.assignments.length > 0">
                <h4 class="section-title">Services assignés</h4>
                <div class="assignments-list">
                  <div 
                    v-for="assignment in member.assignments" 
                    :key="assignment.id"
                    class="assignment-item"
                  >
                    <ion-icon :icon="checkmarkCircleOutline" class="assignment-icon" />
                    <div class="assignment-details">
                      <span class="service-name">{{ assignment.service?.title }}</span>
                      <span class="service-datetime">
                        {{ formatServiceDateTime(assignment.service?.date, assignment.service?.time) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- No Assignments for Member -->
              <div v-else class="no-member-assignments">
                <p>Aucun service assigné</p>
              </div>
            </ion-card-content>
          </ion-card>

          <!-- Empty State for Members -->
          <div v-if="membersWithAssignments.length === 0" class="empty-state">
            <ion-icon :icon="peopleOutline" />
            <h3>Aucun membre dans l'équipe</h3>
            <p>Ajoutez des membres à cette équipe pour gérer les assignations</p>
          </div>
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
  IonBackButton, IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle,
  IonCardContent, IonSegment, IonSegmentButton, IonLabel, IonChip, IonBadge,
  IonLoading, toastController
} from '@ionic/vue';
import {
  refreshOutline, peopleOutline, calendarOutline, checkmarkDoneOutline,
  checkmarkCircleOutline, alertCircleOutline, peopleCircleOutline
} from 'ionicons/icons';
import { teamsService } from '@/firebase/teams';
import { membersService } from '@/firebase/members';
import { firestoreService } from '@/firebase/firestore';
import { 
  collection, 
  getDocs, 
  query, 
  where
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useUser } from '@/composables/useUser';
import type { Team } from '@/types/team';
import type { Member } from '@/types/member';
import type { Service } from '@/types/service';
import type { ServiceAssignment } from '@/types/assignment';
import { timezoneUtils } from '@/utils/timezone';

const route = useRoute();
const { member: currentUser, isAdmin } = useUser();
const teamId = route.params.id as string;

// State
const loading = ref(false);
const team = ref<Team | null>(null);
const teamMembers = ref<Member[]>([]);
const services = ref<Service[]>([]);
const assignments = ref<ServiceAssignment[]>([]);
const viewMode = ref<'by-service' | 'by-member'>('by-service');

// Computed
const canViewTeamRequirements = computed(() => {
  if (!team.value || !currentUser.value) return false;
  
  // Admin can always view team requirements
  if (isAdmin.value) return true;
  
  // Check if user is owner or leader of this team
  const userInTeam = team.value.members.find(m => m.memberId === currentUser.value?.id);
  return team.value.ownerId === currentUser.value.id || userInTeam?.role === 'leader';
});

const totalAssignments = computed(() => {
  return assignments.value.filter(a => a.teamId === teamId).length;
});

// Memoize member lookups for better performance
const teamMembersMap = computed(() => {
  return new Map(teamMembers.value.map(member => [member.id, member]));
});

const servicesWithAssignments = computed(() => {
  const now = new Date();
  const nowTime = now.getTime();
  const memberMap = teamMembersMap.value;
  const teamName = team.value?.name;
  const canViewReqs = canViewTeamRequirements.value;

  // Pre-filter assignments for this team
  const teamAssignments = assignments.value.filter(a => a.teamId === teamId);
  const assignmentsByServiceId = new Map<string, ServiceAssignment[]>();

  for (const assignment of teamAssignments) {
    const serviceAssignments = assignmentsByServiceId.get(assignment.serviceId) || [];
    serviceAssignments.push(assignment);
    assignmentsByServiceId.set(assignment.serviceId, serviceAssignments);
  }

  return services.value
    .filter(service => {
      // Filter upcoming services with optimized date parsing
      const serviceDateTime = new Date(`${service.date}T${service.time}`);
      return serviceDateTime.getTime() >= nowTime;
    })
    .map(service => {
      // Get assignments for this service using the pre-built map
      const serviceAssignments = (assignmentsByServiceId.get(service.id) || [])
        .map(assignment => ({
          ...assignment,
          member: memberMap.get(assignment.memberId)
        }));

      return {
        ...service,
        assignments: serviceAssignments
      };
    })
    .filter(service => {
      // Optimized requirement checking
      if (canViewReqs) {
        const hasTeamRequirement = service.teamRequirements?.some(
          req => req.isActive && teamName && req.teamName === teamName
        );
        return hasTeamRequirement || service.assignments.length > 0;
      }

      return service.assignments.length > 0;
    })
    .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
    .slice(0, 10); // Show next 10 services
});

const membersWithAssignments = computed(() => {
  if (!team.value) return [];

  const memberMap = teamMembersMap.value;
  const now = new Date();
  const nowTime = now.getTime();

  // Create service lookup map
  const servicesMap = new Map(services.value.map(service => [service.id, service]));

  // Pre-filter assignments for this team
  const teamAssignments = assignments.value.filter(a => a.teamId === teamId);

  return team.value.members.map(teamMember => {
    const memberDetails = memberMap.get(teamMember.memberId);
    if (!memberDetails) return null;

    // Get all assignments for this member with optimized filtering
    const memberAssignments = teamAssignments
      .filter(a => a.memberId === memberDetails.id)
      .map(assignment => {
        const service = servicesMap.get(assignment.serviceId);
        return {
          ...assignment,
          service
        };
      })
      .filter(a => {
        // Only show future assignments with optimized date comparison
        if (!a.service) return false;
        const serviceDateTime = new Date(`${a.service.date}T${a.service.time}`);
        return serviceDateTime.getTime() >= nowTime;
      });

    return {
      ...memberDetails,
      role: teamMember.role,
      assignments: memberAssignments
    };
  }).filter((m): m is NonNullable<typeof m> => m !== null);
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
    
    // Load all services
    const allServices = await firestoreService.getAllServices();
    services.value = allServices;
    
    // Load assignments for this team
    const q = query(
      collection(db, 'assignments'),
      where('teamId', '==', teamId)
    );
    const querySnapshot = await getDocs(q);
    const teamAssignments = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        assignedAt: data.assignedAt?.toDate?.()?.toISOString() || data.assignedAt
      } as ServiceAssignment;
    });
    assignments.value = teamAssignments;
    
  } catch (error) {
    console.error('Error loading team data:', error);
    const toast = await toastController.create({
      message: 'Erreur lors du chargement des données',
      duration: 3000,
      color: 'danger'
    });
    await toast.present();
  } finally {
    loading.value = false;
  }
};

const refreshData = async () => {
  await loadTeamData();
};

const onViewModeChange = () => {
  // View mode change is handled by reactivity
};


const getRequiredMembers = (service: Service): number => {
  if (!service.teamRequirements || !team.value) return 0;
  
  const requirement = service.teamRequirements.find(
    req => req.isActive && req.teamName === team.value!.name
  );
  
  return requirement?.membersNeeded || 0;
};

const formatServiceDateTime = (date: string | undefined, time: string | undefined): string => {
  if (!date || !time) return '';
  return timezoneUtils.formatTeamDateTime(date, time);
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
  flex-wrap: wrap;
}

.view-toggle {
  padding: 16px;
  background: var(--ion-color-light);
}

.assignments-container {
  padding: 16px;
}

/* Service View Styles */
.service-card {
  margin-bottom: 16px;
  border-radius: 12px;
}

.service-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.service-info {
  flex: 1;
  min-width: 0;
}

.service-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.service-datetime {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  color: var(--ion-color-medium);
}

.service-datetime ion-icon {
  font-size: 16px;
}

.assignment-badge {
  flex-shrink: 0;
  --padding-start: 12px;
  --padding-end: 12px;
  font-weight: 600;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--ion-color-dark);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.assigned-members {
  margin-bottom: 16px;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.assigned-member {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: var(--ion-color-light);
  border-radius: 8px;
}

.member-avatar {
  width: 40px;
  height: 40px;
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
  font-size: 0.9rem;
}

.member-details {
  flex: 1;
  min-width: 0;
}

.member-name {
  display: block;
  font-weight: 600;
  color: var(--ion-color-dark);
  margin-bottom: 2px;
}


.missing-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fff9e6;
  border: 1px solid #f0e68c;
  border-radius: 8px;
  color: #b8860b;
  font-weight: 500;
  font-size: 0.9rem;
}

.missing-alert ion-icon {
  font-size: 20px;
  color: #daa520;
}

.no-assignments {
  text-align: center;
  padding: 24px;
  color: var(--ion-color-medium);
}

.no-assignments ion-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

/* Member View Styles */
.member-card {
  margin-bottom: 16px;
  border-radius: 12px;
}

.member-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-info .member-name {
  margin: 0 0 4px 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--ion-color-dark);
}

.member-email {
  margin: 0 0 8px 0;
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.role-badge {
  --padding-start: 8px;
  --padding-end: 8px;
  font-size: 0.75rem;
}

.assignment-count {
  flex-shrink: 0;
}

.member-assignments {
  margin-top: 16px;
}

.assignments-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.assignment-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  background: var(--ion-color-light);
  border-radius: 8px;
}

.assignment-icon {
  font-size: 20px;
  color: var(--ion-color-success);
  flex-shrink: 0;
  margin-top: 2px;
}

.assignment-details {
  flex: 1;
}

.service-name {
  display: block;
  font-weight: 600;
  color: var(--ion-color-dark);
  margin-bottom: 2px;
}

.service-datetime {
  display: block;
  font-size: 0.8rem;
  color: var(--ion-color-medium);
}

.no-member-assignments {
  text-align: center;
  padding: 16px;
  color: var(--ion-color-medium);
  font-size: 0.9rem;
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
  .team-stats {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .service-header {
    flex-direction: column;
  }
  
  .assignment-badge {
    align-self: flex-start;
  }
}
</style>