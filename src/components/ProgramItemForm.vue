<template>
  <ion-modal :is-open="isOpen" @will-dismiss="$emit('cancel')">
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="$emit('cancel')">
            <ion-icon :icon="closeOutline" />
          </ion-button>
        </ion-buttons>
        <ion-title>{{ headerTitle }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleSubmit" :disabled="!canSubmit" :strong="true">
            {{ submitLabel }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="form-content">
        <!-- Type Selection Grid -->
        <div class="type-section">
          <label class="section-label">Type {{ typeRequired ? '*' : '' }}</label>
          <div class="type-grid">
            <button
              v-for="t in primaryTypes"
              :key="t"
              class="type-button"
              :class="{ active: form.type === t }"
              @click="form.type = t"
            >
              <ion-icon :icon="getItemIcon(t)" />
              <span>{{ t }}</span>
            </button>
          </div>
          <template v-if="secondaryTypes.length > 0">
            <button class="more-types-toggle" @click="showMoreTypes = !showMoreTypes">
              <ion-icon :icon="showMoreTypes ? chevronUpOutline : chevronDownOutline" />
              <span>{{ showMoreTypes ? 'Moins de types' : 'Plus de types' }}</span>
            </button>
            <div v-if="showMoreTypes" class="type-grid secondary-types">
              <button
                v-for="t in secondaryTypes"
                :key="t"
                class="type-button secondary"
                :class="{ active: form.type === t }"
                @click="form.type = t"
              >
                <ion-icon :icon="getItemIcon(t)" />
                <span>{{ t }}</span>
              </button>
            </div>
          </template>
        </div>

        <!-- Title with Autocomplete -->
        <div class="title-section">
          <ion-item class="form-item">
            <ion-label position="stacked">Titre *</ion-label>
            <ion-input
              v-model="form.title"
              :placeholder="titlePlaceholder"
              @ionInput="handleTitleInput"
              @ionBlur="handleTitleBlur"
              @ionFocus="handleTitleInput"
            />
          </ion-item>
          <div v-if="searchingTitle" class="title-autocomplete-wrapper">
            <div class="title-suggestions">
              <div class="suggestion-loading">
                <ion-spinner name="dots" color="primary" />
              </div>
            </div>
          </div>
          <div v-else-if="showSuggestions && suggestions.length > 0" class="title-autocomplete-wrapper">
            <div class="title-suggestions" tabindex="-1">
              <div
                v-for="resource in suggestions"
                :key="resource.id"
                class="suggestion-item"
                @mousedown.prevent="selectSuggestion(resource)"
              >
                <div class="suggestion-info">
                  <span class="suggestion-title">{{ resource.title }}</span>
                  <span v-if="resource.reference" class="suggestion-reference">{{ resource.reference }}</span>
                </div>
                <ion-icon :icon="sparklesOutline" color="primary" />
              </div>
            </div>
          </div>
        </div>

        <!-- Resource Link Section (hidden for Titre) -->
        <div v-if="form.type !== 'Titre'" class="resource-link-section">
          <template v-if="form.resourceId && getLinkedResource(form.resourceId)">
            <div class="linked-resource-card">
              <div class="linked-resource-info">
                <h4>{{ getLinkedResource(form.resourceId)!.title }}</h4>
                <div class="linked-resource-meta">
                  <span v-if="getResourceCollection(form.resourceId)" class="linked-resource-collection">
                    {{ getResourceCollection(form.resourceId) }}
                  </span>
                  <template v-if="getLinkedResource(form.resourceId)!.contents?.length">
                    <button
                      v-for="content in getLinkedResource(form.resourceId)!.contents"
                      :key="content.type"
                      class="media-chip-button"
                    >
                      <ion-icon :icon="getMediaTypeIcon(content.type)" />
                      {{ formatMediaType(content.type) }}
                    </button>
                  </template>
                </div>
                <div v-if="getResourceMusicPropsDisplay(form.resourceId)" class="linked-resource-music">
                  <span v-for="(prop, i) in getResourceMusicPropsDisplay(form.resourceId)" :key="i" class="music-prop-tag">
                    {{ prop }}
                  </span>
                </div>
              </div>
              <div class="linked-resource-actions">
                <ion-button size="small" fill="outline" @click="showResourceSelector = true">
                  Changer
                </ion-button>
                <ion-button size="small" fill="outline" color="danger" @click="form.resourceId = null">
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
            v-model="form.resourceId"
            :modal-only="true"
            :is-open="showResourceSelector"
            @update:is-open="showResourceSelector = $event"
          />
        </div>

        <!-- Scripture Section (prominent for Lecture biblique / Prédication) -->
        <div v-if="isScriptureType" class="scripture-section">
          <ion-item class="form-item">
            <ion-label position="stacked">Référence biblique</ion-label>
            <ion-input
              v-model="form.scriptureReference"
              placeholder="Ex: Jean 3:16-18"
            />
          </ion-item>
          <ion-button
            size="small"
            fill="outline"
            @click="fetchScripture"
            :disabled="fetchingScripture || !form.scriptureReference"
            class="fetch-scripture-btn"
          >
            <ion-spinner v-if="fetchingScripture" name="crescent" slot="start" />
            {{ fetchingScripture ? 'Recherche...' : 'Chercher les versets' }}
          </ion-button>
          <div v-if="form.scriptureText" class="scripture-preview">
            <div class="scripture-header">
              <span class="scripture-reference">{{ form.scriptureReference }}</span>
              <span class="scripture-version">{{ form.scriptureVersion }}</span>
              <ion-button fill="clear" size="small" color="medium" @click="clearScripture">
                <ion-icon :icon="closeOutline" slot="icon-only" />
              </ion-button>
            </div>
            <div class="scripture-text" v-html="formatScriptureWithSuperscript(form.scriptureText)"></div>
          </div>
        </div>

        <!-- Participants (promoted to main body) -->
        <div class="participants-section">
          <label class="section-label">Participants</label>
          <ParticipantSelector
            v-model:participants="form.participants"
            :service-id="serviceId"
            :multiple="true"
          />
        </div>

        <!-- Duration (promoted to main body) -->
        <div class="duration-section">
          <label class="section-label">Durée (minutes)</label>
          <DurationStepper
            :model-value="form.duration"
            @update:model-value="form.duration = $event"
          />
        </div>

        <!-- Options avancées -->
        <ion-accordion-group class="advanced-options-accordion">
          <ion-accordion value="advanced">
            <ion-item slot="header">
              <ion-label>Options avancées</ion-label>
            </ion-item>
            <div slot="content" class="advanced-content">
              <!-- Subtitle -->
              <ion-item class="form-item">
                <ion-label position="stacked">Sous-titre</ion-label>
                <ion-input
                  v-model="form.subtitle"
                  placeholder="Sous-titre optionnel"
                />
              </ion-item>

              <!-- Notes -->
              <ion-item class="form-item">
                <ion-label position="stacked">Notes</ion-label>
                <ion-textarea
                  v-model="form.notes"
                  placeholder="Notes..."
                  :rows="3"
                  :auto-grow="true"
                />
              </ion-item>

              <!-- Scripture for non-Lecture/Prédication sub-items -->
              <div v-if="!isScriptureType && isSubItemMode" class="scripture-section">
                <ion-item class="form-item">
                  <ion-label position="stacked">Référence biblique</ion-label>
                  <ion-input
                    v-model="form.scriptureReference"
                    placeholder="Ex: Jean 3:16-18"
                  />
                </ion-item>
                <ion-button
                  size="small"
                  fill="outline"
                  @click="fetchScripture"
                  :disabled="fetchingScripture || !form.scriptureReference"
                  class="fetch-scripture-btn"
                >
                  <ion-spinner v-if="fetchingScripture" name="crescent" slot="start" />
                  {{ fetchingScripture ? 'Recherche...' : 'Chercher les versets' }}
                </ion-button>
                <div v-if="form.scriptureText" class="scripture-preview">
                  <div class="scripture-header">
                    <span class="scripture-reference">{{ form.scriptureReference }}</span>
                    <span class="scripture-version">{{ form.scriptureVersion }}</span>
                    <ion-button fill="clear" size="small" color="medium" @click="clearScripture">
                      <ion-icon :icon="closeOutline" slot="icon-only" />
                    </ion-button>
                  </div>
                  <div class="scripture-text" v-html="formatScriptureWithSuperscript(form.scriptureText)"></div>
                </div>
              </div>
            </div>
          </ion-accordion>
        </ion-accordion-group>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
  IonContent, IonItem, IonLabel, IonInput, IonTextarea, IonSpinner,
  IonAccordion, IonAccordionGroup, toastController
} from '@ionic/vue';
import {
  closeOutline, addOutline, sparklesOutline,
  playCircleOutline, volumeHighOutline, documentTextOutline, documentOutline,
  musicalNoteOutline, handLeftOutline, libraryOutline, micOutline,
  removeOutline, megaphoneOutline, giftOutline, personCircleOutline,
  personOutline, musicalNotesOutline,
  chevronUpOutline, chevronDownOutline
} from 'ionicons/icons';
import { ProgramItemType } from '@/types/program';
import type { Resource, ResourceOption, ResourceCollection } from '@/types/resource';
import { getSmartSuggestions } from '@/utils/resource-suggestions';
import { bibleService } from '@/services/bibleService';
import ResourceSelector from '@/components/ResourceSelector.vue';
import DurationStepper from '@/components/DurationStepper.vue';
import ParticipantSelector from '@/components/ParticipantSelector.vue';
import type { ProgramItemFormData, FormMode } from '@/composables/useProgramItems';

interface Props {
  isOpen: boolean;
  mode: FormMode;
  types: ProgramItemType[];
  typeRequired?: boolean;
  initialData?: Partial<ProgramItemFormData>;
  serviceId: string;
  allResources: Resource[];
  linkedResources: Map<string, Resource>;
  resourceCollections: Map<string, ResourceCollection>;
  musicKeys: ResourceOption[];
  musicBeats: ResourceOption[];
  musicTempos: ResourceOption[];
  musicStyles: ResourceOption[];
}

const props = withDefaults(defineProps<Props>(), {
  typeRequired: true,
  initialData: () => ({})
});

const emit = defineEmits<{
  submit: [data: ProgramItemFormData];
  cancel: [];
}>();

// Internal form state
const form = ref<ProgramItemFormData>(createDefaultForm());
const showSuggestions = ref(false);
const showResourceSelector = ref(false);
const fetchingScripture = ref(false);

// Initialize form when modal opens with new data
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    form.value = {
      ...createDefaultForm(),
      ...props.initialData
    };
    showSuggestions.value = false;
    showResourceSelector.value = false;
  }
});

function createDefaultForm(): ProgramItemFormData {
  return {
    type: '' as ProgramItemType | '',
    title: '',
    subtitle: '',
    participants: [],
    duration: 0,
    notes: '',
    resourceId: null,
    scriptureReference: '',
    scriptureText: '',
    scriptureVersion: 'LSG'
  };
}

// Type grouping
const PRIMARY_TYPES = ['Chant', 'Prière', 'Lecture biblique', 'Prédication', 'Titre'];
const showMoreTypes = ref(false);

const primaryTypes = computed(() =>
  props.types.filter(t => PRIMARY_TYPES.includes(t))
);

const secondaryTypes = computed(() =>
  props.types.filter(t => !PRIMARY_TYPES.includes(t))
);

// Computed
const isSubItemMode = computed(() => props.mode === 'add-sub-item' || props.mode === 'edit-sub-item');
const isEditMode = computed(() => props.mode === 'edit-item' || props.mode === 'edit-sub-item');

const headerTitle = computed(() => {
  switch (props.mode) {
    case 'add-item': return 'Ajouter un élément';
    case 'edit-item': return 'Modifier l\'élément';
    case 'add-sub-item': return 'Ajouter un sous-élément';
    case 'edit-sub-item': return 'Modifier le sous-élément';
  }
});

const submitLabel = computed(() => isEditMode.value ? 'Modifier' : 'Ajouter');

const canSubmit = computed(() => {
  if (!form.value.title) return false;
  if (props.typeRequired && !form.value.type) return false;
  return true;
});

const isScriptureType = computed(() =>
  form.value.type === ProgramItemType.SCRIPTURE || form.value.type === ProgramItemType.SERMON
);

const titlePlaceholder = computed(() => {
  if (form.value.type === ProgramItemType.SCRIPTURE) return 'Ex: Jean 3:16-18';
  if (isSubItemMode.value) return 'Ex: Kache mwen anba zèl ou';
  return 'Ex: Moment d\'adoration';
});

const suggestions = computed(() => {
  if (!form.value.title || form.value.title.length < 2) return [];
  return getSmartSuggestions(form.value.type || '', form.value.title, props.allResources);
});

// Title autocomplete
let titleDebounceTimer: ReturnType<typeof setTimeout> | null = null;
const searchingTitle = ref(false);

const handleTitleInput = () => {
  if (titleDebounceTimer) clearTimeout(titleDebounceTimer);
  if (form.value.title && form.value.title.length >= 2) {
    searchingTitle.value = true;
    titleDebounceTimer = setTimeout(() => {
      showSuggestions.value = true;
      searchingTitle.value = false;
    }, 300);
  } else {
    showSuggestions.value = false;
    searchingTitle.value = false;
  }
};

const handleTitleBlur = (event: CustomEvent<FocusEvent>) => {
  const relatedTarget = (event.detail?.relatedTarget ?? (event as any).relatedTarget) as HTMLElement | null;
  // If focus moves to a suggestion item, don't hide
  if (relatedTarget?.closest('.title-suggestions')) return;
  showSuggestions.value = false;
};

const selectSuggestion = (resource: Resource) => {
  form.value.title = resource.title;
  form.value.resourceId = resource.id;
  showSuggestions.value = false;
  // Cache resource in linkedResources (parent manages the map, but we can set it)
  props.linkedResources.set(resource.id, resource);
};

// Resource display helpers
const getLinkedResource = (resourceId: string): Resource | undefined => {
  return props.linkedResources.get(resourceId);
};

const getResourceCollection = (resourceId: string): string | null => {
  const resource = props.linkedResources.get(resourceId);
  if (!resource?.collectionId) return null;
  const collection = props.resourceCollections.get(resource.collectionId);
  return collection?.name || null;
};

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

const getMusicOptionName = (optionId: string | undefined, options: ResourceOption[]): string => {
  if (!optionId) return '';
  const option = options.find(o => o.id === optionId);
  return option?.name || '';
};

const getResourceMusicPropsDisplay = (resourceId: string): string[] | null => {
  const resource = props.linkedResources.get(resourceId);
  if (!resource) return null;
  const result: string[] = [];
  if (resource.musicKey) result.push(getMusicOptionName(resource.musicKey, props.musicKeys));
  if (resource.musicBeat) result.push(getMusicOptionName(resource.musicBeat, props.musicBeats));
  if (resource.musicTempo) result.push(getMusicOptionName(resource.musicTempo, props.musicTempos));
  if (resource.musicStyle) result.push(getMusicOptionName(resource.musicStyle, props.musicStyles));
  return result.length > 0 ? result : null;
};

// Item type icons
const getItemIcon = (type: ProgramItemType) => {
  const iconMap: Record<string, string> = {
    'Chant': musicalNoteOutline,
    'Prière': handLeftOutline,
    'Lecture biblique': libraryOutline,
    'Prédication': micOutline,
    'Titre': documentTextOutline,
    'Section': removeOutline,
    'Annonce': megaphoneOutline,
    'Offrande': giftOutline,
    'Bénédiction': handLeftOutline,
    'Mot de bienvenue': personCircleOutline,
    'Salutations': personOutline,
    'Numéro spécial': musicalNotesOutline,
    'Collecte': giftOutline,
    'Adoration': musicalNotesOutline,
    'Louange': musicalNotesOutline,
    'Chant final': musicalNoteOutline,
    'Chant de clôture': musicalNoteOutline,
    'Autre': documentTextOutline
  };
  return iconMap[type as string] || documentTextOutline;
};

// Scripture
const formatScriptureWithSuperscript = (text: string): string => {
  if (!text) return '';
  return text.replace(/^(\d+)\s/gm, '<sup>$1</sup> ');
};

const showToast = async (message: string, color: 'success' | 'danger' | 'warning' = 'success') => {
  const toast = await toastController.create({ message, duration: 3000, color, position: 'bottom' });
  await toast.present();
};

const fetchScripture = async () => {
  if (!form.value.scriptureReference) {
    await showToast('Veuillez entrer une référence biblique', 'warning');
    return;
  }
  fetchingScripture.value = true;
  try {
    const result = await bibleService.getScripture(form.value.scriptureReference);
    if (!result) {
      await showToast('Référence biblique non reconnue. Exemple: Jean 3:16 ou Psaume 23:1-6', 'warning');
      return;
    }
    form.value.scriptureReference = result.reference;
    form.value.scriptureText = result.text;
    form.value.scriptureVersion = result.version;
    await showToast('Versets récupérés avec succès', 'success');
  } catch (error) {
    console.error('Error fetching scripture:', error);
    await showToast('Erreur lors de la récupération des versets', 'danger');
  } finally {
    fetchingScripture.value = false;
  }
};

const clearScripture = () => {
  form.value.scriptureReference = '';
  form.value.scriptureText = '';
  form.value.scriptureVersion = 'LSG';
};

// Submit
const handleSubmit = () => {
  if (!canSubmit.value) return;
  emit('submit', { ...form.value });
};
</script>

<style scoped>
.form-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-color-dark);
  margin-bottom: 8px;
}

/* Type Grid */
.type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
}

.type-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 6px;
  border: 1px solid var(--ion-color-light-shade);
  border-radius: 8px;
  background: var(--ion-color-light);
  cursor: pointer;
  font-size: 12px;
  color: var(--ion-color-dark);
  transition: all 0.2s;
}

.type-button ion-icon {
  font-size: 20px;
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
  padding: 8px 4px;
  font-size: 11px;
  opacity: 0.85;
}

.type-button.secondary ion-icon {
  font-size: 16px;
}

.more-types-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  padding: 6px 12px;
  border: none;
  background: none;
  color: var(--ion-color-medium);
  font-size: 13px;
  cursor: pointer;
}

.more-types-toggle ion-icon {
  font-size: 14px;
}

.secondary-types {
  margin-top: 8px;
}

/* Title Autocomplete */
.title-section {
  position: relative;
}

.title-autocomplete-wrapper {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 10;
}

.title-suggestions {
  background: var(--ion-background-color, #fff);
  border: 1px solid var(--ion-color-light-shade);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 200px;
  overflow-y: auto;
}

.suggestion-loading {
  display: flex;
  justify-content: center;
  padding: 12px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--ion-color-light);
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover {
  background: var(--ion-color-light-tint);
}

.suggestion-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.suggestion-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--ion-color-dark);
}

.suggestion-reference {
  font-size: 12px;
  color: var(--ion-color-medium);
}

/* Form Items */
.form-item {
  --background: var(--ion-color-light);
  --border-radius: 8px;
  --padding-start: 12px;
  --padding-end: 12px;
}

/* Resource Link */
.resource-link-section {
  margin: 4px 0;
}

.linked-resource-card {
  padding: 12px;
  background: var(--ion-color-light);
  border-radius: 8px;
  border: 1px solid var(--ion-color-light-shade);
}

.linked-resource-info h4 {
  margin: 0 0 6px 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--ion-color-dark);
}

.linked-resource-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin-bottom: 6px;
}

.linked-resource-collection {
  font-size: 12px;
  color: var(--ion-color-primary);
  font-weight: 500;
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

.linked-resource-music {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.music-prop-tag {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--ion-color-primary-tint);
  color: var(--ion-color-primary-shade);
}

.linked-resource-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

/* Scripture */
.scripture-section {
  margin: 4px 0;
}

.fetch-scripture-btn {
  margin-top: 8px;
}

.scripture-preview {
  margin-top: 12px;
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

.scripture-reference {
  font-weight: 600;
  font-size: 14px;
  color: var(--ion-color-dark);
}

.scripture-version {
  font-size: 12px;
  color: var(--ion-color-medium);
  background: var(--ion-color-light-shade);
  padding: 2px 6px;
  border-radius: 4px;
}

.scripture-text {
  font-size: 14px;
  line-height: 1.6;
  color: var(--ion-color-dark);
}

.scripture-text :deep(sup) {
  color: var(--ion-color-primary);
  font-weight: 600;
  font-size: 10px;
  margin-right: 2px;
}

/* Participants & Duration */
.participants-section,
.duration-section {
  margin: 4px 0;
}

/* Advanced Options */
.advanced-options-accordion {
  margin-top: 8px;
}

.advanced-content {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
