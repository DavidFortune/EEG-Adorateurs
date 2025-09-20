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
          <ion-icon :icon="phonePortraitOutline"></ion-icon>
        </div>

        <!-- Title -->
        <h1 class="step-title">Quel est votre numéro de téléphone mobile ?</h1>

        <!-- Subtitle/Incentive -->
        <p class="step-subtitle">
          Nous vous enverrons des rappels importants et des mises à jour pour ne rien manquer.
        </p>

        <!-- Form -->
        <div class="form-container">
          <ion-item class="form-item" :class="{ 'ion-invalid': !isFormValid && phone.trim() }">
            <ion-input
              v-model="phone"
              type="tel"
              placeholder="(438) 123-4567"
              required
              @ionBlur="validatePhone"
              @ionInput="handlePhoneInput"
            ></ion-input>
            <ion-note v-if="phoneError" slot="error">{{ phoneError }}</ion-note>
          </ion-item>

          <!-- Help text -->
          <div class="help-text">
            <ion-icon :icon="informationCircleOutline" color="medium"></ion-icon>
            <span>Format: +1 (438) 123-4567 ou 438-123-4567</span>
          </div>
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

        <!-- Skip Button -->
        <ion-button
          expand="block"
          fill="clear"
          color="medium"
          size="large"
          class="skip-button"
          @click="skipStep"
        >
          Ignorer pour l'instant
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonContent, IonProgressBar, IonItem, IonInput, IonButton, IonIcon, IonNote
} from '@ionic/vue';
import {
  phonePortraitOutline, arrowBack, informationCircleOutline
} from 'ionicons/icons';
import { useOnboardingStore } from '@/stores/onboarding';

const router = useRouter();
const onboardingStore = useOnboardingStore();

const phone = ref('');
const phoneError = ref('');

const progressPercentage = computed(() => onboardingStore.progressPercentage);

const isFormValid = computed(() => {
  const trimmed = phone.value.trim();
  if (trimmed === '') return false;

  // Extract only digits
  const digits = trimmed.replace(/\D/g, '');

  // Must be exactly 10 digits (3+3+4 format)
  return digits.length === 10;
});

const validatePhone = () => {
  const trimmed = phone.value.trim();

  if (trimmed === '') {
    phoneError.value = 'Le numéro de téléphone est requis';
    return;
  }

  if (!isFormValid.value) {
    phoneError.value = 'Veuillez entrer un numéro de téléphone valide';
    return;
  }

  phoneError.value = '';
};

const applyPhoneMask = (value: string): string => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');

  // Limit to maximum 10 digits (3+3+4 format)
  const limitedDigits = digits.slice(0, 10);

  // Apply mask based on number of digits
  if (limitedDigits.length <= 3) {
    return limitedDigits;
  } else if (limitedDigits.length <= 6) {
    return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3)}`;
  } else {
    // Last block limited to 4 digits max
    return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6, 10)}`;
  }
};

const handlePhoneInput = (event: any) => {
  const inputValue = event.target.value;
  const maskedValue = applyPhoneMask(inputValue);
  phone.value = maskedValue;
};

const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');

  // Handle different cases
  if (digits.length === 10) {
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return phoneNumber; // Return as-is if it doesn't match expected patterns
};

const updateStoreData = () => {
  const formattedPhone = formatPhoneNumber(phone.value);
  onboardingStore.updateFormData({ phone: formattedPhone });
};

const goBack = () => {
  updateStoreData();
  onboardingStore.previousStep();
  router.push('/onboarding/personal-info');
};

const continueToNextStep = () => {
  if (!isFormValid.value) {
    validatePhone();
    return;
  }

  updateStoreData();

  // Mark this step as completed
  onboardingStore.markStepCompleted(3);

  onboardingStore.nextStep();
  router.push('/onboarding/ministries');
};

const skipStep = () => {
  // Set empty phone and continue
  phone.value = '';
  onboardingStore.updateFormData({ phone: '' });
  onboardingStore.markStepCompleted(3);
  onboardingStore.nextStep();
  router.push('/onboarding/ministries');
};

onMounted(() => {
  // Load existing data if available
  if (onboardingStore.formData.phone) {
    phone.value = onboardingStore.formData.phone;
  }
});
</script>

<style scoped>
.content-container {
  padding: 2rem 1.5rem;
  max-width: 400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: calc(100vh - 120px);
}

.back-button {
  align-self: flex-start;
  margin-bottom: 2rem;
  --padding-start: 0;
}

.step-icon {
  text-align: center;
  margin-bottom: 1.5rem;
}

.step-icon ion-icon {
  font-size: 4rem;
  color: var(--ion-color-primary);
}

.step-title {
  font-size: 1.75rem;
  font-weight: 600;
  text-align: center;
  margin: 0 0 1rem 0;
  color: var(--ion-color-dark);
  line-height: 1.3;
}

.step-subtitle {
  font-size: 1rem;
  text-align: center;
  margin: 0 0 2rem 0;
  color: var(--ion-color-medium);
  line-height: 1.5;
}

.form-container {
  margin-bottom: 2rem;
}

.form-item {
  --background: var(--ion-color-light);
  --border-radius: 12px;
  --padding-start: 16px;
  --padding-end: 16px;
  margin-bottom: 1rem;
  --highlight-color-focused: var(--ion-color-primary);
  --highlight-color-valid: var(--ion-color-success);
  --highlight-color-invalid: var(--ion-color-danger);
}

.help-text {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: var(--ion-color-medium);
  margin-top: 8px;
  padding: 0 16px;
}

.help-text ion-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.continue-button {
  --border-radius: 12px;
  --padding-top: 16px;
  --padding-bottom: 16px;
  font-weight: 600;
  margin-bottom: 1rem;
}

.skip-button {
  --border-radius: 12px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  font-weight: 500;
}

@media (max-height: 700px) {
  .content-container {
    min-height: auto;
    padding: 1rem 1.5rem;
  }

  .step-icon {
    margin-bottom: 1rem;
  }

  .step-icon ion-icon {
    font-size: 3rem;
  }

  .step-title {
    font-size: 1.5rem;
  }
}
</style>