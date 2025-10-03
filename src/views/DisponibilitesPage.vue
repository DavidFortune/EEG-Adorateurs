<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Disponibilités</ion-title>
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

            <!-- Segment Control -->
            <ion-segment v-model="selectedSegment" mode="ios">
              <ion-segment-button value="all">
                <ion-label>Tous</ion-label>
              </ion-segment-button>
              <ion-segment-button value="answered">
                <ion-label>Répondu</ion-label>
              </ion-segment-button>
              <ion-segment-button value="unanswered">
                <ion-label>Sans réponse</ion-label>
              </ion-segment-button>
            </ion-segment>
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
                <p class="service-datetime">{{ formatServiceDateTime(service.date, service.time) }}</p>
                <div v-if="isUserAssignedToService(service.id)" class="assigned-badge">
                  <ion-chip color="success" size="small">
                    <ion-icon :icon="checkmarkCircleOutline" />
                    <ion-label>Vous êtes assigné</ion-label>
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
            <p>{{ getNoServicesMessage() }}</p>
          </div>
        </div>

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonIcon, IonRefresher, IonRefresherContent, IonLoading, IonLabel,
  IonChip, IonSegment, IonSegmentButton, toastController
} from '@ionic/vue';
import {
  thumbsUpOutline, thumbsDownOutline, calendarOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';
import { 
  collection, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useUser } from '@/composables/useUser';
import { serviceService } from '@/services/serviceService';
import { membersService } from '@/firebase/members';
import { teamsService } from '@/firebase/teams';
import { timezoneUtils } from '@/utils/timezone';
import type { Service } from '@/types/service';
import type { ServiceAssignment } from '@/types/assignment';

const { member } = useUser();
const loading = ref(false);
const availableServices = ref<Service[]>([]);
const userAssignments = ref<ServiceAssignment[]>([]);
const currentAvailabilities = ref<{ [serviceId: string]: 'available' | 'unavailable' | 'maybe' | null }>({});
const originalAvailabilities = ref<{ [serviceId: string]: 'available' | 'unavailable' | 'maybe' | null }>({});
const selectedSegment = ref<'all' | 'answered' | 'unanswered'>('all');

// Helper functions
const formatServiceDateTime = (date: string, time: string) => {
  return timezoneUtils.formatDateTimeForDisplay(date, time);
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

const filteredServices = computed(() => {
  const services = availableServices.value;
  const assignmentSet = userAssignmentSet.value;
  const segment = selectedSegment.value;

  if (segment === 'all') {
    return services;
  }

  return services.filter(service => {
    const availability = getServiceAvailability(service.id);
    const isAssigned = assignmentSet.has(service.id);

    if (segment === 'answered') {
      return availability === 'available' || availability === 'unavailable' || isAssigned;
    } else { // unanswered
      return availability === null && !isAssigned;
    }
  });
});

const getNoServicesMessage = (): string => {
  if (selectedSegment.value === 'answered') {
    return "Aucun service avec réponse";
  } else if (selectedSegment.value === 'unanswered') {
    return "Aucun service sans réponse";
  }
  return "Aucun service disponible pour le moment";
};

const setAvailability = async (serviceId: string, availability: 'available' | 'unavailable') => {
  if (!member.value) return;

  const currentValue = getServiceAvailability(serviceId);
  const newValue = currentValue === availability ? null : availability;

  // Update local state immediately for better UX
  currentAvailabilities.value[serviceId] = newValue;

  try {
    // Ensure we start with existing availabilities or an empty object
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

    // Update the member value with the returned data from the server
    if (updatedMember) {
      member.value = updatedMember;
      // Update the original availabilities to reflect the saved state
      originalAvailabilities.value = { ...updatedMember.availabilities };
      currentAvailabilities.value = { ...updatedMember.availabilities };
    }

    const statusText = newValue === 'available' ? 'Disponible' :
                      newValue === 'unavailable' ? 'Indisponible' : 'Effacée';
    await showToast(`Disponibilité mise à jour: ${statusText}`, 'success');
  } catch (error) {
    console.error('Error updating availability:', error);
    // Revert local state on error
    loadMemberAvailabilities();
    await showToast('Erreur lors de la mise à jour', 'danger');
  }
};

const loadServices = async () => {
  loading.value = true;
  try {
    const services = await serviceService.getPublishedServices();
    const now = new Date();
    const nowTime = now.getTime();
    const userTeamIds = member.value?.teams || [];

    // Get team names for user's team IDs
    let userTeamNames: string[] = [];
    if (userTeamIds.length > 0) {
      const teamPromises = userTeamIds.map(teamId => teamsService.getTeamById(teamId));
      const teams = await Promise.all(teamPromises);
      userTeamNames = teams.filter(team => team !== null).map(team => team!.name);
    }

    // Optimize date parsing and filtering
    availableServices.value = services
      .map(service => ({
        ...service,
        parsedDateTime: new Date(`${service.date}T${service.time}:00`)
      }))
      .filter(service => {
        // Filter by date
        if (service.parsedDateTime.getTime() <= nowTime) return false;

        // Filter by user membership in needed teams
        if (service.teamRequirements && service.teamRequirements.length > 0) {
          const activeTeamNames = service.teamRequirements
            .filter(req => req.isActive)
            .map(req => req.teamName);

          // Only show service if user is member of at least one needed team
          return activeTeamNames.some(teamName => userTeamNames.includes(teamName));
        }

        // If no team requirements, show the service
        return true;
      })
      .sort((a, b) => a.parsedDateTime.getTime() - b.parsedDateTime.getTime());
  } catch (error) {
    console.error('Error loading services:', error);
    await showToast('Erreur lors du chargement des services', 'danger');
  } finally {
    loading.value = false;
  }
};

const loadMemberAvailabilities = () => {
  if (member.value) {
    const memberAvailabilities = member.value.availabilities || {};
    currentAvailabilities.value = { ...memberAvailabilities };
    originalAvailabilities.value = { ...memberAvailabilities };
  }
};

const loadUserAssignments = async () => {
  if (!member.value) return;
  
  try {
    const q = query(
      collection(db, 'assignments'),
      where('memberId', '==', member.value.id)
    );
    const querySnapshot = await getDocs(q);
    userAssignments.value = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        assignedAt: data.assignedAt?.toDate?.()?.toISOString() || data.assignedAt
      } as ServiceAssignment;
    });
  } catch (error) {
    console.error('Error loading user assignments:', error);
  }
};


const handleRefresh = async (event: any) => {
  try {
    await Promise.all([
      loadServices(),
      loadUserAssignments()
    ]);
    loadMemberAvailabilities();
  } catch (error) {
    console.error('Error during refresh:', error);
    await showToast('Erreur lors de l\'actualisation', 'danger');
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
    loadUserAssignments();
  }
}, { immediate: true });

onMounted(async () => {
  await Promise.all([
    loadServices(),
    loadUserAssignments()
  ]);
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

.header-section ion-segment {
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  --background: #F3F4F6;
  border-radius: 8px;
  padding: 2px;
}

.header-section ion-segment-button {
  --indicator-color: #FFFFFF;
  --color: #6B7280;
  --color-checked: #111827;
  font-weight: 500;
  font-size: 0.875rem;
  min-height: 36px;
  --padding-top: 8px;
  --padding-bottom: 8px;
  --border-radius: 6px;
}

.header-section ion-segment-button.segment-button-checked {
  --background: #FFFFFF;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
  margin: 0;
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

.assigned-badge {
  margin-top: 0.5rem;
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
