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
                <ion-button v-if="isAdmin" @click="showEditModal" fill="clear" size="small" color="primary">
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
                    <span class="stat-value">{{ program.totalDuration || 0 }}</span>
                    <span class="stat-label">Minutes</span>
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
        <div v-if="program && (program.items.length > 0 || program.sections.length > 0)" class="program-content">
          <!-- Render by sections if they exist -->
          <div v-if="program.sections.length > 0" class="sections-view">
            <div v-for="section in sortedSections" :key="section.id" class="program-section" :data-section-id="section.id">
              <div class="section-header" @click="!isEditMode && showSectionView(section)">
                <div v-if="isEditMode" class="section-drag-handle" @mousedown="startSectionDrag($event, section)" @touchstart="startSectionDrag($event, section)">
                  <ion-icon :icon="reorderThreeOutline" />
                </div>
                <h3 class="section-title">{{ section.title }}</h3>
                <div class="section-stats">
                  {{ getSectionItemsCount(section.id) }} éléments
                  • {{ getSectionDuration(section.id) }} min
                </div>

                <!-- Section Actions (Edit Mode Only) -->
                <div v-if="isEditMode" class="section-actions">
                  <ion-button @click.stop="showEditSectionModal(section)" fill="clear" size="small" color="primary">
                    <ion-icon :icon="createOutline" slot="icon-only" />
                  </ion-button>
                  <ion-button
                    @click.stop="deleteSection(section.id)"
                    fill="clear"
                    size="small"
                    color="danger"
                    :disabled="!canDeleteSection(section.id)"
                  >
                    <ion-icon :icon="trashOutline" slot="icon-only" />
                  </ion-button>
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
                      <div class="item-order">{{ item.globalOrder || item.order }}</div>
                    </div>
                    
                    <!-- Column 3: Details -->
                    <div class="item-column item-details-column">
                      <div class="item-type">
                        <ion-icon :icon="getItemIcon(item.type)" />
                        {{ item.type }}
                      </div>
                      <h4 class="item-title">{{ item.resourceId && getLinkedResource(item.resourceId) ? getLinkedResource(item.resourceId)?.title : item.title }}</h4>
                      <p v-if="item.subtitle" class="item-subtitle">{{ item.subtitle }}</p>

                      <div v-if="item.notes" class="item-details">
                        <div v-if="item.notes" class="item-notes">
                          <ion-icon :icon="documentTextOutline" />
                          {{ item.notes }}
                        </div>
                      </div>
                  
                      
                      <div v-if="item.resourceId && getLinkedResource(item.resourceId)" class="item-resources">
                        <div class="media-buttons">
                          <button
                            v-for="content in getLinkedResource(item.resourceId)?.contents"
                            :key="content.type"
                            @click="showMediaContent(content, getLinkedResource(item.resourceId)?.title)"
                            class="media-chip-button"
                          >
                            <ion-icon :icon="getMediaTypeIcon(content.type)" />
                            <span>{{ content.type === 'lyrics' ? 'Paroles' : content.type === 'video' ? 'Vidéo' : content.type === 'audio' ? 'Audio' : content.type === 'music_sheet' ? 'Partition' : content.type }}</span>
                          </button>
                        </div>
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
                    
                    <!-- Column 5: Edit/Delete Actions (Edit Mode Only) -->
                    <div v-if="isEditMode" class="item-column item-actions-column">
                      <div class="item-actions">
                        <ion-button @click="showEditItemModal(item)" fill="clear" size="small" color="primary">
                          <ion-icon :icon="createOutline" slot="icon-only" />
                        </ion-button>
                        <ion-button @click="deleteItem(item.id)" fill="clear" size="small" color="danger">
                          <ion-icon :icon="trashOutline" slot="icon-only" />
                        </ion-button>
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
                  <div class="item-order">{{ index + 1 }}</div>
                </div>
                
                <!-- Column 3: Details -->
                <div class="item-column item-details-column">
                  <div class="item-type">
                    <ion-icon :icon="getItemIcon(item.type)" />
                    {{ item.type }}
                  </div>
                  <h4 class="item-title">{{ item.resourceId && getLinkedResource(item.resourceId) ? getLinkedResource(item.resourceId)?.title : item.title }}</h4>
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
                
                <!-- Column 5: Edit/Delete Actions (Edit Mode Only) -->
                <div v-if="isEditMode" class="item-column item-actions-column">
                  <div class="item-actions">
                    <ion-button @click="showEditItemModal(item)" fill="clear" size="small" color="primary">
                      <ion-icon :icon="createOutline" slot="icon-only" />
                    </ion-button>
                    <ion-button @click="deleteItem(item.id)" fill="clear" size="small" color="danger">
                      <ion-icon :icon="trashOutline" slot="icon-only" />
                    </ion-button>
                  </div>
                </div>
              </div>
              
              <div v-if="item.notes" class="item-details">
                <div v-if="item.notes" class="item-notes">
                  <ion-icon :icon="documentTextOutline" />
                  {{ item.notes }}
                </div>
              </div>
              
              
              <div v-if="item.resourceId && getLinkedResource(item.resourceId)" class="item-resources">
                <div class="media-buttons">
                  <button
                    v-for="content in getLinkedResource(item.resourceId)?.contents"
                    :key="content.type"
                    @click="showMediaContent(content, getLinkedResource(item.resourceId)?.title)"
                    class="media-chip-button"
                  >
                    <ion-icon :icon="getMediaTypeIcon(content.type)" />
                    <span>{{ content.type === 'lyrics' ? 'Paroles' : content.type === 'video' ? 'Vidéo' : content.type === 'audio' ? 'Audio' : content.type === 'music_sheet' ? 'Partition' : content.type }}</span>
                  </button>
                </div>
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
        <div v-else-if="!program" class="empty-state">
          <ion-icon :icon="documentTextOutline" size="large" color="medium"></ion-icon>
          <h3>Aucun programme</h3>
          <p>{{ isAdmin ? "Aucun programme n'a encore été créé pour ce service." : "Le programme n'est pas encore disponible." }}</p>
          <ion-button v-if="isAdmin" @click="showEditModal" fill="outline" size="small">
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
        <ion-content class="ion-padding">
          {{ selectedItem?.lyrics }}
          <!-- <div class="lyrics-text">
            <pre>{{ selectedItem?.lyrics }}</pre>
          </div> -->
        </ion-content>
      </ion-modal>
      
      <!-- Resource Detail Modal -->
      <ion-modal :is-open="showResourceModal" @ionModalDidDismiss="closeResourceModal">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ selectedResource?.title }}</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeResourceModal">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="resource-detail-content">
          <div class="resource-details" v-if="selectedResource">
            <div class="resource-info">
              <div class="resource-media-list">
                <h4>Contenus disponibles</h4>
                <div 
                  v-for="(content, index) in selectedResource.contents" 
                  :key="index"
                  class="media-item"
                >
                  <div class="media-info">
                    <ion-icon :icon="getMediaTypeIcon(content.type)" class="media-icon" />
                    <div class="media-details">
                      <span class="media-type">
                        {{ content.type === 'lyrics' ? 'Paroles' : content.type === 'video' ? 'Vidéo' : content.type === 'audio' ? 'Audio' : content.type === 'music_sheet' ? 'Partition' : content.type }}
                      </span>
                      <span v-if="content.notes" class="media-notes">{{ content.notes }}</span>
                    </div>
                  </div>
                  <div class="media-actions">
                    <ion-button
                      v-if="content.url"
                      @click="showMediaContent(content)"
                      fill="outline"
                      size="small"
                    >
                      <ion-icon :icon="linkOutline" slot="start" />
                      Ouvrir
                    </ion-button>
                    <ion-button 
                      v-else-if="content.content && content.type === 'lyrics'"
                      @click="showLyricsContent(content.content)"
                      fill="outline"
                      size="small"
                    >
                      <ion-icon :icon="musicalNotesOutline" slot="start" />
                      Voir
                    </ion-button>
                  </div>
                </div>
              </div>
              
              <div class="resource-actions">
                <ion-button 
                  @click="navigateToResource(selectedResource.id)"
                  fill="solid"
                  color="primary"
                >
                  <ion-icon :icon="libraryOutline" slot="start" />
                  Voir la ressource complète
                </ion-button>
              </div>
            </div>
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
            
            <ion-item>
              <ion-label position="stacked">Insérer après</ion-label>
              <ion-select 
                v-model="insertAfterSectionId" 
                placeholder="Choisir une section (optionnel)"
                interface="popover"
              >
                <ion-select-option :value="null">Au début du programme</ion-select-option>
                <ion-select-option 
                  v-for="section in sortedSections" 
                  :key="section.id" 
                  :value="section.id"
                >
                  Après "{{ section.title }}"
                </ion-select-option>
              </ion-select>
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

      <!-- Edit Section Modal -->
      <ion-modal :is-open="showEditSectionModalState" @ionModalDidDismiss="closeEditSectionModal">
        <ion-header>
          <ion-toolbar>
            <ion-title>Modifier la section</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeEditSectionModal">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="edit-section-modal-content">
          <div class="section-form">
            <ion-item>
              <ion-label position="stacked">Nom de la section</ion-label>
              <ion-input 
                v-model="editSectionForm.title" 
                placeholder="Ex: Louange, Prière, Prédication..."
                @keyup.enter="saveEditSection"
              ></ion-input>
            </ion-item>
            
            <div class="modal-actions">
              <ion-button @click="closeEditSectionModal" fill="clear" color="medium">
                Annuler
              </ion-button>
              <ion-button 
                @click="saveEditSection" 
                :disabled="!editSectionForm.title.trim()"
                color="primary"
              >
                <ion-icon :icon="checkmarkOutline" slot="start" />
                Enregistrer
              </ion-button>
            </div>
          </div>
        </ion-content>
      </ion-modal>

      <!-- Section View Modal -->
      <ion-modal :is-open="showSectionViewModal" @ionModalDidDismiss="closeSectionView">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ selectedSection?.title }}</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeSectionView">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="section-view-modal-content">
          <div v-if="selectedSection" class="section-view-container">
            <!-- Section Items with Titles and Lyrics -->
            <div
              v-for="(item, index) in getSectionItems(selectedSection.id)"
              :key="item.id"
              class="section-item-card"
            >
              <!-- Item Header -->
              <div class="item-header">
                <div class="item-number">{{ index + 1 }}</div>
                <h3 class="item-title">{{ item.resourceId && getLinkedResource(item.resourceId) ? getLinkedResource(item.resourceId)?.title : item.title }}</h3>
              </div>

              <!-- Lyrics -->
              <div v-if="item.lyrics || (item.resourceId && getLinkedResource(item.resourceId)?.contents?.find(c => c.type === 'lyrics'))" class="lyrics-content">
                {{ item.lyrics || getLinkedResource(item.resourceId)?.contents?.find(c => c.type === 'lyrics')?.content }}
              </div>
            </div>
          </div>
        </ion-content>
      </ion-modal>

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
        <ion-content class="edit-program-modal-content">
          <div class="modal-form">
            
            <ion-item>
              <ion-label position="stacked">Dirigeant du service</ion-label>
              <ion-input 
                v-model="editProgramForm.conductorName" 
                placeholder="Nom du dirigeant/pasteur"
              ></ion-input>
            </ion-item>
            
            <ion-item>
              <ion-label position="stacked">Rôle du dirigeant</ion-label>
              <ion-input 
                v-model="editProgramForm.conductorRole" 
                placeholder="Ex: Pasteur, Dirigeant, etc."
              ></ion-input>
            </ion-item>
            
            <!-- Duration is calculated automatically from items, so we just display it -->
            <ion-item>
              <ion-label position="stacked">Durée totale (minutes)</ion-label>
              <ion-input 
                :value="program?.totalDuration || 0" 
                readonly
                placeholder="Calculée automatiquement"
                type="number"
              ></ion-input>
            </ion-item>
            
            <div class="modal-actions">
              <ion-button @click="closeEditProgramModal" fill="clear" color="medium">
                Annuler
              </ion-button>
              <ion-button 
                @click="saveEditProgram" 
                color="primary"
              >
                <ion-icon :icon="checkmarkOutline" slot="start" />
                Enregistrer
              </ion-button>
            </div>
          </div>
        </ion-content>
      </ion-modal>
      
      <!-- Add Item Form Modal -->
      <ion-modal :is-open="showAddItemFormModal" @ionModalDidDismiss="closeAddItemForm">
        <ion-header>
          <ion-toolbar>
            <ion-title>Ajouter {{ addItemForm.type }}</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeAddItemForm">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="add-item-form-modal-content">
          <div class="modal-form">
            
            <ion-item>
              <ion-label position="stacked">Titre *</ion-label>
              <ion-input 
                v-model="addItemForm.title" 
                placeholder="Titre de l'élément"
                required
              ></ion-input>
            </ion-item>
            
            <ion-item>
              <ion-label position="stacked">Sous-titre</ion-label>
              <ion-input 
                v-model="addItemForm.subtitle" 
                placeholder="Sous-titre optionnel"
              ></ion-input>
            </ion-item>
            
            <ion-item>
              <ion-label position="stacked">Participant</ion-label>
              <ion-input 
                v-model="addItemForm.participantName" 
                placeholder="Nom du participant"
              ></ion-input>
            </ion-item>
            
            
            <ion-item>
              <ion-label position="stacked">Durée (minutes) *</ion-label>
              <ion-input 
                v-model="addItemForm.duration" 
                type="number"
                placeholder="5"
                required
              ></ion-input>
            </ion-item>
            
            
            <ion-item>
              <ion-label position="stacked">Notes</ion-label>
              <ion-textarea 
                v-model="addItemForm.notes" 
                placeholder="Notes ou instructions spéciales"
                :rows="3"
              ></ion-textarea>
            </ion-item>
            
            
            <!-- Resource Selector -->
            <div class="resource-selector-container">
              <ResourceSelector v-model="addItemForm.resourceId" />
            </div>
            
            <div class="modal-actions">
              <ion-button @click="closeAddItemForm" fill="clear" color="medium">
                Annuler
              </ion-button>
              <ion-button 
                @click="saveNewItem" 
                color="primary"
                :disabled="!addItemForm.title || !Number(addItemForm.duration)"
              >
                <ion-icon :icon="checkmarkOutline" slot="start" />
                Ajouter
              </ion-button>
            </div>
          </div>
        </ion-content>
      </ion-modal>

      <!-- Edit Item Form Modal -->
      <ion-modal :is-open="showEditItemFormModal" @ionModalDidDismiss="closeEditItemForm">
        <ion-header>
          <ion-toolbar>
            <ion-title>Modifier {{ editItemForm.type }}</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeEditItemForm">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="edit-item-form-modal-content">
          <div class="modal-form">
            
            <ion-item>
              <ion-label position="stacked">Titre *</ion-label>
              <ion-input 
                v-model="editItemForm.title" 
                placeholder="Titre de l'élément"
                required
              ></ion-input>
            </ion-item>
            
            <ion-item>
              <ion-label position="stacked">Sous-titre</ion-label>
              <ion-input 
                v-model="editItemForm.subtitle" 
                placeholder="Sous-titre optionnel"
              ></ion-input>
            </ion-item>
            
            <ion-item>
              <ion-label position="stacked">Participant</ion-label>
              <ion-input 
                v-model="editItemForm.participantName" 
                placeholder="Nom du participant"
              ></ion-input>
            </ion-item>
            
            
            <ion-item>
              <ion-label position="stacked">Durée (minutes) *</ion-label>
              <ion-input 
                v-model="editItemForm.duration" 
                type="number"
                placeholder="5"
                required
              ></ion-input>
            </ion-item>
            
            
            <ion-item>
              <ion-label position="stacked">Notes</ion-label>
              <ion-textarea 
                v-model="editItemForm.notes" 
                placeholder="Notes ou instructions spéciales"
                :rows="3"
              ></ion-textarea>
            </ion-item>
            
            
            <!-- Resource Selector -->
            <div class="resource-selector-container">
              <ResourceSelector v-model="editItemForm.resourceId" />
            </div>
            
            <div class="modal-actions">
              <ion-button @click="closeEditItemForm" fill="clear" color="medium">
                Annuler
              </ion-button>
              <ion-button 
                @click="saveEditItem" 
                color="primary"
                :disabled="!editItemForm.title || !Number(editItemForm.duration)"
              >
                <ion-icon :icon="checkmarkOutline" slot="start" />
                Enregistrer
              </ion-button>
            </div>
          </div>
        </ion-content>
      </ion-modal>

      <!-- Media Viewer Modal -->
      <ion-modal :is-open="showMediaModal" @ionModalDidDismiss="closeMediaModal">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ selectedMediaContent?.title || 'Média' }}</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeMediaModal">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="media-viewer-content">
          <div v-if="selectedMediaContent" class="media-container">
            <!-- Video Content -->
            <div v-if="selectedMediaContent.type === 'video'" class="video-container">
              <!-- YouTube Video -->
              <iframe
                v-if="isYouTubeUrl(selectedMediaContent.url)"
                :src="getYouTubeEmbedUrl(selectedMediaContent.url) || ''"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
                class="media-iframe"
              ></iframe>
              <!-- Regular Video -->
              <video
                v-else
                :src="selectedMediaContent.url"
                controls
                class="media-video"
                :poster="selectedMediaContent.thumbnailUrl"
              ></video>
            </div>

            <!-- Audio Content -->
            <div v-if="selectedMediaContent.type === 'audio'" class="audio-container">
              <audio :src="selectedMediaContent.url" controls class="media-audio"></audio>
              <div class="audio-info">
                <h3>{{ selectedMediaContent.title }}</h3>
                <p v-if="selectedMediaContent.notes">{{ selectedMediaContent.notes }}</p>
              </div>
            </div>

            <!-- Music Sheet Content -->
            <div v-if="selectedMediaContent.type === 'music_sheet'" class="music-sheet-container">
              <div class="file-info">
                <ion-icon :icon="musicalNotesOutline" />
                <div>
                  <h3>{{ selectedMediaContent.title }}</h3>
                  <p>Partition musicale</p>
                  <p v-if="selectedMediaContent.notes">{{ selectedMediaContent.notes }}</p>
                </div>
              </div>
              <ion-button
                @click="downloadFile(selectedMediaContent.url, selectedMediaContent.title)"
                expand="block"
                fill="outline"
              >
                <ion-icon :icon="downloadOutline" slot="start" />
                Télécharger
              </ion-button>
            </div>

            <!-- Lyrics Content -->
            <div v-if="selectedMediaContent.type === 'lyrics'" class="lyrics-container">
              <div class="lyrics-content">
                <pre>{{ selectedMediaContent.content }}</pre>
              </div>
            </div>

            <!-- Fallback for other content types -->
            <div v-if="!['video', 'audio', 'music_sheet', 'lyrics'].includes(selectedMediaContent.type)" class="fallback-container">
              <div class="file-info">
                <ion-icon :icon="documentOutline" />
                <div>
                  <h3>{{ selectedMediaContent.title }}</h3>
                  <p>{{ selectedMediaContent.type }}</p>
                  <p v-if="selectedMediaContent.notes">{{ selectedMediaContent.notes }}</p>
                </div>
              </div>
              <ion-button
                v-if="selectedMediaContent.url"
                @click="downloadFile(selectedMediaContent.url, selectedMediaContent.title)"
                expand="block"
                fill="outline"
              >
                <ion-icon :icon="downloadOutline" slot="start" />
                Télécharger
              </ion-button>
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
  IonItem, IonLabel, IonInput, IonTextarea
} from '@ionic/vue';
import {
  calendarOutline, createOutline, listOutline, timeOutline, layersOutline,
  personOutline, bookOutline, documentTextOutline, musicalNotesOutline,
  closeOutline, musicalNoteOutline, libraryOutline, micOutline,
  megaphoneOutline, giftOutline, handLeftOutline, personCircleOutline,
  checkmarkOutline, reorderThreeOutline, addOutline, trashOutline,
  playCircleOutline, volumeHighOutline, documentOutline, linkOutline,
  downloadOutline, chatboxEllipsesOutline, removeOutline
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
  addSectionToProgram,
  updateSectionInProgram,
  deleteSectionFromProgram,
  addItemToProgram,
  updateItemInProgram,
  deleteItemFromProgram,
  updateProgramOrder
} from '@/firebase/programs';
import type { Service } from '@/types/service';
import type { ServiceProgram, ProgramItem, ProgramSection, ProgramParticipant } from '@/types/program';
import { ProgramItemType } from '@/types/program';
import type { Resource } from '@/types/resource';
import { getResourceById } from '@/firebase/resources';

const route = useRoute();
const router = useRouter();
const { user, isAdmin } = useUser();

const loading = ref(true);
const service = ref<Service | null>(null);
const program = ref<ServiceProgram | null>(null);
const linkedResources = ref<Map<string, Resource>>(new Map());
const showLyricsModal = ref(false);
const selectedItem = ref<ProgramItem | null>(null);
const showResourceModal = ref(false);
const selectedResource = ref<Resource | null>(null);
const showMediaModal = ref(false);
const selectedMediaContent = ref<any>(null);
const isEditMode = ref(false);
const isDragging = ref(false);
const draggedItemId = ref<string | null>(null);
const insertionIndex = ref<number>(-1);
const insertionSectionId = ref<string | null>(null);
const showAddItemModalState = ref(false);
const addItemPosition = ref<'start' | 'end' | 'section' | null>(null);
const addItemSectionId = ref<string | null>(null);
const showAddItemFormModal = ref(false);
const addItemForm = ref({
  type: '' as ProgramItemType,
  title: '',
  subtitle: '',
  participantName: '',
  duration: 5,
  notes: '',
  resourceId: null as string | null
});
const showAddSectionModalState = ref(false);
const newSectionName = ref('');
const insertAfterSectionId = ref<string | null>(null);
const showEditSectionModalState = ref(false);
const editSectionForm = ref({
  id: '',
  title: ''
});
const showEditProgramModalState = ref(false);
const editProgramForm = ref({
  conductorName: '',
  conductorRole: ''
});
const showEditItemFormModal = ref(false);
const editItemForm = ref({
  id: '',
  type: '' as ProgramItemType,
  title: '',
  subtitle: '',
  participantName: '',
  duration: 5,
  notes: '',
  resourceId: null as string | null
});
const showSectionViewModal = ref(false);
const selectedSection = ref<ProgramSection | null>(null);
const showSMSModalState = ref(false);

const serviceId = computed(() => route.params.id as string);

const programItemTypes = computed(() => Object.values(ProgramItemType));

const addItemModalTitle = computed(() => {
  if (addItemPosition.value === 'section' && addItemSectionId.value) {
    const section = program.value?.sections.find(s => s.id === addItemSectionId.value);
    return section ? `Ajouter un élément à "${section.title}"` : 'Sélectionner un type d\'élément';
  }
  return 'Sélectionner un type d\'élément';
});

const formatDateTime = (dateStr: string | undefined, timeStr: string | undefined): string => {
  if (!dateStr || !timeStr) return '';
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
  const iconMap: Record<ProgramItemType, string> = {
    'Chant': musicalNoteOutline,
    'Prière': handLeftOutline,
    'Lecture biblique': libraryOutline,
    'Prédication': micOutline,
    'Titre': documentTextOutline,
    'Section': removeOutline
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

// Create a computed property that returns all items with their global order
const allItemsWithGlobalOrder = computed(() => {
  if (!program.value) return [];

  const items: Array<any> = [];
  let globalOrder = 1;

  if (program.value.sections.length > 0) {
    // If we have sections, iterate through them in order
    sortedSections.value.forEach(section => {
      const sectionItems = program.value!.items
        .filter(item => item.sectionId === section.id)
        .sort((a, b) => a.order - b.order);

      sectionItems.forEach(item => {
        items.push({ ...item, globalOrder: globalOrder++ });
      });
    });

    // Add any items without sections at the end
    const itemsWithoutSection = program.value.items
      .filter(item => !item.sectionId)
      .sort((a, b) => a.order - b.order);

    itemsWithoutSection.forEach(item => {
      items.push({ ...item, globalOrder: globalOrder++ });
    });
  } else {
    // No sections, just number items sequentially
    program.value.items
      .sort((a, b) => a.order - b.order)
      .forEach(item => {
        items.push({ ...item, globalOrder: globalOrder++ });
      });
  }

  return items;
});

const getSectionItems = (sectionId: string) => {
  if (!program.value) return [];

  // Return items with their global order
  return allItemsWithGlobalOrder.value
    .filter(item => item.sectionId === sectionId);
};

const getSectionItemsCount = (sectionId: string) => {
  return getSectionItems(sectionId).length;
};

const getSectionDuration = (sectionId: string) => {
  return getSectionItems(sectionId)
    .reduce((total, item) => total + (item.duration || 0), 0);
};

const calculateTotalDuration = () => {
  if (!program.value) return 0;
  return program.value.items.reduce((total, item) => total + (item.duration || 0), 0);
};

const updateProgramDuration = async () => {
  if (!program.value || !user.value?.uid) return;
  
  const newTotalDuration = calculateTotalDuration();
  
  // Only update if duration has changed
  if (newTotalDuration !== program.value.totalDuration) {
    try {
      await updateProgram(program.value.id, { totalDuration: newTotalDuration }, user.value.uid);
      program.value.totalDuration = newTotalDuration;
      console.log('Program duration updated:', newTotalDuration);
    } catch (error) {
      console.error('Error updating program duration:', error);
    }
  }
};

const showLyrics = (item: ProgramItem) => {
  selectedItem.value = item;
  showLyricsModal.value = true;
};

const getLinkedResource = (resourceId: string | undefined): Resource | null => {
  if (!resourceId) return null;
  return linkedResources.value.get(resourceId) || null;
};

const showResourceDetails = (item: ProgramItem) => {
  if (!item.resourceId) return;
  const resource = getLinkedResource(item.resourceId);
  if (resource) {
    selectedResource.value = resource;
    showResourceModal.value = true;
  }
};

const navigateToResource = (resourceId: string) => {
  router.push(`/resources/${resourceId}`);
};

const showMediaContent = (content: any, resourceTitle?: string) => {
  selectedMediaContent.value = {
    ...content,
    title: resourceTitle || content.title || 'Contenu média'
  };
  showMediaModal.value = true;
};

const closeMediaModal = () => {
  showMediaModal.value = false;
  selectedMediaContent.value = null;
};

const downloadFile = (url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'download';
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const isYouTubeUrl = (url: string): boolean => {
  if (!url) return false;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/,
    /^[a-zA-Z0-9_-]{11}$/ // Just a YouTube video ID
  ];
  return patterns.some(pattern => pattern.test(url));
};

const getYouTubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;

  // Extract video ID from various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }

  // Check if it's already just a video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return `https://www.youtube.com/embed/${url}`;
  }

  return null;
};

const getMediaTypeIcon = (type: string) => {
  switch(type) {
    case 'lyrics': return musicalNotesOutline;
    case 'video': return playCircleOutline;
    case 'youtube': return playCircleOutline;
    case 'audio': return volumeHighOutline;
    case 'music_sheet': return musicalNoteOutline;
    default: return documentOutline;
  }
};

const closeLyricsModal = () => {
  showLyricsModal.value = false;
  selectedItem.value = null;
};

const closeResourceModal = () => {
  showResourceModal.value = false;
  selectedResource.value = null;
};

const showLyricsContent = (lyricsContent: string) => {
  // Create a temporary item to show lyrics in the existing lyrics modal
  selectedItem.value = {
    id: 'temp',
    title: 'Paroles',
    lyrics: lyricsContent,
    order: 0,
    type: ProgramItemType.SONG
  } as ProgramItem;
  closeResourceModal();
  showLyricsModal.value = true;
};

const showEditModal = () => {
  if (program.value) {
    // Pre-populate form with current program data
    editProgramForm.value.conductorName = program.value.conductor?.name || '';
    editProgramForm.value.conductorRole = program.value.conductor?.role || '';
    
    showEditProgramModalState.value = true;
  }
};

const closeEditProgramModal = () => {
  showEditProgramModalState.value = false;
  editProgramForm.value = {
    conductorName: '',
    conductorRole: ''
  };
};

const saveEditProgram = async () => {
  if (!program.value || !user.value?.uid) return;
  
  try {
    // Create or update conductor
    const conductor: ProgramParticipant | undefined = editProgramForm.value.conductorName.trim() ? {
      id: `conductor_${Date.now()}`,
      name: editProgramForm.value.conductorName.trim(),
      role: editProgramForm.value.conductorRole.trim() || 'Dirigeant',
      isCustom: true
    } : undefined;
    
    // Update program with new metadata
    const updates: any = {};
    
    // Only add conductor if it has changed
    if (conductor) {
      updates.conductor = conductor;
    } else if (!editProgramForm.value.conductorName && program.value.conductor) {
      updates.conductor = null;
    }
    
    await updateProgram(program.value.id, updates, user.value.uid);
    
    // Update local state
    if (conductor) {
      program.value.conductor = conductor;
    } else if (!editProgramForm.value.conductorName) {
      program.value.conductor = undefined;
    }
    
    // Recalculate total duration after saving program summary
    await updateProgramDuration();
    
    closeEditProgramModal();
    console.log('Program updated successfully');
  } catch (error) {
    console.error('Error updating program:', error);
    // TODO: Show error message to user
  }
};

const toggleEditMode = () => {
  if (!isAdmin.value) {
    console.warn('Only admins can edit programs');
    return;
  }
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
  insertAfterSectionId.value = null;
};

const closeAddSectionModal = () => {
  showAddSectionModalState.value = false;
  newSectionName.value = '';
  insertAfterSectionId.value = null;
};

const createSection = async () => {
  if (!newSectionName.value.trim() || !program.value || !user.value?.uid) return;
  
  // Find insert position
  let insertOrder = program.value.sections.length + 1;
  if (insertAfterSectionId.value) {
    const afterSection = program.value.sections.find(s => s.id === insertAfterSectionId.value);
    if (afterSection) {
      insertOrder = afterSection.order + 1;
      // Update order of sections that come after
      program.value.sections.forEach(section => {
        if (section.order >= insertOrder) {
          section.order += 1;
        }
      });
    }
  }
  
  try {
    const newSection = await addSectionToProgram(
      program.value.id,
      {
        title: newSectionName.value.trim(),
        order: insertOrder
      },
      user.value.uid
    );
    
    // Update local state
    program.value.sections.push(newSection);
    closeAddSectionModal();
  } catch (error) {
    console.error('Error creating section:', error);
    // TODO: Show error message to user
  }
};

// Edit Section functionality
const showEditSectionModal = (section: ProgramSection) => {
  editSectionForm.value = {
    id: section.id,
    title: section.title
  };
  
  showEditSectionModalState.value = true;
};

const closeEditSectionModal = () => {
  showEditSectionModalState.value = false;
  editSectionForm.value = {
    id: '',
    title: ''
  };
};

const showSectionView = (section: ProgramSection) => {
  selectedSection.value = section;
  showSectionViewModal.value = true;
};

const closeSectionView = () => {
  showSectionViewModal.value = false;
  selectedSection.value = null;
};

const showSMSModal = () => {
  showSMSModalState.value = true;
};

const closeSMSModal = () => {
  showSMSModalState.value = false;
};

const onSMSSent = (data: any) => {
  console.log('SMS sent successfully:', data);
  // You can add a toast notification here if desired
};

const saveEditSection = async () => {
  if (!program.value || !user.value?.uid || !editSectionForm.value.title.trim() || !editSectionForm.value.id) return;
  
  try {
    await updateSectionInProgram(
      program.value.id,
      editSectionForm.value.id,
      {
        title: editSectionForm.value.title.trim()
      },
      user.value.uid
    );
    
    // Update local state
    const sectionIndex = program.value.sections.findIndex(section => section.id === editSectionForm.value.id);
    if (sectionIndex !== -1) {
      program.value.sections[sectionIndex].title = editSectionForm.value.title.trim();
    }
    
    console.log('Section updated:', editSectionForm.value.id);
    closeEditSectionModal();
  } catch (error) {
    console.error('Error updating section:', error);
    // TODO: Show error message to user
  }
};

// Delete Section functionality (only when empty)
const canDeleteSection = (sectionId: string) => {
  if (!program.value) return false;
  const sectionItems = program.value.items.filter(item => item.sectionId === sectionId);
  return sectionItems.length === 0;
};

const deleteSection = async (sectionId: string) => {
  if (!program.value || !user.value?.uid || !canDeleteSection(sectionId)) return;
  
  try {
    await deleteSectionFromProgram(program.value.id, sectionId, user.value.uid);
    
    // Update local state
    const sectionIndex = program.value.sections.findIndex(section => section.id === sectionId);
    if (sectionIndex !== -1) {
      program.value.sections.splice(sectionIndex, 1);
    }
    
    console.log('Section deleted:', sectionId);
  } catch (error) {
    console.error('Error deleting section:', error);
    // TODO: Show error message to user
  }
};

const selectItemType = (itemType: ProgramItemType) => {
  // Store the position and sectionId before closing the modal
  const position = addItemPosition.value;
  const sectionId = addItemSectionId.value;
  
  closeAddItemModal();
  
  // Restore the position and sectionId after closing
  addItemPosition.value = position;
  addItemSectionId.value = sectionId;
  
  // Reset form
  addItemForm.value = {
    type: itemType,
    title: '',
    subtitle: '',
    participantName: '',
    duration: 5,
    notes: '',
    resourceId: null
  };
  
  // Show the form modal
  showAddItemFormModal.value = true;
};

const closeAddItemForm = () => {
  showAddItemFormModal.value = false;
  // Reset form
  addItemForm.value = {
    type: '' as ProgramItemType,
    title: '',
    subtitle: '',
    participantName: '',
    duration: 5,
    notes: '',
    resourceId: null
  };
  // Reset position values
  addItemPosition.value = null;
  addItemSectionId.value = null;
};

const saveNewItem = async () => {
  if (!program.value || !user.value?.uid || !addItemForm.value.title || !Number(addItemForm.value.duration)) return;
  
  const position = addItemPosition.value;
  const sectionId = addItemSectionId.value;
  
  // Calculate order based on position (global numbering)
  let order = 1;
  if (position === 'end') {
    order = program.value.items.length + 1;
  } else if (position === 'section' && sectionId) {
    // For global numbering, always use the total count of items + 1
    order = program.value.items.length + 1;
  }
  
  try {
    // Create the item with form data
    const itemData: any = {
      order,
      type: addItemForm.value.type,
      title: addItemForm.value.title,
      duration: Number(addItemForm.value.duration) || 0
    };
    
    // Add sectionId only if it exists
    if (sectionId) {
      itemData.sectionId = sectionId;
    }
    
    // Add optional fields if provided
    if (addItemForm.value.subtitle) itemData.subtitle = addItemForm.value.subtitle;
    if (addItemForm.value.notes) itemData.notes = addItemForm.value.notes;
    
    // Add participant if provided
    if (addItemForm.value.participantName) {
      itemData.participant = {
        name: addItemForm.value.participantName,
        role: ''
      };
    }
    
    // Add resource link if provided
    if (addItemForm.value.resourceId) {
      itemData.resourceId = addItemForm.value.resourceId;
    }
    
    const newItem = await addItemToProgram(
      program.value.id,
      itemData,
      user.value.uid
    );
    
    // Update local state
    program.value.items.push(newItem);
    
    console.log('New item created:', newItem);
    
    // Update total duration in Firestore
    await updateProgramDuration();
    
    // Close the form
    closeAddItemForm();
  } catch (error) {
    console.error('Error creating item:', error);
    // TODO: Show error message to user
  }
};

// Edit Item functionality
const showEditItemModal = (item: ProgramItem) => {
  // Pre-populate form with current item data
  editItemForm.value = {
    id: item.id,
    type: item.type,
    title: item.title,
    subtitle: item.subtitle || '',
    participantName: item.participant?.name || '',
    duration: item.duration || 5,
    notes: item.notes || '',
    resourceId: item.resourceId || null
  };
  
  showEditItemFormModal.value = true;
};

const closeEditItemForm = () => {
  showEditItemFormModal.value = false;
  editItemForm.value = {
    id: '',
    type: '' as ProgramItemType,
    title: '',
    subtitle: '',
    participantName: '',
    duration: 5,
    notes: '',
    resourceId: null
  };
};

const saveEditItem = async () => {
  if (!program.value || !user.value?.uid || !editItemForm.value.title || !Number(editItemForm.value.duration) || !editItemForm.value.id) return;
  
  try {
    // Create the updated item data
    const itemData: any = {
      type: editItemForm.value.type,
      title: editItemForm.value.title,
      duration: Number(editItemForm.value.duration) || 0
    };
    
    // Add optional fields if provided
    if (editItemForm.value.subtitle) itemData.subtitle = editItemForm.value.subtitle;
    if (editItemForm.value.notes) itemData.notes = editItemForm.value.notes;
    
    // Add participant if provided
    if (editItemForm.value.participantName) {
      itemData.participant = {
        name: editItemForm.value.participantName,
        role: ''
      };
    }
    
    // Add resource link if provided
    if (editItemForm.value.resourceId) {
      itemData.resourceId = editItemForm.value.resourceId;
    }
    
    await updateItemInProgram(
      program.value.id,
      editItemForm.value.id,
      itemData,
      user.value.uid
    );
    
    // Update local state
    const itemIndex = program.value.items.findIndex(item => item.id === editItemForm.value.id);
    if (itemIndex !== -1) {
      program.value.items[itemIndex] = { ...program.value.items[itemIndex], ...itemData };
    }
    
    console.log('Item updated:', editItemForm.value.id);
    
    // Update total duration in Firestore
    await updateProgramDuration();
    
    // Close the form
    closeEditItemForm();
  } catch (error) {
    console.error('Error updating item:', error);
    // TODO: Show error message to user
  }
};

// Delete Item functionality
const deleteItem = async (itemId: string) => {
  if (!program.value || !user.value?.uid) return;
  
  try {
    await deleteItemFromProgram(program.value.id, itemId, user.value.uid);
    
    // Update local state
    const itemIndex = program.value.items.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
      program.value.items.splice(itemIndex, 1);
    }
    
    console.log('Item deleted:', itemId);
    
    // Update total duration in Firestore
    await updateProgramDuration();
  } catch (error) {
    console.error('Error deleting item:', error);
    // TODO: Show error message to user
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
  
  // Save to Firestore
  saveProgramOrder();
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
  
  // Save to Firestore
  saveProgramOrder();
};

const saveProgramOrder = async () => {
  if (!program.value || !user.value?.uid) return;
  
  try {
    await updateProgramOrder(
      program.value.id,
      program.value.sections,
      program.value.items,
      user.value.uid
    );
    
    // Update total duration after reordering
    await updateProgramDuration();
  } catch (error) {
    console.error('Error saving program order:', error);
    // TODO: Show error message to user
  }
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

const loadLinkedResources = async () => {
  if (!program.value) return;
  
  const newResourcesMap = new Map<string, Resource>();
  
  // Get all unique resource IDs from program items
  const resourceIds = new Set<string>();
  for (const item of program.value.items) {
    if (item.resourceId) {
      resourceIds.add(item.resourceId);
    }
  }
  
  // Fetch all resources in parallel
  const promises = Array.from(resourceIds).map(async (resourceId) => {
    try {
      const resource = await getResourceById(resourceId);
      if (resource) {
        newResourcesMap.set(resourceId, resource);
      }
    } catch (error) {
      console.error(`Error fetching resource ${resourceId}:`, error);
    }
  });
  
  await Promise.all(promises);
  linkedResources.value = newResourcesMap;
};

const loadProgram = async () => {
  console.log('loadProgram called');
  
  // Wait for user to be loaded if not available yet
  let attempts = 0;
  while (!user.value && attempts < 10) {
    console.log('Waiting for user to load...', attempts);
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  if (!user.value) {
    console.error('User not loaded after waiting');
    return;
  }
  
  try {
    console.log('Trying to load existing program for service:', serviceId.value);
    // Try to load existing program from Firestore
    const existingProgram = await getProgramByServiceId(serviceId.value);
    
    if (existingProgram) {
      console.log('Existing program found:', existingProgram);
      program.value = existingProgram;
      
      // Load linked resources
      await loadLinkedResources();
      
      // Recalculate and update duration if needed
      await updateProgramDuration();
    } else {
      console.log('No existing program found, creating default');
      // Create default program if none exists
      await createDefaultProgram();
    }
  } catch (error) {
    console.error('Error loading program:', error);
    // Fallback to creating default program
    await createDefaultProgram();
  }
};

const createDefaultProgram = async () => {
  console.log('createDefaultProgram called');
  console.log('User:', user.value);
  console.log('Service ID:', serviceId.value);
  
  if (!user.value?.uid) {
    console.error('No authenticated user');
    return;
  }

  const defaultSections: ProgramSection[] = [
    { id: `section_${Date.now()}_1`, title: 'Ouverture', order: 1, color: '#4CAF50' },
    { id: `section_${Date.now()}_2`, title: 'Louange et Adoration', order: 2, color: '#2196F3' },
    { id: `section_${Date.now()}_3`, title: 'Parole de Dieu', order: 3, color: '#FF9800' },
    { id: `section_${Date.now()}_4`, title: 'Clôture', order: 4, color: '#9C27B0' }
  ];

  console.log('Default sections:', defaultSections);

  try {
    console.log('Calling createProgram with:', {
      serviceId: serviceId.value,
      items: [],
      sections: defaultSections,
      totalDuration: 0
    });
    
    const newProgram = await createProgram({
      serviceId: serviceId.value,
      items: [],
      sections: defaultSections,
      totalDuration: 0
    }, user.value.uid);
    
    console.log('Program created successfully:', newProgram);
    program.value = newProgram;
    
    // Load linked resources
    await loadLinkedResources();
  } catch (error) {
    console.error('Error creating default program:', error);
    console.error('Error details:', error);
  }
};

const loadMockProgram = async () => {
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
      sectionId: 'closing'
    }
  ];

  // This function is no longer used but kept for reference
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

.program-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.program-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--ion-color-dark);
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

/* Edit Mode: Show drag handle column and actions column */
.edit-mode .item-layout {
  grid-template-columns: 40px 30px 1fr 140px 100px;
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

.item-actions-column {
  justify-content: flex-start;
  align-items: center;
}

.item-actions {
  display: flex;
  gap: 4px;
  flex-direction: column;
}

.item-actions ion-button {
  --padding-start: 8px;
  --padding-end: 8px;
  --min-height: 32px;
  width: 40px;
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

.item-notes {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: var(--ion-color-medium);
}

.item-notes ion-icon {
  font-size: 1rem;
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

.section-header:not(.edit-mode .section-header) {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.section-header:not(.edit-mode .section-header):hover {
  background: var(--ion-color-light);
}

.section-title {
  flex: 1;
}

.section-actions {
  display: flex;
  gap: 4px;
}

.section-actions ion-button {
  --padding-start: 8px;
  --padding-end: 8px;
  --min-height: 32px;
  width: 40px;
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

/* Edit Program Modal */
.edit-program-modal-content {
  --ion-background-color: var(--ion-color-light);
}

.edit-program-modal-content .modal-form {
  padding: 16px;
}

.edit-program-modal-content .modal-form ion-item {
  margin-bottom: 16px;
  --background: white;
  --border-radius: 8px;
  --border-color: var(--ion-color-light-shade);
  --min-height: 56px;
}

.edit-program-modal-content .modal-form ion-label {
  font-weight: 600;
  color: var(--ion-color-dark);
  margin-bottom: 8px;
}

.edit-program-modal-content .modal-form ion-input {
  --padding-start: 12px;
  --color: var(--ion-color-dark);
}

.edit-program-modal-content .modal-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  margin-top: 20px;
  border-top: 1px solid var(--ion-color-light-shade);
}

.edit-program-modal-content .modal-actions ion-button {
  --border-radius: 8px;
  font-weight: 600;
}

/* Add Item Form Modal */
.add-item-form-modal-content {
  --ion-background-color: var(--ion-color-light);
}

.add-item-form-modal-content .modal-form {
  padding: 16px;
}

.add-item-form-modal-content .modal-form ion-item {
  margin-bottom: 16px;
  --background: white;
  --border-radius: 8px;
  --border-color: var(--ion-color-light-shade);
  --min-height: 56px;
}

.add-item-form-modal-content .modal-form ion-label {
  font-weight: 600;
  color: var(--ion-color-dark);
  margin-bottom: 8px;
}

.add-item-form-modal-content .modal-form ion-input,
.add-item-form-modal-content .modal-form ion-textarea {
  --padding-start: 12px;
  --color: var(--ion-color-dark);
}

.add-item-form-modal-content .modal-form ion-textarea {
  --padding-top: 12px;
}

.add-item-form-modal-content .modal-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  margin-top: 20px;
  border-top: 1px solid var(--ion-color-light-shade);
}

.add-item-form-modal-content .modal-actions ion-button {
  --border-radius: 8px;
  font-weight: 600;
}

/* Edit Item Form Modal */
.edit-item-form-modal-content {
  --ion-background-color: var(--ion-color-light);
}

.edit-item-form-modal-content .modal-form {
  padding: 16px;
}

.edit-item-form-modal-content .modal-form ion-item {
  margin-bottom: 16px;
  --background: white;
  --border-radius: 8px;
  --border-color: var(--ion-color-light-shade);
  --min-height: 56px;
}

.edit-item-form-modal-content .modal-form ion-label {
  font-weight: 600;
  color: var(--ion-color-dark);
  margin-bottom: 8px;
}

.edit-item-form-modal-content .modal-form ion-input,
.edit-item-form-modal-content .modal-form ion-textarea {
  --padding-start: 12px;
  --color: var(--ion-color-dark);
}

.edit-item-form-modal-content .modal-form ion-textarea {
  --padding-top: 12px;
}

.edit-item-form-modal-content .modal-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  margin-top: 20px;
  border-top: 1px solid var(--ion-color-light-shade);
}

.edit-item-form-modal-content .modal-actions ion-button {
  --border-radius: 8px;
  font-weight: 600;
}

/* Edit Section Modal */
.edit-section-modal-content {
  --ion-background-color: var(--ion-color-light);
}

.edit-section-modal-content .section-form {
  padding: 20px;
}

.edit-section-modal-content .section-form ion-item {
  margin-bottom: 20px;
  --background: white;
  --border-radius: 8px;
  --border-color: var(--ion-color-light-shade);
  --min-height: 56px;
}

.edit-section-modal-content .section-form ion-label {
  font-weight: 600;
  color: var(--ion-color-dark);
  margin-bottom: 8px;
}

.edit-section-modal-content .section-form ion-input {
  --padding-start: 12px;
  --color: var(--ion-color-dark);
}

.edit-section-modal-content .modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  margin-top: 20px;
  border-top: 1px solid var(--ion-color-light-shade);
}

.edit-section-modal-content .modal-actions ion-button {
  --border-radius: 8px;
  font-weight: 600;
}

/* Resource Selector */
.resource-selector-container {
  margin: 16px 0;
  padding: 0 4px;
}

/* Resource Display in Items */
.item-resources {
  margin-top: 4px;
}

.resource-count {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--ion-color-primary);
  font-weight: 500;
}

.resource-count ion-icon {
  font-size: 14px;
}

/* Resource Media Links */
.item-resources {
  margin-top: 6px;
}

.media-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.media-chip-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  background: transparent;
  border: 1px solid var(--ion-color-medium-tint);
  border-radius: 12px;
  font-size: 12px;
  color: var(--ion-color-medium-shade);
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  font-weight: 500;
  white-space: nowrap;
  height: 24px;
}

.media-chip-button:hover {
  background: var(--ion-color-light);
  border-color: var(--ion-color-primary);
  color: var(--ion-color-primary);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.media-chip-button:active {
  transform: translateY(0);
  box-shadow: none;
}

.media-chip-button ion-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.media-chip-button span {
  font-size: 11px;
}

/* Media Viewer Modal */
.media-viewer-content {
  --background: var(--ion-color-light);
}

.media-container {
  padding: 0px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.video-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.media-iframe {
  width: 100%;
  height: 60vh;
  max-height: 400px;
  border-radius: 8px;
}

.media-video {
  width: 100%;
  max-width: 800px;
  height: auto;
  border-radius: 8px;
}

.audio-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px;
}

.media-audio {
  width: 100%;
  max-width: 400px;
}

.audio-info {
  text-align: center;
}

.audio-info h3 {
  margin: 0 0 8px 0;
  font-size: 1.2rem;
  color: var(--ion-color-dark);
}

.audio-info p {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 0.9rem;
}

.music-sheet-container,
.fallback-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 32px;
  text-align: center;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.file-info ion-icon {
  font-size: 2rem;
  color: var(--ion-color-primary);
}

.file-info h3 {
  margin: 0 0 4px 0;
  font-size: 1.1rem;
  color: var(--ion-color-dark);
}

.file-info p {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 0.9rem;
}

.lyrics-container {
  padding: 16px;
  height: 100%;
}

.lyrics-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
  overflow-y: auto;
}

.lyrics-content pre {
  font-family: inherit;
  white-space: pre-wrap;
  margin: 0;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--ion-color-dark);
}

/* Resource Detail Modal */
.resource-detail-content {
  --background: var(--ion-color-light);
}

.resource-details {
  padding: 16px;
}

.resource-media-list h4 {
  margin: 20px 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-color-dark);
}

.media-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: white;
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid var(--ion-color-light-shade);
}

.media-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.media-icon {
  font-size: 20px;
  color: var(--ion-color-primary);
}

.media-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.media-type {
  font-weight: 600;
  font-size: 14px;
  color: var(--ion-color-dark);
}

.media-notes {
  font-size: 12px;
  color: var(--ion-color-medium);
}

.media-actions {
  display: flex;
  gap: 8px;
}

.resource-actions {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--ion-color-light-shade);
}

/* Section View Modal Styles */
.section-view-modal-content {
  --padding-top: 0;
  --padding-bottom: 0;
  --padding-start: 0;
  --padding-end: 0;
}

.section-view-container {
  padding: 0;
}

.section-item-card {
  padding: 16px 12px;
  border-bottom: 1px solid var(--ion-color-light-shade);
}

.section-item-card:last-child {
  border-bottom: none;
}

.section-item-card .item-header {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
}

.section-item-card .item-number {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--ion-color-primary);
  color: white;
  font-weight: 700;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.section-item-card .item-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--ion-color-dark);
  margin: 0;
  flex: 1;
}

.section-item-card .lyrics-content {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--ion-color-dark);
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
}
</style>