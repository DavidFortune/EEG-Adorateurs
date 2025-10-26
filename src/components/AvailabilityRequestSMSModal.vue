<template>
  <ion-modal :is-open="isOpen" @didDismiss="emit('close')">
    <ion-header>
      <ion-toolbar>
        <ion-title>Demande de disponibilités</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="emit('close')">
            <ion-icon :icon="closeOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="modal-content">
        <!-- Recipient Selection -->
        <div class="section">
          <h3>Destinataires</h3>
          <ion-segment v-model="recipientType" @ionChange="handleRecipientTypeChange">
            <ion-segment-button value="all">
              <ion-label>Tous les membres</ion-label>
            </ion-segment-button>
            <ion-segment-button value="team">
              <ion-label>Équipe spécifique</ion-label>
            </ion-segment-button>
            <ion-segment-button value="specific">
              <ion-label>Membres spécifiques</ion-label>
            </ion-segment-button>
          </ion-segment>

          <!-- Team Selection -->
          <div v-if="recipientType === 'team'" class="team-selection">
            <ion-list>
              <ion-item>
                <ion-select
                  v-model="selectedTeamId"
                  placeholder="Sélectionner une équipe"
                  interface="popover"
                >
                  <ion-select-option v-for="team in teams" :key="team.id" :value="team.id">
                    {{ team.name }}
                  </ion-select-option>
                </ion-select>
              </ion-item>
            </ion-list>
          </div>

          <!-- Member Selection (when specific is selected) -->
          <div v-if="recipientType === 'specific'" class="member-selection">
            <!-- Search bar for filtering members -->
            <div v-if="availableMembers.length > 5" class="search-bar">
              <ion-searchbar
                v-model="searchQuery"
                placeholder="Rechercher un membre..."
                :debounce="300"
              ></ion-searchbar>
            </div>

            <!-- Select All/Deselect All buttons -->
            <div v-if="availableMembers.length > 0" class="selection-actions">
              <ion-button
                size="small"
                fill="clear"
                @click="selectAll"
                :disabled="selectedMembers.length === availableMembers.length"
              >
                Sélectionner tout
              </ion-button>
              <ion-button
                size="small"
                fill="clear"
                @click="deselectAll"
                :disabled="selectedMembers.length === 0"
              >
                Désélectionner tout
              </ion-button>
              <span class="selection-counter">
                {{ selectedMembers.length }} / {{ availableMembers.length }}
              </span>
            </div>

            <ion-list>
              <ion-item v-for="member in filteredMembers" :key="member.id">
                <ion-checkbox
                  slot="start"
                  :checked="isSelected(member.id)"
                  @ionChange="toggleMember(member.id)"
                />
                <ion-label>
                  <h3>{{ member.name }}</h3>
                  <p>{{ member.phone }}</p>
                </ion-label>
              </ion-item>
            </ion-list>

            <p v-if="availableMembers.length === 0" class="no-members">
              Aucun membre avec numéro de téléphone trouvé.
            </p>
            <p v-if="availableMembers.length > 0 && filteredMembers.length === 0" class="no-members">
              Aucun membre ne correspond à votre recherche.
            </p>
          </div>

          <!-- Summary -->
          <div class="recipients-summary">
            <ion-icon :icon="peopleOutline" />
            <span v-if="recipientType === 'all'">
              {{ allMembersCount }} membre(s) recevront le SMS
            </span>
            <span v-else-if="recipientType === 'team'">
              {{ teamMembersCount }} membre(s) de l'équipe recevront le SMS
            </span>
            <span v-else>
              {{ selectedMembers.length }} membre(s) sélectionné(s)
            </span>
          </div>
        </div>

        <!-- Custom Message -->
        <div class="message-section">
          <h3>Message personnalisé</h3>
          <ion-textarea
            v-model="customMessage"
            placeholder="Ajouter un message (optionnel)"
            :rows="4"
            :maxlength="200"
            counter
          ></ion-textarea>
        </div>

        <!-- Message Preview -->
        <div class="preview-section">
          <h3>Aperçu du SMS</h3>
          <div class="preview-box">
            {{ previewMessage }}
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <ion-button expand="block" @click="sendSMS" :disabled="!canSend || isSending">
            <ion-icon slot="start" :icon="sendOutline" />
            {{ isSending ? 'Envoi en cours...' : 'Envoyer le SMS' }}
          </ion-button>
        </div>
      </div>
    </ion-content>

    <!-- Success Alert -->
    <ion-alert
      :is-open="showSuccessAlert"
      header="SMS envoyés"
      :message="successMessage"
      :buttons="['OK']"
      @didDismiss="showSuccessAlert = false"
    />

    <!-- Error Alert -->
    <ion-alert
      :is-open="showErrorAlert"
      header="Erreur"
      :message="errorMessage"
      :buttons="['OK']"
      @didDismiss="showErrorAlert = false"
    />
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonSegment, IonSegmentButton, IonLabel, IonList, IonItem,
  IonCheckbox, IonTextarea, IonAlert, IonSearchbar, IonSelect, IonSelectOption
} from '@ionic/vue';
import {
  closeOutline, peopleOutline, sendOutline
} from 'ionicons/icons';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface Member {
  id: string;
  name: string;
  phone: string;
}

interface Team {
  id: string;
  name: string;
}

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits(['close', 'sent']);

const functions = getFunctions();

// State
const recipientType = ref<'all' | 'team' | 'specific'>('all');
const availableMembers = ref<Member[]>([]);
const selectedMembers = ref<string[]>([]);
const teams = ref<Team[]>([]);
const selectedTeamId = ref<string>('');
const customMessage = ref('');
const isSending = ref(false);
const showSuccessAlert = ref(false);
const showErrorAlert = ref(false);
const successMessage = ref('');
const errorMessage = ref('');
const searchQuery = ref('');
const allMembersCount = ref(0);
const teamMembersCount = ref(0);

// Computed
const filteredMembers = computed(() => {
  if (!searchQuery.value.trim()) {
    return availableMembers.value;
  }

  const query = searchQuery.value.toLowerCase().trim();
  return availableMembers.value.filter(member =>
    member.name.toLowerCase().includes(query) ||
    member.phone.includes(query)
  );
});

const canSend = computed(() => {
  if (recipientType.value === 'all') {
    return allMembersCount.value > 0;
  } else if (recipientType.value === 'team') {
    return selectedTeamId.value !== '' && teamMembersCount.value > 0;
  }
  return selectedMembers.value.length > 0;
});

const availabilityUrl = computed(() => {
  return 'https://adorateurs.eglisegalilee.com/tabs/disponibilites';
});

const previewMessage = computed(() => {
  let message = 'Demande de disponibilités';

  if (customMessage.value.trim()) {
    message += `\n\n${customMessage.value.trim()}`;
  }

  message += `\n\n${availabilityUrl.value}`;

  return message;
});

// Watchers
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    await loadData();
  } else {
    // Reset form when closed
    recipientType.value = 'all';
    selectedMembers.value = [];
    selectedTeamId.value = '';
    customMessage.value = '';
    searchQuery.value = '';
  }
});

watch(() => selectedTeamId.value, async (teamId) => {
  if (teamId) {
    await loadTeamMembers(teamId);
  }
});

// Methods
const handleRecipientTypeChange = () => {
  selectedMembers.value = [];
  selectedTeamId.value = '';
};

const isSelected = (memberId: string): boolean => {
  return selectedMembers.value.includes(memberId);
};

const toggleMember = (memberId: string) => {
  const index = selectedMembers.value.indexOf(memberId);
  if (index > -1) {
    selectedMembers.value.splice(index, 1);
  } else {
    selectedMembers.value.push(memberId);
  }
};

const selectAll = () => {
  selectedMembers.value = availableMembers.value.map(m => m.id);
};

const deselectAll = () => {
  selectedMembers.value = [];
};

const loadData = async () => {
  try {
    // Load all members with phone numbers
    const getMembersFunction = httpsCallable(functions, 'getAllMembersPhones');
    const result = await getMembersFunction();
    const data = result.data as { members: Member[]; count: number };

    availableMembers.value = data.members;
    allMembersCount.value = data.count;

    // Load teams
    const getTeamsFunction = httpsCallable(functions, 'getTeams');
    const teamsResult = await getTeamsFunction();
    const teamsData = teamsResult.data as { teams: Team[] };
    teams.value = teamsData.teams;
  } catch (error) {
    console.error('Error loading data:', error);
    errorMessage.value = 'Erreur lors du chargement des données';
    showErrorAlert.value = true;
  }
};

const loadTeamMembers = async (teamId: string) => {
  try {
    const getTeamMembersFunction = httpsCallable(functions, 'getTeamMembersPhones');
    const result = await getTeamMembersFunction({ teamId });
    const data = result.data as { count: number };
    teamMembersCount.value = data.count;
  } catch (error) {
    console.error('Error loading team members:', error);
    teamMembersCount.value = 0;
  }
};

const sendSMS = async () => {
  if (!canSend.value || isSending.value) return;

  isSending.value = true;

  try {
    const sendFunction = httpsCallable(functions, 'sendAvailabilityRequestSMS');

    const payload: any = {
      recipientType: recipientType.value,
      customMessage: customMessage.value.trim(),
      url: availabilityUrl.value
    };

    if (recipientType.value === 'team') {
      payload.teamId = selectedTeamId.value;
    } else if (recipientType.value === 'specific') {
      payload.memberIds = selectedMembers.value;
    }

    const result = await sendFunction(payload);
    const data = result.data as { sent: number; failed: number };

    successMessage.value = `SMS envoyé avec succès à ${data.sent} membre(s)`;
    if (data.failed > 0) {
      successMessage.value += `\n${data.failed} échec(s)`;
    }

    showSuccessAlert.value = true;
    emit('sent');

    // Close modal after a short delay
    setTimeout(() => {
      emit('close');
    }, 2000);
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    errorMessage.value = error.message || 'Erreur lors de l\'envoi des SMS';
    showErrorAlert.value = true;
  } finally {
    isSending.value = false;
  }
};
</script>

<style scoped>
.modal-content {
  max-width: 600px;
  margin: 0 auto;
}

.section {
  margin-bottom: 24px;
}

h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--ion-color-dark);
}

ion-segment {
  margin-bottom: 16px;
}

.team-selection {
  margin-top: 16px;
}

.member-selection {
  margin-top: 16px;
}

.search-bar {
  margin-bottom: 8px;
}

.search-bar ion-searchbar {
  --background: var(--ion-color-light);
  --border-radius: 8px;
  padding: 0;
}

.selection-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 12px;
  padding: 0 4px;
}

.selection-actions ion-button {
  margin: 0;
  font-size: 0.85rem;
  --padding-start: 8px;
  --padding-end: 8px;
}

.selection-counter {
  margin-left: auto;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ion-color-primary);
  padding: 4px 8px;
  background: var(--ion-color-primary-tint);
  border-radius: 12px;
}

.member-selection ion-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--ion-color-light-shade);
  border-radius: 8px;
}

.member-selection ion-item {
  --padding-start: 12px;
}

.no-members {
  text-align: center;
  color: var(--ion-color-medium);
  padding: 16px;
  font-size: 0.9rem;
}

.recipients-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--ion-color-light);
  border-radius: 8px;
  margin-top: 12px;
}

.recipients-summary ion-icon {
  font-size: 1.2rem;
  color: var(--ion-color-primary);
}

.recipients-summary span {
  font-size: 0.9rem;
  color: var(--ion-color-dark);
}

.message-section {
  margin-bottom: 24px;
}

.preview-section {
  margin-bottom: 24px;
}

.preview-box {
  padding: 16px;
  background: var(--ion-color-light);
  border-radius: 8px;
  border-left: 4px solid var(--ion-color-primary);
  white-space: pre-wrap;
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--ion-color-dark);
}

.action-buttons {
  margin-top: 24px;
}
</style>
