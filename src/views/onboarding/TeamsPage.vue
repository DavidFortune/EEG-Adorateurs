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
        <h1 class="step-title">Vos équipes</h1>

        <!-- Description -->
        <p class="step-description">
          Dans quelles équipes servez-vous ?
        </p>

        <!-- Teams Grid -->
        <div class="teams-grid">
          <div 
            v-for="team in availableTeams" 
            :key="team"
            class="team-card"
            :class="{ 'selected': selectedTeams.includes(team) }"
            @click="toggleTeam(team)"
          >
            <div class="team-content">
              <span class="team-name">{{ team }}</span>
              <ion-icon 
                v-if="selectedTeams.includes(team)"
                :icon="checkmarkCircle" 
                class="check-icon"
              ></ion-icon>
            </div>
          </div>
        </div>

        <!-- Custom Team Input -->
        <div class="custom-team-section">
          <ion-button 
            fill="outline" 
            color="medium"
            expand="block"
            class="add-team-button"
            :class="{ 'active': showCustomInput }"
            @click="toggleCustomInput"
          >
            <ion-icon :icon="addOutline" slot="start"></ion-icon>
            Ajouter une autre équipe
          </ion-button>

          <ion-item v-if="showCustomInput" class="custom-input">
            <ion-input
              v-model="customTeam"
              type="text"
              placeholder="Nom de l'équipe"
            ></ion-input>
          </ion-item>
        </div>

        <!-- Continue Button -->
        <ion-button 
          expand="block" 
          color="primary" 
          size="large" 
          class="continue-button"
          @click="continueToNextStep"
        >
          Continuer ({{ totalTeamsCount }} équipe{{ totalTeamsCount > 1 ? 's' : '' }})
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
  peopleOutline, checkmarkCircle, addOutline, arrowBack
} from 'ionicons/icons';
import { useOnboardingStore } from '@/stores/onboarding';
import { AVAILABLE_TEAMS } from '@/types/member';

const router = useRouter();
const onboardingStore = useOnboardingStore();

const availableTeams = AVAILABLE_TEAMS;
const selectedTeams = ref<string[]>([]);
const customTeam = ref('');
const showCustomInput = ref(false);

const progressPercentage = computed(() => onboardingStore.progressPercentage);

const totalTeamsCount = computed(() => {
  return selectedTeams.value.length + (customTeam.value.trim() ? 1 : 0);
});

const toggleTeam = (team: string) => {
  const index = selectedTeams.value.indexOf(team);
  if (index > -1) {
    selectedTeams.value.splice(index, 1);
  } else {
    selectedTeams.value.push(team);
  }
  updateStoreData();
};

const toggleCustomInput = () => {
  showCustomInput.value = !showCustomInput.value;
  if (!showCustomInput.value) {
    customTeam.value = '';
    updateStoreData();
  }
};

const updateStoreData = () => {
  onboardingStore.updateFormData({
    teams: [...selectedTeams.value],
    customTeam: customTeam.value.trim()
  });
};

const goBack = () => {
  updateStoreData();
  onboardingStore.previousStep();
  router.push('/onboarding/personal-info');
};

const continueToNextStep = () => {
  updateStoreData();
  onboardingStore.nextStep();
  router.push('/onboarding/availability');
};

// Initialize form with existing data
onMounted(() => {
  selectedTeams.value = [...onboardingStore.formData.teams];
  customTeam.value = onboardingStore.formData.customTeam;
  showCustomInput.value = customTeam.value.trim() !== '';
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

.teams-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.team-card {
  background: #F9FAFB;
  border: 2px solid #E5E7EB;
  border-radius: 0.75rem;
  padding: 1.5rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.team-card:hover {
  background: #F3F4F6;
  border-color: #D1D5DB;
}

.team-card.selected {
  background: #FEE2E2;
  border-color: #DC2626;
  color: #DC2626;
}

.team-content {
  text-align: center;
  position: relative;
  width: 100%;
}

.team-name {
  font-weight: 600;
  font-size: 0.875rem;
  line-height: 1.3;
  display: block;
}

.check-icon {
  position: absolute;
  top: -8px;
  right: -8px;
  background: white;
  border-radius: 50%;
  font-size: 1.25rem;
}

.custom-team-section {
  margin-bottom: 2rem;
}

.add-team-button {
  --border-style: dashed;
  --border-width: 2px;
  --border-color: #D1D5DB;
  margin-bottom: 1rem;
}

.add-team-button.active {
  --border-color: #DC2626;
  --color: #DC2626;
}

.custom-input {
  --background: #FFFFFF;
  --border-radius: 0.75rem;
  --border-color: #D1D5DB;
  --border-width: 1px;
  --border-style: solid;
  --min-height: 56px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-top: 1rem;
}

.continue-button {
  --background: #DC2626;
  --background-hover: #B91C1C;
  height: 3.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  margin-top: 2rem;
}

ion-progress-bar {
  --progress-background: #DC2626;
  --buffer-background: #FEE2E2;
}

@media (max-width: 480px) {
  .teams-grid {
    grid-template-columns: 1fr;
  }
  
  .team-card {
    min-height: 60px;
  }
}
</style>