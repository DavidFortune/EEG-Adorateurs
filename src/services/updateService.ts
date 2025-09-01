// Service de gestion des mises à jour automatiques pour EEG Adorateurs
import { toastController } from '@ionic/vue';
import packageInfo from '../../package.json';

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  availableVersion?: string;
  updateReady?: boolean;
}

export interface ReleaseNote {
  version: string;
  date: string;
  title: string;
  description: string;
  features: string[];
  fixes: string[];
  improvements: string[];
}

class UpdateService {
  private updateCheckInterval: NodeJS.Timeout | null = null;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private updateAvailableCallbacks: Array<(updateInfo: UpdateInfo) => void> = [];

  async initialize(): Promise<void> {
    try {
      if ('serviceWorker' in navigator) {
        // Get existing service worker registration
        this.swRegistration = await navigator.serviceWorker.getRegistration() || null;
        
        if (!this.swRegistration) {
          console.warn('Service Worker not found for update service');
          return;
        }

        // Listen for service worker updates
        this.setupUpdateListeners();
        
        // Start periodic update checks
        this.startUpdateChecks();

        console.log('Update service initialized');
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du service de mise à jour:', error);
    }
  }

  private setupUpdateListeners(): void {
    if (!this.swRegistration) return;

    // Listen for waiting service worker
    this.swRegistration.addEventListener('updatefound', () => {
      const newWorker = this.swRegistration!.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker is available
            this.notifyUpdateAvailable();
          }
        });
      }
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
        this.notifyUpdateAvailable();
      }
    });
  }

  private startUpdateChecks(): void {
    // Check for updates every 30 minutes
    this.updateCheckInterval = setInterval(() => {
      this.checkForUpdates();
    }, 30 * 60 * 1000);

    // Initial check after 5 seconds
    setTimeout(() => {
      this.checkForUpdates();
    }, 5000);
  }

  async checkForUpdates(): Promise<UpdateInfo> {
    try {
      if (!this.swRegistration) {
        return {
          hasUpdate: false,
          currentVersion: packageInfo.version
        };
      }

      // Trigger service worker update check
      await this.swRegistration.update();

      const updateInfo: UpdateInfo = {
        hasUpdate: !!this.swRegistration.waiting,
        currentVersion: packageInfo.version,
        updateReady: !!this.swRegistration.waiting
      };

      if (updateInfo.hasUpdate) {
        this.triggerUpdateCallbacks(updateInfo);
      }

      return updateInfo;
    } catch (error) {
      console.error('Erreur lors de la vérification des mises à jour:', error);
      return {
        hasUpdate: false,
        currentVersion: packageInfo.version
      };
    }
  }

  async applyUpdate(): Promise<boolean> {
    try {
      if (!this.swRegistration?.waiting) {
        console.warn('Aucune mise à jour en attente');
        return false;
      }

      // Send message to waiting service worker to skip waiting
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Listen for controller change
      return new Promise<boolean>((resolve) => {
        const onControllerChange = () => {
          navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
          resolve(true);
        };
        
        navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
          resolve(false);
        }, 10000);
      });
    } catch (error) {
      console.error('Erreur lors de l\'application de la mise à jour:', error);
      return false;
    }
  }

  async reloadApp(): Promise<void> {
    // Wait a bit for the new service worker to take control
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  private async notifyUpdateAvailable(): Promise<void> {
    const updateInfo: UpdateInfo = {
      hasUpdate: true,
      currentVersion: packageInfo.version,
      updateReady: true
    };

    // Show toast notification
    await this.showUpdateToast();
    
    // Trigger callbacks
    this.triggerUpdateCallbacks(updateInfo);
  }

  private async showUpdateToast(): Promise<void> {
    const toast = await toastController.create({
      message: 'Une nouvelle version de l\'application est disponible',
      duration: 8000,
      position: 'top',
      color: 'primary',
      buttons: [
        {
          text: 'Mettre à jour',
          handler: async () => {
            const success = await this.applyUpdate();
            if (success) {
              await this.showUpdateSuccessToast();
              await this.reloadApp();
            } else {
              await this.showUpdateErrorToast();
            }
          }
        },
        {
          text: 'Plus tard',
          role: 'cancel'
        }
      ]
    });
    
    await toast.present();
  }

  private async showUpdateSuccessToast(): Promise<void> {
    const toast = await toastController.create({
      message: 'Mise à jour appliquée! Redémarrage...',
      duration: 3000,
      position: 'top',
      color: 'success'
    });
    
    await toast.present();
  }

  private async showUpdateErrorToast(): Promise<void> {
    const toast = await toastController.create({
      message: 'Erreur lors de la mise à jour. Veuillez recharger manuellement.',
      duration: 5000,
      position: 'top',
      color: 'danger'
    });
    
    await toast.present();
  }

  onUpdateAvailable(callback: (updateInfo: UpdateInfo) => void): void {
    this.updateAvailableCallbacks.push(callback);
  }

  private triggerUpdateCallbacks(updateInfo: UpdateInfo): void {
    this.updateAvailableCallbacks.forEach(callback => {
      try {
        callback(updateInfo);
      } catch (error) {
        console.error('Erreur dans le callback de mise à jour:', error);
      }
    });
  }

  getCurrentVersion(): string {
    return packageInfo.version;
  }

  // Mock release notes - in production, this would fetch from an API
  async getReleaseNotes(): Promise<ReleaseNote[]> {
    return [
      {
        version: '1.1.0',
        date: '2025-01-09',
        title: 'Notifications Push et Paramètres',
        description: 'Ajout des notifications push et d\'une page de paramètres complète',
        features: [
          'Notifications push fonctionnelles avec gestion des permissions',
          'Nouvelle page Paramètres accessible depuis le menu utilisateur',
          'Service Worker pour le cache offline et les notifications',
          'Interface PWA complète avec mode plein écran'
        ],
        fixes: [
          'Correction des erreurs TypeScript dans le service de notifications',
          'Amélioration de la gestion des erreurs de permissions'
        ],
        improvements: [
          'Interface utilisateur épurée sans boutons de menu superflus',
          'Intégration Capacitor pour le déploiement mobile natif',
          'Optimisation du Service Worker pour de meilleures performances'
        ]
      },
      {
        version: '1.0.0',
        date: '2024-12-15',
        title: 'Version initiale',
        description: 'Lancement de l\'application de gestion des services EEG Adorateurs',
        features: [
          'Gestion des disponibilités pour les services',
          'Coordination des ministères et équipes',
          'Interface utilisateur moderne avec Ionic Vue',
          'Authentification Firebase sécurisée',
          'Onboarding complet pour les nouveaux utilisateurs'
        ],
        fixes: [],
        improvements: []
      }
    ];
  }

  destroy(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
    this.updateAvailableCallbacks = [];
  }
}

export const updateService = new UpdateService();