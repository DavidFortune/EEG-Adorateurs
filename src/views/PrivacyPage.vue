<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/"></ion-back-button>
        </ion-buttons>
        <ion-title>Politique de Confidentialité</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <div class="privacy-container">
        <h1>Politique de Confidentialité</h1>
        <p class="last-updated">Dernière mise à jour : {{ lastUpdated }}</p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            L'application EEG Adorateurs ("nous", "notre", "nos") est conçue pour faciliter la gestion 
            des services et des disponibilités au sein de l'Église Évangélique Galilée. Nous nous engageons 
            à protéger votre vie privée et vos données personnelles.
          </p>
        </section>

        <section>
          <h2>2. Données Collectées</h2>
          <p>Nous collectons les informations suivantes :</p>
          <ul>
            <li><strong>Informations d'identification :</strong> Nom, prénom, adresse email</li>
            <li><strong>Informations de profil :</strong> Photo de profil (optionnelle), numéro de téléphone</li>
            <li><strong>Informations de service :</strong> Équipes, instruments, disponibilités</li>
            <li><strong>Données d'authentification :</strong> Identifiants de connexion Google</li>
          </ul>
        </section>

        <section>
          <h2>3. Utilisation des Données</h2>
          <p>Vos données sont utilisées pour :</p>
          <ul>
            <li>Gérer votre compte et votre profil utilisateur</li>
            <li>Organiser et planifier les services de l'église</li>
            <li>Communiquer avec vous concernant les services et disponibilités</li>
            <li>Améliorer notre application et nos services</li>
          </ul>
        </section>

        <section>
          <h2>4. Stockage et Sécurité</h2>
          <p>
            Vos données sont stockées de manière sécurisée sur les serveurs Firebase de Google. 
            Nous utilisons des mesures de sécurité appropriées pour protéger vos informations 
            contre tout accès non autorisé, modification, divulgation ou destruction.
          </p>
        </section>

        <section>
          <h2>5. Partage des Données</h2>
          <p>
            Vos données personnelles ne sont partagées qu'avec les autres membres de l'équipe 
            d'adoration de l'Église Évangélique Galilée dans le cadre de l'organisation des services. 
            Nous ne vendons, n'échangeons ni ne transférons vos informations personnelles à des tiers 
            sans votre consentement.
          </p>
        </section>

        <section>
          <h2>6. Vos Droits</h2>
          <p>Vous avez le droit de :</p>
          <ul>
            <li>Accéder à vos données personnelles</li>
            <li>Corriger vos données personnelles</li>
            <li>Demander la suppression de vos données</li>
            <li>Vous opposer au traitement de vos données</li>
            <li>Retirer votre consentement à tout moment</li>
          </ul>
        </section>

        <section>
          <h2>7. Cookies et Technologies Similaires</h2>
          <p>
            Notre application utilise des cookies et des technologies similaires pour améliorer 
            votre expérience utilisateur, analyser l'utilisation de l'application et personnaliser 
            le contenu.
          </p>
        </section>

        <section>
          <h2>8. Modifications de cette Politique</h2>
          <p>
            Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. 
            Les modifications entreront en vigueur dès leur publication dans l'application. 
            Nous vous encourageons à consulter régulièrement cette page.
          </p>
        </section>

        <section>
          <h2>9. Contact</h2>
          <p>
            Pour toute question concernant cette politique de confidentialité ou vos données personnelles, 
            veuillez nous contacter à :
          </p>
          <div class="contact-info">
            <p><strong>Église Évangélique Galilée</strong></p>
            <p>11910 Avenue Bellevois</p>
            <p>Montréal-Nord, QC H1H 3G1</p>
            <p>Canada</p>
            <p>Email : info@eglisegalilee.com</p>
          </div>
        </section>

        <section>
          <h2>10. Base Légale</h2>
          <p>
            Le traitement de vos données personnelles est basé sur votre consentement et sur la nécessité 
            d'exécuter les services que vous avez demandés en utilisant notre application.
          </p>
        </section>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton
} from '@ionic/vue';
import { computed } from 'vue';

const lastUpdated = computed(() => {
  const date = new Date();
  return date.toLocaleDateString('fr-FR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
});
</script>

<style scoped>
.privacy-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

h1 {
  font-size: 2rem;
  font-weight: bold;
  color: #111827;
  margin-bottom: 0.5rem;
}

.last-updated {
  color: #6B7280;
  font-size: 0.875rem;
  margin-bottom: 2rem;
}

section {
  margin-bottom: 2rem;
}

h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
}

p {
  color: #4B5563;
  line-height: 1.6;
  margin-bottom: 1rem;
}

ul {
  list-style-type: disc;
  padding-left: 1.5rem;
  color: #4B5563;
}

li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

.contact-info {
  background-color: #F9FAFB;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-top: 0.5rem;
}

.contact-info p {
  margin: 0.25rem 0;
}

@media (max-width: 768px) {
  .privacy-container {
    padding: 0.5rem;
  }
  
  h1 {
    font-size: 1.5rem;
  }
  
  h2 {
    font-size: 1.125rem;
  }
}
</style>