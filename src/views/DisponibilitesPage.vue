<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Disponibilités</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Disponibilités</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="ion-padding">
        <h2>Sondage de Disponibilités</h2>
        <p>Indiquez vos créneaux disponibles pour nos services EEG</p>
        
        <ion-card>
          <ion-card-header>
            <ion-card-title>Sélectionnez vos disponibilités</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item>
                <ion-checkbox slot="start"></ion-checkbox>
                <ion-label>
                  <h3>Lundi Matin (8h-12h)</h3>
                  <p>Consultations standards</p>
                </ion-label>
              </ion-item>
              
              <ion-item>
                <ion-checkbox slot="start"></ion-checkbox>
                <ion-label>
                  <h3>Lundi Après-midi (13h-17h)</h3>
                  <p>Consultations standards</p>
                </ion-label>
              </ion-item>
              
              <ion-item>
                <ion-checkbox slot="start"></ion-checkbox>
                <ion-label>
                  <h3>Mardi Matin (8h-12h)</h3>
                  <p>EEG de sommeil disponible</p>
                </ion-label>
              </ion-item>
              
              <ion-item>
                <ion-checkbox slot="start"></ion-checkbox>
                <ion-label>
                  <h3>Mercredi Matin (8h-12h)</h3>
                  <p>Consultations standards</p>
                </ion-label>
              </ion-item>
              
              <ion-item>
                <ion-checkbox slot="start"></ion-checkbox>
                <ion-label>
                  <h3>Week-end</h3>
                  <p>Urgences uniquement</p>
                </ion-label>
              </ion-item>
            </ion-list>
            
            <ion-button expand="block" class="ion-margin-top">
              Soumettre mes disponibilités
            </ion-button>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem, IonCheckbox, IonLabel, IonButton } from '@ionic/vue';
</script>
