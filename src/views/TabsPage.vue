<template>
  <ion-page>
    <SideMenu />
    <ion-tabs id="main-content">
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="accueil" href="/accueil">
          <ion-icon aria-hidden="true" :icon="home" />
          <ion-label>Accueil</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="disponibilites" href="/disponibilites">
          <ion-icon aria-hidden="true" :icon="checkboxOutline" />
          <ion-label>Disponibilités</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="teams" href="/teams">
          <ion-icon aria-hidden="true" :icon="people" />
          <ion-label>Équipes</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="services" href="/services">
          <ion-icon aria-hidden="true" :icon="calendar" />
          <ion-label>Services</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="resources" href="/resources">
          <ion-icon aria-hidden="true" :icon="libraryOutline" />
          <ion-label>Ressources</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue';
import { home, calendar, checkboxOutline, people, libraryOutline } from 'ionicons/icons';
import SideMenu from '@/components/SideMenu.vue';
</script>

<style scoped>
/* Tab Bar Improvements */
ion-tab-bar {
  --background: #ffffff;
  --border: 1px solid #e0e0e0;
  padding-top: 4px;
  padding-bottom: max(env(safe-area-inset-bottom), 4px);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

/* Tab Button Styling */
ion-tab-button {
  --color: #8e8e93;
  --color-selected: #b5121b;
  --padding-top: 8px;
  --padding-bottom: 8px;
  min-height: 50px;
  font-weight: 500;
}

/* Icon Improvements */
ion-tab-button ion-icon {
  font-size: 24px;
  margin-bottom: 2px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  filter: contrast(1.1);
}

/* Selected tab icon */
ion-tab-button[aria-selected="true"] ion-icon {
  color: #b5121b;
  font-weight: 600;
  transform: scale(1.05);
  transition: transform 0.2s ease;
}

/* Label Improvements */
ion-tab-button ion-label {
  font-size: 11px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: 0.01em;
  margin-top: 2px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* Selected tab label */
ion-tab-button[aria-selected="true"] ion-label {
  color: #b5121b;
  font-weight: 600;
}

/* Active state improvements */
ion-tab-button:active {
  --color: #b5121b;
  transform: scale(0.95);
  transition: transform 0.1s ease;
}

/* Hover effects for better UX */
@media (hover: hover) {
  ion-tab-button:hover {
    --color: #9f1018;
    background: rgba(181, 18, 27, 0.05);
    transition: all 0.2s ease;
  }
}

/* Responsive adjustments */
@media (max-width: 480px) {
  ion-tab-button {
    --padding-top: 6px;
    --padding-bottom: 6px;
    min-height: 48px;
  }

  ion-tab-button ion-icon {
    font-size: 22px;
  }

  ion-tab-button ion-label {
    font-size: 10px;
  }
}

/* High DPI display improvements */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  ion-tab-button ion-icon,
  ion-tab-button ion-label {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }
}


/* Ensure crisp rendering */
ion-tab-bar,
ion-tab-button,
ion-tab-button ion-icon,
ion-tab-button ion-label {
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;
}
</style>
