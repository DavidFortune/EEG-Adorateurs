<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Services</ion-title>
        <ion-buttons slot="end">
          <ion-button v-if="canManageServices" @click="goToScheduling" fill="clear" color="dark">
            <ion-icon :icon="calendarOutline" />
          </ion-button>
          <ion-button v-if="canManageServices" @click="goToCreateService" fill="clear" color="dark">
            <ion-icon :icon="addOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Services</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <ion-loading :is-open="loading" message="Chargement des services..."></ion-loading>

      <div class="ion-padding">
        <div class="filter-section">
          <ion-segment v-model="filterMode" @ionChange="onFilterChange">
            <ion-segment-button value="upcoming">
              <ion-label>À venir</ion-label>
            </ion-segment-button>
            <ion-segment-button value="past">
              <ion-label>Passés</ion-label>
            </ion-segment-button>
          </ion-segment>
        </div>

        <div v-if="filteredServices.length === 0 && !loading" class="empty-state ion-text-center ion-padding">
          <ion-icon :icon="calendarOutline" size="large" color="medium" />
          <h2>Aucun service</h2>
          <p>{{ getEmptyStateMessage() }}</p>
          <ion-button v-if="canManageServices" @click="goToCreateService" fill="outline">
            <ion-icon :icon="addOutline" slot="start" />
            Créer un service
          </ion-button>
        </div>

        <ion-card
          v-for="service in filteredServices"
          :key="service.id"
          button
          @click="goToServiceDetail(service.id)"
          class="service-card"
        >
          <ion-card-header>
            <div class="card-header-content">
              <div class="service-info">
                <ion-card-title>{{ service.title }}</ion-card-title>
                <ion-card-subtitle class="service-datetime">
                  {{ formatDateTime(service.date, service.time) }}
                  <span v-if="service.endDate && service.endTime" class="service-duration">
                    ({{ calculateDuration(service.date, service.time, service.endDate, service.endTime) }})
                  </span>
                </ion-card-subtitle>
                <!-- Status and Category moved below date -->
                <div class="service-badges">
                  <ion-chip :color="getCategoryColor(service.category)" size="small">
                    {{ getCategoryLabel(service.category) }}
                  </ion-chip>
                  <ion-chip v-if="service.isPublished" color="success" size="small">
                    <ion-icon :icon="checkmarkCircle" />
                    <ion-label>Publié</ion-label>
                  </ion-chip>
                  <ion-chip v-else color="warning" size="small">
                    <ion-icon :icon="timeOutline" />
                    <ion-label>Brouillon</ion-label>
                  </ion-chip>
                </div>
              </div>

              <!-- Quick Action Buttons moved to the right -->
              <div class="header-actions" v-if="hasTeamRequirements(service) || hasServiceProgram(service)">
                <ion-button
                  v-if="hasTeamRequirements(service)"
                  @click.stop="goToServiceMembers(service.id)"
                  fill="clear"
                  size="small"
                  class="header-action-button"
                >
                  <ion-icon :icon="peopleOutline" slot="start" />
                  <ion-label>Équipes</ion-label>
                </ion-button>
                <ion-button
                  v-if="hasServiceProgram(service)"
                  @click.stop="goToServiceProgram(service.id)"
                  fill="clear"
                  size="small"
                  class="header-action-button"
                >
                  <ion-icon :icon="documentTextOutline" slot="start" />
                  <ion-label>Programme</ion-label>
                </ion-button>
              </div>
            </div>
          </ion-card-header>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle,
  IonRefresher, IonRefresherContent, IonLoading, IonSegment, IonSegmentButton,
  IonLabel, IonChip, toastController
} from '@ionic/vue';
import {
  addOutline, calendarOutline, checkmarkCircle, timeOutline,
  peopleOutline, documentTextOutline
} from 'ionicons/icons';
import { db } from '@/firebase/config';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { Service, ServiceCategory } from '@/types/service';
import { teamsService } from '@/firebase/teams';
import { timezoneUtils } from '@/utils/timezone';
import { useUser } from '@/composables/useUser';

const router = useRouter();
const { canManageServices, member } = useUser();
const services = ref<Service[]>([]);
const loading = ref(true);
const filterMode = ref('upcoming');
const userTeamNames = ref<string[]>([]);

// Realtime subscription cleanup
let unsubscribeServices: (() => void) | null = null;

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

// Memoize service date parsing to avoid repeated computations
const servicesWithParsedDates = computed(() => {
  if (!services.value?.length) return [];

  return services.value.map(service => {
    const serviceDateTime = new Date(`${service.date}T${service.time}:00`);
    // Calculate end datetime (use endDate/endTime if available, otherwise use start datetime)
    const endDateTime = service.endDate && service.endTime
      ? new Date(`${service.endDate}T${service.endTime}:00`)
      : serviceDateTime;
    // Add 1 hour buffer after end time for determining "past" status
    const pastThreshold = new Date(endDateTime.getTime() + 60 * 60 * 1000);
    return {
      ...service,
      parsedDateTime: serviceDateTime,
      parsedEndDateTime: endDateTime,
      pastThreshold: pastThreshold,
      isValidDate: !isNaN(serviceDateTime.getTime())
    };
  }).filter(service => service.isValidDate);
});

const filteredServices = computed(() => {
  const validServices = servicesWithParsedDates.value;
  if (!validServices.length) return [];

  const now = new Date();
  const nowTime = now.getTime();

  // Filter first, then sort for better performance
  let filtered: typeof validServices;

  switch (filterMode.value) {
    case 'upcoming':
      // Show as upcoming until 1 hour after end time
      filtered = validServices.filter(service => service.pastThreshold.getTime() > nowTime);
      break;
    case 'past':
      // Only show as past after 1 hour of the end datetime
      filtered = validServices.filter(service => service.pastThreshold.getTime() <= nowTime);
      break;
    default:
      filtered = validServices;
  }

  // Filter by user membership in needed teams or guest access
  filtered = filtered.filter(service => {
    // Check if user is a guest for this service
    const isGuest = service.guestMemberIds?.includes(member.value?.id || '');
    if (isGuest) return true;

    // If service has team requirements, check user membership
    if (service.teamRequirements && service.teamRequirements.length > 0) {
      const activeTeamNames = service.teamRequirements
        .filter(req => req.isActive)
        .map(req => req.teamName);

      // Only show service if user is member of at least one needed team
      return activeTeamNames.some(teamName => userTeamNames.value.includes(teamName));
    }

    // If no team requirements, show the service
    return true;
  });

  // Sort the filtered results
  return filtered.sort((a, b) => {
    return filterMode.value === 'past'
      ? b.parsedDateTime.getTime() - a.parsedDateTime.getTime()  // Past: most recent first
      : a.parsedDateTime.getTime() - b.parsedDateTime.getTime(); // Upcoming/All: earliest first
  });
});

// Subscribe to realtime updates for all services
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
      services.value = loadedServices;
      loading.value = false;
    },
    async (error) => {
      console.error('Error in services realtime listener:', error);
      loading.value = false;
      const toast = await toastController.create({
        message: 'Erreur lors du chargement des services',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  );
};

const handleRefresh = (event: any) => {
  // With realtime updates, data is always fresh
  // Just complete the refresher
  event.target.complete();
};

const onFilterChange = (event: any) => {
  filterMode.value = event.detail.value;
};

// Memoize date formatting for better performance
const formatDateTime = (dateStr: string, timeStr: string) => {
  return timezoneUtils.formatDateTimeForDisplay(dateStr, timeStr);
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


const getCategoryColor = (category: ServiceCategory) => {
  return category === ServiceCategory.SERVICE ? 'primary' : 'secondary';
};

const getCategoryLabel = (category: ServiceCategory) => {
  return category;
};

const getEmptyStateMessage = () => {
  switch (filterMode.value) {
    case 'upcoming':
      return 'Aucun service à venir pour le moment.';
    case 'past':
      return 'Aucun service passé.';
    default:
      return 'Aucun service disponible.';
  }
};

const goToServiceDetail = (serviceId: string) => {
  router.push(`/service-detail/${serviceId}`);
};

const goToCreateService = () => {
  router.push('/service-form');
};

const goToScheduling = () => {
  router.push('/scheduling');
};

const goToServiceMembers = (serviceId: string) => {
  router.push(`/service-members/${serviceId}`);
};

const goToServiceProgram = (serviceId: string) => {
  router.push(`/service-program/${serviceId}`);
};

const hasTeamRequirements = (service: Service) => {
  return service.isPublished && service.teamRequirements && service.teamRequirements.length > 0;
};

const hasServiceProgram = (service: Service) => {
  // Only show program button if service is published
  return service.isPublished;
};

// Watch for member changes to reload team names
watch(() => member.value, (newMember) => {
  if (newMember) {
    loadUserTeamNames();
  }
}, { immediate: true });

onMounted(() => {
  subscribeToServices();
  loadUserTeamNames();
});

onUnmounted(() => {
  // Clean up realtime subscription
  if (unsubscribeServices) {
    unsubscribeServices();
    unsubscribeServices = null;
  }
});
</script>

<style scoped>
.card-header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
}

.service-info {
  flex: 1;
}

.service-datetime {
  margin-bottom: 8px !important;
}

.service-duration {
  color: var(--ion-color-medium);
  font-weight: 500;
  margin-left: 4px;
}

.service-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.header-actions {
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
  margin-left: 12px;
}

.header-action-button {
  --border-radius: 20px;
  --padding-start: 12px;
  --padding-end: 12px;
  --height: 32px;
  font-size: 0.875rem;
}

.header-action-button ion-icon {
  font-size: 1rem;
  margin-right: 4px;
}

.empty-state {
  margin-top: 2rem;
}

.filter-section {
  margin-bottom: 1.5rem;
}

.create-service-fab {
  margin-bottom: 80px;
}

.service-card {
  margin: 0rem;
  margin-bottom: 1rem;
}

/* Mobile responsive styles */
@media (max-width: 768px) {
  ion-card-title {
    font-size: 1rem !important;
    line-height: 1.3;
  }
  
  ion-card-subtitle {
    font-size: 0.875rem !important;
  }
  
  .card-header-content {
    flex-direction: column;
    gap: 0.5rem;
  }

  .header-actions {
    align-self: flex-start;
    margin-left: 0;
    margin-top: 0.5rem;
  }
  
  .card-badges {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 0.25rem;
  }
  
  .card-badges ion-chip {
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  ion-card-title {
    font-size: 0.95rem !important;
  }
  
  ion-card-subtitle {
    font-size: 0.8rem !important;
  }

  .header-action-button {
    --height: 28px;
    font-size: 0.8rem;
    --padding-start: 8px;
    --padding-end: 8px;
  }

  .header-action-button ion-icon {
    font-size: 0.9rem;
  }
}
</style>
