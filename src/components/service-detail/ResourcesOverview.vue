<template>
  <div class="resources-overview">
    <!-- Summary Row (always visible) -->
    <div class="resources-summary">
      <div class="summary-info">
        <ion-icon :icon="folderOutline" />
        <span>{{ resources.length }} ressource{{ resources.length !== 1 ? 's' : '' }}</span>
      </div>
      <ion-button v-if="isAdmin" fill="clear" size="small" @click="openAddModal">
        <ion-icon :icon="addOutline" slot="start" />
        Ajouter
      </ion-button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <ion-spinner name="crescent" />
      <span>Chargement des ressources...</span>
    </div>

    <!-- Empty State -->
    <div v-else-if="resources.length === 0" class="empty-state">
      <ion-icon :icon="folderOpenOutline" size="large" color="medium" />
      <h3>Aucune ressource</h3>
      <p>Ce service n'a pas de ressources associées.</p>
    </div>

    <!-- Resources List -->
    <div v-else class="resources-list">
      <div
        v-for="resource in resources"
        :key="resource.id"
        class="resource-item"
        @click="goToResource(resource.id)"
      >
        <div class="resource-icon">
          <ion-icon :icon="getResourceIcon(resource)" :color="getResourceColor(resource)" />
        </div>
        <div class="resource-content">
          <div class="resource-header">
            <span class="resource-title-row">
              <span class="resource-title">{{ resource.title }}</span>
              <ion-icon
                v-if="resource.isDirect"
                :icon="linkOutline"
                class="direct-icon"
                color="tertiary"
              />
            </span>
            <ion-chip :color="getResourceColor(resource)" size="small" class="type-chip">
              {{ getResourceTypeLabel(resource) }}
            </ion-chip>
          </div>
          <p v-if="resource.collectionName" class="resource-subtitle">
            {{ resource.collectionName }}
          </p>
        </div>
      </div>
    </div>

    <!-- Resource Selector (modal only mode) -->
    <ResourceSelector
      :is-open="isModalOpen"
      :multiple="true"
      :modal-only="true"
      :exclude-ids="existingResourceIds"
      @update:is-open="isModalOpen = $event"
      @confirm="handleResourcesConfirmed"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonSpinner, IonIcon, IonChip, IonButton
} from '@ionic/vue';
import {
  folderOpenOutline,
  folderOutline,
  musicalNotesOutline,
  videocamOutline,
  documentTextOutline,
  logoYoutube,
  musicalNoteOutline,
  documentOutline,
  addOutline,
  linkOutline
} from 'ionicons/icons';
import type { Resource, ResourceType } from '@/types/resource';
import ResourceSelector from '@/components/ResourceSelector.vue';

const router = useRouter();

interface ResourceWithCollection extends Resource {
  collectionName?: string;
  isDirect?: boolean; // true if directly associated with service, false if from program
}

interface Props {
  resources: ResourceWithCollection[];
  loading: boolean;
  serviceId: string;
  isAdmin: boolean;
  existingResourceIds: string[]; // IDs already associated (to filter out from modal)
}

const props = defineProps<Props>();

const emit = defineEmits<{
  addResources: [resourceIds: string[]];
}>();

// Modal state
const isModalOpen = ref(false);

const goToResource = (resourceId: string) => {
  router.push(`/resource-detail/${resourceId}`);
};

const openAddModal = () => {
  isModalOpen.value = true;
};

const handleResourcesConfirmed = (resourceIds: string[]) => {
  if (resourceIds.length > 0) {
    emit('addResources', resourceIds);
  }
};

const getResourceIcon = (resource: Resource): string => {
  if (!resource.contents || resource.contents.length === 0) return documentOutline;

  const primaryType = resource.contents[0].type;
  const icons: Record<ResourceType, string> = {
    'lyrics': documentTextOutline,
    'video': videocamOutline,
    'audio': musicalNotesOutline,
    'music_sheet': documentOutline,
    'youtube': logoYoutube,
    'spotify': musicalNoteOutline,
    'file': documentOutline
  };
  return icons[primaryType] || documentOutline;
};

const getResourceColor = (resource: Resource): string => {
  if (!resource.contents || resource.contents.length === 0) return 'medium';

  const primaryType = resource.contents[0].type;
  const colors: Record<ResourceType, string> = {
    'lyrics': 'primary',
    'video': 'danger',
    'audio': 'success',
    'music_sheet': 'warning',
    'youtube': 'danger',
    'spotify': 'success',
    'file': 'medium'
  };
  return colors[primaryType] || 'medium';
};

const getResourceTypeLabel = (resource: Resource): string => {
  if (!resource.contents || resource.contents.length === 0) return 'Fichier';

  const primaryType = resource.contents[0].type;
  const labels: Record<ResourceType, string> = {
    'lyrics': 'Paroles',
    'video': 'Vidéo',
    'audio': 'Audio',
    'music_sheet': 'Partition',
    'youtube': 'YouTube',
    'spotify': 'Spotify',
    'file': 'Fichier'
  };
  return labels[primaryType] || 'Fichier';
};
</script>

<style scoped>
.resources-overview {
  padding: 16px;
}

.resources-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: white;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.summary-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--ion-color-dark);
}

.summary-info ion-icon {
  font-size: 1rem;
  color: var(--ion-color-primary);
}

.resources-summary ion-button {
  --padding-start: 10px;
  --padding-end: 10px;
  font-size: 0.8rem;
  font-weight: 500;
  height: 32px;
  margin: 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  gap: 12px;
  color: var(--ion-color-medium);
}

.empty-state {
  text-align: center;
  padding: 32px 16px;
}

.empty-state ion-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-state h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--ion-color-dark);
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 0.9rem;
  color: var(--ion-color-medium);
  margin: 0;
}

.resources-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.resource-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: var(--ion-color-light);
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.resource-item:active {
  background: var(--ion-color-light-shade);
}

.resource-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 8px;
  flex-shrink: 0;
}

.resource-icon ion-icon {
  font-size: 1.25rem;
}

.resource-content {
  flex: 1;
  min-width: 0;
}

.resource-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.resource-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.resource-title {
  font-weight: 600;
  color: var(--ion-color-dark);
  font-size: 0.95rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.direct-icon {
  font-size: 0.85rem;
  flex-shrink: 0;
}

.type-chip {
  height: 22px;
  font-size: 0.7rem;
  --padding-start: 6px;
  --padding-end: 6px;
  margin: 0;
  flex-shrink: 0;
}

.resource-subtitle {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  margin: 4px 0 0 0;
}
</style>
