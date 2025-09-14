<template>
  <ion-page>
    <SideMenu />
    <ion-tabs id="main-content">
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="accueil" href="/tabs/accueil">
          <ion-icon aria-hidden="true" :icon="home" />
          <ion-label>Accueil</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="services" href="/tabs/services">
          <ion-icon aria-hidden="true" :icon="calendar" />
          <ion-label>Services</ion-label>
        </ion-tab-button>

        <ion-tab-button v-if="isAdmin" tab="resources" href="/tabs/resources">
          <ion-icon aria-hidden="true" :icon="libraryOutline" />
          <ion-label>Ressources</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="disponibilites" href="/tabs/disponibilites">
          <ion-icon aria-hidden="true" :icon="checkboxOutline" />
          <ion-label>Disponibilités</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="teams" href="/tabs/teams">
          <ion-icon aria-hidden="true" :icon="people" />
          <ion-label>Équipes</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue';
import { home, calendar, checkboxOutline, people, libraryOutline } from 'ionicons/icons';
import SideMenu from '@/components/SideMenu.vue';
import { useUser } from '@/composables/useUser';

const { isAdmin } = useUser();
</script>
