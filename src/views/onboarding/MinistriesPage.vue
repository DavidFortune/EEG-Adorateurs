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
          <ion-icon :icon="peopleOutline"></ion-icon>
        </div>

        <!-- Title -->
        <h1 class="step-title">Partagez avec nous vos ministères</h1>

        <!-- Loading State -->
        <div v-if="loading" class="loading-container">
          <ion-spinner name="crescent"></ion-spinner>
        </div>

        <!-- Ministries Chips -->
        <div v-else class="ministries-container">
          <div class="ministries-chips">
            <div 
              v-for="ministry in allMinistries" 
              :key="ministry.id"
              class="ministry-chip"
              :class="{ 
                'selected': selectedMinistries.includes(ministry.name),
                'custom': ministry.id.startsWith('custom-')
              }"
              @click="toggleMinistry(ministry.name)"
            >
              <span class="ministry-name">{{ ministry.name }}</span>
              <ion-icon 
                v-if="selectedMinistries.includes(ministry.name)"
                :icon="checkmarkCircle" 
                class="check-icon"
              ></ion-icon>
            </div>
          </div>
        </div>

        <!-- Custom Ministry Input -->
        <div class="custom-ministry-section">
          <ion-item class="custom-input">
            <ion-input
              v-model="customMinistryInput"
              type="text"
              placeholder="Autre ministère"
              @keypress="handleCustomInputKeyPress"
            ></ion-input>
            <ion-button
              slot="end"
              fill="solid"
              color="primary"
              shape="round"
              class="add-button"
              @click="addCustomMinistry"
              :disabled="!customMinistryInput.trim()"
            >
              <ion-icon :icon="addOutline"></ion-icon>
            </ion-button>
          </ion-item>
        </div>


        <!-- Continue Button -->
        <ion-button 
          expand="block" 
          color="primary" 
          size="large" 
          class="continue-button"
          :class="{ 'disabled': !canContinue }"
          :disabled="!canContinue"
          @click="continueToNextStep"
        >
          <span v-if="canContinue">
            Continuer ({{ totalMinistriesCount }} ministère{{ totalMinistriesCount > 1 ? 's' : '' }})
          </span>
          <span v-else>
            Sélectionner au moins 1 ministère
          </span>
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonContent, IonProgressBar, IonItem, IonInput, IonButton, IonIcon, IonSpinner
} from '@ionic/vue';
import {
  peopleOutline, checkmarkCircle, addOutline, arrowBack
} from 'ionicons/icons';
import { useOnboardingStore } from '@/stores/onboarding';
import { ministriesService } from '@/firebase/ministries';
import type { Ministry } from '@/types/member';

// Static fallback list for when Firebase is not available
const DEFAULT_MINISTRIES = [
  'Accueil',
  'Audiovisuel',
  'Diacre',
  'Dirigeant',
  'Louange',
  'Musicien',
  'Prédicateur',
  'Sécurité'
] as const;

const router = useRouter();
const onboardingStore = useOnboardingStore();

const availableMinistries = ref<Ministry[]>([]);
const selectedMinistries = ref<string[]>([]);
const customMinistries = ref<string[]>([]);
const customMinistryInput = ref('');
const loading = ref(true);

const progressPercentage = computed(() => onboardingStore.progressPercentage);

const totalMinistriesCount = computed(() => {
  return selectedMinistries.value.length;
});

const allMinistries = computed(() => {
  // Get unique ministry names from available ministries
  const availableNames = new Set(availableMinistries.value.map(m => m.name));
  
  // Filter out custom ministries that already exist in available ministries
  const uniqueCustomMinistries = customMinistries.value
    .filter(name => !availableNames.has(name))
    .map((name, index) => ({
      id: `custom-${index}`,
      name,
      description: 'Ministère personnalisé',
      isActive: true,
      order: 1000 + index,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

  const combined = [
    ...availableMinistries.value,
    ...uniqueCustomMinistries
  ];
  
  return combined;
});

const canContinue = computed(() => {
  return selectedMinistries.value.length > 0;
});

const toggleMinistry = (ministry: string) => {
  const index = selectedMinistries.value.indexOf(ministry);
  if (index > -1) {
    selectedMinistries.value.splice(index, 1);
    
    // If it's a custom ministry and was deselected, remove it from custom ministries
    const customIndex = customMinistries.value.indexOf(ministry);
    if (customIndex > -1) {
      customMinistries.value.splice(customIndex, 1);
    }
  } else {
    selectedMinistries.value.push(ministry);
  }
  updateStoreData();
};


const addCustomMinistry = () => {
  const newMinistry = customMinistryInput.value.trim();
  if (newMinistry && 
      !customMinistries.value.includes(newMinistry) && 
      !availableMinistries.value.some(m => m.name.toLowerCase() === newMinistry.toLowerCase()) &&
      !selectedMinistries.value.some(name => name.toLowerCase() === newMinistry.toLowerCase())) {
    
    customMinistries.value.push(newMinistry);
    selectedMinistries.value.push(newMinistry);
    customMinistryInput.value = '';
    updateStoreData();
  }
};

const handleCustomInputKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    addCustomMinistry();
  }
};

const updateStoreData = () => {
  // Get only the selected custom ministries
  const selectedCustomMinistries = customMinistries.value.filter(ministry => 
    selectedMinistries.value.includes(ministry)
  );
  
  onboardingStore.updateFormData({
    ministries: [...selectedMinistries.value],
    customMinistry: selectedCustomMinistries.join(', ') // For backward compatibility
  });
};

const goBack = () => {
  updateStoreData();
  onboardingStore.previousStep();
  router.push('/onboarding/phone');
};

const continueToNextStep = () => {
  if (!canContinue.value) {
    return; // Don't continue if validation fails
  }
  updateStoreData();
  
  // Mark this step as completed
  onboardingStore.markStepCompleted(4);
  
  onboardingStore.nextStep();
  router.push('/onboarding/congratulations');
};

const loadMinistries = async () => {
  try {
    loading.value = true;
    
    // Try to get all ministries from Firebase (both active and inactive)
    const ministries = await ministriesService.getAllMinistries();
    
    if (ministries.length === 0) {
      // If no ministries exist, use static list as fallback
      // Ministries will be created on-the-fly when members are saved
      availableMinistries.value = DEFAULT_MINISTRIES.map((name, index) => ({
        id: `static-${index}`,
        name,
        description: '',
        isActive: true,
        order: index + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
    } else {
      // Remove duplicates from Firebase ministries based on name (case-insensitive)
      const uniqueMinistries = ministries.filter((ministry, index, self) => 
        index === self.findIndex(m => m.name.toLowerCase() === ministry.name.toLowerCase())
      );
      availableMinistries.value = uniqueMinistries;
    }
  } catch (error) {
    console.error('Error loading ministries:', error);
    // Fallback to static list if Firebase fails
    availableMinistries.value = DEFAULT_MINISTRIES.map((name, index) => ({
      id: `fallback-${index}`,
      name,
      description: '',
      isActive: true,
      order: index + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  } finally {
    loading.value = false;
  }
};

// Initialize form with existing data
onMounted(async () => {
  // Load ministries from Firebase
  await loadMinistries();
  
  // Initialize form data
  selectedMinistries.value = [...(onboardingStore.formData.ministries || [])];
  
  // Handle existing custom ministry data
  const existingCustom = onboardingStore.formData.customMinistry || '';
  if (existingCustom.trim()) {
    // Split by comma for multiple custom ministries or use as single
    const customItems = existingCustom.split(',').map(item => item.trim()).filter(item => item);
    customMinistries.value = customItems;
  }
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
  color: #b5121b;
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
  font-size: 1rem;
  color: #6B7280;
  text-align: center;
  line-height: 1.6;
  margin: 0 0 3rem 0;
  padding: 0 1rem;
}

.ministries-container {
  margin-bottom: 2rem;
}

.ministries-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: flex-start;
}

.ministry-chip {
  background: #F9FAFB;
  border: 2px solid #E5E7EB;
  border-radius: 2rem;
  padding: 0.75rem 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 44px; /* Minimum touch target size */
  min-width: 44px;
  position: relative;
  user-select: none;
  font-size: 0.875rem;
  font-weight: 500;
}

.ministry-chip:hover {
  background: #F3F4F6;
  border-color: #D1D5DB;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.ministry-chip.selected {
  background: #FEE2E2;
  border-color: #b5121b;
  color: #b5121b;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(181, 18, 27, 0.2);
}

.ministry-chip.custom {
  border-style: dashed;
  background: #FEFBFF;
  border-color: #C4B5FD;
}

.ministry-chip.custom.selected {
  background: #F0F9FF;
  border-color: #0EA5E9;
  color: #0EA5E9;
  border-style: solid;
}

.ministry-chip .ministry-name {
  font-weight: 500;
  font-size: 0.875rem;
  line-height: 1.2;
  white-space: nowrap;
}

.ministry-chip .check-icon {
  font-size: 1rem;
  margin-left: 0.25rem;
  flex-shrink: 0;
}

.custom-ministry-section {
  margin-bottom: 2rem;
}

.custom-input {
  --background: #FFFFFF;
  --border-radius: 0.75rem;
  --border-color: #D1D5DB;
  --border-width: 1px;
  --border-style: solid;
  --min-height: 56px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin: 0;
}

.add-button {
  --background: #b5121b;
  --background-hover: #9f1018;
  --background-activated: #8a0e15;
  width: 36px;
  height: 36px;
  margin-left: 0.5rem;
  --border-radius: 50%;
  --box-shadow: 0 2px 8px rgba(181, 18, 27, 0.25);
  transition: all 0.2s ease;
}

.add-button:hover {
  transform: translateY(-1px);
  --box-shadow: 0 4px 12px rgba(181, 18, 27, 0.35);
}

.add-button ion-icon {
  font-size: 1rem;
}

.add-button:disabled {
  --background: #E5E7EB;
  --color: #9CA3AF;
  --box-shadow: none;
  transform: none;
}


.continue-button {
  --background: #b5121b;
  --background-hover: #9f1018;
  height: 3.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  margin-top: 2rem;
}

.continue-button.disabled {
  --background: #D1D5DB;
  --color: #9CA3AF;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem 0;
}

.loading-container ion-spinner {
  --color: #b5121b;
  width: 2rem;
  height: 2rem;
}

ion-progress-bar {
  --progress-background: #b5121b;
  --buffer-background: #FEE2E2;
}

@media (max-width: 768px) {
  .step-title {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .ministries-chips {
    gap: 0.5rem;
  }
  
  .ministry-chip {
    font-size: 0.8125rem;
    padding: 0.6rem 1rem;
    min-height: 42px;
  }
  
  .step-title {
    font-size: 1.25rem;
  }
}
</style>