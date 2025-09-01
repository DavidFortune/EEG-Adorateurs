<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/accueil"></ion-back-button>
        </ion-buttons>
        <ion-title>Paramètres</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="settings-content">
      <div class="settings-container">
        <!-- Notifications Section -->
        <ion-card class="notifications-card">
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="notificationsOutline" class="section-icon"></ion-icon>
              Notifications Push
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>Recevez des notifications pour les nouveaux services et événements importants.</p>
            <div class="notification-controls">
              <ion-item lines="none">
                <ion-icon :icon="notificationsOutline" slot="start" :color="isNotificationsEnabled ? 'success' : 'medium'"></ion-icon>
                <ion-label>
                  <h3>Notifications activées</h3>
                  <p>{{ notificationStatus }}</p>
                </ion-label>
                <ion-toggle 
                  :checked="isNotificationsEnabled"
                  @ionChange="toggleNotifications"
                  slot="end"
                ></ion-toggle>
              </ion-item>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- App Settings -->
        <ion-card class="app-settings-card">
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="settingsOutline" class="section-icon"></ion-icon>
              Préférences de l'application
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item lines="full">
                <ion-icon :icon="languageOutline" slot="start" color="primary"></ion-icon>
                <ion-label>
                  <h3>Langue</h3>
                  <p>Français</p>
                </ion-label>
              </ion-item>
              <ion-item lines="full">
                <ion-icon :icon="timeOutline" slot="start" color="primary"></ion-icon>
                <ion-label>
                  <h3>Fuseau horaire</h3>
                  <p>America/Montreal</p>
                </ion-label>
              </ion-item>
              <ion-item lines="none" button router-link="/releases">
                <ion-icon :icon="rocketOutline" slot="start" color="primary"></ion-icon>
                <ion-label>
                  <h3>Notes de version</h3>
                  <p>Version {{ appVersion }} • Voir les nouveautés</p>
                </ion-label>
                <ion-chip v-if="hasUpdate" color="success" slot="end">
                  <ion-label>Nouveau</ion-label>
                </ion-chip>
                <ion-icon :icon="chevronForwardOutline" slot="end" color="medium"></ion-icon>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Privacy & Legal -->
        <ion-card class="privacy-card">
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="shieldCheckmarkOutline" class="section-icon"></ion-icon>
              Confidentialité et légal
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item lines="full" button router-link="/terms">
                <ion-icon :icon="documentTextOutline" slot="start" color="primary"></ion-icon>
                <ion-label>
                  <h3>Conditions d'utilisation</h3>
                </ion-label>
                <ion-icon :icon="chevronForwardOutline" slot="end" color="medium"></ion-icon>
              </ion-item>
              <ion-item lines="none" button router-link="/privacy">
                <ion-icon :icon="lockClosedOutline" slot="start" color="primary"></ion-icon>
                <ion-label>
                  <h3>Politique de confidentialité</h3>
                </ion-label>
                <ion-icon :icon="chevronForwardOutline" slot="end" color="medium"></ion-icon>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Support -->
        <ion-card class="support-card">
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="helpCircleOutline" class="section-icon"></ion-icon>
              Support et assistance
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>Pour toute question ou assistance concernant l'application, veuillez contacter:</p>
            <ion-item lines="none" button @click="sendSupportEmail">
              <ion-icon :icon="mailOutline" slot="start" color="primary"></ion-icon>
              <ion-label>
                <h3>Email de support</h3>
                <p>adorateurs@eglisegalilee.com</p>
              </ion-label>
            </ion-item>
          </ion-card-content>
        </ion-card>

        <!-- App Info -->
        <div class="app-info">
          <p class="version">Version {{ appVersion }}</p>
          <p class="copyright">© 2025 Église Évangélique Galilée</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon, IonList, IonItem,
  IonLabel, IonToggle
} from '@ionic/vue';
import { 
  notificationsOutline, settingsOutline, languageOutline, timeOutline,
  shieldCheckmarkOutline, documentTextOutline, lockClosedOutline, 
  helpCircleOutline, mailOutline, chevronForwardOutline, rocketOutline
} from 'ionicons/icons';
import { ref, onMounted } from 'vue';
import { pushNotificationService } from '@/services/pushNotificationService';
import { updateService } from '@/services/updateService';

const isNotificationsEnabled = ref(false);
const notificationStatus = ref('Notifications désactivées');
const appVersion = ref(updateService.getCurrentVersion());
const hasUpdate = ref(false);

const sendSupportEmail = () => {
  window.location.href = 'mailto:adorateurs@eglisegalilee.com?subject=Support EEG Adorateurs';
};

const updateNotificationStatus = async () => {
  const permission = await pushNotificationService.getNotificationPermission();
  const subscribed = await pushNotificationService.isSubscribed();
  
  if (permission === 'granted' && subscribed) {
    isNotificationsEnabled.value = true;
    notificationStatus.value = 'Notifications actives';
  } else if (permission === 'denied') {
    isNotificationsEnabled.value = false;
    notificationStatus.value = 'Notifications refusées';
  } else {
    isNotificationsEnabled.value = false;
    notificationStatus.value = 'Notifications désactivées';
  }
};

const toggleNotifications = async () => {
  if (isNotificationsEnabled.value) {
    await pushNotificationService.unsubscribeFromNotifications();
  } else {
    await pushNotificationService.subscribeToNotifications();
  }
  await updateNotificationStatus();
};

onMounted(async () => {
  await pushNotificationService.initialize();
  await updateNotificationStatus();
  
  // Check for updates and listen for update notifications
  const updateInfo = await updateService.checkForUpdates();
  hasUpdate.value = updateInfo.hasUpdate;
  
  updateService.onUpdateAvailable((info) => {
    hasUpdate.value = info.hasUpdate;
  });
});
</script>

<style scoped>
.settings-content {
  --background: #f9fafb;
}

.settings-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

.notifications-card,
.app-settings-card,
.privacy-card,
.support-card {
  margin-bottom: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.section-icon {
  margin-right: 0.5rem;
  color: var(--ion-color-primary);
  font-size: 1.25rem;
  vertical-align: middle;
}

ion-card-title {
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
}

ion-card-content p {
  line-height: 1.6;
  color: #4b5563;
  margin: 0 0 1rem 0;
}

.notification-controls ion-item {
  --padding-start: 0;
  margin-top: 1rem;
  --background: #f8fafc;
  border-radius: 8px;
}

.app-settings-card ion-list,
.privacy-card ion-list {
  margin: 0;
  padding: 0;
}

.app-settings-card ion-item,
.privacy-card ion-item {
  --padding-start: 12px;
  --padding-end: 12px;
  margin-bottom: 0.5rem;
  border-radius: 8px;
}

.app-settings-card ion-item:last-child,
.privacy-card ion-item:last-child {
  margin-bottom: 0;
}

.app-settings-card h3,
.privacy-card h3 {
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.app-settings-card p,
.privacy-card p {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.support-card ion-item {
  margin-top: 1rem;
  --background: #f3f4f6;
  border-radius: 8px;
  --padding-start: 12px;
}

.support-card ion-item h3 {
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.support-card ion-item p {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.app-info {
  text-align: center;
  padding: 2rem 1rem;
  margin-top: 1rem;
}

.version {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
  font-weight: 500;
}

.copyright {
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 0;
}

@media (max-width: 768px) {
  ion-card-title {
    font-size: 1.125rem;
  }
}
</style>