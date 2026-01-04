<template>
  <div 
    class="member-item"
    :class="memberItemClasses"
    @click="handleClick"
  >
    <div class="member-avatar">
      <img 
        v-if="member.avatar" 
        :src="member.avatar" 
        :alt="member.name"
        class="avatar-image"
      />
      <span v-else class="avatar-initials">
        {{ getInitials(member.name) }}
      </span>
    </div>
    
    <div class="member-info">
      <div class="member-name">{{ member.name }}</div>
      <div class="member-position" v-if="displayPosition">
        {{ displayPosition }}
      </div>
      <div class="member-status-text">{{ getStatusText() }}</div>
    </div>
    
    <div class="member-actions">
      <ion-icon 
        :icon="getStatusIcon()" 
        :class="['status-icon', getStatusClass()]"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IonIcon } from '@ionic/vue';
import { 
  checkmarkCircleOutline, 
  closeCircleOutline, 
  alertCircleOutline,
  personOutline,
  helpCircleOutline,
  lockClosedOutline
} from 'ionicons/icons';
import type { MemberAssignment } from '@/types/scheduling';

interface Props {
  member: MemberAssignment;
  isEditing: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  click: [memberId: string];
}>();

const memberItemClasses = computed(() => ({
  'member-item--assigned': props.member.isAssigned,
  'member-item--available': props.member.availability === 'available' && !props.member.isAssigned && !props.member.isAssignedToOtherTeam,
  'member-item--unavailable': props.member.availability === 'unavailable',
  'member-item--maybe': props.member.availability === 'maybe' && !props.member.isAssigned && !props.member.isAssignedToOtherTeam,
  'member-item--no-response': props.member.availability === null && !props.member.isAssignedToOtherTeam,
  'member-item--already-booked': props.member.isAssignedToOtherTeam && !props.member.isAssigned,
  'member-item--clickable': props.isEditing && (props.member.availability === 'available' || props.member.availability === 'maybe' || props.member.availability === null) && !props.member.isAssignedToOtherTeam,
  'member-item--editing': props.isEditing
}));

// Display position: show assigned position if exists, otherwise show default position
const displayPosition = computed(() => {
  // If assigned, show the assigned position (or default if no override)
  if (props.member.isAssigned) {
    return props.member.assignedPositionName || props.member.positionName || null;
  }
  // Otherwise show the default position
  return props.member.positionName || null;
});

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

function getStatusText(): string {
  if (props.member.isAssigned) {
    return props.isEditing ? 'Assigné (cliquer pour retirer)' : 'Assigné';
  }
  
  if (props.member.isAssignedToOtherTeam) {
    return `Déjà assigné à ${props.member.assignedTeamName}`;
  }
  
  switch (props.member.availability) {
    case 'available':
      return props.isEditing ? 'Disponible (cliquer pour assigner)' : 'Disponible';
    case 'maybe':
      return props.isEditing ? 'Peut-être (cliquer pour assigner)' : 'Peut-être';
    case 'unavailable':
      return 'Indisponible';
    case null:
      return props.isEditing ? 'Pas de réponse (cliquer pour assigner)' : 'Pas de réponse';
    default:
      return 'Statut inconnu';
  }
}

function getStatusIcon() {
  if (props.member.isAssigned) {
    return personOutline;
  }
  
  if (props.member.isAssignedToOtherTeam) {
    return lockClosedOutline;
  }
  
  switch (props.member.availability) {
    case 'available':
      return checkmarkCircleOutline;
    case 'maybe':
      return helpCircleOutline;
    case 'unavailable':
      return closeCircleOutline;
    case null:
      return alertCircleOutline;
    default:
      return alertCircleOutline;
  }
}

function getStatusClass(): string {
  if (props.member.isAssigned) {
    return 'status-icon--assigned';
  }
  
  if (props.member.isAssignedToOtherTeam) {
    return 'status-icon--already-booked';
  }
  
  switch (props.member.availability) {
    case 'available':
      return 'status-icon--available';
    case 'maybe':
      return 'status-icon--maybe';
    case 'unavailable':
      return 'status-icon--unavailable';
    case null:
      return 'status-icon--no-response';
    default:
      return 'status-icon--no-response';
  }
}

function handleClick() {
  if (props.isEditing && (props.member.availability === 'available' || props.member.availability === 'maybe' || props.member.availability === null) && !props.member.isAssignedToOtherTeam) {
    emit('click', props.member.id);
  }
}
</script>

<style scoped>
.member-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 12px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
  background: white;
  border: 1px solid var(--ion-color-light-shade);
}

.member-item--assigned {
  background: #e8f5e8;
  border-color: #c8e6c8;
  border-radius: 12px;
}

.member-item--available {
  background: white;
  border-color: var(--ion-color-light-shade);
}

.member-item--unavailable {
  background: var(--ion-color-light);
  border-color: var(--ion-color-medium);
  opacity: 0.6;
}

.member-item--maybe {
  background: var(--ion-color-warning-tint);
  border-color: var(--ion-color-warning);
}

.member-item--no-response {
  background: var(--ion-color-light);
  border-color: var(--ion-color-medium);
  opacity: 0.6;
}

.member-item--already-booked {
  background: #f8f0ff;
  border-color: #d4b5ff;
  opacity: 0.8;
}

.member-item--editing.member-item--no-response {
  border-color: var(--ion-color-medium);
  border-width: 2px;
  cursor: pointer;
}

.member-item--clickable {
  cursor: pointer;
}

.member-item--clickable:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.member-item--editing.member-item--available {
  border-color: var(--ion-color-primary);
  border-width: 2px;
}

.member-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--ion-color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  margin-right: 12px;
  flex-shrink: 0;
  overflow: hidden;
  position: relative;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.avatar-initials {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.member-item--assigned .member-avatar {
  background: var(--ion-color-success);
}

.member-item--unavailable .member-avatar {
  background: var(--ion-color-medium);
}

.member-item--maybe .member-avatar {
  background: var(--ion-color-warning);
}

.member-item--no-response .member-avatar {
  background: var(--ion-color-medium);
}

.member-item--already-booked .member-avatar {
  background: #9333ea;
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name {
  font-weight: 600;
  font-size: 1rem;
  color: var(--ion-color-dark);
  margin-bottom: 2px;
}

.member-position {
  font-size: 0.8125rem;
  color: #059669;
  font-weight: 500;
  margin-bottom: 2px;
}

.member-status-text {
  font-size: 0.875rem;
  color: var(--ion-color-medium);
  line-height: 1.2;
}

.member-item--editing .member-status-text {
  font-weight: 500;
}

.member-actions {
  margin-left: 8px;
}

.status-icon {
  font-size: 1.5rem;
}

.status-icon--assigned {
  color: var(--ion-color-success);
}

.status-icon--available {
  color: var(--ion-color-success);
}

.status-icon--maybe {
  color: var(--ion-color-warning);
}

.status-icon--unavailable {
  color: var(--ion-color-danger);
}

.status-icon--no-response {
  color: var(--ion-color-medium);
}

.status-icon--already-booked {
  color: #9333ea;
}
</style>