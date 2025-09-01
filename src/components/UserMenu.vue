<template>
  <ion-popover
    :is-open="isOpen"
    @didDismiss="$emit('close')"
    :trigger="triggerId"
    placement="bottom-end"
  >
    <ion-content class="user-menu">
      <div class="user-info">
        <ion-avatar class="menu-avatar">
          <img v-if="userAvatar" :src="userAvatar" :alt="userName" />
          <span v-else class="initials">{{ userInitials }}</span>
        </ion-avatar>
        <div class="user-details">
          <h3 class="user-name">{{ userName }}</h3>
          <p class="user-email">{{ user?.email }}</p>
        </div>
      </div>
      
      <ion-list class="menu-list">
        <ion-item button @click="goToAccount" class="account-item">
          <ion-icon :icon="personOutline" slot="start"></ion-icon>
          <ion-label>Mon compte</ion-label>
        </ion-item>
        
        <ion-item button @click="goToSettings" class="settings-item">
          <ion-icon :icon="settingsOutline" slot="start"></ion-icon>
          <ion-label>Paramètres</ion-label>
        </ion-item>
        
        <ion-item button @click="handleLogout" class="logout-item">
          <ion-icon :icon="logOutOutline" slot="start" color="danger"></ion-icon>
          <ion-label color="danger">Se déconnecter</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-popover>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import {
  IonPopover, IonContent, IonAvatar, IonList, IonItem, IonLabel, IonIcon,
  toastController, alertController
} from '@ionic/vue';
import { logOutOutline, personOutline, settingsOutline } from 'ionicons/icons';
import { useUser } from '@/composables/useUser';
import { authService } from '@/firebase/auth';

interface Props {
  isOpen: boolean;
  triggerId: string;
}

defineProps<Props>();

const emit = defineEmits<{
  close: []
}>();

const router = useRouter();
const { user, userAvatar, userInitials, userName } = useUser();

const showToast = async (message: string, color: 'success' | 'danger' = 'success') => {
  const toast = await toastController.create({
    message,
    duration: 3000,
    position: 'top',
    color
  });
  await toast.present();
};

const goToAccount = () => {
  emit('close');
  router.push('/my-account');
};

const goToSettings = () => {
  emit('close');
  router.push('/settings');
};

const handleLogout = async () => {
  const alert = await alertController.create({
    header: 'Confirmation',
    message: 'Êtes-vous sûr de vouloir vous déconnecter ?',
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel'
      },
      {
        text: 'Se déconnecter',
        role: 'destructive',
        handler: async () => {
          try {
            await authService.signOutUser();
            await showToast('Vous avez été déconnecté');
            emit('close');
            router.replace('/login');
          } catch (error) {
            console.error('Logout error:', error);
            await showToast('Erreur lors de la déconnexion', 'danger');
          }
        }
      }
    ]
  });
  
  await alert.present();
};
</script>

<style scoped>
.user-menu {
  --padding-top: 0;
  --padding-bottom: 0;
  min-width: 280px;
}

.user-info {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: var(--ion-color-light);
  border-bottom: 1px solid var(--ion-color-light-shade);
}

.menu-avatar {
  width: 48px;
  height: 48px;
  margin-right: 12px;
  flex-shrink: 0;
}

.menu-avatar .initials {
  background: var(--ion-color-primary);
  color: white;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-color-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  margin: 0;
  font-size: 14px;
  color: var(--ion-color-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-list {
  padding: 8px 0;
}

.account-item,
.settings-item {
  --color: var(--ion-color-dark);
}

.account-item ion-icon,
.settings-item ion-icon {
  margin-right: 12px;
  color: var(--ion-color-medium);
}

.logout-item {
  --color: var(--ion-color-danger);
}

.logout-item ion-icon {
  margin-right: 12px;
}
</style>