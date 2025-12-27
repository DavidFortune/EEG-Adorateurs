<template>
  <div class="participant-selector">
    <!-- Display selected participant -->
    <div v-if="modelValue" class="selected-participant">
      <ion-avatar class="participant-avatar">
        <img v-if="participantAvatar" :src="participantAvatar" :alt="modelValue.name" />
        <span v-else class="initials">{{ getInitials(modelValue.name) }}</span>
      </ion-avatar>
      <div class="participant-details">
        <span class="participant-name">{{ modelValue.name }}</span>
        <span v-if="modelValue.role" class="participant-role">{{ modelValue.role }}</span>
      </div>
      <ion-button fill="clear" size="small" color="danger" @click="removeParticipant">
        <ion-icon :icon="closeOutline" slot="icon-only" />
      </ion-button>
    </div>

    <!-- Button to open modal -->
    <ion-button v-else @click="openModal" fill="outline" size="small" class="add-participant-btn">
      <ion-icon :icon="personAddOutline" slot="start" />
      Ajouter un participant
    </ion-button>

    <!-- Selection Modal -->
    <ion-modal :is-open="isOpen" @will-dismiss="closeModal">
      <ion-header>
        <ion-toolbar>
          <ion-title>Sélectionner un participant</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeModal" fill="clear">
              <ion-icon :icon="closeOutline" />
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
        <ion-toolbar>
          <ion-segment :value="activeTab" @ion-change="handleTabChange">
            <ion-segment-button value="members">
              <ion-label>Membres</ion-label>
            </ion-segment-button>
            <ion-segment-button value="custom">
              <ion-label>Autre</ion-label>
            </ion-segment-button>
          </ion-segment>
        </ion-toolbar>
      </ion-header>

      <ion-content>
        <!-- Members Tab -->
        <div v-if="activeTab === 'members'" class="tab-content">
          <ion-searchbar
            v-model="searchQuery"
            placeholder="Rechercher un membre..."
            :debounce="300"
          />

          <ion-loading :is-open="loading" message="Chargement..." />

          <ion-list v-if="!loading && filteredMembers.length > 0" class="member-list">
            <ion-item
              v-for="member in filteredMembers"
              :key="member.id"
              button
              @click="selectMember(member)"
              :class="{ 'selected-item': isSelected(member.id) }"
            >
              <ion-avatar slot="start" class="member-avatar">
                <img v-if="member.avatar" :src="member.avatar" :alt="member.fullName" />
                <span v-else class="initials">{{ getInitials(member.fullName) }}</span>
              </ion-avatar>
              <ion-label>
                <h3>{{ member.fullName }}</h3>
                <p v-if="member.email">{{ member.email }}</p>
              </ion-label>
              <ion-icon
                v-if="isSelected(member.id)"
                :icon="checkmarkCircle"
                color="primary"
                slot="end"
              />
            </ion-item>
          </ion-list>

          <div v-if="!loading && filteredMembers.length === 0" class="empty-state">
            <ion-icon :icon="peopleOutline" />
            <p v-if="searchQuery">Aucun membre trouvé pour "{{ searchQuery }}"</p>
            <p v-else>Aucun membre disponible</p>
          </div>
        </div>

        <!-- Custom Tab -->
        <div v-if="activeTab === 'custom'" class="tab-content custom-tab">
          <ion-item>
            <ion-label position="stacked">Nom *</ion-label>
            <ion-input
              v-model="customName"
              placeholder="Ex: Pasteur Jean"
              @keyup.enter="confirmCustom"
            />
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Rôle (optionnel)</ion-label>
            <ion-input
              v-model="customRole"
              placeholder="Ex: Invité spécial"
              @keyup.enter="confirmCustom"
            />
          </ion-item>

          <ion-button
            expand="block"
            @click="confirmCustom"
            :disabled="!customName.trim()"
            class="confirm-btn"
          >
            <ion-icon :icon="checkmarkOutline" slot="start" />
            Confirmer
          </ion-button>
        </div>
      </ion-content>
    </ion-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonSegment, IonSegmentButton, IonLabel, IonSearchbar,
  IonList, IonItem, IonAvatar, IonIcon, IonInput, IonLoading
} from '@ionic/vue';
import {
  closeOutline, personAddOutline, checkmarkCircle, peopleOutline, checkmarkOutline
} from 'ionicons/icons';
import { membersService } from '@/firebase/members';
import { invitationService } from '@/services/invitationService';
import type { Member } from '@/types/member';
import type { ProgramParticipant } from '@/types/program';

interface Props {
  modelValue: ProgramParticipant | null;
  serviceId: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: ProgramParticipant | null];
  'guest-added': [memberId: string];
}>();

// Modal state
const isOpen = ref(false);
const activeTab = ref<'members' | 'custom'>('members');
const loading = ref(false);

// Members state
const members = ref<Member[]>([]);
const searchQuery = ref('');

// Custom participant state
const customName = ref('');
const customRole = ref('');

// Computed: participant avatar (for existing members)
const participantAvatar = computed(() => {
  if (!props.modelValue || props.modelValue.isCustom) return null;
  const member = members.value.find(m => m.id === props.modelValue?.id);
  return member?.avatar || null;
});

// Computed: filtered members based on search
const filteredMembers = computed(() => {
  if (!searchQuery.value.trim()) return members.value;
  const q = searchQuery.value.toLowerCase().trim();
  return members.value.filter(m =>
    m.fullName.toLowerCase().includes(q) ||
    m.firstName.toLowerCase().includes(q) ||
    m.lastName.toLowerCase().includes(q) ||
    (m.email && m.email.toLowerCase().includes(q))
  );
});

// Load members
const loadMembers = async () => {
  if (members.value.length > 0) return; // Already loaded
  loading.value = true;
  try {
    members.value = await membersService.getAllMembers();
  } catch (error) {
    console.error('Error loading members:', error);
  } finally {
    loading.value = false;
  }
};

// Get initials from name
const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Check if member is selected
const isSelected = (memberId: string): boolean => {
  return props.modelValue?.id === memberId && !props.modelValue?.isCustom;
};

// Open modal
const openModal = () => {
  isOpen.value = true;
  loadMembers();
};

// Close modal
const closeModal = () => {
  isOpen.value = false;
  searchQuery.value = '';
  customName.value = '';
  customRole.value = '';
};

// Handle tab change
const handleTabChange = (event: CustomEvent) => {
  activeTab.value = event.detail.value as 'members' | 'custom';
};

// Select member from list
const selectMember = async (member: Member) => {
  // Add as guest if needed (service context)
  if (props.serviceId) {
    try {
      const added = await invitationService.addMemberAsGuest(props.serviceId, member.id);
      if (added) {
        emit('guest-added', member.id);
      }
    } catch (error) {
      console.error('Error adding member as guest:', error);
    }
  }

  // Create participant object with avatar
  const participant: ProgramParticipant = {
    id: member.id,
    name: member.fullName,
    avatar: member.avatar || undefined,
    isCustom: false
  };

  emit('update:modelValue', participant);
  closeModal();
};

// Confirm custom participant
const confirmCustom = () => {
  if (!customName.value.trim()) return;

  const participant: ProgramParticipant = {
    id: `custom_${Date.now()}`,
    name: customName.value.trim(),
    role: customRole.value.trim() || undefined,
    isCustom: true
  };

  emit('update:modelValue', participant);
  closeModal();
};

// Remove participant
const removeParticipant = () => {
  emit('update:modelValue', null);
};

// Preload members when component mounts
onMounted(() => {
  loadMembers();
});

// Reset custom fields when switching tabs
watch(activeTab, (newTab) => {
  if (newTab === 'members') {
    customName.value = '';
    customRole.value = '';
  } else {
    searchQuery.value = '';
  }
});
</script>

<style scoped>
.participant-selector {
  width: 100%;
  padding: 8px 0;
}

.selected-participant {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--ion-color-light);
  border-radius: 8px;
}

.participant-avatar {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

.participant-avatar .initials {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--ion-color-primary);
  color: white;
  font-size: 14px;
  font-weight: 600;
  border-radius: 50%;
}

.participant-details {
  flex: 1;
  min-width: 0;
}

.participant-name {
  display: block;
  font-weight: 500;
  color: var(--ion-text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.participant-role {
  display: block;
  font-size: 0.85rem;
  color: var(--ion-color-medium);
}

.add-participant-btn {
  --padding-start: 12px;
  --padding-end: 12px;
}

/* Modal content */
.tab-content {
  padding: 0;
}

.member-list {
  padding: 0;
}

.member-list ion-item {
  --padding-start: 16px;
  --inner-padding-end: 16px;
}

.member-avatar {
  width: 40px;
  height: 40px;
}

.member-avatar .initials {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--ion-color-primary);
  color: white;
  font-size: 14px;
  font-weight: 600;
  border-radius: 50%;
}

.selected-item {
  --background: var(--ion-color-primary-tint);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: var(--ion-color-medium);
  text-align: center;
}

.empty-state ion-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state p {
  margin: 0;
  font-size: 0.95rem;
}

/* Custom tab */
.custom-tab {
  padding: 16px;
}

.custom-tab ion-item {
  --background: transparent;
  --padding-start: 0;
  margin-bottom: 16px;
}

.confirm-btn {
  margin-top: 24px;
}
</style>
