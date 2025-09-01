<template>
  <ion-menu content-id="main-content" menu-id="side-menu" type="overlay">
    <ion-content class="side-menu-content">
      <!-- Logo and App Info Section -->
      <div class="app-info-section">
        <div class="app-logo">
          <img src="/logo-eeg-adorateurs.png" alt="EEG Adorateurs Logo" />
        </div>
        <h2 class="app-name">EEG Adorateurs</h2>
        <p class="app-subtitle">Gestion des Services</p>
      </div>

      <!-- Navigation Links -->
      <ion-list class="menu-links">
        <ion-item button @click="navigateToAbout">
          <ion-icon :icon="informationCircleOutline" slot="start" color="primary"></ion-icon>
          <ion-label>À propos</ion-label>
        </ion-item>
        
        <ion-item button @click="navigateToTerms">
          <ion-icon :icon="documentTextOutline" slot="start" color="primary"></ion-icon>
          <ion-label>Termes et conditions</ion-label>
        </ion-item>
        
        <ion-item button @click="navigateToPrivacy">
          <ion-icon :icon="shieldCheckmarkOutline" slot="start" color="primary"></ion-icon>
          <ion-label>Vie privée</ion-label>
        </ion-item>
      </ion-list>

      <!-- App Version -->
      <div class="app-version">
        <p>Version 1.0.0</p>
      </div>
    </ion-content>
  </ion-menu>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { 
  IonMenu, IonContent, 
  IonList, IonItem, IonLabel, IonIcon,
  menuController
} from '@ionic/vue';
import { documentTextOutline, shieldCheckmarkOutline, informationCircleOutline } from 'ionicons/icons';

const router = useRouter();

const navigateToAbout = async () => {
  await menuController.close('side-menu');
  router.push('/about');
};

const navigateToTerms = async () => {
  await menuController.close('side-menu');
  router.push('/terms');
};

const navigateToPrivacy = async () => {
  await menuController.close('side-menu');
  router.push('/privacy');
};
</script>

<style scoped>
.side-menu-content {
  --background: #ffffff;
}

.app-info-section {
  text-align: center;
  padding: 2rem 1rem;
  background: linear-gradient(135deg, var(--ion-color-primary) 0%, #9f1018 100%);
  color: white;
}

.app-logo {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: white;
  margin: 0 auto 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.app-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.app-name {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: white;
}

.app-subtitle {
  font-size: 0.875rem;
  margin: 0;
  opacity: 0.9;
  color: white;
}

.menu-links {
  padding: 1rem 0;
}

.menu-links ion-item {
  --border-radius: 8px;
  --padding-start: 16px;
  --padding-end: 16px;
  margin: 0.25rem 1rem;
}

.menu-links ion-item:hover {
  --background: #f8f9fa;
}

.app-version {
  position: absolute;
  bottom: 1rem;
  left: 0;
  right: 0;
  text-align: center;
}

.app-version p {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

ion-icon {
  margin-right: 0.5rem;
}
</style>