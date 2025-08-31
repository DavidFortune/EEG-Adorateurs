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
                v-for="service in upcomingServices.slice(0, 2)" 
                :key="service.id" 
                class="service-item"
              >
                <div class="service-info">
                  <h4 class="service-title">{{ service.title }}</h4>
                  <p class="service-date">{{ formatServiceDateTime(service.date, service.time) }}</p>
                </div>
                <div class="availability-status">
                  <ion-chip 
                    v-if="getServiceAvailability(service.id) === 'available'"
                    color="success"
                    class="status-chip"
                  >
                    <ion-icon :icon="checkmarkOutline" slot="start"></ion-icon>
                    <ion-label>Disponible</ion-label>
                  </ion-chip>
                  <ion-chip 
                    v-else-if="getServiceAvailability(service.id) === 'unavailable'"
                    color="danger"
                    class="status-chip"
                  >
                    <ion-icon :icon="closeOutline" slot="start"></ion-icon>
                    <ion-label>Indisponible</ion-label>
                  </ion-chip>
                  <ion-chip 
                    v-else
                    color="warning"
                    class="status-chip"
                  >
                    <ion-icon :icon="helpOutline" slot="start"></ion-icon>
                    <ion-label>À définir</ion-label>
                  </ion-chip>
                </div>
              </div>
              <ion-button 
                fill="clear" 
                expand="block" 
                class="view-all-button"
                @click="() => router.push('/tabs/disponibilites')"
              >
                Voir toutes mes disponibilités
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
            <div class="church-contact">
              <ion-icon :icon="globeOutline" color="primary"></ion-icon>
              <span>eglisegalilee.com</span>
            </div>
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
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, 
  IonCardContent, IonButtons, IonButton, IonAvatar, IonIcon, IonRefresher, IonRefresherContent,
  IonChip, IonLabel
} from '@ionic/vue';
import {
  bookOutline, peopleOutline, checkmarkCircle, calendarOutline, checkmarkOutline, 
  closeOutline, helpOutline, arrowForwardOutline, homeOutline, 
  globeOutline
} from 'ionicons/icons';
import { useUser } from '@/composables/useUser';
import { serviceService } from '@/services/serviceService';
import { timezoneUtils } from '@/utils/timezone';
import UserMenu from '@/components/UserMenu.vue';
import type { Service } from '@/types/service';

const router = useRouter();
const { userAvatar, userInitials, userName, member } = useUser();
const isUserMenuOpen = ref(false);
const upcomingServices = ref<Service[]>([]);

const memberFirstName = computed(() => {
  return member.value?.firstName || 'Ami(e)';
});

const memberMinistries = computed(() => {
  return member.value?.ministries || [];
});

const formatServiceDateTime = (date: string, time: string) => {
  return timezoneUtils.formatDateTimeForDisplay(date, time);
};

const getServiceAvailability = (serviceId: string): 'available' | 'unavailable' | null => {
  return member.value?.availabilities[serviceId] || null;
};

const loadUpcomingServices = async () => {
  try {
    const services = await serviceService.getPublishedServices();
    const now = new Date();
    upcomingServices.value = services
      .filter(service => {
        const serviceDate = new Date(`${service.date}T${service.time}:00`);
        return serviceDate > now;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}:00`);
        const dateB = new Date(`${b.date}T${b.time}:00`);
        return dateA.getTime() - dateB.getTime();
      });
  } catch (error) {
    console.error('Error loading upcoming services:', error);
    upcomingServices.value = [];
  }
};

const handleRefresh = async (event: any) => {
  await loadUpcomingServices();
  event.target.complete();
};


const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value;
};

const closeUserMenu = () => {
  isUserMenuOpen.value = false;
};

onMounted(() => {
  loadUpcomingServices();
});
</script>

<style scoped>
.content-container {
  padding: 1rem;
}

.header-avatar {
  width: 32px;
  height: 32px;
}

.initials-avatar {
  background: var(--ion-color-primary);
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
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #F3F4F6;
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
  margin: 0;
}

.availability-status {
  margin-left: 1rem;
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
  
  .availability-status {
    margin-left: 0;
  }
}
</style>
