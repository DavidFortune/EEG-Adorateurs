<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/accueil"></ion-back-button>
        </ion-buttons>
        <ion-title>À propos</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="about-content">
      <div class="about-container">
        <!-- App Logo and Title -->
        <div class="app-header">
          <div class="app-logo">
            <img src="/logo-eeg-adorateurs.png" alt="EEG Adorateurs" />
          </div>
          <h1 class="app-title">EEG Adorateurs</h1>
          <p class="app-subtitle">Gestion des Services</p>
          <div class="version-badge">
            <ion-chip color="primary">
              <ion-label>Version 1.1.2</ion-label>
            </ion-chip>
          </div>
        </div>

        <!-- App Description -->
        <ion-card class="info-card">
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="informationCircleOutline" class="section-icon"></ion-icon>
              À propos de l'application
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>
              EEG Adorateurs est l'application de gestion des services de l'Église Évangélique de Galilée. 
              Elle permet aux membres de gérer leur disponibilité et de coordonner les services.
            </p>
          </ion-card-content>
        </ion-card>

        <!-- Features -->
        <ion-card class="features-card">
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="sparklesOutline" class="section-icon"></ion-icon>
              Fonctionnalités principales
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item lines="none">
                <ion-icon :icon="checkmarkCircle" slot="start" color="success"></ion-icon>
                <ion-label>
                  <h3>Gestion des disponibilités</h3>
                  <p>Indiquez votre disponibilité pour les services à venir</p>
                </ion-label>
              </ion-item>
              <ion-item lines="none">
                <ion-icon :icon="checkmarkCircle" slot="start" color="success"></ion-icon>
                <ion-label>
                  <h3>Coordination des ministères</h3>
                  <p>Organisez les équipes selon les différents ministères</p>
                </ion-label>
              </ion-item>
              <ion-item lines="none">
                <ion-icon :icon="checkmarkCircle" slot="start" color="success"></ion-icon>
                <ion-label>
                  <h3>Planification des services</h3>
                  <p>Créez et gérez les services de l'église</p>
                </ion-label>
              </ion-item>
              <ion-item lines="none">
                <ion-icon :icon="checkmarkCircle" slot="start" color="success"></ion-icon>
                <ion-label>
                  <h3>Communication facilitée</h3>
                  <p>Restez informé des prochains services et événements</p>
                </ion-label>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Church Info -->
        <ion-card class="church-card">
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="businessOutline" class="section-icon"></ion-icon>
              Église Évangélique de Galilée
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p class="church-description">
              Notre mission est de glorifier Dieu à travers l'adoration et le service. 
              Cette application facilite la coordination de nos équipes pour mieux servir notre communauté.
            </p>
            <div class="church-info">
              <ion-item lines="none">
                <ion-icon :icon="locationOutline" slot="start" color="primary"></ion-icon>
                <ion-label>Montréal, Québec</ion-label>
              </ion-item>
              <ion-item lines="none">
                <ion-icon :icon="globeOutline" slot="start" color="primary"></ion-icon>
                <ion-label>
                  <a href="https://eglisegalilee.com" target="_blank" rel="noopener">
                    eglisegalilee.com
                  </a>
                </ion-label>
              </ion-item>
            </div>
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
                <p>support@eglisegalilee.com</p>
              </ion-label>
            </ion-item>
          </ion-card-content>
        </ion-card>

        <!-- Footer -->
        <div class="about-footer">
          <p class="copyright">© 2025 Église Évangélique de Galilée</p>
          <p class="rights">Tous droits réservés</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon, IonList, IonItem,
  IonLabel, IonChip
} from '@ionic/vue';
import { 
  informationCircleOutline, sparklesOutline, checkmarkCircle, businessOutline,
  locationOutline, globeOutline, helpCircleOutline, mailOutline
} from 'ionicons/icons';

const sendSupportEmail = () => {
  window.location.href = 'mailto:adorateurs@eglisegalilee.com?subject=Support EEG Adorateurs';
};
</script>

<style scoped>
.about-content {
  --background: #f9fafb;
}

.about-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

.app-header {
  text-align: center;
  padding: 2rem 1rem;
  margin-bottom: 2rem;
}

.app-logo {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: white;
  margin: 0 auto 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.app-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.app-title {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.app-subtitle {
  font-size: 1.125rem;
  color: #6b7280;
  margin: 0 0 1.5rem 0;
}

.version-badge {
  display: inline-block;
}

.info-card,
.features-card,
.church-card,
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

.features-card ion-list {
  margin: 0;
  padding: 0;
}

.features-card ion-item {
  --padding-start: 0;
  margin-bottom: 1rem;
}

.features-card ion-item:last-child {
  margin-bottom: 0;
}

.features-card h3 {
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.features-card p {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.church-description {
  margin-bottom: 1.5rem;
}

.church-info ion-item {
  --padding-start: 0;
  margin-bottom: 0.5rem;
}

.church-info a {
  color: var(--ion-color-primary);
  text-decoration: none;
}

.church-info a:hover {
  text-decoration: underline;
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

.about-footer {
  text-align: center;
  padding: 2rem 1rem;
  margin-top: 2rem;
}

.copyright {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 0.25rem 0;
}

.rights {
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 0;
}

@media (max-width: 768px) {
  .app-title {
    font-size: 1.75rem;
  }

  .app-subtitle {
    font-size: 1rem;
  }

  ion-card-title {
    font-size: 1.125rem;
  }
}
</style>