<template>
  <ion-modal
    :is-open="isOpen"
    @didDismiss="$emit('close')"
    :can-dismiss="true"
    :initial-breakpoint="0.6"
    :breakpoints="[0, 0.6, 1]"
    class="phone-modal"
  >
    <ion-content class="modal-content-wrapper">
      <div class="modal-content">
        <!-- Close button -->
        <div class="close-button-container">
          <ion-button fill="clear" @click="$emit('close')" class="close-button">
            <ion-icon :icon="closeOutline" />
          </ion-button>
        </div>

        <!-- Icon and Description -->
        <div class="header-section">
          <div class="icon-container">
            <ion-icon :icon="phonePortraitOutline" class="main-icon" />
          </div>
          <h2 class="modal-title">Restez connecté !</h2>
          <p class="modal-description">
            Recevez les mise à jour sur les services et les activités de l’église directement sur votre cellulaire.
          </p>
        </div>

        <!-- Form Section -->
        <div class="form-section">
          <ion-item class="phone-input-item">
            <ion-input
              v-model="phoneNumber"
              type="tel"
              placeholder="(514) 123-4567"
              :clear-input="true"
              @ionInput="formatPhoneNumber"
              @ionBlur="validatePhone"
              :class="{ 'ion-invalid': showError }"
            />
          </ion-item>

          <div v-if="showError" class="error-message">
            <ion-icon :icon="alertCircleOutline" />
            <span>{{ errorMessage }}</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <ion-button
            fill="clear"
            color="medium"
            @click="$emit('close')"
            class="skip-button"
          >
            Plus tard
          </ion-button>
          <ion-button
            expand="block"
            @click="savePhoneNumber"
            :disabled="!isValid || loading"
            class="save-button"
          >
            <ion-spinner v-if="loading" name="crescent" />
            <span v-else>Enregistrer</span>
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  IonModal, IonButton, IonIcon, IonContent, IonItem, IonInput, IonSpinner
} from '@ionic/vue';
import {
  phonePortraitOutline, closeOutline, alertCircleOutline
} from 'ionicons/icons';

interface Props {
  isOpen: boolean;
}

interface Emits {
  (e: 'close'): void;
  (e: 'save', phoneNumber: string): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const phoneNumber = ref('');
const showError = ref(false);
const errorMessage = ref('');
const loading = ref(false);

const isValid = computed(() => {
  const digits = phoneNumber.value.replace(/\D/g, '');
  return digits.length === 10 && !showError.value;
});

const formatPhoneNumber = (event: any) => {
  const value = event.target.value.replace(/\D/g, '');

  // Limit to maximum 10 digits (3+3+4 format)
  const limitedValue = value.slice(0, 10);
  let formatted = '';

  if (limitedValue.length > 0) {
    if (limitedValue.length <= 3) {
      formatted = `(${limitedValue}`;
    } else if (limitedValue.length <= 6) {
      formatted = `(${limitedValue.slice(0, 3)}) ${limitedValue.slice(3)}`;
    } else {
      // Last block limited to 4 digits max
      formatted = `(${limitedValue.slice(0, 3)}) ${limitedValue.slice(3, 6)}-${limitedValue.slice(6, 10)}`;
    }
  }

  phoneNumber.value = formatted;
  showError.value = false;
};

const validatePhone = () => {
  const digitsOnly = phoneNumber.value.replace(/\D/g, '');

  if (digitsOnly.length === 0) {
    showError.value = false;
    return;
  }

  if (digitsOnly.length < 10) {
    showError.value = true;
    errorMessage.value = 'Le numéro doit contenir 10 chiffres';
    return;
  }

  if (digitsOnly.length > 10) {
    showError.value = true;
    errorMessage.value = 'Le numéro ne peut pas contenir plus de 10 chiffres';
    return;
  }

  showError.value = false;
};

const savePhoneNumber = async () => {
  if (!isValid.value) {
    validatePhone();
    return;
  }

  loading.value = true;

  try {
    // Emit the phone number to parent component
    const digitsOnly = phoneNumber.value.replace(/\D/g, '');
    emit('save', digitsOnly);
  } catch (error) {
    console.error('Error saving phone number:', error);
    showError.value = true;
    errorMessage.value = 'Erreur lors de l\'enregistrement. Veuillez réessayer.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* Override default modal styling for overlay effect */
.phone-modal {
  --backdrop-opacity: 0.4;
}

.modal-content-wrapper {
  --padding-top: 0;
  --padding-bottom: 0;
  --padding-start: 0;
  --padding-end: 0;
}

.modal-content {
  padding: 2rem 1.5rem;
  border-radius: 20px 20px 0 0;
  background: white;
  position: relative;
  min-height: 400px;
}

.close-button-container {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
}

.close-button {
  --color: var(--ion-color-medium);
  --padding-start: 8px;
  --padding-end: 8px;
  --height: 40px;
  --width: 40px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 50%;
}

.header-section {
  text-align: center;
  margin-bottom: 2rem;
  padding-top: 1rem;
}

.icon-container {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.main-icon {
  font-size: 3.5rem;
  color: white;
  background: var(--ion-color-primary);
  border-radius: 50%;
  padding: 0.75rem;
  width: 4.5rem;
  height: 4.5rem;
}

.modal-title {
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--ion-color-dark);
  margin: 0 0 0.5rem 0;
}

.modal-description {
  font-size: 0.95rem;
  color: var(--ion-color-medium);
  line-height: 1.4;
  margin: 0;
}

.form-section {
  margin-bottom: 2rem;
}

.phone-input-item {
  --border-radius: 16px;
  --background: #f8f9fa;
  --border-color: transparent;
  --border-width: 2px;
  --padding-start: 20px;
  --padding-end: 20px;
  --padding-top: 20px;
  --padding-bottom: 20px;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.phone-input-item.ion-invalid {
  --border-color: var(--ion-color-danger);
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--ion-color-danger);
  font-size: 0.875rem;
  margin-bottom: 1rem;
  padding: 0 0.5rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.skip-button {
  flex-shrink: 0;
  --color: var(--ion-color-medium);
  --padding-start: 16px;
  --padding-end: 16px;
}

.save-button {
  flex: 1;
  --border-radius: 25px;
  --height: 50px;
  font-weight: 600;
  font-size: 1rem;
}

.save-button[disabled] {
  --opacity: 0.5;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .modal-content {
    padding: 1.5rem 1rem;
    min-height: 350px;
  }

  .modal-title {
    font-size: 1.25rem;
  }

  .modal-description {
    font-size: 0.9rem;
  }

  .main-icon {
    font-size: 3rem;
    width: 4rem;
    height: 4rem;
    padding: 0.5rem;
  }

  .phone-input-item {
    --padding-start: 16px;
    --padding-end: 16px;
    --padding-top: 16px;
    --padding-bottom: 16px;
    font-size: 1rem;
  }

  .action-buttons {
    gap: 0.75rem;
  }

  .save-button {
    --height: 48px;
    font-size: 0.95rem;
  }
}

@media (max-width: 480px) {
  .modal-content {
    padding: 1rem;
  }

  .action-buttons {
    flex-direction: column;
    gap: 0.75rem;
  }

  .skip-button {
    order: 2;
    align-self: center;
  }

  .save-button {
    order: 1;
    width: 100%;
  }
}
</style>