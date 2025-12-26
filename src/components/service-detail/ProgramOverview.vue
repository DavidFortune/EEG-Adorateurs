<template>
  <div class="program-overview">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <ion-spinner name="crescent" />
      <span>Chargement du programme...</span>
    </div>

    <!-- Content (with summary always visible) -->
    <div v-else class="program-list">
      <!-- Summary Row (always visible) -->
      <div class="program-summary">
        <div class="summary-info">
          <template v-if="hasProgram">
            <span v-if="program?.conductor?.name" class="summary-item">
              <ion-icon :icon="personOutline" />
              {{ program.conductor.name }}
            </span>
            <span class="summary-item hide-mobile">
              <ion-icon :icon="listOutline" />
              {{ itemCount }} élément{{ itemCount !== 1 ? 's' : '' }}
            </span>
            <span v-if="program?.totalDuration" class="summary-item hide-mobile">
              <ion-icon :icon="timeOutline" />
              {{ formatDuration(program.totalDuration) }}
            </span>
          </template>
          <span v-else class="summary-item empty-hint">
            <ion-icon :icon="documentTextOutline" />
            Aucun programme
          </span>
        </div>
        <ion-button fill="clear" size="small" @click="$emit('viewFull')">
          {{ hasProgram ? 'Programme détaillé' : (isAdmin ? 'Créer le programme' : 'Voir le programme') }}
          <ion-icon :icon="chevronForwardOutline" slot="end" />
        </ion-button>
      </div>

      <!-- Empty State (below summary) -->
      <div v-if="!hasProgram" class="empty-state">
        <ion-icon :icon="documentTextOutline" size="large" color="medium" />
        <h3>Aucun programme</h3>
        <p>Le programme de ce service n'a pas encore été créé.</p>
      </div>

      <!-- Program Items -->
      <template v-else v-for="(item, index) in sortedItems" :key="item.id">
        <!-- Section Item (special styling) -->
        <div v-if="item.type === 'Section'" class="program-item section-item">
          <span class="section-title">{{ item.title }}</span>
        </div>

        <!-- Regular Item -->
        <div v-else class="program-item">
          <div class="item-number">{{ getItemNumber(index) }}</div>
          <div class="item-content">
            <div class="item-header">
              <span class="item-title-row">
                <span class="item-title">{{ item.title }}</span>
                <span v-if="item.participant?.name" class="item-subtitle">- {{ item.participant.name }}</span>
                <span v-else-if="item.subtitle" class="item-subtitle">- {{ item.subtitle }}</span>
              </span>
              <ion-chip :color="getTypeColor(item.type)" size="small" class="type-chip">
                {{ item.type }}
              </ion-chip>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IonSpinner, IonIcon, IonChip, IonButton } from '@ionic/vue';
import { documentTextOutline, personOutline, listOutline, timeOutline, chevronForwardOutline } from 'ionicons/icons';
import type { ServiceProgram, ProgramItemType } from '@/types/program';

interface Props {
  program: ServiceProgram | null;
  loading: boolean;
  isAdmin: boolean;
}

const props = defineProps<Props>();

defineEmits<{
  viewFull: [];
}>();

const hasProgram = computed(() => {
  return props.program && props.program.items.length > 0;
});

const itemCount = computed(() => {
  if (!props.program) return 0;
  return props.program.items.filter(item => item.type !== 'Section').length;
});

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h${mins}`;
};

const sortedItems = computed(() => {
  if (!props.program) return [];
  return [...props.program.items].sort((a, b) => a.order - b.order);
});

// Get item number excluding sections from count
const getItemNumber = (index: number): number => {
  let count = 0;
  for (let i = 0; i <= index; i++) {
    if (sortedItems.value[i].type !== 'Section') {
      count++;
    }
  }
  return count;
};

const getTypeColor = (type: ProgramItemType): string => {
  const colors: Record<string, string> = {
    'Chant': 'primary',
    'Prière': 'tertiary',
    'Lecture biblique': 'success',
    'Prédication': 'warning',
    'Titre': 'medium',
    'Section': 'secondary'
  };
  return colors[type] || 'medium';
};
</script>

<style scoped>
.program-overview {
  padding: 16px;
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

.program-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.program-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: white;
  border-radius: 12px;
  margin-bottom: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.summary-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8rem;
  color: var(--ion-color-dark);
  font-weight: 500;
}

.summary-item ion-icon {
  font-size: 0.85rem;
  color: var(--ion-color-primary);
}

.summary-item.empty-hint {
  color: var(--ion-color-medium);
}

.summary-item.empty-hint ion-icon {
  color: var(--ion-color-medium);
}

.program-summary ion-button {
  --padding-start: 10px;
  --padding-end: 10px;
  font-size: 0.8rem;
  font-weight: 500;
  height: 32px;
  margin: 0;
  --color: var(--ion-color-primary);
}

/* Hide on mobile devices */
@media (max-width: 576px) {
  .hide-mobile {
    display: none;
  }
}

.program-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: var(--ion-color-light);
  border-radius: 12px;
}

/* Section Item Styling */
.section-item {
  background: var(--ion-color-danger);
  justify-content: center;
  padding: 10px 12px;
}

.section-title {
  color: white;
  font-weight: 600;
  font-size: 0.95rem;
  text-align: center;
}

.item-number {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ion-color-primary);
  color: white;
  font-weight: 600;
  font-size: 0.85rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.item-title-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.item-title {
  font-weight: 600;
  color: var(--ion-color-dark);
  font-size: 0.95rem;
}

.item-subtitle {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
}

.type-chip {
  height: 22px;
  font-size: 0.7rem;
  --padding-start: 6px;
  --padding-end: 6px;
  margin: 0;
  flex-shrink: 0;
}
</style>
