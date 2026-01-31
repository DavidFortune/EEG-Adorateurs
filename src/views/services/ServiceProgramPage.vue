<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="`/service-detail/${route.params.id}`"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ isEditMode ? 'Édition du programme' : 'Programme' }}</ion-title>
        <!-- Draft Status Badge -->
        <ion-chip v-if="program && isDraft" color="warning" slot="end" class="draft-badge">
          <ion-icon :icon="lockClosedOutline" />
          <ion-label>Brouillon</ion-label>
        </ion-chip>
        <ion-buttons slot="end">
          <ion-button v-if="!isEditMode && program && program.items.length > 0" @click="showPresentation" fill="clear" color="primary">
            <ion-icon :icon="easelOutline" />
          </ion-button>
          <ion-button v-if="!isEditMode && hasYouTubeVideos" @click="showYouTubePlaylist" fill="clear" color="danger">
            <ion-icon :icon="logoYoutube" />
          </ion-button>
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

      <!-- Draft Controls (Admin Only) -->
      <div v-if="isAdmin && program && isDraft" class="draft-controls">
        <ion-card color="warning">
          <ion-card-content>
            <div class="draft-controls-header">
              <h3>
                <ion-icon :icon="lockClosedOutline" />
                Mode brouillon
              </h3>
            </div>
            <p class="draft-description">
              Ce programme est en mode brouillon. Seuls les administrateurs et les membres autorisés peuvent le voir.
            </p>

            <div class="draft-actions">
              <ion-button @click="openDraftViewersModal" fill="outline" color="dark">
                <ion-icon :icon="peopleOutline" slot="start" />
                Gérer les accès ({{ program.draftViewerIds.length }})
              </ion-button>

              <ion-button @click="confirmPublish" fill="solid" color="success">
                <ion-icon :icon="checkmarkCircleOutline" slot="start" />
                Publier le programme
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Access Denied Message (Non-Admin, Not in Viewers) -->
      <div v-if="program && !canViewProgram" class="access-denied">
        <ion-card>
          <ion-card-content class="text-center">
            <ion-icon :icon="lockClosedOutline" class="large-icon" color="warning" />
            <h3>Programme en préparation</h3>
            <p>Ce programme est encore en cours de préparation et n'est pas accessible pour le moment.</p>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- YouTube Playlist Feature Notice -->
      <div v-if="!isEditMode && hasYouTubeVideos" class="youtube-feature-notice">
        <div class="notice-content">
          <ion-icon :icon="logoYoutube" class="notice-icon" />
          <div class="notice-text">
            <strong>Nouveauté !</strong> Cliquez sur l'icône
            <ion-icon :icon="logoYoutube" class="inline-icon" />
            pour accéder à la playlist YouTube des chants du service.<br/>
            <strong>Idéal pour apprendre les chants et se mettre dans un esprit d'adoration !</strong>
          </div>
        </div>
      </div>

      <div v-if="canViewProgram || !program" class="content-container">
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
                  <ion-avatar v-if="program.conductor.avatar" class="conductor-avatar">
                    <img :src="program.conductor.avatar" :alt="program.conductor.name" />
                  </ion-avatar>
                  <div v-else class="conductor-initials">
                    {{ getParticipantInitials(program.conductor.name) }}
                  </div>
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
          <ion-button @click="showAddItemModal()" fill="outline" size="default" class="add-item-button">
            <ion-icon :icon="addOutline" slot="start" />
            Ajouter un élément
          </ion-button>

          <!-- Quick-Add Type Buttons -->
          <div class="quick-add-buttons">
            <ion-button fill="clear" size="small" @click="showAddItemModal(ProgramItemType.SONG)">
              <ion-icon :icon="musicalNoteOutline" slot="start" />
              Chant
            </ion-button>
            <ion-button fill="clear" size="small" @click="showAddItemModal(ProgramItemType.PRAYER)">
              <ion-icon :icon="handLeftOutline" slot="start" />
              Prière
            </ion-button>
            <ion-button fill="clear" size="small" @click="showAddItemModal(ProgramItemType.SCRIPTURE)">
              <ion-icon :icon="libraryOutline" slot="start" />
              Lecture
            </ion-button>
            <ion-button fill="clear" size="small" @click="showAddItemModal(ProgramItemType.SERMON)">
              <ion-icon :icon="micOutline" slot="start" />
              Prédication
            </ion-button>
          </div>
        </div>

        <!-- Program Items (Flat List) -->
        <div v-if="program && program.items.length > 0" class="program-content">
          <div class="flat-items-view">
            <ion-reorder-group :disabled="!isEditMode" @ionItemReorder="handleItemReorder">
              <div
                v-for="(item, index) in sortedItems"
                :key="item.id"
                class="program-item-wrapper"
                :class="{ 'has-subitems': hasSubItems(item), 'expanded': isItemExpanded(item.id), 'is-section': isSectionItem(item) }"
              >
              <div
                class="program-item"
                :class="`item-${item.type.toLowerCase().replace(/\s+/g, '-')}`"
              >
                <div class="item-layout">
                  <!-- Drag Handle (Edit Mode) -->
                  <ion-reorder v-if="isEditMode" class="item-column item-handle-column">
                    <ion-icon :icon="reorderThreeOutline" class="drag-handle-icon" />
                  </ion-reorder>

                  <!-- Order Number (hidden for Section items, excludes sections from count) -->
                  <div v-if="!isSectionItem(item)" class="item-column item-order-column">
                    <div class="item-order">{{ getItemDisplayNumber(index) }}</div>
                  </div>

                  <!-- Details -->
                  <div class="item-column item-details-column">
                    <div class="item-header-row">
                      <div class="item-type">
                        <ion-icon :icon="getItemIcon(item.type)" />
                        <span v-if="!isSectionItem(item)">{{ item.type }}</span>
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
                    <p v-if="item.resourceId && getLinkedResource(item.resourceId)?.reference" class="item-reference">{{ getLinkedResource(item.resourceId)?.reference }}</p>

                    <!-- Notes -->
                    <div v-if="item.notes" class="item-notes">
                      <ion-icon :icon="documentTextOutline" />
                      {{ item.notes }}
                    </div>

                    <!-- Inline Resource Quick Add (Edit Mode) -->
                    <ResourceQuickAdd
                      v-if="isEditMode && !isSectionItem(item)"
                      :resource="item.resourceId ? getLinkedResource(item.resourceId) ?? null : null"
                      :collection="item.resourceId ? getResourceCollectionCached(item.resourceId) : null"
                      :editable="true"
                      @add="openInlineResourceSelector(item.id)"
                      @remove="handleInlineResourceRemove(item.id)"
                      @preview="(r) => showMediaContent(r.contents[0], r.title)"
                    />

                    <!-- Resource Links (View Mode - not in edit mode since ResourceQuickAdd handles it) -->
                    <div v-if="!isEditMode && item.resourceId && getLinkedResource(item.resourceId)" class="item-resources">
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
                      <!-- Music Properties -->
                      <div class="music-props-row">
                        <div v-if="getResourceMusicProps(item.resourceId)" class="music-props">
                          <span v-for="prop in getResourceMusicProps(item.resourceId)" :key="prop" class="music-prop">{{ prop }}</span>
                        </div>
                        <button
                          v-if="isAdmin && item.resourceId"
                          @click.stop="openMusicPropsModal(item.resourceId!)"
                          class="music-props-edit-btn"
                        >
                          <ion-icon :icon="createOutline" />
                        </button>
                      </div>
                    </div>

                    <!-- Scripture Chip (for "Lecture biblique" items with fetched text) -->
                    <div v-if="item.scriptureText" class="item-scripture">
                      <button @click="openScriptureModal(item)" class="scripture-chip">
                        <ion-icon :icon="bookOutline" />
                        <span>{{ item.scriptureReference || 'Versets' }}</span>
                      </button>
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
                    <!-- Multiple participants -->
                    <div v-if="item.participants && item.participants.length > 0" class="item-participants">
                      <div v-for="participant in item.participants" :key="participant.id" class="item-participant">
                        <ion-avatar v-if="participant.avatar" class="participant-avatar">
                          <img :src="participant.avatar" :alt="participant.name" />
                        </ion-avatar>
                        <span v-else class="participant-initials">{{ getParticipantInitials(participant.name) }}</span>
                        {{ participant.name }}
                        <span v-if="participant.role" class="participant-role">({{ participant.role }})</span>
                      </div>
                    </div>
                    <!-- Legacy single participant support -->
                    <div v-else-if="item.participant" class="item-participant">
                      <ion-avatar v-if="item.participant.avatar" class="participant-avatar">
                        <img :src="item.participant.avatar" :alt="item.participant.name" />
                      </ion-avatar>
                      <span v-else class="participant-initials">{{ getParticipantInitials(item.participant.name) }}</span>
                      {{ item.participant.name }}
                      <span v-if="item.participant.role" class="participant-role">({{ item.participant.role }})</span>
                    </div>
                  </div>

                  <!-- Edit/Delete Actions (Edit Mode) -->
                  <div v-if="isEditMode" class="item-column item-actions-column">
                    <div class="item-actions">
                      <ion-button v-if="item.type === 'Chant' || item.type === 'Prière'" @click="showAddSubItemModalForItem(item.id)" fill="clear" size="small" color="success">
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
                  <ion-reorder-group :disabled="!isEditMode" @ionItemReorder="(e) => handleSubItemReorder(e, item.id)">
                    <div
                      v-for="subItem in getSortedSubItems(item)"
                      :key="subItem.id"
                      class="sub-item"
                    >
                      <div class="sub-item-layout">
                        <ion-reorder v-if="isEditMode" class="sub-item-handle">
                          <ion-icon :icon="reorderTwoOutline" />
                        </ion-reorder>
                        <div v-else class="sub-item-bullet">•</div>
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
                          <!-- Music Properties for Sub-Item -->
                          <span v-for="prop in getResourceMusicProps(subItem.resourceId)" :key="prop" class="music-prop small">{{ prop }}</span>
                          <button
                            v-if="isAdmin"
                            @click.stop="openMusicPropsModal(subItem.resourceId!)"
                            class="music-props-edit-btn small"
                          >
                            <ion-icon :icon="createOutline" />
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
                  </ion-reorder-group>
                </div>
              </div>
            </div>
            </ion-reorder-group>
          </div>

          <!-- Add Item Button (Bottom) -->
          <div v-if="isEditMode" class="add-item-container add-item-bottom">
            <ion-button @click="showAddItemModal()" fill="outline" size="default" class="add-item-button">
              <ion-icon :icon="addOutline" slot="start" />
              Ajouter un élément
            </ion-button>
          </div>
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
          <ion-item lines="none">
            <ion-label position="stacked">Dirigeant</ion-label>
            <ParticipantSelector
              v-model="editProgramForm.conductor"
              :service-id="route.params.id as string"
            />
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
            <ion-buttons slot="start">
              <ion-button @click="closeItemFormModal">
                <ion-icon :icon="arrowBackOutline" />
              </ion-button>
            </ion-buttons>
            <ion-title>{{ editingItemId ? 'Modifier l\'élément' : 'Ajouter un élément' }}</ion-title>
            <ion-buttons slot="end">
              <ion-button
                @click="editingItemId ? updateItem() : addItem()"
                :disabled="!itemForm.type || !itemForm.title"
                :strong="true"
              >
                {{ editingItemId ? 'Modifier' : 'Ajouter' }}
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <!-- Type Selection with Icon Buttons -->
          <div class="type-selection-section">
            <ion-label class="type-label">Type *</ion-label>
            <div class="type-buttons-grid">
              <button
                v-for="type in programItemTypes"
                :key="type"
                @click="itemForm.type = type"
                :class="['type-button', { 'selected': itemForm.type === type }]"
                type="button"
              >
                <ion-icon :icon="getItemIcon(type)" class="type-icon" />
                <span class="type-text">{{ type }}</span>
              </button>
            </div>
          </div>

          <div class="title-autocomplete-wrapper">
            <ion-item class="title-field-with-button">
              <ion-label position="stacked">Titre *</ion-label>
              <ion-input
                v-model="itemForm.title"
                :placeholder="itemForm.type === 'Lecture biblique' ? 'Ex: Jean 3:16-18' : 'Ex: Moment d\'adoration'"
                @ionInput="handleTitleInput"
                @ionBlur="handleTitleBlur"
                @ionFocus="handleTitleInput"
              ></ion-input>
              <div slot="end" class="resource-selector-inline">
                <ResourceSelector v-model="itemForm.resourceId" button-fill="solid" button-size="small" />
              </div>
            </ion-item>

            <!-- Title Suggestions Dropdown -->
            <div v-if="showTitleSuggestions && titleSuggestions.length > 0" class="title-suggestions-dropdown">
              <div class="suggestions-header">
                <ion-icon :icon="sparklesOutline" color="primary" />
                <span>Suggestions</span>
              </div>
              <div
                v-for="resource in titleSuggestions"
                :key="resource.id"
                class="suggestion-item"
                @click="selectTitleSuggestion(resource)"
              >
                <span class="suggestion-icon">{{ getResourceTypeIcon(resource) }}</span>
                <div class="suggestion-info">
                  <span class="suggestion-title">{{ resource.title }}</span>
                  <span v-if="resource.collectionId" class="suggestion-badge">
                    {{ getResourceCollectionSymbol(resource) }}
                  </span>
                </div>
                <ion-button fill="solid" size="small" color="success" @click.stop="selectTitleSuggestion(resource)">
                  Utiliser
                </ion-button>
              </div>
            </div>
          </div>

          <!-- Scripture Reference Field (for "Lecture biblique" and "Prédication") -->
          <div v-if="itemForm.type === 'Lecture biblique' || itemForm.type === 'Prédication'" class="scripture-fetch-section">
            <div class="scripture-input-row">
              <ion-item class="scripture-input-item">
                <ion-label position="stacked">
                  <ion-icon :icon="bookOutline" /> Référence biblique
                </ion-label>
                <ion-input
                  v-model="itemForm.scriptureReference"
                  placeholder="Ex: Jean 3:16 ou Psaume 23:1-6"
                  @keyup.enter="handleFetchScripture"
                ></ion-input>
              </ion-item>
              <ion-button
                @click="handleFetchScripture"
                :disabled="!itemForm.scriptureReference || fetchingScripture"
                fill="solid"
                color="primary"
                class="scripture-search-btn"
              >
                <ion-icon v-if="!fetchingScripture" :icon="searchOutline" slot="icon-only" />
                <ion-spinner v-else name="crescent" slot="icon-only" />
              </ion-button>
            </div>

            <!-- Scripture Preview -->
            <div v-if="itemForm.scriptureText" class="scripture-preview">
              <div class="scripture-header">
                <span class="scripture-reference">{{ itemForm.scriptureReference }}</span>
                <span class="scripture-version">{{ itemForm.scriptureVersion }}</span>
                <ion-button fill="clear" size="small" color="medium" @click="clearScripture">
                  <ion-icon :icon="closeOutline" slot="icon-only" />
                </ion-button>
              </div>
              <div class="scripture-text" v-html="formatScriptureWithSuperscript(itemForm.scriptureText)"></div>
            </div>
          </div>

          <ion-item>
            <ion-label position="stacked">Sous-titre (optionnel)</ion-label>
            <ion-input v-model="itemForm.subtitle"></ion-input>
          </ion-item>

          <ion-item lines="none">
            <ion-label position="stacked">Participants (optionnel)</ion-label>
            <ParticipantSelector
              v-model:participants="itemForm.participants"
              :service-id="route.params.id as string"
              :multiple="true"
            />
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Durée (minutes)</ion-label>
            <ion-input v-model.number="itemForm.duration" type="number" min="0"></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Notes (optionnel)</ion-label>
            <ion-textarea v-model="itemForm.notes" :rows="3"></ion-textarea>
          </ion-item>
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
      <ion-modal :is-open="showMediaModalState" @ionModalDidDismiss="closeMediaModal" class="media-modal fullscreen-modal">
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
          <div v-if="(selectedMediaContent.type === 'video' || selectedMediaContent.type === 'youtube') && selectedMediaContent.url && isYouTubeUrl(selectedMediaContent.url)" class="video-container">
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
          <div v-if="!['video', 'youtube', 'spotify', 'audio', 'lyrics', 'music_sheet'].includes(selectedMediaContent.type)" class="debug-container" style="padding: 1rem;">
            <p><strong>Type:</strong> {{ selectedMediaContent.type }}</p>
            <p><strong>URL:</strong> {{ selectedMediaContent.url }}</p>
            <p><strong>Content:</strong> {{ selectedMediaContent.content }}</p>
          </div>
        </ion-content>
      </ion-modal>

      <!-- Item Lyrics View Modal -->
      <ion-modal :is-open="showItemLyricsModalState" @ionModalDidDismiss="closeItemLyricsView" class="lyrics-view-modal fullscreen-modal">
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
        <ion-content class="lyrics-view-modal-content fullscreen-content">
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
                <div class="lyrics-item-header-text">
                  <h3 class="lyrics-item-title">
                    {{ subItem.resourceId && getLinkedResource(subItem.resourceId) ? getLinkedResource(subItem.resourceId)?.title : subItem.title }}
                  </h3>
                  <p v-if="subItem.resourceId && getLinkedResource(subItem.resourceId)?.reference" class="lyrics-item-subtitle">
                    {{ getLinkedResource(subItem.resourceId)?.reference }}
                  </p>
                  <p v-if="subItem.notes" class="lyrics-item-notes">
                    {{ subItem.notes }}
                  </p>
                </div>
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

      <!-- YouTube Playlist Modal -->
      <ion-modal :is-open="showYouTubePlaylistModalState" @ionModalDidDismiss="closeYouTubePlaylist" class="youtube-playlist-modal fullscreen-modal">
        <ion-header>
          <ion-toolbar>
            <ion-title>
              <ion-icon :icon="logoYoutube" style="vertical-align: middle; margin-right: 0.5rem;" />
              Playlist YouTube
            </ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeYouTubePlaylist">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="fullscreen-content">
          <div class="youtube-player-container">
            <!-- Main Video Player -->
            <div v-if="youtubeVideos.length > 0" class="main-player-section">
              <div class="current-video-info">
                <div class="video-counter">
                  Vidéo {{ currentVideoIndex + 1 }} / {{ youtubeVideos.length }}
                </div>
                <h2 class="current-video-title">{{ youtubeVideos[currentVideoIndex].title }}</h2>
                <p v-if="youtubeVideos[currentVideoIndex].subtitle" class="current-video-subtitle">
                  {{ youtubeVideos[currentVideoIndex].subtitle }}
                </p>
              </div>

              <div
                class="main-video-wrapper"
                @touchstart="handleTouchStart"
                @touchmove="handleTouchMove"
                @touchend="handleTouchEnd"
              >
                <iframe
                  :id="`youtube-player-${currentVideoIndex}`"
                  :key="currentVideoIndex"
                  :src="getAutoplayEmbedUrl(youtubeVideos[currentVideoIndex].embedUrl)"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowfullscreen
                  class="main-video-iframe"
                ></iframe>
                <div v-if="showPlayPrompt" class="play-prompt-overlay" @click="dismissPlayPrompt">
                  <div class="play-prompt-content">
                    <ion-icon :icon="playCircleOutline" class="play-prompt-icon" />
                    <p class="play-prompt-text">Appuyez sur la vidéo pour démarrer la lecture</p>
                  </div>
                </div>
              </div>

              <!-- Player Controls -->
              <div class="player-controls">
                <ion-button
                  @click="previousVideo"
                  :disabled="currentVideoIndex === 0"
                  fill="solid"
                  color="danger"
                  class="nav-button"
                >
                  <ion-icon :icon="playBackOutline" slot="start" class="hide-mobile" />
                  <ion-icon :icon="playBackOutline" slot="icon-only" class="show-mobile" />
                  <span class="hide-mobile">Précédent</span>
                </ion-button>

                <div class="progress-indicator">
                  <div
                    v-for="(video, index) in youtubeVideos"
                    :key="index"
                    :class="['progress-dot', { 'active': index === currentVideoIndex, 'played': index < currentVideoIndex }]"
                    @click="goToVideo(index)"
                  ></div>
                </div>

                <ion-button
                  @click="nextVideo"
                  :disabled="currentVideoIndex === youtubeVideos.length - 1"
                  fill="solid"
                  color="danger"
                  class="nav-button"
                >
                  <span class="hide-mobile">Suivant</span>
                  <ion-icon :icon="playForwardOutline" slot="icon-only" class="show-mobile" />
                  <ion-icon :icon="playForwardOutline" slot="end" class="hide-mobile" />
                </ion-button>
              </div>
            </div>

            <!-- Playlist Queue -->
            <div class="playlist-queue">
              <h3 class="queue-title">File d'attente ({{ youtubeVideos.length }})</h3>
              <div class="queue-list">
                <div
                  v-for="(video, index) in youtubeVideos"
                  :key="index"
                  :class="['queue-item', { 'active': index === currentVideoIndex, 'played': index < currentVideoIndex }]"
                  @click="goToVideo(index)"
                >
                  <div class="queue-item-number">{{ index + 1 }}</div>
                  <div class="queue-item-info">
                    <div class="queue-item-title">{{ video.title }}</div>
                    <div class="queue-item-subtitle-group">
                      <div v-if="video.subtitle" class="queue-item-subtitle">{{ video.subtitle }}</div>
                      <div v-if="video.programItemNumber && video.programItemTitle" class="queue-item-context">
                        #{{ video.programItemNumber }} - {{ video.programItemTitle }}
                      </div>
                    </div>
                  </div>
                  <ion-icon
                    v-if="index === currentVideoIndex"
                    :icon="playCircleOutline"
                    class="queue-item-playing"
                  />
                </div>
              </div>
            </div>
          </div>
        </ion-content>
      </ion-modal>

      <!-- Presentation Modal (PowerPoint-style 16:9 Fullscreen) -->
      <ion-modal :is-open="showPresentationModalState" @ionModalDidDismiss="closePresentation" class="presentation-modal fullscreen-modal">
        <ion-content class="presentation-content" :fullscreen="true">
          <div class="presentation-container"
            @touchstart="handlePresentationTouchStart"
            @touchmove="handlePresentationTouchMove"
            @touchend="handlePresentationTouchEnd"
          >
            <!-- Close Button -->
            <div class="presentation-close-btn">
              <ion-button @click="closePresentation" fill="clear" color="light">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </div>

            <!-- Slide Display -->
            <div v-if="presentationSlides.length > 0" class="slide-section">
              <!-- Slide Counter -->
              <div class="slide-counter">
                {{ currentSlideIndex + 1 }} / {{ presentationSlides.length }}
              </div>

              <!-- Main Slide -->
              <div class="slide-wrapper">
                <!-- Scripture Slide (for Lecture biblique or Prédication with scripture) -->
                <div v-if="currentSlide?.scriptureReference" class="slide-fullscreen slide-scripture-mode">
                  <!-- Scripture Header -->
                  <div class="scripture-slide-header">
                    <div class="scripture-badge">
                      <ion-icon :icon="currentSlide.type === 'Prédication' ? micOutline : libraryOutline" />
                      <span>{{ currentSlide.type === 'Prédication' ? 'Prédication' : 'Lecture biblique' }}</span>
                    </div>
                    <div class="scripture-header-right">
                      <div v-if="currentSlide.scripturePage && currentSlide.scriptureTotal && currentSlide.scriptureTotal > 1" class="scripture-page-indicator">
                        {{ currentSlide.scripturePage }}/{{ currentSlide.scriptureTotal }}
                      </div>
                      <div v-if="currentSlide.itemNumber" class="slide-number">#{{ currentSlide.itemNumber }}</div>
                    </div>
                  </div>

                  <!-- Scripture Content -->
                  <div class="scripture-slide-body">
                    <!-- For sermons, show the title first (only on first page) -->
                    <div v-if="currentSlide.type === 'Prédication' && currentSlide.title && (!currentSlide.scripturePage || currentSlide.scripturePage === 1)" class="sermon-title">{{ currentSlide.title }}</div>

                    <div class="scripture-reference-large">{{ currentSlide.scriptureReference }}</div>
                    <div class="scripture-divider"></div>
                    <div v-if="currentSlide.scriptureText" class="scripture-text-large scripture-text-formatted" v-html="formatScriptureForDisplay(currentSlide.scriptureText)"></div>
                    <div v-else class="scripture-no-text">
                      <ion-icon :icon="bookOutline" />
                      <span>Texte non disponible</span>
                    </div>
                  </div>

                  <!-- Scripture Footer -->
                  <div v-if="currentSlide.participant || currentSlide.duration" class="scripture-slide-footer">
                    <div v-if="currentSlide.participant" class="slide-participant">
                      <ion-icon :icon="personOutline" />
                      <span>{{ currentSlide.participant }}</span>
                    </div>
                    <div v-if="currentSlide.duration" class="slide-duration">
                      <ion-icon :icon="timeOutline" />
                      <span>{{ currentSlide.duration }} min</span>
                    </div>
                  </div>
                </div>

                <!-- Lyrics Slide (sub-item or regular song) -->
                <div v-else-if="currentSlide?.isLyricsSlide" class="slide-fullscreen slide-lyrics-mode">
                  <!-- Lyrics Header -->
                  <div class="slide-header-compact">
                    <div class="slide-parent-info">
                      <span v-if="currentSlide.parentTitle" class="parent-title">{{ currentSlide.parentTitle }}</span>
                      <span v-if="currentSlide.isSubItem" class="subitem-counter">Chant {{ currentSlide.subItemIndex }} / {{ currentSlide.totalSubItems }}</span>
                    </div>
                    <div v-if="currentSlide.lyricsTotal && currentSlide.lyricsTotal > 1" class="lyrics-page-indicator">
                      Page {{ currentSlide.lyricsPage }} / {{ currentSlide.lyricsTotal }}
                    </div>
                  </div>

                  <!-- Song Title -->
                  <div class="slide-song-header">
                    <ion-icon :icon="musicalNoteOutline" class="song-icon" />
                    <h1 class="slide-song-title">{{ currentSlide.title }}</h1>
                  </div>

                  <!-- Lyrics Display -->
                  <div class="slide-lyrics-full">
                    <div v-if="currentSlide.lyrics" class="lyrics-text">{{ currentSlide.lyrics }}</div>
                    <div v-else class="no-lyrics-message">
                      <ion-icon :icon="documentTextOutline" />
                      <span>Aucune parole disponible</span>
                    </div>
                  </div>

                  <!-- Notes (only on first page) -->
                  <div v-if="currentSlide.notes" class="slide-notes-bottom">
                    <ion-icon :icon="documentTextOutline" />
                    <span>{{ currentSlide.notes }}</span>
                  </div>
                </div>

                <!-- Regular Slide (non-lyrics) -->
                <div v-else class="slide-fullscreen" :class="{ 'is-section': currentSlide?.isSection }">
                  <!-- Slide Header -->
                  <div class="slide-header">
                    <div class="slide-type-badge">
                      <ion-icon :icon="getSlideTypeIcon(currentSlide?.type || ProgramItemType.SONG)" />
                      <span>{{ getSlideTypeLabel(currentSlide?.type || ProgramItemType.SONG) }}</span>
                    </div>
                    <div v-if="currentSlide && !currentSlide.isSection && currentSlide.itemNumber" class="slide-number">
                      #{{ currentSlide.itemNumber }}
                    </div>
                  </div>

                  <!-- Slide Content -->
                  <div class="slide-body">
                    <h1 class="slide-title">{{ currentSlide?.title }}</h1>
                    <p v-if="currentSlide?.subtitle" class="slide-subtitle">
                      {{ currentSlide.subtitle }}
                    </p>

                    <!-- Sub-items list (e.g., songs in a worship moment) -->
                    <div v-if="currentSlide?.subItems && currentSlide.subItems.length > 0" class="slide-subitems">
                      <div v-for="(subItem, idx) in currentSlide.subItems" :key="idx" class="subitem">
                        <span class="subitem-number">{{ idx + 1 }}.</span>
                        <span class="subitem-title">{{ subItem.resourceTitle || subItem.title }}</span>
                      </div>
                    </div>

                    <!-- Notes -->
                    <div v-if="currentSlide?.notes" class="slide-notes">
                      <ion-icon :icon="documentTextOutline" />
                      <span>{{ currentSlide.notes }}</span>
                    </div>
                  </div>

                  <!-- Slide Footer -->
                  <div class="slide-footer">
                    <div v-if="currentSlide?.participant" class="slide-participant">
                      <ion-icon :icon="personOutline" />
                      <span>{{ currentSlide.participant }}</span>
                    </div>
                    <div v-if="currentSlide?.duration" class="slide-duration">
                      <ion-icon :icon="timeOutline" />
                      <span>{{ currentSlide.duration }} min</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Navigation Controls -->
              <div class="presentation-controls">
                <ion-button
                  @click="previousSlide"
                  :disabled="currentSlideIndex === 0"
                  fill="solid"
                  color="light"
                  class="nav-button"
                >
                  <ion-icon :icon="playBackOutline" slot="start" class="hide-mobile" />
                  <ion-icon :icon="playBackOutline" slot="icon-only" class="show-mobile" />
                  <span class="hide-mobile">Précédent</span>
                </ion-button>

                <div class="slide-progress-indicator">
                  <div
                    v-for="(slide, index) in presentationSlides"
                    :key="index"
                    :class="['slide-progress-dot', { 'active': index === currentSlideIndex, 'viewed': index < currentSlideIndex, 'is-section': slide.isSection, 'is-subitem': slide.isSubItem, 'is-lyrics': slide.isLyricsSlide }]"
                    @click="goToSlide(index)"
                    :title="slide.lyricsPage ? `${slide.title} (${slide.lyricsPage}/${slide.lyricsTotal})` : slide.title"
                  ></div>
                </div>

                <ion-button
                  @click="nextSlide"
                  :disabled="currentSlideIndex === presentationSlides.length - 1"
                  fill="solid"
                  color="light"
                  class="nav-button"
                >
                  <span class="hide-mobile">Suivant</span>
                  <ion-icon :icon="playForwardOutline" slot="icon-only" class="show-mobile" />
                  <ion-icon :icon="playForwardOutline" slot="end" class="hide-mobile" />
                </ion-button>
              </div>
            </div>

            <!-- No slides -->
            <div v-else class="no-slides">
              <ion-icon :icon="documentTextOutline" class="no-slides-icon" />
              <p>Aucun élément dans le programme</p>
            </div>
          </div>
        </ion-content>
      </ion-modal>

      <!-- Scripture Display Modal -->
      <ion-modal :is-open="showScriptureModalState" @ionModalDidDismiss="closeScriptureModal" :initial-breakpoint="0.7" :breakpoints="[0, 0.5, 0.7, 1]">
        <ion-header>
          <ion-toolbar>
            <ion-title>Lecture biblique</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeScriptureModal">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <div v-if="selectedScriptureItem" class="scripture-modal-content">
            <div class="scripture-modal-header">
              <span class="scripture-modal-reference">{{ selectedScriptureItem.scriptureReference }}</span>
              <span class="scripture-modal-version">{{ selectedScriptureItem.scriptureVersion }}</span>
            </div>
            <div class="scripture-modal-text" v-html="formatScriptureWithSuperscript(selectedScriptureItem.scriptureText || '')"></div>
            <div class="scripture-modal-actions">
              <ion-button @click="copyScriptureToClipboard" expand="block" fill="outline" color="primary">
                <ion-icon :icon="copyOutline" slot="start" />
                Copier les versets
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

      <!-- Music Properties Edit Modal -->
      <ion-modal :is-open="showMusicPropsModalState" @ionModalDidDismiss="closeMusicPropsModal" :initial-breakpoint="0.6" :breakpoints="[0, 0.6, 0.9]">
        <ion-header>
          <ion-toolbar>
            <ion-title>Propriétés musicales</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeMusicPropsModal">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <div class="music-props-form">
            <ion-item>
              <ion-select
                v-model="musicPropsForm.musicKey"
                label="Tonalité"
                label-placement="stacked"
                interface="action-sheet"
                placeholder="Sélectionner..."
              >
                <ion-select-option value="">Aucune</ion-select-option>
                <ion-select-option v-for="option in musicKeys" :key="option.id" :value="option.id">
                  {{ option.name }}
                </ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item>
              <ion-select
                v-model="musicPropsForm.musicBeat"
                label="Signature"
                label-placement="stacked"
                interface="action-sheet"
                placeholder="Sélectionner..."
              >
                <ion-select-option value="">Aucune</ion-select-option>
                <ion-select-option v-for="option in musicBeats" :key="option.id" :value="option.id">
                  {{ option.name }}
                </ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item>
              <ion-select
                v-model="musicPropsForm.musicTempo"
                label="Tempo"
                label-placement="stacked"
                interface="action-sheet"
                placeholder="Sélectionner..."
              >
                <ion-select-option value="">Aucun</ion-select-option>
                <ion-select-option v-for="option in musicTempos" :key="option.id" :value="option.id">
                  {{ option.name }} <span v-if="option.label">({{ option.label }})</span>
                </ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item>
              <ion-select
                v-model="musicPropsForm.musicStyle"
                label="Style"
                label-placement="stacked"
                interface="action-sheet"
                placeholder="Sélectionner..."
              >
                <ion-select-option value="">Aucun</ion-select-option>
                <ion-select-option v-for="option in musicStyles" :key="option.id" :value="option.id">
                  {{ option.name }}
                </ion-select-option>
              </ion-select>
            </ion-item>

            <ion-button @click="saveMusicProps" expand="block" class="ion-margin-top">
              Enregistrer
            </ion-button>
          </div>
        </ion-content>
      </ion-modal>

      <!-- Draft Viewers Modal -->
      <ion-modal :is-open="showDraftViewersModal" @didDismiss="showDraftViewersModal = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Gérer les accès</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showDraftViewersModal = false">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
          <ion-toolbar>
            <ion-searchbar
              v-model="draftViewerSearchQuery"
              placeholder="Rechercher un membre..."
              :debounce="300"
            ></ion-searchbar>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <div v-if="loadingMembers" class="modal-loading">
            <ion-spinner name="crescent" />
            <p>Chargement des membres...</p>
          </div>

          <ion-list v-else>
            <ion-item
              v-for="member in filteredDraftViewerMembers"
              :key="member.id"
              :button="true"
              @click="toggleDraftViewer(member.firebaseUserId)"
            >
              <ion-avatar slot="start">
                <img v-if="member.avatar" :src="member.avatar" :alt="member.fullName" />
                <div v-else class="avatar-initials">{{ getMemberInitials(member.fullName) }}</div>
              </ion-avatar>
              <ion-label>
                <h3>{{ member.fullName }}</h3>
                <p>{{ member.email }}</p>
              </ion-label>
              <ion-checkbox
                slot="end"
                :checked="draftViewerIds.includes(member.firebaseUserId)"
                @click.stop
              ></ion-checkbox>
            </ion-item>
          </ion-list>

          <div class="modal-footer">
            <ion-button @click="saveDraftViewers" expand="block" color="primary">
              Enregistrer les accès
            </ion-button>
          </div>
        </ion-content>
      </ion-modal>

      <!-- Inline Resource Bottom Sheet Selector -->
      <ResourceBottomSheet
        :is-open="showInlineResourceSelector"
        :user-id="user?.uid || ''"
        :item-type="inlineResourceItemType"
        :item-title="inlineResourceItemTitle"
        @update:is-open="(val) => { if (!val) closeInlineResourceSelector(); }"
        @select="handleInlineResourceSelect"
        @open-existing="handleOpenFullResourceSelector"
        @open-you-tube="handleOpenYouTubeSearch"
        @open-url="handleOpenUrlPaste"
        @create-new="handleCreateNewResource"
      />

      <!-- Full Resource Selector Modal (for advanced actions) -->
      <ResourceSelector
        :modal-only="true"
        :is-open="showFullResourceSelector"
        @update:is-open="(val) => { if (!val) closeFullResourceSelector(); }"
        @update:model-value="handleInlineResourceSelect"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonCard, IonCardContent, IonLoading, IonModal, IonAvatar,
  IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption,
  IonSpinner, IonReorderGroup, IonReorder, toastController, alertController,
  IonList, IonCheckbox, IonChip, IonSearchbar
} from '@ionic/vue';
import {
  calendarOutline, createOutline, listOutline, timeOutline,
  personOutline, documentTextOutline, musicalNotesOutline,
  closeOutline, musicalNoteOutline, libraryOutline, micOutline,
  megaphoneOutline, giftOutline, handLeftOutline, personCircleOutline,
  checkmarkOutline, reorderThreeOutline, reorderTwoOutline, addOutline, trashOutline,
  playCircleOutline, volumeHighOutline, documentOutline,
  chatboxEllipsesOutline, chevronDownOutline, chevronForwardOutline,
  arrowBackOutline, logoYoutube, playBackOutline, playForwardOutline,
  removeOutline, bookOutline, copyOutline,
  lockClosedOutline, peopleOutline, checkmarkCircleOutline,
  sparklesOutline, easelOutline, searchOutline
} from 'ionicons/icons';
import ResourceSelector from '@/components/ResourceSelector.vue';
import ResourceQuickAdd from '@/components/ResourceQuickAdd.vue';
import ResourceBottomSheet from '@/components/ResourceBottomSheet.vue';
import ParticipantSelector from '@/components/ParticipantSelector.vue';
import SendProgramSMSModal from '@/components/SendProgramSMSModal.vue';
import { serviceService } from '@/services/serviceService';
import { timezoneUtils } from '@/utils/timezone';
import { useUser } from '@/composables/useUser';
import {
  getProgramByServiceId,
  subscribeToProgramByServiceId,
  createProgram,
  updateProgram,
  addItemToProgram,
  updateItemInProgram,
  deleteItemFromProgram,
  addSubItemToItem,
  updateSubItemInItem,
  deleteSubItemFromItem,
  updateProgramOrder,
  publishProgram,
  updateDraftViewers,
  canUserViewProgram
} from '@/firebase/programs';
import type { Service } from '@/types/service';
import type { ServiceProgram, ProgramItem, ProgramParticipant, ProgramSubItem } from '@/types/program';
import type { Member } from '@/types/member';
import { membersService } from '@/firebase/members';
import { ProgramItemType } from '@/types/program';
import type { Resource, ResourceOption } from '@/types/resource';
import { getResourceById, getAllResourceOptions, updateResource, subscribeToResource, getResourceCollectionById, getResources } from '@/firebase/resources';
import type { ResourceCollection } from '@/types/resource';
import { deleteField, type Unsubscribe } from 'firebase/firestore';
import { isYouTubeUrl, getYouTubeEmbedUrl, getSpotifyEmbedUrl } from '@/utils/resource-utils';
import { getSuggestionsByTitle, getSmartSuggestions, getResourceTypeIcon } from '@/utils/resource-suggestions';
import { bibleService } from '@/services/bibleService';

const route = useRoute();
const { user, isAdmin } = useUser();

// Reactive State
const loading = ref(true);
const service = ref<Service | null>(null);
const program = ref<ServiceProgram | null>(null);
const linkedResources = ref<Map<string, Resource>>(new Map());
const isEditMode = ref(false);

// Music options
const musicKeys = ref<ResourceOption[]>([]);
const musicBeats = ref<ResourceOption[]>([]);
const musicTempos = ref<ResourceOption[]>([]);
const musicStyles = ref<ResourceOption[]>([]);

// Edit Program Modal
const showEditProgramModalState = ref(false);
const editProgramForm = ref({
  conductor: null as ProgramParticipant | null
});

// Item Form Modal
const showItemFormModal = ref(false);
const editingItemId = ref<string | null>(null);
const fetchingScripture = ref(false);
const itemForm = ref({
  type: '' as ProgramItemType,
  title: '',
  subtitle: '',
  participants: [] as ProgramParticipant[],
  duration: 0,
  notes: '',
  resourceId: null as string | null,
  scriptureReference: '',
  scriptureText: '',
  scriptureVersion: ''
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

// Scripture Modal
const showScriptureModalState = ref(false);
const selectedScriptureItem = ref<ProgramItem | null>(null);

// YouTube Playlist Modal
const showYouTubePlaylistModalState = ref(false);
const youtubeVideos = ref<Array<{
  title: string;
  subtitle?: string;
  embedUrl: string;
  programItemNumber?: number;
  programItemTitle?: string;
}>>([]);
const currentVideoIndex = ref(0);

// Presentation Modal (PowerPoint-style 16:9)
const showPresentationModalState = ref(false);
const presentationSlides = ref<Array<{
  type: ProgramItemType;
  title: string;
  subtitle?: string;
  participant?: string;
  duration?: number;
  notes?: string;
  scriptureReference?: string;
  scriptureText?: string;
  lyrics?: string;
  lyricsPage?: number;
  lyricsTotal?: number;
  scripturePage?: number;
  scriptureTotal?: number;
  isScriptureSlide?: boolean;
  itemNumber: number;
  isSection?: boolean;
  isSubItem?: boolean;
  isLyricsSlide?: boolean;
  parentTitle?: string;
  subItemIndex?: number;
  totalSubItems?: number;
  subItems?: Array<{
    title: string;
    resourceTitle?: string;
  }>;
}>>([]);
const currentSlideIndex = ref(0);

// Computed property for current slide
const currentSlide = computed(() => {
  if (presentationSlides.value.length === 0) return null;
  return presentationSlides.value[currentSlideIndex.value];
});

// Presentation touch/swipe handling
const presentationTouchStartX = ref(0);
const presentationTouchEndX = ref(0);
const presentationTouchStartY = ref(0);
const presentationTouchEndY = ref(0);

// Touch/Swipe handling
const touchStartX = ref(0);
const touchEndX = ref(0);
const touchStartY = ref(0);
const touchEndY = ref(0);

// Play prompt for mobile
const showPlayPrompt = ref(false);

// Music Properties Edit Modal
const showMusicPropsModalState = ref(false);
const editingResourceId = ref<string | null>(null);
const musicPropsForm = ref({
  musicKey: '' as string,
  musicBeat: '' as string,
  musicTempo: '' as string,
  musicStyle: '' as string
});

// Real-time subscriptions for resources
const resourceSubscriptions = ref<Map<string, Unsubscribe>>(new Map());

// Real-time subscription for program
const programSubscription = ref<Unsubscribe | null>(null);

// Draft Mode State
const showDraftViewersModal = ref(false);
const draftViewerIds = ref<string[]>([]);
const allMembers = ref<Member[]>([]);
const loadingMembers = ref(false);
const draftViewerSearchQuery = ref('');

// Inline Resource Selector State
const showInlineResourceSelector = ref(false);
const showFullResourceSelector = ref(false);
const inlineResourceItemId = ref<string | null>(null);
const inlineResourceItemType = ref('');
const inlineResourceItemTitle = ref('');
const resourceCollections = ref<Map<string, ResourceCollection>>(new Map());

// Title Autocomplete State
const allResources = ref<Resource[]>([]);
const showTitleSuggestions = ref(false);
const loadingResources = ref(false);

// Computed Properties
const serviceId = computed(() => route.params.id as string);

const programItemTypes = computed(() => Object.values(ProgramItemType));

// Title autocomplete suggestions
const titleSuggestions = computed(() => {
  if (!itemForm.value.title || itemForm.value.title.length < 2) return [];
  if (allResources.value.length === 0) return [];

  return getSmartSuggestions(
    itemForm.value.type,
    itemForm.value.title,
    allResources.value,
    [],
    5
  );
});

const sortedItems = computed(() => {
  if (!program.value) return [];
  return [...program.value.items].sort((a, b) => a.order - b.order);
});

const totalDuration = computed(() => {
  if (!program.value) return 0;
  return program.value.items.reduce((sum, item) => sum + (item.duration || 0), 0);
});

// Draft Mode Computed Properties
const canViewProgram = computed(() => {
  return canUserViewProgram(program.value, user.value?.uid, isAdmin.value);
});

const isDraft = computed(() => {
  return program.value?.isDraft ?? true;
});

const canPublish = computed(() => {
  return isAdmin.value && program.value?.isDraft;
});

const filteredDraftViewerMembers = computed(() => {
  if (!draftViewerSearchQuery.value) return allMembers.value;
  const query = draftViewerSearchQuery.value.toLowerCase();
  return allMembers.value.filter(m =>
    m.fullName.toLowerCase().includes(query) ||
    m.email?.toLowerCase().includes(query)
  );
});

const hasYouTubeVideos = computed(() => {
  if (!program.value) return false;

  // Check all items and sub-items for YouTube videos
  for (const item of program.value.items) {
    // Check item resource
    if (item.resourceId) {
      const resource = getLinkedResource(item.resourceId);
      if (resource?.contents?.some(c => (c.type === 'video' || c.type === 'youtube') && c.url && isYouTubeUrl(c.url))) {
        return true;
      }
    }

    // Check sub-items
    if (item.subItems) {
      for (const subItem of item.subItems) {
        if (subItem.resourceId) {
          const resource = getLinkedResource(subItem.resourceId);
          if (resource?.contents?.some(c => (c.type === 'video' || c.type === 'youtube') && c.url && isYouTubeUrl(c.url))) {
            return true;
          }
        }
      }
    }
  }

  return false;
});

// Helper Functions
const formatDateTime = (dateStr: string | undefined, timeStr: string | undefined): string => {
  if (!dateStr || !timeStr) return '';
  return timezoneUtils.formatDateTimeForDisplay(dateStr, timeStr);
};

const getParticipantInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Format scripture text with verse numbers as superscripts
const formatScriptureWithSuperscript = (text: string): string => {
  if (!text) return '';
  // Replace verse numbers at the start of lines/paragraphs with superscript
  // Format: "16 Text here..." → "<sup>16</sup> Text here..."
  return text.replace(/^(\d+)\s/gm, '<sup>$1</sup> ');
};

const getItemIcon = (type: ProgramItemType) => {
  const iconMap: Record<string, string> = {
    'Chant': musicalNoteOutline,
    'Prière': handLeftOutline,
    'Lecture biblique': libraryOutline,
    'Prédication': micOutline,
    'Titre': documentTextOutline,
    'Section': removeOutline,
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

const getResourceCollectionSymbol = (resource: Resource): string => {
  if (!resource.collectionId) return '';
  const collection = resourceCollections.value.get(resource.collectionId);
  return collection?.symbol || '';
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

const isSectionItem = (item: ProgramItem): boolean => {
  return item.type === ProgramItemType.SECTION;
};

// Get the display number for an item, excluding sections from the count
const getItemDisplayNumber = (index: number): number => {
  if (!program.value) return index + 1;

  // Count how many non-section items come before and including this index
  let count = 0;
  for (let i = 0; i <= index; i++) {
    if (!isSectionItem(program.value.items[i])) {
      count++;
    }
  }
  return count;
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
  const alert = await alertController.create({
    header: 'Confirmation',
    message,
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel',
        handler: () => {
          alert.dismiss(false);
        }
      },
      {
        text: 'Confirmer',
        handler: () => {
          alert.dismiss(true);
        }
      }
    ]
  });
  await alert.present();
  const { data } = await alert.onDidDismiss();
  return data === true;
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

const subscribeToResourcesInProgram = (programData: ServiceProgram) => {
  // Subscribe to linked resources for real-time updates
  const resourceIds = new Set<string>();
  programData.items.forEach(item => {
    if (item.resourceId) resourceIds.add(item.resourceId);
    item.subItems?.forEach(subItem => {
      if (subItem.resourceId) resourceIds.add(subItem.resourceId);
    });
  });

  for (const resourceId of resourceIds) {
    // Subscribe to real-time updates for each resource
    subscribeToLinkedResource(resourceId);
  }
};

const setupProgramSubscription = () => {
  // Unsubscribe from previous subscription if exists
  if (programSubscription.value) {
    programSubscription.value();
    programSubscription.value = null;
  }

  // Subscribe to program for real-time updates
  programSubscription.value = subscribeToProgramByServiceId(
    serviceId.value,
    (programData) => {
      program.value = programData;
      if (programData) {
        subscribeToResourcesInProgram(programData);
      }
      loading.value = false;
    },
    (error) => {
      console.error('Error in program subscription:', error);
      loading.value = false;
    }
  );
};

const loadProgram = async () => {
  try {
    setupProgramSubscription();
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

// Draft Mode Functions
const confirmPublish = async () => {
  const alert = await alertController.create({
    header: 'Publier le programme',
    message: 'Une fois publié, le programme sera visible par tous les participants du service. Cette action est irréversible.',
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel'
      },
      {
        text: 'Publier',
        handler: async () => {
          await handlePublish();
        }
      }
    ]
  });
  await alert.present();
};

const handlePublish = async () => {
  if (!program.value || !user.value) return;

  try {
    await publishProgram(program.value.id, user.value.uid);
    await showToast('Programme publié avec succès', 'success');
  } catch (error) {
    console.error('Error publishing program:', error);
    await showToast('Erreur lors de la publication', 'danger');
  }
};

const openDraftViewersModal = async () => {
  if (!program.value) return;

  draftViewerIds.value = [...program.value.draftViewerIds];
  loadingMembers.value = true;
  showDraftViewersModal.value = true;
  draftViewerSearchQuery.value = '';

  try {
    allMembers.value = await membersService.getAllMembers();
  } catch (error) {
    console.error('Error loading members:', error);
    await showToast('Erreur lors du chargement des membres', 'danger');
  } finally {
    loadingMembers.value = false;
  }
};

const toggleDraftViewer = (firebaseUid: string) => {
  const index = draftViewerIds.value.indexOf(firebaseUid);
  if (index > -1) {
    draftViewerIds.value.splice(index, 1);
  } else {
    draftViewerIds.value.push(firebaseUid);
  }
};

const saveDraftViewers = async () => {
  if (!program.value || !user.value) return;

  try {
    await updateDraftViewers(
      program.value.id,
      draftViewerIds.value,
      user.value.uid
    );
    showDraftViewersModal.value = false;
    await showToast('Accès mis à jour', 'success');
  } catch (error) {
    console.error('Error saving draft viewers:', error);
    await showToast('Erreur lors de la mise à jour des accès', 'danger');
  }
};

const getMemberInitials = (fullName: string): string => {
  const parts = fullName.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return fullName.substring(0, 2).toUpperCase();
};

// Edit Program Modal
const showEditProgramModal = () => {
  if (program.value) {
    editProgramForm.value = {
      conductor: program.value.conductor || null
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

    // Clean up conductor object to remove undefined values
    let conductor = editProgramForm.value.conductor;
    if (conductor) {
      conductor = { ...conductor };
      Object.keys(conductor).forEach(key => {
        if ((conductor as any)[key] === undefined) {
          delete (conductor as any)[key];
        }
      });
    }

    await updateProgram(
      program.value.id,
      { conductor: conductor ?? deleteField() } as any,
      user.value.uid
    );

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
const showAddItemModal = async (preselectedType?: ProgramItemType) => {
  editingItemId.value = null;
  itemForm.value = {
    type: preselectedType || '' as ProgramItemType,
    title: '',
    subtitle: '',
    participants: [],
    duration: 0,
    notes: '',
    resourceId: null,
    scriptureReference: '',
    scriptureText: '',
    scriptureVersion: ''
  };
  showTitleSuggestions.value = false;
  showItemFormModal.value = true;

  // Load resources for autocomplete if not already loaded
  if (allResources.value.length === 0) {
    loadResourcesForAutocomplete();
  }
};

const loadResourcesForAutocomplete = async () => {
  if (loadingResources.value) return;
  try {
    loadingResources.value = true;
    allResources.value = await getResources();
  } catch (error) {
    console.error('Error loading resources for autocomplete:', error);
  } finally {
    loadingResources.value = false;
  }
};

const selectTitleSuggestion = (resource: Resource) => {
  itemForm.value.title = resource.title;
  itemForm.value.resourceId = resource.id;
  showTitleSuggestions.value = false;
};

const handleTitleInput = () => {
  // Show suggestions when typing
  showTitleSuggestions.value = itemForm.value.title.length >= 2;
};

const handleTitleBlur = () => {
  // Delay hiding to allow click on suggestion
  setTimeout(() => {
    showTitleSuggestions.value = false;
  }, 200);
};

const showEditItemModalForItem = (item: ProgramItem) => {
  editingItemId.value = item.id;
  // Handle migration from single participant to multiple participants
  let participants: ProgramParticipant[] = [];
  if (item.participants && item.participants.length > 0) {
    participants = item.participants;
  } else if (item.participant) {
    // Migrate old single participant to array
    participants = [item.participant];
  }
  itemForm.value = {
    type: item.type,
    title: item.title,
    subtitle: item.subtitle || '',
    participants,
    duration: item.duration || 0,
    notes: item.notes || '',
    resourceId: item.resourceId || null,
    scriptureReference: item.scriptureReference || '',
    scriptureText: item.scriptureText || '',
    scriptureVersion: item.scriptureVersion || ''
  };
  showItemFormModal.value = true;
};

const closeItemFormModal = () => {
  showItemFormModal.value = false;
  editingItemId.value = null;
};

// Fetch Bible verses for "Lecture biblique" and "Prédication" items
const handleFetchScripture = async () => {
  if (!itemForm.value.scriptureReference) {
    await showToast('Veuillez entrer une référence biblique', 'warning');
    return;
  }

  fetchingScripture.value = true;
  try {
    const result = await bibleService.getScripture(itemForm.value.scriptureReference);

    if (!result) {
      await showToast('Référence biblique non reconnue. Exemple: Jean 3:16 ou Psaume 23:1-6', 'warning');
      return;
    }

    // Update the reference with the normalized version from the API
    itemForm.value.scriptureReference = result.reference;
    itemForm.value.scriptureText = result.text;
    itemForm.value.scriptureVersion = result.version;

    await showToast('Versets récupérés avec succès', 'success');
  } catch (error) {
    console.error('Error fetching scripture:', error);
    await showToast('Erreur lors de la récupération des versets', 'danger');
  } finally {
    fetchingScripture.value = false;
  }
};

const clearScripture = () => {
  itemForm.value.scriptureReference = '';
  itemForm.value.scriptureText = '';
  itemForm.value.scriptureVersion = '';
};

// Scripture Modal Functions
const openScriptureModal = (item: ProgramItem) => {
  if (item.scriptureText) {
    selectedScriptureItem.value = item;
    showScriptureModalState.value = true;
  }
};

const closeScriptureModal = () => {
  showScriptureModalState.value = false;
  selectedScriptureItem.value = null;
};

const copyScriptureToClipboard = async () => {
  if (!selectedScriptureItem.value?.scriptureText) return;

  try {
    const textToCopy = `${selectedScriptureItem.value.scriptureReference}\n\n${selectedScriptureItem.value.scriptureText}\n\n— ${selectedScriptureItem.value.scriptureVersion}`;
    await navigator.clipboard.writeText(textToCopy);
    await showToast('Versets copiés dans le presse-papiers', 'success');
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    await showToast('Erreur lors de la copie', 'danger');
  }
};

const addItem = async () => {
  if (!program.value || !user.value) return;

  try {
    loading.value = true;

    // Build item object, excluding undefined values
    const newItem: any = {
      order: program.value.items.length,
      type: itemForm.value.type,
      title: itemForm.value.title
    };

    // Only add optional fields if they have values
    if (itemForm.value.subtitle) newItem.subtitle = itemForm.value.subtitle;
    if (itemForm.value.participants && itemForm.value.participants.length > 0) {
      // Clean up participants to remove undefined values
      newItem.participants = itemForm.value.participants.map(p => {
        const cleaned: any = { id: p.id, name: p.name, isCustom: p.isCustom };
        if (p.avatar) cleaned.avatar = p.avatar;
        if (p.role) cleaned.role = p.role;
        return cleaned;
      });
    }
    if (itemForm.value.duration) newItem.duration = itemForm.value.duration;
    if (itemForm.value.notes) newItem.notes = itemForm.value.notes;
    if (itemForm.value.resourceId) newItem.resourceId = itemForm.value.resourceId;
    // Scripture fields for "Lecture biblique" items
    if (itemForm.value.scriptureReference) newItem.scriptureReference = itemForm.value.scriptureReference;
    if (itemForm.value.scriptureText) newItem.scriptureText = itemForm.value.scriptureText;
    if (itemForm.value.scriptureVersion) newItem.scriptureVersion = itemForm.value.scriptureVersion;

    await addItemToProgram(
      program.value.id,
      newItem,
      user.value.uid
    );

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

    // Build update object, excluding undefined values
    const updates: any = {
      type: itemForm.value.type,
      title: itemForm.value.title
    };

    // Only add optional fields if they have values
    if (itemForm.value.subtitle) updates.subtitle = itemForm.value.subtitle;
    // Always include participants (empty array to remove, array to set)
    if (itemForm.value.participants && itemForm.value.participants.length > 0) {
      // Clean up participants to remove undefined values
      updates.participants = itemForm.value.participants.map(p => {
        const cleaned: any = { id: p.id, name: p.name, isCustom: p.isCustom };
        if (p.avatar) cleaned.avatar = p.avatar;
        if (p.role) cleaned.role = p.role;
        return cleaned;
      });
    }
    // Clear old participant field if it exists
    updates.participant = undefined;
    if (itemForm.value.duration) updates.duration = itemForm.value.duration;
    if (itemForm.value.notes) updates.notes = itemForm.value.notes;
    if (itemForm.value.resourceId) updates.resourceId = itemForm.value.resourceId;
    // Scripture fields for "Lecture biblique" items
    if (itemForm.value.scriptureReference) updates.scriptureReference = itemForm.value.scriptureReference;
    if (itemForm.value.scriptureText) updates.scriptureText = itemForm.value.scriptureText;
    if (itemForm.value.scriptureVersion) updates.scriptureVersion = itemForm.value.scriptureVersion;

    await updateItemInProgram(
      program.value.id,
      editingItemId.value,
      updates,
      user.value.uid
    );

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

    await showToast('Élément supprimé', 'success');
  } catch (error) {
    console.error('Error deleting item:', error);
    await showToast('Erreur lors de la suppression', 'danger');
  } finally {
    loading.value = false;
  }
};

// Inline Resource Actions
const openInlineResourceSelector = (itemId: string) => {
  inlineResourceItemId.value = itemId;

  // Get item context for smart suggestions
  const item = program.value?.items.find(i => i.id === itemId);
  if (item) {
    inlineResourceItemType.value = item.type || '';
    inlineResourceItemTitle.value = item.title || '';
  } else {
    inlineResourceItemType.value = '';
    inlineResourceItemTitle.value = '';
  }

  showInlineResourceSelector.value = true;
};

const closeInlineResourceSelector = () => {
  showInlineResourceSelector.value = false;
  // Don't clear inlineResourceItemId here - it's needed for follow-up actions
};

const closeFullResourceSelector = () => {
  showFullResourceSelector.value = false;
  inlineResourceItemId.value = null;
};

// Bottom sheet action handlers
const handleOpenFullResourceSelector = () => {
  closeInlineResourceSelector();
  showFullResourceSelector.value = true;
};

const handleOpenYouTubeSearch = () => {
  // For now, use the full resource selector with YouTube tab
  // Future: dedicated YouTube search modal
  closeInlineResourceSelector();
  showFullResourceSelector.value = true;
};

const handleOpenUrlPaste = () => {
  // For now, use the full resource selector
  // Future: dedicated URL paste modal
  closeInlineResourceSelector();
  showFullResourceSelector.value = true;
};

const handleCreateNewResource = async (title: string) => {
  closeInlineResourceSelector();
  if (title) {
    // Open resource selector for creation
    // The title could be pre-filled in a future implementation
    showFullResourceSelector.value = true;
  }
};

const handleInlineResourceSelect = async (resourceId: string | null) => {
  if (!program.value || !user.value || !inlineResourceItemId.value) return;

  // Close both selectors
  closeInlineResourceSelector();
  showFullResourceSelector.value = false;

  try {
    loading.value = true;
    const item = program.value.items.find(i => i.id === inlineResourceItemId.value);
    if (!item) return;

    // Use deleteField for removal, or set the resourceId
    const updates = resourceId
      ? { resourceId }
      : { resourceId: deleteField() as unknown as string };

    await updateItemInProgram(
      program.value.id,
      inlineResourceItemId.value,
      updates,
      user.value.uid
    );

    // Subscribe to the new resource if selected
    if (resourceId) {
      subscribeToLinkedResource(resourceId);
    }

    await showToast(resourceId ? 'Ressource liée' : 'Ressource supprimée', 'success');
  } catch (error) {
    console.error('Error updating item resource:', error);
    await showToast('Erreur lors de la mise à jour', 'danger');
  } finally {
    loading.value = false;
    inlineResourceItemId.value = null;
  }
};

const handleInlineResourceRemove = async (itemId: string) => {
  if (!program.value || !user.value) return;

  try {
    loading.value = true;
    await updateItemInProgram(
      program.value.id,
      itemId,
      { resourceId: deleteField() as unknown as string },
      user.value.uid
    );
    await showToast('Ressource supprimée', 'success');
  } catch (error) {
    console.error('Error removing resource:', error);
    await showToast('Erreur lors de la suppression', 'danger');
  } finally {
    loading.value = false;
  }
};

const getResourceCollection = async (resource: Resource): Promise<ResourceCollection | null> => {
  if (!resource.collectionId) return null;

  // Check cache first
  if (resourceCollections.value.has(resource.collectionId)) {
    return resourceCollections.value.get(resource.collectionId) || null;
  }

  // Fetch and cache
  const collection = await getResourceCollectionById(resource.collectionId);
  if (collection) {
    resourceCollections.value.set(resource.collectionId, collection);
  }
  return collection;
};

// Get collection synchronously from cache (for template use)
const getResourceCollectionCached = (resourceId: string): ResourceCollection | null => {
  const resource = linkedResources.value.get(resourceId);
  if (!resource?.collectionId) return null;
  return resourceCollections.value.get(resource.collectionId) || null;
};

// Handle item reorder (drag and drop)
const handleItemReorder = async (event: CustomEvent) => {
  if (!program.value || !user.value) {
    event.detail.complete();
    return;
  }

  const { from, to } = event.detail;

  // Don't process if position unchanged
  if (from === to) {
    event.detail.complete();
    return;
  }

  // Clone items array and perform reorder
  const itemsCopy = [...program.value.items];
  const [movedItem] = itemsCopy.splice(from, 1);
  itemsCopy.splice(to, 0, movedItem);

  // Update order property for all items
  itemsCopy.forEach((item, index) => {
    item.order = index;
  });

  // Optimistic UI update
  program.value.items = itemsCopy;

  // Complete the reorder animation
  event.detail.complete();

  // Persist to Firebase
  try {
    await updateProgramOrder(
      program.value.id,
      program.value.sections,
      itemsCopy,
      user.value.uid
    );
  } catch (error) {
    console.error('Error saving item order:', error);
    // Reload program to revert on error
    await loadProgram();
    await showToast('Erreur lors de la réorganisation', 'danger');
  }
};

// Handle sub-item reorder (drag and drop)
const handleSubItemReorder = async (event: CustomEvent, parentItemId: string) => {
  if (!program.value || !user.value) {
    event.detail.complete();
    return;
  }

  const { from, to } = event.detail;

  // Don't process if position unchanged
  if (from === to) {
    event.detail.complete();
    return;
  }

  // Find parent item
  const parentItem = program.value.items.find(i => i.id === parentItemId);
  if (!parentItem?.subItems) {
    event.detail.complete();
    return;
  }

  // Clone sub-items array and perform reorder
  const subItemsCopy = [...parentItem.subItems];
  const [movedSubItem] = subItemsCopy.splice(from, 1);
  subItemsCopy.splice(to, 0, movedSubItem);

  // Update order property for all sub-items
  subItemsCopy.forEach((subItem, index) => {
    subItem.order = index;
  });

  // Optimistic UI update
  parentItem.subItems = subItemsCopy;

  // Complete the reorder animation
  event.detail.complete();

  // Persist to Firebase
  try {
    await updateItemInProgram(
      program.value.id,
      parentItemId,
      { subItems: subItemsCopy },
      user.value.uid
    );
  } catch (error) {
    console.error('Error saving sub-item order:', error);
    // Reload program to revert on error
    await loadProgram();
    await showToast('Erreur lors de la réorganisation', 'danger');
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

// YouTube Playlist Functions
const collectYouTubeVideos = () => {
  const videos: Array<{
    title: string;
    subtitle?: string;
    embedUrl: string;
    programItemNumber?: number;
    programItemTitle?: string;
  }> = [];

  if (!program.value) return videos;

  // Collect from all items in order
  for (let i = 0; i < sortedItems.value.length; i++) {
    const item = sortedItems.value[i];
    const itemNumber = i + 1;

    // Check item resource
    if (item.resourceId) {
      const resource = getLinkedResource(item.resourceId);
      if (resource?.contents) {
        for (const content of resource.contents) {
          // Check for both 'video' and 'youtube' types
          if ((content.type === 'video' || content.type === 'youtube') && content.url && isYouTubeUrl(content.url)) {
            const embedUrl = getYouTubeEmbedUrl(content.url);
            if (embedUrl) {
              videos.push({
                title: resource.title,
                subtitle: resource.reference,
                embedUrl,
                programItemNumber: itemNumber,
                programItemTitle: item.title
              });
            }
          }
        }
      }
    }

    // Check sub-items
    if (item.subItems && item.subItems.length > 0) {
      const sortedSubItems = getSortedSubItems(item);
      for (const subItem of sortedSubItems) {
        if (subItem.resourceId) {
          const resource = getLinkedResource(subItem.resourceId);
          if (resource?.contents) {
            for (const content of resource.contents) {
              // Check for both 'video' and 'youtube' types
              if ((content.type === 'video' || content.type === 'youtube') && content.url && isYouTubeUrl(content.url)) {
                const embedUrl = getYouTubeEmbedUrl(content.url);
                if (embedUrl) {
                  videos.push({
                    title: resource.title,
                    subtitle: resource.reference,
                    embedUrl,
                    programItemNumber: itemNumber,
                    programItemTitle: item.title
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  return videos;
};

const showYouTubePlaylist = () => {
  youtubeVideos.value = collectYouTubeVideos();
  currentVideoIndex.value = 0;
  showYouTubePlaylistModalState.value = true;

  // Show play prompt on mobile after a short delay
  setTimeout(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      showPlayPrompt.value = true;
    }
  }, 500);
};

const closeYouTubePlaylist = () => {
  showYouTubePlaylistModalState.value = false;
  currentVideoIndex.value = 0;
  showPlayPrompt.value = false;
};

const nextVideo = () => {
  if (currentVideoIndex.value < youtubeVideos.value.length - 1) {
    currentVideoIndex.value++;
    showPlayPrompt.value = false;
  }
};

const previousVideo = () => {
  if (currentVideoIndex.value > 0) {
    currentVideoIndex.value--;
    showPlayPrompt.value = false;
  }
};

const goToVideo = (index: number) => {
  currentVideoIndex.value = index;
  showPlayPrompt.value = false;
};

const dismissPlayPrompt = () => {
  showPlayPrompt.value = false;
};

const getAutoplayEmbedUrl = (embedUrl: string): string => {
  // Add autoplay parameter and enable JS API to YouTube embed URL
  const separator = embedUrl.includes('?') ? '&' : '?';
  return `${embedUrl}${separator}autoplay=1&rel=0&enablejsapi=1`;
};

// Touch/Swipe handlers
const handleTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.touches[0].clientX;
  touchStartY.value = e.touches[0].clientY;
};

const handleTouchMove = (e: TouchEvent) => {
  touchEndX.value = e.touches[0].clientX;
  touchEndY.value = e.touches[0].clientY;
};

const handleTouchEnd = () => {
  const deltaX = touchStartX.value - touchEndX.value;
  const deltaY = Math.abs(touchStartY.value - touchEndY.value);

  // Minimum swipe distance (in pixels)
  const minSwipeDistance = 50;

  // Check if horizontal swipe is dominant (not vertical scroll)
  if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaX) > deltaY * 2) {
    if (deltaX > 0) {
      // Swiped left - next video
      if (currentVideoIndex.value < youtubeVideos.value.length - 1) {
        nextVideo();
      }
    } else {
      // Swiped right - previous video
      if (currentVideoIndex.value > 0) {
        previousVideo();
      }
    }
  }

  // Reset values
  touchStartX.value = 0;
  touchEndX.value = 0;
  touchStartY.value = 0;
  touchEndY.value = 0;
};

// YouTube Player API integration for auto-advance
const setupYouTubeAPIListener = () => {
  // Load YouTube IFrame API if not already loaded
  if (!(window as any).YT) {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Setup callback for when API is ready
    (window as any).onYouTubeIframeAPIReady = () => {
      initYouTubePlayer();
    };
  } else {
    initYouTubePlayer();
  }
};

const initYouTubePlayer = () => {
  // Wait for iframe to be available
  setTimeout(() => {
    const iframe = document.querySelector('.main-video-iframe') as HTMLIFrameElement;
    if (!iframe || !iframe.contentWindow) return;

    // Initialize YouTube player with event listeners
    new (window as any).YT.Player(iframe, {
      events: {
        onStateChange: (event: any) => {
          // YT.PlayerState.ENDED = 0
          if (event.data === 0) {
            // Video ended, play next
            if (currentVideoIndex.value < youtubeVideos.value.length - 1) {
              nextVideo();
            }
          }
        }
      }
    });
  }, 1000);
};

// Watch for video changes to reinitialize player
watch(currentVideoIndex, () => {
  if (showYouTubePlaylistModalState.value) {
    initYouTubePlayer();
  }
});

// Setup API when modal opens
watch(showYouTubePlaylistModalState, (isOpen) => {
  if (isOpen && youtubeVideos.value.length > 0) {
    setupYouTubeAPIListener();
  }
});

// Presentation Functions (PowerPoint-style 16:9)

// Helper function to split lyrics into pages
const splitLyricsIntoPages = (lyrics: string, maxLinesPerPage: number = 12): string[] => {
  if (!lyrics || lyrics.trim() === '') return [];

  // Split by double newlines (paragraphs/verses) first
  const paragraphs = lyrics.split(/\n\s*\n/).filter(p => p.trim());

  const pages: string[] = [];
  let currentPage: string[] = [];
  let currentLineCount = 0;

  for (const paragraph of paragraphs) {
    const paragraphLines = paragraph.split('\n').filter(l => l.trim());
    const paragraphLineCount = paragraphLines.length;

    // If adding this paragraph would exceed the limit, start a new page
    if (currentLineCount > 0 && currentLineCount + paragraphLineCount > maxLinesPerPage) {
      pages.push(currentPage.join('\n\n'));
      currentPage = [];
      currentLineCount = 0;
    }

    currentPage.push(paragraph);
    currentLineCount += paragraphLineCount;
  }

  // Don't forget the last page
  if (currentPage.length > 0) {
    pages.push(currentPage.join('\n\n'));
  }

  return pages;
};

// Format scripture text with each verse on a new line
const formatScriptureForPresentation = (text: string): string => {
  if (!text) return '';

  // Scripture text often has verse numbers like "16 Text... 17 Text..."
  // We want to put each verse on its own line
  // Pattern: number followed by space at the start or after a period/sentence
  let formatted = text
    // Add newline before verse numbers (except at the very start)
    .replace(/(\S)\s+(\d{1,3})\s+/g, '$1\n\n$2 ')
    // Clean up any double spaces
    .replace(/\s{2,}/g, ' ')
    // Ensure verse numbers at start are formatted correctly
    .replace(/^(\d{1,3})\s+/, '$1 ')
    .trim();

  return formatted;
};

// Split scripture into pages (fewer verses per page for readability)
const splitScriptureIntoPages = (text: string, maxVersesPerPage: number = 4): string[] => {
  if (!text || text.trim() === '') return [];

  // First format the text
  const formatted = formatScriptureForPresentation(text);

  // Split by double newlines (each verse)
  const verses = formatted.split(/\n\n/).filter(v => v.trim());

  if (verses.length === 0) return [formatted];

  const pages: string[] = [];
  let currentPage: string[] = [];

  for (const verse of verses) {
    currentPage.push(verse);

    if (currentPage.length >= maxVersesPerPage) {
      pages.push(currentPage.join('\n\n'));
      currentPage = [];
    }
  }

  // Don't forget the last page
  if (currentPage.length > 0) {
    pages.push(currentPage.join('\n\n'));
  }

  return pages;
};

// Format scripture text for display with HTML line breaks
const formatScriptureForDisplay = (text: string): string => {
  if (!text) return '';
  // Convert double newlines to <br><br> for proper HTML rendering
  // Also highlight verse numbers with styling
  return text
    .replace(/\n\n/g, '<br><br>')
    .replace(/^(\d{1,3})\s/gm, '<span class="verse-number">$1</span> ');
};

const collectPresentationSlides = () => {
  const slides: typeof presentationSlides.value = [];

  if (!program.value) return slides;

  let itemNumber = 0;

  for (const item of sortedItems.value) {
    const isSection = item.type === ProgramItemType.SECTION || item.type === ProgramItemType.TITLE;

    if (!isSection) {
      itemNumber++;
    }

    // Get resource info if available
    let resourceTitle = '';
    let lyrics = '';
    if (item.resourceId) {
      const resource = getLinkedResource(item.resourceId);
      if (resource) {
        resourceTitle = resource.title;
        // Get lyrics if available
        const lyricsContent = resource.contents?.find(c => c.type === 'lyrics');
        if (lyricsContent?.content) {
          lyrics = lyricsContent.content;
        }
      }
    }

    // Get participant name
    let participantName = '';
    if (item.participants && item.participants.length > 0) {
      participantName = item.participants.map(p => p.name).join(', ');
    }

    // Check if item has sub-items (e.g., songs in a worship moment)
    if (item.subItems && item.subItems.length > 0) {
      // First, add the parent item as a "header" slide
      const subItemsInfo = item.subItems.map(sub => {
        const subResource = sub.resourceId ? getLinkedResource(sub.resourceId) : null;
        return {
          title: sub.title,
          resourceTitle: subResource?.title
        };
      });

      slides.push({
        type: item.type,
        title: resourceTitle || item.title,
        subtitle: item.subtitle,
        participant: participantName,
        duration: item.duration,
        notes: item.notes,
        itemNumber: isSection ? 0 : itemNumber,
        isSection: isSection,
        subItems: subItemsInfo
      });

      // Then, create individual slides for each sub-item with lyrics
      const sortedSubItems = [...item.subItems].sort((a, b) => a.order - b.order);
      sortedSubItems.forEach((subItem, subIndex) => {
        let subLyrics = '';
        let subTitle = subItem.title;

        if (subItem.resourceId) {
          const subResource = getLinkedResource(subItem.resourceId);
          if (subResource) {
            subTitle = subResource.title;
            const lyricsContent = subResource.contents?.find(c => c.type === 'lyrics');
            if (lyricsContent?.content) {
              subLyrics = lyricsContent.content;
            }
          }
        }

        // Split lyrics into pages
        const lyricsPages = splitLyricsIntoPages(subLyrics);

        if (lyricsPages.length === 0) {
          // No lyrics - add single slide
          slides.push({
            type: ProgramItemType.SONG,
            title: subTitle,
            lyrics: '',
            itemNumber: itemNumber,
            isSubItem: true,
            isLyricsSlide: true,
            parentTitle: resourceTitle || item.title,
            subItemIndex: subIndex + 1,
            totalSubItems: sortedSubItems.length,
            notes: subItem.notes
          });
        } else {
          // Add a slide for each lyrics page
          lyricsPages.forEach((page, pageIndex) => {
            slides.push({
              type: ProgramItemType.SONG,
              title: subTitle,
              lyrics: page,
              lyricsPage: pageIndex + 1,
              lyricsTotal: lyricsPages.length,
              itemNumber: itemNumber,
              isSubItem: true,
              isLyricsSlide: true,
              parentTitle: resourceTitle || item.title,
              subItemIndex: subIndex + 1,
              totalSubItems: sortedSubItems.length,
              notes: pageIndex === 0 ? subItem.notes : undefined
            });
          });
        }
      });
    } else {
      // Regular item without sub-items
      // For songs with lyrics, split into pages
      if (item.type === ProgramItemType.SONG && lyrics) {
        const lyricsPages = splitLyricsIntoPages(lyrics);

        // First slide with song info
        slides.push({
          type: item.type,
          title: resourceTitle || item.title,
          subtitle: item.subtitle,
          participant: participantName,
          duration: item.duration,
          notes: item.notes,
          itemNumber: itemNumber,
          isSection: false
        });

        // Then lyrics slides
        lyricsPages.forEach((page, pageIndex) => {
          slides.push({
            type: item.type,
            title: resourceTitle || item.title,
            lyrics: page,
            lyricsPage: pageIndex + 1,
            lyricsTotal: lyricsPages.length,
            itemNumber: itemNumber,
            isLyricsSlide: true
          });
        });
      } else if ((item.type === ProgramItemType.SCRIPTURE || item.type === ProgramItemType.SERMON) && item.scriptureText) {
        // Scripture or sermon with scripture text - split into pages
        const scripturePages = splitScriptureIntoPages(item.scriptureText, 4);

        if (scripturePages.length > 1) {
          // Multiple pages - create slides for each page
          scripturePages.forEach((page, pageIndex) => {
            slides.push({
              type: item.type,
              title: resourceTitle || item.title,
              subtitle: item.subtitle,
              participant: pageIndex === 0 ? participantName : undefined,
              duration: pageIndex === 0 ? item.duration : undefined,
              notes: pageIndex === 0 ? item.notes : undefined,
              scriptureReference: item.scriptureReference,
              scriptureText: page,
              scripturePage: pageIndex + 1,
              scriptureTotal: scripturePages.length,
              isScriptureSlide: true,
              itemNumber: isSection ? 0 : itemNumber,
              isSection: isSection
            });
          });
        } else {
          // Single page - format the text with verse line breaks
          slides.push({
            type: item.type,
            title: resourceTitle || item.title,
            subtitle: item.subtitle,
            participant: participantName,
            duration: item.duration,
            notes: item.notes,
            scriptureReference: item.scriptureReference,
            scriptureText: formatScriptureForPresentation(item.scriptureText),
            isScriptureSlide: true,
            itemNumber: isSection ? 0 : itemNumber,
            isSection: isSection
          });
        }
      } else {
        // Non-song items or songs without lyrics
        slides.push({
          type: item.type,
          title: resourceTitle || item.title,
          subtitle: item.subtitle,
          participant: participantName,
          duration: item.duration,
          notes: item.notes,
          scriptureReference: item.scriptureReference,
          scriptureText: item.scriptureText,
          lyrics: lyrics,
          itemNumber: isSection ? 0 : itemNumber,
          isSection: isSection
        });
      }
    }
  }

  return slides;
};

const showPresentation = () => {
  presentationSlides.value = collectPresentationSlides();
  currentSlideIndex.value = 0;
  showPresentationModalState.value = true;
};

const closePresentation = () => {
  showPresentationModalState.value = false;
  currentSlideIndex.value = 0;
};

const nextSlide = () => {
  if (currentSlideIndex.value < presentationSlides.value.length - 1) {
    currentSlideIndex.value++;
  }
};

const previousSlide = () => {
  if (currentSlideIndex.value > 0) {
    currentSlideIndex.value--;
  }
};

const goToSlide = (index: number) => {
  currentSlideIndex.value = index;
};

const handlePresentationTouchStart = (e: TouchEvent) => {
  presentationTouchStartX.value = e.touches[0].clientX;
  presentationTouchStartY.value = e.touches[0].clientY;
};

const handlePresentationTouchMove = (e: TouchEvent) => {
  presentationTouchEndX.value = e.touches[0].clientX;
  presentationTouchEndY.value = e.touches[0].clientY;
};

const handlePresentationTouchEnd = () => {
  const deltaX = presentationTouchStartX.value - presentationTouchEndX.value;
  const deltaY = Math.abs(presentationTouchStartY.value - presentationTouchEndY.value);

  const minSwipeDistance = 50;

  if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaX) > deltaY * 2) {
    if (deltaX > 0) {
      nextSlide();
    } else {
      previousSlide();
    }
  }

  presentationTouchStartX.value = 0;
  presentationTouchEndX.value = 0;
  presentationTouchStartY.value = 0;
  presentationTouchEndY.value = 0;
};

const getSlideTypeIcon = (type: ProgramItemType): string => {
  switch (type) {
    case ProgramItemType.SONG: return musicalNoteOutline;
    case ProgramItemType.PRAYER: return handLeftOutline;
    case ProgramItemType.SCRIPTURE: return libraryOutline;
    case ProgramItemType.SERMON: return micOutline;
    case ProgramItemType.SECTION: return bookOutline;
    case ProgramItemType.TITLE: return bookOutline;
    default: return documentTextOutline;
  }
};

const getSlideTypeLabel = (type: ProgramItemType): string => {
  switch (type) {
    case ProgramItemType.SONG: return 'Chant';
    case ProgramItemType.PRAYER: return 'Prière';
    case ProgramItemType.SCRIPTURE: return 'Lecture biblique';
    case ProgramItemType.SERMON: return 'Prédication';
    case ProgramItemType.SECTION: return 'Section';
    case ProgramItemType.TITLE: return 'Titre';
    default: return type;
  }
};

// Watch for resource selection to auto-populate title
watch(() => itemForm.value.resourceId, async (newResourceId) => {
  if (newResourceId && !itemForm.value.title) {
    const resource = getLinkedResource(newResourceId);
    if (resource) {
      itemForm.value.title = resource.title;
    } else {
      // If resource not yet loaded, load it
      try {
        const resource = await getResourceById(newResourceId);
        if (resource && !itemForm.value.title) {
          itemForm.value.title = resource.title;
          linkedResources.value.set(newResourceId, resource);
        }
      } catch (error) {
        console.error('Error loading resource:', error);
      }
    }
  }
});

// Load music options
const loadMusicOptions = async () => {
  try {
    const options = await getAllResourceOptions();
    musicKeys.value = options.musicKeys;
    musicBeats.value = options.musicBeats;
    musicTempos.value = options.musicTempos;
    musicStyles.value = options.musicStyles;
  } catch (error) {
    console.error('Error loading music options:', error);
  }
};

// Get music option name
const getMusicOptionName = (optionId: string | undefined, options: ResourceOption[]): string => {
  if (!optionId) return '';
  const option = options.find(o => o.id === optionId);
  return option?.name || '';
};

// Get music properties for a resource
const getResourceMusicProps = (resourceId: string | undefined) => {
  if (!resourceId) return null;
  const resource = linkedResources.value.get(resourceId);
  if (!resource) return null;

  const props = [];
  if (resource.musicKey) props.push(getMusicOptionName(resource.musicKey, musicKeys.value));
  if (resource.musicBeat) props.push(getMusicOptionName(resource.musicBeat, musicBeats.value));
  if (resource.musicTempo) props.push(getMusicOptionName(resource.musicTempo, musicTempos.value));
  if (resource.musicStyle) props.push(getMusicOptionName(resource.musicStyle, musicStyles.value));

  return props.length > 0 ? props : null;
};

// Subscribe to a resource for real-time updates
const subscribeToLinkedResource = (resourceId: string) => {
  // Don't subscribe twice
  if (resourceSubscriptions.value.has(resourceId)) return;

  const unsubscribe = subscribeToResource(
    resourceId,
    (resource) => {
      if (resource) {
        linkedResources.value.set(resourceId, resource);
      }
    },
    (error) => {
      console.error('Error in resource subscription:', error);
    }
  );

  resourceSubscriptions.value.set(resourceId, unsubscribe);
};

// Unsubscribe from all resources
const unsubscribeFromAllResources = () => {
  resourceSubscriptions.value.forEach((unsubscribe) => {
    unsubscribe();
  });
  resourceSubscriptions.value.clear();
};

// Open music properties edit modal
const openMusicPropsModal = (resourceId: string) => {
  const resource = linkedResources.value.get(resourceId);
  if (!resource) return;

  editingResourceId.value = resourceId;
  musicPropsForm.value = {
    musicKey: resource.musicKey || '',
    musicBeat: resource.musicBeat || '',
    musicTempo: resource.musicTempo || '',
    musicStyle: resource.musicStyle || ''
  };
  showMusicPropsModalState.value = true;
};

// Close music properties modal
const closeMusicPropsModal = () => {
  showMusicPropsModalState.value = false;
  editingResourceId.value = null;
};

// Save music properties
const saveMusicProps = async () => {
  if (!editingResourceId.value) return;

  try {
    await updateResource(editingResourceId.value, {
      musicKey: musicPropsForm.value.musicKey || undefined,
      musicBeat: musicPropsForm.value.musicBeat || undefined,
      musicTempo: musicPropsForm.value.musicTempo || undefined,
      musicStyle: musicPropsForm.value.musicStyle || undefined
    });

    const toast = await toastController.create({
      message: 'Propriétés musicales mises à jour',
      duration: 1500,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();

    closeMusicPropsModal();
  } catch (error) {
    console.error('Error saving music properties:', error);
    const toast = await toastController.create({
      message: 'Erreur lors de la mise à jour',
      duration: 2000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }
};

// Lifecycle
onMounted(async () => {
  loading.value = true;
  await Promise.all([loadService(), loadMusicOptions()]);
  await loadProgram();
  loading.value = false;
});

onUnmounted(() => {
  // Clean up program subscription
  if (programSubscription.value) {
    programSubscription.value();
    programSubscription.value = null;
  }
  // Clean up all resource subscriptions
  unsubscribeFromAllResources();
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

/* YouTube Feature Notice */
.youtube-feature-notice {
  background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
  padding: 1rem 1.5rem;
  margin: 0;
  border-bottom: 1px solid #D1D5DB;
  border-left: 4px solid #EF4444;
}

.notice-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: 1000px;
  margin: 0 auto;
}

.notice-icon {
  font-size: 2.5rem;
  color: #EF4444;
  flex-shrink: 0;
}

.notice-text {
  flex: 1;
  color: #374151;
  font-size: 0.95rem;
  line-height: 1.5;
}

.notice-text strong {
  font-weight: 700;
  font-size: 1.05rem;
  color: #EF4444;
}

.inline-icon {
  font-size: 1.2rem;
  vertical-align: middle;
  margin: 0 0.25rem;
  color: #EF4444;
}

@media (max-width: 768px) {
  .youtube-feature-notice {
    padding: 0.75rem 1rem;
  }

  .notice-content {
    gap: 0.75rem;
  }

  .notice-icon {
    font-size: 2rem;
  }

  .notice-text {
    font-size: 0.85rem;
  }

  .notice-text strong {
    font-size: 0.95rem;
  }

  .inline-icon {
    font-size: 1rem;
  }
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

.conductor-avatar {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.conductor-initials {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ion-color-primary);
  color: white;
  font-size: 14px;
  font-weight: 600;
  border-radius: 50%;
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
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.add-item-button {
  min-width: 200px;
}

/* Quick-Add Type Buttons */
.quick-add-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
}

.quick-add-buttons ion-button {
  --padding-start: 12px;
  --padding-end: 12px;
  font-size: 12px;
  text-transform: none;
}

.quick-add-buttons ion-icon {
  font-size: 16px;
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

/* Drag handle styles for ion-reorder */
ion-reorder.item-handle-column {
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  flex-shrink: 0;
  width: 40px;
}

ion-reorder.item-handle-column:active {
  cursor: grabbing;
}

.drag-handle-icon {
  color: var(--ion-color-medium);
  font-size: 1.5rem;
}

/* Visual feedback during drag */
.program-item-wrapper.item-reorder-active {
  background: var(--ion-color-light-shade);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  z-index: 100;
}

/* Sub-item reorder handle */
.sub-item-handle {
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.125rem;
  flex-shrink: 0;
  width: 24px;
}

.sub-item-handle:active {
  cursor: grabbing;
}

.sub-item-handle ion-icon {
  font-size: 1rem;
  color: var(--ion-color-medium);
}

/* Sub-item visual feedback during drag */
.sub-item.item-reorder-active {
  background: var(--ion-color-light-tint);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
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

/* Music Properties */
.music-props-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.music-props {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.music-prop {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
  background: var(--ion-color-light);
  padding: 2px 8px;
  border-radius: 4px;
}

.music-prop.small {
  font-size: 0.7rem;
  padding: 1px 6px;
  margin-left: 0.25rem;
}

.music-props-edit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: var(--ion-color-light);
  border-radius: 50%;
  cursor: pointer;
  color: var(--ion-color-medium);
  transition: all 0.2s ease;
}

.music-props-edit-btn:hover {
  background: var(--ion-color-primary);
  color: white;
}

.music-props-edit-btn.small {
  width: 20px;
  height: 20px;
}

.music-props-edit-btn ion-icon {
  font-size: 14px;
}

.music-props-edit-btn.small ion-icon {
  font-size: 12px;
}

.music-props-form ion-item {
  margin-bottom: 0.5rem;
}

.sub-item-resources {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.25rem;
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

.item-participants {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: flex-end;
}

.participant-avatar {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.participant-initials {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: var(--ion-color-primary);
  color: white;
  font-size: 10px;
  font-weight: 600;
  border-radius: 50%;
  flex-shrink: 0;
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

/* Fullscreen Modal */
.fullscreen-modal {
  --width: 100%;
  --height: 100%;
  --border-radius: 0;
}

.fullscreen-content {
  --padding-top: 0;
  --padding-bottom: 0;
  --padding-start: 0;
  --padding-end: 0;
}

.lyrics-view-modal-content {
  --padding-top: 1rem;
}

.lyrics-view-container {
  padding: 0.5rem;
}

.lyrics-item-card {
  background: white;
  border-radius: 0;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  box-shadow: none;
  border-bottom: 1px solid var(--ion-color-light);
}

.lyrics-item-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--ion-color-primary);
}

.lyrics-item-header-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.lyrics-item-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--ion-color-primary);
  color: white;
  border-radius: 50%;
  font-weight: 700;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.lyrics-item-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--ion-color-dark);
  line-height: 1.2;
}

.lyrics-item-subtitle {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--ion-color-medium-shade);
  line-height: 1.2;
}

.lyrics-item-notes {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 400;
  color: var(--ion-color-medium);
  font-style: italic;
  line-height: 1.2;
}

.lyrics-content-display {
  background: transparent;
  padding: 0.5rem 0;
  border-radius: 0;
  margin-top: 0.5rem;
}

.lyrics-content-display pre {
  white-space: pre-wrap;
  font-family: var(--ion-font-family);
  font-size: 1.1rem;
  line-height: 1.7;
  margin: 0;
  color: var(--ion-color-dark);
  font-weight: 400;
}

.no-lyrics {
  text-align: center;
  padding: 2rem;
  color: var(--ion-color-medium);
  font-style: italic;
}

/* YouTube Playlist Modal */
.youtube-playlist-modal {
  --width: 100%;
  --height: 100%;
  --border-radius: 0;
}

.youtube-player-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #000;
}

/* Main Player Section */
.main-player-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #000;
}

.current-video-info {
  padding: 1rem;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.7));
  color: white;
}

.video-counter {
  font-size: 0.85rem;
  color: var(--ion-color-danger);
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.current-video-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  line-height: 1.3;
}

.current-video-subtitle {
  margin: 0.25rem 0 0 0;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
}

.main-video-wrapper {
  flex: 1;
  position: relative;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-video-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.play-prompt-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  cursor: pointer;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.play-prompt-content {
  text-align: center;
  color: white;
  padding: 2rem;
}

.play-prompt-icon {
  font-size: 4rem;
  color: #EF4444;
  margin-bottom: 1rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.play-prompt-text {
  font-size: 1.1rem;
  font-weight: 500;
  margin: 0;
  line-height: 1.5;
}

/* Player Controls */
.player-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.7));
  gap: 1rem;
}

.progress-indicator {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.5rem 0;
}

.progress-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.progress-dot:hover {
  background: rgba(255, 255, 255, 0.5);
  transform: scale(1.2);
}

.progress-dot.active {
  background: var(--ion-color-danger);
  width: 16px;
  height: 16px;
}

.progress-dot.played {
  background: rgba(255, 255, 255, 0.6);
}

/* Playlist Queue */
.playlist-queue {
  background: var(--ion-color-light);
  border-top: 2px solid var(--ion-color-medium);
  max-height: 40%;
  overflow-y: auto;
}

.queue-title {
  margin: 0;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--ion-color-dark);
  background: white;
  border-bottom: 1px solid var(--ion-color-light-shade);
  sticky: top;
  top: 0;
  z-index: 1;
}

.queue-list {
  display: flex;
  flex-direction: column;
}

.queue-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: white;
  border-bottom: 1px solid var(--ion-color-light);
  cursor: pointer;
  transition: all 0.2s ease;
}

.queue-item:hover {
  background: var(--ion-color-light-tint);
}

.queue-item.active {
  background: var(--ion-color-danger);
  border-left: 4px solid var(--ion-color-danger-shade);
}

.queue-item.played {
  opacity: 0.6;
}

.queue-item-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--ion-color-light);
  color: var(--ion-color-dark);
  font-weight: 600;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.queue-item.active .queue-item-number {
  background: rgba(255, 255, 255, 0.3);
  color: white;
}

.queue-item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.queue-item-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--ion-color-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.queue-item.active .queue-item-title {
  color: white;
}

.queue-item-subtitle-group {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.queue-item-subtitle {
  font-size: 0.8rem;
  color: var(--ion-color-medium-shade);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.queue-item.active .queue-item-subtitle {
  color: rgba(255, 255, 255, 0.85);
}

.queue-item-context {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
  font-style: italic;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.queue-item.active .queue-item-context {
  color: rgba(255, 255, 255, 0.7);
}

.queue-item-playing {
  font-size: 1.5rem;
  color: white;
  flex-shrink: 0;
}

/* Utility classes for responsive display */
.hide-mobile {
  display: inline;
}

.show-mobile {
  display: none;
}

/* Navigation buttons */
.nav-button {
  --padding-start: 1rem;
  --padding-end: 1rem;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .current-video-title {
    font-size: 1.2rem;
  }

  .player-controls {
    flex-direction: row;
    gap: 0.5rem;
    padding: 0.75rem;
  }

  .nav-button {
    --padding-start: 0.5rem;
    --padding-end: 0.5rem;
    min-width: 44px;
    flex-shrink: 0;
  }

  .hide-mobile {
    display: none;
  }

  .show-mobile {
    display: inline;
  }

  .progress-indicator {
    flex: 1;
    gap: 0.35rem;
    padding: 0;
  }

  .progress-dot {
    width: 10px;
    height: 10px;
  }

  .progress-dot.active {
    width: 14px;
    height: 14px;
  }

  .playlist-queue {
    max-height: 50%;
  }
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

  .item-participants {
    align-items: flex-start;
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

/* Title Field with Resource Button */
.title-field-with-button {
  --padding-end: 0;
}

.resource-selector-inline {
  display: flex;
  align-items: center;
  margin-left: 0.5rem;
}

/* Title Autocomplete */
.title-autocomplete-wrapper {
  position: relative;
}

.title-suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid var(--ion-color-light-shade);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 280px;
  overflow-y: auto;
  margin-top: 4px;
}

.title-suggestions-dropdown .suggestions-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--ion-color-medium);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--ion-color-light);
}

.title-suggestions-dropdown .suggestion-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.title-suggestions-dropdown .suggestion-item:hover {
  background: var(--ion-color-light);
}

.title-suggestions-dropdown .suggestion-item:last-child {
  border-radius: 0 0 12px 12px;
}

.suggestion-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.suggestion-info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.suggestion-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--ion-color-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggestion-badge {
  font-size: 11px;
  font-weight: 600;
  color: var(--ion-color-primary);
  background: var(--ion-color-primary-tint);
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

/* Type Selection Section */
.type-selection-section {
  margin-bottom: 1.5rem;
}

.type-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ion-color-medium);
  margin-bottom: 0.75rem;
}

.type-buttons-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.type-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 0.75rem;
  min-width: 90px;
  border: 2px solid var(--ion-color-light);
  border-radius: 8px;
  background: var(--ion-color-light-tint);
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--ion-color-danger);
}

.type-button:hover {
  border-color: var(--ion-color-primary-tint);
  background: var(--ion-color-primary-tint);
  color: white;
}

.type-button.selected {
  border-color: var(--ion-color-primary);
  background: var(--ion-color-primary);
  color: white;
}

.type-icon {
  font-size: 1.75rem;
}

.type-button:hover .type-icon {
  color: white;
}

.type-button.selected .type-icon {
  color: white;
}

.type-text {
  font-size: 0.75rem;
  font-weight: 500;
  text-align: center;
  line-height: 1.2;
}

/* Section Divider Styles */
.program-item-wrapper.is-section {
  margin: 1.5rem 0;
}

.program-item-wrapper.is-section .program-item {
  background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-primary-shade) 100%);
  border-radius: 0;
  padding: 0.75rem 1rem;
}

.program-item-wrapper.is-section .item-layout {
  justify-content: center;
}

.program-item-wrapper.is-section .item-details-column {
  text-align: center;
}

.program-item-wrapper.is-section .item-header-row {
  justify-content: center;
  margin-bottom: 0;
}

.program-item-wrapper.is-section .item-type {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.program-item-wrapper.is-section .item-type ion-icon {
  display: none;
}

.program-item-wrapper.is-section .item-title {
  color: white;
  font-size: 1.1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0;
}

.program-item-wrapper.is-section .item-subtitle,
.program-item-wrapper.is-section .item-notes,
.program-item-wrapper.is-section .item-resources {
  display: none;
}

.program-item-wrapper.is-section .item-meta-column {
  display: none;
}

/* Hide actions for section in view mode, show in edit mode */
.program-item-wrapper.is-section .item-actions-column {
  display: flex !important;
}

.program-item-wrapper.is-section .item-actions ion-button {
  --color: white !important;
  --ion-color-primary: white;
  --ion-color-danger: white;
}

.program-item-wrapper.is-section .item-actions ion-button ion-icon {
  color: white !important;
}

/* Scripture Fetch Section */
.scripture-fetch-section {
  padding: 12px 16px;
}

.scripture-input-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin-bottom: 12px;
}

.scripture-input-item {
  flex: 1;
  --padding-start: 0;
  --inner-padding-end: 0;
}

.scripture-input-item ion-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.scripture-input-item ion-label ion-icon {
  font-size: 1rem;
  color: var(--ion-color-primary);
}

.scripture-search-btn {
  --border-radius: 8px;
  height: 42px;
  margin-bottom: 8px;
}

.scripture-preview {
  background: var(--ion-color-light);
  border-radius: 12px;
  padding: 12px;
  border: 1px solid var(--ion-color-light-shade);
}

.scripture-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.scripture-reference {
  font-weight: 600;
  color: var(--ion-color-primary);
  font-size: 0.95rem;
}

.scripture-version {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
  background: var(--ion-color-light-shade);
  padding: 2px 8px;
  border-radius: 12px;
}

.scripture-header ion-button {
  margin-left: auto;
  --padding-start: 4px;
  --padding-end: 4px;
}

.scripture-text {
  white-space: pre-wrap;
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--ion-color-dark);
  max-height: 350px;
  overflow-y: auto;
  padding: 8px;
  background: white;
  border-radius: 8px;
}

.scripture-text :deep(sup),
.scripture-modal-text :deep(sup) {
  font-size: 0.7em;
  font-weight: 600;
  color: var(--ion-color-primary);
  margin-right: 2px;
  vertical-align: super;
}

/* Scripture Chip in View Mode */
.scripture-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--ion-color-tertiary);
  color: white;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.scripture-chip:hover {
  opacity: 0.85;
}

.scripture-chip ion-icon {
  font-size: 14px;
}

/* Scripture Modal */
.scripture-modal-content {
  padding: 16px;
}

.scripture-modal-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--ion-color-light-shade);
}

.scripture-modal-reference {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--ion-color-primary);
}

.scripture-modal-version {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
}

.scripture-modal-text {
  white-space: pre-wrap;
  font-size: 1rem;
  line-height: 1.8;
  color: var(--ion-color-dark);
}

.scripture-modal-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--ion-color-light-shade);
}

/* Draft Mode Styles */
.draft-badge {
  margin-right: 8px;
}

.draft-controls {
  padding: 0 16px;
  margin-top: 16px;
}

.draft-controls ion-card {
  margin: 0;
}

.draft-controls-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.draft-controls-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1rem;
  font-weight: 600;
}

.draft-description {
  font-size: 0.9rem;
  margin-bottom: 16px;
  opacity: 0.9;
}

.draft-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.access-denied {
  padding: 16px;
}

.access-denied .text-center {
  text-align: center;
}

.access-denied .large-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.access-denied h3 {
  margin: 0 0 8px 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.access-denied p {
  margin: 0;
  color: var(--ion-color-medium);
}

/* Draft Viewers Modal */
.modal-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  gap: 16px;
}

.modal-footer {
  padding: 16px;
  background: var(--ion-background-color);
  border-top: 1px solid var(--ion-color-light);
}

.avatar-initials {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ion-color-primary);
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  border-radius: 50%;
}

/* Presentation Modal (Fullscreen 16:9) */
.presentation-modal {
  --width: 100%;
  --height: 100%;
  --border-radius: 0;
}

.presentation-content {
  --background: #000;
}

.presentation-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: #000;
  position: relative;
}

/* Close Button */
.presentation-close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 100;
}

.presentation-close-btn ion-button {
  --color: rgba(255, 255, 255, 0.8);
  font-size: 1.5rem;
}

.presentation-close-btn ion-button:hover {
  --color: white;
}

.slide-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.slide-counter {
  position: absolute;
  top: 1rem;
  left: 1rem;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
  z-index: 100;
  background: rgba(0, 0, 0, 0.5);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
}

.slide-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  overflow: hidden;
}

/* Fullscreen Slide Container */
.slide-fullscreen {
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.slide-fullscreen.is-section {
  background: linear-gradient(145deg, var(--ion-color-primary) 0%, var(--ion-color-primary-shade) 100%);
}

/* Lyrics Mode Slide */
.slide-fullscreen.slide-lyrics-mode {
  background: linear-gradient(145deg, #0a0a15 0%, #1a1a2e 100%);
}

/* Scripture Mode Slide */
.slide-fullscreen.slide-scripture-mode {
  background: linear-gradient(145deg, #1a0a0a 0%, #2e1a1a 50%, #1a1a2e 100%);
}

.scripture-slide-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 3rem;
  flex-shrink: 0;
}

.scripture-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 1.25rem;
  background: rgba(181, 18, 27, 0.9);
  color: white;
  border-radius: 30px;
  font-size: 1.1rem;
  font-weight: 600;
}

.scripture-badge ion-icon {
  font-size: 1.4rem;
}

.scripture-slide-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem 4rem;
  text-align: center;
}

.sermon-title {
  font-size: 2.2rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1rem;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.scripture-reference-large {
  font-size: 2.5rem;
  font-weight: 700;
  color: #e8c4a0;
  margin-bottom: 1.5rem;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  font-family: Georgia, 'Times New Roman', serif;
}

.scripture-divider {
  width: 120px;
  height: 3px;
  background: linear-gradient(90deg, transparent, #e8c4a0, transparent);
  margin-bottom: 2rem;
}

.scripture-text-large {
  font-size: 1.8rem;
  color: #f5f0e8;
  line-height: 2;
  max-width: 85%;
  font-family: Georgia, 'Times New Roman', serif;
  font-style: italic;
  text-align: justify;
  text-align-last: center;
}

.scripture-no-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: rgba(255, 255, 255, 0.4);
}

.scripture-no-text ion-icon {
  font-size: 4rem;
}

.scripture-no-text span {
  font-size: 1.25rem;
}

.scripture-slide-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 3rem;
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.6);
  flex-shrink: 0;
}

.scripture-header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.scripture-page-indicator {
  background: rgba(232, 196, 160, 0.2);
  color: #e8c4a0;
  padding: 0.4rem 0.9rem;
  border-radius: 20px;
  font-size: 1rem;
  font-weight: 600;
  border: 1px solid rgba(232, 196, 160, 0.3);
}

.scripture-text-formatted {
  text-align: left;
  text-align-last: left;
}

.scripture-text-formatted .verse-number {
  display: inline-block;
  color: #e8c4a0;
  font-weight: 700;
  font-size: 0.8em;
  vertical-align: super;
  margin-right: 0.2em;
  font-style: normal;
}

/* Slide Header */
.slide-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.slide-header-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.4);
  flex-shrink: 0;
}

.slide-parent-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.parent-title {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.subitem-counter {
  font-size: 0.9rem;
  color: var(--ion-color-primary);
  font-weight: 700;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
}

.lyrics-page-indicator {
  font-size: 1rem;
  color: white;
  font-weight: 700;
  background: var(--ion-color-primary);
  padding: 0.35rem 1rem;
  border-radius: 20px;
}

.slide-notes-bottom {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.3);
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  flex-shrink: 0;
}

.slide-notes-bottom ion-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.slide-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--ion-color-primary);
  color: white;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
}

.slide-type-badge ion-icon {
  font-size: 1.2rem;
}

.slide-number {
  font-size: 2rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
}

.slide-fullscreen.is-section .slide-header {
  background: rgba(0, 0, 0, 0.2);
}

.slide-fullscreen.is-section .slide-type-badge {
  background: rgba(255, 255, 255, 0.2);
}

/* Song Header for Lyrics Mode */
.slide-song-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1.5rem 2rem;
  flex-shrink: 0;
}

.song-icon {
  font-size: 2.5rem;
  color: var(--ion-color-primary);
}

.slide-song-title {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  text-align: center;
}

/* Slide Body */
.slide-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem 4rem;
  text-align: center;
  overflow-y: auto;
}

.slide-title {
  margin: 0;
  font-size: 4rem;
  font-weight: 700;
  color: white;
  line-height: 1.2;
  max-width: 90%;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.slide-subtitle {
  margin: 1rem 0 0 0;
  font-size: 1.75rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

/* Scripture Display */
.slide-scripture {
  margin-top: 2rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  max-width: 80%;
  border-left: 4px solid var(--ion-color-primary);
}

.scripture-reference {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ion-color-primary);
  margin-bottom: 1rem;
}

.scripture-text {
  font-size: 1.5rem;
  color: white;
  font-style: italic;
  line-height: 1.8;
  max-height: none;
  overflow-y: visible;
}

/* Sub-items List */
.slide-subitems {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-align: left;
  max-width: 70%;
}

.subitem {
  display: flex;
  gap: 1rem;
  font-size: 1.75rem;
  color: white;
  padding: 0.5rem 0;
}

.subitem-number {
  font-weight: 700;
  color: var(--ion-color-primary);
  min-width: 2.5rem;
}

.subitem-title {
  flex: 1;
}

/* Full Lyrics Display */
.slide-lyrics-full {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  overflow-y: auto;
  width: 100%;
}

.lyrics-text {
  font-size: 2rem;
  color: white;
  white-space: pre-line;
  line-height: 1.8;
  text-align: center;
  max-width: 90%;
}

.no-lyrics-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: rgba(255, 255, 255, 0.5);
}

.no-lyrics-message ion-icon {
  font-size: 4rem;
}

.no-lyrics-message span {
  font-size: 1.5rem;
}

/* Notes */
.slide-notes {
  margin-top: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.7);
  max-width: 70%;
  text-align: left;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.slide-notes ion-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
  margin-top: 2px;
}

/* Slide Footer */
.slide-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.3);
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.7);
  flex-shrink: 0;
}

.slide-fullscreen.is-section .slide-footer {
  background: rgba(0, 0, 0, 0.2);
}

.slide-participant, .slide-duration {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.slide-participant ion-icon, .slide-duration ion-icon {
  font-size: 1.2rem;
}

/* Presentation Controls */
.presentation-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  gap: 1rem;
  background: rgba(0, 0, 0, 0.8);
  flex-shrink: 0;
}

.presentation-controls .nav-button {
  --border-radius: 8px;
  --background: rgba(255, 255, 255, 0.15);
  --color: white;
  font-weight: 600;
}

.presentation-controls .nav-button:hover {
  --background: rgba(255, 255, 255, 0.25);
}

.slide-progress-indicator {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.5rem 0;
}

.slide-progress-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.slide-progress-dot:hover {
  background: rgba(255, 255, 255, 0.5);
  transform: scale(1.2);
}

.slide-progress-dot.active {
  background: var(--ion-color-primary);
  width: 16px;
  height: 16px;
  box-shadow: 0 0 10px var(--ion-color-primary);
}

.slide-progress-dot.viewed {
  background: rgba(255, 255, 255, 0.6);
}

.slide-progress-dot.is-section {
  border-radius: 4px;
  width: 18px;
  height: 10px;
}

.slide-progress-dot.is-section.active {
  width: 22px;
  height: 12px;
}

.slide-progress-dot.is-subitem {
  background: rgba(var(--ion-color-primary-rgb), 0.4);
  width: 8px;
  height: 8px;
}

.slide-progress-dot.is-subitem.active {
  background: var(--ion-color-primary);
  width: 12px;
  height: 12px;
}

.slide-progress-dot.is-lyrics {
  background: rgba(255, 255, 255, 0.25);
  width: 6px;
  height: 6px;
}

.slide-progress-dot.is-lyrics.active {
  background: var(--ion-color-primary);
  width: 10px;
  height: 10px;
}

.slide-progress-dot.is-lyrics.viewed {
  background: rgba(255, 255, 255, 0.5);
}

/* No slides state */
.no-slides {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
}

.no-slides-icon {
  font-size: 5rem;
  margin-bottom: 1.5rem;
}

.no-slides p {
  font-size: 1.5rem;
  margin: 0;
}

/* Responsive adjustments for presentation */
@media (max-width: 1024px) {
  .slide-title {
    font-size: 3rem;
  }

  .slide-song-title {
    font-size: 2rem;
  }

  .lyrics-text {
    font-size: 1.5rem;
  }

  .sermon-title {
    font-size: 1.8rem;
  }

  .scripture-reference-large {
    font-size: 2rem;
  }

  .scripture-text-large {
    font-size: 1.5rem;
    line-height: 1.8;
  }

  .subitem {
    font-size: 1.5rem;
  }
}

@media (max-width: 768px) {
  .slide-header {
    padding: 1rem 1.5rem;
  }

  .slide-type-badge {
    font-size: 0.85rem;
    padding: 0.4rem 0.8rem;
  }

  .slide-number {
    font-size: 1.5rem;
  }

  .slide-body {
    padding: 1.5rem 2rem;
  }

  .slide-title {
    font-size: 2rem;
  }

  .slide-subtitle {
    font-size: 1.25rem;
  }

  .slide-song-title {
    font-size: 1.5rem;
  }

  .song-icon {
    font-size: 1.75rem;
  }

  .lyrics-text {
    font-size: 1.2rem;
    line-height: 1.6;
  }

  .scripture-slide-header {
    padding: 1rem 1.5rem;
  }

  .scripture-badge {
    font-size: 0.9rem;
    padding: 0.4rem 0.8rem;
  }

  .scripture-slide-body {
    padding: 1.5rem 2rem;
  }

  .sermon-title {
    font-size: 1.4rem;
    margin-bottom: 0.75rem;
  }

  .scripture-reference-large {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  .scripture-divider {
    width: 80px;
    margin-bottom: 1.5rem;
  }

  .scripture-text-large {
    font-size: 1.2rem;
    line-height: 1.7;
    max-width: 95%;
  }

  .scripture-slide-footer {
    padding: 0.75rem 1.5rem;
    font-size: 0.95rem;
  }

  .subitem {
    font-size: 1.2rem;
  }

  .slide-footer {
    padding: 0.75rem 1.5rem;
    font-size: 0.95rem;
  }

  .presentation-controls {
    padding: 0.75rem 1rem;
  }

  .slide-progress-dot {
    width: 10px;
    height: 10px;
  }

  .slide-progress-dot.active {
    width: 14px;
    height: 14px;
  }

  .slide-counter {
    font-size: 0.85rem;
    top: 0.75rem;
    left: 0.75rem;
  }

  .presentation-close-btn {
    top: 0.5rem;
    right: 0.5rem;
  }
}

@media (max-width: 480px) {
  .slide-title {
    font-size: 1.5rem;
  }

  .lyrics-text {
    font-size: 1rem;
  }

  .slide-subitems {
    max-width: 90%;
  }

  .subitem {
    font-size: 1rem;
    gap: 0.5rem;
  }

  .subitem-number {
    min-width: 1.5rem;
  }
}

/* Hide/Show mobile elements */
@media (min-width: 769px) {
  .presentation-controls .show-mobile {
    display: none !important;
  }
}

@media (max-width: 768px) {
  .presentation-controls .hide-mobile {
    display: none !important;
  }
}
</style>
