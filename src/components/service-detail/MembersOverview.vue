<template>
  <div class="members-overview">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <ion-spinner name="crescent" />
      <span>Chargement des membres...</span>
    </div>

    <!-- Empty State -->
    <div v-else-if="teamAssignments.length === 0 && guestMembers.length === 0" class="empty-state">
      <ion-icon :icon="peopleOutline" size="large" color="medium" />
      <h3>Aucun membre assigné</h3>
      <p>Aucun membre n'a encore été assigné à ce service.</p>
    </div>

    <!-- Members List -->
    <div v-else class="members-list">
      <!-- Teams -->
      <div v-for="team in teamAssignments" :key="team.teamId" class="team-section">
        <div class="team-header">
          <ion-icon :icon="peopleOutline" class="team-icon" />
          <span class="team-name">{{ team.teamName }}</span>
          <ion-chip :color="getTeamStatusColor(team)" size="small">
            {{ team.members.length }}/{{ team.requiredMembers || '?' }}
          </ion-chip>
        </div>

        <div class="members-grid">
          <div
            v-for="member in team.members"
            :key="member.memberId"
            class="member-item"
          >
            <ion-avatar class="member-avatar">
              <img v-if="member.avatar" :src="member.avatar" :alt="member.memberName" />
              <div v-else class="avatar-initials">{{ getInitials(member.memberName) }}</div>
            </ion-avatar>
            <span class="member-name">{{ member.memberName }}</span>
            <span v-if="member.position" class="member-position">{{ member.position }}</span>
          </div>
        </div>
      </div>

      <!-- Guests -->
      <div v-if="guestMembers.length > 0" class="team-section guests-section">
        <div class="team-header">
          <ion-icon :icon="personAddOutline" class="team-icon guest-icon" />
          <span class="team-name">Invités</span>
          <ion-chip color="tertiary" size="small">
            {{ guestMembers.length }}
          </ion-chip>
        </div>

        <div class="members-grid">
          <div
            v-for="guest in guestMembers"
            :key="guest.id"
            class="member-item"
          >
            <ion-avatar class="member-avatar">
              <img v-if="guest.avatar" :src="guest.avatar" :alt="guest.fullName" />
              <div v-else class="avatar-initials guest-initials">{{ getInitials(guest.fullName) }}</div>
            </ion-avatar>
            <span class="member-name">{{ guest.fullName }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonSpinner, IonIcon, IonChip, IonAvatar } from '@ionic/vue';
import { peopleOutline, personAddOutline } from 'ionicons/icons';
import type { Member } from '@/types/member';
import type { ServiceAssignment } from '@/types/assignment';

interface TeamAssignmentGroup {
  teamId: string;
  teamName: string;
  members: Array<ServiceAssignment & { avatar?: string; position?: string }>;
  requiredMembers?: number;
}

interface Props {
  teamAssignments: TeamAssignmentGroup[];
  guestMembers: Member[];
  loading: boolean;
}

defineProps<Props>();

const getInitials = (name: string): string => {
  const names = name.split(' ').filter(n => n.length > 0);
  if (names.length === 0) return '?';
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
};

const getTeamStatusColor = (team: TeamAssignmentGroup): string => {
  if (!team.requiredMembers) return 'primary';
  if (team.members.length >= team.requiredMembers) return 'success';
  if (team.members.length > 0) return 'warning';
  return 'danger';
};
</script>

<style scoped>
.members-overview {
  padding: 16px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  gap: 12px;
  color: var(--ion-color-medium);
}

.empty-state {
  text-align: center;
  padding: 32px 16px;
}

.empty-state ion-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-state h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--ion-color-dark);
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 0.9rem;
  color: var(--ion-color-medium);
  margin: 0;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.team-section {
  background: var(--ion-color-light);
  border-radius: 12px;
  padding: 12px;
}

.team-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--ion-color-light-shade);
}

.team-icon {
  font-size: 1.25rem;
  color: var(--ion-color-primary);
}

.guest-icon {
  color: var(--ion-color-tertiary);
}

.team-name {
  font-weight: 600;
  font-size: 1rem;
  color: var(--ion-color-dark);
  flex: 1;
}

.team-header ion-chip {
  margin: 0;
  height: 24px;
  font-size: 0.75rem;
}

.members-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.member-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 70px;
}

.member-avatar {
  width: 44px;
  height: 44px;
}

.avatar-initials {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ion-color-primary);
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  border-radius: 50%;
}

.guest-initials {
  background: var(--ion-color-tertiary);
}

.member-name {
  font-size: 0.75rem;
  color: var(--ion-color-dark);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.2;
  max-height: 2.4em;
}

.member-position {
  font-size: 0.65rem;
  color: var(--ion-color-medium);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.guests-section {
  border-left: 3px solid var(--ion-color-tertiary);
}
</style>
