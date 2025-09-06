<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/services"></ion-back-button>
        </ion-buttons>
        <ion-title>Programme du service</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="showEditModal" fill="clear">
            <ion-icon :icon="createOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content :fullscreen="true">
      <ion-loading :is-open="loading" message="Chargement..."></ion-loading>
      
      <!-- Service Header -->
      <div v-if="service" class="service-header">
        <div class="service-info-card">
          <h2 class="service-title">{{ service.title }}</h2>
          <p class="service-datetime">
            <ion-icon :icon="calendarOutline" />
            {{ formatDateTime(service.date, service.time) }}
          </p>
        </div>
      </div>
      
      <div class="content-container">
        <!-- Program Summary -->
        <div v-if="program && program.items.length > 0" class="program-summary">
          <ion-card>
            <ion-card-content>
              <div class="summary-stats">
                <div class="stat-item">
                  <ion-icon :icon="listOutline" class="stat-icon" />
                  <div class="stat-details">
                    <span class="stat-value">{{ program.items.length }}</span>
                    <span class="stat-label">Éléments</span>
                  </div>
                </div>
                <div class="stat-item">
                  <ion-icon :icon="timeOutline" class="stat-icon" />
                  <div class="stat-details">
                    <span class="stat-value">{{ formatDuration(program.totalDuration) }}</span>
                    <span class="stat-label">Durée estimée</span>
                  </div>
                </div>
                <div class="stat-item">
                  <ion-icon :icon="layersOutline" class="stat-icon" />
                  <div class="stat-details">
                    <span class="stat-value">{{ program.sections.length || 1 }}</span>
                    <span class="stat-label">{{ program.sections.length > 1 ? 'Sections' : 'Section' }}</span>
                  </div>
                </div>
              </div>
            </ion-card-content>
          </ion-card>
        </div>
        
        <!-- Program Items -->
        <div v-if="program && program.items.length > 0" class="program-content">
          <!-- Render by sections if they exist -->
          <div v-if="program.sections.length > 0" class="sections-view">
            <div v-for="section in sortedSections" :key="section.id" class="program-section">
              <div class="section-header">
                <h3 class="section-title">{{ section.title }}</h3>
                <div class="section-stats">
                  {{ getSectionItemsCount(section.id) }} éléments
                  • {{ formatDuration(getSectionDuration(section.id)) }}
                </div>
              </div>
              
              <div class="section-items">
                <div 
                  v-for="item in getSectionItems(section.id)" 
                  :key="item.id"
                  class="program-item"
                  :class="`item-${item.type.toLowerCase().replace(/\s+/g, '-')}`"
                >
                  <div class="item-header">
                    <div class="item-order">{{ item.order }}</div>
                    <div class="item-info">
                      <div class="item-type">
                        <ion-icon :icon="getItemIcon(item.type)" />
                        {{ item.type }}
                      </div>
                      <h4 class="item-title">{{ item.title }}</h4>
                      <p v-if="item.subtitle" class="item-subtitle">{{ item.subtitle }}</p>
                    </div>
                    <div class="item-meta">
                      <div v-if="item.duration" class="item-duration">
                        <ion-icon :icon="timeOutline" />
                        {{ item.duration }}min
                      </div>
                      <div v-if="item.participant" class="item-participant">
                        <ion-icon :icon="personOutline" />
                        {{ item.participant.name }}
                        <span v-if="item.participant.role" class="participant-role">({{ item.participant.role }})</span>
                      </div>
                    </div>
                  </div>
                  
                  <div v-if="item.reference || item.notes" class="item-details">
                    <div v-if="item.reference" class="item-reference">
                      <ion-icon :icon="bookOutline" />
                      {{ item.reference }}
                    </div>
                    <div v-if="item.notes" class="item-notes">
                      <ion-icon :icon="documentTextOutline" />
                      {{ item.notes }}
                    </div>
                  </div>
                  
                  <div v-if="item.lyrics" class="item-lyrics">
                    <ion-button 
                      @click="showLyrics(item)" 
                      fill="clear" 
                      size="small"
                      class="lyrics-button"
                    >
                      <ion-icon :icon="musicalNotesOutline" slot="start" />
                      Voir les paroles
                    </ion-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Render without sections -->
          <div v-else class="items-view">
            <div 
              v-for="item in sortedItems" 
              :key="item.id"
              class="program-item"
              :class="`item-${item.type.toLowerCase().replace(/\s+/g, '-')}`"
            >
              <div class="item-header">
                <div class="item-order">{{ item.order }}</div>
                <div class="item-info">
                  <div class="item-type">
                    <ion-icon :icon="getItemIcon(item.type)" />
                    {{ item.type }}
                  </div>
                  <h4 class="item-title">{{ item.title }}</h4>
                  <p v-if="item.subtitle" class="item-subtitle">{{ item.subtitle }}</p>
                </div>
                <div class="item-meta">
                  <div v-if="item.duration" class="item-duration">
                    <ion-icon :icon="timeOutline" />
                    {{ item.duration }}min
                  </div>
                  <div v-if="item.participant" class="item-participant">
                    <ion-icon :icon="personOutline" />
                    {{ item.participant.name }}
                    <span v-if="item.participant.role" class="participant-role">({{ item.participant.role }})</span>
                  </div>
                </div>
              </div>
              
              <div v-if="item.reference || item.notes" class="item-details">
                <div v-if="item.reference" class="item-reference">
                  <ion-icon :icon="bookOutline" />
                  {{ item.reference }}
                </div>
                <div v-if="item.notes" class="item-notes">
                  <ion-icon :icon="documentTextOutline" />
                  {{ item.notes }}
                </div>
              </div>
              
              <div v-if="item.lyrics" class="item-lyrics">
                <ion-button 
                  @click="showLyrics(item)" 
                  fill="clear" 
                  size="small"
                  class="lyrics-button"
                >
                  <ion-icon :icon="musicalNotesOutline" slot="start" />
                  Voir les paroles
                </ion-button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Empty State -->
        <div v-else class="empty-state">
          <ion-icon :icon="documentTextOutline" size="large" color="medium"></ion-icon>
          <h3>Aucun programme</h3>
          <p>Aucun programme n'a encore été créé pour ce service.</p>
          <ion-button @click="showEditModal" fill="outline" size="small">
            <ion-icon :icon="createOutline" slot="start" />
            Créer un programme
          </ion-button>
        </div>
      </div>
      
      <!-- Lyrics Modal -->
      <ion-modal ref="lyricsModal" :is-open="showLyricsModal" @ionModalDidDismiss="closeLyricsModal">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ selectedItem?.title }}</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeLyricsModal">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="lyrics-content">
          <div class="lyrics-text">
            <pre>{{ selectedItem?.lyrics }}</pre>
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonCard, IonCardContent, IonLoading, IonModal
} from '@ionic/vue';
import {
  calendarOutline, createOutline, listOutline, timeOutline, layersOutline,
  personOutline, bookOutline, documentTextOutline, musicalNotesOutline,
  closeOutline, musicalNoteOutline, libraryOutline, micOutline,
  megaphoneOutline, giftOutline, handLeftOutline
} from 'ionicons/icons';
import { serviceService } from '@/services/serviceService';
import { timezoneUtils } from '@/utils/timezone';
import type { Service } from '@/types/service';
import type { ServiceProgram, ProgramItem, ProgramSection, ProgramItemType, ProgramParticipant } from '@/types/program';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const service = ref<Service | null>(null);
const program = ref<ServiceProgram | null>(null);
const showLyricsModal = ref(false);
const selectedItem = ref<ProgramItem | null>(null);

const serviceId = computed(() => route.params.id as string);

const formatDateTime = (dateStr: string, timeStr: string) => {
  return timezoneUtils.formatDateTimeForDisplay(dateStr, timeStr);
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h${remainingMinutes}min`;
};

const getItemIcon = (type: ProgramItemType) => {
  const iconMap = {
    'Chant': musicalNoteOutline,
    'Prière': handLeftOutline,
    'Lecture biblique': libraryOutline,
    'Prédication': micOutline,
    'Titre': documentTextOutline,
    'Annonce': megaphoneOutline,
    'Offrande': giftOutline,
    'Bénédiction': handLeftOutline
  };
  return iconMap[type] || documentTextOutline;
};

const sortedItems = computed(() => {
  if (!program.value) return [];
  return [...program.value.items].sort((a, b) => a.order - b.order);
});

const sortedSections = computed(() => {
  if (!program.value) return [];
  return [...program.value.sections].sort((a, b) => a.order - b.order);
});

const getSectionItems = (sectionId: string) => {
  if (!program.value) return [];
  return program.value.items
    .filter(item => item.sectionId === sectionId)
    .sort((a, b) => a.order - b.order);
};

const getSectionItemsCount = (sectionId: string) => {
  return getSectionItems(sectionId).length;
};

const getSectionDuration = (sectionId: string) => {
  return getSectionItems(sectionId)
    .reduce((total, item) => total + (item.duration || 0), 0);
};

const showLyrics = (item: ProgramItem) => {
  selectedItem.value = item;
  showLyricsModal.value = true;
};

const closeLyricsModal = () => {
  showLyricsModal.value = false;
  selectedItem.value = null;
};

const showEditModal = () => {
  // TODO: Implement edit functionality
  console.log('Edit program modal - to be implemented');
};

const loadService = async () => {
  try {
    service.value = await serviceService.getServiceById(serviceId.value);
  } catch (error) {
    console.error('Error loading service:', error);
  }
};

const loadProgram = async () => {
  // Mock program data for now
  const mockParticipants: ProgramParticipant[] = [
    { id: '1', name: 'Jean Dupont', role: 'Pasteur', isCustom: false },
    { id: '2', name: 'Marie Martin', role: 'Responsable louange', isCustom: false },
    { id: '3', name: 'Paul Durand', role: 'Diacre', isCustom: false },
    { id: '4', name: 'Sophie Bernard', role: 'Chantre', isCustom: false },
    { id: '5', name: 'Équipe de louange', role: '', isCustom: true }
  ];

  const mockSections: ProgramSection[] = [
    { id: 'opening', title: 'Ouverture', order: 1, color: '#4CAF50' },
    { id: 'worship', title: 'Louange et Adoration', order: 2, color: '#2196F3' },
    { id: 'word', title: 'Parole de Dieu', order: 3, color: '#FF9800' },
    { id: 'closing', title: 'Clôture', order: 4, color: '#9C27B0' }
  ];

  const mockItems: ProgramItem[] = [
    {
      id: '1',
      order: 1,
      type: 'Titre' as ProgramItemType,
      title: 'Bienvenue',
      subtitle: 'Salutations et annonces',
      participant: mockParticipants[0],
      duration: 5,
      sectionId: 'opening',
      notes: 'Accueillir chaleureusement les visiteurs'
    },
    {
      id: '2',
      order: 2,
      type: 'Prière' as ProgramItemType,
      title: 'Prière d\'ouverture',
      participant: mockParticipants[2],
      duration: 3,
      sectionId: 'opening',
      notes: 'Prière pour l\'ouverture du cœur à la Parole'
    },
    {
      id: '3',
      order: 3,
      type: 'Chant' as ProgramItemType,
      title: 'Jésus, que ton nom soit élevé',
      subtitle: 'Chant d\'ouverture',
      participant: mockParticipants[4],
      duration: 4,
      reference: 'Chant #125',
      sectionId: 'worship',
      lyrics: `Jésus, que ton nom soit élevé
Jésus, que ton nom soit élevé
Dans nos cœurs et dans cette ville
Jésus, que ton nom soit élevé

Nous proclamons le nom de Jésus
Nous proclamons le nom de Jésus
Dans nos cœurs et dans cette ville
Nous proclamons le nom de Jésus`
    },
    {
      id: '4',
      order: 4,
      type: 'Chant' as ProgramItemType,
      title: 'Mon Rédempteur est vivant',
      participant: mockParticipants[3],
      duration: 5,
      reference: 'Chant #78',
      sectionId: 'worship',
      lyrics: `Mon Rédempteur est vivant
Mon Sauveur tout-puissant
Quelle joie dans mon cœur
De connaître le Seigneur

Il est ressuscité
Pour l'éternité
Jésus-Christ est vivant
Mon Rédempteur est vivant`
    },
    {
      id: '5',
      order: 5,
      type: 'Prière' as ProgramItemType,
      title: 'Prière de louange',
      participant: mockParticipants[1],
      duration: 3,
      sectionId: 'worship'
    },
    {
      id: '6',
      order: 6,
      type: 'Offrande' as ProgramItemType,
      title: 'Offrande',
      subtitle: 'Temps de générosité',
      participant: mockParticipants[2],
      duration: 5,
      sectionId: 'worship',
      notes: 'Rappeler les projets soutenus par l\'église'
    },
    {
      id: '7',
      order: 7,
      type: 'Lecture biblique' as ProgramItemType,
      title: 'Lecture de la Parole',
      participant: mockParticipants[1],
      duration: 3,
      reference: 'Matthieu 5:3-12',
      sectionId: 'word',
      notes: 'Les Béatitudes'
    },
    {
      id: '8',
      order: 8,
      type: 'Prédication' as ProgramItemType,
      title: 'Les Béatitudes : Le bonheur selon Dieu',
      subtitle: 'Série : Vivre selon le Royaume',
      participant: mockParticipants[0],
      duration: 25,
      reference: 'Matthieu 5:3-12',
      sectionId: 'word',
      notes: 'Points clés : Pauvreté en esprit, Consolation, Héritage, Justice'
    },
    {
      id: '9',
      order: 9,
      type: 'Chant' as ProgramItemType,
      title: 'Béni soit ton nom',
      subtitle: 'Chant de réponse',
      participant: mockParticipants[4],
      duration: 4,
      reference: 'Chant #203',
      sectionId: 'closing'
    },
    {
      id: '10',
      order: 10,
      type: 'Annonce' as ProgramItemType,
      title: 'Annonces de la semaine',
      participant: mockParticipants[0],
      duration: 3,
      sectionId: 'closing',
      notes: 'Rappeler la soirée de prière mercredi et le repas communautaire samedi'
    },
    {
      id: '11',
      order: 11,
      type: 'Bénédiction' as ProgramItemType,
      title: 'Bénédiction finale',
      participant: mockParticipants[0],
      duration: 2,
      reference: 'Nombres 6:24-26',
      sectionId: 'closing'
    }
  ];

  program.value = {
    id: 'prog-' + serviceId.value,
    serviceId: serviceId.value,
    items: mockItems,
    sections: mockSections,
    totalDuration: mockItems.reduce((total, item) => total + (item.duration || 0), 0),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([loadService(), loadProgram()]);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.service-header {
  padding: 16px;
  background: var(--ion-color-light);
  border-bottom: 1px solid var(--ion-color-light-shade);
}

.service-info-card {
  text-align: center;
}

.service-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--ion-color-dark);
  margin: 0 0 8px;
}

.service-datetime {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--ion-color-medium);
  font-size: 0.95rem;
  margin: 0;
}

.content-container {
  padding: 16px;
}

/* Program Summary */
.program-summary {
  margin-bottom: 24px;
}

.summary-stats {
  display: flex;
  justify-content: space-around;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  font-size: 2rem;
  color: var(--ion-color-primary);
}

.stat-details {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ion-color-dark);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
}

/* Program Content */
.program-content {
  margin-bottom: 24px;
}

/* Sections */
.program-section {
  margin-bottom: 32px;
}

.section-header {
  margin-bottom: 16px;
  padding: 16px;
  background: var(--ion-color-light-tint);
  border-radius: 12px;
  border-left: 4px solid var(--ion-color-primary);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--ion-color-dark);
  margin: 0 0 4px;
}

.section-stats {
  font-size: 0.9rem;
  color: var(--ion-color-medium);
}

/* Program Items */
.section-items, .items-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.program-item {
  background: white;
  border-radius: 12px;
  border: 1px solid var(--ion-color-light-shade);
  padding: 16px;
  transition: all 0.2s ease;
}

.program-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.item-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 12px;
}

.item-order {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--ion-color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-type {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  text-transform: uppercase;
  font-weight: 500;
  margin-bottom: 4px;
}

.item-type ion-icon {
  font-size: 1rem;
}

.item-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--ion-color-dark);
  margin: 0 0 4px;
}

.item-subtitle {
  font-size: 0.9rem;
  color: var(--ion-color-medium);
  margin: 0;
  font-style: italic;
}

.item-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
  flex-shrink: 0;
  font-size: 0.85rem;
}

.item-duration, .item-participant {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--ion-color-medium);
}

.participant-role {
  font-style: italic;
  opacity: 0.8;
}

.item-details {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--ion-color-light);
}

.item-reference, .item-notes {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: var(--ion-color-medium);
}

.item-reference ion-icon, .item-notes ion-icon {
  font-size: 1rem;
}

.item-lyrics {
  margin-top: 8px;
}

.lyrics-button {
  --color: var(--ion-color-primary);
}

/* Item Type Styling */
.item-chant {
  border-left: 4px solid #2196F3;
}

.item-prière {
  border-left: 4px solid #4CAF50;
}

.item-lecture-biblique {
  border-left: 4px solid #FF9800;
}

.item-prédication {
  border-left: 4px solid #9C27B0;
}

.item-titre {
  border-left: 4px solid #607D8B;
}

.item-annonce {
  border-left: 4px solid #FF5722;
}

.item-offrande {
  border-left: 4px solid #795548;
}

.item-bénédiction {
  border-left: 4px solid #E91E63;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 48px 16px;
}

.empty-state ion-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--ion-color-dark);
  margin: 0 0 8px;
}

.empty-state p {
  color: var(--ion-color-medium);
  margin: 0 0 24px;
}

/* Lyrics Modal */
.lyrics-content {
  padding: 16px;
}

.lyrics-text pre {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 1.1rem;
  line-height: 1.8;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: var(--ion-color-dark);
  margin: 0;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .summary-stats {
    flex-direction: column;
    gap: 12px;
  }
  
  .stat-item {
    justify-content: flex-start;
  }
  
  .item-header {
    flex-direction: column;
    gap: 8px;
  }
  
  .item-meta {
    align-items: flex-start;
    width: 100%;
  }
  
  .item-details {
    flex-direction: column;
    gap: 8px;
  }
}
</style>