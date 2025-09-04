<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/disponibilites"></ion-back-button>
        </ion-buttons>
        <ion-title>Mes disponibilités</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Mes disponibilités</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-loading :is-open="loading" message="Chargement des services..."></ion-loading>

      <div class="ion-padding">
        <!-- Instructions -->
        <ion-card class="instructions-card">
          <ion-card-content>
            <ion-icon :icon="informationCircleOutline" color="primary" />
            <div class="instructions-text">
              <strong>Soumettez votre disponibilité</strong> pour chaque service afin d'aider 
              les coordinateurs à planifier les équipes.
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Services with team requirements -->
        <div v-if="servicesWithRequirements.length === 0 && !loading" class="empty-state">
          <ion-icon :icon="calendarOutline" size="large" color="medium" />
          <h3>Aucun service</h3>
          <p>Aucun service ne nécessite de disponibilités pour le moment.</p>
        </div>

        <!-- Availability submissions for each service -->
        <AvailabilitySubmission
          v-for="service in servicesWithRequirements"
          :key="service.id"
          :service="service"
          @submitted="handleAvailabilitySubmitted"
        />

        <!-- My submitted availabilities summary -->
        <ion-card v-if="myAvailabilities.length > 0" class="summary-card">
          <ion-card-header>
            <ion-card-title>Résumé de mes disponibilités</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="summary-stats">
              <div class="stat">
                <ion-icon :icon="checkmarkCircleOutline" color="success" />
                <span>{{ availabilityStats.available }} Disponible{{ availabilityStats.available > 1 ? 's' : '' }}</span>
              </div>
              <div class="stat">
                <ion-icon :icon="helpCircleOutline" color="warning" />
                <span>{{ availabilityStats.maybe }} Peut-être</span>
              </div>
              <div class="stat">
                <ion-icon :icon="closeCircleOutline" color="danger" />
                <span>{{ availabilityStats.unavailable }} Indisponible{{ availabilityStats.unavailable > 1 ? 's' : '' }}</span>
              </div>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonLoading,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon
} from '@ionic/vue';
import {
  informationCircleOutline,
  calendarOutline,
  checkmarkCircleOutline,
  helpCircleOutline,
  closeCircleOutline
} from 'ionicons/icons';
import type { Service } from '@/types/service';
import type { MemberAvailability } from '@/types/availability';
import { firestoreService } from '@/firebase/firestore';
import { availabilityService } from '@/firebase/availability';
import { authService } from '@/firebase/auth';
import AvailabilitySubmission from '@/components/availability/AvailabilitySubmission.vue';

const loading = ref(false);
const services = ref<Service[]>([]);
const myAvailabilities = ref<MemberAvailability[]>([]);

// Services that have team requirements and are published
const servicesWithRequirements = computed(() => {
  return services.value.filter(service => 
    service.isPublished && 
    service.teamRequirements && 
    service.teamRequirements.length > 0 &&
    service.teamRequirements.some(req => req.isActive)
  );
});

const availabilityStats = computed(() => {
  const stats = {
    available: 0,
    maybe: 0,
    unavailable: 0
  };

  myAvailabilities.value.forEach(availability => {
    if (availability.status === 'available') stats.available++;
    else if (availability.status === 'maybe') stats.maybe++;
    else if (availability.status === 'unavailable') stats.unavailable++;
  });

  return stats;
});

async function loadServices() {
  try {
    loading.value = true;
    const allServices = await firestoreService.getAllServices();
    
    // Sort by date, showing upcoming services first
    services.value = allServices
      .filter(service => {
        const serviceDate = new Date(`${service.date}T${service.time}:00`);
        const now = new Date();
        // Show services that are today or in the future
        return serviceDate >= now || 
               (serviceDate.toDateString() === now.toDateString());
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}:00`);
        const dateB = new Date(`${b.date}T${b.time}:00`);
        return dateA.getTime() - dateB.getTime();
      });
  } catch (error) {
    console.error('Error loading services:', error);
  } finally {
    loading.value = false;
  }
}

async function loadMyAvailabilities() {
  const user = authService.getCurrentUser();
  if (!user) return;

  try {
    myAvailabilities.value = await availabilityService.getMemberAvailabilities(user.uid);
  } catch (error) {
    console.error('Error loading my availabilities:', error);
  }
}

function handleAvailabilitySubmitted(availability: MemberAvailability) {
  // Update local availabilities list
  const existingIndex = myAvailabilities.value.findIndex(
    a => a.serviceId === availability.serviceId
  );
  
  if (existingIndex >= 0) {
    myAvailabilities.value[existingIndex] = availability;
  } else {
    myAvailabilities.value.push(availability);
  }
}

onMounted(async () => {
  await Promise.all([
    loadServices(),
    loadMyAvailabilities()
  ]);
});
</script>

<style scoped>
.instructions-card {
  --border-radius: 12px;
  margin-bottom: 20px;
}

.instructions-card ion-card-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.instructions-card ion-icon {
  font-size: 1.5rem;
  margin-top: 2px;
  flex-shrink: 0;
}

.instructions-text {
  line-height: 1.4;
  color: var(--ion-color-dark);
}

.empty-state {
  text-align: center;
  margin-top: 3rem;
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

.summary-card {
  --border-radius: 12px;
  margin-top: 20px;
}

.summary-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
}

.stat ion-icon {
  font-size: 1.25rem;
}

@media (min-width: 768px) {
  .summary-stats {
    flex-direction: row;
    justify-content: space-around;
  }
}
</style>