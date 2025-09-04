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
        <div class="header-section">
          <h2>Vos disponibilités actuelles</h2>
          <p>Mettez à jour votre disponibilité pour les services à venir</p>
          
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
        <div v-if="availableServices.length === 0 && !loading" class="no-services">
          <ion-icon :icon="calendarOutline" color="medium"></ion-icon>
          <p>Aucun service disponible pour le moment</p>
        </div>

        <!-- Save Button -->
        <ion-button 
          v-if="hasChanges && availableServices.length > 0"
          expand="block" 
          color="primary" 
          size="large" 
          class="save-button"
          @click="saveAvailabilities"
          :disabled="saving"
        >
          <span v-if="!saving">Enregistrer mes disponibilités</span>
          <span v-else>Enregistrement...</span>
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonIcon, IonRefresher, IonRefresherContent, IonLoading, toastController
} from '@ionic/vue';
import {
  thumbsUpOutline, thumbsDownOutline, calendarOutline, createOutline
} from 'ionicons/icons';
import { useUser } from '@/composables/useUser';
import { serviceService } from '@/services/serviceService';
import { membersService } from '@/firebase/members';
import { timezoneUtils } from '@/utils/timezone';
import type { Service } from '@/types/service';

const { member } = useUser();
const router = useRouter();
const loading = ref(false);
const saving = ref(false);
const availableServices = ref<Service[]>([]);
const currentAvailabilities = ref<{ [serviceId: string]: 'available' | 'unavailable' | null }>({});
const originalAvailabilities = ref<{ [serviceId: string]: 'available' | 'unavailable' | null }>({});

const hasChanges = computed(() => {
  return JSON.stringify(currentAvailabilities.value) !== JSON.stringify(originalAvailabilities.value);
});

const formatServiceDateTime = (date: string, time: string) => {
  return timezoneUtils.formatDateTimeForDisplay(date, time);
};

const getServiceAvailability = (serviceId: string): 'available' | 'unavailable' | null => {
  return currentAvailabilities.value[serviceId] || null;
};

const setAvailability = (serviceId: string, availability: 'available' | 'unavailable') => {
  const currentValue = getServiceAvailability(serviceId);
  
  if (currentValue === availability) {
    // If clicking the same button, toggle off
    currentAvailabilities.value[serviceId] = null;
  } else {
    // Set the new availability
    currentAvailabilities.value[serviceId] = availability;
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

const saveAvailabilities = async () => {
  if (!member.value) return;
  
  saving.value = true;
  try {
    await membersService.updateMember(member.value.id, {
      availabilities: currentAvailabilities.value
    });
    
    originalAvailabilities.value = { ...currentAvailabilities.value };
    await showToast('Disponibilités mises à jour avec succès!', 'success');
  } catch (error) {
    console.error('Error saving availabilities:', error);
    await showToast('Erreur lors de la sauvegarde', 'danger');
  } finally {
    saving.value = false;
  }
};

const handleRefresh = async (event: any) => {
  await loadServices();
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
  }
}, { immediate: true });

onMounted(() => {
  loadServices();
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

.save-button {
  --background: #10B981;
  --background-hover: #059669;
  height: 3.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  margin-top: 2rem;
}

.save-button:disabled {
  --background: #D1D5DB;
  --color: #9CA3AF;
}
</style>
