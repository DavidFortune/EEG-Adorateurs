<template>
  <ion-app>
    <div v-if="isProcessingEmailLink || isCheckingAuth" class="auth-loading">
      <ion-spinner name="crescent" color="primary"></ion-spinner>
      <p>{{ loadingMessage }}</p>
    </div>
    <ion-router-outlet v-else />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet, IonSpinner } from '@ionic/vue';
import { onBeforeMount, onMounted, onUnmounted, ref } from 'vue';
import { App as CapacitorApp } from '@capacitor/app';
import { authService } from '@/firebase/auth';
import { analyticsService } from '@/services/analyticsService';
import { errorTrackingService } from '@/services/errorTrackingService';
import { toastController } from '@ionic/vue';

const isProcessingEmailLink = ref(false);
const isCheckingAuth = ref(true);
const loadingMessage = ref('Chargement...');

const showToast = async (message: string, color: 'success' | 'danger' = 'success') => {
  const toast = await toastController.create({
    message,
    duration: 3000,
    position: 'top',
    color
  });
  await toast.present();
};

// Handle email link authentication BEFORE router initialization
onBeforeMount(async () => {
  const currentUrl = window.location.href;
  const pathname = window.location.pathname;
  console.log('App before mount, checking URL:', currentUrl);
  console.log('Current pathname:', pathname);
  
  // Check if this is the auth callback route or if the URL contains Firebase auth parameters
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');
  const oobCode = urlParams.get('oobCode');
  const apiKey = urlParams.get('apiKey');
  
  console.log('URL params - mode:', mode, 'oobCode:', oobCode ? 'present' : 'missing', 'apiKey:', apiKey ? 'present' : 'missing');
  
  // Also check hash parameters (Firebase sometimes uses hash)
  const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
  const hashMode = hashParams.get('mode');
  const hashOobCode = hashParams.get('oobCode');
  
  console.log('Hash params - mode:', hashMode, 'oobCode:', hashOobCode ? 'present' : 'missing');
  
  // Check if this is an email link by multiple methods
  const isAuthCallback = pathname === '/auth/callback';
  const hasAuthParams = (mode === 'signIn' && oobCode) || (hashMode === 'signIn' && hashOobCode);
  const isFirebaseEmailLink = authService.isSignInWithEmailLink(currentUrl);
  
  console.log('Auth checks - isAuthCallback:', isAuthCallback, 'hasAuthParams:', hasAuthParams, 'isFirebaseEmailLink:', isFirebaseEmailLink);
  
  if (isAuthCallback || hasAuthParams || isFirebaseEmailLink) {
    console.log('Email sign-in link detected');
    isProcessingEmailLink.value = true;
    loadingMessage.value = 'Connexion en cours...';
    
    try {
      // Complete the email sign-in process
      const user = await authService.completeEmailSignIn(currentUrl);
      console.log('Email sign-in successful, user:', user.email);
      
      // Show success message
      await showToast('Connexion réussie !');
      
      // Wait a bit for auth state to propagate
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Navigate directly to home page
      window.location.href = '/tabs/accueil';
    } catch (error) {
      console.error('Email sign-in error:', error);
      await showToast('Erreur lors de la connexion. Veuillez réessayer.', 'danger');
      
      // If auth fails, redirect to login page
      window.location.href = '/login';
    }
  } else {
    console.log('Not an email sign-in link, proceeding normally');
    isCheckingAuth.value = false;
  }
});

// Track app lifecycle events for session management
onMounted(async () => {
  // Handle app pause (going to background)
  const pauseListener = await CapacitorApp.addListener('appStateChange', ({ isActive }) => {
    if (isActive) {
      analyticsService.handleAppResume();
    } else {
      analyticsService.handleAppPause();
    }
  });

  // Setup global error handlers
  setupGlobalErrorHandlers();

  // Cleanup on unmount
  onUnmounted(() => {
    pauseListener.remove();
    cleanupGlobalErrorHandlers();
  });
});

// Global error handler for unhandled errors
const handleGlobalError = (event: ErrorEvent) => {
  event.preventDefault();

  const error = errorTrackingService.trackError(
    event.error || new Error(event.message),
    {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      type: 'global_error'
    }
  );

  // Show user-friendly error message for critical errors
  if (error.severity === 'critical' || error.severity === 'high') {
    showToast('Une erreur s\'est produite. Nous travaillons à la résoudre.', 'danger');
  }
};

// Global handler for unhandled promise rejections
const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  event.preventDefault();

  const error = errorTrackingService.trackError(
    event.reason,
    {
      type: 'unhandled_rejection',
      promise: 'Promise rejection'
    }
  );

  // Show recovery message if available
  const recovery = errorTrackingService.getSuggestedRecovery(error);
  if (recovery.userMessage) {
    showToast(recovery.userMessage, 'danger');
  }
};

// Setup global error handlers
const setupGlobalErrorHandlers = () => {
  window.addEventListener('error', handleGlobalError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);

  // Also track user ID when authenticated
  authService.waitForAuth().then(user => {
    if (user) {
      errorTrackingService.setUserId(user.uid);
    }
  });
};

// Cleanup global error handlers
const cleanupGlobalErrorHandlers = () => {
  window.removeEventListener('error', handleGlobalError);
  window.removeEventListener('unhandledrejection', handleUnhandledRejection);
};
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
