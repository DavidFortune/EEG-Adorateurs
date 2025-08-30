<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Accueil</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Accueil</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="ion-padding">
        <h2>Bienvenue chez EEG Adorateurs</h2>
        <p>Découvrez nos services d'électroencéphalographie et nos équipes d'experts.</p>
        
        <ion-card>
          <ion-card-header>
            <ion-card-title>À propos de nous</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            Nous sommes spécialisés dans les services d'électroencéphalographie (EEG) avec une équipe de professionnels dévoués.
          </ion-card-content>
        </ion-card>
        
        <ion-card>
          <ion-card-header>
            <ion-card-title>Nos services</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            Consultez l'onglet Services pour découvrir tous nos événements et consultations disponibles.
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/vue';
</script>
