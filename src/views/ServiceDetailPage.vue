<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/services"></ion-back-button>
        </ion-buttons>
        <ion-title>Détail du Service</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="goToEdit" fill="clear">
            <ion-icon :icon="pencil" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content :fullscreen="true">
      <ion-loading :is-open="loading" message="Chargement..."></ion-loading>
      
      <div v-if="service" class="ion-padding">
        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ service.title }}</ion-card-title>
            <ion-card-subtitle>
              <ion-chip :color="getCategoryColor(service.category)">
                {{ service.category }}
              </ion-chip>
              <ion-chip v-if="service.isPublished" color="success">
                <ion-icon :icon="checkmarkCircle" />
                <ion-label>Publié</ion-label>
              </ion-chip>
              <ion-chip v-else color="warning">
                <ion-icon :icon="timeOutline" />
                <ion-label>Brouillon</ion-label>
              </ion-chip>
            </ion-card-subtitle>
          </ion-card-header>
          
          <ion-card-content>
            <ion-list>
              <ion-item>
                <ion-icon :icon="calendarOutline" slot="start" />
                <ion-label>
                  <h3>Date et heure</h3>
                  <p>{{ formatDateTime(service.date, service.time) }}</p>
                </ion-label>
              </ion-item>
              
              <ion-item>
                <ion-icon :icon="informationCircleOutline" slot="start" />
                <ion-label>
                  <h3>Catégorie</h3>
                  <p>{{ service.category }}</p>
                </ion-label>
              </ion-item>
              
              <ion-item v-if="service.availabilityDeadline">
                <ion-icon :icon="timerOutline" slot="start" :color="isDeadlinePassed ? 'danger' : 'warning'" />
                <ion-label>
                  <h3>Date limite pour les disponibilités</h3>
                  <p :class="{ 'deadline-passed': isDeadlinePassed }">
                    {{ formatDeadline(service.availabilityDeadline) }}
                    <span v-if="isDeadlinePassed"> (Dépassée)</span>
                  </p>
                </ion-label>
              </ion-item>
              
              <ion-item button @click="goToMembers">
                <ion-icon :icon="peopleOutline" slot="start" />
                <ion-label>
                  <h3>Membres assignés</h3>
                  <p v-if="loadingMembers">Chargement...</p>
                  <p v-else>
                    {{ memberCount }} membre{{ memberCount !== 1 ? 's' : '' }} assigné{{ memberCount !== 1 ? 's' : '' }}
                  </p>
                </ion-label>
                <ion-icon :icon="chevronForwardOutline" slot="end" />
              </ion-item>
              
              <ion-item button @click="goToProgram">
                <ion-icon :icon="documentTextOutline" slot="start" :color="canCreateProgram ? 'warning' : undefined" />
                <ion-label>
                  <h3>Programme du service</h3>
                  <p :class="{ 'create-program-text': canCreateProgram }">
                    {{ programDescription }}
                  </p>
                </ion-label>
                <ion-icon :icon="canCreateProgram ? createOutline : chevronForwardOutline" slot="end" :color="canCreateProgram ? 'warning' : undefined" />
              </ion-item>
              
              <ion-item>
                <ion-icon :icon="createOutline" slot="start" />
                <ion-label>
                  <h3>Créé le</h3>
                  <p>{{ formatTimestamp(service.createdAt) }}</p>
                </ion-label>
              </ion-item>
              
              <ion-item>
                <ion-icon :icon="syncOutline" slot="start" />
                <ion-label>
                  <h3>Modifié le</h3>
                  <p>{{ formatTimestamp(service.modifiedAt) }}</p>
                </ion-label>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>
        
        <ion-button expand="block" color="primary" @click="goToEdit" class="ion-margin-top">
          <ion-icon :icon="pencil" slot="start" />
          Modifier ce service
        </ion-button>
        
        <ion-button expand="block" color="danger" fill="outline" @click="confirmDelete" class="ion-margin-top">
          <ion-icon :icon="trashOutline" slot="start" />
          Supprimer ce service
        </ion-button>
      </div>
      
      <div v-else-if="!loading" class="ion-text-center ion-padding">
        <ion-icon :icon="alertCircleOutline" size="large" color="warning" />
        <h2>Service non trouvé</h2>
        <p>Le service demandé n'existe pas ou a été supprimé.</p>
        <ion-button @click="goBack" fill="outline">
          Retour aux services
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle,
  IonCardContent, IonList, IonItem, IonLabel, IonChip, IonLoading, alertController
} from '@ionic/vue';
import {
  pencil, calendarOutline, timeOutline, informationCircleOutline, createOutline,
  syncOutline, checkmarkCircle, trashOutline, alertCircleOutline, timerOutline,
  peopleOutline, chevronForwardOutline, documentTextOutline
} from 'ionicons/icons';
import { Service, ServiceCategory } from '@/types/service';
import { serviceService } from '@/services/serviceService';
import { assignmentsService } from '@/firebase/assignments';
import { timezoneUtils } from '@/utils/timezone';
import { getProgramByServiceId } from '@/firebase/programs';
import { useUser } from '@/composables/useUser';
import type { ServiceProgram } from '@/types/program';

const route = useRoute();
const router = useRouter();
const { isAdmin } = useUser();
const service = ref<Service | null>(null);
const loading = ref(true);
const memberCount = ref(0);
const loadingMembers = ref(false);
const program = ref<ServiceProgram | null>(null);
const loadingProgram = ref(false);

const loadService = async () => {
  const id = route.params.id as string;
  try {
    service.value = await serviceService.getServiceById(id);
    // Load member count and program in parallel
    loadMemberCount();
    loadProgram();
  } catch (error) {
    console.error('Error loading service:', error);
  } finally {
    loading.value = false;
  }
};

const loadMemberCount = async () => {
  const id = route.params.id as string;
  loadingMembers.value = true;
  try {
    const assignments = await assignmentsService.getServiceAssignments(id);
    memberCount.value = assignments.length;
  } catch (error) {
    console.error('Error loading member count:', error);
    memberCount.value = 0;
  } finally {
    loadingMembers.value = false;
  }
};

const loadProgram = async () => {
  const id = route.params.id as string;
  loadingProgram.value = true;
  try {
    program.value = await getProgramByServiceId(id);
  } catch (error) {
    console.error('Error loading program:', error);
    program.value = null;
  } finally {
    loadingProgram.value = false;
  }
};

const formatDateTime = (dateStr: string, timeStr: string) => {
  return timezoneUtils.formatDateTimeForDisplay(dateStr, timeStr);
};

const formatTimestamp = (dateTimeStr: string) => {
  return new Date(dateTimeStr).toLocaleString('fr-CA', {
    timeZone: 'America/Toronto'
  });
};

const getCategoryColor = (category: ServiceCategory) => {
  return category === ServiceCategory.SERVICE ? 'primary' : 'secondary';
};

const isDeadlinePassed = computed(() => {
  if (!service.value?.availabilityDeadline) return false;
  const deadline = new Date(service.value.availabilityDeadline);
  const now = new Date();
  return deadline < now;
});

const formatDeadline = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString('fr-CA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Toronto'
  });
};

const programItemCount = computed(() => {
  return program.value?.items.length || 0;
});

const programDescription = computed(() => {
  if (loadingProgram.value) return 'Chargement...';
  if (!program.value) {
    return isAdmin.value ? 'Aucun programme - Cliquez pour en créer un' : 'Aucun programme disponible';
  }
  return `${programItemCount.value} élément${programItemCount.value !== 1 ? 's' : ''} au programme`;
});

const canCreateProgram = computed(() => {
  return isAdmin.value && !program.value;
});

const goToEdit = () => {
  router.push(`/service-form/${service.value?.id}`);
};

const goToMembers = () => {
  router.push(`/service-members/${service.value?.id}`);
};

const goToProgram = () => {
  if (canCreateProgram.value) {
    // Navigate to program page which will handle program creation
    router.push(`/service-program/${service.value?.id}`);
  } else {
    router.push(`/service-program/${service.value?.id}`);
  }
};

const goBack = () => {
  router.push('/tabs/services');
};

const confirmDelete = async () => {
  const alert = await alertController.create({
    header: 'Confirmer la suppression',
    message: 'Êtes-vous sûr de vouloir supprimer ce service ? Cette action est irréversible.',
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel'
      },
      {
        text: 'Supprimer',
        role: 'destructive',
        handler: async () => {
          if (service.value) {
            await serviceService.deleteService(service.value.id);
            router.push('/tabs/services');
          }
        }
      }
    ]
  });
  
  await alert.present();
};

onMounted(() => {
  loadService();
});
</script>

<style scoped>
.deadline-passed {
  color: var(--ion-color-danger);
  font-weight: 600;
}

.create-program-text {
  color: var(--ion-color-warning);
  font-weight: 500;
  font-style: italic;
}
</style>