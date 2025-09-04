<template>
  <ion-card class="availability-card">
    <ion-card-header>
      <ion-card-title>{{ service.title }}</ion-card-title>
      <ion-card-subtitle>
        {{ formatDateTime(service.date, service.time) }}
      </ion-card-subtitle>
    </ion-card-header>

    <ion-card-content>
      <!-- Deadline warning if approaching -->
      <div v-if="service.availabilityDeadline && isDeadlineSoon" class="deadline-warning">
        <ion-icon :icon="timerOutline" color="warning"></ion-icon>
        <span>Date limite: {{ formatDeadline(service.availabilityDeadline) }}</span>
      </div>

      <!-- Current availability status -->
      <div v-if="currentAvailability" class="current-status">
        <ion-chip :color="getStatusColor(currentAvailability.status)">
          <ion-icon :icon="getStatusIcon(currentAvailability.status)" />
          <ion-label>{{ getStatusLabel(currentAvailability.status) }}</ion-label>
        </ion-chip>
        <span class="status-date">
          Soumis le {{ formatSubmissionDate(currentAvailability.submittedAt) }}
        </span>
      </div>

      <!-- Availability selection -->
      <div class="availability-options">
        <h3>Votre disponibilité :</h3>
        <ion-radio-group
          :value="selectedStatus"
          @ionChange="handleStatusChange"
        >
          <ion-item>
            <ion-radio slot="start" value="available" />
            <ion-icon :icon="checkmarkCircleOutline" color="success" slot="start" />
            <ion-label>Disponible</ion-label>
          </ion-item>
          
          <ion-item>
            <ion-radio slot="start" value="maybe" />
            <ion-icon :icon="helpCircleOutline" color="warning" slot="start" />
            <ion-label>Peut-être</ion-label>
          </ion-item>
          
          <ion-item>
            <ion-radio slot="start" value="unavailable" />
            <ion-icon :icon="closeCircleOutline" color="danger" slot="start" />
            <ion-label>Indisponible</ion-label>
          </ion-item>
        </ion-radio-group>
      </div>

      <!-- Comment section -->
      <div class="comment-section">
        <ion-textarea
          v-model="comment"
          placeholder="Commentaire (optionnel)"
          :rows="2"
          fill="outline"
        />
      </div>

      <!-- Submit button -->
      <div class="submit-section">
        <ion-button
          expand="block"
          @click="submitAvailability"
          :disabled="!selectedStatus || submitting"
        >
          <ion-icon 
            v-if="submitting" 
            :icon="syncOutline" 
            slot="start"
            class="spinning"
          />
          <ion-icon 
            v-else
            :icon="currentAvailability ? saveOutline : addOutline" 
            slot="start"
          />
          {{ submitting ? 'Envoi...' : (currentAvailability ? 'Mettre à jour' : 'Soumettre') }}
        </ion-button>
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonChip,
  IonLabel,
  IonIcon,
  IonRadioGroup,
  IonRadio,
  IonItem,
  IonTextarea,
  IonButton
} from '@ionic/vue';
import {
  timerOutline,
  checkmarkCircleOutline,
  helpCircleOutline,
  closeCircleOutline,
  saveOutline,
  addOutline,
  syncOutline
} from 'ionicons/icons';
import type { Service } from '@/types/service';
import type { MemberAvailability, AvailabilityStatus } from '@/types/availability';
import { availabilityService } from '@/firebase/availability';
import { authService } from '@/firebase/auth';
import { timezoneUtils } from '@/utils/timezone';

interface Props {
  service: Service;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  submitted: [availability: MemberAvailability];
}>();

const selectedStatus = ref<AvailabilityStatus | null>(null);
const comment = ref('');
const submitting = ref(false);
const currentAvailability = ref<MemberAvailability | null>(null);

const isDeadlineSoon = computed(() => {
  if (!props.service.availabilityDeadline) return false;
  const deadline = new Date(props.service.availabilityDeadline);
  const now = new Date();
  const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntilDeadline <= 24 && hoursUntilDeadline > 0; // Show warning 24h before
});

function formatDateTime(dateStr: string, timeStr: string): string {
  return timezoneUtils.formatDateTimeForDisplay(dateStr, timeStr);
}

function formatDeadline(deadlineStr: string): string {
  const deadline = new Date(deadlineStr);
  return deadline.toLocaleString('fr-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Toronto'
  });
}

function formatSubmissionDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-CA', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Toronto'
  });
}

function getStatusColor(status: AvailabilityStatus): string {
  switch (status) {
    case 'available': return 'success';
    case 'maybe': return 'warning';
    case 'unavailable': return 'danger';
    default: return 'medium';
  }
}

function getStatusIcon(status: AvailabilityStatus) {
  switch (status) {
    case 'available': return checkmarkCircleOutline;
    case 'maybe': return helpCircleOutline;
    case 'unavailable': return closeCircleOutline;
    default: return helpCircleOutline;
  }
}

function getStatusLabel(status: AvailabilityStatus): string {
  switch (status) {
    case 'available': return 'Disponible';
    case 'maybe': return 'Peut-être';
    case 'unavailable': return 'Indisponible';
    default: return 'Inconnu';
  }
}

function handleStatusChange(event: CustomEvent) {
  selectedStatus.value = event.detail.value as AvailabilityStatus;
}

async function submitAvailability() {
  if (!selectedStatus.value) return;

  const user = authService.getCurrentUser();
  if (!user) {
    console.error('User not authenticated');
    return;
  }

  submitting.value = true;
  try {
    const availability = await availabilityService.submitAvailability({
      serviceId: props.service.id,
      memberId: user.uid,
      status: selectedStatus.value,
      comment: comment.value.trim() || undefined
    });

    currentAvailability.value = availability;
    emit('submitted', availability);
    
    console.log('Availability submitted successfully');
  } catch (error) {
    console.error('Error submitting availability:', error);
  } finally {
    submitting.value = false;
  }
}

async function loadCurrentAvailability() {
  const user = authService.getCurrentUser();
  if (!user) return;

  try {
    const availability = await availabilityService.getMemberAvailability(
      props.service.id,
      user.uid
    );
    
    if (availability) {
      currentAvailability.value = availability;
      selectedStatus.value = availability.status;
      comment.value = availability.comment || '';
    }
  } catch (error) {
    console.error('Error loading current availability:', error);
  }
}

onMounted(() => {
  loadCurrentAvailability();
});
</script>

<style scoped>
.availability-card {
  --border-radius: 12px;
  margin-bottom: 16px;
}

.deadline-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--ion-color-warning-tint);
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 0.875rem;
  color: var(--ion-color-warning-shade);
}

.current-status {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.status-date {
  font-size: 0.875rem;
  color: var(--ion-color-medium);
}

.availability-options {
  margin-bottom: 16px;
}

.availability-options h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--ion-color-dark);
  margin: 0 0 12px 0;
}

.availability-options ion-item {
  --padding-start: 0;
  --inner-padding-end: 0;
  margin-bottom: 8px;
}

.availability-options ion-radio {
  margin-right: 12px;
}

.availability-options ion-icon {
  margin-right: 12px;
  font-size: 1.25rem;
}

.comment-section {
  margin-bottom: 20px;
}

.submit-section {
  margin-top: 20px;
}

.submit-section ion-button {
  --border-radius: 12px;
  font-weight: 600;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>