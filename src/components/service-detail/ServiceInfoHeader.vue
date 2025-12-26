<template>
  <div class="service-info-header">
    <div class="chips-row">
      <ion-chip :color="getCategoryColor(service.category)" size="small">
        {{ service.category }}
      </ion-chip>
      <ion-chip :color="service.isPublished ? 'success' : 'warning'" size="small">
        <ion-icon :icon="service.isPublished ? checkmarkCircle : timeOutline" />
        <ion-label>{{ service.isPublished ? 'Publié' : 'Brouillon' }}</ion-label>
      </ion-chip>
    </div>

    <h1 class="service-title">{{ service.title }}</h1>

    <p class="service-datetime">
      <ion-icon :icon="calendarOutline" />
      <span>{{ formattedDateTime }}</span>
      <span v-if="duration" class="duration">({{ duration }})</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IonChip, IonIcon, IonLabel } from '@ionic/vue';
import { calendarOutline, checkmarkCircle, timeOutline } from 'ionicons/icons';
import { timezoneUtils } from '@/utils/timezone';
import type { Service, ServiceCategory } from '@/types/service';

interface Props {
  service: Service;
}

const props = defineProps<Props>();

const getCategoryColor = (category: ServiceCategory) => {
  return category === 'Service' ? 'primary' : 'secondary';
};

const formattedDateTime = computed(() => {
  return timezoneUtils.formatDateTimeForDisplay(props.service.date, props.service.time);
});

const duration = computed(() => {
  if (!props.service.endDate || !props.service.endTime) return null;

  const start = new Date(`${props.service.date}T${props.service.time}:00`);
  const end = new Date(`${props.service.endDate}T${props.service.endTime}:00`);
  const diffMs = end.getTime() - start.getTime();

  if (diffMs <= 0) return null;

  const diffMins = Math.round(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h${mins}`;
});
</script>

<style scoped>
.service-info-header {
  padding: 16px;
  background: var(--ion-color-light);
  border-bottom: 1px solid var(--ion-color-light-shade);
}

.chips-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.chips-row ion-chip {
  margin: 0;
  height: 28px;
}

.service-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ion-color-dark);
  margin: 0 0 8px 0;
  line-height: 1.3;
}

.service-datetime {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--ion-color-medium);
  font-size: 0.95rem;
  margin: 0;
}

.service-datetime ion-icon {
  font-size: 1.1rem;
}

.duration {
  color: var(--ion-color-primary);
  font-weight: 500;
}
</style>
