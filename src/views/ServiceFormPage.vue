<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="backUrl"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ isEditing ? 'Modifier' : 'Créer' }} un Service</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="saveService" :disabled="!isFormValid || loading">
            <ion-icon :icon="checkmark" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content :fullscreen="true">
      <ion-loading :is-open="loading" message="Sauvegarde..."></ion-loading>
      
      <form @submit.prevent="saveService" class="ion-padding">
        <ion-list>
          <ion-item>
            <ion-input 
              v-model="formData.title"
              label="Titre du service"
              label-placement="stacked"
              placeholder="Entrez le titre"
              :counter="true"
              :maxlength="100"
              required
            />
          </ion-item>
          
          <ion-item button @click="openServiceDatePicker">
            <ion-label>
              <p>Date et heure du service</p>
              <h3>{{ formData.date && formData.time ? formatServiceDateTime() : 'Sélectionner' }}</h3>
            </ion-label>
            <ion-icon :icon="calendarOutline" slot="end" color="primary"></ion-icon>
          </ion-item>
          
          <ion-item>
            <ion-select 
              v-model="formData.category"
              label="Catégorie"
              label-placement="stacked"
              placeholder="Sélectionnez une catégorie"
              interface="popover"
            >
              <ion-select-option 
                v-for="category in categories" 
                :key="category.value" 
                :value="category.value"
              >
                {{ category.label }}
              </ion-select-option>
            </ion-select>
          </ion-item>
          
          <ion-item button @click="openDeadlinePicker">
            <ion-label>
              <p>Date limite pour les disponibilités</p>
              <h3>{{ formData.availabilityDeadline ? formatDeadlineDisplay() : 'Optionnel' }}</h3>
            </ion-label>
            <ion-icon :icon="timerOutline" slot="end" color="warning"></ion-icon>
          </ion-item>
          
          <ion-item>
            <ion-toggle v-model="formData.isPublished" />
            <ion-label class="ion-margin-start">
              <h3>Publier immédiatement</h3>
              <p>Le service sera visible publiquement</p>
            </ion-label>
          </ion-item>
        </ion-list>
        
        <!-- Team Requirements Section -->
        <div class="team-requirements-section">
          <div class="section-header">
            <ion-icon :icon="peopleOutline" color="primary" class="section-icon"></ion-icon>
            <div class="section-title">
              <h2>Équipes requises</h2>
              <p>Définissez les besoins pour chaque équipe</p>
            </div>
          </div>
          
          <div class="team-requirements-list">
            <div
              v-for="(requirement, index) in teamRequirements"
              :key="requirement.teamName"
              class="team-requirement-card"
              :class="{ 'active': requirement.isActive }"
            >
              <div class="team-toggle">
                <ion-toggle
                  v-model="requirement.isActive"
                  color="primary"
                ></ion-toggle>
              </div>
              
              <div class="team-info">
                <h3 class="team-name">{{ requirement.teamName }}</h3>
                <p class="team-subtitle" v-if="requirement.isActive">
                  {{ requirement.membersNeeded }} personne{{ requirement.membersNeeded > 1 ? 's' : '' }} requise{{ requirement.membersNeeded > 1 ? 's' : '' }}
                </p>
                <p class="team-subtitle inactive" v-else>
                  Équipe désactivée
                </p>
              </div>
              
              <div class="team-controls" v-if="requirement.isActive">
                <ion-button
                  fill="clear"
                  size="small"
                  @click="decrementTeamRequirement(index)"
                  :disabled="requirement.membersNeeded <= 0"
                >
                  <ion-icon :icon="removeOutline"></ion-icon>
                </ion-button>
                
                <span class="member-count">{{ requirement.membersNeeded }}</span>
                
                <ion-button
                  fill="clear"
                  size="small"
                  @click="incrementTeamRequirement(index)"
                  :disabled="requirement.membersNeeded >= 20"
                >
                  <ion-icon :icon="addOutline"></ion-icon>
                </ion-button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="ion-padding-top">
          <ion-button 
            expand="block" 
            type="submit" 
            :disabled="!isFormValid || loading"
            color="primary"
          >
            <ion-icon :icon="checkmark" slot="start" />
            {{ isEditing ? 'Mettre à jour' : 'Créer' }} le service
          </ion-button>
          
          <ion-button 
            expand="block" 
            fill="outline" 
            @click="cancel"
            class="ion-margin-top"
          >
            <ion-icon :icon="closeOutline" slot="start" />
            Annuler
          </ion-button>
        </div>
      </form>
    </ion-content>
    
    <!-- Service DateTime Modal -->
    <ion-modal :is-open="showServiceDateModal" @didDismiss="showServiceDateModal = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>Date et heure du service</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="showServiceDateModal = false">Fermer</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-datetime
          v-model="tempServiceDateTime"
          presentation="date-time"
          :min="minDateTime"
          locale="fr-FR"
          :hour-cycle="'h23'"
        >
        </ion-datetime>
        <div class="ion-padding">
          <ion-button expand="block" @click="confirmServiceDateTime">Confirmer</ion-button>
        </div>
      </ion-content>
    </ion-modal>
    
    <!-- Deadline DateTime Modal -->
    <ion-modal :is-open="showDeadlineModal" @didDismiss="showDeadlineModal = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>Date limite pour les disponibilités</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="showDeadlineModal = false">Fermer</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-datetime
          v-model="tempDeadlineDateTime"
          presentation="date-time"
          :min="minDateTime"
          :max="maxDeadlineDateTime"
          locale="fr-FR"
          :hour-cycle="'h23'"
        >
        </ion-datetime>
        <div class="ion-padding">
          <ion-button expand="block" @click="confirmDeadlineDateTime">Confirmer</ion-button>
          <ion-button expand="block" fill="clear" @click="clearDeadline">Supprimer la date limite</ion-button>
        </div>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonList, IonItem, IonInput, IonDatetime, IonSelect,
  IonSelectOption, IonToggle, IonLabel, IonLoading, IonModal, toastController
} from '@ionic/vue';
import { checkmark, closeOutline, calendarOutline, timerOutline, peopleOutline, addOutline, removeOutline } from 'ionicons/icons';
import { TeamRequirement, ServiceCategory, CreateServiceRequest, UpdateServiceRequest } from '@/types/service';
import { serviceService } from '@/services/serviceService';
import { teamsService } from '@/firebase/teams';
import { timezoneUtils } from '@/utils/timezone';

const route = useRoute();
const router = useRouter();
const loading = ref(false);

// Modal states
const showServiceDateModal = ref(false);
const showDeadlineModal = ref(false);
const tempServiceDateTime = ref('');
const tempDeadlineDateTime = ref('');

const isEditing = computed(() => !!route.params.id);
const backUrl = computed(() => 
  isEditing.value ? `/service-detail/${route.params.id}` : '/tabs/services'
);

const categories = Object.values(ServiceCategory).map(category => ({
  value: category,
  label: category
}));

const minDate = computed(() => {
  return timezoneUtils.getMinDate();
});

const minDateTime = computed(() => {
  // Minimum datetime is current date and time
  const now = new Date();
  return now.toISOString();
});

const maxDeadlineDateTime = computed(() => {
  // Deadline can't be after the service date and time
  if (formData.date && formData.time) {
    return `${formData.date}T${formData.time}:00`;
  }
  return new Date().toISOString();
});

const formData = reactive({
  title: '',
  date: '',
  time: '10:00',
  category: ServiceCategory.SERVICE,
  isPublished: false,
  availabilityDeadline: ''
});

// Team requirements loaded from Firestore
const teamRequirements = ref<TeamRequirement[]>([]);

const isFormValid = computed(() => {
  return formData.title.trim().length > 0 &&
         formData.date &&
         formData.time &&
         formData.category;
});

const loadTeams = async () => {
  try {
    const teams = await teamsService.getAllTeams();
    // Convert teams to team requirements format
    teamRequirements.value = teams
      .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically
      .map(team => ({
        teamName: team.name,
        membersNeeded: 0, // Default to 0 members needed
        isActive: false   // Default to inactive
      }));
  } catch (error) {
    console.error('Error loading teams:', error);
    await showToast('Erreur lors du chargement des équipes', 'danger');
  }
};

const loadService = async () => {
  if (!isEditing.value) return;
  
  const id = route.params.id as string;
  loading.value = true;
  
  try {
    const service = await serviceService.getServiceById(id);
    if (service) {
      formData.title = service.title;
      formData.date = service.date;
      formData.time = service.time;
      formData.category = service.category;
      formData.isPublished = service.isPublished;
      formData.availabilityDeadline = service.availabilityDeadline || '';
      
      // Store service team requirements to apply after teams are loaded
      const serviceTeamRequirements = service.teamRequirements || [];
      
      // Apply service team requirements to loaded teams
      serviceTeamRequirements.forEach(req => {
        const existingReq = teamRequirements.value.find(t => t.teamName === req.teamName);
        if (existingReq) {
          existingReq.membersNeeded = req.membersNeeded;
          existingReq.isActive = req.isActive;
        }
      });
    }
  } catch (error) {
    console.error('Error loading service:', error);
    await showToast('Erreur lors du chargement du service', 'danger');
  } finally {
    loading.value = false;
  }
};

const saveService = async () => {
  if (!isFormValid.value) return;
  
  loading.value = true;
  
  try {
    if (isEditing.value) {
      const updateRequest: UpdateServiceRequest = {
        id: route.params.id as string,
        title: formData.title.trim(),
        date: formData.date,
        time: formData.time,
        category: formData.category,
        isPublished: formData.isPublished,
        availabilityDeadline: formData.availabilityDeadline || undefined,
        teamRequirements: teamRequirements.value.filter(req => req.isActive && req.membersNeeded > 0)
      };
      
      const updated = await serviceService.updateService(updateRequest);
      if (updated) {
        await showToast('Service mis à jour avec succès', 'success');
        router.push(`/service-detail/${updated.id}`);
      }
    } else {
      const createRequest: CreateServiceRequest = {
        title: formData.title.trim(),
        date: formData.date,
        time: formData.time,
        category: formData.category,
        isPublished: formData.isPublished,
        availabilityDeadline: formData.availabilityDeadline || undefined,
        teamRequirements: teamRequirements.value.filter(req => req.isActive && req.membersNeeded > 0)
      };
      
      const created = await serviceService.createService(createRequest);
      await showToast('Service créé avec succès', 'success');
      router.push(`/service-detail/${created.id}`);
    }
  } catch (error) {
    console.error('Error saving service:', error);
    await showToast('Erreur lors de la sauvegarde', 'danger');
  } finally {
    loading.value = false;
  }
};

const cancel = () => {
  router.push(backUrl.value);
};

// Date and time picker functions
const openServiceDatePicker = () => {
  // Initialize with current form values or defaults
  if (formData.date && formData.time) {
    // Ensure we have the right format: YYYY-MM-DDTHH:MM
    tempServiceDateTime.value = `${formData.date}T${formData.time}`;
    console.log('Using existing values:', tempServiceDateTime.value);
  } else {
    // Default to tomorrow at 10:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    // Use the datetime-local format (YYYY-MM-DDTHH:MM)
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const hours = String(tomorrow.getHours()).padStart(2, '0');
    const minutes = String(tomorrow.getMinutes()).padStart(2, '0');
    tempServiceDateTime.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    console.log('Using default values:', tempServiceDateTime.value);
  }
  showServiceDateModal.value = true;
};

const confirmServiceDateTime = () => {
  if (tempServiceDateTime.value) {
    // tempServiceDateTime.value is in format "YYYY-MM-DDTHH:MM"
    const [datePart, timePart] = tempServiceDateTime.value.split('T');
    formData.date = datePart;
    formData.time = timePart;
  }
  showServiceDateModal.value = false;
};

const formatServiceDateTime = () => {
  const date = new Date(`${formData.date}T${formData.time}`);
  return date.toLocaleString('fr-CA', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Toronto'
  });
};

const openDeadlinePicker = () => {
  if (formData.availabilityDeadline) {
    // Convert ISO string to datetime-local format
    const date = new Date(formData.availabilityDeadline);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    tempDeadlineDateTime.value = `${year}-${month}-${day}T${hours}:${minutes}`;
  } else {
    // Default to 1 day before service at 23:59
    if (formData.date && formData.time) {
      const serviceDate = new Date(`${formData.date}T${formData.time}`);
      serviceDate.setDate(serviceDate.getDate() - 1);
      serviceDate.setHours(23, 59, 0, 0);
      const year = serviceDate.getFullYear();
      const month = String(serviceDate.getMonth() + 1).padStart(2, '0');
      const day = String(serviceDate.getDate()).padStart(2, '0');
      const hours = String(serviceDate.getHours()).padStart(2, '0');
      const minutes = String(serviceDate.getMinutes()).padStart(2, '0');
      tempDeadlineDateTime.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    } else {
      // Fallback to tomorrow at 23:59
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 0, 0);
      const year = tomorrow.getFullYear();
      const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const day = String(tomorrow.getDate()).padStart(2, '0');
      const hours = String(tomorrow.getHours()).padStart(2, '0');
      const minutes = String(tomorrow.getMinutes()).padStart(2, '0');
      tempDeadlineDateTime.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
  }
  showDeadlineModal.value = true;
};

const confirmDeadlineDateTime = () => {
  if (tempDeadlineDateTime.value) {
    // Store as ISO string without milliseconds
    formData.availabilityDeadline = new Date(tempDeadlineDateTime.value).toISOString();
  }
  showDeadlineModal.value = false;
};

const clearDeadline = () => {
  formData.availabilityDeadline = '';
  tempDeadlineDateTime.value = '';
  showDeadlineModal.value = false;
};

const formatDeadlineDisplay = () => {
  const date = new Date(formData.availabilityDeadline);
  return date.toLocaleString('fr-CA', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Toronto'
  });
};

// Team requirements functions
const incrementTeamRequirement = (index: number) => {
  if (teamRequirements.value[index].membersNeeded < 20) {
    teamRequirements.value[index].membersNeeded++;
  }
};

const decrementTeamRequirement = (index: number) => {
  if (teamRequirements.value[index].membersNeeded > 0) {
    teamRequirements.value[index].membersNeeded--;
  }
};

const showToast = async (message: string, color: string) => {
  const toast = await toastController.create({
    message,
    duration: 2000,
    color
  });
  
  await toast.present();
};

onMounted(async () => {
  // Initialize default values if not editing
  if (!isEditing.value) {
    formData.date = minDate.value;
  }
  
  // Load teams first, then service data
  await loadTeams();
  await loadService();
});
</script>

<style scoped>
ion-item ion-label p {
  color: var(--ion-color-medium);
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

ion-item ion-label h3 {
  font-size: 1rem;
  font-weight: 500;
  color: var(--ion-color-dark);
}

ion-modal {
  --height: auto;
  --max-height: 90vh;
}

ion-modal ion-content {
  --padding-top: 0;
  --padding-bottom: 1rem;
}

ion-modal ion-datetime {
  margin: 0;
  --background: transparent;
}

@media (min-width: 768px) {
  ion-modal {
    --width: 500px;
    --border-radius: 12px;
  }
}

@media (max-width: 767px) {
  ion-modal {
    --width: 100%;
    --height: 80vh;
  }
}

/* Team Requirements Section */
.team-requirements-section {
  margin-top: 2rem;
}

.section-header {
  display: flex;
  align-items: center;
  padding: 1rem 0;
  margin-bottom: 1rem;
}

.section-icon {
  font-size: 1.5rem;
  margin-right: 0.75rem;
}

.section-title h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--ion-color-dark);
  margin: 0 0 0.25rem 0;
}

.section-title p {
  font-size: 0.875rem;
  color: var(--ion-color-medium);
  margin: 0;
}

.team-requirements-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.team-requirement-card {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.team-requirement-card.active {
  border-color: var(--ion-color-primary);
  background: #fef9f9;
}

.team-toggle {
  margin-right: 1rem;
}

.team-info {
  flex: 1;
}

.team-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--ion-color-dark);
  margin: 0 0 0.25rem 0;
}

.team-subtitle {
  font-size: 0.875rem;
  margin: 0;
}

.team-subtitle:not(.inactive) {
  color: var(--ion-color-medium);
}

.team-subtitle.inactive {
  color: var(--ion-color-light);
}

.team-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.team-controls ion-button {
  --padding-start: 0.5rem;
  --padding-end: 0.5rem;
  --color: var(--ion-color-medium);
  height: 2rem;
  width: 2rem;
}

.team-controls ion-button:not([disabled]) {
  --color: var(--ion-color-primary);
}

.member-count {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--ion-color-dark);
  min-width: 2rem;
  text-align: center;
}

@media (max-width: 768px) {
  .team-requirement-card {
    padding: 0.75rem;
  }
  
  .section-title h2 {
    font-size: 1.125rem;
  }
  
  .team-name {
    font-size: 0.95rem;
  }
}
</style>