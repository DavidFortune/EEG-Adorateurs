# EEG Adorateurs

**Gestion simplifiée des services pour l'Église Évangélique Galilée**

---

## Objectif

EEG Adorateurs est une plateforme complète de gestion des services et de coordination des équipes conçue pour l'Église Évangélique Galilée. Elle centralise la planification des cultes, la gestion des équipes de ministère, le suivi des disponibilités et le partage des ressources musicales et liturgiques dans une seule application mobile et web.

L'application remplace les processus manuels — courriels, feuilles de calcul, messages texte dispersés — par un outil numérique unifié accessible à tous les membres, du responsable d'église au bénévole.

---

## Proposition de valeur

### Pour les administrateurs
- **Source unique de vérité** pour tous les services, équipes et membres
- **Détection automatique des conflits** d'horaire — plus besoin de vérifier manuellement les chevauchements
- **Synchronisation en temps réel** via Firestore — tout le monde voit la même information, instantanément
- **Mode brouillon** pour les programmes : préparer, peaufiner, puis publier quand c'est prêt

### Pour les responsables d'équipe
- Visibilité claire sur les **disponibilités et affectations** de leur équipe
- **Flux d'approbation** des demandes d'adhésion
- **Communication SMS** directe pour les coordinations urgentes

### Pour les membres
- Indication rapide de leur **disponibilité** en quelques taps
- Accès au **programme complet** avant chaque service
- **Bibliothèque de ressources** centralisée (paroles, partitions, vidéos)
- Expérience **mobile-first** fonctionnant aussi bien sur téléphone que navigateur

### Pour l'organisation
- Meilleure planification grâce à une vue complète des disponibilités
- Réduction des absences avec des affectations claires et confirmées
- Scalabilité naturelle à mesure que l'église grandit

---

## Points différenciants (USP)

1. **Conçu spécifiquement pour le contexte francophone d'église** — terminologie, flux et interface entièrement en français, adaptés aux réalités des ministères de louange et de service

2. **Gestion de programmes de culte avec intégration biblique** — références bibliques parsées automatiquement (ex: « Jean 3:16-18 »), versets récupérés en temps réel depuis la traduction Louis Segond 1910

3. **Détection intelligente des conflits** — l'application empêche automatiquement les doubles affectations et les chevauchements de disponibilités entre services simultanés

4. **Mode présentation intégré** — les programmes se transforment en diaporama plein écran avec paroles, versets bibliques et vidéos YouTube, prêt à projeter pendant le culte

5. **Bibliothèque de ressources multimédia unifiée** — paroles, partitions PDF, pistes audio, vidéos YouTube, liens Spotify dans un seul endroit consultable et organisé par collections

6. **PWA + natif** — fonctionne comme une app installable sur iOS, Android et navigateur web avec notifications push, enregistrement audio/vidéo et mode hors-ligne

---

## Survol des fonctionnalités

### Authentification et onboarding

- Connexion via Google ou courriel/mot de passe (Firebase Auth)
- Parcours d'intégration guidé en 6 étapes : bienvenue, informations personnelles, téléphone, sélection d'équipes, disponibilités initiales, confirmation
- Barre de progression et navigation étape par étape
- Flux d'approbation : le membre demande à joindre une équipe, le responsable approuve

### Tableau de bord (Accueil)

- Salutation personnalisée avec prénom de l'utilisateur
- Cartes des services en attente de réponse de disponibilité
- Suggestions de profil (ajouter un numéro, configurer un avatar)
- Synchronisation temps réel des données affichées

### Gestion des services

- **Création et édition** : titre, date/heure de début et fin, catégorie (service régulier ou événement spécial), date limite de disponibilité, exigences par équipe
- **Liste des services** : services à venir et passés, badges de statut (publié/brouillon), durée calculée, filtre par catégorie
- **Page de détail** : interface à onglets (Programme, Ressources, Membres), partage via WhatsApp/SMS/courriel, liens d'invitation
- **Invitations** : liens partageables pour inviter des membres en dehors des équipes (accès invité)

### Programme de service

- **Types d'éléments** : chant, prière, lecture biblique, prédication, titre de section, annonce, offrande, bénédiction et plus
- **Détails par élément** : participant assigné, durée, paroles/notes, sous-éléments, ressources liées, référence biblique
- **Sous-éléments** : structure hiérarchique pour les éléments complexes (ex: médley de chants avec paroles et versets individuels)
- **Mode brouillon** : préparer le programme en privé, ajouter des visualiseurs autorisés, publier quand prêt
- **Chef de culte** : assignation d'un conducteur avec avatar affiché dans l'en-tête du programme
- **Calcul automatique** de la durée totale du programme
- **Export texte** du programme complet
- **Playlist YouTube** générée automatiquement à partir des chants du programme

### Intégration biblique

- Parsing de références françaises : « Psaume 23:1-6 », « 1 Corinthiens 13:4-7 », « Gen 1:1 »
- Support de 66 livres avec abréviations et variantes françaises
- Récupération automatique des versets via l'API bolls.life (Louis Segond 1910)
- Affichage formaté avec numéros de versets en exposant
- Disponible pour les éléments principaux et les sous-éléments

### Mode présentation

- Diaporama plein écran slide par slide
- Affichage des paroles paginées pour les longs textes
- Affichage des versets bibliques avec mise en forme élégante
- Navigation par éléments du programme
- Informations du participant et conducteur sur chaque slide
- Vidéos YouTube intégrées
- Pagination pour les passages longs (versets et paroles)

### Gestion des disponibilités

- Indication par service : disponible, indisponible, peut-être
- Champ commentaire optionnel
- Filtrage par équipe et par statut
- **Détection de conflits** : alerte automatique si deux services se chevauchent
- **Demande SMS** : les administrateurs peuvent envoyer une demande de disponibilité par SMS aux membres de l'équipe

### Gestion des équipes

- Création d'équipes avec nom, description et icône personnalisée (13 icônes de ministère)
- Hiérarchie de rôles : propriétaire, responsable, membre, invité
- Positions configurables par équipe (ex: chanteur, pianiste, batteur)
- Flux d'approbation des demandes d'adhésion
- **Vues dédiées** : détail de l'équipe, planification, disponibilités par service, affectations

### Affectation et planification

- Vue d'ensemble de tous les services avec navigation par date
- Mode d'affichage par équipe ou vue globale
- Affectation des membres aux services avec position
- Indicateurs visuels codés par couleur selon le statut de disponibilité
- Empêchement des doubles affectations sur des services simultanés

### Bibliothèque de ressources

- **Collections organisées** : globales, par équipe, par service ou personnelles — chacune identifiée par un symbole et une couleur
- **Types de ressources** : paroles, vidéo, audio, partition PDF, lien YouTube, lien Spotify, fichier, URL
- **Médias multiples par ressource** : une chanson peut contenir paroles, vidéo YouTube, partition PDF et piste audio
- **Métadonnées musicales** : tonalité, mesure, tempo, style
- **Recherche** : recherche plein texte sur titres, tags et notes avec suggestions intelligentes
- **Enregistrement intégré** : enregistrer audio ou vidéo directement depuis l'app
- **Recherche YouTube** : trouver et lier des vidéos YouTube sans quitter l'application
- **Visionneuse PDF** : affichage de partitions avec navigation par page
- **Sélection rapide** : bottom sheet avec onglets (récents, existants, YouTube, URL, création rapide)

### Profil et compte

- Nom complet, courriel, numéro de téléphone (avec validation de format)
- Avatar personnalisé (upload jusqu'à 10 Mo, optimisé automatiquement à 400x400px)
- Fallback aux initiales colorées si pas d'avatar
- Affichage de l'avatar dans l'en-tête, les listes de membres, les sélecteurs de participants

### Notifications et communication

- **Notifications push** via Firebase Cloud Messaging (FCM)
- **SMS** : demandes de disponibilité et distribution du programme aux membres
- **Partage** : liens d'invitation aux services via la feuille de partage native (WhatsApp, SMS, courriel)
- **Mises à jour in-app** : notification automatique quand une nouvelle version est disponible

### Paramètres

- Activation/désactivation des notifications push
- Affichage de la version et accès aux notes de version
- Pages légales : à propos, politique de confidentialité, conditions d'utilisation
- Langue : français | Fuseau horaire : Amérique/Montréal

### PWA et support mobile natif

- Application web progressive installable sur l'écran d'accueil
- Support hors-ligne via Service Worker
- Vérification automatique des mises à jour (toutes les 30 minutes)
- Fonctionnalités natives via Capacitor : notifications locales, retour haptique, feuille de partage, barre de statut, gestion du clavier, maintien de l'écran actif

---

## Rôles et permissions

| Fonctionnalité | Admin | Responsable | Membre | Invité |
|---|:---:|:---:|:---:|:---:|
| Voir les services | ✓ | ✓ | ✓ | ✓ (invité) |
| Créer/modifier des services | ✓ | ✓ | — | — |
| Créer/modifier des équipes | ✓ | — | — | — |
| Gérer les membres d'équipe | ✓ | ✓ | — | — |
| Approuver les demandes | ✓ | ✓ | — | — |
| Voir les programmes | ✓ | ✓ | ✓ | ✓ |
| Modifier les programmes | ✓ | — | — | — |
| Gérer les ressources | ✓ | — | — | — |
| Indiquer sa disponibilité | ✓ | ✓ | ✓ | ✓ |
| Voir les disponibilités | ✓ | ✓ | — | — |
| Affecter des membres | ✓ | ✓ | — | — |
| Envoyer des SMS | ✓ | — | — | — |
| Gérer les brouillons | ✓ | — | — | — |
| Modifier son avatar | ✓ | ✓ | ✓ | ✓ |

---

## Stack technique

- **Frontend** : Vue 3 + TypeScript + Ionic Vue
- **Mobile natif** : Capacitor (iOS, Android)
- **Backend** : Firebase (Firestore, Authentication, Storage, Cloud Functions, FCM)
- **APIs tierces** : bolls.life (Bible LSG), YouTube Data API, Spotify (liens)
- **Hébergement** : Firebase Hosting
