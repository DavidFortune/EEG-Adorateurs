<template>
  <ion-page>
    <ion-content>
      <!-- Progress Bar -->
      <ion-progress-bar :value="progressPercentage / 100" color="primary"></ion-progress-bar>

      <div class="content-container">
        <!-- Back Button -->
        <ion-button 
          fill="clear" 
          color="medium" 
          class="back-button"
          @click="goBack"
        >
          <ion-icon :icon="arrowBack" slot="start"></ion-icon>
          Retour
        </ion-button>

        <!-- Icon -->
        <div class="step-icon">
          <ion-icon :icon="personOutline"></ion-icon>
        </div>

        <!-- Title -->
        <h1 class="step-title">Informations personnelles</h1>

        <!-- Description -->
        <p class="step-description">
          Comment souhaitez-vous être appelé(e) ?
        </p>

        <!-- Form -->
        <div class="form-container">
          <ion-item class="form-item">
            <ion-input
              v-model="firstName"
              type="text"
              placeholder="Prénom *"
              required
            ></ion-input>
          </ion-item>

          <ion-item class="form-item">
            <ion-input
              v-model="lastName"
              type="text"
              placeholder="Nom de famille *"
              required
            ></ion-input>
          </ion-item>
        </div>

        <!-- Continue Button -->
        <ion-button 
          expand="block" 
          color="primary" 
          size="large" 
          class="continue-button"
          :disabled="!isFormValid"
          @click="continueToNextStep"
        >
          Continuer
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonContent, IonProgressBar, IonItem, IonInput, IonButton, IonIcon
} from '@ionic/vue';
import {
  personOutline, arrowBack
} from 'ionicons/icons';
import { useOnboardingStore } from '@/stores/onboarding';

const router = useRouter();
const onboardingStore = useOnboardingStore();

const firstName = ref('');
const lastName = ref('');

const progressPercentage = computed(() => onboardingStore.progressPercentage);

const isFormValid = computed(() => {
  return firstName.value.trim() !== '' && lastName.value.trim() !== '';
});

const goBack = () => {
  onboardingStore.previousStep();
  router.push('/onboarding/welcome');
};

const continueToNextStep = () => {
  if (isFormValid.value) {
    // Update form data
    onboardingStore.updateFormData({
      firstName: firstName.value.trim(),
      lastName: lastName.value.trim()
    });
    
    // Go to next step
    onboardingStore.nextStep();
    router.push('/onboarding/teams');
  }
};

// Initialize form with existing data
onMounted(() => {
  firstName.value = onboardingStore.formData.firstName;
  lastName.value = onboardingStore.formData.lastName;
});
</script>

<style scoped>
.content-container {
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
}

.back-button {
  --color: #6B7280;
  margin-bottom: 1rem;
  align-self: flex-start;
}

.step-icon {
  width: 4rem;
  height: 4rem;
  background: #FEE2E2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 2rem auto;
  color: #DC2626;
}

.step-icon ion-icon {
  font-size: 2rem;
}

.step-title {
  font-size: 1.875rem;
  font-weight: bold;
  color: #111827;
  text-align: center;
  margin: 0 0 1rem 0;
}

.step-description {
  font-size: 1.125rem;
  color: #6B7280;
  text-align: center;
  margin-bottom: 3rem;
  line-height: 1.6;
}

.form-container {
  margin-bottom: 3rem;
}

.form-item {
  margin-bottom: 1.5rem;
  --background: #FFFFFF;
  --border-radius: 0.75rem;
  --border-color: #D1D5DB;
  --border-width: 1px;
  --border-style: solid;
  --min-height: 56px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-item ion-label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.continue-button {
  --background: #DC2626;
  --background-hover: #B91C1C;
  height: 3.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  margin-top: 2rem;
}

.continue-button:disabled {
  --background: #D1D5DB;
  --color: #9CA3AF;
}

ion-progress-bar {
  --progress-background: #DC2626;
  --buffer-background: #FEE2E2;
}
</style>