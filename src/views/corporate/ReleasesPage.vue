<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/settings"></ion-back-button>
        </ion-buttons>
        <ion-title>Notes de version</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" @click="checkForUpdates" :disabled="checkingUpdates">
            <ion-icon :icon="refreshOutline" :class="{ 'spin': checkingUpdates }"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="releases-content">
      <div class="releases-container">
        <!-- Current Version Header -->
        <div class="current-version-header">
          <div class="version-badge">
            <ion-chip color="primary">
              <ion-icon :icon="rocketOutline"></ion-icon>
              <ion-label>Version {{ currentVersion }}</ion-label>
            </ion-chip>
          </div>
          <p class="version-status">
            {{ updateInfo.hasUpdate ? 'Mise à jour disponible' : 'Vous utilisez la dernière version' }}
          </p>
          
          <ion-button 
            v-if="updateInfo.hasUpdate && updateInfo.updateReady" 
            expand="block" 
            fill="solid" 
            color="success"
            @click="applyUpdate"
            :disabled="applyingUpdate"
          >
            <ion-icon :icon="downloadOutline" slot="start"></ion-icon>
            {{ applyingUpdate ? 'Application...' : 'Appliquer la mise à jour' }}
          </ion-button>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-container">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Chargement des notes de version...</p>
        </div>

        <!-- Release Notes -->
        <div v-else class="releases-list">
          <div v-for="release in releaseNotes" :key="release.version" class="release-card">
            <ion-card>
              <ion-card-header>
                <div class="release-header">
                  <div class="version-info">
                    <ion-card-title>{{ release.title }}</ion-card-title>
                    <ion-card-subtitle>
                      <ion-chip :color="getVersionChipColor(release.version)">
                        <ion-label>v{{ release.version }}</ion-label>
                      </ion-chip>
                      <span class="release-date">{{ formatDate(release.date) }}</span>
                    </ion-card-subtitle>
                  </div>
                </div>
              </ion-card-header>
              
              <ion-card-content>
                <p class="release-description">{{ release.description }}</p>
                
                <!-- Features -->
                <div v-if="release.features.length > 0" class="changelog-section">
                  <h4>
                    <ion-icon :icon="sparklesOutline" color="success"></ion-icon>
                    Nouvelles fonctionnalités
                  </h4>
                  <ul class="changelog-list features">
                    <li v-for="feature in release.features" :key="feature">{{ feature }}</li>
                  </ul>
                </div>

                <!-- Improvements -->
                <div v-if="release.improvements.length > 0" class="changelog-section">
                  <h4>
                    <ion-icon :icon="trendingUpOutline" color="primary"></ion-icon>
                    Améliorations
                  </h4>
                  <ul class="changelog-list improvements">
                    <li v-for="improvement in release.improvements" :key="improvement">{{ improvement }}</li>
                  </ul>
                </div>

                <!-- Fixes -->
                <div v-if="release.fixes.length > 0" class="changelog-section">
                  <h4>
                    <ion-icon :icon="bugOutline" color="warning"></ion-icon>
                    Corrections de bugs
                  </h4>
                  <ul class="changelog-list fixes">
                    <li v-for="fix in release.fixes" :key="fix">{{ fix }}</li>
                  </ul>
                </div>
              </ion-card-content>
            </ion-card>
          </div>
        </div>

        <!-- Update Status -->
        <div class="update-status">
          <p class="last-check">
            Dernière vérification: {{ lastCheckTime ? formatDateTime(lastCheckTime) : 'Jamais' }}
          </p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, 
  IonCardContent, IonChip, IonLabel, IonSpinner, toastController
} from '@ionic/vue';
import {
  refreshOutline, rocketOutline, downloadOutline, sparklesOutline,
  trendingUpOutline, bugOutline
} from 'ionicons/icons';
import { updateService, type UpdateInfo, type ReleaseNote } from '@/services/updateService';

const loading = ref(true);
const checkingUpdates = ref(false);
const applyingUpdate = ref(false);
const releaseNotes = ref<ReleaseNote[]>([]);
const currentVersion = ref(updateService.getCurrentVersion());
const updateInfo = ref<UpdateInfo>({
  hasUpdate: false,
  currentVersion: currentVersion.value
});
const lastCheckTime = ref<Date | null>(null);

const loadReleaseNotes = async () => {
  try {
    loading.value = true;
    releaseNotes.value = await updateService.getReleaseNotes();
  } catch (error) {
    console.error('Erreur lors du chargement des notes de version:', error);
    const toast = await toastController.create({
      message: 'Erreur lors du chargement des notes de version',
      duration: 3000,
      color: 'danger'
    });
    await toast.present();
  } finally {
    loading.value = false;
  }
};

const checkForUpdates = async () => {
  try {
    checkingUpdates.value = true;
    const newUpdateInfo = await updateService.checkForUpdates();
    updateInfo.value = newUpdateInfo;
    lastCheckTime.value = new Date();
    
    if (newUpdateInfo.hasUpdate) {
      const toast = await toastController.create({
        message: 'Mise à jour disponible!',
        duration: 3000,
        color: 'success'
      });
      await toast.present();
    } else {
      const toast = await toastController.create({
        message: 'Vous utilisez déjà la dernière version',
        duration: 2000,
        color: 'primary'
      });
      await toast.present();
    }
  } catch (error) {
    console.error('Erreur lors de la vérification des mises à jour:', error);
    const toast = await toastController.create({
      message: 'Erreur lors de la vérification des mises à jour',
      duration: 3000,
      color: 'danger'
    });
    await toast.present();
  } finally {
    checkingUpdates.value = false;
  }
};

const applyUpdate = async () => {
  try {
    applyingUpdate.value = true;
    
    const toast = await toastController.create({
      message: 'Application de la mise à jour...',
      duration: 2000,
      color: 'primary'
    });
    await toast.present();

    const success = await updateService.applyUpdate();
    
    if (success) {
      const successToast = await toastController.create({
        message: 'Mise à jour appliquée! Redémarrage de l\'application...',
        duration: 3000,
        color: 'success'
      });
      await successToast.present();
      
      await updateService.reloadApp();
    } else {
      throw new Error('Échec de l\'application de la mise à jour');
    }
  } catch (error) {
    console.error('Erreur lors de l\'application de la mise à jour:', error);
    const errorToast = await toastController.create({
      message: 'Erreur lors de l\'application de la mise à jour. Veuillez recharger manuellement.',
      duration: 5000,
      color: 'danger'
    });
    await errorToast.present();
    applyingUpdate.value = false;
  }
};

const getVersionChipColor = (version: string): string => {
  if (version === currentVersion.value) {
    return 'success';
  }
  return 'medium';
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatDateTime = (date: Date): string => {
  return date.toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

onMounted(async () => {
  await loadReleaseNotes();
  
  // Check for updates on load
  await checkForUpdates();
  
  // Listen for update notifications
  updateService.onUpdateAvailable((newUpdateInfo) => {
    updateInfo.value = newUpdateInfo;
  });
});
</script>

<style scoped>
.releases-content {
  --background: #f9fafb;
}

.releases-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

.current-version-header {
  text-align: center;
  padding: 2rem 1rem;
  margin-bottom: 1rem;
}

.version-badge {
  margin-bottom: 1rem;
}

.version-status {
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 1.5rem 0;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: #6b7280;
}

.loading-container ion-spinner {
  margin-bottom: 1rem;
}

.releases-list {
  margin-bottom: 2rem;
}

.release-card {
  margin-bottom: 1.5rem;
}

.release-card ion-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.release-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.version-info {
  flex: 1;
}

.release-date {
  margin-left: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.release-description {
  font-size: 1rem;
  color: #4b5563;
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
}

.changelog-section {
  margin-bottom: 1.5rem;
}

.changelog-section:last-child {
  margin-bottom: 0;
}

.changelog-section h4 {
  display: flex;
  align-items: center;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.75rem 0;
}

.changelog-section h4 ion-icon {
  margin-right: 0.5rem;
}

.changelog-list {
  margin: 0;
  padding-left: 1.5rem;
}

.changelog-list li {
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: 0.5rem;
  color: #4b5563;
}

.changelog-list li:last-child {
  margin-bottom: 0;
}

.features li {
  color: #059669;
}

.improvements li {
  color: #3b82f6;
}

.fixes li {
  color: #d97706;
}

.update-status {
  text-align: center;
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  margin-top: 2rem;
}

.last-check {
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 0;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .release-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .version-info {
    margin-bottom: 0.5rem;
  }
}
</style>