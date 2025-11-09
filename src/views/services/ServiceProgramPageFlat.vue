<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="`/service-detail/${route.params.id}`"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ isEditMode ? 'Édition du programme' : 'Programme du service' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button v-if="isAdmin && !isEditMode" @click="showSMSModal" fill="clear" color="primary">
            <ion-icon :icon="chatboxEllipsesOutline" />
          </ion-button>
          <ion-button v-if="isAdmin" @click="toggleEditMode" fill="clear" :color="isEditMode ? 'primary' : undefined">
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
        <div v-if="program" class="program-summary">
          <ion-card>
            <ion-card-content>
              <div class="program-header">
                <h3>Résumé du programme</h3>
                <ion-button v-if="isAdmin" @click="showEditProgramModal" fill="clear" size="small" color="primary">
                  <ion-icon :icon="createOutline" slot="icon-only" />
                </ion-button>
              </div>
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
                    <span class="stat-value">{{ totalDuration }}</span>
                    <span class="stat-label">Minutes</span>
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

        <!-- No Program State -->
        <div v-if="!program && !loading" class="no-program">
          <ion-card>
            <ion-card-content class="text-center">
              <ion-icon :icon="documentTextOutline" class="large-icon" />
              <h3>Aucun programme</h3>
              <p>Ce service n'a pas encore de programme.</p>
              <ion-button v-if="isAdmin" @click="createInitialProgram" expand="block" class="ion-margin-top">
                <ion-icon :icon="addOutline" slot="start" />
                Créer un programme
              </ion-button>
            </ion-card-content>
          </ion-card>
        </div>

        <!-- Add Item Button (Top) -->
        <div v-if="isEditMode && program" class="add-item-container">
          <ion-button @click="showAddItemModal" fill="outline" size="default" class="add-item-button">
            <ion-icon :icon="addOutline" slot="start" />
            Ajouter un élément
          </ion-button>
        </div>

        <!-- Program Items (Flat List) -->
        <div v-if="program && program.items.length > 0" class="program-content">
          <div class="flat-items-view">
            <div
              v-for="(item, index) in sortedItems"
              :key="item.id"
              class="program-item-wrapper"
              :class="{ 'has-subitems': hasSubItems(item), 'expanded': isItemExpanded(item.id) }"
            >
              <div
                class="program-item"
                :class="`item-${item.type.toLowerCase().replace(/\s+/g, '-')}`"
              >
                <div class="item-layout">
                  <!-- Drag Handle (Edit Mode) -->
                  <div v-if="isEditMode" class="item-column item-handle-column">
                    <div class="drag-handle">
                      <ion-icon :icon="reorderThreeOutline" />
                    </div>
                  </div>

                  <!-- Order Number -->
                  <div class="item-column item-order-column">
                    <div class="item-order">{{ index + 1 }}</div>
                  </div>

                  <!-- Details -->
                  <div class="item-column item-details-column">
                    <div class="item-header-row">
                      <div class="item-type">
                        <ion-icon :icon="getItemIcon(item.type)" />
                        {{ item.type }}
                      </div>

                      <!-- Expand/Collapse Button for Sub-Items -->
                      <ion-button
                        v-if="hasSubItems(item)"
                        @click="toggleItemExpansion(item.id)"
                        fill="clear"
                        size="small"
                        class="expand-button"
                      >
                        <ion-icon
                          :icon="isItemExpanded(item.id) ? chevronDownOutline : chevronForwardOutline"
                        />
                        {{ item.subItems!.length }}
                      </ion-button>
                    </div>

                    <h4 class="item-title">
                      {{ item.resourceId && getLinkedResource(item.resourceId) ? getLinkedResource(item.resourceId)?.title : item.title }}
                    </h4>
                    <p v-if="item.subtitle" class="item-subtitle">{{ item.subtitle }}</p>
                    <p v-if="item.reference" class="item-reference">{{ item.reference }}</p>

                    <!-- Notes -->
                    <div v-if="item.notes" class="item-notes">
                      <ion-icon :icon="documentTextOutline" />
                      {{ item.notes }}
                    </div>

                    <!-- Resource Links -->
                    <div v-if="item.resourceId && getLinkedResource(item.resourceId)" class="item-resources">
                      <div class="media-buttons">
                        <button
                          v-for="content in getLinkedResource(item.resourceId)?.contents"
                          :key="content.type"
                          @click="showMediaContent(content, getLinkedResource(item.resourceId)?.title || '')"
                          class="media-chip-button"
                        >
                          <ion-icon :icon="getMediaTypeIcon(content.type)" />
                          <span>{{ formatMediaType(content.type) }}</span>
                        </button>
                      </div>
                    </div>

                    <!-- View All Lyrics Button (for items with sub-items) -->
                    <div v-if="hasSubItems(item) && hasLyricsInSubItems(item)" class="item-lyrics-button">
                      <ion-button
                        @click="showItemLyricsView(item)"
                        fill="solid"
                        color="primary"
                        size="small"
                        class="view-lyrics-btn"
                      >
                        <ion-icon :icon="documentTextOutline" slot="start" />
                        Voir toutes les paroles
                      </ion-button>
                    </div>
                  </div>

                  <!-- Duration and Participant -->
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

                  <!-- Edit/Delete Actions (Edit Mode) -->
                  <div v-if="isEditMode" class="item-column item-actions-column">
                    <div class="item-actions">
                      <ion-button @click="showAddSubItemModalForItem(item.id)" fill="clear" size="small" color="success">
                        <ion-icon :icon="addOutline" slot="icon-only" />
                      </ion-button>
                      <ion-button @click="showEditItemModalForItem(item)" fill="clear" size="small" color="primary">
                        <ion-icon :icon="createOutline" slot="icon-only" />
                      </ion-button>
                      <ion-button @click="deleteItem(item.id)" fill="clear" size="small" color="danger">
                        <ion-icon :icon="trashOutline" slot="icon-only" />
                      </ion-button>
                    </div>
                  </div>
                </div>

                <!-- Sub-Items (Expanded) -->
                <div v-if="hasSubItems(item) && isItemExpanded(item.id)" class="sub-items-container">
                  <div
                    v-for="(subItem, subIndex) in getSortedSubItems(item)"
                    :key="subItem.id"
                    class="sub-item"
                  >
                    <div class="sub-item-layout">
                      <div class="sub-item-bullet">•</div>
                      <div class="sub-item-content">
                        <span class="sub-item-title">
                          {{ subItem.resourceId && getLinkedResource(subItem.resourceId) ? getLinkedResource(subItem.resourceId)?.title : subItem.title }}
                        </span>
                        <span v-if="subItem.notes" class="sub-item-notes">{{ subItem.notes }}</span>

                        <!-- Resource Links for Sub-Item -->
                        <div v-if="subItem.resourceId && getLinkedResource(subItem.resourceId)" class="sub-item-resources">
                          <button
                            v-for="content in getLinkedResource(subItem.resourceId)?.contents"
                            :key="content.type"
                            @click="showMediaContent(content, getLinkedResource(subItem.resourceId)?.title || '')"
                            class="media-chip-button small"
                          >
                            <ion-icon :icon="getMediaTypeIcon(content.type)" />
                          </button>
                        </div>
                      </div>

                      <!-- Sub-Item Actions (Edit Mode) -->
                      <div v-if="isEditMode" class="sub-item-actions">
                        <ion-button @click="showEditSubItemModalForItem(item.id, subItem)" fill="clear" size="small" color="primary">
                          <ion-icon :icon="createOutline" slot="icon-only" />
                        </ion-button>
                        <ion-button @click="deleteSubItem(item.id, subItem.id)" fill="clear" size="small" color="danger">
                          <ion-icon :icon="trashOutline" slot="icon-only" />
                        </ion-button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Add Item Button (Bottom) -->
        <div v-if="isEditMode && program" class="add-item-container">
          <ion-button @click="showAddItemModal" fill="outline" size="default" class="add-item-button">
            <ion-icon :icon="addOutline" slot="start" />
            Ajouter un élément
          </ion-button>
        </div>
      </div>

      <!-- Edit Program Modal -->
      <ion-modal :is-open="showEditProgramModalState" @ionModalDidDismiss="closeEditProgramModal">
        <ion-header>
          <ion-toolbar>
            <ion-title>Modifier le programme</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeEditProgramModal">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-item>
            <ion-label position="stacked">Nom du dirigeant</ion-label>
            <ion-input v-model="editProgramForm.conductorName" placeholder="Ex: Sr. Nadège"></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Rôle (optionnel)</ion-label>
            <ion-input v-model="editProgramForm.conductorRole" placeholder="Ex: Dirigeante"></ion-input>
          </ion-item>

          <ion-button @click="updateProgramInfo" expand="block" class="ion-margin-top">
            Mettre à jour
          </ion-button>
        </ion-content>
      </ion-modal>

      <!-- Add/Edit Item Modal -->
      <ion-modal :is-open="showItemFormModal" @ionModalDidDismiss="closeItemFormModal">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ editingItemId ? 'Modifier l\'élément' : 'Ajouter un élément' }}</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeItemFormModal">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-item>
            <ion-label position="stacked">Type *</ion-label>
            <ion-select v-model="itemForm.type" placeholder="Sélectionner un type">
              <ion-select-option v-for="type in programItemTypes" :key="type" :value="type">
                {{ type }}
              </ion-select-option>
            </ion-select>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Titre *</ion-label>
            <ion-input v-model="itemForm.title" placeholder="Ex: Moment d'adoration"></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Sous-titre (optionnel)</ion-label>
            <ion-input v-model="itemForm.subtitle"></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Référence (optionnel)</ion-label>
            <ion-input v-model="itemForm.reference" placeholder="Ex: Mathieu 11v25-30"></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Lier à une ressource (optionnel)</ion-label>
            <ResourceSelector v-model="itemForm.resourceId" />
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Participant (optionnel)</ion-label>
            <ion-input v-model="itemForm.participantName" placeholder="Ex: Pasteur Hugues-Dieu"></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Durée (minutes)</ion-label>
            <ion-input v-model.number="itemForm.duration" type="number" min="0"></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Notes (optionnel)</ion-label>
            <ion-textarea v-model="itemForm.notes" :rows="3"></ion-textarea>
          </ion-item>

          <ion-button
            @click="editingItemId ? updateItem() : addItem()"
            expand="block"
            class="ion-margin-top"
            :disabled="!itemForm.type || !itemForm.title"
          >
            {{ editingItemId ? 'Mettre à jour' : 'Ajouter' }}
          </ion-button>
        </ion-content>
      </ion-modal>

      <!-- Add Sub-Item Modal -->
      <ion-modal :is-open="showAddSubItemModalState" @ionModalDidDismiss="closeAddSubItemModal">
        <ion-header>
          <ion-toolbar>
            <ion-title>Ajouter un sous-élément</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeAddSubItemModal">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-item>
            <ion-label position="stacked">Titre *</ion-label>
            <ion-input v-model="addSubItemForm.title" placeholder="Ex: Kache mwen anba zel ou"></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Lier à une ressource (optionnel)</ion-label>
            <ResourceSelector v-model="addSubItemForm.resourceId" resource-type="song" />
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Notes (optionnel)</ion-label>
            <ion-textarea v-model="addSubItemForm.notes" :rows="3"></ion-textarea>
          </ion-item>

          <ion-button
            @click="addSubItem"
            expand="block"
            class="ion-margin-top"
            :disabled="!addSubItemForm.title"
          >
            Ajouter
          </ion-button>
        </ion-content>
      </ion-modal>

      <!-- Edit Sub-Item Modal -->
      <ion-modal :is-open="showEditSubItemModalState" @ionModalDidDismiss="closeEditSubItemModal">
        <ion-header>
          <ion-toolbar>
            <ion-title>Modifier le sous-élément</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeEditSubItemModal">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-item>
            <ion-label position="stacked">Titre *</ion-label>
            <ion-input v-model="editSubItemForm.title"></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Lier à une ressource (optionnel)</ion-label>
            <ResourceSelector v-model="editSubItemForm.resourceId" resource-type="song" />
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Notes (optionnel)</ion-label>
            <ion-textarea v-model="editSubItemForm.notes" :rows="3"></ion-textarea>
          </ion-item>

          <ion-button
            @click="updateSubItem"
            expand="block"
            class="ion-margin-top"
            :disabled="!editSubItemForm.title"
          >
            Mettre à jour
          </ion-button>
        </ion-content>
      </ion-modal>

      <!-- Media Modal (for displaying lyrics, videos, etc.) -->
      <ion-modal :is-open="showMediaModalState" @ionModalDidDismiss="closeMediaModal" class="media-modal">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ selectedMediaTitle }}</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeMediaModal">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content v-if="selectedMediaContent">
          <!-- YouTube Video -->
          <div v-if="selectedMediaContent.type === 'video' && selectedMediaContent.url && isYouTubeUrl(selectedMediaContent.url)" class="video-container">
            <iframe
              :src="getYouTubeEmbedUrl(selectedMediaContent.url) || ''"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              class="youtube-iframe"
            ></iframe>
          </div>

          <!-- Regular Video Content -->
          <div v-else-if="selectedMediaContent.type === 'video' && selectedMediaContent.url" class="video-container">
            <video controls :src="selectedMediaContent.url" class="full-width-video"></video>
          </div>

          <!-- Spotify Content -->
          <div v-if="selectedMediaContent.type === 'spotify' && selectedMediaContent.url" class="spotify-container">
            <iframe
              :src="getSpotifyEmbedUrl(selectedMediaContent.url) || ''"
              width="100%"
              height="352"
              frameborder="0"
              allowtransparency="true"
              allow="encrypted-media"
              class="spotify-iframe"
            ></iframe>
            <ion-button
              :href="selectedMediaContent.url"
              target="_blank"
              expand="block"
              fill="outline"
              style="margin-top: 1rem;"
            >
              <ion-icon :icon="musicalNoteOutline" slot="start" />
              Ouvrir dans Spotify
            </ion-button>
          </div>

          <!-- Audio Content -->
          <div v-if="selectedMediaContent.type === 'audio' && selectedMediaContent.url" class="audio-container">
            <audio controls :src="selectedMediaContent.url" class="full-width-audio"></audio>
          </div>

          <!-- Lyrics Content -->
          <div v-if="selectedMediaContent.type === 'lyrics'" class="lyrics-container">
            <div class="lyrics-content">
              <pre>{{ selectedMediaContent.content }}</pre>
            </div>
          </div>

          <!-- PDF/Document Content -->
          <div v-if="selectedMediaContent.type === 'music_sheet' && selectedMediaContent.url" class="document-container">
            <ion-button @click="openInNewTab(selectedMediaContent.url)" expand="block" fill="outline">
              <ion-icon :icon="documentOutline" slot="start" />
              Ouvrir la partition
            </ion-button>
          </div>

          <!-- Debug/Fallback - Show if no content matched -->
          <div v-if="!['video', 'spotify', 'audio', 'lyrics', 'music_sheet'].includes(selectedMediaContent.type)" class="debug-container" style="padding: 1rem;">
            <p><strong>Type:</strong> {{ selectedMediaContent.type }}</p>
            <p><strong>URL:</strong> {{ selectedMediaContent.url }}</p>
            <p><strong>Content:</strong> {{ selectedMediaContent.content }}</p>
          </div>
        </ion-content>
      </ion-modal>

      <!-- Item Lyrics View Modal -->
      <ion-modal :is-open="showItemLyricsModalState" @ionModalDidDismiss="closeItemLyricsView" class="lyrics-view-modal">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ selectedItemForLyrics?.title }}</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeItemLyricsView">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="lyrics-view-modal-content">
          <div v-if="selectedItemForLyrics" class="lyrics-view-container">
            <!-- Sub-Items with Titles and Lyrics -->
            <div
              v-for="(subItem, index) in getSortedSubItems(selectedItemForLyrics)"
              :key="subItem.id"
              class="lyrics-item-card"
            >
              <!-- Item Header -->
              <div class="lyrics-item-header">
                <div class="lyrics-item-number">{{ index + 1 }}</div>
                <h3 class="lyrics-item-title">
                  {{ subItem.resourceId && getLinkedResource(subItem.resourceId) ? getLinkedResource(subItem.resourceId)?.title : subItem.title }}
                </h3>
              </div>

              <!-- Lyrics -->
              <div v-if="getSubItemLyrics(subItem)" class="lyrics-content-display">
                <pre>{{ getSubItemLyrics(subItem) }}</pre>
              </div>
              <div v-else class="no-lyrics">
                Aucune parole disponible
              </div>
            </div>
          </div>
        </ion-content>
      </ion-modal>

      <!-- SMS Notification Modal -->
      <SendProgramSMSModal
        :is-open="showSMSModalState"
        :service-id="serviceId"
        :service-title="service?.title || ''"
        :service-date="formatDateTime(service?.date, service?.time)"
        @close="closeSMSModal"
        @sent="onSMSSent"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonCard, IonCardContent, IonLoading, IonModal, IonSelect, IonSelectOption,
  IonItem, IonLabel, IonInput, IonTextarea, toastController, alertController
} from '@ionic/vue';
import {
  calendarOutline, createOutline, listOutline, timeOutline,
  personOutline, documentTextOutline, musicalNotesOutline,
  closeOutline, musicalNoteOutline, libraryOutline, micOutline,
  megaphoneOutline, giftOutline, handLeftOutline, personCircleOutline,
  checkmarkOutline, reorderThreeOutline, addOutline, trashOutline,
  playCircleOutline, volumeHighOutline, documentOutline,
  chatboxEllipsesOutline, chevronDownOutline, chevronForwardOutline
} from 'ionicons/icons';
import ResourceSelector from '@/components/ResourceSelector.vue';
import SendProgramSMSModal from '@/components/SendProgramSMSModal.vue';
import { serviceService } from '@/services/serviceService';
import { timezoneUtils } from '@/utils/timezone';
import { useUser } from '@/composables/useUser';
import {
  getProgramByServiceId,
  createProgram,
  updateProgram,
  addItemToProgram,
  updateItemInProgram,
  deleteItemFromProgram,
  addSubItemToItem,
  updateSubItemInItem,
  deleteSubItemFromItem
} from '@/firebase/programs';
import type { Service } from '@/types/service';
import type { ServiceProgram, ProgramItem, ProgramParticipant, ProgramSubItem } from '@/types/program';
import { ProgramItemType } from '@/types/program';
import type { Resource, ResourceMedia } from '@/types/resource';
import { getResourceById } from '@/firebase/resources';
import { isYouTubeUrl, getYouTubeEmbedUrl, isSpotifyUrl, getSpotifyEmbedUrl } from '@/utils/resource-utils';

const route = useRoute();
const router = useRouter();
const { user, isAdmin } = useUser();

// Reactive State
const loading = ref(true);
const service = ref<Service | null>(null);
const program = ref<ServiceProgram | null>(null);
const linkedResources = ref<Map<string, Resource>>(new Map());
const isEditMode = ref(false);

// Edit Program Modal
const showEditProgramModalState = ref(false);
const editProgramForm = ref({
  conductorName: '',
  conductorRole: ''
});

// Item Form Modal
const showItemFormModal = ref(false);
const editingItemId = ref<string | null>(null);
const itemForm = ref({
  type: '' as ProgramItemType,
  title: '',
  subtitle: '',
  reference: '',
  participantName: '',
  duration: 5,
  notes: '',
  resourceId: null as string | null
});

// Sub-item state
const showAddSubItemModalState = ref(false);
const parentItemIdForSubItem = ref<string | null>(null);
const addSubItemForm = ref({
  title: '',
  resourceId: null as string | null,
  notes: ''
});

const showEditSubItemModalState = ref(false);
const editSubItemForm = ref({
  id: '',
  parentItemId: '',
  title: '',
  resourceId: null as string | null,
  notes: ''
});

const expandedItems = ref<Set<string>>(new Set());

// Media Modal
const showMediaModalState = ref(false);
const selectedMediaContent = ref<any>(null);
const selectedMediaTitle = ref('');

// SMS Modal
const showSMSModalState = ref(false);

// Item Lyrics View Modal
const showItemLyricsModalState = ref(false);
const selectedItemForLyrics = ref<ProgramItem | null>(null);

// Computed Properties
const serviceId = computed(() => route.params.id as string);

const programItemTypes = computed(() => Object.values(ProgramItemType));

const sortedItems = computed(() => {
  if (!program.value) return [];
  return [...program.value.items].sort((a, b) => a.order - b.order);
});

const totalDuration = computed(() => {
  if (!program.value) return 0;
  return program.value.items.reduce((sum, item) => sum + (item.duration || 0), 0);
});

// Helper Functions
const formatDateTime = (dateStr: string | undefined, timeStr: string | undefined): string => {
  if (!dateStr || !timeStr) return '';
  return timezoneUtils.formatDateTimeForDisplay(dateStr, timeStr);
};

const getItemIcon = (type: ProgramItemType) => {
  const iconMap: Record<string, string> = {
    'Chant': musicalNoteOutline,
    'Prière': handLeftOutline,
    'Lecture biblique': libraryOutline,
    'Prédication': micOutline,
    'Titre': documentTextOutline,
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

const getLinkedResource = (resourceId: string): Resource | undefined => {
  return linkedResources.value.get(resourceId);
};

const hasSubItems = (item: ProgramItem): boolean => {
  return !!(item.subItems && item.subItems.length > 0);
};

const isItemExpanded = (itemId: string): boolean => {
  return expandedItems.value.has(itemId);
};

const toggleItemExpansion = (itemId: string) => {
  if (expandedItems.value.has(itemId)) {
    expandedItems.value.delete(itemId);
  } else {
    expandedItems.value.add(itemId);
  }
};

const getSortedSubItems = (item: ProgramItem): ProgramSubItem[] => {
  if (!item.subItems) return [];
  return [...item.subItems].sort((a, b) => a.order - b.order);
};

// Check if item has lyrics in any sub-items
const hasLyricsInSubItems = (item: ProgramItem): boolean => {
  if (!item.subItems || item.subItems.length === 0) return false;

  return item.subItems.some(subItem => {
    if (subItem.resourceId) {
      const resource = getLinkedResource(subItem.resourceId);
      return resource?.contents?.some(c => c.type === 'lyrics' && c.content);
    }
    return false;
  });
};

// Get lyrics from a sub-item
const getSubItemLyrics = (subItem: ProgramSubItem): string | null => {
  if (subItem.resourceId) {
    const resource = getLinkedResource(subItem.resourceId);
    const lyricsContent = resource?.contents?.find(c => c.type === 'lyrics');
    return lyricsContent?.content || null;
  }
  return null;
};

// Show item lyrics view
const showItemLyricsView = (item: ProgramItem) => {
  selectedItemForLyrics.value = item;
  showItemLyricsModalState.value = true;
};

// Close item lyrics view
const closeItemLyricsView = () => {
  showItemLyricsModalState.value = false;
  selectedItemForLyrics.value = null;
};

// Toast Helper
const showToast = async (message: string, color: 'success' | 'danger' | 'warning' = 'success') => {
  const toast = await toastController.create({
    message,
    duration: 3000,
    color,
    position: 'bottom'
  });
  await toast.present();
};

// Confirm Helper
const confirmAction = async (message: string): Promise<boolean> => {
  return new Promise(async (resolve) => {
    const alert = await alertController.create({
      header: 'Confirmation',
      message,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
          handler: () => resolve(false)
        },
        {
          text: 'Confirmer',
          handler: () => resolve(true)
        }
      ]
    });
    await alert.present();
  });
};

// Load Data
const loadService = async () => {
  try {
    service.value = await serviceService.getServiceById(serviceId.value);
  } catch (error) {
    console.error('Error loading service:', error);
    await showToast('Erreur lors du chargement du service', 'danger');
  }
};

const loadProgram = async () => {
  try {
    const programData = await getProgramByServiceId(serviceId.value);
    program.value = programData;

    if (programData) {
      // Load linked resources
      const resourceIds = new Set<string>();
      programData.items.forEach(item => {
        if (item.resourceId) resourceIds.add(item.resourceId);
        item.subItems?.forEach(subItem => {
          if (subItem.resourceId) resourceIds.add(subItem.resourceId);
        });
      });

      for (const resourceId of resourceIds) {
        try {
          const resource = await getResourceById(resourceId);
          if (resource) {
            linkedResources.value.set(resourceId, resource);
          }
        } catch (error) {
          console.error(`Error loading resource ${resourceId}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error loading program:', error);
  }
};

// Create Initial Program
const createInitialProgram = async () => {
  if (!user.value) return;

  try {
    loading.value = true;

    await createProgram(
      {
        serviceId: serviceId.value,
        items: [],
        sections: [], // Empty for flat structure
        totalDuration: 0
      },
      user.value.uid
    );

    await loadProgram();
    await showToast('Programme créé avec succès', 'success');
  } catch (error) {
    console.error('Error creating program:', error);
    await showToast('Erreur lors de la création du programme', 'danger');
  } finally {
    loading.value = false;
  }
};

// Edit Mode
const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value;
};

// Edit Program Modal
const showEditProgramModal = () => {
  if (program.value) {
    editProgramForm.value = {
      conductorName: program.value.conductor?.name || '',
      conductorRole: program.value.conductor?.role || ''
    };
  }
  showEditProgramModalState.value = true;
};

const closeEditProgramModal = () => {
  showEditProgramModalState.value = false;
};

const updateProgramInfo = async () => {
  if (!program.value || !user.value) return;

  try {
    loading.value = true;

    // Build conductor object, excluding undefined values
    let conductor: ProgramParticipant | undefined = undefined;
    if (editProgramForm.value.conductorName) {
      conductor = {
        id: `custom_${Date.now()}`,
        name: editProgramForm.value.conductorName,
        isCustom: true
      } as ProgramParticipant;

      // Only add role if it has a value
      if (editProgramForm.value.conductorRole) {
        conductor.role = editProgramForm.value.conductorRole;
      }
    }

    await updateProgram(
      program.value.id,
      { conductor },
      user.value.uid
    );

    await loadProgram();
    closeEditProgramModal();
    await showToast('Programme mis à jour', 'success');
  } catch (error) {
    console.error('Error updating program:', error);
    await showToast('Erreur lors de la mise à jour', 'danger');
  } finally {
    loading.value = false;
  }
};

// Item Management
const showAddItemModal = () => {
  editingItemId.value = null;
  itemForm.value = {
    type: '' as ProgramItemType,
    title: '',
    subtitle: '',
    reference: '',
    participantName: '',
    duration: 5,
    notes: '',
    resourceId: null
  };
  showItemFormModal.value = true;
};

const showEditItemModalForItem = (item: ProgramItem) => {
  editingItemId.value = item.id;
  itemForm.value = {
    type: item.type,
    title: item.title,
    subtitle: item.subtitle || '',
    reference: item.reference || '',
    participantName: item.participant?.name || '',
    duration: item.duration || 5,
    notes: item.notes || '',
    resourceId: item.resourceId || null
  };
  showItemFormModal.value = true;
};

const closeItemFormModal = () => {
  showItemFormModal.value = false;
  editingItemId.value = null;
};

const addItem = async () => {
  if (!program.value || !user.value) return;

  try {
    loading.value = true;

    const participant: ProgramParticipant | undefined = itemForm.value.participantName
      ? {
          id: `custom_${Date.now()}`,
          name: itemForm.value.participantName,
          isCustom: true
        }
      : undefined;

    // Build item object, excluding undefined values
    const newItem: any = {
      order: program.value.items.length,
      type: itemForm.value.type,
      title: itemForm.value.title
    };

    // Only add optional fields if they have values
    if (itemForm.value.subtitle) newItem.subtitle = itemForm.value.subtitle;
    if (itemForm.value.reference) newItem.reference = itemForm.value.reference;
    if (participant) newItem.participant = participant;
    if (itemForm.value.duration) newItem.duration = itemForm.value.duration;
    if (itemForm.value.notes) newItem.notes = itemForm.value.notes;
    if (itemForm.value.resourceId) newItem.resourceId = itemForm.value.resourceId;

    await addItemToProgram(
      program.value.id,
      newItem,
      user.value.uid
    );

    await loadProgram();
    closeItemFormModal();
    await showToast('Élément ajouté avec succès', 'success');
  } catch (error) {
    console.error('Error adding item:', error);
    await showToast('Erreur lors de l\'ajout de l\'élément', 'danger');
  } finally {
    loading.value = false;
  }
};

const updateItem = async () => {
  if (!program.value || !user.value || !editingItemId.value) return;

  try {
    loading.value = true;

    const participant: ProgramParticipant | undefined = itemForm.value.participantName
      ? {
          id: `custom_${Date.now()}`,
          name: itemForm.value.participantName,
          isCustom: true
        }
      : undefined;

    // Build update object, excluding undefined values
    const updates: any = {
      type: itemForm.value.type,
      title: itemForm.value.title
    };

    // Only add optional fields if they have values
    if (itemForm.value.subtitle) updates.subtitle = itemForm.value.subtitle;
    if (itemForm.value.reference) updates.reference = itemForm.value.reference;
    if (participant) updates.participant = participant;
    if (itemForm.value.duration) updates.duration = itemForm.value.duration;
    if (itemForm.value.notes) updates.notes = itemForm.value.notes;
    if (itemForm.value.resourceId) updates.resourceId = itemForm.value.resourceId;

    await updateItemInProgram(
      program.value.id,
      editingItemId.value,
      updates,
      user.value.uid
    );

    await loadProgram();
    closeItemFormModal();
    await showToast('Élément mis à jour', 'success');
  } catch (error) {
    console.error('Error updating item:', error);
    await showToast('Erreur lors de la mise à jour', 'danger');
  } finally {
    loading.value = false;
  }
};

const deleteItem = async (itemId: string) => {
  if (!program.value || !user.value) return;

  const confirmed = await confirmAction('Supprimer cet élément du programme ?');
  if (!confirmed) return;

  try {
    loading.value = true;

    await deleteItemFromProgram(program.value.id, itemId, user.value.uid);

    await loadProgram();
    await showToast('Élément supprimé', 'success');
  } catch (error) {
    console.error('Error deleting item:', error);
    await showToast('Erreur lors de la suppression', 'danger');
  } finally {
    loading.value = false;
  }
};

// Sub-Item Management
const showAddSubItemModalForItem = (itemId: string) => {
  parentItemIdForSubItem.value = itemId;
  addSubItemForm.value = {
    title: '',
    resourceId: null,
    notes: ''
  };
  showAddSubItemModalState.value = true;
};

const closeAddSubItemModal = () => {
  showAddSubItemModalState.value = false;
  parentItemIdForSubItem.value = null;
};

const addSubItem = async () => {
  if (!program.value || !parentItemIdForSubItem.value || !user.value) return;

  try {
    loading.value = true;

    const parentItem = program.value.items.find(i => i.id === parentItemIdForSubItem.value);
    const currentSubItems = parentItem?.subItems || [];

    // Build sub-item object, excluding undefined values
    const newSubItem: any = {
      title: addSubItemForm.value.title,
      order: currentSubItems.length
    };

    // Only add optional fields if they have values
    if (addSubItemForm.value.resourceId) newSubItem.resourceId = addSubItemForm.value.resourceId;
    if (addSubItemForm.value.notes) newSubItem.notes = addSubItemForm.value.notes;

    await addSubItemToItem(
      program.value.id,
      parentItemIdForSubItem.value,
      newSubItem,
      user.value.uid
    );

    await loadProgram();

    // Auto-expand the parent item
    expandedItems.value.add(parentItemIdForSubItem.value);

    closeAddSubItemModal();
    await showToast('Sous-élément ajouté', 'success');
  } catch (error) {
    console.error('Error adding sub-item:', error);
    await showToast('Erreur lors de l\'ajout', 'danger');
  } finally {
    loading.value = false;
  }
};

const showEditSubItemModalForItem = (itemId: string, subItem: ProgramSubItem) => {
  parentItemIdForSubItem.value = itemId;
  editSubItemForm.value = {
    id: subItem.id,
    parentItemId: itemId,
    title: subItem.title,
    resourceId: subItem.resourceId || null,
    notes: subItem.notes || ''
  };
  showEditSubItemModalState.value = true;
};

const closeEditSubItemModal = () => {
  showEditSubItemModalState.value = false;
  parentItemIdForSubItem.value = null;
};

const updateSubItem = async () => {
  if (!program.value || !editSubItemForm.value.parentItemId || !user.value) return;

  try {
    loading.value = true;

    // Build update object, excluding undefined values
    const updates: any = {
      title: editSubItemForm.value.title
    };

    // Only add optional fields if they have values
    if (editSubItemForm.value.resourceId) updates.resourceId = editSubItemForm.value.resourceId;
    if (editSubItemForm.value.notes) updates.notes = editSubItemForm.value.notes;

    await updateSubItemInItem(
      program.value.id,
      editSubItemForm.value.parentItemId,
      editSubItemForm.value.id,
      updates,
      user.value.uid
    );

    await loadProgram();
    closeEditSubItemModal();
    await showToast('Sous-élément mis à jour', 'success');
  } catch (error) {
    console.error('Error updating sub-item:', error);
    await showToast('Erreur', 'danger');
  } finally {
    loading.value = false;
  }
};

const deleteSubItem = async (itemId: string, subItemId: string) => {
  if (!program.value || !user.value) return;

  const confirmed = await confirmAction('Supprimer ce sous-élément ?');
  if (!confirmed) return;

  try {
    loading.value = true;

    await deleteSubItemFromItem(
      program.value.id,
      itemId,
      subItemId,
      user.value.uid
    );

    await loadProgram();
    await showToast('Sous-élément supprimé', 'success');
  } catch (error) {
    console.error('Error deleting sub-item:', error);
    await showToast('Erreur', 'danger');
  } finally {
    loading.value = false;
  }
};

// Media Functions
const showMediaContent = (content: any, title: string) => {
  selectedMediaContent.value = content;
  selectedMediaTitle.value = title;
  showMediaModalState.value = true;
};

const closeMediaModal = () => {
  showMediaModalState.value = false;
  selectedMediaContent.value = null;
  selectedMediaTitle.value = '';
};

const openInNewTab = (url: string) => {
  window.open(url, '_blank');
};

// SMS Functions
const showSMSModal = () => {
  showSMSModalState.value = true;
};

const closeSMSModal = () => {
  showSMSModalState.value = false;
};

const onSMSSent = () => {
  showToast('SMS envoyé avec succès', 'success');
};

// Lifecycle
onMounted(async () => {
  loading.value = true;
  await loadService();
  await loadProgram();
  loading.value = false;
});
</script>

<style scoped>
/* Service Header */
.service-header {
  background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-primary-shade) 100%);
  padding: 1.5rem;
  color: white;
}

.service-info-card {
  text-align: center;
}

.service-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.service-datetime {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 1rem;
  opacity: 0.9;
  margin: 0;
}

/* Content Container */
.content-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem;
}

/* Program Summary */
.program-summary {
  margin-bottom: 1.5rem;
}

.program-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.program-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.summary-stats {
  display: flex;
  justify-content: space-around;
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stat-icon {
  font-size: 1.5rem;
  color: var(--ion-color-primary);
}

.stat-details {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--ion-color-dark);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
}

/* Conductor Info */
.conductor-info {
  border-top: 1px solid var(--ion-color-light);
  padding-top: 1rem;
  margin-top: 1rem;
}

.conductor-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.conductor-icon {
  font-size: 2rem;
  color: var(--ion-color-primary);
}

.conductor-details {
  display: flex;
  flex-direction: column;
}

.conductor-label {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
}

.conductor-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--ion-color-dark);
}

.conductor-role {
  font-size: 0.9rem;
  color: var(--ion-color-medium);
  font-style: italic;
}

/* No Program State */
.no-program {
  margin-top: 2rem;
}

.text-center {
  text-align: center;
}

.large-icon {
  font-size: 4rem;
  color: var(--ion-color-medium);
  margin-bottom: 1rem;
}

/* Add Item Button */
.add-item-container {
  margin: 1rem 0;
  display: flex;
  justify-content: center;
}

.add-item-button {
  min-width: 200px;
}

/* Program Items */
.program-content {
  margin: 1rem 0;
}

.flat-items-view {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.program-item-wrapper {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.program-item-wrapper.has-subitems {
  border-left: 3px solid var(--ion-color-primary);
}

.program-item-wrapper.expanded {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.program-item {
  padding: 1rem;
}

.item-layout {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

/* Item Columns */
.item-column {
  display: flex;
  flex-direction: column;
}

.item-handle-column {
  flex-shrink: 0;
  width: 30px;
}

.drag-handle {
  cursor: grab;
  color: var(--ion-color-medium);
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
}

.drag-handle:active {
  cursor: grabbing;
}

.item-order-column {
  flex-shrink: 0;
  width: 40px;
}

.item-order {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--ion-color-light);
  color: var(--ion-color-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
}

.item-details-column {
  flex: 1;
  min-width: 0;
}

.item-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.item-type {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--ion-color-primary);
  font-weight: 500;
}

.expand-button {
  --padding-start: 0.5rem;
  --padding-end: 0.5rem;
  height: 28px;
  font-size: 0.85rem;
}

.item-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  color: var(--ion-color-dark);
}

.item-subtitle {
  font-size: 0.95rem;
  color: var(--ion-color-medium);
  margin: 0 0 0.25rem 0;
}

.item-reference {
  font-size: 0.9rem;
  color: var(--ion-color-medium);
  font-style: italic;
  margin: 0 0 0.25rem 0;
}

.item-notes {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--ion-color-medium-shade);
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: var(--ion-color-light);
  border-radius: 4px;
}

.item-notes ion-icon {
  flex-shrink: 0;
  margin-top: 0.2rem;
}

.item-resources {
  margin-top: 0.75rem;
}

.media-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.media-chip-button {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--ion-color-primary);
  border-radius: 16px;
  background: white;
  color: var(--ion-color-primary);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.media-chip-button:hover {
  background: var(--ion-color-primary);
  color: white;
}

.media-chip-button.small {
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
}

.item-meta-column {
  flex-shrink: 0;
  min-width: 120px;
  gap: 0.5rem;
  align-items: flex-end;
  text-align: right;
}

.item-duration,
.item-participant {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--ion-color-medium-shade);
}

.participant-role {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
}

.item-actions-column {
  flex-shrink: 0;
  min-width: 120px;
}

.item-actions {
  display: flex;
  gap: 0.25rem;
  justify-content: flex-end;
}

/* Sub-Items */
.sub-items-container {
  margin: 1rem 0 0 3rem;
  padding: 0.75rem 0 0 1rem;
  border-left: 2px solid var(--ion-color-light-shade);
}

.sub-item {
  margin-bottom: 0.75rem;
}

.sub-item:last-child {
  margin-bottom: 0;
}

.sub-item-layout {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.sub-item-bullet {
  flex-shrink: 0;
  font-size: 1.2rem;
  color: var(--ion-color-primary);
  margin-top: 0.1rem;
}

.sub-item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.sub-item-title {
  font-size: 0.95rem;
  color: var(--ion-color-dark);
  font-weight: 500;
}

.sub-item-notes {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  font-style: italic;
}

.sub-item-resources {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
  align-items: center;
}

.sub-item-actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

/* Media Modal */
.media-modal {
  --width: 90%;
  --height: 80%;
  --border-radius: 12px;
}

.video-container,
.audio-container,
.spotify-container,
.lyrics-container,
.document-container {
  padding: 1rem;
}

.full-width-video,
.full-width-audio {
  width: 100%;
}

.youtube-iframe {
  width: 100%;
  aspect-ratio: 16/9;
  min-height: 315px;
  border-radius: 8px;
}

.spotify-iframe {
  width: 100%;
  border-radius: 12px;
}

.lyrics-content {
  background: var(--ion-color-light);
  padding: 1.5rem;
  border-radius: 8px;
}

.lyrics-content pre {
  white-space: pre-wrap;
  font-family: var(--ion-font-family);
  font-size: 1rem;
  line-height: 1.6;
  margin: 0;
}

/* Lyrics View Button */
.item-lyrics-button {
  margin-top: 0.75rem;
}

.view-lyrics-btn {
  --padding-top: 8px;
  --padding-bottom: 8px;
  --padding-start: 16px;
  --padding-end: 16px;
  font-weight: 600;
}

/* Lyrics View Modal */
.lyrics-view-modal {
  --width: 90%;
  --height: 80%;
  --border-radius: 12px;
}

.lyrics-view-modal-content {
  --padding-top: 1rem;
}

.lyrics-view-container {
  padding: 1rem;
}

.lyrics-item-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.lyrics-item-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid var(--ion-color-primary);
}

.lyrics-item-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--ion-color-primary);
  color: white;
  border-radius: 50%;
  font-weight: 700;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.lyrics-item-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--ion-color-dark);
  flex: 1;
}

.lyrics-content-display {
  background: var(--ion-color-light);
  padding: 1.5rem;
  border-radius: 8px;
  margin-top: 1rem;
}

.lyrics-content-display pre {
  white-space: pre-wrap;
  font-family: var(--ion-font-family);
  font-size: 1rem;
  line-height: 1.8;
  margin: 0;
  color: var(--ion-color-dark);
}

.no-lyrics {
  text-align: center;
  padding: 2rem;
  color: var(--ion-color-medium);
  font-style: italic;
}

/* Responsive Design */
@media (max-width: 768px) {
  .item-layout {
    flex-wrap: wrap;
  }

  .item-meta-column {
    width: 100%;
    align-items: flex-start;
    text-align: left;
    margin-top: 0.5rem;
  }

  .item-duration,
  .item-participant {
    justify-content: flex-start;
  }

  .item-actions-column {
    width: 100%;
    margin-top: 0.5rem;
  }

  .item-actions {
    justify-content: flex-start;
  }

  .sub-items-container {
    margin-left: 1.5rem;
  }

  .summary-stats {
    flex-direction: column;
    gap: 0.75rem;
  }
}

/* Edit Mode */
.edit-mode .program-item {
  border: 1px dashed var(--ion-color-light-shade);
}

.edit-mode .program-item-wrapper:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
</style>
