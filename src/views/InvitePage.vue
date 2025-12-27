<template>
  <ion-page>
    <ion-content>
      <div class="loading-container">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
        <p class="loading-text">Chargement de l'invitation...</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { IonPage, IonContent, IonSpinner } from '@ionic/vue';
import { authService } from '@/firebase/auth';
import { membersService } from '@/firebase/members';
import { invitationService } from '@/services/invitationService';

const router = useRouter();
const route = useRoute();

onMounted(async () => {
  const serviceId = route.params.serviceId as string;

  if (!serviceId) {
    // No service ID, redirect to home or login
    router.replace('/login');
    return;
  }

  const redirectPath = `/service-detail/${serviceId}`;

  try {
    // Wait for auth state to be initialized
    const user = await authService.waitForAuth();

    if (user) {
      // User is authenticated, check onboarding status
      const hasCompletedOnboarding = await membersService.hasCompletedOnboarding(user.uid);

      if (hasCompletedOnboarding) {
        // Fully onboarded user - redirect directly to service
        router.replace(redirectPath);
      } else {
        // User needs to complete onboarding
        invitationService.setPostLoginRedirect(redirectPath);
        router.replace('/onboarding/welcome');
      }
    } else {
      // User is not authenticated - save redirect and go to login
      invitationService.setPostLoginRedirect(redirectPath);
      router.replace('/login');
    }
  } catch (error) {
    console.error('Error processing invitation:', error);
    // On error, save redirect and go to login
    invitationService.setPostLoginRedirect(redirectPath);
    router.replace('/login');
  }
});
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
}

.loading-text {
  margin-top: 1rem;
  color: #6B7280;
  font-size: 1rem;
}

ion-spinner {
  width: 48px;
  height: 48px;
}
</style>
