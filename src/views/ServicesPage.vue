<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Services</ion-title>
        <ion-buttons slot="end">
          <ion-button v-if="isAdmin" @click="goToScheduling" fill="clear" color="dark">
            <ion-icon :icon="calendarOutline" />
          </ion-button>
          <ion-button v-if="isAdmin" @click="goToCreateService" fill="clear" color="dark">
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
          <ion-button v-if="isAdmin" @click="goToCreateService" fill="outline">
            <ion-icon :icon="addOutline" slot="start" />
            Créer un service
          </ion-button>
        </div>

        <ion-card 
          v-for="service in filteredServices" 
          :key="service.id" 
          button 
          @click="goToServiceDetail(service.id)"
        >
          <ion-card-header>
            <div class="card-header-content">
              <div>
                <ion-card-title>{{ service.title }}</ion-card-title>
                <ion-card-subtitle>
                  {{ formatDateTime(service.date, service.time) }}
                </ion-card-subtitle>
              </div>
              <div class="card-badges">
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
          </ion-card-header>
          
          <ion-card-content>
            <div v-if="service.availabilityDeadline" class="deadline-info">
              <ion-icon :icon="timerOutline" :color="isDeadlinePassed(service.availabilityDeadline) ? 'danger' : 'warning'"></ion-icon>
              <span :class="{ 'deadline-passed': isDeadlinePassed(service.availabilityDeadline) }">
                Date limite: {{ formatDeadlineShort(service.availabilityDeadline) }}
                <span v-if="isDeadlinePassed(service.availabilityDeadline)" class="deadline-status"> (Dépassée)</span>
              </span>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonRefresher, IonRefresherContent, IonLoading, IonSegment, IonSegmentButton,
  IonLabel, IonChip
} from '@ionic/vue';
import {
  addOutline, calendarOutline, checkmarkCircle, timeOutline, timerOutline
} from 'ionicons/icons';
import { Service, ServiceCategory } from '@/types/service';
import { serviceService } from '@/services/serviceService';
import { timezoneUtils } from '@/utils/timezone';
import { useUser } from '@/composables/useUser';

const router = useRouter();
const { isAdmin } = useUser();
const services = ref<Service[]>([]);
const loading = ref(false);
const filterMode = ref('upcoming');

const filteredServices = computed(() => {
  const now = new Date();
  
  switch (filterMode.value) {
    case 'upcoming':
      return services.value.filter(service => {
        const serviceDate = new Date(`${service.date}T${service.time}`);
        return serviceDate >= now;
      });
    case 'past':
      return services.value.filter(service => {
        const serviceDate = new Date(`${service.date}T${service.time}`);
        return serviceDate < now;
      });
    default:
      return services.value;
  }
});

const loadServices = async () => {
  loading.value = true;
  try {
    services.value = await serviceService.getAllServices();
    // Sort by date and time
    services.value.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
  } catch (error) {
    console.error('Error loading services:', error);
  } finally {
    loading.value = false;
  }
};

const handleRefresh = async (event: any) => {
  await loadServices();
  event.target.complete();
};

const onFilterChange = (event: any) => {
  filterMode.value = event.detail.value;
};

const formatDateTime = (dateStr: string, timeStr: string) => {
  return timezoneUtils.formatDateTimeForDisplay(dateStr, timeStr);
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

const isDeadlinePassed = (deadlineStr: string) => {
  const deadline = new Date(deadlineStr);
  const now = new Date();
  return deadline < now;
};

const formatDeadlineShort = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString('fr-CA', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Toronto'
  });
};

onMounted(() => {
  loadServices();
});
</script>

<style scoped>
.card-header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
}

.card-badges {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
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

.deadline-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--ion-color-warning);
  padding-top: 0.5rem;
}

.deadline-passed {
  color: var(--ion-color-danger);
}

.deadline-status {
  font-weight: 600;
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
}
</style>
