<template>
  <ion-modal
    :is-open="isOpen"
    @ionModalDidDismiss="$emit('close')"
    :initial-breakpoint="0.6"
    :breakpoints="[0, 0.6, 0.9]"
  >
    <ion-header>
      <ion-toolbar>
        <ion-title>Propriétés musicales</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="$emit('close')">
            <ion-icon :icon="closeOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="music-props-form">
        <ion-item>
          <ion-select
            v-model="musicPropsForm.musicKey"
            label="Tonalité"
            label-placement="stacked"
            interface="action-sheet"
            placeholder="Sélectionner..."
          >
            <ion-select-option value="">Aucune</ion-select-option>
            <ion-select-option v-for="option in musicKeys" :key="option.id" :value="option.id">
              {{ option.name }}
            </ion-select-option>
          </ion-select>
        </ion-item>

        <ion-item>
          <ion-select
            v-model="musicPropsForm.musicBeat"
            label="Signature"
            label-placement="stacked"
            interface="action-sheet"
            placeholder="Sélectionner..."
          >
            <ion-select-option value="">Aucune</ion-select-option>
            <ion-select-option v-for="option in musicBeats" :key="option.id" :value="option.id">
              {{ option.name }}
            </ion-select-option>
          </ion-select>
        </ion-item>

        <ion-item>
          <ion-select
            v-model="musicPropsForm.musicTempo"
            label="Tempo"
            label-placement="stacked"
            interface="action-sheet"
            placeholder="Sélectionner..."
          >
            <ion-select-option value="">Aucun</ion-select-option>
            <ion-select-option v-for="option in musicTempos" :key="option.id" :value="option.id">
              {{ option.name }} <span v-if="option.label">({{ option.label }})</span>
            </ion-select-option>
          </ion-select>
        </ion-item>

        <ion-item>
          <ion-select
            v-model="musicPropsForm.musicStyle"
            label="Style"
            label-placement="stacked"
            interface="action-sheet"
            placeholder="Sélectionner..."
          >
            <ion-select-option value="">Aucun</ion-select-option>
            <ion-select-option v-for="option in musicStyles" :key="option.id" :value="option.id">
              {{ option.name }}
            </ion-select-option>
          </ion-select>
        </ion-item>

        <ion-button @click="saveMusicProps" expand="block" class="ion-margin-top">
          Enregistrer
        </ion-button>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonItem,
  IonSelect,
  IonSelectOption,
} from '@ionic/vue';
import { closeOutline } from 'ionicons/icons';
import type { ResourceOption } from '@/types/resource';

interface MusicPropsForm {
  musicKey: string;
  musicBeat: string;
  musicTempo: string;
  musicStyle: string;
}

interface Props {
  isOpen: boolean;
  resourceId: string | null;
  initialForm: MusicPropsForm;
  musicKeys: ResourceOption[];
  musicBeats: ResourceOption[];
  musicTempos: ResourceOption[];
  musicStyles: ResourceOption[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  save: [form: MusicPropsForm];
}>();

const musicPropsForm = ref<MusicPropsForm>({ ...props.initialForm });

watch(
  () => props.initialForm,
  (newVal) => {
    musicPropsForm.value = { ...newVal };
  },
);

function saveMusicProps() {
  emit('save', { ...musicPropsForm.value });
}
</script>

<style scoped>
.music-props-form ion-item {
  margin-bottom: 0.5rem;
}
</style>
