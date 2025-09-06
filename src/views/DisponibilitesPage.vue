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
        <!-- Segment Control -->
        <div class="segment-container">
          <ion-segment v-model="selectedSegment" @ionChange="onSegmentChange">
            <ion-segment-button value="availabilities">
              <ion-label>Mes disponibilités</ion-label>
            </ion-segment-button>
            <ion-segment-button value="assignments">
              <ion-label>Mes assignations</ion-label>
            </ion-segment-button>
          </ion-segment>
        </div>

        <!-- Availabilities View -->
        <div v-if="selectedSegment === 'availabilities'" class="availabilities-view">
          <div class="header-section">
            <h2>Vos disponibilités</h2>
            <p>Gérez votre disponibilité pour chaque service individuellement</p>
            
            <!-- Navigation to detailed availability submission -->
            <ion-button 
              expand="block" 
              fill="outline" 
              @click="goToAvailabilitySubmission"
              class="submission-button"
            >
              <ion-icon :icon="createOutline" slot="start" />
              Gérer mes disponibilités détaillées
            </ion-button>
          </div>

          <!-- Services List -->
          <div class="services-list" v-if="availableServices.length > 0">
            <div 
              v-for="service in availableServices" 
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
          <div v-if="availableServices.length === 0 && !loading" class="no-services">
            <ion-icon :icon="calendarOutline" color="medium"></ion-icon>
            <p>Aucun service disponible pour le moment</p>
          </div>
        </div>

        <!-- Assignments View -->
        <div v-if="selectedSegment === 'assignments'" class="assignments-view">
          <div class="header-section">
            <h2>Vos assignations</h2>
            <p>Consultez les services pour lesquels vous êtes assigné</p>
          </div>

          <!-- Assignments List -->
          <div class="assignments-list" v-if="userAssignments.length > 0">
            <ion-card 
              v-for="assignment in sortedAssignments" 
              :key="assignment.id"
              class="assignment-card"
            >
              <ion-card-header>
                <div class="assignment-header">
                  <div class="service-info">
                    <ion-card-title class="service-title">
                      {{ getServiceById(assignment.serviceId)?.title || 'Service inconnu' }}
                    </ion-card-title>
                    <ion-card-subtitle class="service-datetime">
                      <ion-icon :icon="calendarOutline" />
                      {{ formatAssignmentDateTime(assignment.serviceId) }}
                    </ion-card-subtitle>
                  </div>
                  <ion-chip color="success" class="assignment-chip">
                    <ion-icon :icon="checkmarkCircleOutline" />
                    <ion-label>Assigné</ion-label>
                  </ion-chip>
                </div>
              </ion-card-header>
              
              <ion-card-content>
                <div class="assignment-details">
                  <div class="team-info">
                    <ion-icon :icon="peopleOutline" class="team-icon" />
                    <span class="team-name">{{ assignment.teamName }}</span>
                  </div>
                  <div class="assignment-meta">
                    <span class="assigned-date">
                      Assigné le {{ formatAssignedDate(assignment.assignedAt) }}
                    </span>
                  </div>
                </div>
              </ion-card-content>
            </ion-card>
          </div>

          <!-- No assignments message -->
          <div v-if="userAssignments.length === 0 && !loading" class="no-assignments">
            <ion-icon :icon="checkmarkCircleOutline" color="medium"></ion-icon>
            <h3>Aucune assignation</h3>
            <p>Vous n'êtes assigné à aucun service pour le moment</p>
          </div>
        </div>

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonIcon, IonRefresher, IonRefresherContent, IonLoading, IonSegment,
  IonSegmentButton, IonLabel, IonCard, IonCardHeader, IonCardTitle,
  IonCardSubtitle, IonCardContent, IonChip, toastController
} from '@ionic/vue';
import {
  thumbsUpOutline, thumbsDownOutline, calendarOutline, createOutline,
  checkmarkCircleOutline, peopleOutline
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
import { timezoneUtils } from '@/utils/timezone';
import type { Service } from '@/types/service';
import type { ServiceAssignment } from '@/types/assignment';

const { member } = useUser();
const router = useRouter();
const loading = ref(false);
const selectedSegment = ref('availabilities');
const availableServices = ref<Service[]>([]);
const userAssignments = ref<ServiceAssignment[]>([]);
const currentAvailabilities = ref<{ [serviceId: string]: 'available' | 'unavailable' | null }>({});
const originalAvailabilities = ref<{ [serviceId: string]: 'available' | 'unavailable' | null }>({});


// Computed properties
const sortedAssignments = computed(() => {
  return userAssignments.value
    .filter(assignment => {
      const service = getServiceById(assignment.serviceId);
      if (!service) return false;
      const serviceDate = new Date(`${service.date}T${service.time}:00`);
      return serviceDate >= new Date();
    })
    .sort((a, b) => {
      const serviceA = getServiceById(a.serviceId);
      const serviceB = getServiceById(b.serviceId);
      if (!serviceA || !serviceB) return 0;
      const dateA = new Date(`${serviceA.date}T${serviceA.time}:00`);
      const dateB = new Date(`${serviceB.date}T${serviceB.time}:00`);
      return dateA.getTime() - dateB.getTime();
    });
});

// Helper functions
const formatServiceDateTime = (date: string, time: string) => {
  return timezoneUtils.formatDateTimeForDisplay(date, time);
};

const getServiceAvailability = (serviceId: string): 'available' | 'unavailable' | null => {
  return currentAvailabilities.value[serviceId] || null;
};

const getServiceById = (serviceId: string): Service | undefined => {
  return availableServices.value.find(service => service.id === serviceId);
};

const formatAssignmentDateTime = (serviceId: string): string => {
  const service = getServiceById(serviceId);
  if (!service) return 'Date inconnue';
  return formatServiceDateTime(service.date, service.time);
};

const formatAssignedDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const isUserAssignedToService = (serviceId: string): boolean => {
  return userAssignments.value.some(assignment => assignment.serviceId === serviceId);
};

const onSegmentChange = () => {
  // Segment change is handled by reactivity
};

const setAvailability = async (serviceId: string, availability: 'available' | 'unavailable') => {
  if (!member.value) return;
  
  const currentValue = getServiceAvailability(serviceId);
  const newValue = currentValue === availability ? null : availability;
  
  // Update local state immediately for better UX
  currentAvailabilities.value[serviceId] = newValue;
  
  try {
    // Update member's availabilities in database
    const updatedAvailabilities = { ...member.value.availabilities };
    if (newValue === null) {
      delete updatedAvailabilities[serviceId];
    } else {
      updatedAvailabilities[serviceId] = newValue;
    }
    
    await membersService.updateMember(member.value.id, {
      availabilities: updatedAvailabilities
    });
    
    // Update the original availabilities to reflect the saved state
    originalAvailabilities.value = { ...updatedAvailabilities };
    
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
    availableServices.value = services.filter(service => {
      const serviceDate = new Date(`${service.date}T${service.time}:00`);
      return serviceDate > now;
    });
  } catch (error) {
    console.error('Error loading services:', error);
    await showToast('Erreur lors du chargement des services', 'danger');
  } finally {
    loading.value = false;
  }
};

const loadMemberAvailabilities = () => {
  if (member.value) {
    currentAvailabilities.value = { ...member.value.availabilities };
    originalAvailabilities.value = { ...member.value.availabilities };
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
  await Promise.all([
    loadServices(),
    loadUserAssignments()
  ]);
  loadMemberAvailabilities();
  event.target.complete();
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

const goToAvailabilitySubmission = () => {
  router.push('/availability-submission');
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
.segment-container {
  margin-bottom: 1.5rem;
}

.segment-container ion-segment {
  border-radius: 8px;
  background: var(--ion-color-light);
}

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

.submission-button {
  --border-radius: 12px;
  font-weight: 500;
  margin-bottom: 1rem;
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

.service-card.available {
  background: #ECFDF5;
  border-color: #10B981;
}

.service-card.unavailable {
  background: #FEF2F2;
  border-color: #EF4444;
}

.service-card.assigned {
  background: #FFFBEB;
  border-color: #F59E0B;
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

/* Assignment Styles */
.assignments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.assignment-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid var(--ion-color-success);
}

.assignment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.assignment-header .service-info {
  flex: 1;
  min-width: 0;
}

.assignment-chip {
  flex-shrink: 0;
  font-weight: 500;
}

.assignment-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.team-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.team-icon {
  font-size: 1.125rem;
  color: var(--ion-color-primary);
  flex-shrink: 0;
}

.team-name {
  font-weight: 500;
  color: var(--ion-color-dark);
}

.assignment-meta {
  font-size: 0.875rem;
  color: var(--ion-color-medium);
}

.no-assignments {
  text-align: center;
  padding: 3rem 2rem;
  color: var(--ion-color-medium);
}

.no-assignments ion-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.no-assignments h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--ion-color-dark);
  margin: 0 0 0.5rem 0;
}

.no-assignments p {
  margin: 0;
  font-size: 1rem;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .assignment-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .assignment-chip {
    align-self: flex-start;
  }
}
</style>
