<template>
  <ion-page>
    <ion-content class="welcome-content">
      <div class="welcome-container">
        <!-- Icon -->
        <div class="welcome-icon">
          <ion-icon :icon="peopleOutline"></ion-icon>
        </div>

        <!-- Title -->
        <h1 class="welcome-title">Organisez vos services</h1>

        <!-- Description -->
        <p class="welcome-description">
          Gérez facilement vos disponibilités et vos ministères à l'Église Évangélique Galilée.
        </p>

        <!-- Start Button -->
        <ion-button 
          expand="block" 
          color="primary" 
          size="large" 
          class="start-button"
          @click="startOnboarding"
        >
          Commencer
          <ion-icon :icon="arrowForward" slot="end"></ion-icon>
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonContent, IonButton, IonIcon
} from '@ionic/vue';
import {
  peopleOutline, arrowForward
} from 'ionicons/icons';
import { useOnboardingStore } from '@/stores/onboarding';

const router = useRouter();
const onboardingStore = useOnboardingStore();

const startOnboarding = () => {
  onboardingStore.goToStep(2); // Go to personal info step
  router.push('/onboarding/personal-info');
};

// Set current step when arriving at welcome page
onMounted(() => {
  onboardingStore.goToStep(0);
});
</script>

<style scoped>
.welcome-content {
  --background: #F9FAFB;
}

.welcome-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  text-align: center;
}

.welcome-icon {
  width: 8rem;
  height: 8rem;
  background: #b5121b;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 3rem;
  color: white;
}

.welcome-icon ion-icon {
  font-size: 4rem;
}

.welcome-title {
  font-size: 3rem;
  font-weight: bold;
  color: #111827;
  margin: 0 0 2rem 0;
  line-height: 1.2;
}

.welcome-description {
  font-size: 1.125rem;
  color: #6B7280;
  line-height: 1.6;
  margin-bottom: 3rem;
  max-width: 600px;
}

.start-button {
  --background: #b5121b;
  --background-hover: #9f1018;
  height: 3.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  max-width: 300px;
  width: 100%;
}

@media (max-width: 768px) {
  .welcome-title {
    font-size: 2.5rem;
  }
  
  .welcome-icon {
    width: 6rem;
    height: 6rem;
  }
  
  .welcome-icon ion-icon {
    font-size: 3rem;
  }
}
</style>