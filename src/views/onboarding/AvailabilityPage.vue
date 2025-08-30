<template>
  <ion-page>
    <ion-content>
      <!-- Progress Bar -->
      <ion-progress-bar :value="progressPercentage / 100" color="primary"></ion-progress-bar>

      <div class="content-container">
        <!-- Back Button -->
        <ion-button 
          fill="clear" 
          color="medium" 
          class="back-button"
          @click="goBack"
        >
          <ion-icon :icon="arrowBack" slot="start"></ion-icon>
          Retour
        </ion-button>

        <!-- Icon -->
        <div class="step-icon">
          <ion-icon :icon="calendarOutline"></ion-icon>
        </div>

        <!-- Title -->
        <h1 class="step-title">Vos disponibilités</h1>

        <!-- Description -->
        <p class="step-description">
          Indiquez votre disponibilité pour les services à venir
        </p>

        <!-- Services List -->
        <div class="services-list">
          <div 
            v-for="service in availableServices" 
            :key="service.id"
            class="service-card"
            :class="{
              'available': getServiceAvailability(service.id) === 'available',
              'unavailable': getServiceAvailability(service.id) === 'unavailable'
            }"
          >
            <div class="service-info">
              <h3 class="service-title">{{ service.title }}</h3>
              <p class="service-datetime">{{ formatServiceDateTime(service.date, service.time) }}</p>
            </div>
            
            <div class="availability-buttons">
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
          </div>
        </div>

        <!-- No services message -->
        <div v-if="availableServices.length === 0" class="no-services">
          <ion-icon :icon="calendarOutline" color="medium"></ion-icon>
          <p>Aucun service disponible pour le moment</p>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <ion-button 
            expand="block" 
            color="primary" 
            size="large" 
            class="primary-button"
            @click="confirmAvailabilities"
          >
            Confirmer mes disponibilités
          </ion-button>

          <ion-button 
            expand="block" 
            fill="outline"
            color="medium"
            size="large" 
            class="secondary-button"
            @click="skipAvailabilities"
          >
            Je le ferai plus tard
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonContent, IonProgressBar, IonButton, IonIcon
} from '@ionic/vue';
import {
  calendarOutline, thumbsUpOutline, thumbsDownOutline, arrowBack
} from 'ionicons/icons';
import { useOnboardingStore } from '@/stores/onboarding';
import { serviceService } from '@/services/serviceService';
import { timezoneUtils } from '@/utils/timezone';
import type { Service } from '@/types/service';

const router = useRouter();
const onboardingStore = useOnboardingStore();

const availableServices = ref<Service[]>([]);

const progressPercentage = computed(() => onboardingStore.progressPercentage);

const formatServiceDateTime = (date: string, time: string) => {
  return timezoneUtils.formatDateTimeForDisplay(date, time);
};

const getServiceAvailability = (serviceId: string): 'available' | 'unavailable' | null => {
  return onboardingStore.formData.availabilities[serviceId] || null;
};

const setAvailability = (serviceId: string, availability: 'available' | 'unavailable') => {
  const currentAvailability = getServiceAvailability(serviceId);
  
  if (currentAvailability === availability) {
    onboardingStore.setAvailability(serviceId, null);
  } else {
    onboardingStore.setAvailability(serviceId, availability);
  }
};

const loadServices = async () => {
  try {
    const services = await serviceService.getPublishedServices();
    const now = new Date();
    availableServices.value = services.filter(service => {
      const serviceDate = new Date(`${service.date}T${service.time}:00`);
      return serviceDate > now;
    });
    
    onboardingStore.setAvailableServices(availableServices.value);
  } catch (error) {
    console.error('Error loading services:', error);
  }
};

const goBack = () => {
  onboardingStore.previousStep();
  router.push('/onboarding/teams');
};

const confirmAvailabilities = () => {
  onboardingStore.nextStep();
  router.push('/onboarding/congratulations');
};

const skipAvailabilities = () => {
  onboardingStore.updateFormData({ availabilities: {} });
  onboardingStore.nextStep();
  router.push('/onboarding/congratulations');
};

onMounted(() => {
  loadServices();
});
</script>

<style scoped>
.content-container {
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
}

.back-button {
  --color: #6B7280;
  margin-bottom: 1rem;
  align-self: flex-start;
}

.step-icon {
  width: 4rem;
  height: 4rem;
  background: #FEE2E2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 2rem auto;
  color: #DC2626;
}

.step-icon ion-icon {
  font-size: 2rem;
}

.step-title {
  font-size: 1.875rem;
  font-weight: bold;
  color: #111827;
  text-align: center;
  margin: 0 0 1rem 0;
}

.step-description {
  font-size: 1.125rem;
  color: #6B7280;
  text-align: center;
  margin-bottom: 3rem;
  line-height: 1.6;
}

.services-list {
  margin-bottom: 3rem;
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

.no-services {
  text-align: center;
  padding: 3rem 2rem;
  color: #6B7280;
}

.no-services ion-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.action-buttons {
  margin-top: 2rem;
}

.primary-button {
  --background: #DC2626;
  --background-hover: #B91C1C;
  height: 3.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.secondary-button {
  --border-color: #9CA3AF;
  --color: #6B7280;
  height: 3rem;
  font-size: 1rem;
}

ion-progress-bar {
  --progress-background: #DC2626;
  --buffer-background: #FEE2E2;
}
</style>