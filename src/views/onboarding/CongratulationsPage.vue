<template>
  <ion-page>
    <ion-content class="congratulations-content">
      <div class="congratulations-container">
        <!-- Celebration Emoji -->
        <div class="celebration-emoji">🎉</div>

        <!-- Title -->
        <h1 class="congratulations-title">Félicitations {{ firstName }}!</h1>

        <!-- Description -->
        <p class="congratulations-description">
          Votre profil est maintenant configuré. Vous êtes prêt à servir dans {{ teamsList }}.
        </p>

        <!-- Encouragement Card -->
        <div class="encouragement-card">
          <p class="encouragement-intro">Parole d'encouragement :</p>
          <blockquote class="verse">
            "Tout ce que vous faites, faites-le de bon cœur, comme pour le Seigneur et non pour des hommes."
          </blockquote>
          <p class="reference">- Colossiens 3:23</p>
        </div>

        <!-- Start App Button -->
        <ion-button 
          expand="block" 
          color="primary" 
          size="large" 
          class="start-app-button"
          @click="completeOnboarding"
          :disabled="completing"
        >
          <span v-if="!completing">Commencer à utiliser l'app</span>
          <span v-else>Finalisation...</span>
          <ion-icon :icon="arrowForward" slot="end" v-if="!completing"></ion-icon>
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonContent, IonButton, IonIcon, toastController
} from '@ionic/vue';
import {
  arrowForward
} from 'ionicons/icons';
import { useOnboardingStore } from '@/stores/onboarding';
import { authService } from '@/firebase/auth';
import { membersService } from '@/firebase/members';

const router = useRouter();
const onboardingStore = useOnboardingStore();

const completing = ref(false);

const firstName = computed(() => onboardingStore.formData.firstName);

const teamsList = computed(() => {
  const teams = [...onboardingStore.formData.teams];
  if (onboardingStore.formData.customTeam.trim()) {
    teams.push(onboardingStore.formData.customTeam.trim());
  }
  
  if (teams.length === 0) return 'votre équipe';
  if (teams.length === 1) return teams[0];
  if (teams.length === 2) return `${teams[0]} et ${teams[1]}`;
  
  return `${teams.slice(0, -1).join(', ')} et ${teams[teams.length - 1]}`;
});

const showToast = async (message: string, color: 'success' | 'danger' = 'success') => {
  const toast = await toastController.create({
    message,
    duration: 3000,
    position: 'top',
    color
  });
  await toast.present();
};

const completeOnboarding = async () => {
  completing.value = true;
  
  try {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('Utilisateur non authentifié');
    }

    // Check if member already exists
    const existingMember = await membersService.getMemberByFirebaseUserId(user.uid);
    
    if (existingMember) {
      // Update existing member instead of creating a new one
      await membersService.updateMember(existingMember.id, {
        firstName: onboardingStore.formData.firstName,
        lastName: onboardingStore.formData.lastName,
        fullName: `${onboardingStore.formData.firstName} ${onboardingStore.formData.lastName}`,
        teams: [...onboardingStore.formData.teams, ...(onboardingStore.formData.customTeam.trim() ? [onboardingStore.formData.customTeam.trim()] : [])],
        availabilities: onboardingStore.formData.availabilities,
        isOnboardingCompleted: true
      });
      await showToast('Profil mis à jour avec succès !');
    } else {
      // Create new member profile in Firestore
      await membersService.createMember(
        user.uid,
        user.email || onboardingStore.formData.email,
        user.photoURL || undefined,
        onboardingStore.formData
      );
      await showToast('Profil créé avec succès !');
    }
    
    // Reset onboarding data
    onboardingStore.resetForm();
    
    // Navigate to main app
    router.replace('/tabs/accueil');
    
  } catch (error) {
    console.error('Error completing onboarding:', error);
    await showToast('Erreur lors de la finalisation du profil', 'danger');
  } finally {
    completing.value = false;
  }
};

onMounted(() => {
  // Ensure we're on the last step
  onboardingStore.goToStep(5);
});
</script>

<style scoped>
.congratulations-content {
  --background: #F9FAFB;
}

.congratulations-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  text-align: center;
}

.celebration-emoji {
  font-size: 6rem;
  margin-bottom: 2rem;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-30px);
  }
  60% {
    transform: translateY(-15px);
  }
}

.congratulations-title {
  font-size: 2.5rem;
  font-weight: bold;
  color: #111827;
  margin: 0 0 2rem 0;
  line-height: 1.2;
}

.congratulations-description {
  font-size: 1.125rem;
  color: #6B7280;
  line-height: 1.6;
  margin-bottom: 3rem;
  max-width: 600px;
}

.encouragement-card {
  background: #111827;
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 3rem;
  max-width: 500px;
  width: 100%;
}

.encouragement-intro {
  color: #FFFFFF;
  font-weight: 600;
  margin: 0 0 1rem 0;
  font-size: 1rem;
}

.verse {
  color: #D1D5DB;
  font-style: italic;
  margin: 1rem 0;
  font-size: 1.125rem;
  line-height: 1.6;
  border: none;
  padding: 0;
}

.reference {
  color: #9CA3AF;
  text-align: right;
  margin: 1rem 0 0 0;
  font-size: 0.875rem;
}

.start-app-button {
  --background: #DC2626;
  --background-hover: #B91C1C;
  height: 3.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  max-width: 300px;
  width: 100%;
}

.start-app-button:disabled {
  --background: #D1D5DB;
  --color: #9CA3AF;
}

@media (max-width: 768px) {
  .congratulations-title {
    font-size: 2rem;
  }
  
  .celebration-emoji {
    font-size: 4rem;
  }
  
  .encouragement-card {
    padding: 1.5rem;
  }
}
</style>