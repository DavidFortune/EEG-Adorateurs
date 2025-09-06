<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/services"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ isEditMode ? 'Édition du programme' : 'Programme du service' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="toggleEditMode" fill="clear" :color="isEditMode ? 'primary' : undefined">
            <ion-icon :icon="isEditMode ? checkmarkOutline : createOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content :fullscreen="true" :class="{ 'edit-mode': isEditMode }">
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
              
              <!-- Conductor Information -->
              <div v-if="program.conductor" class="conductor-info">
                <div class="conductor-section">
                  <ion-icon :icon="personCircleOutline" class="conductor-icon" />
                  <div class="conductor-details">
                    <span class="conductor-label">Dirigeant</span>
                    <span class="conductor-name">{{ program.conductor.name }}</span>
                    <span v-if="program.conductor.role" class="conductor-role">{{ program.conductor.role }}</span>
                  </div>
                </div>
              </div>
            </ion-card-content>
          </ion-card>
        </div>
        
        <!-- Add Section Button at Start -->
        <div v-if="isEditMode && program" class="add-item-container">
          <ion-button @click="showAddSectionModal" fill="outline" size="default" class="add-item-button">
            <ion-icon :icon="addOutline" slot="start" />
            Ajouter une section
          </ion-button>
        </div>

        <!-- Program Items -->
        <div v-if="program && program.items.length > 0" class="program-content">
          <!-- Render by sections if they exist -->
          <div v-if="program.sections.length > 0" class="sections-view">
            <div v-for="section in sortedSections" :key="section.id" class="program-section" :data-section-id="section.id">
              <div class="section-header">
                <div v-if="isEditMode" class="section-drag-handle" @mousedown="startSectionDrag($event, section)" @touchstart="startSectionDrag($event, section)">
                  <ion-icon :icon="reorderThreeOutline" />
                </div>
                <h3 class="section-title">{{ section.title }}</h3>
                <div class="section-stats">
                  {{ getSectionItemsCount(section.id) }} éléments
                  • {{ formatDuration(getSectionDuration(section.id)) }}
                </div>
              </div>
              
              <div class="section-items">
                <template v-for="(item, index) in getSectionItems(section.id)" :key="item.id">
                  <!-- Insertion indicator before item -->
                  <div 
                    v-if="isDragging && shouldShowInsertionLine(item, index, section.id)"
                    class="insertion-indicator"
                  ></div>
                  
                  <div 
                    class="program-item"
                    :class="[
                      `item-${item.type.toLowerCase().replace(/\s+/g, '-')}`,
                      { 'dragging': draggedItemId === item.id }
                    ]"
                    :data-item-id="item.id"
                  >
                  <div class="item-layout">
                    <!-- Column 1: Drag Handle (Edit Mode Only) -->
                    <div v-if="isEditMode" class="item-column item-handle-column">
                      <div class="drag-handle" @mousedown="startDrag($event, item)" @touchstart="startDrag($event, item)">
                        <ion-icon :icon="reorderThreeOutline" />
                      </div>
                    </div>
                    
                    <!-- Column 2: Order Number -->
                    <div class="item-column item-order-column">
                      <div class="item-order">{{ item.order }}</div>
                    </div>
                    
                    <!-- Column 3: Details -->
                    <div class="item-column item-details-column">
                      <div class="item-type">
                        <ion-icon :icon="getItemIcon(item.type)" />
                        {{ item.type }}
                      </div>
                      <h4 class="item-title">{{ item.title }}</h4>
                      <p v-if="item.subtitle" class="item-subtitle">{{ item.subtitle }}</p>

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
                          fill="outline" 
                          size="small"
                          class="lyrics-button"
                        >
                          <ion-icon :icon="musicalNotesOutline" slot="start" />
                          Voir les paroles
                        </ion-button>
                      </div>
                    </div>
                    
                    <!-- Column 4: Duration and Participant -->
                    <div class="item-column item-meta-column">
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
                  
                  </div>
                  
                  <!-- Insertion indicator after last item in section -->
                  <div 
                    v-if="isDragging && shouldShowInsertionLineAfter(item, index, section.id)"
                    class="insertion-indicator"
                  ></div>
                </template>
                
                <!-- Add Item Button at End of Section (Edit Mode Only) -->
                <div v-if="isEditMode" class="add-item-container">
                  <ion-button @click="showAddItemModal('section', section.id)" fill="outline" size="small" class="add-item-button">
                    <ion-icon :icon="addOutline" slot="start" />
                    Ajouter un élément
                  </ion-button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Render without sections -->
          <div v-else class="items-view">
            <template v-for="(item, index) in sortedItems" :key="item.id">
              <!-- Insertion indicator before item -->
              <div 
                v-if="isDragging && shouldShowInsertionLine(item, index)"
                class="insertion-indicator"
              ></div>
              
              <div 
                class="program-item"
                :class="[
                  `item-${item.type.toLowerCase().replace(/\s+/g, '-')}`,
                  { 'dragging': draggedItemId === item.id }
                ]"
                :data-item-id="item.id"
              >
              <div class="item-layout">
                <!-- Column 1: Drag Handle (Edit Mode Only) -->
                <div v-if="isEditMode" class="item-column item-handle-column">
                  <div class="drag-handle" @mousedown="startDrag($event, item)" @touchstart="startDrag($event, item)">
                    <ion-icon :icon="reorderThreeOutline" />
                  </div>
                </div>
                
                <!-- Column 2: Order Number -->
                <div class="item-column item-order-column">
                  <div class="item-order">{{ item.order }}</div>
                </div>
                
                <!-- Column 3: Details -->
                <div class="item-column item-details-column">
                  <div class="item-type">
                    <ion-icon :icon="getItemIcon(item.type)" />
                    {{ item.type }}
                  </div>
                  <h4 class="item-title">{{ item.title }}</h4>
                  <p v-if="item.subtitle" class="item-subtitle">{{ item.subtitle }}</p>
                </div>
                
                <!-- Column 4: Duration and Participant -->
                <div class="item-column item-meta-column">
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
                  fill="outline" 
                  size="small"
                  class="lyrics-button"
                >
                  <ion-icon :icon="musicalNotesOutline" slot="start" />
                  Voir les paroles
                </ion-button>
              </div>
              </div>
              
              <!-- Insertion indicator after last item -->
              <div 
                v-if="isDragging && shouldShowInsertionLineAfter(item, index)"
                class="insertion-indicator"
              ></div>
            </template>
          </div>
        </div>

        <!-- Add Section Button at End -->
        <div v-if="isEditMode && program" class="add-item-container">
          <ion-button @click="showAddSectionModal" fill="outline" size="default" class="add-item-button">
            <ion-icon :icon="addOutline" slot="start" />
            Ajouter une section
          </ion-button>
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

      <!-- Add Item Type Selection Modal -->
      <ion-modal :is-open="showAddItemModalState" @ionModalDidDismiss="closeAddItemModal">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ addItemModalTitle }}</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeAddItemModal">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="add-item-modal-content">
          <div class="item-type-grid">
            <ion-button 
              v-for="itemType in programItemTypes" 
              :key="itemType"
              @click="selectItemType(itemType)"
              fill="outline" 
              size="large"
              class="item-type-button"
            >
              <div class="item-type-content">
                <ion-icon :icon="getItemIcon(itemType)" size="large" />
                <span class="item-type-label">{{ itemType }}</span>
              </div>
            </ion-button>
          </div>
          
          <div class="modal-footer">
            <p class="position-info">
              {{ addItemPosition === 'start' ? 'Ajouter au début du programme' : 'Ajouter à la fin du programme' }}
            </p>
          </div>
        </ion-content>
      </ion-modal>

      <!-- Add Section Modal -->
      <ion-modal :is-open="showAddSectionModalState" @ionModalDidDismiss="closeAddSectionModal">
        <ion-header>
          <ion-toolbar>
            <ion-title>Ajouter une section</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeAddSectionModal">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="add-section-modal-content">
          <div class="section-form">
            <ion-item>
              <ion-label position="stacked">Nom de la section</ion-label>
              <ion-input 
                v-model="newSectionName" 
                placeholder="Ex: Louange, Prière, Prédication..."
                @keyup.enter="createSection"
              ></ion-input>
            </ion-item>
            
            <div class="modal-actions">
              <ion-button @click="closeAddSectionModal" fill="clear" color="medium">
                Annuler
              </ion-button>
              <ion-button 
                @click="createSection" 
                :disabled="!newSectionName.trim()"
                color="primary"
              >
                <ion-icon :icon="addOutline" slot="start" />
                Créer la section
              </ion-button>
            </div>
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
  megaphoneOutline, giftOutline, handLeftOutline, personCircleOutline,
  checkmarkOutline, reorderThreeOutline, addOutline
} from 'ionicons/icons';
import { serviceService } from '@/services/serviceService';
import { timezoneUtils } from '@/utils/timezone';
import type { Service } from '@/types/service';
import type { ServiceProgram, ProgramItem, ProgramSection, ProgramParticipant } from '@/types/program';
import { ProgramItemType } from '@/types/program';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const service = ref<Service | null>(null);
const program = ref<ServiceProgram | null>(null);
const showLyricsModal = ref(false);
const selectedItem = ref<ProgramItem | null>(null);
const isEditMode = ref(false);
const isDragging = ref(false);
const draggedItemId = ref<string | null>(null);
const insertionIndex = ref<number>(-1);
const insertionSectionId = ref<string | null>(null);
const showAddItemModalState = ref(false);
const addItemPosition = ref<'start' | 'end' | 'section' | null>(null);
const addItemSectionId = ref<string | null>(null);
const showAddSectionModalState = ref(false);
const newSectionName = ref('');

const serviceId = computed(() => route.params.id as string);

const programItemTypes = computed(() => Object.values(ProgramItemType));

const addItemModalTitle = computed(() => {
  if (addItemPosition.value === 'section' && addItemSectionId.value) {
    const section = program.value?.sections.find(s => s.id === addItemSectionId.value);
    return section ? `Ajouter un élément à "${section.title}"` : 'Sélectionner un type d\'élément';
  }
  return 'Sélectionner un type d\'élément';
});

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

const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value;
};

const showAddItemModal = (position: 'start' | 'end' | 'section', sectionId?: string) => {
  addItemPosition.value = position;
  addItemSectionId.value = sectionId || null;
  showAddItemModalState.value = true;
};

const closeAddItemModal = () => {
  showAddItemModalState.value = false;
  addItemPosition.value = null;
  addItemSectionId.value = null;
};

const showAddSectionModal = () => {
  showAddSectionModalState.value = true;
  newSectionName.value = '';
};

const closeAddSectionModal = () => {
  showAddSectionModalState.value = false;
  newSectionName.value = '';
};

const createSection = () => {
  if (!newSectionName.value.trim() || !program.value) return;
  
  const newSection: ProgramSection = {
    id: `section_${Date.now()}`,
    title: newSectionName.value.trim(),
    order: program.value.sections.length + 1
  };
  
  program.value.sections.push(newSection);
  closeAddSectionModal();
  
  // TODO: Save to backend
  console.log('New section created:', newSection);
};

const selectItemType = (itemType: ProgramItemType) => {
  closeAddItemModal();
  
  const position = addItemPosition.value;
  const sectionId = addItemSectionId.value;
  const serviceIdValue = serviceId.value;
  
  console.log(`Creating new ${itemType} at ${position}`, sectionId ? `in section ${sectionId}` : '');
  
  // Build query parameters
  const baseQuery = `service=${serviceIdValue}&position=${position}`;
  const sectionQuery = sectionId ? `&sectionId=${sectionId}` : '';
  const fullQuery = `${baseQuery}${sectionQuery}`;
  
  // Navigate to the appropriate form based on item type
  const formRoutes = {
    [ProgramItemType.SONG]: `/program-item-form/song?${fullQuery}`,
    [ProgramItemType.PRAYER]: `/program-item-form/prayer?${fullQuery}`,
    [ProgramItemType.SCRIPTURE]: `/program-item-form/scripture?${fullQuery}`,
    [ProgramItemType.SERMON]: `/program-item-form/sermon?${fullQuery}`,
    [ProgramItemType.TITLE]: `/program-item-form/title?${fullQuery}`,
    [ProgramItemType.ANNOUNCEMENT]: `/program-item-form/announcement?${fullQuery}`,
    [ProgramItemType.OFFERING]: `/program-item-form/offering?${fullQuery}`,
    [ProgramItemType.BLESSING]: `/program-item-form/blessing?${fullQuery}`
  };
  
  const targetRoute = formRoutes[itemType];
  if (targetRoute) {
    router.push(targetRoute);
  } else {
    // Fallback to generic form
    router.push(`/program-item-form?${fullQuery}&type=${itemType}`);
  }
};

// Drag and Drop functionality
let draggedItem: ProgramItem | null = null;
let draggedSection: ProgramSection | null = null;

const startDrag = (event: MouseEvent | TouchEvent, item: ProgramItem) => {
  if (!isEditMode.value) return;
  draggedItem = item;
  isDragging.value = true;
  draggedItemId.value = item.id;
  event.preventDefault();
  
  // Add global events for both mouse and touch
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd);
};

const startSectionDrag = (event: MouseEvent | TouchEvent, section: ProgramSection) => {
  if (!isEditMode.value) return;
  draggedSection = section;
  event.preventDefault();
  
  // Add global events for both mouse and touch
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd);
};

const getEventCoordinates = (event: MouseEvent | TouchEvent) => {
  if ('touches' in event && event.touches.length > 0) {
    return { clientX: event.touches[0].clientX, clientY: event.touches[0].clientY };
  } else if ('clientX' in event) {
    return { clientX: event.clientX, clientY: event.clientY };
  }
  return { clientX: 0, clientY: 0 };
};

const handleMouseMove = (event: MouseEvent) => {
  handleDragMove(event);
};

const handleTouchMove = (event: TouchEvent) => {
  event.preventDefault(); // Prevent scrolling
  handleDragMove(event);
};

const handleDragMove = (event: MouseEvent | TouchEvent) => {
  if (!isDragging.value || !draggedItem) return;
  
  const { clientX, clientY } = getEventCoordinates(event);
  
  // Find the element under the pointer
  const elementUnderPointer = document.elementFromPoint(clientX, clientY);
  
  // Find the closest program item or section
  const closestItem = elementUnderPointer?.closest('.program-item');
  const closestSection = elementUnderPointer?.closest('.program-section');
  
  if (closestItem) {
    const itemId = closestItem.getAttribute('data-item-id');
    if (itemId && itemId !== draggedItem.id) {
      calculateInsertionPosition({ clientX, clientY }, closestItem, itemId);
    }
  } else if (closestSection) {
    const sectionId = closestSection.getAttribute('data-section-id');
    if (sectionId) {
      calculateInsertionInSection({ clientX, clientY }, closestSection, sectionId);
    }
  } else {
    // Clear insertion indicators
    insertionIndex.value = -1;
    insertionSectionId.value = null;
  }
};

const calculateInsertionPosition = (coordinates: { clientX: number; clientY: number }, itemElement: Element, targetItemId: string) => {
  if (!program.value || !draggedItem) return;
  
  const rect = itemElement.getBoundingClientRect();
  const pointerY = coordinates.clientY;
  const itemCenterY = rect.top + rect.height / 2;
  
  // Find the target item in the program
  const targetItem = program.value.items.find(item => item.id === targetItemId);
  if (!targetItem) return;
  
  // Determine if we should insert before or after
  const insertBefore = pointerY < itemCenterY;
  const targetIndex = program.value.items.findIndex(item => item.id === targetItemId);
  
  insertionIndex.value = insertBefore ? targetIndex : targetIndex + 1;
  insertionSectionId.value = targetItem.sectionId || null;
};

const calculateInsertionInSection = (coordinates: { clientX: number; clientY: number }, sectionElement: Element, sectionId: string) => {
  if (!program.value) return;
  
  // Find items in this section
  const sectionItems = program.value.items.filter(item => item.sectionId === sectionId);
  
  if (sectionItems.length === 0) {
    // Empty section - insert at beginning
    insertionIndex.value = 0;
    insertionSectionId.value = sectionId;
    return;
  }
  
  // Find the last item in this section to insert after
  const lastItem = sectionItems[sectionItems.length - 1];
  const lastItemIndex = program.value.items.findIndex(item => item.id === lastItem.id);
  
  insertionIndex.value = lastItemIndex + 1;
  insertionSectionId.value = sectionId;
};

const handleMouseUp = (event: MouseEvent) => {
  handleDragEnd(event);
};

const handleTouchEnd = (event: TouchEvent) => {
  handleDragEnd(event);
};

const handleDragEnd = (event: MouseEvent | TouchEvent) => {
  // Clean up event listeners for both mouse and touch
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
  document.removeEventListener('touchmove', handleTouchMove);
  document.removeEventListener('touchend', handleTouchEnd);
  
  if (draggedItem && insertionIndex.value >= 0) {
    // Handle item drop at insertion point
    performItemInsertion(draggedItem, insertionIndex.value, insertionSectionId.value);
  }
  
  if (draggedSection) {
    // Handle section drop
    const { clientX, clientY } = getEventCoordinates(event);
    handleSectionDrop({ clientX, clientY });
    draggedSection = null;
  }
  
  // Clean up drag state
  isDragging.value = false;
  draggedItemId.value = null;
  draggedItem = null;
  insertionIndex.value = -1;
  insertionSectionId.value = null;
};


const handleSectionDrop = (coordinates: { clientX: number; clientY: number }) => {
  if (!draggedSection || !program.value) return;
  
  const target = document.elementFromPoint(coordinates.clientX, coordinates.clientY);
  const targetSection = target?.closest('.program-section');
  
  if (targetSection) {
    const targetId = targetSection.getAttribute('data-section-id');
    const targetProgramSection = program.value.sections.find(section => section.id === targetId);
    
    if (targetProgramSection && targetProgramSection.id !== draggedSection.id) {
      reorderSections(draggedSection, targetProgramSection);
    }
  }
};

const performItemInsertion = (draggedItem: ProgramItem, insertIndex: number, targetSectionId: string | null) => {
  if (!program.value) return;
  
  const items = [...program.value.items];
  const draggedIndex = items.findIndex(item => item.id === draggedItem.id);
  
  // Remove the dragged item from its current position
  const [movedItem] = items.splice(draggedIndex, 1);
  
  // Update the section if moving to a different section
  if (targetSectionId !== null) {
    movedItem.sectionId = targetSectionId;
  }
  
  // Adjust insertion index if we removed an item before the insertion point
  const adjustedInsertIndex = draggedIndex < insertIndex ? insertIndex - 1 : insertIndex;
  
  // Insert the item at the new position
  items.splice(adjustedInsertIndex, 0, movedItem);
  
  // Renumber all items sequentially
  items.forEach((item, index) => {
    item.order = index + 1;
  });
  
  program.value.items = items;
  
  // TODO: Save to backend
  console.log('Items reordered', items.map(item => ({ id: item.id, order: item.order, title: item.title, section: item.sectionId })));
};

const reorderSections = (draggedSection: ProgramSection, targetSection: ProgramSection) => {
  if (!program.value) return;
  
  const sections = [...program.value.sections];
  const draggedIndex = sections.findIndex(section => section.id === draggedSection.id);
  const targetIndex = sections.findIndex(section => section.id === targetSection.id);
  
  // Remove dragged section and insert at target position
  sections.splice(draggedIndex, 1);
  sections.splice(targetIndex, 0, draggedSection);
  
  // Update order numbers
  sections.forEach((section, index) => {
    section.order = index + 1;
  });
  
  program.value.sections = sections;
  
  // TODO: Save to backend
  console.log('Sections reordered', sections.map(section => ({ id: section.id, order: section.order, title: section.title })));
};

// Insertion line display logic
const shouldShowInsertionLine = (item: ProgramItem, index: number, sectionId?: string) => {
  if (!program.value) return false;
  
  const allItems = sectionId 
    ? program.value.items.filter(i => i.sectionId === sectionId)
    : program.value.items;
  
  const itemGlobalIndex = program.value.items.findIndex(i => i.id === item.id);
  
  // Show insertion line before this item if the insertion index matches
  return insertionIndex.value === itemGlobalIndex && 
         (sectionId === undefined || insertionSectionId.value === sectionId);
};

const shouldShowInsertionLineAfter = (item: ProgramItem, index: number, sectionId?: string) => {
  if (!program.value) return false;
  
  const allItems = sectionId 
    ? program.value.items.filter(i => i.sectionId === sectionId)
    : program.value.items;
  
  const itemGlobalIndex = program.value.items.findIndex(i => i.id === item.id);
  const isLastInSection = index === allItems.length - 1;
  
  // Show insertion line after this item if:
  // 1. The insertion index is right after this item, or
  // 2. This is the last item in the section and we're inserting at the end
  return (insertionIndex.value === itemGlobalIndex + 1 && 
          (sectionId === undefined || insertionSectionId.value === sectionId)) ||
         (isLastInSection && insertionSectionId.value === sectionId && 
          insertionIndex.value > itemGlobalIndex);
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
    conductor: mockParticipants[1], // Marie Martin, Responsable louange
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

/* Conductor Information */
.conductor-info {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--ion-color-light);
}

.conductor-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.conductor-icon {
  font-size: 2.5rem;
  color: var(--ion-color-secondary);
}

.conductor-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.conductor-label {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  font-weight: 500;
}

.conductor-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--ion-color-dark);
}

.conductor-role {
  font-size: 0.9rem;
  color: var(--ion-color-medium);
  font-style: italic;
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

/* New Column Layout */
.item-layout {
  display: grid;
  grid-template-columns: 30px 1fr 140px;
  gap: 12px;
  align-items: start;
  margin-bottom: 12px;
  width: 100%;
  min-width: 0; /* Prevent grid blowout */
}

/* Edit Mode: Show drag handle column */
.edit-mode .item-layout {
  grid-template-columns: 40px 30px 1fr 140px;
  min-width: 0; /* Prevent grid blowout */
  align-items: start;
}

.item-column {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-handle-column {
  justify-content: flex-start;
  align-items: center;
}

.item-order-column {
  justify-content: flex-start;
  align-items: center;
}

.item-details-column {
  flex: 1;
  min-width: 0; /* Allow text truncation */
  overflow: hidden; /* Prevent content from breaking grid */
}

.item-meta-column {
  justify-content: flex-start;
  align-items: flex-end;
  text-align: right;
  font-size: 0.85rem;
}

.item-order {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--ion-color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.85rem;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  margin-top: 4px;
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

/* Drag and Drop Styles */
.drag-handle, .section-drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  cursor: grab;
  color: var(--ion-color-medium);
  border: 1px dashed var(--ion-color-light);
  border-radius: 6px;
  margin-right: 8px;
  transition: all 0.2s ease;
  flex-shrink: 0;
  /* Touch-friendly settings */
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

.drag-handle:hover, .section-drag-handle:hover {
  color: var(--ion-color-primary);
  border-color: var(--ion-color-primary);
  background: var(--ion-color-primary-tint);
}

.drag-handle:active, .section-drag-handle:active {
  cursor: grabbing;
  transform: scale(0.95);
}

.section-drag-handle {
  margin-right: 12px;
}

/* Edit Mode Visual Indicators */
.program-item {
  transition: all 0.2s ease;
}

.program-item:hover {
  background: var(--ion-color-light);
  transform: translateX(2px);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title {
  flex: 1;
}

/* Edit Mode Content Styling */
.edit-mode {
  background: linear-gradient(135deg, var(--ion-background-color) 0%, var(--ion-color-light) 100%);
}

.edit-mode .program-section {
  position: relative;
}

.edit-mode .program-section::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--ion-color-primary);
  opacity: 0.3;
  border-radius: 2px;
}

.edit-mode .program-item {
  cursor: move;
  border-left: 2px solid transparent;
  padding-left: 6px;
}

.edit-mode .program-item:hover {
  border-left-color: var(--ion-color-primary);
}

/* Drag and Drop Visual Feedback */
.insertion-indicator {
  height: 3px;
  background: var(--ion-color-primary);
  margin: 4px 0;
  border-radius: 2px;
  position: relative;
  animation: insertionPulse 1s ease-in-out infinite;
}

.insertion-indicator::before {
  content: '';
  position: absolute;
  left: -6px;
  top: -3px;
  width: 9px;
  height: 9px;
  background: var(--ion-color-primary);
  border-radius: 50%;
}

.insertion-indicator::after {
  content: '';
  position: absolute;
  right: -6px;
  top: -3px;
  width: 9px;
  height: 9px;
  background: var(--ion-color-primary);
  border-radius: 50%;
}

@keyframes insertionPulse {
  0%, 100% { opacity: 0.6; transform: scaleY(1); }
  50% { opacity: 1; transform: scaleY(1.2); }
}

.program-item.dragging {
  opacity: 0.5;
  transform: rotate(2deg) scale(0.98);
  box-shadow: 0 8px 24px rgba(var(--ion-color-primary-rgb), 0.3);
  z-index: 1000;
  pointer-events: none;
}

/* Add Item Buttons and Modal */
.add-item-container {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

.add-item-button {
  --border-style: dashed;
  --border-width: 2px;
  --border-color: var(--ion-color-primary);
  --color: var(--ion-color-primary);
  min-height: 50px;
  transition: all 0.3s ease;
}

.add-item-button:hover {
  --background: var(--ion-color-primary-tint);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--ion-color-primary-rgb), 0.3);
}

.add-item-modal-content {
  padding: 20px;
}

.item-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 30px;
}

.item-type-button {
  height: 100px;
  --border-radius: 12px;
  --border-width: 2px;
}

.item-type-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.item-type-label {
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
}

.modal-footer {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid var(--ion-color-light);
}

.position-info {
  color: var(--ion-color-medium);
  font-style: italic;
  margin: 0;
}

/* Add Section Modal */
.add-section-modal-content {
  padding: 20px;
}

.section-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  margin-top: 20px;
  border-top: 1px solid var(--ion-color-light);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .summary-stats {
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 8px;
  }
  
  .stat-item {
    flex-direction: column;
    text-align: center;
    min-width: 0;
    flex: 1;
  }
  
  .stat-item .stat-icon {
    margin-bottom: 4px;
  }
  
  /* Mobile: Stacked layout */
  .item-layout {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  /* Mobile Edit Mode: Show handle + stacked content */
  .edit-mode .item-layout {
    grid-template-columns: 50px 1fr;
    gap: 12px;
  }
  
  .edit-mode .item-handle-column {
    grid-row: 1 / 4; /* Span all rows */
    align-self: start;
  }
  
  .edit-mode .item-order-column,
  .edit-mode .item-details-column,
  .edit-mode .item-meta-column {
    grid-column: 2;
  }
  
  .item-order-column {
    justify-self: start;
    margin-bottom: 8px;
  }
  
  .item-details-column {
    margin-bottom: 8px;
  }
  
  .item-meta-column {
    justify-self: start;
    text-align: left;
    align-items: flex-start;
  }
  
  .item-details {
    flex-direction: column;
    gap: 8px;
  }

  .item-type-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
  }

  .item-type-button {
    height: 80px;
  }

  .item-type-label {
    font-size: 0.8rem;
  }
}
</style>