<template>
  <ion-modal :is-open="isOpen" @didDismiss="$emit('close')">
    <ion-header>
      <ion-toolbar>
        <ion-title>Gérer les accès</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="$emit('close')">
            <ion-icon :icon="closeOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          v-model="searchQuery"
          placeholder="Rechercher un membre..."
          :debounce="300"
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div v-if="loadingMembers" class="modal-loading">
        <ion-spinner name="crescent" />
        <p>Chargement des membres...</p>
      </div>

      <ion-list v-else>
        <ion-item
          v-for="member in filteredMembers"
          :key="member.id"
          :button="true"
          @click="toggleDraftViewer(member.firebaseUserId)"
        >
          <ion-avatar slot="start">
            <img
              v-if="member.avatar && !failedAvatars.has(member.id)"
              :src="member.avatar"
              :alt="member.fullName"
              @error="failedAvatars.add(member.id)"
            />
            <div v-else class="avatar-initials">{{ getMemberInitials(member.fullName) }}</div>
          </ion-avatar>
          <ion-label>
            <h3>{{ member.fullName }}</h3>
            <p>{{ member.email }}</p>
          </ion-label>
          <ion-checkbox
            slot="end"
            :checked="draftViewerIds.includes(member.firebaseUserId)"
            @click.stop
          ></ion-checkbox>
        </ion-item>
      </ion-list>

      <div class="modal-footer">
        <ion-button @click="save" expand="block" color="primary">
          Enregistrer les accès
        </ion-button>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonCheckbox,
  IonSpinner,
} from '@ionic/vue';
import { closeOutline } from 'ionicons/icons';
import type { Member } from '@/types/member';

interface Props {
  isOpen: boolean;
  initialViewerIds: string[];
  members: Member[];
  loadingMembers: boolean;
  failedAvatars: Set<string>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  save: [viewerIds: string[]];
}>();

const draftViewerIds = ref<string[]>([]);
const searchQuery = ref('');

watch(
  () => props.initialViewerIds,
  (ids) => {
    draftViewerIds.value = [...ids];
  },
  { immediate: true }
);

const filteredMembers = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return props.members;
  return props.members.filter(
    (m) =>
      m.fullName.toLowerCase().includes(query) ||
      m.email.toLowerCase().includes(query)
  );
});

function toggleDraftViewer(firebaseUid: string) {
  const index = draftViewerIds.value.indexOf(firebaseUid);
  if (index >= 0) {
    draftViewerIds.value.splice(index, 1);
  } else {
    draftViewerIds.value.push(firebaseUid);
  }
}

function getMemberInitials(fullName: string): string {
  return fullName
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function save() {
  emit('save', [...draftViewerIds.value]);
}
</script>

<style scoped>
.modal-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  gap: 16px;
}

.modal-footer {
  padding: 16px;
  background: var(--ion-background-color);
  border-top: 1px solid var(--ion-color-light);
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
</style>
