<template>
  <ion-page>
    <ion-content>
      <div class="content-container">
        <!-- Logo -->
        <div class="logo-container">
          <img 
            v-if="logoLoaded" 
            :src="logoUrl" 
            alt="EEG Logo" 
            class="logo"
            @error="onLogoError"
          />
          <div v-else class="logo-fallback">
            <span>G</span>
          </div>
        </div>

        <!-- Title -->
        <h1 class="step-title">EEG Adorateurs</h1>
        
        <!-- Description -->
        <p class="step-description">
          Gestion simplifiée des services<br>
          À l'Église Évangélique Galilée
        </p>

        <!-- Form Container -->
        <div class="form-container">
          <!-- Google Sign In Button -->
          <ion-button 
            expand="block" 
            color="primary" 
            size="large"
            class="continue-button"
            @click="handleGoogleSignIn"
            :disabled="loading"
          >
            <ion-icon :icon="logoGoogle" slot="start"></ion-icon>
            <span v-if="!loading">Continuer avec Google</span>
            <span v-else>Connexion...</span>
          </ion-button>

          <!-- Separator -->
          <div class="separator">
            <div class="separator-line"></div>
            <span class="separator-text">ou</span>
            <div class="separator-line"></div>
          </div>

          <!-- Email Input -->
          <ion-item class="form-item">
            <ion-input
              v-model="email"
              type="email"
              placeholder="Votre adresse email"
              :disabled="loading"
            ></ion-input>
          </ion-item>

          <!-- Email Sign In Button -->
          <ion-button 
            expand="block" 
            fill="outline" 
            color="dark"
            size="large"
            class="secondary-button"
            @click="handleEmailSignIn"
            :disabled="loading || !isValidEmail"
          >
            <ion-icon :icon="mailOutline" slot="start"></ion-icon>
            <span v-if="!emailSending">Recevoir un lien de connexion</span>
            <span v-else>Envoi du lien...</span>
          </ion-button>

          <!-- Email sent message -->
          <div v-if="emailSent" class="email-sent-message">
            <ion-icon :icon="checkmarkCircle" color="success"></ion-icon>
            <p>Lien de connexion envoyé à {{ email }}</p>
            <p class="small-text">Vérifiez votre boîte mail ou pourriel, et cliquez sur le lien pour vous connecter.</p>
          </div>
        </div>

        <!-- Privacy Policy and Terms Links -->
        <div class="privacy-link-container">
          <p class="privacy-text">
            En vous connectant, vous acceptez nos
            <a @click="goToTerms" class="privacy-link">Termes et Conditions</a>
            et notre
            <a @click="goToPrivacy" class="privacy-link">Politique de Confidentialité</a>
          </p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonContent, IonButton, IonIcon, IonItem, IonInput,
  toastController
} from '@ionic/vue';
import {
  logoGoogle, mailOutline, checkmarkCircle
} from 'ionicons/icons';
import { authService } from '@/firebase/auth';
import { membersService } from '@/firebase/members';
import { useOnboardingStore } from '@/stores/onboarding';

const router = useRouter();
const onboardingStore = useOnboardingStore();

const logoUrl = '/favicon.png';
const logoLoaded = ref(true);
const email = ref('');
const loading = ref(false);
const emailSending = ref(false);
const emailSent = ref(false);

const isValidEmail = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.value);
});

const onLogoError = () => {
  logoLoaded.value = false;
};

const showToast = async (message: string, color: 'success' | 'danger' = 'danger') => {
  const toast = await toastController.create({
    message,
    duration: 3000,
    position: 'top',
    color
  });
  await toast.present();
};

const handleGoogleSignIn = async () => {
  loading.value = true;
  try {
    const user = await authService.signInWithGoogle();
    
    // Check if user has completed onboarding
    const hasCompletedOnboarding = await membersService.hasCompletedOnboarding(user.uid);
    
    if (hasCompletedOnboarding) {
      await showToast('Connexion réussie !', 'success');
      router.replace('/accueil');
    } else {
      onboardingStore.updateFormData({ 
        email: user.email || '' 
      });
      await showToast('Connexion réussie !', 'success');
      router.push('/onboarding/welcome');
    }
  } catch (error) {
    console.error('Google sign in error:', error);
    await showToast('Erreur lors de la connexion avec Google');
  } finally {
    loading.value = false;
  }
};

const handleEmailSignIn = async () => {
  emailSending.value = true;
  try {
    await authService.sendEmailSignInLink(email.value);
    onboardingStore.updateFormData({ 
      email: email.value 
    });
    
    emailSent.value = true;
    await showToast('Lien de connexion envoyé !', 'success');
  } catch (error) {
    console.error('Email sign in error:', error);
    await showToast('Erreur lors de l\'envoi du lien de connexion');
  } finally {
    emailSending.value = false;
  }
};

const goToPrivacy = () => {
  router.push('/privacy');
};

const goToTerms = () => {
  router.push('/terms');
};

// Check if already authenticated
onMounted(async () => {
  // Check if user is already authenticated
  const currentUser = authService.getCurrentUser();
  if (currentUser) {
    try {
      // Check if user has completed onboarding
      const hasCompletedOnboarding = await membersService.hasCompletedOnboarding(currentUser.uid);
      
      if (hasCompletedOnboarding) {
        router.replace('/accueil');
      } else {
        router.replace('/onboarding/welcome');
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // If error, default to onboarding flow
      router.replace('/onboarding/welcome');
    }
  }
  // Email link handling is now done in App.vue to avoid router conflicts
});
</script>

<style scoped>
.content-container {
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.logo-container {
  display: flex;
  justify-content: center;
  margin: 0 auto 1rem auto;
}

.logo {
  width: 8rem;
  height: 8rem;
  border-radius: 50%;
  object-fit: cover;
}

.logo-fallback {
  width: 8rem;
  height: 8rem;
  border-radius: 50%;
  background: #b5121b;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
  font-weight: bold;
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
  margin-bottom: 2rem;
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
  --background: #b5121b;
  --background-hover: #9f1018;
  height: 3.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.secondary-button {
  --border-color: #374151;
  --color: #374151;
  height: 3rem;
  font-size: 1rem;
  margin-bottom: 1rem;
}

.separator {
  display: flex;
  align-items: center;
  margin: 1.5rem 0;
}

.separator-line {
  flex: 1;
  height: 1px;
  background: #E5E7EB;
}

.separator-text {
  padding: 0 1rem;
  color: #6B7280;
  font-size: 0.875rem;
}

.email-sent-message {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #ECFDF5;
  border-radius: 0.5rem;
  text-align: center;
}

.email-sent-message ion-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.email-sent-message p {
  margin: 0.5rem 0;
  color: #059669;
}

.small-text {
  font-size: 0.875rem;
  color: #6B7280 !important;
}

.privacy-link-container {
  margin-top: 2rem;
  text-align: center;
}

.privacy-text {
  font-size: 0.875rem;
  color: #6B7280;
}

.privacy-link {
  color: #b5121b;
  text-decoration: underline;
  cursor: pointer;
}

.privacy-link:hover {
  color: #9f1018;
}

@media (max-width: 768px) {
  .step-title {
    font-size: 1.5rem;
  }
  
  .logo {
    width: 6rem;
    height: 6rem;
  }
  
  .logo-fallback {
    width: 6rem;
    height: 6rem;
  }
}
</style>