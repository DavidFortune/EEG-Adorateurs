<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/"></ion-back-button>
        </ion-buttons>
        <ion-title>Termes et Conditions</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <div class="terms-container">
        <h1>Termes et Conditions d'Utilisation</h1>
        <p class="last-updated">Dernière mise à jour : {{ lastUpdated }}</p>

        <section>
          <h2>1. Acceptation des Termes</h2>
          <p>
            En accédant et en utilisant l'application EEG Adorateurs, vous acceptez d'être lié par 
            ces termes et conditions d'utilisation. Si vous n'acceptez pas ces termes, veuillez ne 
            pas utiliser cette application.
          </p>
        </section>

        <section>
          <h2>2. Description du Service</h2>
          <p>
            EEG Adorateurs est une application de gestion des services et des disponibilités pour 
            les adorateurs de l'Église Évangélique Galilée. L'application permet :
          </p>
          <ul>
            <li>La gestion des profils des membres</li>
            <li>La planification des services religieux</li>
            <li>La gestion des disponibilités des adorateurs</li>
            <li>La coordination des ministères de louange</li>
            <li>La communication entre les membres</li>
          </ul>
        </section>

        <section>
          <h2>3. Conditions d'Accès</h2>
          <p>
            Pour utiliser cette application, vous devez :
          </p>
          <ul>
            <li>Être adorateur actif de l'Église Évangélique Galilée</li>
            <li>Fournir des informations exactes et complètes lors de votre inscription</li>
            <li>Maintenir la confidentialité de vos informations de connexion</li>
            <li>Avoir au moins 13 ans</li>
          </ul>
        </section>

        <section>
          <h2>4. Utilisation Acceptable</h2>
          <p>
            Vous vous engagez à utiliser l'application de manière responsable et conformément à son 
            objectif. Il est interdit de :
          </p>
          <ul>
            <li>Utiliser l'application à des fins illégales ou non autorisées</li>
            <li>Partager vos identifiants de connexion avec des tiers</li>
            <li>Tenter d'accéder aux comptes d'autres utilisateurs</li>
            <li>Publier du contenu offensant, inapproprié ou contraire aux valeurs de l'église</li>
            <li>Perturber le fonctionnement normal de l'application</li>
            <li>Collecter les données personnelles d'autres utilisateurs sans autorisation</li>
          </ul>
        </section>

        <section>
          <h2>5. Propriété Intellectuelle</h2>
          <p>
            Tout le contenu de l'application, incluant mais sans s'y limiter, les textes, graphiques, 
            logos, icônes, images, et logiciels, est la propriété de l'Église Évangélique Galilée ou 
            de ses fournisseurs de contenu et est protégé par les lois sur la propriété intellectuelle.
          </p>
        </section>

        <section>
          <h2>6. Confidentialité des Données</h2>
          <p>
            L'utilisation de vos données personnelles est régie par notre 
            <a @click="goToPrivacy" class="link">Politique de Confidentialité</a>. 
            En utilisant l'application, vous consentez à la collecte et à l'utilisation de vos 
            informations conformément à cette politique.
          </p>
        </section>

        <section>
          <h2>7. Responsabilités de l'Utilisateur</h2>
          <p>
            En tant qu'utilisateur, vous êtes responsable de :
          </p>
          <ul>
            <li>Maintenir vos informations de profil à jour</li>
            <li>Respecter les engagements pris concernant vos disponibilités</li>
            <li>Communiquer tout changement de disponibilité en temps opportun</li>
            <li>Respecter les autres adorateurs</li>
            <li>Signaler tout problème technique ou de sécurité</li>
          </ul>
        </section>

        <section>
          <h2>8. Limitation de Responsabilité</h2>
          <p>
            L'Église Évangélique Galilée et ses représentants ne pourront être tenus responsables de :
          </p>
          <ul>
            <li>Toute interruption temporaire du service</li>
            <li>Toute perte de données due à des problèmes techniques</li>
            <li>Tout dommage indirect résultant de l'utilisation de l'application</li>
            <li>Les actions des utilisateurs tiers</li>
          </ul>
          <p>
            L'application est fournie "telle quelle" sans garantie d'aucune sorte, expresse ou implicite.
          </p>
        </section>

        <section>
          <h2>9. Indemnisation</h2>
          <p>
            Vous acceptez d'indemniser et de dégager de toute responsabilité l'Église Évangélique Galilée, 
            ses dirigeants, employés et agents contre toute réclamation, dommage, perte ou dépense 
            résultant de votre violation de ces termes et conditions.
          </p>
        </section>

        <section>
          <h2>10. Suspension et Résiliation</h2>
          <p>
            Nous nous réservons le droit de suspendre ou de résilier votre accès à l'application 
            à tout moment, sans préavis, pour :
          </p>
          <ul>
            <li>Violation de ces termes et conditions</li>
            <li>Comportement inapproprié</li>
            <li>Inactivité prolongée</li>
            <li>Fin de votre participation aux ministères d'adoration</li>
          </ul>
        </section>

        <section>
          <h2>11. Modifications des Termes</h2>
          <p>
            Nous nous réservons le droit de modifier ces termes et conditions à tout moment. 
            Les modifications entreront en vigueur dès leur publication dans l'application. 
            Votre utilisation continue de l'application après la publication des modifications 
            constitue votre acceptation des nouveaux termes.
          </p>
        </section>

        <section>
          <h2>12. Dispositions Générales</h2>
          <ul>
            <li>
              <strong>Intégralité de l'accord :</strong> Ces termes constituent l'accord complet 
              entre vous et l'Église Évangélique Galilée concernant l'utilisation de l'application.
            </li>
            <li>
              <strong>Divisibilité :</strong> Si une disposition de ces termes est jugée invalide, 
              les autres dispositions resteront en vigueur.
            </li>
            <li>
              <strong>Non-renonciation :</strong> Le fait de ne pas exercer un droit prévu dans 
              ces termes ne constitue pas une renonciation à ce droit.
            </li>
          </ul>
        </section>

        <section>
          <h2>13. Loi Applicable</h2>
          <p>
            Ces termes et conditions sont régis par les lois de la province de Québec, Canada. 
            Tout litige découlant de ces termes sera soumis à la juridiction exclusive des 
            tribunaux de la province de Québec.
          </p>
        </section>

        <section>
          <h2>14. Contact</h2>
          <p>
            Pour toute question concernant ces termes et conditions, veuillez nous contacter à :
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
          <h2>15. Consentement</h2>
          <p>
            En utilisant l'application EEG Adorateurs, vous confirmez que vous avez lu, compris 
            et accepté ces termes et conditions d'utilisation dans leur intégralité.
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
import { useRouter } from 'vue-router';

const router = useRouter();

const lastUpdated = computed(() => {
  const date = new Date();
  return date.toLocaleDateString('fr-FR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
});

const goToPrivacy = () => {
  router.push('/privacy');
};
</script>

<style scoped>
.terms-container {
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

.link {
  color: #b5121b;
  text-decoration: underline;
  cursor: pointer;
}

.link:hover {
  color: #9f1018;
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
  .terms-container {
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