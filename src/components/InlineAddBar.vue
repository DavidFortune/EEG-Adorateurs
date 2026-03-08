<template>
  <div class="inline-add-bar">
    <!-- Label -->
    <div class="add-bar-label">
      {{ parentItemId ? 'Ajouter un sous-élément' : 'Ajouter un élément' }}
    </div>

    <!-- Type Icon Row -->
    <div class="type-row">
      <button
        v-for="t in primaryTypes"
        :key="t.value"
        class="type-icon-btn"
        :class="{ active: selectedType === t.value }"
        @click="selectType(t.value)"
        :title="t.label"
      >
        <ion-icon :icon="t.icon" />
      </button>
      <button
        v-if="!parentItemId"
        class="type-icon-btn section-btn"
        @click="emit('addSection')"
        title="Section"
      >
        <ion-icon :icon="removeOutline" />
      </button>
    </div>

    <!-- Title Input -->
    <div class="input-row">
      <div class="input-wrapper">
        <ion-input
          ref="titleInputRef"
          v-model="titleText"
          :placeholder="inputPlaceholder"
          class="title-input"
          @keydown.enter="handleEnter"
          @ionInput="handleTitleInput"
          @ionBlur="handleInputBlur"
          @ionFocus="handleInputFocus"
        />
        <button
          v-if="titleText.trim()"
          class="submit-btn"
          @click="handleEnter"
        >
          <ion-icon :icon="arrowForwardOutline" />
        </button>
      </div>

      <!-- Suggestions Dropdown -->
      <div v-if="showSuggestions" class="suggestions-dropdown" tabindex="-1">
        <div v-if="searching" class="suggestion-loading">
          <ion-spinner name="dots" color="primary" />
        </div>
        <template v-else>
          <div
            v-for="resource in suggestions"
            :key="resource.id"
            class="suggestion-item"
            @mousedown.prevent="selectSuggestion(resource)"
            @touchstart.prevent="selectSuggestion(resource)"
          >
            <div class="suggestion-info">
              <span class="suggestion-title">{{ resource.title }}</span>
              <span v-if="resource.reference" class="suggestion-reference">{{ resource.reference }}</span>
            </div>
            <ion-icon :icon="sparklesOutline" color="primary" />
          </div>

          <!-- Sticky Create Option -->
          <div
            v-if="titleText.trim().length >= 2"
            class="suggestion-item create-option"
            @mousedown.prevent="handleCreateResource"
            @touchstart.prevent="handleCreateResource"
          >
            <div class="suggestion-info">
              <span class="create-label">Créer "{{ titleText.trim() }}" comme ressource</span>
            </div>
            <ion-icon :icon="addCircleOutline" color="medium" />
          </div>
        </template>
      </div>
    </div>

    <!-- Scripture Reference (for Prédication) -->
    <div v-if="isSermonType" class="input-row scripture-ref-input">
      <div class="input-wrapper">
        <ion-icon :icon="libraryOutline" class="field-icon" />
        <ion-input
          v-model="scriptureRef"
          placeholder="Passage biblique (ex: Jean 3:16)..."
          class="title-input"
          @keydown.enter="handleScriptureEnter"
        />
      </div>
    </div>

    <!-- Resource Selector Modal (for sticky create) -->
    <ResourceSelector
      v-model="pendingResourceId"
      :modal-only="true"
      :is-open="showResourceSelector"
      :initial-title="pendingCreateTitle"
      :initial-mode="'create'"
      @update:is-open="handleResourceSelectorClose"
      @update:model-value="handleResourceLinked"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { IonInput, IonIcon, IonSpinner } from '@ionic/vue';
import {
  musicalNoteOutline, handLeftOutline, libraryOutline, micOutline,
  arrowForwardOutline, sparklesOutline, addCircleOutline,
  documentTextOutline, removeOutline
} from 'ionicons/icons';
import { ProgramItemType } from '@/types/program';
import type { Resource } from '@/types/resource';
import { getSmartSuggestions } from '@/utils/resource-suggestions';
import ResourceSelector from '@/components/ResourceSelector.vue';

interface Props {
  parentItemId?: string | null;
  allResources: Resource[];
  serviceId: string;
}

const props = withDefaults(defineProps<Props>(), {
  parentItemId: null
});

const emit = defineEmits<{
  add: [data: { type: ProgramItemType | '', title: string, resourceId?: string, scriptureReference?: string }];
  linkResource: [itemId: string, resourceId: string];
  addSection: [];
}>();

const primaryTypes = [
  { value: ProgramItemType.TITLE, label: 'Titre', icon: documentTextOutline },
  { value: ProgramItemType.SONG, label: 'Chant', icon: musicalNoteOutline },
  { value: ProgramItemType.PRAYER, label: 'Prière', icon: handLeftOutline },
  { value: ProgramItemType.SCRIPTURE, label: 'Lecture', icon: libraryOutline },
  { value: ProgramItemType.SERMON, label: 'Prédication', icon: micOutline },
];

// State
const selectedType = ref<ProgramItemType | ''>(ProgramItemType.TITLE);
const titleText = ref('');
const scriptureRef = ref('');
const showSuggestions = ref(false);
const searching = ref(false);
const titleInputRef = ref<InstanceType<typeof IonInput> | null>(null);

// Resource selector state
const showResourceSelector = ref(false);
const pendingCreateTitle = ref('');
const pendingResourceId = ref<string | null>(null);
const lastCreatedItemId = ref<string | null>(null);

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const inputPlaceholder = computed(() => {
  if (props.parentItemId) return 'Ajouter un sous-élément...';
  if (selectedType.value === ProgramItemType.TITLE) return 'Titre de l\'élément...';
  if (selectedType.value === ProgramItemType.SONG) return 'Titre du chant...';
  if (selectedType.value === ProgramItemType.PRAYER) return 'Titre de la prière...';
  if (selectedType.value === ProgramItemType.SCRIPTURE) return 'Référence biblique...';
  if (selectedType.value === ProgramItemType.SERMON) return 'Titre de la prédication...';
  return 'Titre de l\'élément...';
});

const suggestions = computed(() => {
  if (!titleText.value || titleText.value.length < 2) return [];
  return getSmartSuggestions(selectedType.value || '', titleText.value, props.allResources);
});

const selectType = (type: ProgramItemType) => {
  selectedType.value = type;
  if (type !== ProgramItemType.SONG) {
    showSuggestions.value = false;
  }
  titleInputRef.value?.$el?.setFocus();
};

const handleEnter = () => {
  if (!titleText.value.trim()) return;
  // For sermon, if title filled but scripture field empty, focus scripture field
  if (isSermonType.value && !scriptureRef.value && titleText.value.trim()) {
    setTimeout(() => {
      const el = document.querySelector('.scripture-ref-input ion-input');
      if (el) (el as any).setFocus();
    }, 50);
    return;
  }
  showSuggestions.value = false;
  const data: { type: ProgramItemType | '', title: string, scriptureReference?: string } = {
    type: props.parentItemId ? selectedType.value : (selectedType.value || ProgramItemType.TITLE),
    title: titleText.value.trim(),
  };
  if (isSermonType.value && scriptureRef.value.trim()) {
    data.scriptureReference = scriptureRef.value.trim();
  }
  emit('add', data);
  titleText.value = '';
  scriptureRef.value = '';
  // Re-focus after next tick
  setTimeout(() => titleInputRef.value?.$el?.setFocus(), 100);
};

const selectSuggestion = (resource: Resource) => {
  showSuggestions.value = false;
  emit('add', {
    type: props.parentItemId ? selectedType.value : (selectedType.value || ProgramItemType.TITLE),
    title: resource.title,
    resourceId: resource.id,
  });
  titleText.value = '';
  setTimeout(() => titleInputRef.value?.$el?.setFocus(), 100);
};

const handleCreateResource = () => {
  if (!titleText.value.trim()) return;
  const title = titleText.value.trim();
  showSuggestions.value = false;

  // Create the item first
  emit('add', {
    type: props.parentItemId ? selectedType.value : (selectedType.value || ProgramItemType.TITLE),
    title,
  });

  // Then open ResourceSelector in create mode
  pendingCreateTitle.value = title;
  titleText.value = '';
  showResourceSelector.value = true;
};

const handleResourceSelectorClose = (isOpen: boolean) => {
  showResourceSelector.value = isOpen;
};

const handleResourceLinked = (resourceId: string | null) => {
  if (resourceId) {
    emit('linkResource', lastCreatedItemId.value || '', resourceId);
  }
  showResourceSelector.value = false;
};

// Expose method for parent to set lastCreatedItemId
const setLastCreatedItemId = (id: string) => {
  lastCreatedItemId.value = id;
};

const isSongType = computed(() => selectedType.value === ProgramItemType.SONG);
const isSermonType = computed(() => selectedType.value === ProgramItemType.SERMON);

const handleScriptureEnter = () => {
  handleEnter();
};

const handleTitleInput = () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  if (isSongType.value && titleText.value && titleText.value.length >= 2) {
    searching.value = true;
    debounceTimer = setTimeout(() => {
      showSuggestions.value = true;
      searching.value = false;
    }, 300);
  } else {
    showSuggestions.value = false;
    searching.value = false;
  }
};

const handleInputBlur = (event: CustomEvent<FocusEvent>) => {
  const relatedTarget = (event.detail?.relatedTarget ?? (event as any).relatedTarget) as HTMLElement | null;
  if (relatedTarget?.closest('.suggestions-dropdown')) return;
  // Delay to allow click events on suggestions
  setTimeout(() => {
    showSuggestions.value = false;
  }, 200);
};

const handleInputFocus = () => {
  if (isSongType.value && titleText.value && titleText.value.length >= 2) {
    showSuggestions.value = true;
  }
};

defineExpose({ setLastCreatedItemId });
</script>

<style scoped>
.inline-add-bar {
  padding: 12px;
  background: var(--ion-color-light);
  border-radius: 12px;
  border: 2px dashed var(--ion-color-light-shade);
}

.add-bar-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--ion-color-medium);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.type-row {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.type-row.secondary {
  margin-top: 4px;
}

.type-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--ion-color-light-shade);
  background: var(--ion-background-color, #fff);
  cursor: pointer;
  transition: all 0.15s;
  padding: 0;
}

.type-icon-btn ion-icon {
  font-size: 18px;
  color: var(--ion-color-medium);
}

.type-icon-btn.active {
  border-color: var(--ion-color-primary);
  background: var(--ion-color-primary-tint);
}

.type-icon-btn.active ion-icon {
  color: var(--ion-color-primary);
}

.type-icon-btn.secondary {
  width: auto;
  padding: 0 10px;
  gap: 4px;
}

.type-label {
  font-size: 11px;
  color: var(--ion-color-medium);
}

.type-icon-btn.secondary.active .type-label {
  color: var(--ion-color-primary);
}

.section-btn {
  border-style: dashed;
}

.more-btn ion-icon {
  font-size: 16px;
}

.input-row {
  position: relative;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--ion-background-color, #fff);
  border-radius: 8px;
  border: 1px solid var(--ion-color-light-shade);
  padding-right: 4px;
}

.field-icon {
  margin-left: 12px;
  color: var(--ion-color-medium);
  font-size: 1.1rem;
  flex-shrink: 0;
}

.scripture-ref-input {
  margin-top: 6px;
}

.title-input {
  flex: 1;
  --padding-start: 12px;
  --padding-end: 4px;
  font-size: 14px;
}

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: var(--ion-color-primary);
  cursor: pointer;
  flex-shrink: 0;
}

.submit-btn ion-icon {
  font-size: 16px;
  color: white;
}

/* Suggestions Dropdown */
.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 10;
  background: var(--ion-background-color, #fff);
  border: 1px solid var(--ion-color-light-shade);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 240px;
  overflow-y: auto;
  margin-top: 4px;
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

.suggestion-item:active {
  background: var(--ion-color-light-tint);
}

.suggestion-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
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

/* Sticky Create Option */
.create-option {
  border-top: 1px solid var(--ion-color-light-shade);
  background: var(--ion-color-light);
}

.create-label {
  font-size: 13px;
  color: var(--ion-color-medium-shade);
  font-style: italic;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  /* Task 9.1: Increased vertical padding */
  .inline-add-bar {
    padding: 12px;
    padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  }

  /* Task 9.2: Type selector touch targets */
  .type-icon-btn {
    width: 44px;
    height: 44px;
  }

  /* Task 9.3: Text input minimum height */
  .title-input {
    min-height: 44px;
  }

  .input-wrapper {
    min-height: 44px;
  }

  .submit-btn {
    width: 36px;
    height: 36px;
  }
}
</style>
