<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Services</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="goToCreateService" fill="clear" color="dark">
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
            <ion-segment-button value="all">
              <ion-label>Tous</ion-label>
            </ion-segment-button>
            <ion-segment-button value="published">
              <ion-label>Publiés</ion-label>
            </ion-segment-button>
            <ion-segment-button value="draft">
              <ion-label>Brouillons</ion-label>
            </ion-segment-button>
          </ion-segment>
        </div>

        <div v-if="filteredServices.length === 0 && !loading" class="empty-state ion-text-center ion-padding">
          <ion-icon :icon="calendarOutline" size="large" color="medium" />
          <h2>Aucun service</h2>
          <p>{{ getEmptyStateMessage() }}</p>
          <ion-button @click="goToCreateService" fill="outline">
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
  addOutline, calendarOutline, checkmarkCircle, timeOutline
} from 'ionicons/icons';
import { Service, ServiceCategory } from '@/types/service';
import { serviceService } from '@/services/serviceService';
import { timezoneUtils } from '@/utils/timezone';

const router = useRouter();
const services = ref<Service[]>([]);
const loading = ref(false);
const filterMode = ref('all');

const filteredServices = computed(() => {
  switch (filterMode.value) {
    case 'published':
      return services.value.filter(service => service.isPublished);
    case 'draft':
      return services.value.filter(service => !service.isPublished);
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
    case 'published':
      return 'Aucun service publié pour le moment.';
    case 'draft':
      return 'Aucun brouillon disponible.';
    default:
      return 'Commencez par créer votre premier service.';
  }
};

const goToServiceDetail = (serviceId: string) => {
  router.push(`/service-detail/${serviceId}`);
};

const goToCreateService = () => {
  router.push('/service-form');
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
  background: var(--ion-color-light);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 1.5rem;
}

.create-service-fab {
  margin-bottom: 80px;
}
</style>
