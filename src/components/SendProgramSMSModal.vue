<template>
  <ion-modal :is-open="isOpen" @ionModalDidDismiss="$emit('close')">
    <ion-header>
      <ion-toolbar>
        <ion-title>Envoyer une notification SMS</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="$emit('close')">
            <ion-icon :icon="closeOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="modal-content">
        <!-- Service Info -->
        <div class="service-info-section">
          <h3>Service</h3>
          <p class="service-title">{{ serviceTitle }}</p>
          <p class="service-date">{{ serviceDate }}</p>
        </div>

        <!-- Recipient Selection -->
        <div class="recipients-section">
          <h3>Destinataires</h3>

          <ion-segment v-model="recipientType" @ionChange="handleRecipientTypeChange">
            <ion-segment-button value="all">
              <ion-label>Tous les membres</ion-label>
            </ion-segment-button>
            <ion-segment-button value="specific">
              <ion-label>Membres spécifiques</ion-label>
            </ion-segment-button>
          </ion-segment>

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
              {{ availableMembers.length }} membre(s) recevront le SMS
            </span>
            <span v-else>
              {{ selectedMembers.length }} membre(s) sélectionné(s)
            </span>
          </div>
        </div>

        <!-- Custom Note -->
        <div class="note-section">
          <h3>Message personnalisé (optionnel)</h3>
          <ion-textarea
            v-model="customNote"
            placeholder="Ajoutez une note personnelle..."
            :rows="3"
            :maxlength="100"
          ></ion-textarea>
          <p class="character-count">{{ customNote.length }}/100 caractères</p>
        </div>

        <!-- Preview -->
        <div class="preview-section">
          <h3>Aperçu du message</h3>
          <div class="message-preview">
            {{ previewMessage }}
          </div>
        </div>

        <!-- Actions -->
        <div class="modal-actions">
          <ion-button
            expand="block"
            @click="sendSMS"
            :disabled="isSending || !canSend"
          >
            <ion-icon :icon="sendOutline" slot="start" />
            {{ isSending ? 'Envoi en cours...' : 'Envoyer les SMS' }}
          </ion-button>
        </div>

        <!-- Status Messages -->
        <ion-alert
          :is-open="showSuccessAlert"
          header="Succès"
          :message="successMessage"
          :buttons="['OK']"
          @didDismiss="showSuccessAlert = false"
        ></ion-alert>

        <ion-alert
          :is-open="showErrorAlert"
          header="Erreur"
          :message="errorMessage"
          :buttons="['OK']"
          @didDismiss="showErrorAlert = false"
        ></ion-alert>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonSegment, IonSegmentButton, IonLabel, IonList, IonItem,
  IonCheckbox, IonTextarea, IonAlert, IonSearchbar
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

interface Props {
  isOpen: boolean;
  serviceId: string;
  serviceTitle: string;
  serviceDate: string;
}

const props = defineProps<Props>();
const emit = defineEmits(['close', 'sent']);

const functions = getFunctions();

// State
const recipientType = ref<'all' | 'specific'>('all');
const availableMembers = ref<Member[]>([]);
const selectedMembers = ref<string[]>([]);
const customNote = ref('');
const isSending = ref(false);
const showSuccessAlert = ref(false);
const showErrorAlert = ref(false);
const successMessage = ref('');
const errorMessage = ref('');
const searchQuery = ref('');

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
    return availableMembers.value.length > 0;
  }
  return selectedMembers.value.length > 0;
});

const serviceUrl = computed(() => {
  // Generate the public URL to the service program page
  const baseUrl = 'https://adorateurs.eglisegalilee.com';
  return `${baseUrl}/service-program/${props.serviceId}`;
});

const previewMessage = computed(() => {
  let message = `Le programme du service "${props.serviceTitle}" du ${props.serviceDate} est maintenant disponible!`;

  if (customNote.value.trim()) {
    message += `\n\n${customNote.value.trim()}`;
  }

  message += `\n\nConsultez-le ici: ${serviceUrl.value}`;

  return message;
});

// Watchers
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    await loadMembers();
  } else {
    // Reset form when closed
    recipientType.value = 'all';
    selectedMembers.value = [];
    customNote.value = '';
    searchQuery.value = '';
  }
});

// Methods
const handleRecipientTypeChange = () => {
  selectedMembers.value = [];
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

const loadMembers = async () => {
  try {
    const getMembers = httpsCallable(functions, 'getServiceMembersPhones');
    const result = await getMembers({ serviceId: props.serviceId });

    availableMembers.value = (result.data as any).members || [];
  } catch (error) {
    console.error('Error loading members:', error);
    errorMessage.value = 'Erreur lors du chargement des membres.';
    showErrorAlert.value = true;
  }
};

const sendSMS = async () => {
  if (!canSend.value) return;

  isSending.value = true;

  try {
    // Get phone numbers based on selection
    let phoneNumbers: string[];

    if (recipientType.value === 'all') {
      phoneNumbers = availableMembers.value.map(m => m.phone);
    } else {
      phoneNumbers = availableMembers.value
        .filter(m => selectedMembers.value.includes(m.id))
        .map(m => m.phone);
    }

    // Call cloud function
    const sendProgramSMS = httpsCallable(functions, 'sendProgramAvailableSMS');
    const result = await sendProgramSMS({
      serviceId: props.serviceId,
      serviceTitle: props.serviceTitle,
      serviceDate: props.serviceDate,
      phoneNumbers,
      customNote: customNote.value.trim() || undefined,
      serviceUrl: serviceUrl.value
    });

    const data = result.data as any;

    if (data.failed > 0) {
      successMessage.value = `${data.sent} SMS envoyé(s) avec succès. ${data.failed} échec(s).`;
    } else {
      successMessage.value = `${data.sent} SMS envoyé(s) avec succès!`;
    }

    showSuccessAlert.value = true;
    emit('sent', data);

    // Close modal after success
    setTimeout(() => {
      emit('close');
    }, 2000);
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    errorMessage.value = error.message || 'Erreur lors de l\'envoi des SMS.';
    showErrorAlert.value = true;
  } finally {
    isSending.value = false;
  }
};
</script>

<style scoped>
.modal-content {
  padding-bottom: 20px;
}

.service-info-section,
.recipients-section,
.note-section,
.preview-section {
  margin-bottom: 24px;
}

.service-info-section h3,
.recipients-section h3,
.note-section h3,
.preview-section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--ion-color-dark);
  margin: 0 0 12px;
}

.service-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--ion-color-primary);
  margin: 0 0 4px;
}

.service-date {
  font-size: 0.9rem;
  color: var(--ion-color-medium);
  margin: 0;
}

ion-segment {
  margin-bottom: 16px;
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
  padding: 20px;
  font-style: italic;
}

.recipients-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--ion-color-light);
  border-radius: 8px;
  margin-top: 12px;
  font-weight: 600;
  color: var(--ion-color-dark);
}

.recipients-summary ion-icon {
  font-size: 1.25rem;
  color: var(--ion-color-primary);
}

.character-count {
  text-align: right;
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  margin: 4px 0 0;
}

.message-preview {
  background: var(--ion-color-light);
  border-radius: 8px;
  padding: 16px;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--ion-color-dark);
  border: 1px solid var(--ion-color-light-shade);
}

.modal-actions {
  margin-top: 24px;
}

.modal-actions ion-button {
  margin: 0;
}
</style>
