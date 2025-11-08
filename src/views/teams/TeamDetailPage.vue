<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/teams"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ team?.name || 'Équipe' }}</ion-title>
        <ion-buttons slot="end" v-if="team && canEdit">
          <ion-button fill="clear" @click="() => team && router.push(`/team-form/${team.id}`)">
            <ion-icon :icon="createOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div v-if="loading" class="loading-container">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
        <p>Chargement de l'équipe...</p>
      </div>

      <div v-else-if="!team" class="error-container">
        <ion-icon :icon="alertCircleOutline" color="danger"></ion-icon>
        <h2>Équipe introuvable</h2>
        <p>Cette équipe n'existe pas ou a été supprimée.</p>
        <ion-button fill="solid" @click="() => router.push('/teams')">
          Retour aux équipes
        </ion-button>
      </div>

      <div v-else class="content-container">
        <!-- Team Info -->
        <ion-card class="team-info-card">
          <ion-card-content>
            <div class="team-header">
              <div class="team-icon-large">
                <ion-icon :icon="team.icon || peopleOutline"></ion-icon>
              </div>
              <div class="team-meta">
                <h1 class="team-name">{{ team.name }}</h1>
                <p class="team-description">{{ team.description }}</p>
                <div class="team-stats">
                  <div class="stat-item">
                    <ion-icon :icon="peopleOutline" class="stat-icon"></ion-icon>
                    <span>{{ team.members.length }} membre{{ team.members.length > 1 ? 's' : '' }}</span>
                  </div>
                  <div class="stat-item">
                    <ion-icon :icon="calendarOutline" class="stat-icon"></ion-icon>
                    <span>Créé le {{ formatDate(team.createdAt) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <ion-button
            fill="clear"
            size="small"
            @click="() => team && router.push(`/team-scheduling/${team.id}`)"
          >
            <ion-icon :icon="calendarOutline" slot="start"></ion-icon>
            Planning
          </ion-button>
          <ion-button
            fill="clear"
            size="small"
            @click="() => team && router.push(`/team-availability/${team.id}`)"
          >
            <ion-icon :icon="calendarOutline" slot="start"></ion-icon>
            Disponibilités
          </ion-button>
          <ion-button
            fill="clear"
            size="small"
            @click="() => team && router.push(`/team-assignments/${team.id}`)"
          >
            <ion-icon :icon="checkmarkDoneOutline" slot="start"></ion-icon>
            Assignations
          </ion-button>
        </div>

        <!-- Pending Members Section -->
        <ion-card v-if="pendingMembers.length > 0 && canManageMembers" class="pending-members-card">
          <ion-card-header>
            <ion-card-title class="section-title">
              <ion-icon :icon="timeOutline" class="section-icon"></ion-icon>
              Demandes en attente ({{ pendingMembers.length }})
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="members-list">
              <div
                v-for="teamMember in pendingMembers"
                :key="teamMember.id"
                class="member-item pending"
              >
                <div class="member-info">
                  <ion-avatar class="member-avatar">
                    <img v-if="getMemberData(teamMember.memberId)?.avatar"
                         :src="getMemberData(teamMember.memberId)?.avatar"
                         :alt="getMemberData(teamMember.memberId)?.fullName" />
                    <div v-else class="avatar-initials">
                      {{ getMemberInitials(teamMember.memberId) }}
                    </div>
                  </ion-avatar>
                  <div class="member-details">
                    <h4 class="member-name">{{ getMemberData(teamMember.memberId)?.fullName || 'Membre inconnu' }}</h4>
                    <p class="member-status">En attente d'approbation</p>
                    <p class="member-joined">Demandé le {{ formatDate(teamMember.joinedAt) }}</p>
                  </div>
                </div>
                <div class="member-actions">
                  <ion-button
                    fill="solid"
                    color="success"
                    size="small"
                    @click="() => showApproveModal(teamMember)"
                  >
                    Approuver
                  </ion-button>
                  <ion-button
                    fill="outline"
                    color="danger"
                    size="small"
                    @click="() => rejectMember(teamMember.memberId)"
                  >
                    Rejeter
                  </ion-button>
                </div>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Members Section -->
        <ion-card class="members-card">
          <ion-card-header>
            <div class="card-header-with-action">
              <ion-card-title class="section-title">
                <ion-icon :icon="peopleOutline" class="section-icon"></ion-icon>
                Membres de l'équipe ({{ approvedMembers.length }})
              </ion-card-title>
              <ion-button
                v-if="canManageMembers"
                fill="clear"
                size="small"
                @click="showAddMemberModal = true"
              >
                <ion-icon :icon="addOutline" slot="icon-only"></ion-icon>
              </ion-button>
            </div>
          </ion-card-header>
          <ion-card-content>
            <div class="members-list">
              <div
                v-for="teamMember in sortedApprovedMembers"
                :key="teamMember.id"
                class="member-item"
              >
                <div class="member-info">
                  <ion-avatar class="member-avatar">
                    <img v-if="getMemberData(teamMember.memberId)?.avatar"
                         :src="getMemberData(teamMember.memberId)?.avatar"
                         :alt="getMemberData(teamMember.memberId)?.fullName" />
                    <div v-else class="avatar-initials">
                      {{ getMemberInitials(teamMember.memberId) }}
                    </div>
                  </ion-avatar>
                  <div class="member-details">
                    <h4 class="member-name">{{ getMemberData(teamMember.memberId)?.fullName || 'Membre inconnu' }}</h4>
                    <p class="member-role">{{ getRoleDisplayName(teamMember.role) }}</p>
                    <p class="member-joined">Rejoint le {{ formatDate(teamMember.joinedAt) }}</p>
                  </div>
                </div>
                <div class="member-actions" v-if="canManageMembers && teamMember.role !== 'owner'">
                  <ion-button
                    fill="clear"
                    size="small"
                    @click="() => showMemberActions(teamMember)"
                  >
                    <ion-icon :icon="ellipsisVerticalOutline"></ion-icon>
                  </ion-button>
                </div>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Actions -->
        <ion-card v-if="canDelete || isOwner" class="actions-card">
          <ion-card-content>
            <div class="actions-list">
              <ion-button 
                v-if="isOwner && hasOtherMembers"
                fill="outline" 
                color="warning"
                expand="block"
                @click="showTransferOwnershipModal = true"
              >
                <ion-icon :icon="swapHorizontalOutline" slot="start"></ion-icon>
                Transférer la propriété
              </ion-button>
              
              <ion-button 
                v-if="canDelete"
                fill="outline" 
                color="danger"
                expand="block"
                @click="confirmDelete"
              >
                <ion-icon :icon="trashOutline" slot="start"></ion-icon>
                Supprimer l'équipe
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Add Member Modal -->
      <ion-modal :is-open="showAddMemberModal" @did-dismiss="closeAddMemberModal">
        <ion-header>
          <ion-toolbar>
            <ion-title>Ajouter un membre à l'équipe</ion-title>
            <ion-buttons slot="end">
              <ion-button fill="clear" @click="closeAddMemberModal">
                <ion-icon :icon="closeOutline"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <div class="modal-content">
            <p class="modal-description">
              Sélectionnez une ou plusieurs personnes à ajouter à cette équipe et choisissez leur rôle.
            </p>

            <div class="form-section">
              <ion-label class="form-label">
                <strong>Personnes</strong>
                <span v-if="selectedMemberIds.length > 0" class="selection-count">
                  ({{ selectedMemberIds.length }} sélectionné{{ selectedMemberIds.length > 1 ? 's' : '' }})
                </span>
              </ion-label>
              <ion-item lines="none" class="form-item">
                <ion-select
                  v-model="selectedMemberIds"
                  placeholder="Choisir une ou plusieurs personnes..."
                  interface="alert"
                  :multiple="true"
                  :interface-options="{
                    header: 'Sélectionner des personnes',
                    subHeader: 'Vous pouvez en choisir plusieurs'
                  }"
                >
                  <ion-select-option
                    v-for="member in availableMembers"
                    :key="member.id"
                    :value="member.id"
                  >
                    {{ member.fullName }}
                  </ion-select-option>
                </ion-select>
              </ion-item>
            </div>

            <div class="form-section">
              <ion-label class="form-label">
                <strong>Rôle dans l'équipe</strong>
              </ion-label>
              <ion-item lines="none" class="form-item">
                <ion-select
                  v-model="selectedRole"
                  placeholder="Choisir un rôle..."
                  interface="action-sheet"
                  :interface-options="{header: 'Quel sera son rôle ?'}"
                >
                  <ion-select-option value="member">
                    Membre - Participe aux services
                  </ion-select-option>
                  <ion-select-option value="leader">
                    Leader - Peut gérer l'équipe
                  </ion-select-option>
                  <ion-select-option value="guest">
                    Invité - Accès limité
                  </ion-select-option>
                </ion-select>
              </ion-item>
              <p class="form-help-text" v-if="selectedRole === 'member'">
                Un <strong>membre</strong> peut participer aux services et gérer ses disponibilités.
              </p>
              <p class="form-help-text" v-if="selectedRole === 'leader'">
                Un <strong>leader</strong> peut gérer les membres et approuver les demandes d'adhésion.
              </p>
              <p class="form-help-text" v-if="selectedRole === 'guest'">
                Un <strong>invité</strong> a un accès limité en lecture seule.
              </p>
            </div>

            <div class="modal-buttons">
              <ion-button
                expand="block"
                @click="addMembers"
                :disabled="selectedMemberIds.length === 0 || !selectedRole"
                color="primary"
                size="large"
              >
                <ion-icon :icon="addOutline" slot="start"></ion-icon>
                {{ selectedMemberIds.length > 1 ? `Ajouter ${selectedMemberIds.length} personnes` : 'Ajouter à l\'équipe' }}
              </ion-button>
              <ion-button
                expand="block"
                fill="clear"
                @click="closeAddMemberModal"
              >
                Annuler
              </ion-button>
            </div>
          </div>
        </ion-content>
      </ion-modal>

      <!-- Transfer Ownership Modal -->
      <ion-modal :is-open="showTransferOwnershipModal" @did-dismiss="showTransferOwnershipModal = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Transférer la propriété</ion-title>
            <ion-buttons slot="end">
              <ion-button fill="clear" @click="showTransferOwnershipModal = false">
                <ion-icon :icon="closeOutline"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <div class="modal-content">
            <div class="transfer-warning">
              <ion-icon :icon="alertCircleOutline" color="warning"></ion-icon>
              <p><strong>Attention :</strong> Vous allez transférer la propriété de cette équipe. Vous deviendrez leader et ne pourrez plus reprendre la propriété.</p>
            </div>
            
            <ion-item>
              <ion-select 
                v-model="selectedNewOwnerId" 
                placeholder="Sélectionner le nouveau propriétaire"
                interface="popover"
              >
                <ion-select-option 
                  v-for="member in eligibleNewOwners" 
                  :key="member.id" 
                  :value="member.id"
                >
                  {{ member.fullName }} ({{ getRoleDisplayName(team?.members.find(m => m.memberId === member.id)?.role || 'member') }})
                </ion-select-option>
              </ion-select>
              <ion-label>Nouveau propriétaire</ion-label>
            </ion-item>
            
            <div class="modal-buttons">
              <ion-button 
                expand="block" 
                color="warning"
                @click="transferOwnership"
                :disabled="!selectedNewOwnerId"
              >
                Transférer la propriété
              </ion-button>
            </div>
          </div>
        </ion-content>
      </ion-modal>

      <!-- Change Role Modal -->
      <ion-modal :is-open="showChangeRoleModal" @did-dismiss="showChangeRoleModal = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Changer le rôle</ion-title>
            <ion-buttons slot="end">
              <ion-button fill="clear" @click="showChangeRoleModal = false">
                <ion-icon :icon="closeOutline"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <div class="modal-content">
            <div class="member-info-header" v-if="memberToChangeRole">
              <ion-avatar class="member-avatar">
                <img v-if="getMemberData(memberToChangeRole.memberId)?.avatar" 
                     :src="getMemberData(memberToChangeRole.memberId)?.avatar" 
                     :alt="getMemberData(memberToChangeRole.memberId)?.fullName" />
                <div v-else class="avatar-initials">
                  {{ getMemberInitials(memberToChangeRole.memberId) }}
                </div>
              </ion-avatar>
              <div>
                <h3>{{ getMemberData(memberToChangeRole.memberId)?.fullName || 'Membre' }}</h3>
                <p class="current-role">Rôle actuel: {{ getRoleDisplayName(memberToChangeRole.role) }}</p>
              </div>
            </div>
            
            <ion-item>
              <ion-select 
                v-model="newRole" 
                placeholder="Sélectionner un nouveau rôle"
                interface="popover"
              >
                <ion-select-option value="member">{{ getRoleDisplayName('member') }}</ion-select-option>
                <ion-select-option value="leader">{{ getRoleDisplayName('leader') }}</ion-select-option>
                <ion-select-option value="guest">{{ getRoleDisplayName('guest') }}</ion-select-option>
              </ion-select>
              <ion-label>Nouveau rôle</ion-label>
            </ion-item>
            
            <div class="modal-buttons">
              <ion-button 
                expand="block" 
                @click="changeRole"
                :disabled="!newRole || (memberToChangeRole && newRole === memberToChangeRole.role) || false"
              >
                Changer le rôle
              </ion-button>
            </div>
          </div>
        </ion-content>
      </ion-modal>

      <!-- Approve Member Modal -->
      <ion-modal :is-open="showApproveMemberModal" @did-dismiss="showApproveMemberModal = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Approuver le membre</ion-title>
            <ion-buttons slot="end">
              <ion-button fill="clear" @click="showApproveMemberModal = false">
                <ion-icon :icon="closeOutline"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <div class="modal-content">
            <div class="member-info-header" v-if="memberToApprove">
              <ion-avatar class="member-avatar">
                <img v-if="getMemberData(memberToApprove.memberId)?.avatar"
                     :src="getMemberData(memberToApprove.memberId)?.avatar"
                     :alt="getMemberData(memberToApprove.memberId)?.fullName" />
                <div v-else class="avatar-initials">
                  {{ getMemberInitials(memberToApprove.memberId) }}
                </div>
              </ion-avatar>
              <div>
                <h3>{{ getMemberData(memberToApprove.memberId)?.fullName || 'Membre' }}</h3>
                <p class="current-role">Sélectionnez un rôle pour ce membre</p>
              </div>
            </div>

            <ion-item>
              <ion-select
                v-model="approveRole"
                placeholder="Sélectionner un rôle"
                interface="popover"
              >
                <ion-select-option value="member">{{ getRoleDisplayName('member') }}</ion-select-option>
                <ion-select-option value="leader">{{ getRoleDisplayName('leader') }}</ion-select-option>
                <ion-select-option value="guest">{{ getRoleDisplayName('guest') }}</ion-select-option>
              </ion-select>
              <ion-label>Rôle</ion-label>
            </ion-item>

            <div class="modal-buttons">
              <ion-button
                expand="block"
                color="success"
                @click="approveMember"
                :disabled="!approveRole"
              >
                Approuver
              </ion-button>
            </div>
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, 
  IonBackButton, IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
  IonSpinner, IonAvatar, IonModal, IonItem, IonLabel, IonSelect, IonSelectOption,
  alertController, toastController
} from '@ionic/vue';
import {
  peopleOutline, createOutline, alertCircleOutline, calendarOutline,
  ellipsisVerticalOutline, trashOutline, closeOutline, addOutline,
  swapHorizontalOutline, checkmarkDoneOutline, timeOutline
} from 'ionicons/icons';
import { teamsService } from '@/firebase/teams';
import { membersService } from '@/firebase/members';
import { useUser } from '@/composables/useUser';
import type { Team, TeamMember } from '@/types/team';
import type { Member } from '@/types/member';
import { timezoneUtils } from '@/utils/timezone';

const router = useRouter();
const route = useRoute();
const { member: currentUser } = useUser();

const team = ref<Team | null>(null);
const members = ref<Member[]>([]);
const loading = ref(true);
const showAddMemberModal = ref(false);
const showTransferOwnershipModal = ref(false);
const showChangeRoleModal = ref(false);
const showApproveMemberModal = ref(false);
const selectedMemberIds = ref<string[]>([]);
const selectedRole = ref<'member' | 'leader' | 'guest'>('member');
const selectedNewOwnerId = ref('');
const memberToChangeRole = ref<TeamMember | null>(null);
const memberToApprove = ref<TeamMember | null>(null);
const newRole = ref<'leader' | 'member' | 'guest'>('member');
const approveRole = ref<'leader' | 'member' | 'guest'>('member');

const teamId = route.params.id as string;

const canEdit = computed(() => {
  if (!team.value || !currentUser.value) return false;
  return currentUser.value.isAdmin;
});

const canManageMembers = computed(() => {
  if (!team.value || !currentUser.value) return false;
  const userInTeam = team.value.members.find(m => m.memberId === currentUser.value?.id);
  return team.value.ownerId === currentUser.value.id || 
         currentUser.value.isAdmin || 
         userInTeam?.role === 'leader';
});

const canDelete = computed(() => {
  if (!team.value || !currentUser.value) return false;
  const nonOwnerMembers = team.value.members.filter(m => m.role !== 'owner');
  return currentUser.value.isAdmin && nonOwnerMembers.length === 0;
});

const availableMembers = computed(() => {
  if (!team.value) return [];
  const teamMemberIds = new Set(team.value.members.map(m => m.memberId));
  return members.value
    .filter(m => !teamMemberIds.has(m.id))
    .sort((a, b) => a.fullName.localeCompare(b.fullName, 'fr', { sensitivity: 'base' }));
});

const isOwner = computed(() => {
  if (!team.value || !currentUser.value) return false;
  return team.value.ownerId === currentUser.value.id;
});

const hasOtherMembers = computed(() => {
  if (!team.value) return false;
  return team.value.members.filter(m => m.role !== 'owner').length > 0;
});

const eligibleNewOwners = computed(() => {
  if (!team.value) return [];
  const memberMap = membersMap.value;

  return team.value.members
    .filter(m => m.role !== 'owner')
    .map(m => memberMap.get(m.memberId))
    .filter((m): m is Member => m !== undefined)
    .sort((a, b) => a.fullName.localeCompare(b.fullName, 'fr', { sensitivity: 'base' }));
});

// Split members by status
const pendingMembers = computed(() => {
  if (!team.value) return [];
  return team.value.members.filter(m => m.status === 'pending');
});

const approvedMembers = computed(() => {
  if (!team.value) return [];
  // Treat members without status as approved for backward compatibility
  return team.value.members.filter(m => m.status === 'approved' || !m.status);
});

const sortedApprovedMembers = computed(() => {
  const memberMap = membersMap.value;

  return [...approvedMembers.value].sort((a, b) => {
    const memberA = memberMap.get(a.memberId);
    const memberB = memberMap.get(b.memberId);

    // Always put owner first
    if (a.role === 'owner') return -1;
    if (b.role === 'owner') return 1;

    // Then sort alphabetically by name with optimized locale
    const nameA = memberA?.fullName || '';
    const nameB = memberB?.fullName || '';
    return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
  });
});

// Memoize member lookups for better performance
const membersMap = computed(() => {
  return new Map(members.value.map(member => [member.id, member]));
});

const getMemberData = (memberId: string) => {
  return membersMap.value.get(memberId);
};

const getMemberInitials = (memberId: string) => {
  const member = getMemberData(memberId);
  if (!member) return '?';
  const names = member.fullName.split(' ').filter(n => n.length > 0);
  if (names.length === 0) return '?';
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
};

const getRoleDisplayName = (role: string) => {
  const roleMap = {
    owner: 'Propriétaire',
    leader: 'Leader',
    member: 'Membre',
    guest: 'Invité'
  };
  return roleMap[role as keyof typeof roleMap] || role;
};

const formatDate = (dateString: string) => {
  return timezoneUtils.formatDateForDisplay(dateString);
};

const loadTeam = async () => {
  try {
    loading.value = true;
    const [teamData, membersData] = await Promise.all([
      teamsService.getTeamById(teamId),
      membersService.getAllMembers()
    ]);
    team.value = teamData;
    // Sort members alphabetically by fullName with optimized locale
    members.value = membersData.sort((a, b) => a.fullName.localeCompare(b.fullName, 'fr', { sensitivity: 'base' }));
  } catch (error) {
    console.error('Error loading team:', error);
    // Show user-friendly error
    const toast = await toastController.create({
      message: 'Erreur lors du chargement de l\'équipe',
      duration: 3000,
      color: 'danger'
    });
    await toast.present();
  } finally {
    loading.value = false;
  }
};

const closeAddMemberModal = () => {
  showAddMemberModal.value = false;
  selectedMemberIds.value = [];
  selectedRole.value = 'member';
};

const addMembers = async () => {
  if (selectedMemberIds.value.length === 0 || !selectedRole.value) return;

  try {
    // Add all selected members with the same role
    const addPromises = selectedMemberIds.value.map(async (memberId) => {
      await teamsService.addMemberToTeam(teamId, memberId, selectedRole.value);

      // Update member's teams array
      const memberToUpdate = await membersService.getMemberById(memberId);
      if (memberToUpdate) {
        const currentTeams = memberToUpdate.teams || [];
        if (!currentTeams.includes(teamId)) {
          await membersService.updateMember(memberId, {
            teams: [...currentTeams, teamId]
          });
        }
      }
    });

    await Promise.all(addPromises);
    await loadTeam();

    closeAddMemberModal();

    const count = addPromises.length;
    const toast = await toastController.create({
      message: count > 1 ? `${count} membres ajoutés avec succès` : 'Membre ajouté avec succès',
      duration: 3000,
      color: 'success'
    });
    toast.present();
  } catch (error) {
    console.error('Error adding members:', error);
    const toast = await toastController.create({
      message: 'Erreur lors de l\'ajout des membres',
      duration: 3000,
      color: 'danger'
    });
    toast.present();
  }
};

const showMemberActions = async (teamMember: TeamMember) => {
  const alert = await alertController.create({
    header: 'Actions du membre',
    subHeader: getMemberData(teamMember.memberId)?.fullName,
    buttons: [
      {
        text: 'Changer le rôle',
        handler: () => openChangeRoleModal(teamMember)
      },
      {
        text: 'Retirer de l\'équipe',
        role: 'destructive',
        handler: () => removeMember(teamMember.memberId)
      },
      {
        text: 'Annuler',
        role: 'cancel'
      }
    ]
  });
  
  await alert.present();
};

const removeMember = async (memberId: string) => {
  try {
    await teamsService.removeMemberFromTeam(teamId, memberId);

    // Update member's teams array to remove this team
    const memberToUpdate = await membersService.getMemberById(memberId);
    if (memberToUpdate && memberToUpdate.teams) {
      const updatedTeams = memberToUpdate.teams.filter(id => id !== teamId);
      await membersService.updateMember(memberId, {
        teams: updatedTeams
      });
    }

    await loadTeam();

    const toast = await toastController.create({
      message: 'Membre retiré de l\'équipe',
      duration: 3000,
      color: 'success'
    });
    toast.present();
  } catch (error) {
    console.error('Error removing member:', error);
    const toast = await toastController.create({
      message: 'Erreur lors du retrait du membre',
      duration: 3000,
      color: 'danger'
    });
    toast.present();
  }
};

const confirmDelete = async () => {
  const alert = await alertController.create({
    header: 'Supprimer l\'équipe',
    message: 'Êtes-vous sûr de vouloir supprimer cette équipe ? Cette action est irréversible.',
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel'
      },
      {
        text: 'Supprimer',
        role: 'destructive',
        handler: async () => {
          try {
            await teamsService.deleteTeam(teamId);
            const toast = await toastController.create({
              message: 'Équipe supprimée avec succès',
              duration: 3000,
              color: 'success'
            });
            toast.present();
            router.push('/teams');
          } catch (error: any) {
            console.error('Error deleting team:', error);
            const toast = await toastController.create({
              message: error.message || 'Erreur lors de la suppression',
              duration: 3000,
              color: 'danger'
            });
            toast.present();
          }
        }
      }
    ]
  });
  
  await alert.present();
};

const transferOwnership = async () => {
  if (!selectedNewOwnerId.value) return;
  
  try {
    await teamsService.transferOwnership(teamId, selectedNewOwnerId.value);
    await loadTeam();
    showTransferOwnershipModal.value = false;
    selectedNewOwnerId.value = '';
    
    const toast = await toastController.create({
      message: 'Propriété transférée avec succès',
      duration: 3000,
      color: 'success'
    });
    toast.present();
  } catch (error: any) {
    console.error('Error transferring ownership:', error);
    const toast = await toastController.create({
      message: error.message || 'Erreur lors du transfert',
      duration: 3000,
      color: 'danger'
    });
    toast.present();
  }
};

const openChangeRoleModal = (teamMember: TeamMember) => {
  memberToChangeRole.value = teamMember;
  newRole.value = teamMember.role as 'leader' | 'member' | 'guest';
  showChangeRoleModal.value = true;
};

const changeRole = async () => {
  if (!memberToChangeRole.value || !newRole.value) return;

  try {
    await teamsService.updateMemberRole(teamId, memberToChangeRole.value.memberId, newRole.value);
    await loadTeam();
    showChangeRoleModal.value = false;
    memberToChangeRole.value = null;

    const toast = await toastController.create({
      message: 'Rôle mis à jour avec succès',
      duration: 3000,
      color: 'success'
    });
    toast.present();
  } catch (error: any) {
    console.error('Error changing role:', error);
    const toast = await toastController.create({
      message: error.message || 'Erreur lors du changement de rôle',
      duration: 3000,
      color: 'danger'
    });
    toast.present();
  }
};

const showApproveModal = (teamMember: TeamMember) => {
  memberToApprove.value = teamMember;
  approveRole.value = 'member'; // Default role
  showApproveMemberModal.value = true;
};

const approveMember = async () => {
  if (!memberToApprove.value || !approveRole.value) return;

  try {
    await teamsService.approvePendingMember(teamId, memberToApprove.value.memberId, approveRole.value);

    // Update member's teams array to add this team
    const memberToUpdate = await membersService.getMemberById(memberToApprove.value.memberId);
    if (memberToUpdate) {
      const currentTeams = memberToUpdate.teams || [];
      if (!currentTeams.includes(teamId)) {
        await membersService.updateMember(memberToApprove.value.memberId, {
          teams: [...currentTeams, teamId]
        });
      }
    }

    await loadTeam();
    showApproveMemberModal.value = false;
    memberToApprove.value = null;

    const toast = await toastController.create({
      message: 'Membre approuvé avec succès',
      duration: 3000,
      color: 'success'
    });
    toast.present();
  } catch (error: any) {
    console.error('Error approving member:', error);
    const toast = await toastController.create({
      message: error.message || 'Erreur lors de l\'approbation',
      duration: 3000,
      color: 'danger'
    });
    toast.present();
  }
};

const rejectMember = async (memberId: string) => {
  try {
    await teamsService.rejectPendingMember(teamId, memberId);
    await loadTeam();

    const toast = await toastController.create({
      message: 'Demande rejetée',
      duration: 3000,
      color: 'success'
    });
    toast.present();
  } catch (error: any) {
    console.error('Error rejecting member:', error);
    const toast = await toastController.create({
      message: error.message || 'Erreur lors du rejet',
      duration: 3000,
      color: 'danger'
    });
    toast.present();
  }
};

onMounted(() => {
  loadTeam();
});
</script>

<style scoped>
.content-container {
  padding: 1rem;
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 1rem;
  padding: 2rem;
  text-align: center;
}

.loading-container ion-spinner {
  --color: var(--ion-color-primary);
  width: 3rem;
  height: 3rem;
}

.error-container ion-icon {
  font-size: 4rem;
}

.error-container h2 {
  margin: 0 0 0.5rem 0;
  color: #111827;
}

.team-info-card {
  margin-bottom: 1.5rem;
}

.team-header {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.team-icon-large {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: #F3F4F6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.team-icon-large ion-icon {
  font-size: 2.5rem;
  color: var(--ion-color-primary);
}

.team-meta {
  flex: 1;
}

.team-name {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.team-description {
  font-size: 1rem;
  color: #6B7280;
  line-height: 1.5;
  margin: 0 0 1rem 0;
}

.team-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6B7280;
}

.stat-icon {
  font-size: 1rem;
  color: var(--ion-color-primary);
}

.members-card, .actions-card {
  margin-bottom: 1.5rem;
}

.quick-actions {
  display: flex;
  gap: 0.5rem;
  padding: 0 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.quick-actions ion-button {
  flex: 1;
  min-width: 120px;
  max-width: 200px;
}

.card-header-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #111827;
}

.section-icon {
  color: var(--ion-color-primary);
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #F9FAFB;
  border-radius: 12px;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.member-avatar {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.avatar-initials {
  width: 100%;
  height: 100%;
  background: var(--ion-color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
  border-radius: 50%;
}

.member-details h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.member-role {
  font-size: 0.875rem;
  color: var(--ion-color-primary);
  font-weight: 500;
  margin: 0 0 0.25rem 0;
}

.member-joined {
  font-size: 0.75rem;
  color: #6B7280;
  margin: 0;
}

.member-status {
  font-size: 0.875rem;
  color: #F59E0B;
  font-weight: 500;
  margin: 0 0 0.25rem 0;
}

.pending-members-card {
  margin-bottom: 1.5rem;
  border-left: 4px solid #F59E0B;
}

.member-item.pending {
  background: #FEF3C7;
  border: 1px solid #FCD34D;
}

.member-item.pending .member-actions {
  display: flex;
  gap: 0.5rem;
}

.modal-content {
  padding: 1rem;
}

.modal-description {
  font-size: 0.9375rem;
  color: var(--ion-color-step-600);
  line-height: 1.5;
  margin: 0 0 1.5rem 0;
}

.form-section {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  color: var(--ion-color-step-850);
  margin-bottom: 0.5rem;
}

.selection-count {
  color: var(--ion-color-primary);
  font-weight: 600;
  margin-left: 0.5rem;
}

.form-item {
  --background: var(--ion-color-light);
  --border-radius: 8px;
  --padding-start: 1rem;
  --padding-end: 1rem;
  margin-bottom: 0.5rem;
}

.form-help-text {
  font-size: 0.8125rem;
  color: var(--ion-color-step-600);
  line-height: 1.4;
  margin: 0.5rem 0 0 0;
  padding-left: 0.25rem;
}

.modal-buttons {
  padding: 1.5rem 0 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.actions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.transfer-warning {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: #FEF3C7;
  border: 1px solid #F59E0B;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.transfer-warning ion-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.transfer-warning p {
  margin: 0;
  color: #92400E;
  line-height: 1.5;
}

.member-info-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #F9FAFB;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.member-info-header .member-avatar {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.member-info-header .member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.member-info-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.member-info-header .current-role {
  font-size: 0.875rem;
  color: #6B7280;
  margin: 0;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .team-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .team-stats {
    justify-content: center;
  }

  .quick-actions {
    padding: 0 0.75rem;
  }

  .quick-actions ion-button {
    min-width: 100px;
    font-size: 0.875rem;
  }

  .member-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .member-actions {
    align-self: flex-end;
  }
}

@media (max-width: 480px) {
  .content-container {
    padding: 0.75rem;
  }
  
  .team-name {
    font-size: 1.5rem;
  }
  
  .team-icon-large {
    width: 64px;
    height: 64px;
  }
  
  .team-icon-large ion-icon {
    font-size: 2rem;
  }
}
</style>