<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="`/service-detail/${route.params.id}`"></ion-back-button>
        </ion-buttons>
        <ion-title>Membres assignés</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content :fullscreen="true">
      <ion-loading :is-open="loading" message="Chargement..."></ion-loading>
      
      <div v-if="service" class="service-header">
        <div class="service-info-card">
          <h2 class="service-title">{{ service.title }}</h2>
          <p class="service-datetime">
            <ion-icon :icon="calendarOutline" />
            {{ formatDateTime(service.date, service.time) }}
          </p>
        </div>
      </div>
      
      <div class="content-container">
        <div v-if="loadingAssignments" class="loading-container">
          <ion-spinner></ion-spinner>
          <p>Chargement des assignations...</p>
        </div>
        
        <!-- Teams List -->
        <div v-else-if="teamAssignments.length > 0 || guestMembers.length > 0" class="teams-container">
          <div class="summary-card">
            <ion-card>
              <ion-card-content>
                <div class="summary-stats">
                  <div class="stat-item">
                    <ion-icon :icon="peopleOutline" class="stat-icon" />
                    <div class="stat-details">
                      <span class="stat-value">{{ totalMembers }}</span>
                      <span class="stat-label">Total participants</span>
                    </div>
                  </div>
                  <div class="stat-item">
                    <ion-icon :icon="peopleCircleOutline" class="stat-icon" />
                    <div class="stat-details">
                      <span class="stat-value">{{ teamAssignments.length }}</span>
                      <span class="stat-label">Équipes</span>
                    </div>
                  </div>
                  <div v-if="totalGuests > 0" class="stat-item">
                    <ion-icon :icon="personAddOutline" class="stat-icon guest-stat-icon" />
                    <div class="stat-details">
                      <span class="stat-value">{{ totalGuests }}</span>
                      <span class="stat-label">Invités</span>
                    </div>
                  </div>
                </div>
              </ion-card-content>
            </ion-card>
          </div>
          
          <div class="teams-list">
            <ion-card v-for="team in teamAssignments" :key="team.teamId" class="team-card">
              <ion-card-header>
                <div class="team-header">
                  <div class="team-info">
                    <ion-card-title class="team-title">
                      <ion-icon :icon="peopleOutline" class="team-icon" />
                      {{ team.teamName }}
                    </ion-card-title>
                    <ion-card-subtitle>
                      {{ team.members.length }} membre{{ team.members.length > 1 ? 's' : '' }}
                    </ion-card-subtitle>
                  </div>
                  <ion-chip :color="getTeamStatusColor(team)" size="small">
                    {{ getTeamStatusText(team) }}
                  </ion-chip>
                </div>
              </ion-card-header>
              
              <ion-card-content>
                <ion-list class="members-list">
                  <ion-item v-for="member in team.members" :key="member.memberId" lines="none" class="member-item">
                    <ion-avatar slot="start">
                      <img v-if="member.avatar" :src="member.avatar" :alt="member.memberName" />
                      <div v-else class="avatar-initials">
                        {{ getInitials(member.memberName) }}
                      </div>
                    </ion-avatar>
                    <ion-label>
                      <h3 class="member-name">{{ member.memberName }}</h3>
                      <p class="assigned-info">
                        Assigné le {{ formatAssignedDate(member.assignedAt) }}
                        <span v-if="member.assignedBy" class="assigned-by">
                          par {{ member.assignedByName || 'Admin' }}
                        </span>
                      </p>
                    </ion-label>
                  </ion-item>
                </ion-list>
                
                <!-- Show missing members if team is incomplete -->
                <div v-if="team.requiredMembers && team.members.length < team.requiredMembers" class="missing-members-alert">
                  <ion-icon :icon="alertCircleOutline" class="warning-icon" />
                  <span>{{ team.requiredMembers - team.members.length }} membre(s) manquant(s)</span>
                </div>
              </ion-card-content>
            </ion-card>
          </div>

          <!-- Guests Section -->
          <div v-if="guestMembers.length > 0" class="guests-section">
            <ion-card class="guests-card">
              <ion-card-header>
                <div class="team-header">
                  <div class="team-info">
                    <ion-card-title class="team-title">
                      <ion-icon :icon="personAddOutline" class="guest-icon" />
                      Invités
                    </ion-card-title>
                    <ion-card-subtitle>
                      {{ guestMembers.length }} invité{{ guestMembers.length > 1 ? 's' : '' }}
                    </ion-card-subtitle>
                  </div>
                  <ion-chip color="tertiary" size="small">
                    Accès spécial
                  </ion-chip>
                </div>
              </ion-card-header>

              <ion-card-content>
                <ion-list class="members-list">
                  <ion-item v-for="guest in guestMembers" :key="guest.id" lines="none" class="member-item">
                    <ion-avatar slot="start">
                      <img v-if="guest.avatar" :src="guest.avatar" :alt="guest.fullName" />
                      <div v-else class="avatar-initials">
                        {{ getInitials(guest.fullName) }}
                      </div>
                    </ion-avatar>
                    <ion-label>
                      <h3 class="member-name">{{ guest.fullName }}</h3>
                      <p class="guest-info">Invité avec accès spécial</p>
                    </ion-label>
                  </ion-item>
                </ion-list>
              </ion-card-content>
            </ion-card>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <ion-icon :icon="peopleOutline" size="large" color="medium"></ion-icon>
          <h3>Aucun membre assigné</h3>
          <p>Aucun membre n'a encore été assigné à ce service.</p>
          <ion-button 
            v-if="isAdmin" 
            @click="goToScheduling" 
            fill="outline"
            size="small"
          >
            <ion-icon :icon="calendarOutline" slot="start" />
            Aller à la planification
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonList, IonItem, IonLabel, IonAvatar, IonIcon, IonChip, IonLoading,
  IonSpinner, IonButton
} from '@ionic/vue';
import {
  peopleOutline, calendarOutline, alertCircleOutline, peopleCircleOutline, personAddOutline
} from 'ionicons/icons';
import { db } from '@/firebase/config';
import { doc, collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { membersService } from '@/firebase/members';
import { useUser } from '@/composables/useUser';
import { timezoneUtils } from '@/utils/timezone';
import type { Service } from '@/types/service';
import type { ServiceAssignment } from '@/types/assignment';
import type { Member } from '@/types/member';

interface TeamAssignmentGroup {
  teamId: string;
  teamName: string;
  members: Array<ServiceAssignment & { avatar?: string; assignedByName?: string }>;
  requiredMembers?: number;
}

const route = useRoute();
const router = useRouter();
const { isAdmin } = useUser();

const loading = ref(true);
const loadingAssignments = ref(true);
const service = ref<Service | null>(null);
const teamAssignments = ref<TeamAssignmentGroup[]>([]);
const guestMembers = ref<Member[]>([]);

// Realtime subscription cleanup
let unsubscribeService: (() => void) | null = null;
let unsubscribeAssignments: (() => void) | null = null;

const serviceId = computed(() => route.params.id as string);

const totalMembers = computed(() => {
  const teamMembersCount = teamAssignments.value.reduce((total, team) => total + team.members.length, 0);
  return teamMembersCount + guestMembers.value.length;
});

const totalGuests = computed(() => guestMembers.value.length);

const formatDateTime = (dateStr: string, timeStr: string) => {
  return timezoneUtils.formatDateTimeForDisplay(dateStr, timeStr);
};

const formatAssignedDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-CA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Toronto'
  });
};

const getInitials = (name: string): string => {
  const names = name.split(' ').filter(n => n.length > 0);
  if (names.length === 0) return '?';
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
};

const getTeamStatusColor = (team: TeamAssignmentGroup): string => {
  if (!team.requiredMembers) return 'primary';
  if (team.members.length >= team.requiredMembers) return 'success';
  if (team.members.length > 0) return 'warning';
  return 'danger';
};

const getTeamStatusText = (team: TeamAssignmentGroup): string => {
  if (!team.requiredMembers) return 'Assigné';
  if (team.members.length >= team.requiredMembers) return 'Complet';
  if (team.members.length > 0) return 'Partiel';
  return 'Vide';
};

// Convert Firestore document to Service type
const convertServiceDoc = (id: string, data: any): Service => {
  return {
    id,
    title: data.title,
    date: data.date,
    time: data.time,
    endDate: data.endDate,
    endTime: data.endTime,
    category: data.category,
    isPublished: data.isPublished,
    availabilityDeadline: data.availabilityDeadline,
    teamRequirements: data.teamRequirements,
    guestMemberIds: data.guestMemberIds,
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toDate().toISOString()
      : data.createdAt,
    modifiedAt: data.modifiedAt instanceof Timestamp
      ? data.modifiedAt.toDate().toISOString()
      : data.modifiedAt
  };
};

// Convert Firestore assignment document
const convertAssignmentDoc = (id: string, data: any): ServiceAssignment => {
  return {
    id,
    serviceId: data.serviceId,
    memberId: data.memberId,
    memberName: data.memberName,
    teamId: data.teamId,
    teamName: data.teamName,
    assignedAt: data.assignedAt instanceof Timestamp
      ? data.assignedAt.toDate().toISOString()
      : data.assignedAt,
    assignedBy: data.assignedBy
  };
};

// Subscribe to realtime updates for the service
const subscribeToService = () => {
  const serviceRef = doc(db, 'services', serviceId.value);

  unsubscribeService = onSnapshot(
    serviceRef,
    async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const previousGuestIds = service.value?.guestMemberIds;
        service.value = convertServiceDoc(docSnapshot.id, docSnapshot.data());

        // Reload guest members if guest list changed
        const currentGuestIds = service.value?.guestMemberIds;
        if (JSON.stringify(previousGuestIds) !== JSON.stringify(currentGuestIds)) {
          await loadGuestMembers();
        }

        // Load guests on first load
        if (loading.value) {
          await loadGuestMembers();
        }
      } else {
        service.value = null;
      }
      loading.value = false;
    },
    (error) => {
      console.error('Error in service realtime listener:', error);
      loading.value = false;
    }
  );
};

// Subscribe to realtime updates for assignments
const subscribeToAssignments = () => {
  const assignmentsRef = collection(db, 'assignments');
  const q = query(assignmentsRef, where('serviceId', '==', serviceId.value));

  unsubscribeAssignments = onSnapshot(
    q,
    async (querySnapshot) => {
      const assignments: ServiceAssignment[] = [];
      querySnapshot.forEach((doc) => {
        assignments.push(convertAssignmentDoc(doc.id, doc.data()));
      });

      // Process assignments into team groups
      await processAssignments(assignments);
      loadingAssignments.value = false;
    },
    (error) => {
      console.error('Error in assignments realtime listener:', error);
      loadingAssignments.value = false;
    }
  );
};

// Process assignments into grouped team structure
const processAssignments = async (assignments: ServiceAssignment[]) => {
  if (assignments.length === 0) {
    teamAssignments.value = [];
    return;
  }

  // Get team requirements from service
  const teamRequirements = new Map<string, number>();
  if (service.value?.teamRequirements) {
    service.value.teamRequirements.forEach(req => {
      teamRequirements.set(req.teamName, req.membersNeeded);
    });
  }

  // Get member details for avatars
  const memberIds = [...new Set(assignments.map(a => a.memberId))];
  const memberDetails = new Map<string, Member>();

  await Promise.all(
    memberIds.map(async (memberId) => {
      try {
        const member = await membersService.getMemberById(memberId);
        if (member) {
          memberDetails.set(memberId, member);
        }
      } catch (error) {
        console.error(`Error loading member ${memberId}:`, error);
      }
    })
  );

  // Get admin names for "assigned by" info
  const adminIds = [...new Set(assignments.map(a => a.assignedBy).filter(Boolean))];
  const adminDetails = new Map<string, string>();

  await Promise.all(
    adminIds.map(async (adminId) => {
      if (adminId) {
        try {
          const admin = await membersService.getMemberById(adminId);
          if (admin) {
            adminDetails.set(adminId, admin.fullName);
          }
        } catch (error) {
          console.error(`Error loading admin ${adminId}:`, error);
        }
      }
    })
  );

  // Group assignments by team
  const groupedByTeam = assignments.reduce((acc, assignment) => {
    if (!acc[assignment.teamId]) {
      acc[assignment.teamId] = {
        teamId: assignment.teamId,
        teamName: assignment.teamName,
        members: [],
        requiredMembers: teamRequirements.get(assignment.teamName)
      };
    }

    const member = memberDetails.get(assignment.memberId);
    acc[assignment.teamId].members.push({
      ...assignment,
      avatar: member?.avatar,
      assignedByName: assignment.assignedBy ? adminDetails.get(assignment.assignedBy) : undefined
    });

    return acc;
  }, {} as Record<string, TeamAssignmentGroup>);

  // Sort teams alphabetically and members within each team
  teamAssignments.value = Object.values(groupedByTeam)
    .sort((a, b) => a.teamName.localeCompare(b.teamName))
    .map(team => ({
      ...team,
      members: team.members.sort((a, b) => a.memberName.localeCompare(b.memberName))
    }));
};

const loadGuestMembers = async () => {
  if (!service.value?.guestMemberIds || service.value.guestMemberIds.length === 0) {
    guestMembers.value = [];
    return;
  }

  try {
    const guests: Member[] = [];
    for (const memberId of service.value.guestMemberIds) {
      try {
        const member = await membersService.getMemberById(memberId);
        if (member) {
          guests.push(member);
        }
      } catch (error) {
        console.error(`Error loading guest member ${memberId}:`, error);
      }
    }
    guestMembers.value = guests.sort((a, b) => a.fullName.localeCompare(b.fullName));
  } catch (error) {
    console.error('Error loading guest members:', error);
    guestMembers.value = [];
  }
};

const goToScheduling = () => {
  router.push(`/scheduling?serviceId=${serviceId.value}`);
};

onMounted(() => {
  subscribeToService();
  subscribeToAssignments();
});

onUnmounted(() => {
  // Clean up realtime subscriptions
  if (unsubscribeService) {
    unsubscribeService();
    unsubscribeService = null;
  }
  if (unsubscribeAssignments) {
    unsubscribeAssignments();
    unsubscribeAssignments = null;
  }
});
</script>

<style scoped>
.service-header {
  padding: 16px;
  background: var(--ion-color-light);
  border-bottom: 1px solid var(--ion-color-light-shade);
}

.service-info-card {
  text-align: center;
}

.service-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--ion-color-dark);
  margin: 0 0 8px;
}

.service-datetime {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--ion-color-medium);
  font-size: 0.95rem;
  margin: 0;
}

.service-datetime ion-icon {
  font-size: 1.1rem;
}

.content-container {
  padding: 16px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  color: var(--ion-color-medium);
}

.loading-container p {
  margin-top: 16px;
  font-size: 0.95rem;
}

/* Summary Card */
.summary-card {
  margin-bottom: 16px;
}

.summary-stats {
  display: flex;
  justify-content: space-around;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  font-size: 2rem;
  color: var(--ion-color-primary);
}

.stat-details {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ion-color-dark);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
}

/* Teams List */
.teams-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.team-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.team-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.team-info {
  flex: 1;
  min-width: 0;
}

.team-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--ion-color-dark);
  margin: 0 0 4px;
}

.team-icon {
  font-size: 1.25rem;
  color: var(--ion-color-primary);
}

.team-card ion-card-subtitle {
  color: var(--ion-color-medium);
  font-size: 0.875rem;
}

/* Members List */
.members-list {
  padding: 0;
}

.member-item {
  --padding-start: 0;
  --inner-padding-end: 0;
  margin-bottom: 12px;
}

.member-item:last-child {
  margin-bottom: 0;
}

.member-item ion-avatar {
  width: 40px;
  height: 40px;
  margin-right: 12px;
}

.avatar-initials {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ion-color-primary);
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  border-radius: 50%;
}

.member-name {
  font-weight: 600;
  color: var(--ion-color-dark);
  margin: 0 0 4px;
}

.assigned-info {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  margin: 0;
}

.assigned-by {
  font-style: italic;
}

/* Missing Members Alert */
.missing-members-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fff9e6;
  border: 1px solid #f0e68c;
  border-radius: 8px;
  color: #b8860b;
  font-weight: 500;
  font-size: 0.875rem;
  margin-top: 12px;
}

.warning-icon {
  font-size: 1.25rem;
  color: #daa520;
}

/* Guests Section */
.guests-section {
  margin-top: 16px;
}

.guests-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-left: 4px solid var(--ion-color-tertiary);
}

.guest-icon {
  font-size: 1.25rem;
  color: var(--ion-color-tertiary);
}

.guest-stat-icon {
  color: var(--ion-color-tertiary);
}

.guest-info {
  font-size: 0.85rem;
  color: var(--ion-color-tertiary);
  margin: 0;
  font-style: italic;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 48px 16px;
}

.empty-state ion-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--ion-color-dark);
  margin: 0 0 8px;
}

.empty-state p {
  color: var(--ion-color-medium);
  margin: 0 0 24px;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .team-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .summary-stats {
    flex-direction: column;
    gap: 12px;
  }
  
  .stat-item {
    justify-content: flex-start;
  }
}
</style>