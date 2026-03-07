<template>
  <ion-modal
    :is-open="isOpen"
    :initial-breakpoint="0.6"
    :breakpoints="[0, 0.6, 0.9]"
    @will-dismiss="$emit('dismiss')"
    class="item-detail-sheet"
  >
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ item?.title || 'Détails' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="$emit('dismiss')" fill="clear">
            <ion-icon :icon="closeOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div v-if="item" class="sheet-content">
        <!-- Type Selection -->
        <div class="field-section">
          <label class="field-label">Type</label>
          <div class="type-grid">
            <button
              v-for="t in primaryTypeOptions"
              :key="t.value"
              class="type-button"
              :class="{ active: currentType === t.value }"
              @click="updateType(t.value)"
            >
              <ion-icon :icon="t.icon" />
              <span>{{ t.label }}</span>
            </button>
          </div>
          <button class="more-types-toggle" @click="showMoreTypes = !showMoreTypes">
            <ion-icon :icon="showMoreTypes ? chevronUpOutline : chevronDownOutline" />
            <span>{{ showMoreTypes ? 'Moins de types' : 'Plus de types' }}</span>
          </button>
          <div v-if="showMoreTypes" class="type-grid secondary-types">
            <button
              v-for="t in secondaryTypeOptions"
              :key="t.value"
              class="type-button secondary"
              :class="{ active: currentType === t.value }"
              @click="updateType(t.value)"
            >
              <ion-icon :icon="t.icon" />
              <span>{{ t.label }}</span>
            </button>
          </div>
        </div>

        <!-- Participants -->
        <div class="field-section">
          <label class="field-label">Participants</label>
          <ParticipantSelector
            :participants="currentParticipants"
            @update:participants="updateParticipants"
            :service-id="serviceId"
            :multiple="true"
          />
        </div>

        <!-- Duration -->
        <div class="field-section">
          <label class="field-label">Durée (minutes)</label>
          <DurationStepper
            :model-value="currentDuration"
            @update:model-value="updateDuration"
          />
        </div>

        <!-- Resource Link -->
        <div class="field-section">
          <label class="field-label">Ressource</label>
          <template v-if="item.resourceId && linkedResource">
            <div class="linked-resource-card">
              <div class="linked-resource-info">
                <h4>{{ linkedResource.title }}</h4>
                <div v-if="linkedResource.contents?.length" class="linked-resource-meta">
                  <button
                    v-for="content in linkedResource.contents"
                    :key="content.type"
                    class="media-chip-button"
                  >
                    <ion-icon :icon="getMediaTypeIcon(content.type)" />
                    {{ formatMediaType(content.type) }}
                  </button>
                </div>
              </div>
              <div class="linked-resource-actions">
                <ion-button size="small" fill="outline" @click="showResourceSelector = true">
                  Changer
                </ion-button>
                <ion-button size="small" fill="outline" color="danger" @click="unlinkResource">
                  Délier
                </ion-button>
              </div>
            </div>
          </template>
          <template v-else>
            <ion-button fill="outline" expand="block" @click="showResourceSelector = true">
              <ion-icon :icon="addOutline" slot="start" />
              Lier une ressource
            </ion-button>
          </template>
          <ResourceSelector
            :model-value="item.resourceId || null"
            :modal-only="true"
            :is-open="showResourceSelector"
            @update:is-open="showResourceSelector = $event"
            @update:model-value="handleResourceSelected"
          />
        </div>

        <!-- Scripture -->
        <div class="field-section">
          <label class="field-label">Écriture</label>
          <ion-item class="form-item" lines="none">
            <ion-input
              v-model="scriptureRef"
              placeholder="Ex: Jean 3:16-18"
              @ionBlur="updateScripture"
            />
          </ion-item>
          <ion-button
            size="small"
            fill="outline"
            @click="fetchScripture"
            :disabled="fetchingScripture || !scriptureRef"
            class="fetch-btn"
          >
            <ion-spinner v-if="fetchingScripture" name="crescent" slot="start" />
            {{ fetchingScripture ? 'Recherche...' : 'Chercher les versets' }}
          </ion-button>
          <div v-if="scriptureText" class="scripture-preview">
            <div class="scripture-header">
              <span class="scripture-reference-label">{{ scriptureRef }}</span>
              <span class="scripture-version">{{ scriptureVersion }}</span>
              <ion-button fill="clear" size="small" color="medium" @click="clearScripture">
                <ion-icon :icon="closeOutline" slot="icon-only" />
              </ion-button>
            </div>
            <div class="scripture-text" v-html="formatScriptureWithSuperscript(scriptureText)"></div>
          </div>
        </div>

        <!-- Subtitle -->
        <div class="field-section">
          <label class="field-label">Sous-titre</label>
          <ion-item class="form-item" lines="none">
            <ion-input
              v-model="subtitle"
              placeholder="Sous-titre optionnel"
              @ionBlur="updateSubtitle"
            />
          </ion-item>
        </div>

        <!-- Notes -->
        <div class="field-section">
          <label class="field-label">Notes</label>
          <ion-item class="form-item" lines="none">
            <ion-textarea
              v-model="notes"
              placeholder="Notes..."
              :rows="3"
              :auto-grow="true"
              @ionBlur="updateNotes"
            />
          </ion-item>
        </div>

        <!-- Add Sub-Item Shortcut (items only) -->
        <ion-button
          v-if="!parentItemId && currentType === ProgramItemType.TITLE"
          fill="outline"
          expand="block"
          color="success"
          @click="handleAddSubItem"
          class="add-sub-btn"
        >
          <ion-icon :icon="addOutline" slot="start" />
          Ajouter un sous-élément
        </ion-button>

        <!-- Delete -->
        <ion-button
          fill="outline"
          expand="block"
          color="danger"
          @click="handleDelete"
          class="delete-btn"
        >
          <ion-icon :icon="trashOutline" slot="start" />
          Supprimer
        </ion-button>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
  IonContent, IonItem, IonInput, IonTextarea, IonSpinner, toastController
} from '@ionic/vue';
import {
  closeOutline, addOutline, trashOutline,
  chevronUpOutline, chevronDownOutline,
  playCircleOutline, volumeHighOutline, documentTextOutline, documentOutline,
  musicalNoteOutline, handLeftOutline, libraryOutline, micOutline,
  megaphoneOutline, giftOutline, personCircleOutline,
  personOutline, musicalNotesOutline
} from 'ionicons/icons';
import { ProgramItemType } from '@/types/program';
import type { ProgramItem, ProgramSubItem, ProgramParticipant } from '@/types/program';
import type { Resource } from '@/types/resource';
import { bibleService } from '@/services/bibleService';
import ResourceSelector from '@/components/ResourceSelector.vue';
import DurationStepper from '@/components/DurationStepper.vue';
import ParticipantSelector from '@/components/ParticipantSelector.vue';

interface Props {
  isOpen: boolean;
  item: ProgramItem | ProgramSubItem | null;
  parentItemId?: string | null;
  serviceId: string;
  linkedResources: Map<string, Resource>;
}

const props = withDefaults(defineProps<Props>(), {
  parentItemId: null,
});

const emit = defineEmits<{
  dismiss: [];
  updateField: [field: string, value: any];
  delete: [];
  addSubItem: [];
}>();

const primaryTypeOptions = [
  { value: ProgramItemType.SONG, label: 'Chant', icon: musicalNoteOutline },
  { value: ProgramItemType.PRAYER, label: 'Prière', icon: handLeftOutline },
  { value: ProgramItemType.SCRIPTURE, label: 'Lecture', icon: libraryOutline },
  { value: ProgramItemType.SERMON, label: 'Prédication', icon: micOutline },
  { value: ProgramItemType.TITLE, label: 'Titre', icon: documentTextOutline },
];

const secondaryTypeOptions = [
  { value: 'Annonce' as ProgramItemType, label: 'Annonce', icon: megaphoneOutline },
  { value: 'Offrande' as ProgramItemType, label: 'Offrande', icon: giftOutline },
  { value: 'Bénédiction' as ProgramItemType, label: 'Bénédiction', icon: handLeftOutline },
  { value: 'Mot de bienvenue' as ProgramItemType, label: 'Bienvenue', icon: personCircleOutline },
  { value: 'Salutations' as ProgramItemType, label: 'Salutations', icon: personOutline },
  { value: 'Numéro spécial' as ProgramItemType, label: 'Spécial', icon: musicalNotesOutline },
  { value: 'Collecte' as ProgramItemType, label: 'Collecte', icon: giftOutline },
  { value: 'Autre' as ProgramItemType, label: 'Autre', icon: documentTextOutline },
];

// Local form state
const showMoreTypes = ref(false);
const showResourceSelector = ref(false);
const fetchingScripture = ref(false);

const currentType = ref<ProgramItemType | ''>('');
const subtitle = ref('');
const notes = ref('');
const scriptureRef = ref('');
const scriptureText = ref('');
const scriptureVersion = ref('LSG');
const currentDuration = ref(0);
const currentParticipants = ref<ProgramParticipant[]>([]);

const linkedResource = computed(() => {
  if (!props.item?.resourceId) return null;
  return props.linkedResources.get(props.item.resourceId) || null;
});

// Sync local state when item changes or sheet opens
watch(() => [props.isOpen, props.item] as const, ([open, item]) => {
  if (open && item) {
    currentType.value = item.type || '';
    subtitle.value = (item as any).subtitle || '';
    notes.value = item.notes || '';
    scriptureRef.value = (item as any).scriptureReference || '';
    scriptureText.value = (item as any).scriptureText || '';
    scriptureVersion.value = (item as any).scriptureVersion || 'LSG';
    currentDuration.value = item.duration || 0;
    currentParticipants.value = (item as any).participants || [];
  }
}, { immediate: true });

// Also update local state when item is updated externally (real-time)
watch(() => props.item?.title, () => {
  if (props.isOpen && props.item) {
    currentType.value = props.item.type || '';
    subtitle.value = (props.item as any).subtitle || '';
    notes.value = props.item.notes || '';
    scriptureRef.value = (props.item as any).scriptureReference || '';
    scriptureText.value = (props.item as any).scriptureText || '';
    scriptureVersion.value = (props.item as any).scriptureVersion || 'LSG';
    currentDuration.value = props.item.duration || 0;
    currentParticipants.value = (props.item as any).participants || [];
  }
});

// Field update methods
const updateType = (type: ProgramItemType) => {
  currentType.value = type;
  emit('updateField', 'type', type);
};

const updateSubtitle = () => {
  emit('updateField', 'subtitle', subtitle.value || null);
};

const updateNotes = () => {
  emit('updateField', 'notes', notes.value || null);
};

const updateDuration = (value: number) => {
  currentDuration.value = value;
  emit('updateField', 'duration', value);
};

const updateParticipants = (value: ProgramParticipant[]) => {
  currentParticipants.value = value;
  emit('updateField', 'participants', value);
};

const handleResourceSelected = (resourceId: string | null) => {
  emit('updateField', 'resourceId', resourceId || null);
  showResourceSelector.value = false;
};

const unlinkResource = () => {
  emit('updateField', 'resourceId', null);
};

// Scripture
const fetchScripture = async () => {
  if (!scriptureRef.value) return;
  fetchingScripture.value = true;
  try {
    const result = await bibleService.getScripture(scriptureRef.value);
    if (!result) {
      const toast = await toastController.create({ message: 'Référence biblique non reconnue', duration: 3000, color: 'warning', position: 'bottom' });
      await toast.present();
      return;
    }
    scriptureRef.value = result.reference;
    scriptureText.value = result.text;
    scriptureVersion.value = result.version;
    emit('updateField', 'scriptureReference', result.reference);
    emit('updateField', 'scriptureText', result.text);
    emit('updateField', 'scriptureVersion', result.version);
  } catch (error) {
    console.error('Error fetching scripture:', error);
    const toast = await toastController.create({ message: 'Erreur lors de la récupération des versets', duration: 3000, color: 'danger', position: 'bottom' });
    await toast.present();
  } finally {
    fetchingScripture.value = false;
  }
};

const updateScripture = () => {
  if (scriptureRef.value !== ((props.item as any)?.scriptureReference || '')) {
    emit('updateField', 'scriptureReference', scriptureRef.value || null);
  }
};

const clearScripture = () => {
  scriptureRef.value = '';
  scriptureText.value = '';
  scriptureVersion.value = 'LSG';
  emit('updateField', 'scriptureReference', null);
  emit('updateField', 'scriptureText', null);
  emit('updateField', 'scriptureVersion', null);
};

const formatScriptureWithSuperscript = (text: string): string => {
  if (!text) return '';
  return text.replace(/^(\d+)\s/gm, '<sup>$1</sup> ');
};

// Media helpers
const getMediaTypeIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    'video': playCircleOutline,
    'audio': volumeHighOutline,
    'lyrics': documentTextOutline,
    'music_sheet': documentOutline,
    'spotify': musicalNoteOutline
  };
  return iconMap[type] || documentOutline;
};

const formatMediaType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'lyrics': 'Paroles',
    'video': 'Vidéo',
    'audio': 'Audio',
    'music_sheet': 'Partition',
    'spotify': 'Spotify'
  };
  return typeMap[type] || type;
};

// Actions
const handleDelete = () => {
  emit('delete');
};

const handleAddSubItem = () => {
  emit('addSubItem');
};
</script>

<style scoped>
.sheet-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 32px;
}

.field-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ion-color-medium-shade);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Type Grid */
.type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 6px;
}

.type-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 8px 4px;
  border: 1px solid var(--ion-color-light-shade);
  border-radius: 8px;
  background: var(--ion-color-light);
  cursor: pointer;
  font-size: 11px;
  color: var(--ion-color-dark);
  transition: all 0.15s;
}

.type-button ion-icon {
  font-size: 18px;
  color: var(--ion-color-medium);
}

.type-button.active {
  border-color: var(--ion-color-primary);
  background: var(--ion-color-primary-tint);
}

.type-button.active ion-icon {
  color: var(--ion-color-primary);
}

.type-button.secondary {
  padding: 6px 4px;
  font-size: 10px;
}

.type-button.secondary ion-icon {
  font-size: 16px;
}

.secondary-types {
  margin-top: 4px;
}

.more-types-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  padding: 4px 8px;
  border: none;
  background: none;
  color: var(--ion-color-medium);
  font-size: 12px;
  cursor: pointer;
}

.more-types-toggle ion-icon {
  font-size: 14px;
}

/* Form Items */
.form-item {
  --background: var(--ion-color-light);
  --border-radius: 8px;
  --padding-start: 12px;
  --padding-end: 12px;
}

/* Resource Card */
.linked-resource-card {
  padding: 12px;
  background: var(--ion-color-light);
  border-radius: 8px;
  border: 1px solid var(--ion-color-light-shade);
}

.linked-resource-info h4 {
  margin: 0 0 6px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-color-dark);
}

.linked-resource-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.media-chip-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid var(--ion-color-light-shade);
  background: var(--ion-background-color, #fff);
  font-size: 11px;
  color: var(--ion-color-medium);
  cursor: default;
}

.media-chip-button ion-icon {
  font-size: 14px;
}

.linked-resource-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

/* Scripture */
.fetch-btn {
  margin-top: 4px;
  align-self: flex-start;
}

.scripture-preview {
  margin-top: 8px;
  padding: 12px;
  background: var(--ion-color-light);
  border-radius: 8px;
  border-left: 3px solid var(--ion-color-primary);
}

.scripture-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.scripture-reference-label {
  font-weight: 600;
  font-size: 13px;
  color: var(--ion-color-dark);
}

.scripture-version {
  font-size: 11px;
  color: var(--ion-color-medium);
  background: var(--ion-color-light-shade);
  padding: 2px 6px;
  border-radius: 4px;
}

.scripture-text {
  font-size: 13px;
  line-height: 1.6;
  color: var(--ion-color-dark);
}

.scripture-text :deep(sup) {
  color: var(--ion-color-primary);
  font-weight: 600;
  font-size: 10px;
  margin-right: 2px;
}

/* Action buttons */
.add-sub-btn {
  margin-top: 8px;
}

.delete-btn {
  margin-top: 4px;
}
</style>
