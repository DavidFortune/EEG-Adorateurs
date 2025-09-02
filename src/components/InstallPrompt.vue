<template>
  <ion-modal
    :is-open="isOpen"
    :initial-breakpoint="1"
    :breakpoints="[0, 1]"
    @didDismiss="handleDismiss"
    class="install-prompt-modal"
  >
    <ion-content class="install-prompt-content">
      <div class="install-prompt">
        <div class="prompt-header">
          <img src="/icon-192x192.png" alt="EEG Adorateurs" class="app-icon" />
          <ion-icon :icon="closeOutline" @click="dismiss" class="close-icon"></ion-icon>
        </div>
        
        <div class="prompt-body">
          <h2>Installer EEG Adorateurs</h2>
          <p class="prompt-description">
            Ajoutez l'application à votre écran d'accueil pour un accès rapide et une expérience optimale
          </p>
          
          <div class="benefits">
            <div class="benefit-item">
              <ion-icon :icon="flashOutline" color="primary"></ion-icon>
              <span>Accès rapide depuis l'écran d'accueil</span>
            </div>
            <div class="benefit-item">
              <ion-icon :icon="notificationsOutline" color="primary"></ion-icon>
              <span>Notifications en temps réel</span>
            </div>
            <div class="benefit-item">
              <ion-icon :icon="wifiOutline" color="primary"></ion-icon>
              <span>Fonctionne hors ligne</span>
            </div>
          </div>
          
          <div class="prompt-actions">
            <ion-button expand="block" @click="installApp" size="large" class="install-button">
              <ion-icon :icon="downloadOutline" slot="start"></ion-icon>
              Installer maintenant
            </ion-button>
            
            <ion-button expand="block" fill="clear" @click="dismiss" size="small" class="later-button">
              Plus tard
            </ion-button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  IonModal,
  IonContent,
  IonButton,
  IonIcon,
  toastController
} from '@ionic/vue';
import {
  closeOutline,
  downloadOutline,
  flashOutline,
  notificationsOutline,
  wifiOutline
} from 'ionicons/icons';

const props = defineProps<{
  isOpen: boolean;
  deferredPrompt: any;
}>();

const emit = defineEmits<{
  dismiss: [];
  installed: [];
}>();

const handleDismiss = () => {
  emit('dismiss');
};

const dismiss = () => {
  emit('dismiss');
};

const installApp = async () => {
  if (!props.deferredPrompt) {
    const toast = await toastController.create({
      message: 'Installation non disponible. Veuillez réessayer plus tard.',
      duration: 3000,
      color: 'warning'
    });
    await toast.present();
    emit('dismiss');
    return;
  }

  try {
    // Show the install prompt
    props.deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await props.deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      
      const toast = await toastController.create({
        message: '🎉 Application installée avec succès!',
        duration: 3000,
        color: 'success'
      });
      await toast.present();
      
      emit('installed');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    emit('dismiss');
  } catch (error) {
    console.error('Error installing app:', error);
    
    const toast = await toastController.create({
      message: 'Erreur lors de l\'installation. Veuillez réessayer.',
      duration: 3000,
      color: 'danger'
    });
    await toast.present();
    
    emit('dismiss');
  }
};
</script>

<style scoped>
.install-prompt-modal {
  --height: auto;
  --max-height: 90%;
  --border-radius: 16px 16px 0 0;
}

.install-prompt-content {
  --background: var(--ion-background-color);
}

.install-prompt {
  padding: 1.5rem;
  padding-bottom: 2rem;
}

.prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.app-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.close-icon {
  font-size: 24px;
  color: var(--ion-color-medium);
  cursor: pointer;
  padding: 0.5rem;
  margin: -0.5rem;
}

.prompt-body h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: var(--ion-text-color);
}

.prompt-description {
  color: var(--ion-color-medium);
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

.benefits {
  background: var(--ion-color-light);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  color: var(--ion-text-color);
}

.benefit-item ion-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.benefit-item span {
  font-size: 0.9rem;
  line-height: 1.3;
}

.prompt-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.install-button {
  --background: var(--ion-color-primary);
  --background-activated: var(--ion-color-primary-shade);
  font-weight: 600;
  margin: 0;
}

.later-button {
  --color: var(--ion-color-medium);
  margin: 0;
}

@media (prefers-color-scheme: dark) {
  .benefits {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .app-icon {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
}
</style>