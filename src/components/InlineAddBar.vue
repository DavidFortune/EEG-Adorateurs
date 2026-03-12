<template>
  <div class="inline-add-bar">
    <!-- Label -->
    <div class="add-bar-label">
      Ajouter un élément
    </div>

    <!-- Title Input -->
    <div class="input-row">
      <div class="input-wrapper">
        <ion-input
          ref="titleInputRef"
          v-model="titleText"
          placeholder="Titre de l'élément..."
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
  arrowForwardOutline, sparklesOutline, addCircleOutline
} from 'ionicons/icons';
import type { Resource } from '@/types/resource';
import { getSmartSuggestions } from '@/utils/resource-suggestions';
import ResourceSelector from '@/components/ResourceSelector.vue';

interface Props {
  allResources: Resource[];
  serviceId: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  add: [data: { title: string, resourceId?: string }];
  linkResource: [itemId: string, resourceId: string];
}>();

// State
const titleText = ref('');
const showSuggestions = ref(false);
const searching = ref(false);
const titleInputRef = ref<InstanceType<typeof IonInput> | null>(null);

// Resource selector state
const showResourceSelector = ref(false);
const pendingCreateTitle = ref('');
const pendingResourceId = ref<string | null>(null);
const lastCreatedItemId = ref<string | null>(null);

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const suggestions = computed(() => {
  if (!titleText.value || titleText.value.length < 2) return [];
  return getSmartSuggestions('', titleText.value, props.allResources);
});

const handleEnter = () => {
  if (!titleText.value.trim()) return;
  showSuggestions.value = false;
  emit('add', { title: titleText.value.trim() });
  titleText.value = '';
  setTimeout(() => titleInputRef.value?.$el?.setFocus(), 100);
};

const selectSuggestion = (resource: Resource) => {
  showSuggestions.value = false;
  emit('add', {
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

  emit('add', { title });

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

const handleTitleInput = () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  if (titleText.value && titleText.value.length >= 2) {
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
  setTimeout(() => {
    showSuggestions.value = false;
  }, 200);
};

const handleInputFocus = () => {
  if (titleText.value && titleText.value.length >= 2) {
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
  .inline-add-bar {
    padding: 12px;
    padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  }

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
