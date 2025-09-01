// Service de gestion des Push Notifications pour EEG Adorateurs
import { toastController } from '@ionic/vue';

export interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
}

class PushNotificationService {
  private vapidPublicKey = 'BAXJc_5N2cve9MSSD7tgmWgAda2Wk7Ke4a1TU9IbrSxXY-JkfGB4vV1WjGwxkgJrwmZT_ubFLEZVQIKGKOY4ioc';
  private swRegistration: ServiceWorkerRegistration | null = null;

  async initialize(): Promise<void> {
    try {
      // Vérifier le support des notifications
      if (!('Notification' in window)) {
        console.warn('Ce navigateur ne supporte pas les notifications');
        return;
      }

      // Check if service workers are supported
      if (!('serviceWorker' in navigator)) {
        console.warn('Service Workers ne sont pas supportés par ce navigateur');
        return;
      }

      console.log('Initialisation du service de notifications...');
      
      // Enregistrer le Service Worker
      try {
        this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        console.log('Service Worker enregistré avec succès:', this.swRegistration);

        // Attendre que le SW soit actif
        await this.waitForServiceWorker();
        console.log('Service Worker prêt');
      } catch (swError) {
        console.error('Erreur lors de l\'enregistrement du Service Worker:', swError);
        throw swError;
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des notifications:', error);
    }
  }

  private async waitForServiceWorker(): Promise<void> {
    return new Promise((resolve) => {
      if (this.swRegistration?.active) {
        resolve();
        return;
      }

      const intervalId = setInterval(() => {
        if (this.swRegistration?.active) {
          clearInterval(intervalId);
          resolve();
        }
      }, 100);
    });
  }

  async requestPermission(): Promise<NotificationPermission> {
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        await this.showToast('Notifications activées avec succès !', 'success');
        return permission;
      } else if (permission === 'denied') {
        await this.showToast('Notifications refusées. Vous pouvez les activer dans les paramètres de votre navigateur.', 'warning');
        return permission;
      }
      
      return permission;
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
      await this.showToast('Erreur lors de l\'activation des notifications', 'danger');
      return 'denied';
    }
  }

  async subscribeToNotifications(): Promise<PushSubscription | null> {
    try {
      // Check if push notifications are supported
      if (!('PushManager' in window)) {
        console.warn('Push notifications ne sont pas supportées par ce navigateur');
        await this.showToast('Push notifications non supportées par ce navigateur', 'warning');
        return null;
      }

      if (!this.swRegistration) {
        console.warn('Service Worker non enregistré');
        await this.showToast('Service Worker non disponible', 'danger');
        return null;
      }

      // Check if push manager is available
      if (!this.swRegistration.pushManager) {
        console.warn('Push Manager non disponible');
        await this.showToast('Push Manager non disponible', 'danger');
        return null;
      }

      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        return null;
      }

      console.log('Tentative d\'abonnement aux notifications push...');
      
      const applicationServerKey = this.urlB64ToUint8Array(this.vapidPublicKey);
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });

      console.log('Abonnement aux notifications réussi:', subscription);
      await this.showToast('Notifications activées avec succès !', 'success');
      
      // Ici vous pourriez envoyer l'abonnement à votre serveur
      // await this.sendSubscriptionToServer(subscription);

      return subscription;
    } catch (error: any) {
      console.error('Erreur lors de l\'abonnement aux notifications:', error);
      
      let errorMessage = 'Erreur lors de l\'abonnement aux notifications';
      if (error.name === 'NotSupportedError') {
        errorMessage = 'Push notifications non supportées';
      } else if (error.name === 'NotAllowedError') {
        errorMessage = 'Permission refusée pour les notifications';
      } else if (error.name === 'InvalidStateError') {
        errorMessage = 'Service Worker dans un état invalide';
      }
      
      await this.showToast(errorMessage, 'danger');
      return null;
    }
  }

  async unsubscribeFromNotifications(): Promise<boolean> {
    try {
      if (!this.swRegistration) {
        return false;
      }

      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('Désabonnement réussi');
        await this.showToast('Notifications désactivées', 'success');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors du désabonnement:', error);
      return false;
    }
  }

  async isSubscribed(): Promise<boolean> {
    try {
      if (!this.swRegistration) {
        return false;
      }
      
      const subscription = await this.swRegistration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'abonnement:', error);
      return false;
    }
  }

  async getNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  async showLocalNotification(options: PushNotificationOptions): Promise<void> {
    try {
      const permission = await this.getNotificationPermission();
      if (permission !== 'granted') {
        console.warn('Permission de notification non accordée');
        return;
      }

      if (!this.swRegistration) {
        console.warn('Service Worker non disponible');
        return;
      }

      await this.swRegistration.showNotification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-192x192.png',
        badge: options.badge || '/icon-192x192.png',
        tag: options.tag,
        data: options.data
      } as any);
    } catch (error) {
      console.error('Erreur lors de l\'affichage de la notification:', error);
    }
  }

  private urlB64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger' = 'success'): Promise<void> {
    const toast = await toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color
    });
    await toast.present();
  }

  // Méthode pour envoyer l'abonnement au serveur (à implémenter selon votre backend)
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      // Exemple d'envoi au serveur Firebase Functions ou votre API
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          // Vous pouvez ajouter l'ID utilisateur ici
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi de l\'abonnement au serveur');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi au serveur:', error);
    }
  }
}

export const pushNotificationService = new PushNotificationService();