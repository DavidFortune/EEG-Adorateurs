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
        <h1 class="step-title">Rejoignez des équipes</h1>
        <p class="step-description">
          Sélectionnez les équipes que vous souhaitez rejoindre. Votre demande sera soumise aux responsables pour approbation.
        </p>

        <!-- Loading State -->
        <div v-if="loading" class="loading-container">
          <ion-spinner name="crescent"></ion-spinner>
        </div>

        <!-- Teams Grid -->
        <div v-else class="teams-container">
          <div
            v-for="team in availableTeams"
            :key="team.id"
            class="team-card"
            :class="{ 'selected': selectedTeamIds.includes(team.id) }"
            @click="toggleTeam(team.id)"
          >
            <div class="team-icon">
              <ion-icon :icon="team.icon || peopleOutline"></ion-icon>
            </div>
            <h3 class="team-name">{{ team.name }}</h3>
            <p class="team-description">{{ team.description }}</p>
            <ion-icon
              v-if="selectedTeamIds.includes(team.id)"
              :icon="checkmarkCircle"
              class="check-icon"
            ></ion-icon>
          </div>

          <div v-if="availableTeams.length === 0" class="empty-state">
            <ion-icon :icon="informationCircleOutline"></ion-icon>
            <p>Aucune équipe disponible pour le moment</p>
          </div>
        </div>

        <!-- Continue Button -->
        <ion-button
          expand="block"
          color="primary"
          size="large"
          class="continue-button"
          @click="continueToNextStep"
        >
          <span v-if="selectedTeamIds.length > 0">
            Continuer ({{ selectedTeamIds.length }} équipe{{ selectedTeamIds.length > 1 ? 's' : '' }})
          </span>
          <span v-else>
            Ignorer cette étape
          </span>
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonContent, IonButton, IonIcon, IonProgressBar, IonSpinner,
  toastController
} from '@ionic/vue';
import {
  arrowBack, peopleOutline, checkmarkCircle, informationCircleOutline
} from 'ionicons/icons';
import { teamsService } from '@/firebase/teams';
import { useOnboardingStore } from '@/stores/onboarding';
import type { Team } from '@/types/team';

const router = useRouter();
const onboardingStore = useOnboardingStore();

const loading = ref(true);
const availableTeams = ref<Team[]>([]);
const selectedTeamIds = ref<string[]>([]);

// Progress (this is step 2 out of 5 total steps)
const progressPercentage = computed(() => 40); // 2/5 = 40%

const loadTeams = async () => {
  try {
    loading.value = true;
    const teams = await teamsService.getAllTeams();

    // During onboarding, show all teams
    availableTeams.value = teams.sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
  } catch (error) {
    console.error('Error loading teams:', error);
    const toast = await toastController.create({
      message: 'Erreur lors du chargement des équipes',
      duration: 3000,
      color: 'danger'
    });
    toast.present();
  } finally {
    loading.value = false;
  }
};

const toggleTeam = (teamId: string) => {
  const index = selectedTeamIds.value.indexOf(teamId);
  if (index > -1) {
    selectedTeamIds.value.splice(index, 1);
  } else {
    selectedTeamIds.value.push(teamId);
  }
};

const continueToNextStep = () => {
  // Store selected teams in onboarding store
  onboardingStore.updateFormData({
    selectedTeamIds: selectedTeamIds.value
  });

  // Navigate to next step (phone)
  router.push('/onboarding/phone');
};

const goBack = () => {
  router.push('/onboarding/personal-info');
};

onMounted(() => {
  // Load previously selected teams from store
  selectedTeamIds.value = onboardingStore.formData.selectedTeamIds || [];
  loadTeams();
});
</script>

<style scoped>
.content-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.back-button {
  margin-bottom: 1rem;
  --padding-start: 0;
}

.step-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-icon ion-icon {
  font-size: 3rem;
  color: white;
}

.step-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  text-align: center;
  margin: 0 0 0.5rem 0;
}

.step-description {
  font-size: 1rem;
  color: #6B7280;
  text-align: center;
  margin: 0 0 2rem 0;
  line-height: 1.5;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.teams-container {
  margin-bottom: 2rem;
}

.team-card {
  position: relative;
  background: #F9FAFB;
  border: 2px solid #E5E7EB;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.team-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.team-card.selected {
  background: #EEF2FF;
  border-color: var(--ion-color-primary);
}

.team-icon {
  width: 48px;
  height: 48px;
  background: var(--ion-color-primary);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.team-icon ion-icon {
  font-size: 1.5rem;
  color: white;
}

.team-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.team-description {
  font-size: 0.875rem;
  color: #6B7280;
  margin: 0;
  line-height: 1.5;
}

.check-icon {
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-size: 1.5rem;
  color: var(--ion-color-primary);
}

.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
}

.empty-state ion-icon {
  font-size: 3rem;
  color: #9CA3AF;
  margin-bottom: 1rem;
}

.empty-state p {
  color: #6B7280;
  font-size: 1rem;
  margin: 0;
}

.continue-button {
  margin-top: 2rem;
  --border-radius: 12px;
  font-weight: 600;
}

@media (max-width: 480px) {
  .content-container {
    padding: 1.5rem 1rem;
  }

  .step-title {
    font-size: 1.5rem;
  }

  .step-icon {
    width: 64px;
    height: 64px;
  }

  .step-icon ion-icon {
    font-size: 2.5rem;
  }
}
</style>
