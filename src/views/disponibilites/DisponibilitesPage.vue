<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Disponibilités</ion-title>
        <ion-buttons slot="end" v-if="isAdmin">
          <ion-button @click="openAvailabilitySMSModal">
            <ion-icon slot="icon-only" :icon="chatbubbleEllipsesOutline"></ion-icon>
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

      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <ion-loading :is-open="loading" message="Chargement de vos disponibilités..."></ion-loading>

      <div class="ion-padding">
        <!-- Availabilities View -->
        <div class="availabilities-view">
          <div class="header-section">
            <p>Gérez votre disponibilité pour chaque service individuellement</p>
          </div>

          <!-- Filter Section -->
          <div class="filter-section">
            <!-- Team Filter (only show if user has multiple teams) -->
            <ion-select
              v-if="userTeamNames.length > 1"
              v-model="selectedTeam"
              interface="popover"
              placeholder="Toutes les équipes"
              class="team-filter"
            >
              <ion-select-option value="all">Toutes les équipes</ion-select-option>
              <ion-select-option
                v-for="team in userTeamNames"
                :key="team"
                :value="team"
              >
                {{ team }}
              </ion-select-option>
            </ion-select>

            <!-- Status Filter Chips -->
            <div class="status-filter">
              <ion-chip
                :color="selectedStatus === 'all' ? 'primary' : 'medium'"
                :outline="selectedStatus !== 'all'"
                @click="selectedStatus = 'all'"
              >
                Tous
              </ion-chip>
              <ion-chip
                :color="selectedStatus === 'available' ? 'success' : 'medium'"
                :outline="selectedStatus !== 'available'"
                @click="selectedStatus = 'available'"
              >
                <ion-icon :icon="thumbsUpOutline" slot="start" />
                Dispo
              </ion-chip>
              <ion-chip
                :color="selectedStatus === 'unavailable' ? 'danger' : 'medium'"
                :outline="selectedStatus !== 'unavailable'"
                @click="selectedStatus = 'unavailable'"
              >
                <ion-icon :icon="thumbsDownOutline" slot="start" />
                Indispo
              </ion-chip>
              <ion-chip
                :color="selectedStatus === 'assigned' ? 'success' : 'medium'"
                :outline="selectedStatus !== 'assigned'"
                @click="selectedStatus = 'assigned'"
              >
                <ion-icon :icon="checkmarkCircleOutline" slot="start" />
                Assigné
              </ion-chip>
              <ion-chip
                :color="selectedStatus === 'unanswered' ? 'warning' : 'medium'"
                :outline="selectedStatus !== 'unanswered'"
                @click="selectedStatus = 'unanswered'"
              >
                Sans réponse
              </ion-chip>
            </div>
          </div>

          <!-- Services List -->
          <div class="services-list" v-if="filteredServices.length > 0">
            <div
              v-for="service in filteredServices"
              :key="service.id"
              class="service-card"
              :class="{
                'available': !isUserAssignedToService(service.id) && getServiceAvailability(service.id) === 'available',
                'unavailable': !isUserAssignedToService(service.id) && getServiceAvailability(service.id) === 'unavailable',
                'assigned': isUserAssignedToService(service.id)
              }"
            >
              <div class="service-info">
                <h3 class="service-title">{{ service.title }}</h3>
                <p class="service-datetime">
                  {{ formatServiceDateTime(service.date, service.time) }}
                  <span v-if="service.endDate && service.endTime" class="service-duration">
                    ({{ calculateDuration(service.date, service.time, service.endDate, service.endTime) }})
                  </span>
                </p>
                <div v-if="getUserTeamsForService(service).length > 0" class="service-teams">
                  <ion-chip
                    v-for="teamName in getUserTeamsForService(service)"
                    :key="teamName"
                    color="primary"
                    size="small"
                  >
                    <ion-label>{{ teamName }}</ion-label>
                  </ion-chip>
                </div>
              </div>
              
              <!-- Show availability buttons only if not assigned -->
              <div v-if="!isUserAssignedToService(service.id)" class="availability-buttons">
                <ion-button
                  fill="clear"
                  size="large"
                  class="availability-btn thumbs-up"
                  :class="{ 'selected': getServiceAvailability(service.id) === 'available' }"
                  @click="setAvailability(service.id, 'available')"
                >
                  <ion-icon :icon="thumbsUpOutline"></ion-icon>
                </ion-button>
                
                <ion-button
                  fill="clear"
                  size="large"
                  class="availability-btn thumbs-down"
                  :class="{ 'selected': getServiceAvailability(service.id) === 'unavailable' }"
                  @click="setAvailability(service.id, 'unavailable')"
                >
                  <ion-icon :icon="thumbsDownOutline"></ion-icon>
                </ion-button>
              </div>

              <!-- Show locked message if assigned -->
              <div v-else class="assignment-notice">
                <ion-icon :icon="checkmarkCircleOutline" class="assigned-icon" />
                <span>Assigné</span>
              </div>
            </div>
          </div>

          <!-- No services message -->
          <div v-if="filteredServices.length === 0 && !loading" class="no-services">
            <ion-icon :icon="calendarOutline" color="medium"></ion-icon>
            <p v-if="availableServices.length === 0">Aucun service disponible pour le moment</p>
            <p v-else>Aucun service ne correspond aux filtres sélectionnés</p>
          </div>
        </div>

      </div>
    </ion-content>

    <!-- Availability Request SMS Modal -->
    <AvailabilityRequestSMSModal
      :is-open="showAvailabilitySMSModal"
      @close="closeAvailabilitySMSModal"
      @sent="onAvailabilitySMSSent"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonIcon, IonRefresher, IonRefresherContent, IonLoading, IonLabel,
  IonChip, IonButtons, IonSelect, IonSelectOption, toastController, alertController
} from '@ionic/vue';
import {
  thumbsUpOutline, thumbsDownOutline, calendarOutline,
  checkmarkCircleOutline, chatbubbleEllipsesOutline
} from 'ionicons/icons';
import AvailabilityRequestSMSModal from '@/components/AvailabilityRequestSMSModal.vue';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useUser } from '@/composables/useUser';
import { membersService } from '@/firebase/members';
import { teamsService } from '@/firebase/teams';
import { timezoneUtils } from '@/utils/timezone';
import type { Service } from '@/types/service';
import type { ServiceAssignment } from '@/types/assignment';

const { member } = useUser();
const loading = ref(true);
const allServices = ref<Service[]>([]);
const userTeamNames = ref<string[]>([]);
const userAssignments = ref<ServiceAssignment[]>([]);
const currentAvailabilities = ref<{ [serviceId: string]: 'available' | 'unavailable' | 'maybe' | null }>({});
const originalAvailabilities = ref<{ [serviceId: string]: 'available' | 'unavailable' | 'maybe' | null }>({});
const showAvailabilitySMSModal = ref(false);

// Filter state
const selectedTeam = ref<string>('all');
const selectedStatus = ref<'all' | 'available' | 'unavailable' | 'assigned' | 'unanswered'>('all');

// Realtime subscription cleanup
let unsubscribeServices: (() => void) | null = null;
let unsubscribeAssignments: (() => void) | null = null;

// Check if current user is admin
const isAdmin = computed(() => member.value?.isAdmin || false);

// Convert Firestore document to Service type
const convertServiceDoc = (id: string, data: any): Service => {
  return {
    id,
    title: data.title,
    date: data.date,
    time: data.time,
    endDate: data.endDate || data.date,
    endTime: data.endTime || data.time,
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

// Computed: filter services based on user's teams and upcoming only
const availableServices = computed(() => {
  if (!allServices.value.length) return [];

  const now = new Date();
  const nowTime = now.getTime();

  return allServices.value
    .filter(service => service.isPublished)
    .map(service => {
      const parsedDateTime = new Date(`${service.date}T${service.time}:00`);
      // Calculate end datetime for past threshold
      const endDateTime = service.endDate && service.endTime
        ? new Date(`${service.endDate}T${service.endTime}:00`)
        : parsedDateTime;
      const pastThreshold = new Date(endDateTime.getTime() + 60 * 60 * 1000);
      return {
        ...service,
        parsedDateTime,
        pastThreshold
      };
    })
    .filter(service => {
      // Filter by date - show until 1 hour after end
      if (service.pastThreshold.getTime() <= nowTime) return false;

      // Filter by user membership in needed teams
      if (service.teamRequirements && service.teamRequirements.length > 0) {
        const activeTeamNames = service.teamRequirements
          .filter(req => req.isActive)
          .map(req => req.teamName);

        // Only show service if user is member of at least one needed team
        return activeTeamNames.some(teamName => userTeamNames.value.includes(teamName));
      }

      // If no team requirements, show the service
      return true;
    })
    .sort((a, b) => a.parsedDateTime.getTime() - b.parsedDateTime.getTime());
});

// Helper functions
const formatServiceDateTime = (date: string, time: string) => {
  return timezoneUtils.formatDateTimeForDisplay(date, time);
};

// Calculate duration between start and end datetime in HH:MM format
const calculateDuration = (startDate: string, startTime: string, endDate: string, endTime: string): string => {
  const start = new Date(`${startDate}T${startTime}:00`);
  const end = new Date(`${endDate}T${endTime}:00`);

  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return '00:00';

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Get user's teams that are required for a service
const getUserTeamsForService = (service: Service): string[] => {
  if (!service.teamRequirements || service.teamRequirements.length === 0) {
    return [];
  }

  const activeTeamNames = service.teamRequirements
    .filter(req => req.isActive)
    .map(req => req.teamName);

  // Return only the teams that the user belongs to
  return activeTeamNames.filter(teamName => userTeamNames.value.includes(teamName));
};

const getServiceAvailability = (serviceId: string): 'available' | 'unavailable' | 'maybe' | null => {
  return currentAvailabilities.value[serviceId] || null;
};

const isUserAssignedToService = (serviceId: string): boolean => {
  return userAssignmentSet.value.has(serviceId);
};

// Memoize assignment lookups for better performance
const userAssignmentSet = computed(() => {
  return new Set(userAssignments.value.map(assignment => assignment.serviceId));
});

// Filtered services based on team and status filters
const filteredServices = computed(() => {
  let services = availableServices.value;

  // Filter by team
  if (selectedTeam.value !== 'all') {
    services = services.filter(service => {
      const userTeamsForService = getUserTeamsForService(service);
      return userTeamsForService.includes(selectedTeam.value);
    });
  }

  // Filter by status
  if (selectedStatus.value !== 'all') {
    services = services.filter(service => {
      const availability = getServiceAvailability(service.id);
      const isAssigned = isUserAssignedToService(service.id);

      switch (selectedStatus.value) {
        case 'available': return availability === 'available' && !isAssigned;
        case 'unavailable': return availability === 'unavailable' && !isAssigned;
        case 'assigned': return isAssigned;
        case 'unanswered': return !availability && !isAssigned;
        default: return true;
      }
    });
  }

  return services;
});

// Check if two time ranges overlap
const doServicesOverlap = (service1: Service, service2: Service): boolean => {
  const start1 = new Date(`${service1.date}T${service1.time}:00`).getTime();
  const end1 = new Date(`${service1.endDate}T${service1.endTime}:00`).getTime();
  const start2 = new Date(`${service2.date}T${service2.time}:00`).getTime();
  const end2 = new Date(`${service2.endDate}T${service2.endTime}:00`).getTime();

  // Two ranges overlap if start1 < end2 AND start2 < end1
  return start1 < end2 && start2 < end1;
};

// Find services that conflict (overlap in time) with the given service
// Returns services where user is available or hasn't answered (excluding assigned services)
const findConflictingServices = (serviceId: string): { canChange: Service[], assigned: Service[] } => {
  const targetService = allServices.value.find(s => s.id === serviceId);
  if (!targetService) return { canChange: [], assigned: [] };

  const canChange: Service[] = [];
  const assigned: Service[] = [];

  allServices.value.forEach(service => {
    // Skip the same service
    if (service.id === serviceId) return;

    // Check if times overlap
    if (!doServicesOverlap(targetService, service)) return;

    const availability = getServiceAvailability(service.id);
    const isAssigned = isUserAssignedToService(service.id);

    // Skip services where user is already unavailable
    if (availability === 'unavailable') return;

    // Separate assigned services (can't change) from others
    if (isAssigned) {
      assigned.push(service);
    } else if (availability === 'available' || availability === null) {
      canChange.push(service);
    }
  });

  return { canChange, assigned };
};

// Format conflict service info for alert display
const formatConflictService = (service: Service): string => {
  const teams = getUserTeamsForService(service);
  const teamText = teams.length > 0 ? `\n   ${teams.join(', ')}` : '';
  const dateTime = formatServiceDateTime(service.date, service.time);
  return `• ${service.title}\n   ${dateTime}${teamText}`;
};

const setAvailability = async (serviceId: string, availability: 'available' | 'unavailable') => {
  if (!member.value) return;

  const currentValue = getServiceAvailability(serviceId);
  const newValue = currentValue === availability ? null : availability;

  // If setting to available, check for conflicts
  if (newValue === 'available') {
    const { canChange, assigned } = findConflictingServices(serviceId);

    // Block if user is already assigned to a conflicting service (no double booking)
    if (assigned.length > 0) {
      const details = assigned.map(formatConflictService).join('\n\n');
      const alert = await alertController.create({
        header: 'Double réservation impossible',
        message: `Vous êtes déjà assigné à ${assigned.length > 1 ? 'des services qui se chevauchent' : 'un service qui se chevauche'}:\n\n${details}\n\nVous ne pouvez pas vous déclarer disponible pour ce service.`,
        cssClass: 'conflict-alert',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    // If there are availability conflicts (available or unanswered), show warning
    if (canChange.length > 0) {
      const header = canChange.length > 1
        ? 'Services en conflit (seront marqués indisponibles):'
        : 'Service en conflit (sera marqué indisponible):';
      const details = canChange.map(formatConflictService).join('\n\n');

      const alert = await alertController.create({
        header: 'Conflit de disponibilité',
        message: `${header}\n\n${details}\n\nVoulez-vous continuer?`,
        cssClass: 'conflict-alert',
        buttons: [
          {
            text: 'Annuler',
            role: 'cancel'
          },
          {
            text: 'Confirmer',
            role: 'confirm'
          }
        ]
      });

      await alert.present();
      const { role } = await alert.onDidDismiss();

      if (role !== 'confirm') {
        return;
      }

      // User confirmed - update conflicting services to unavailable
      await updateAvailabilityWithConflicts(serviceId, newValue, canChange);
      return;
    }
  }

  // No conflicts or setting to unavailable/null - proceed normally
  await updateSingleAvailability(serviceId, newValue);
};

// Update a single service availability
const updateSingleAvailability = async (serviceId: string, newValue: 'available' | 'unavailable' | null) => {
  if (!member.value) return;

  // Update local state immediately for better UX
  currentAvailabilities.value[serviceId] = newValue;

  try {
    const existingAvailabilities = member.value.availabilities || {};
    const updatedAvailabilities = { ...existingAvailabilities };

    if (newValue === null) {
      delete updatedAvailabilities[serviceId];
    } else {
      updatedAvailabilities[serviceId] = newValue;
    }

    const updatedMember = await membersService.updateMember(member.value.id, {
      availabilities: updatedAvailabilities
    });

    if (updatedMember) {
      member.value = updatedMember;
      originalAvailabilities.value = { ...updatedMember.availabilities };
      currentAvailabilities.value = { ...updatedMember.availabilities };
    }

    const statusText = newValue === 'available' ? 'Disponible' :
                      newValue === 'unavailable' ? 'Indisponible' : 'Effacée';
    await showToast(`Disponibilité mise à jour: ${statusText}`, 'success');
  } catch (error) {
    console.error('Error updating availability:', error);
    loadMemberAvailabilities();
    await showToast('Erreur lors de la mise à jour', 'danger');
  }
};

// Update availability for target service and set conflicting services to unavailable
const updateAvailabilityWithConflicts = async (
  serviceId: string,
  newValue: 'available' | 'unavailable' | null,
  conflicts: Service[]
) => {
  if (!member.value) return;

  // Update local state immediately for better UX
  currentAvailabilities.value[serviceId] = newValue;
  conflicts.forEach(conflict => {
    currentAvailabilities.value[conflict.id] = 'unavailable';
  });

  try {
    const existingAvailabilities = member.value.availabilities || {};
    const updatedAvailabilities = { ...existingAvailabilities };

    // Set target service availability
    if (newValue === null) {
      delete updatedAvailabilities[serviceId];
    } else {
      updatedAvailabilities[serviceId] = newValue;
    }

    // Set all conflicting services to unavailable
    conflicts.forEach(conflict => {
      updatedAvailabilities[conflict.id] = 'unavailable';
    });

    const updatedMember = await membersService.updateMember(member.value.id, {
      availabilities: updatedAvailabilities
    });

    if (updatedMember) {
      member.value = updatedMember;
      originalAvailabilities.value = { ...updatedMember.availabilities };
      currentAvailabilities.value = { ...updatedMember.availabilities };
    }

    const conflictText = conflicts.length > 1
      ? `${conflicts.length} services en conflit marqués indisponibles`
      : '1 service en conflit marqué indisponible';
    await showToast(`Disponibilité mise à jour. ${conflictText}`, 'success');
  } catch (error) {
    console.error('Error updating availabilities:', error);
    loadMemberAvailabilities();
    await showToast('Erreur lors de la mise à jour', 'danger');
  }
};

// Load user's team names by checking team membership in Team documents
const loadUserTeamNames = async () => {
  if (!member.value?.id) {
    userTeamNames.value = [];
    return;
  }

  try {
    // Use getMemberTeams which checks the Team document's members array
    const teams = await teamsService.getMemberTeams(member.value.id);
    // Only include teams where the member has approved status
    userTeamNames.value = teams
      .filter(team => {
        const membership = team.members.find(m => m.memberId === member.value!.id);
        return membership && (membership.status === 'approved' || !membership.status);
      })
      .map(team => team.name);
  } catch (error) {
    console.error('Error loading user team names:', error);
    userTeamNames.value = [];
  }
};

// Subscribe to realtime updates for services
const subscribeToServices = () => {
  const servicesRef = collection(db, 'services');
  const q = query(servicesRef, orderBy('createdAt', 'desc'));

  unsubscribeServices = onSnapshot(
    q,
    (querySnapshot) => {
      const loadedServices: Service[] = [];
      querySnapshot.forEach((doc) => {
        loadedServices.push(convertServiceDoc(doc.id, doc.data()));
      });
      allServices.value = loadedServices;
      loading.value = false;
    },
    (error) => {
      console.error('Error in services realtime listener:', error);
      loading.value = false;
    }
  );
};

const loadMemberAvailabilities = () => {
  if (member.value) {
    const memberAvailabilities = member.value.availabilities || {};
    currentAvailabilities.value = { ...memberAvailabilities };
    originalAvailabilities.value = { ...memberAvailabilities };
  }
};

// Subscribe to realtime updates for user assignments
const subscribeToAssignments = () => {
  if (!member.value?.id) return;

  // Unsubscribe from previous subscription if exists
  if (unsubscribeAssignments) {
    unsubscribeAssignments();
  }

  const assignmentsRef = collection(db, 'assignments');
  const q = query(assignmentsRef, where('memberId', '==', member.value.id));

  unsubscribeAssignments = onSnapshot(
    q,
    (querySnapshot) => {
      userAssignments.value = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          assignedAt: data.assignedAt?.toDate?.()?.toISOString() || data.assignedAt
        } as ServiceAssignment;
      });
    },
    (error) => {
      console.error('Error in assignments realtime listener:', error);
    }
  );
};


const handleRefresh = async (event: any) => {
  // With realtime updates, data is always fresh
  // Just reload team names and availabilities
  try {
    await loadUserTeamNames();
    loadMemberAvailabilities();
  } catch (error) {
    console.error('Error during refresh:', error);
  } finally {
    event.target.complete();
  }
};

const showToast = async (message: string, color: 'success' | 'danger' = 'success') => {
  const toast = await toastController.create({
    message,
    duration: 3000,
    position: 'top',
    color
  });
  await toast.present();
};

// Watch for member data changes
watch(() => member.value, (newMember) => {
  if (newMember) {
    loadMemberAvailabilities();
    loadUserTeamNames();
    subscribeToAssignments();
  }
}, { immediate: true });

// SMS Modal methods
const openAvailabilitySMSModal = () => {
  showAvailabilitySMSModal.value = true;
};

const closeAvailabilitySMSModal = () => {
  showAvailabilitySMSModal.value = false;
};

const onAvailabilitySMSSent = async () => {
  const toast = await toastController.create({
    message: 'Demandes de disponibilités envoyées avec succès',
    duration: 3000,
    color: 'success',
    position: 'top'
  });
  await toast.present();
};

onMounted(() => {
  // Subscribe to realtime services updates
  subscribeToServices();
  loadUserTeamNames();
});

onUnmounted(() => {
  // Clean up realtime subscriptions
  if (unsubscribeServices) {
    unsubscribeServices();
    unsubscribeServices = null;
  }
  if (unsubscribeAssignments) {
    unsubscribeAssignments();
    unsubscribeAssignments = null;
  }
});
</script>

<style scoped>
.header-section {
  margin-bottom: 2rem;
}

.header-section h2 {
  color: #111827;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.header-section p {
  color: #6B7280;
  font-size: 1rem;
  margin: 0 0 1rem 0;
}

.filter-section {
  margin-bottom: 1.5rem;
}

.team-filter {
  width: 100%;
  margin-bottom: 1rem;
  --background: #F3F4F6;
  --border-radius: 8px;
  --padding-start: 12px;
  --padding-end: 12px;
}

.status-filter {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  -webkit-overflow-scrolling: touch;
}

.status-filter::-webkit-scrollbar {
  display: none;
}

.status-filter ion-chip {
  flex-shrink: 0;
  cursor: pointer;
}

.services-list {
  margin-bottom: 2rem;
}

.service-card {
  background: #FFFFFF;
  border: 2px solid #E5E7EB;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
}

@media (max-width: 768px) {
  .service-card {
    flex-direction: column;
    align-items: stretch;
  }

  .service-info {
    margin-bottom: 1rem;
    text-align: center;
  }

  .availability-buttons {
    justify-content: center;
    gap: 1rem;
  }
}

/* No answer = Border grey, no background (default style above) */

/* Available = Border green, no background */
.service-card.available {
  background: #FFFFFF;
  border-color: #10B981;
}

/* Unavailable = Border red, no background */
.service-card.unavailable {
  background: #FFFFFF;
  border-color: #EF4444;
}

/* Assigned = Border green, background light green */
.service-card.assigned {
  background: #ECFDF5;
  border-color: #10B981;
}

.service-info {
  flex: 1;
}

.service-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.service-datetime {
  font-size: 0.875rem;
  color: #6B7280;
  margin: 0 0 0.5rem 0;
}

.service-duration {
  color: var(--ion-color-medium);
  font-weight: 500;
  margin-left: 4px;
}

.service-teams {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.service-teams ion-chip {
  --background: #E5E7EB;
  --color: #111827;
  font-size: 0.75rem;
  height: 24px;
}

.availability-buttons {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.availability-btn {
  --color: #9CA3AF;
  --color-hover: #6B7280;
  width: 5rem;
  height: 5rem;
  --border-radius: 50%;
}

.availability-btn ion-icon {
  font-size: 2.5rem;
}

.availability-btn.thumbs-up.selected {
  --color: #10B981;
  --background: #ECFDF5;
}

.availability-btn.thumbs-down.selected {
  --color: #EF4444;
  --background: #FEF2F2;
}

.assignment-notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #059669;
  font-weight: 500;
}

.assigned-icon {
  font-size: 1.5rem;
  color: #059669;
}

.no-services {
  text-align: center;
  padding: 3rem 2rem;
  color: #6B7280;
}

.no-services ion-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}
</style>

<style>
/* Global styles for conflict alert (must be unscoped) */
.conflict-alert .alert-message {
  white-space: pre-line;
  text-align: left;
  font-size: 0.9rem;
  line-height: 1.5;
}

.conflict-alert .alert-message {
  max-height: 60vh;
  overflow-y: auto;
}
</style>
