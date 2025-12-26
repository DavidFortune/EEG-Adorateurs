<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="goBack">
            <ion-icon slot="icon-only" :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Détail du Service</ion-title>
        <ion-buttons slot="end">
          <ion-button
            v-if="isAdmin"
            @click="togglePublishStatus"
            fill="clear"
            :disabled="updating"
          >
            <ion-icon :icon="service?.isPublished ? eyeOffOutline : eyeOutline" />
          </ion-button>
          <ion-button v-if="isAdmin" @click="goToEdit" fill="clear">
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
                  <h3>Date et heure de début</h3>
                  <p>{{ formatDateTime(service.date, service.time) }}</p>
                </ion-label>
              </ion-item>

              <ion-item v-if="service.endDate && service.endTime">
                <ion-icon :icon="calendarOutline" slot="start" color="secondary" />
                <ion-label>
                  <h3>Date et heure de fin</h3>
                  <p>{{ formatDateTime(service.endDate, service.endTime) }}</p>
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
              
              <ion-item :button="service.isPublished" @click="service.isPublished ? goToMembers() : null">
                <ion-icon :icon="peopleOutline" slot="start" :color="service.isPublished ? undefined : 'medium'" />
                <ion-label>
                  <h3 :class="{ 'disabled-text': !service.isPublished }">Membres assignés</h3>
                  <p v-if="loadingMembers">Chargement...</p>
                  <p v-else-if="service.isPublished">
                    {{ memberCount }} membre{{ memberCount !== 1 ? 's' : '' }} assigné{{ memberCount !== 1 ? 's' : '' }}
                  </p>
                  <p v-else class="disabled-text">
                    Disponible une fois publié
                  </p>
                </ion-label>
                <ion-icon v-if="service.isPublished" :icon="chevronForwardOutline" slot="end" />
                <ion-icon v-else :icon="lockClosedOutline" slot="end" color="medium" />
              </ion-item>

              <ion-item :button="service.isPublished" @click="service.isPublished ? goToProgram() : null">
                <ion-icon :icon="documentTextOutline" slot="start" :color="service.isPublished ? (canCreateProgram ? 'warning' : undefined) : 'medium'" />
                <ion-label>
                  <h3 :class="{ 'disabled-text': !service.isPublished }">Programme du service</h3>
                  <p v-if="service.isPublished" :class="{ 'create-program-text': canCreateProgram }">
                    {{ programDescription }}
                  </p>
                  <p v-else class="disabled-text">
                    Disponible une fois publié
                  </p>
                </ion-label>
                <ion-icon v-if="service.isPublished" :icon="canCreateProgram ? createOutline : chevronForwardOutline" slot="end" :color="canCreateProgram ? 'warning' : undefined" />
                <ion-icon v-else :icon="lockClosedOutline" slot="end" color="medium" />
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

        <!-- Guests Section (Admin only) -->
        <ion-card v-if="isAdmin" class="guests-card">
          <ion-card-header>
            <ion-card-title class="guests-title">
              <ion-icon :icon="personAddOutline" />
              Invités spéciaux
            </ion-card-title>
            <ion-card-subtitle>
              Personnes ayant accès au service sans être membres d'une équipe requise
            </ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <div v-if="loadingGuests" class="loading-guests">
              <ion-spinner name="crescent" />
              <span>Chargement...</span>
            </div>

            <div v-else-if="guestMembers.length > 0" class="guests-list">
              <div v-for="guest in guestMembers" :key="guest.id" class="guest-item">
                <ion-avatar>
                  <img v-if="guest.avatar" :src="guest.avatar" :alt="guest.fullName" />
                  <div v-else class="avatar-initials">{{ getInitials(guest.fullName) }}</div>
                </ion-avatar>
                <div class="guest-info">
                  <span class="guest-name">{{ guest.fullName }}</span>
                  <span class="guest-email">{{ guest.email }}</span>
                </div>
                <ion-button fill="clear" color="danger" size="small" @click="removeGuest(guest)">
                  <ion-icon :icon="removeCircleOutline" slot="icon-only" />
                </ion-button>
              </div>
            </div>

            <div v-else class="no-guests">
              <p>Aucun invité pour ce service</p>
            </div>

            <ion-button expand="block" fill="outline" @click="openGuestModal" class="add-guest-btn">
              <ion-icon :icon="addOutline" slot="start" />
              Gérer les invités
            </ion-button>
          </ion-card-content>
        </ion-card>
        
        <ion-button v-if="isAdmin" expand="block" color="primary" @click="goToEdit" class="ion-margin-top">
          <ion-icon :icon="pencil" slot="start" />
          Modifier ce service
        </ion-button>
        
        <ion-button v-if="isAdmin" expand="block" color="danger" fill="outline" @click="confirmDelete" class="ion-margin-top">
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

      <!-- Guest Management Modal -->
      <ion-modal :is-open="showGuestModal" @didDismiss="showGuestModal = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Gérer les invités</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showGuestModal = false">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
          <ion-toolbar>
            <ion-searchbar
              v-model="guestSearchQuery"
              placeholder="Rechercher un membre..."
              :debounce="300"
            ></ion-searchbar>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <div v-if="loadingAllMembers" class="modal-loading">
            <ion-spinner name="crescent" />
            <p>Chargement des membres...</p>
          </div>

          <ion-list v-else>
            <ion-item
              v-for="member in filteredMembers"
              :key="member.id"
              :button="true"
              @click="toggleGuestMember(member)"
              :disabled="savingGuests"
            >
              <ion-avatar slot="start">
                <img v-if="member.avatar" :src="member.avatar" :alt="member.fullName" />
                <div v-else class="avatar-initials">{{ getInitials(member.fullName) }}</div>
              </ion-avatar>
              <ion-label>
                <h3>{{ member.fullName }}</h3>
                <p>{{ member.email }}</p>
              </ion-label>
              <ion-chip v-if="isGuestMember(member.id)" color="success" slot="end">
                <ion-icon :icon="checkmarkCircle" />
                <ion-label>Invité</ion-label>
              </ion-chip>
            </ion-item>
          </ion-list>

          <div v-if="!loadingAllMembers && filteredMembers.length === 0" class="no-results">
            <p>Aucun membre trouvé</p>
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonButton, IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle,
  IonCardContent, IonList, IonItem, IonLabel, IonChip, IonLoading, IonModal,
  IonSearchbar, IonAvatar, IonSpinner, alertController, toastController
} from '@ionic/vue';
import {
  pencil, calendarOutline, timeOutline, informationCircleOutline, createOutline,
  syncOutline, checkmarkCircle, trashOutline, alertCircleOutline, timerOutline,
  peopleOutline, chevronForwardOutline, documentTextOutline, eyeOutline,
  eyeOffOutline, lockClosedOutline, personAddOutline, closeOutline, addOutline,
  removeCircleOutline, arrowBackOutline
} from 'ionicons/icons';
import { Service, ServiceCategory } from '@/types/service';
import { serviceService } from '@/services/serviceService';
import { db } from '@/firebase/config';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { assignmentsService } from '@/firebase/assignments';
import { membersService } from '@/firebase/members';
import { timezoneUtils } from '@/utils/timezone';
import { getProgramByServiceId } from '@/firebase/programs';
import { useUser } from '@/composables/useUser';
import type { ServiceProgram } from '@/types/program';
import type { Member } from '@/types/member';

const route = useRoute();
const router = useRouter();
const { isAdmin } = useUser();
const service = ref<Service | null>(null);
const loading = ref(true);
const updating = ref(false);
const memberCount = ref(0);
const loadingMembers = ref(false);
const program = ref<ServiceProgram | null>(null);
const loadingProgram = ref(false);

// Guest management
const showGuestModal = ref(false);
const guestMembers = ref<Member[]>([]);
const loadingGuests = ref(false);
const allMembers = ref<Member[]>([]);
const loadingAllMembers = ref(false);
const guestSearchQuery = ref('');
const savingGuests = ref(false);

// Realtime subscription cleanup
let unsubscribeService: (() => void) | null = null;

// Convert Firestore document to Service type
const convertFirestoreDoc = (id: string, data: any): Service => {
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

// Subscribe to realtime updates for the service
const subscribeToService = () => {
  const id = route.params.id as string;
  const serviceRef = doc(db, 'services', id);

  unsubscribeService = onSnapshot(
    serviceRef,
    async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const previousGuestIds = service.value?.guestMemberIds;
        service.value = convertFirestoreDoc(docSnapshot.id, docSnapshot.data());

        // Reload guest members if guest list changed
        const currentGuestIds = service.value?.guestMemberIds;
        if (JSON.stringify(previousGuestIds) !== JSON.stringify(currentGuestIds)) {
          await loadGuestMembers();
        }

        // Load member count, program, and guests on first load
        if (loading.value) {
          await Promise.allSettled([
            loadMemberCount(),
            loadProgram(),
            loadGuestMembers()
          ]);
        }
      } else {
        service.value = null;
      }
      loading.value = false;
    },
    async (error) => {
      console.error('Error in service realtime listener:', error);
      loading.value = false;
      const toast = await toastController.create({
        message: 'Erreur lors du chargement du service',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  );
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
    // Silent fail for member count as it's not critical
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
    // Silent fail for program as it's not critical
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
  router.push('/services');
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
            router.push('/services');
          }
        }
      }
    ]
  });
  
  await alert.present();
};

const togglePublishStatus = async () => {
  if (!service.value || updating.value) return;

  updating.value = true;

  try {
    await serviceService.updateService({
      ...service.value,
      isPublished: !service.value.isPublished
    });
    // Realtime listener will automatically update service.value
  } catch (error) {
    console.error('Error updating publish status:', error);
    const toast = await toastController.create({
      message: 'Erreur lors de la mise à jour du statut',
      duration: 3000,
      color: 'danger'
    });
    await toast.present();
  } finally {
    updating.value = false;
  }
};

// Guest management functions
const loadGuestMembers = async () => {
  if (!service.value?.guestMemberIds?.length) {
    guestMembers.value = [];
    return;
  }

  loadingGuests.value = true;
  try {
    const members = await Promise.all(
      service.value.guestMemberIds.map(id => membersService.getMemberById(id))
    );
    guestMembers.value = members.filter((m): m is Member => m !== null);
  } catch (error) {
    console.error('Error loading guest members:', error);
    guestMembers.value = [];
  } finally {
    loadingGuests.value = false;
  }
};

const openGuestModal = async () => {
  showGuestModal.value = true;
  guestSearchQuery.value = '';

  // Load all members for selection if not already loaded
  if (allMembers.value.length === 0) {
    loadingAllMembers.value = true;
    try {
      allMembers.value = await membersService.getAllMembers();
    } catch (error) {
      console.error('Error loading all members:', error);
    } finally {
      loadingAllMembers.value = false;
    }
  }
};

const filteredMembers = computed(() => {
  if (!guestSearchQuery.value.trim()) {
    return allMembers.value;
  }

  const query = guestSearchQuery.value.toLowerCase();
  return allMembers.value.filter(member =>
    member.fullName.toLowerCase().includes(query) ||
    member.email.toLowerCase().includes(query)
  );
});

const isGuestMember = (memberId: string) => {
  return service.value?.guestMemberIds?.includes(memberId) || false;
};

const toggleGuestMember = async (member: Member) => {
  if (!service.value) return;

  const currentGuests = service.value.guestMemberIds || [];
  const isRemoving = currentGuests.includes(member.id);
  let newGuests: string[];

  if (isRemoving) {
    newGuests = currentGuests.filter(id => id !== member.id);
  } else {
    newGuests = [...currentGuests, member.id];
  }

  savingGuests.value = true;
  try {
    await serviceService.updateService({
      ...service.value,
      guestMemberIds: newGuests
    });
    // Realtime listener will automatically update service.value and reload guest members

    const toast = await toastController.create({
      message: isRemoving
        ? `${member.fullName} retiré des invités`
        : `${member.fullName} ajouté comme invité`,
      duration: 2000,
      color: 'success'
    });
    await toast.present();
  } catch (error) {
    console.error('Error updating guests:', error);
    const toast = await toastController.create({
      message: 'Erreur lors de la mise à jour des invités',
      duration: 3000,
      color: 'danger'
    });
    await toast.present();
  } finally {
    savingGuests.value = false;
  }
};

const removeGuest = async (member: Member) => {
  const alert = await alertController.create({
    header: 'Retirer l\'invité',
    message: `Voulez-vous retirer ${member.fullName} des invités de ce service ?`,
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel'
      },
      {
        text: 'Retirer',
        role: 'destructive',
        handler: () => {
          toggleGuestMember(member);
        }
      }
    ]
  });
  await alert.present();
};

const getInitials = (name: string): string => {
  const names = name.split(' ').filter(n => n.length > 0);
  if (names.length === 0) return '?';
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
};

const guestCount = computed(() => service.value?.guestMemberIds?.length || 0);

onMounted(() => {
  subscribeToService();
});

onUnmounted(() => {
  // Clean up realtime subscription
  if (unsubscribeService) {
    unsubscribeService();
    unsubscribeService = null;
  }
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

.disabled-text {
  color: var(--ion-color-medium);
  font-style: italic;
}

/* Guests Section Styles */
.guests-card {
  margin-top: 16px;
}

.guests-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.guests-title ion-icon {
  font-size: 1.25rem;
  color: var(--ion-color-primary);
}

.loading-guests {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  color: var(--ion-color-medium);
}

.guests-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.guest-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: var(--ion-color-light);
  border-radius: 8px;
}

.guest-item ion-avatar {
  width: 40px;
  height: 40px;
}

.avatar-initials {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ion-color-primary);
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  border-radius: 50%;
}

.guest-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.guest-name {
  font-weight: 600;
  color: var(--ion-color-dark);
}

.guest-email {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.no-guests {
  text-align: center;
  padding: 16px;
  color: var(--ion-color-medium);
}

.no-guests p {
  margin: 0;
}

.add-guest-btn {
  margin-top: 8px;
}

/* Modal Styles */
.modal-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  color: var(--ion-color-medium);
}

.modal-loading p {
  margin-top: 16px;
}

.no-results {
  text-align: center;
  padding: 32px 16px;
  color: var(--ion-color-medium);
}
</style>