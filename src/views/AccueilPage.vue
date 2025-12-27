<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Accueil</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" class="avatar-button" id="avatar-trigger-accueil" @click="toggleUserMenu">
            <ion-avatar v-if="userAvatar" class="header-avatar">
              <img :src="userAvatar" :alt="userName" />
            </ion-avatar>
            <ion-avatar v-else class="header-avatar initials-avatar">
              <span class="initials">{{ userInitials }}</span>
            </ion-avatar>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Accueil</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="content-container">
        <!-- Welcome Section -->
        <ion-card class="welcome-section">
          <ion-card-content>
            <h1 class="welcome-title">Bienvenue {{ memberFirstName }}!</h1>
            <p class="welcome-subtitle">Prêt à servir dans la maison du Seigneur</p>
          </ion-card-content>
        </ion-card>

        <!-- Availability Encouragement Card -->
        <ion-card v-if="servicesAwaitingResponseCount > 0" class="encouragement-card">
          <ion-card-content>
            <div class="encouragement-content">
              <div class="encouragement-icon">
                <ion-icon :icon="handRightOutline" color="primary"></ion-icon>
              </div>
              <div class="encouragement-text">
                <h3 class="encouragement-title">{{ servicesAwaitingResponseCount }} service{{ servicesAwaitingResponseCount > 1 ? 's' : '' }} en attente</h3>
                <p class="encouragement-description">
                  Aidez-nous à planifier les services en indiquant vos disponibilités. Votre engagement fait la différence.
                </p>
              </div>
              <ion-button
                @click="() => router.push('/disponibilites')"
                fill="solid"
                color="primary"
                class="encouragement-button"
              >
                <ion-icon :icon="calendarOutline" slot="start"></ion-icon>
                Indiquer mes disponibilités
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Mobile Phone Prompt Card -->
        <ion-card v-if="!memberPhone" class="phone-prompt-card">
          <ion-card-content>
            <div class="prompt-content">
              <div class="prompt-icon">
                <ion-icon :icon="phonePortraitOutline" color="primary"></ion-icon>
              </div>
              <div class="prompt-text">
                <h3 class="prompt-title">Restez connecté!</h3>
                <p class="prompt-description">
                  Recevez les mises à jour et activités de l'église directement sur votre cellulaire.
                </p>
              </div>
              <ion-button
                @click="openPhoneModal"
                fill="outline"
                color="primary"
                class="prompt-button"
              >
                <ion-icon :icon="addOutline" slot="start"></ion-icon>
                Ajouter mon mobile
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- New Feature Announcement: Avatar Upload -->
        <ion-card v-if="showAvatarAnnouncement" class="feature-announcement-card">
          <ion-card-content>
            <button class="dismiss-button" @click="dismissAvatarAnnouncement">
              <ion-icon :icon="closeOutline"></ion-icon>
            </button>
            <div class="announcement-content">
              <div class="announcement-badge">
                <ion-icon :icon="sparklesOutline"></ion-icon>
                <span>Nouveau</span>
              </div>
              <div class="announcement-icon">
                <ion-icon :icon="cameraOutline" color="primary"></ion-icon>
              </div>
              <div class="announcement-text">
                <h3 class="announcement-title">Personnalisez votre profil!</h3>
                <p class="announcement-description">
                  Vous pouvez maintenant ajouter votre propre photo de profil. Cliquez sur votre avatar dans "Mon compte" pour télécharger une image.
                </p>
              </div>
              <ion-button
                @click="goToMyAccount"
                fill="solid"
                color="primary"
                class="announcement-button"
              >
                <ion-icon :icon="cameraOutline" slot="start"></ion-icon>
                Ajouter ma photo
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Upcoming Services Section -->
        <ion-card class="services-card">
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="calendarOutline" class="section-icon"></ion-icon>
              Prochains services
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div v-if="upcomingServices.length > 0">
              <div
                v-for="service in upcomingServices.slice(0, 3)"
                :key="service.id"
                class="service-item clickable"
                @click="goToServiceDetail(service.id)"
              >
                <div class="service-info">
                  <h4 class="service-title">{{ service.title }}</h4>
                  <p class="service-date">
                    {{ formatServiceDateTime(service.date, service.time) }}
                    <span v-if="service.endDate && service.endTime" class="service-duration">
                      ({{ calculateDuration(service.date, service.time, service.endDate, service.endTime) }})
                    </span>
                  </p>

                  <!-- Assignment Status -->
                  <div class="assignment-status">
                    <ion-chip
                      v-if="getUserAssignmentStatus(service.id)"
                      color="success"
                      class="status-chip"
                    >
                      <ion-icon :icon="checkmarkCircle" slot="start"></ion-icon>
                      <ion-label>Assigné</ion-label>
                    </ion-chip>
                    <ion-chip
                      v-else
                      color="medium"
                      class="status-chip"
                    >
                      <ion-icon :icon="helpOutline" slot="start"></ion-icon>
                      <ion-label>Non assigné</ion-label>
                    </ion-chip>
                  </div>
                </div>

                <!-- Action Buttons - hidden for now -->
                <div v-if="false" class="service-actions">
                  <ion-button
                    v-if="hasTeamRequirements(service)"
                    @click="goToServiceMembers(service.id)"
                    fill="clear"
                    size="small"
                    class="action-button"
                  >
                    <ion-icon :icon="peopleOutline" slot="start" />
                    <ion-label>Équipes</ion-label>
                  </ion-button>
                  <ion-button
                    v-if="hasServiceProgram(service)"
                    @click="goToServiceProgram(service.id)"
                    fill="clear"
                    size="small"
                    class="action-button"
                  >
                    <ion-icon :icon="bookOutline" slot="start" />
                    <ion-label>Programme</ion-label>
                  </ion-button>
                </div>
              </div>
              <ion-button
                fill="clear"
                expand="block"
                class="view-all-button"
                @click="() => router.push('/services')"
              >
                Voir tous les services
                <ion-icon :icon="arrowForwardOutline" slot="end"></ion-icon>
              </ion-button>
            </div>
            <div v-else class="no-services">
              <ion-icon :icon="calendarOutline" color="medium"></ion-icon>
              <p>Aucun service programmé pour le moment</p>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Church Info -->
        <ion-card class="church-info-card">
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="homeOutline" class="section-icon"></ion-icon>
              Église Évangélique Galilée
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p class="church-description">
              Ensemble, nous servons dans la joie et l'unité pour l'avancement du Royaume de Dieu. 
              Chaque service est une opportunité de mettre nos dons au service de la communauté.
            </p>
            <!--<div class="church-contact">
              <ion-icon :icon="globeOutline" color="primary"></ion-icon>
              <span>eglisegalilee.com</span>
            </div>-->
          </ion-card-content>
        </ion-card>

        <!-- My Ministries Section -->
        <ion-card v-if="memberMinistries.length > 0" class="ministries-card">
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="peopleOutline" class="section-icon"></ion-icon>
              Mes ministères
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="ministries-list">
              <ion-chip 
                v-for="ministry in memberMinistries" 
                :key="ministry" 
                color="primary"
                class="ministry-chip"
              >
                <ion-icon :icon="checkmarkCircle" slot="start"></ion-icon>
                <ion-label>{{ ministry }}</ion-label>
              </ion-chip>
            </div>
          </ion-card-content>
        </ion-card>


        <!-- Inspirational Quote -->
        <ion-card class="inspiration-card">
          <ion-card-content>
            <div class="quote-content">
              <ion-icon :icon="bookOutline" class="quote-icon"></ion-icon>
              <blockquote class="bible-verse">
                "Car nous sommes son ouvrage, ayant été créés en Jésus-Christ pour de bonnes œuvres, que Dieu a préparées d'avance, afin que nous les pratiquions."
              </blockquote>
              <p class="verse-reference">— Éphésiens 2:10</p>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
      
      <UserMenu
        :is-open="isUserMenuOpen"
        trigger-id="avatar-trigger-accueil"
        @close="closeUserMenu"
      />
    </ion-content>

    <!-- Phone Request Modal -->
    <PhoneRequestModal
      :is-open="showPhoneModal"
      @close="closePhoneModal"
      @save="savePhoneNumber"
    />

    <!-- PWA Install Prompt -->
    <InstallPrompt
      :is-open="showInstallPrompt"
      :deferred-prompt="deferredPrompt"
      @dismiss="dismissInstallPrompt"
      @installed="onAppInstalled"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonButtons, IonButton, IonAvatar, IonIcon, IonRefresher, IonRefresherContent,
  IonChip, IonLabel
} from '@ionic/vue';
import {
  bookOutline, peopleOutline, checkmarkCircle, calendarOutline,
  helpOutline, arrowForwardOutline, homeOutline, phonePortraitOutline,
  addOutline, handRightOutline, cameraOutline, sparklesOutline, closeOutline
} from 'ionicons/icons';
import { db } from '@/firebase/config';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { useUser } from '@/composables/useUser';
import { assignmentsService } from '@/firebase/assignments';
import { teamsService } from '@/firebase/teams';
import { timezoneUtils } from '@/utils/timezone';
import { membersService } from '@/firebase/members';
import UserMenu from '@/components/UserMenu.vue';
import InstallPrompt from '@/components/InstallPrompt.vue';
import PhoneRequestModal from '@/components/PhoneRequestModal.vue';
import type { Service } from '@/types/service';
import type { ServiceAssignment } from '@/types/assignment';

const router = useRouter();
const { userAvatar, userInitials, userName, member, loadMemberData } = useUser();
const isUserMenuOpen = ref(false);
const allServices = ref<Service[]>([]);
const userTeamNames = ref<string[]>([]);
const userAssignments = ref<ServiceAssignment[]>([]);
const showPhoneModal = ref(false);

// Realtime subscription cleanup
let unsubscribeServices: (() => void) | null = null;

// Avatar announcement - show only if user hasn't dismissed it and doesn't have a custom avatar
const AVATAR_ANNOUNCEMENT_KEY = 'avatar_announcement_dismissed';
const showAvatarAnnouncement = computed(() => {
  // Don't show if user already has a custom avatar (not from Google)
  if (member.value?.avatar && !member.value.avatar.includes('googleusercontent.com')) {
    return false;
  }
  // Check if user has dismissed the announcement
  const dismissed = localStorage.getItem(AVATAR_ANNOUNCEMENT_KEY);
  return !dismissed;
});

const dismissAvatarAnnouncement = () => {
  localStorage.setItem(AVATAR_ANNOUNCEMENT_KEY, 'true');
};

const goToMyAccount = () => {
  dismissAvatarAnnouncement();
  router.push('/my-account');
};

const memberFirstName = computed(() => {
  return member.value?.firstName || 'Ami(e)';
});

const memberMinistries = computed(() => {
  return member.value?.ministries || [];
});

const memberPhone = computed(() => {
  return member.value?.phone;
});

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

// Computed upcoming services filtered from realtime data
const upcomingServices = computed(() => {
  if (!allServices.value.length) return [];

  const now = new Date();
  const nowTime = now.getTime();

  // Filter only published services first
  return allServices.value
    .filter(service => service.isPublished)
    .map(service => {
      const parsedDateTime = new Date(`${service.date}T${service.time}:00`);
      // Calculate end datetime (use endDate/endTime if available, otherwise use start datetime)
      const endDateTime = service.endDate && service.endTime
        ? new Date(`${service.endDate}T${service.endTime}:00`)
        : parsedDateTime;
      // Add 1 hour buffer after end time
      const pastThreshold = new Date(endDateTime.getTime() + 60 * 60 * 1000);
      return {
        ...service,
        parsedDateTime,
        pastThreshold
      };
    })
    .filter(service => {
      // Hide service 1 hour after end datetime
      if (service.pastThreshold.getTime() <= nowTime) return false;

      // Check if user is a guest for this service
      const isGuest = service.guestMemberIds?.includes(member.value?.id || '');
      if (isGuest) return true;

      // Filter by user membership in needed teams
      if (service.teamRequirements && service.teamRequirements.length > 0) {
        const activeTeamNames = service.teamRequirements
          .filter(req => req.isActive)
          .map(req => req.teamName);

        // Only show service if user is member of at least one needed team
        return activeTeamNames.some(teamName => userTeamNames.value.includes(teamName));
      }

      // If no team requirements, show the service
      return true;
    })
    .sort((a, b) => a.parsedDateTime.getTime() - b.parsedDateTime.getTime());
});

const getServiceAvailability = (serviceId: string): 'available' | 'unavailable' | 'maybe' | null => {
  return member.value?.availabilities?.[serviceId] || null;
};

// Memoize assignment lookup for better performance
const userAssignmentSet = computed(() => {
  return new Set(userAssignments.value.map(assignment => assignment.serviceId));
});

const isUserAssignedToService = (serviceId: string): boolean => {
  return userAssignmentSet.value.has(serviceId);
};

const servicesAwaitingResponseCount = computed(() => {
  if (!member.value) return 0;

  const assignmentSet = userAssignmentSet.value;
  let count = 0;

  for (const service of upcomingServices.value) {
    const availability = getServiceAvailability(service.id);
    const isAssigned = assignmentSet.has(service.id);
    if (availability === null && !isAssigned) {
      count++;
    }
  }

  return count;
});

// PWA Install Prompt
const showInstallPrompt = ref(false);
const deferredPrompt = ref<any>(null);
const hasBeenPrompted = ref(false);

const formatServiceDateTime = (date: string, time: string) => {
  return timezoneUtils.formatDateTimeForDisplay(date, time);
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

const getUserAssignmentStatus = (serviceId: string): boolean => {
  return userAssignmentSet.value.has(serviceId);
};

const hasTeamRequirements = (service: Service) => {
  return service.isPublished && service.teamRequirements && service.teamRequirements.length > 0;
};

const hasServiceProgram = (service: Service) => {
  return service.isPublished;
};

const goToServiceDetail = (serviceId: string) => {
  router.push(`/service-detail/${serviceId}`);
};

const goToServiceMembers = (serviceId: string) => {
  router.push(`/service-members/${serviceId}`);
};

const goToServiceProgram = (serviceId: string) => {
  router.push(`/service-program/${serviceId}`);
};

const loadUserAssignments = async () => {
  try {
    if (!member.value?.id || upcomingServices.value.length === 0) return;

    const memberId = member.value.id;

    // Load all assignments in parallel instead of sequential loop
    const assignmentPromises = upcomingServices.value.map(service =>
      assignmentsService.getMemberServiceAssignments(service.id, memberId)
    );

    const assignmentResults = await Promise.allSettled(assignmentPromises);
    const allAssignments: ServiceAssignment[] = [];

    assignmentResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        allAssignments.push(...result.value);
      }
    });

    userAssignments.value = allAssignments;
  } catch (error) {
    console.error('Error loading user assignments:', error);
    userAssignments.value = [];
  }
};

// Load user's team names from team IDs
const loadUserTeamNames = async () => {
  const userTeamIds = member.value?.teams || [];
  if (userTeamIds.length > 0) {
    try {
      const teamPromises = userTeamIds.map(teamId => teamsService.getTeamById(teamId));
      const teams = await Promise.all(teamPromises);
      userTeamNames.value = teams.filter(team => team !== null).map(team => team!.name);
    } catch (error) {
      console.error('Error loading user team names:', error);
      userTeamNames.value = [];
    }
  } else {
    userTeamNames.value = [];
  }
};

// Subscribe to realtime updates for services (filter isPublished in computed)
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
      allServices.value = loadedServices;
    },
    (error) => {
      console.error('Error in services realtime listener:', error);
      allServices.value = [];
    }
  );
};

const loadData = async () => {
  // Load user team names for filtering (assignments are loaded via watch on upcomingServices)
  await loadUserTeamNames();
};

const handleRefresh = (event: any) => {
  // With realtime updates, data is always fresh
  // Just reload team names and assignments, then complete
  loadData().then(() => {
    event.target.complete();
  });
};


const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value;
};

const closeUserMenu = () => {
  isUserMenuOpen.value = false;
};

const openPhoneModal = () => {
  showPhoneModal.value = true;
};

const closePhoneModal = () => {
  showPhoneModal.value = false;
};

const savePhoneNumber = async (phoneNumber: string) => {
  try {
    if (!member.value?.id) {
      console.error('No member ID found');
      return;
    }

    const updatedMember = await membersService.updateMember(member.value.id, {
      phone: phoneNumber
    });

    if (updatedMember) {
      // Refresh member data to ensure it's current
      await loadMemberData();
      showPhoneModal.value = false;

      // Show success message (optional - could add a toast notification)
      console.log('Phone number saved successfully');
    }
  } catch (error) {
    console.error('Error saving phone number:', error);
    // Could show error toast here
  }
};

// PWA Install Prompt Functions
const checkInstallPromptEligibility = () => {
  // Check if already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return false;
  }
  
  // Check if already prompted in this session
  if (hasBeenPrompted.value) {
    return false;
  }
  
  // Check if user has dismissed the prompt recently (stored in localStorage)
  const dismissedTime = localStorage.getItem('pwa-install-dismissed');
  if (dismissedTime) {
    const dismissed = new Date(dismissedTime);
    const now = new Date();
    const daysSinceDismissed = (now.getTime() - dismissed.getTime()) / (1000 * 3600 * 24);
    if (daysSinceDismissed < 7) { // Don't show for 7 days after dismissing
      return false;
    }
  }
  
  return true;
};

const showInstallPromptAfterDelay = () => {
  if (!checkInstallPromptEligibility()) {
    return;
  }
  
  setTimeout(() => {
    if (checkInstallPromptEligibility() && deferredPrompt.value) {
      showInstallPrompt.value = true;
      hasBeenPrompted.value = true;
    }
  }, 5000); // 5 seconds
};

const dismissInstallPrompt = () => {
  showInstallPrompt.value = false;
  localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
};

const onAppInstalled = () => {
  showInstallPrompt.value = false;
  localStorage.removeItem('pwa-install-dismissed');
  hasBeenPrompted.value = true;
};

// Watch for member data changes to reload team names
watch(() => member.value, (newMember) => {
  if (newMember) {
    loadUserTeamNames();
  }
}, { immediate: true });

// Watch for services changes to reload assignments
watch(() => upcomingServices.value, (newServices) => {
  if (newServices.length > 0 && member.value?.id) {
    loadUserAssignments();
  }
}, { immediate: true });

onMounted(() => {
  // Subscribe to realtime services updates
  subscribeToServices();
  loadData();

  // Auto-show phone popup after 5 seconds if user doesn't have phone
  setTimeout(() => {
    if (!memberPhone.value) {
      showPhoneModal.value = true;
    }
  }, 5000);

  // Listen for the beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('beforeinstallprompt event fired');
    e.preventDefault();
    deferredPrompt.value = e;
    showInstallPromptAfterDelay();
  });

  // Listen for the appinstalled event
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    onAppInstalled();
  });
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
.content-container {
  padding: 0rem;
}

.header-avatar {
  width: 32px;
  height: 32px;
}

.initials-avatar {
  background: #3a3a3c;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.initials {
  font-size: 14px;
  font-weight: 600;
}

.avatar-button {
  --padding-end: 0;
  --padding-start: 0;
}

/* Welcome Section */
.welcome-section {
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, var(--ion-color-primary) 0%, #9f1018 100%);
  color: white;
}

/* Encouragement Card */
.encouragement-card {
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
  border: 1px solid #3B82F6;
}

.encouragement-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
}

.encouragement-icon {
  flex-shrink: 0;
}

.encouragement-icon ion-icon {
  font-size: 3rem;
}

.encouragement-text {
  flex: 1;
}

.encouragement-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1E40AF;
  margin: 0 0 0.5rem 0;
}

.encouragement-description {
  font-size: 0.95rem;
  color: #1E3A8A;
  margin: 0;
  line-height: 1.5;
}

.encouragement-button {
  --border-radius: 8px;
  --padding-start: 20px;
  --padding-end: 20px;
  --height: 44px;
  font-weight: 600;
  font-size: 0.95rem;
}

/* Feature Announcement Card */
.feature-announcement-card {
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #FDF4FF 0%, #FAE8FF 100%);
  border: 1px solid #A855F7;
  position: relative;
  overflow: visible;
}

.dismiss-button {
  position: absolute;
  top: 8px;
  right: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9333EA;
  transition: background-color 0.2s;
}

.dismiss-button:hover {
  background: rgba(147, 51, 234, 0.1);
}

.dismiss-button ion-icon {
  font-size: 1.25rem;
}

.announcement-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.75rem;
  padding-top: 0.5rem;
}

.announcement-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, #9333EA 0%, #A855F7 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.announcement-badge ion-icon {
  font-size: 0.875rem;
}

.announcement-icon {
  flex-shrink: 0;
}

.announcement-icon ion-icon {
  font-size: 2.5rem;
  color: #9333EA;
}

.announcement-text {
  flex: 1;
}

.announcement-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #7E22CE;
  margin: 0 0 0.5rem 0;
}

.announcement-description {
  font-size: 0.9rem;
  color: #6B21A8;
  margin: 0;
  line-height: 1.5;
}

.announcement-button {
  --background: #9333EA;
  --background-hover: #7E22CE;
  --border-radius: 8px;
  --padding-start: 20px;
  --padding-end: 20px;
  --height: 44px;
  font-weight: 600;
  font-size: 0.95rem;
}

.welcome-section ion-card-content {
  text-align: center;
  padding: 2rem 1rem;
}

.welcome-title {
  font-size: 1.75rem;
  font-weight: bold;
  margin: 0 0 0.5rem 0;
}

.welcome-subtitle {
  font-size: 1rem;
  opacity: 0.9;
  margin: 0;
}

/* Inspiration Card */
.inspiration-card {
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #1F2937 0%, #374151 100%);
  color: white;
}

.quote-content {
  text-align: center;
  position: relative;
}

.quote-icon {
  font-size: 2rem;
  color: #FCD34D;
  margin-bottom: 1rem;
}

.bible-verse {
  font-style: italic;
  font-size: 1.125rem;
  line-height: 1.6;
  margin: 1rem 0;
  padding: 0;
  border: none;
}

.verse-reference {
  font-size: 0.875rem;
  color: #D1D5DB;
  margin: 1rem 0 0 0;
  font-weight: 500;
}

/* Ministries Card */
.ministries-card {
  margin-bottom: 1.5rem;
}

.ministries-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.ministry-chip {
  --background: #000000;
  --color: white;
}

/* Services Card */
.services-card {
  margin-bottom: 1.5rem;
}

.service-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem 0;
  border-bottom: 1px solid #F3F4F6;
}

.service-item.clickable {
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin: 0 -1rem;
  padding: 1rem;
  border-radius: 8px;
}

.service-item.clickable:hover {
  background-color: #F9FAFB;
}

.service-item.clickable:active {
  background-color: #F3F4F6;
}

.service-item:last-child {
  border-bottom: none;
}

.service-info {
  flex: 1;
}

.service-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.service-date {
  font-size: 0.875rem;
  color: #6B7280;
  margin: 0 0 0.5rem 0;
}

.service-duration {
  color: var(--ion-color-medium);
  font-weight: 500;
  margin-left: 4px;
}

.assignment-status {
  margin-bottom: 0.5rem;
}

.service-actions {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-left: 1rem;
  align-items: flex-start;
}

.action-button {
  --border-radius: 20px;
  --padding-start: 12px;
  --padding-end: 12px;
  --height: 32px;
  font-size: 0.8rem;
  min-width: 100px;
}

.action-button ion-icon {
  font-size: 0.9rem;
  margin-right: 4px;
}

.status-chip {
  --color: white;
  font-size: 0.75rem;
}

.view-all-button {
  --color: var(--ion-color-primary);
  margin-top: 1rem;
}

.no-services {
  text-align: center;
  padding: 2rem;
  color: #6B7280;
}

.no-services ion-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}


/* Section Icons */
.section-icon {
  margin-right: 0.5rem;
  color: var(--ion-color-primary);
}

/* Church Info Card */
.church-info-card {
  margin-bottom: 2rem;
  background: linear-gradient(135deg, #1F2937 0%, #374151 100%);
  color: white;
}

.church-info-card ion-card-title {
  color: white;
}

.church-description {
  color: #E5E7EB;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.church-contact {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--ion-color-primary);
  font-weight: 500;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .welcome-title {
    font-size: 1.5rem;
  }
  
  ion-card-title {
    font-size: 1.125rem;
  }
  
  .service-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .service-actions {
    margin-left: 0;
    margin-top: 0.5rem;
    flex-direction: row;
    gap: 0.5rem;
  }

  .action-button {
    min-width: 80px;
    font-size: 0.75rem;
    --height: 28px;
  }

  .encouragement-button {
    align-self: stretch;
    margin-top: 0.5rem;
  }
}
</style>
