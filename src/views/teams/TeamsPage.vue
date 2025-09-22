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

        <div v-else class="teams-grid">
          <ion-card 
            v-for="team in teams" 
            :key="team.id" 
            class="team-card" 
            @click="() => router.push(`/team-detail/${team.id}`)"
            button
          >
            <ion-card-content>
              <div class="team-header">
                <div class="team-icon">
                  <ion-icon :icon="team.icon || peopleOutline"></ion-icon>
                </div>
                <div class="member-count">
                  <ion-icon :icon="peopleOutline" class="member-icon"></ion-icon>
                  <span>{{ team.members.length }} member{{ team.members.length > 1 ? 's' : '' }}</span>
                </div>
              </div>
              
              <h3 class="team-name">{{ team.name }}</h3>
              <p class="team-description">{{ team.description }}</p>
              
              <div class="team-footer">
                <div class="owner-info">
                  <ion-icon :icon="personCircleOutline" class="owner-icon"></ion-icon>
                  <span class="owner-name">{{ getOwnerName(team.ownerId) }}</span>
                </div>
                <div class="team-actions">
                  <ion-button 
                    fill="clear" 
                    size="small" 
                    class="availability-button"
                    @click.stop="() => router.push(`/team-availability/${team.id}`)"
                  >
                    <ion-icon :icon="calendarOutline" slot="start"></ion-icon>
                    Disponibilités
                  </ion-button>
                  <ion-button 
                    fill="clear" 
                    size="small" 
                    class="assignments-button"
                    @click.stop="() => router.push(`/team-assignments/${team.id}`)"
                  >
                    <ion-icon :icon="checkmarkDoneOutline" slot="start"></ion-icon>
                    Assignations
                  </ion-button>
                </div>
              </div>
            </ion-card-content>
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
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent, 
  IonButtons, IonButton, IonIcon, IonRefresher, IonRefresherContent, IonSpinner
} from '@ionic/vue';
import {
  addOutline, peopleOutline, personCircleOutline, calendarOutline,
  checkmarkDoneOutline
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

// Memoize member lookup for better performance
const membersMap = computed(() => {
  return new Map(members.value.map(member => [member.id, member]));
});

const getOwnerName = (ownerId: string) => {
  const owner = membersMap.value.get(ownerId);
  return owner ? owner.fullName : 'Propriétaire inconnu';
};

const checkAdminStatus = async () => {
  try {
    const user = authService.getCurrentUser();
    if (user) {
      const member = await membersService.getMemberByFirebaseUserId(user.uid);
      isAdmin.value = member?.isAdmin || false;
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

.teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.team-card {
  margin: 0;
  cursor: pointer;
  transition: all 0.2s ease;
  height: 200px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.team-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.team-card ion-card-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.25rem;
}

.team-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.team-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #F3F4F6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.team-icon ion-icon {
  font-size: 1.5rem;
  color: var(--ion-color-primary);
}

.member-count {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: #6B7280;
}

.member-icon {
  font-size: 1rem;
}

.team-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.team-description {
  font-size: 0.875rem;
  color: #6B7280;
  line-height: 1.4;
  margin: 0 0 1rem 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  flex: 1;
}

.team-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.team-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.owner-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6B7280;
  flex: 1;
  min-width: 0;
}

.owner-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.owner-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.view-button {
  --color: var(--ion-color-primary);
  --padding-start: 0.5rem;
  --padding-end: 0.5rem;
  flex-shrink: 0;
  margin-left: 1rem;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .teams-grid {
    grid-template-columns: 1fr;
  }
  
  .content-container {
    padding: 0.75rem;
  }
  
  .team-card {
    height: auto;
    min-height: 180px;
  }
  
  .team-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .team-actions {
    align-self: stretch;
    flex-direction: row;
    justify-content: space-between;
    gap: 0.5rem;
    width: 100%;
  }
  
  .availability-button,
  .assignments-button {
    margin-left: 0;
    justify-content: center;
    flex: 1;
    --padding-start: 0.5rem;
    --padding-end: 0.5rem;
    font-size: 0.8rem;
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