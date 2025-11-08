<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Équipes</ion-title>
        <ion-buttons slot="end">
          <ion-button v-if="isAdmin" fill="clear" @click="() => router.push('/team-form')">
            <ion-icon :icon="addOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Équipes</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="content-container">
        <div v-if="loading" class="loading-container">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p>Chargement des équipes...</p>
        </div>

        <div v-else-if="teams.length === 0" class="empty-state">
          <ion-icon :icon="peopleOutline" color="medium"></ion-icon>
          <h2>Aucune équipe</h2>
          <p>Créez la première équipe pour commencer</p>
          <ion-button v-if="isAdmin" fill="solid" @click="() => router.push('/team-form')">
            <ion-icon :icon="addOutline" slot="start"></ion-icon>
            Créer une équipe
          </ion-button>
        </div>

        <div v-else class="teams-list">
          <ion-card
            v-for="team in teams"
            :key="team.id"
            class="team-card"
            @click="() => router.push(`/team-detail/${team.id}`)"
            button
          >
            <ion-card-header>
              <div class="card-header-content">
                <div class="team-icon">
                  <ion-icon :icon="team.icon || peopleOutline"></ion-icon>
                </div>
                <div class="team-details">
                  <ion-card-title>{{ team.name }}</ion-card-title>
                  <ion-card-subtitle>
                    <div class="team-meta">
                      <span class="member-count">
                        <ion-icon :icon="peopleOutline"></ion-icon>
                        {{ team.members.length }} membre{{ team.members.length > 1 ? 's' : '' }}
                      </span>
                      <span class="separator">•</span>
                      <span class="owner-info">
                        <ion-icon :icon="personCircleOutline"></ion-icon>
                        {{ getOwnerName(team.ownerId) }}
                      </span>
                    </div>
                  </ion-card-subtitle>
                  <p v-if="team.description" class="team-description">{{ team.description }}</p>
                </div>
                <ion-button
                  v-if="!isUserMemberOfTeam(team)"
                  fill="outline"
                  size="small"
                  @click.stop="joinTeam(team)"
                  class="join-button"
                >
                  <ion-icon :icon="personAddOutline" slot="start"></ion-icon>
                  Joindre
                </ion-button>
              </div>
            </ion-card-header>
          </ion-card>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
  IonCardTitle, IonCardSubtitle, IonButtons, IonButton, IonIcon,
  IonRefresher, IonRefresherContent, IonSpinner, toastController
} from '@ionic/vue';
import {
  addOutline, peopleOutline, personCircleOutline, personAddOutline
} from 'ionicons/icons';
import { teamsService } from '@/firebase/teams';
import { membersService } from '@/firebase/members';
import { authService } from '@/firebase/auth';
import type { Team } from '@/types/team';
import type { Member } from '@/types/member';

const router = useRouter();
const teams = ref<Team[]>([]);
const members = ref<Member[]>([]);
const loading = ref(true);
const isAdmin = ref(false);
const currentMember = ref<Member | null>(null);

// Memoize member lookup for better performance
const membersMap = computed(() => {
  return new Map(members.value.map(member => [member.id, member]));
});

const getOwnerName = (ownerId: string) => {
  const owner = membersMap.value.get(ownerId);
  return owner ? owner.fullName : 'Propriétaire inconnu';
};

const isUserMemberOfTeam = (team: Team): boolean => {
  if (!currentMember.value) return false;
  return team.members.some(m => m.memberId === currentMember.value!.id);
};

const joinTeam = async (team: Team) => {
  if (!currentMember.value) {
    const toast = await toastController.create({
      message: 'Vous devez être connecté pour rejoindre une équipe',
      duration: 3000,
      color: 'warning'
    });
    await toast.present();
    return;
  }

  try {
    // Request to join team with pending status
    await teamsService.requestToJoinTeam(team.id, currentMember.value.id);

    const toast = await toastController.create({
      message: 'Demande envoyée! En attente d\'approbation.',
      duration: 3000,
      color: 'success'
    });
    await toast.present();

    // Reload teams to update UI
    await loadTeams();
  } catch (error) {
    console.error('Error joining team:', error);
    const toast = await toastController.create({
      message: 'Erreur lors de l\'envoi de la demande',
      duration: 3000,
      color: 'danger'
    });
    await toast.present();
  }
};

const checkAdminStatus = async () => {
  try {
    const user = authService.getCurrentUser();
    if (user) {
      const member = await membersService.getMemberByFirebaseUserId(user.uid);
      if (member) {
        currentMember.value = member;
        isAdmin.value = member.isAdmin || false;
      }
    }
  } catch (error) {
    console.error('Error checking admin status:', error);
    isAdmin.value = false;
  }
};

const loadTeams = async () => {
  try {
    loading.value = true;
    const [teamsData, membersData] = await Promise.all([
      teamsService.getAllTeams(),
      membersService.getAllMembers()
    ]);
    // Sort teams alphabetically by name with optimized French locale
    teams.value = teamsData.sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
    // Sort members alphabetically by fullName with optimized French locale
    members.value = membersData.sort((a, b) => a.fullName.localeCompare(b.fullName, 'fr', { sensitivity: 'base' }));
  } catch (error) {
    console.error('Error loading teams:', error);
    // Show user-friendly error
    const toast = document.createElement('ion-toast');
    toast.message = 'Erreur lors du chargement des équipes';
    toast.duration = 3000;
    toast.color = 'danger';
    document.body.appendChild(toast);
    toast.present().then(() => {
      // Clean up to prevent memory leaks
      setTimeout(() => document.body.removeChild(toast), 3100);
    });
  } finally {
    loading.value = false;
  }
};

const handleRefresh = async (event: any) => {
  await loadTeams();
  event.target.complete();
};

onMounted(async () => {
  await checkAdminStatus();
  await loadTeams();
});
</script>

<style scoped>
.content-container {
  padding: 1rem;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 1rem;
}

.loading-container ion-spinner {
  --color: var(--ion-color-primary);
  width: 3rem;
  height: 3rem;
}

.loading-container p {
  color: #6B7280;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: #6B7280;
}

.empty-state ion-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #111827;
}

.empty-state p {
  margin: 0 0 2rem 0;
  font-size: 1rem;
}

/* Teams List - Vertical Layout */
.teams-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 0.5rem;
}

.team-card {
  margin: 0;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.team-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Card Header */
.card-header-content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.team-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(var(--ion-color-primary-rgb), 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.team-icon ion-icon {
  font-size: 1.75rem;
  color: var(--ion-color-primary);
}

.team-details {
  flex: 1;
  min-width: 0;
}

.team-details ion-card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--ion-text-color);
  margin-bottom: 0.25rem;
}

.team-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.875rem;
  color: var(--ion-color-medium);
}

.member-count,
.owner-info {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.member-count ion-icon,
.owner-info ion-icon {
  font-size: 1rem;
}

.separator {
  color: var(--ion-color-medium-tint);
}

.join-button {
  margin-left: auto;
  flex-shrink: 0;
}

.team-description {
  font-size: 0.875rem;
  color: var(--ion-color-step-600);
  line-height: 1.5;
  margin: 0.75rem 0 0 0;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .content-container {
    padding: 0.75rem;
  }

  .join-button {
    width: 100%;
    margin-left: 0;
  }
}

@media (max-width: 480px) {
  .empty-state {
    padding: 2rem 1rem;
  }

  .empty-state ion-icon {
    font-size: 3rem;
  }

  .empty-state h2 {
    font-size: 1.25rem;
  }
}
</style>