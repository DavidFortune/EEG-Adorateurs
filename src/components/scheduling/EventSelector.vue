<template>
  <div class="event-selector">
    <div class="event-tabs-container">
      <div 
        v-for="(event, index) in events" 
        :key="event.id"
        class="event-tab"
        :class="{ active: index === activeEventIndex }"
        @click="$emit('select', index)"
      >
        <div class="event-title">{{ truncateTitle(event.title) }}</div>
        <div class="event-datetime">
          <div class="event-date">{{ event.date }}</div>
          <div class="event-time">{{ event.time }}</div>
        </div>
        <ion-badge :color="getStatusColor(event.status)" class="event-status">
          {{ getStatusLabel(event.status) }}
        </ion-badge>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonBadge } from '@ionic/vue';
import type { SchedulingEvent, EventStatus } from '@/types/scheduling';

interface Props {
  events: SchedulingEvent[];
  activeEventIndex: number;
}

defineProps<Props>();
defineEmits<{
  select: [index: number];
}>();

function truncateTitle(title: string): string {
  return title.length > 20 ? title.substring(0, 17) + '...' : title;
}

function getStatusColor(status: EventStatus): string {
  switch (status) {
    case 'brouillon': return 'primary';
    case 'confirmé': return 'success';
    case 'annulé': return 'danger';
    default: return 'medium';
  }
}

function getStatusLabel(status: EventStatus): string {
  return status;
}
</script>

<style scoped>
.event-selector {
  padding: 16px;
  background: var(--ion-color-light);
}

.event-tabs-container {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.event-tabs-container::-webkit-scrollbar {
  display: none;
}

.event-tab {
  min-width: 140px;
  flex-shrink: 0;
  padding: 12px;
  border-radius: 16px;
  border: 2px solid var(--ion-color-light-shade);
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.event-tab:hover {
  border-color: var(--ion-color-medium);
  transform: translateY(-1px);
}

.event-tab.active {
  background: var(--ion-color-dark);
  color: white;
  border-color: var(--ion-color-dark);
}

.event-title {
  font-weight: 600;
  font-size: 0.875rem;
  line-height: 1.2;
}

.event-datetime {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  opacity: 0.8;
}

.event-date {
  font-weight: 500;
}

.event-time {
  font-weight: 400;
}

.event-status {
  align-self: flex-start;
  font-size: 0.6875rem;
  padding: 2px 6px;
}

.event-tab.active .event-status {
  --ion-color-primary: white;
  --ion-color-success: white;
  --ion-color-danger: white;
  color: var(--ion-color-dark) !important;
  background: white !important;
}
</style>