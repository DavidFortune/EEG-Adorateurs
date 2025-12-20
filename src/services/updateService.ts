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
        version: '1.11.1',
        date: '2025-12-20',
        title: 'Gestion des médias et paroles',
        description: 'Amélioration de la gestion des médias et des paroles dans les ressources',
        features: [
          'Boutons d\'édition pour tous les types de médias (YouTube, vidéo, audio, Spotify, partition, fichier, lien)',
          'Modal d\'édition des métadonnées (notes/nom) pour les médias',
          'Modal d\'édition du contenu des paroles',
          'Bouton "Ajouter des paroles" lorsqu\'aucune parole n\'existe (admin uniquement)',
          'Section "Paroles" toujours visible même sans contenu'
        ],
        fixes: [],
        improvements: [
          'Boutons d\'édition et suppression alignés dans l\'en-tête de la section Paroles',
          'Interface cohérente pour l\'ajout et la modification des paroles'
        ]
      },
      {
        version: '1.11.0',
        date: '2025-12-14',
        title: 'Programme de service en temps réel',
        description: 'Le programme de service est maintenant synchronisé en temps réel entre tous les utilisateurs',
        features: [
          'Synchronisation en temps réel du programme de service avec Firestore',
          'Les modifications (ajout, suppression, édition d\'éléments) sont visibles instantanément par tous',
          'Les propriétés musicales des ressources se mettent à jour en temps réel',
          'Subscription aux ressources liées pour afficher les changements sans rafraîchir'
        ],
        fixes: [],
        improvements: [
          'Suppression des appels manuels de rechargement après chaque modification',
          'Nettoyage automatique des subscriptions lors de la fermeture de la page',
          'Performance améliorée grâce à la mise à jour incrémentale des données'
        ]
      },
      {
        version: '1.10.5',
        date: '2025-01-22',
        title: 'Avatar personnalisé et affichage des invités',
        description: 'Les utilisateurs peuvent maintenant ajouter leur propre avatar et les invités sont visibles dans les participants des services',
        features: [
          'Téléversement d\'avatar personnalisé depuis la page Mon compte',
          'Prévisualisation et modification de l\'avatar avec interface intuitive',
          'Annonce de la fonctionnalité avatar sur la page d\'accueil (masquable)',
          'Nouvelle section "Invités" dans la page des membres assignés d\'un service',
          'Statistiques mises à jour incluant le nombre d\'invités'
        ],
        fixes: [],
        improvements: [
          'Les avatars personnalisés sont prioritaires sur les photos Google',
          'Règles Firebase Storage pour les avatars (5MB max, images uniquement)',
          'Design distinctif pour la carte des invités dans les participants'
        ]
      },
      {
        version: '1.10.4',
        date: '2025-01-22',
        title: 'Invités spéciaux pour les services',
        description: 'Possibilité d\'inviter des utilisateurs spécifiques à un service sans qu\'ils fassent partie d\'une équipe requise',
        features: [
          'Nouvelle section "Invités spéciaux" dans la page de détail d\'un service (admin seulement)',
          'Modal de recherche et sélection de membres à inviter',
          'Les utilisateurs invités voient le service dans leur liste et accueil',
          'Accès complet au programme du service pour les invités'
        ],
        fixes: [],
        improvements: [
          'Filtrage des services mis à jour pour inclure les invités',
          'Interface intuitive pour gérer les invités avec recherche'
        ]
      },
      {
        version: '1.10.3',
        date: '2025-01-22',
        title: 'Recherche YouTube dans les ressources',
        description: 'Ajout de la possibilité de rechercher des vidéos YouTube directement lors de l\'ajout de médias dans ResourceFormPage',
        features: [
          'Nouveau bouton "Rechercher sur YouTube" dans le formulaire de ressources',
          'Interface de recherche YouTube intégrée avec résultats en miniatures',
          'Prévisualisation des vidéos avant sélection',
          'Modal de prévisualisation avec lecteur YouTube intégré'
        ],
        fixes: [],
        improvements: [
          'Intégration de la recherche YouTube similaire à ServiceProgramPageFlat',
          'Sélection rapide de vidéos YouTube pour les ressources'
        ]
      },
      {
        version: '1.8.4',
        date: '2025-01-08',
        title: 'Mise à jour des pages d\'équipes',
        description: 'Améliorations et mises à jour des composants Teams avec cache Firebase actualisé',
        features: [],
        fixes: [],
        improvements: [
          'Mise à jour des composants TeamDetailPage et TeamsPage',
          'Actualisation du cache Firebase Hosting',
          'Optimisation des performances de rendu'
        ]
      },
      {
        version: '1.8.3',
        date: '2025-01-04',
        title: 'Correction des bugs de filtrage des services',
        description: 'Correction de bugs critiques empêchant l\'affichage de tous les services futurs dans les pages d\'équipe',
        features: [],
        fixes: [
          'Correction du filtrage des services dans TeamSchedulingView - tous les services futurs pour une équipe s\'affichent maintenant correctement',
          'Amélioration de la comparaison des noms d\'équipe (insensible à la casse et aux espaces)',
          'Correction du problème de synchronisation des données entre allServices et allEvents',
          'Suppression de la limite artificielle de 5 services dans TeamAvailabilityPage'
        ],
        improvements: [
          'Affichage de tous les services futurs dans la page de disponibilités d\'équipe',
          'Rechargement automatique des services pour garantir la synchronisation des données',
          'Utilisation de watch pour une mise à jour réactive des événements filtrés'
        ]
      },
      {
        version: '1.7.0',
        date: '2025-01-10',
        title: 'Workflow d\'approbation des équipes',
        description: 'Système complet d\'approbation pour rejoindre les équipes avec filtrage basé sur l\'appartenance',
        features: [
          'Nouvelle étape de sélection d\'équipes dans l\'onboarding',
          'Les utilisateurs peuvent demander à rejoindre plusieurs équipes',
          'Les propriétaires et leaders peuvent approuver/rejeter les demandes en attente',
          'Attribution de rôles lors de l\'approbation (leader, membre, invité)',
          'Filtrage des services basé sur l\'appartenance aux équipes approuvées',
          'Section des demandes en attente dans la page de détails d\'équipe',
          'Auto-population du champ teams depuis la collection teams',
          'Synchronisation automatique du tableau teams lors des changements de membres'
        ],
        fixes: [
          'Correction de l\'affichage des membres existants dans TeamDetailPage',
          'Correction des erreurs de permissions Firestore',
          'Correction de l\'erreur "Member not found" pendant l\'onboarding',
          'Traitement des membres sans statut pour la rétrocompatibilité'
        ],
        improvements: [
          'Simplification de l\'onboarding avec suppression de l\'étape ministères',
          'Règles Firestore mises à jour pour permettre la gestion des équipes',
          'Interface utilisateur améliorée avec styles pour les membres en attente',
          'Filtrage des services dans AccueilPage, ServicesPage et DisponibilitesPage',
          'TeamSchedulingView affiche uniquement les services nécessitant l\'équipe'
        ]
      },
      {
        version: '1.2.0',
        date: '2025-01-14',
        title: 'Système de gestion des équipes',
        description: 'Nouvelle fonctionnalité complète de gestion des équipes avec contrôles administrateur',
        features: [
          'Nouvelle section Équipes accessible uniquement aux administrateurs',
          'Gestion complète des équipes avec nom, description et icône personnalisée',
          'Système de rôles (propriétaire, leader, membre, invité)',
          'Fonctionnalité de transfert de propriété des équipes',
          'Interface en grille avec cartes responsives pour affichage des équipes',
          '13 icônes de ministères disponibles pour personnaliser les équipes',
          'Tri alphabétique automatique des équipes et membres'
        ],
        fixes: [
          'Correction des erreurs TypeScript lors de la compilation',
          'Amélioration de la validation des formulaires'
        ],
        improvements: [
          'Application du style iOS sur toutes les plateformes',
          'Validation renforcée pour le nom complet et sélection de ministères',
          'Interface utilisateur cohérente avec le design existant',
          'Gestion optimisée des permissions et accès administrateur',
          'Intégration Firebase complète pour la persistance des données'
        ]
      },
      {
        version: '1.1.2',
        date: '2025-01-09',
        title: 'Optimisation du cache Firebase',
        description: 'Amélioration des performances de cache pour les mises à jour automatiques',
        features: [],
        fixes: [],
        improvements: [
          'Configuration optimisée du cache Firebase Hosting',
          'Service Worker mis en cache pour 30 minutes pour de meilleures performances',
          'Amélioration de la stratégie de cache pour les assets statiques'
        ]
      },
      {
        version: '1.1.1',
        date: '2025-01-09',
        title: 'Système de mise à jour automatique',
        description: 'Mise à jour patch avec amélioration du système de mise à jour automatique',
        features: [],
        fixes: [
          'Correction des erreurs TypeScript dans le service de mise à jour',
          'Amélioration de la compatibilité du Service Worker'
        ],
        improvements: [
          'Optimisation des performances de vérification des mises à jour',
          'Interface utilisateur plus fluide pour les notifications de mise à jour'
        ]
      },
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