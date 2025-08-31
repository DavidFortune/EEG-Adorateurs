<template>
  <ion-app>
    <div v-if="isProcessingEmailLink" class="auth-loading">
      <ion-spinner name="crescent" color="primary"></ion-spinner>
      <p>Connexion en cours...</p>
    </div>
    <ion-router-outlet v-else />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet, IonSpinner } from '@ionic/vue';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '@/firebase/auth';
import { toastController } from '@ionic/vue';

const router = useRouter();
const isProcessingEmailLink = ref(false);

const showToast = async (message: string, color: 'success' | 'danger' = 'success') => {
  const toast = await toastController.create({
    message,
    duration: 3000,
    position: 'top',
    color
  });
  await toast.present();
};

// Handle email link authentication on app load
onMounted(async () => {
  // Check if the current URL is an email sign-in link
  const currentUrl = window.location.href;
  
  if (authService.isSignInWithEmailLink(currentUrl)) {
    isProcessingEmailLink.value = true;
    
    try {
      // Complete the email sign-in process
      await authService.completeEmailSignIn(currentUrl);
      
      // Show success message
      await showToast('Connexion réussie !');
      
      // The router guards will handle the redirect based on onboarding status
      // Force navigation to trigger the router guards
      router.push('/tabs/accueil');
    } catch (error) {
      console.error('Email sign-in error:', error);
      await showToast('Erreur lors de la connexion. Veuillez réessayer.', 'danger');
      
      // Redirect to login page on error
      router.push('/login');
    } finally {
      isProcessingEmailLink.value = false;
    }
  }
});
</script>

<style scoped>
.auth-loading {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  background: #F9FAFB;
}

.auth-loading ion-spinner {
  --color: #b5121b;
  width: 3rem;
  height: 3rem;
}

.auth-loading p {
  color: #6B7280;
  font-weight: 500;
  font-size: 1.125rem;
}
</style>
