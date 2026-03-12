<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="`/service-detail/${route.params.id}`"></ion-back-button>
        </ion-buttons>
        <ion-title>Programme</ion-title>
        <ion-buttons slot="end">
            <ion-button v-if="program && program.items.length > 0" @click="showPresentation" fill="clear" color="primary">
              <ion-icon :icon="easelOutline" />
            </ion-button>
            <ion-button v-if="program && program.items.length > 0" @click="exportProgramText" fill="clear" color="medium">
              <ion-icon :icon="downloadOutline" />
            </ion-button>
            <ion-button v-if="hasYouTubeVideos" @click="showYouTubePlaylist" fill="clear" color="danger">
              <ion-icon :icon="logoYoutube" />
            </ion-button>
            <ion-button v-if="isAdmin" @click="showSMSModal" fill="clear" color="primary">
              <ion-icon :icon="chatboxEllipsesOutline" />
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

      <!-- Draft Controls (Admin Only) -->
      <DraftModeControls
        v-if="isAdmin && program && isDraft"
        :viewer-count="program.draftViewerIds.length"
        @open-viewers="openDraftViewersModal"
        @publish="confirmPublish"
      />

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

      <div v-if="canViewProgram || !program" class="content-container">
        <!-- Edit Mode Controls (admin, published, not locked by other) -->
        <EditModeControls
          v-if="isAdmin && program && isPublished && !isLockedByOther"
          :is-editing="isEditing"
          :is-timer-warning="isTimerWarning"
          :formatted-lock-time="formattedLockTime"
          @enter="enterEditMode"
          @exit="exitEditMode"
          @extend="extendEditMode"
        />

        <!-- Lock Indicator (another user is editing, published only) -->
        <EditLockIndicator
          v-if="isPublished && isLockedByOther && lockHolder"
          :lock-holder="lockHolder"
          :is-admin="isAdmin"
          @force-enter="forceEnterEditMode"
        />

        <!-- Program Summary -->
        <ProgramSummary
          v-if="program"
          :item-count="program.items.length"
          :total-duration="totalDuration"
          :conductor="program.conductor"
          :is-editing="isEditing"
          :failed-avatars="failedAvatars"
          @edit-program="showEditProgramModal"
        />

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



        <!-- Program Items (Flat List) -->
        <div v-if="program && program.items.length > 0" class="program-content">
          <div class="flat-items-view">
            <ion-reorder-group :disabled="!isEditing" @ionItemReorder="(e) => { collapseAllEditExpanded(); handleItemReorder(e); }">
              <template v-for="(item, index) in sortedItems" :key="item.id">
              <!-- Inter-item add zone (between items, edit mode only) -->
              <div
                v-if="isEditing && index > 0"
                class="inter-item-add-zone"
                :class="{ active: activeAddZoneIndex === index }"
                @click.stop="toggleAddZone(index)"
              >
                <div v-if="activeAddZoneIndex !== index" class="add-zone-trigger">
                  <ion-icon :icon="addOutline" />
                </div>
                <div v-else class="add-zone-options">
                  <button class="add-zone-btn" @click.stop="addItemAtPosition(index)">
                    <ion-icon :icon="addOutline" />
                    Élément
                  </button>
                  <button class="add-zone-btn" @click.stop="addGroupAtPosition(index)">
                    <ion-icon :icon="removeOutline" />
                    Groupe
                  </button>
                </div>
              </div>
              <!-- Skip items in collapsed groups -->
              <ion-item
                v-if="!item.groupId || !collapsedGroupIds.has(item.groupId)"
                lines="none"
                class="program-item-wrapper"
                :class="{ 'expanded': isItemExpanded(item.id), 'is-group-header': item.isGroup, 'is-grouped-item': !!item.groupId }"
              >
              <div
                class="program-item"
              >
                <!-- Group Header rendering -->
                <div v-if="item.isGroup" class="group-header-layout">
                  <div class="group-header-content">
                    <ion-input
                      v-if="editingTitleItemId === item.id"
                      :value="item.title"
                      class="group-header-title-input"
                      autofocus
                      @ionBlur="inlineUpdateTitle(item.id, ($event.target as HTMLIonInputElement).value as string || item.title)"
                      @keydown.enter="inlineUpdateTitle(item.id, ($event.target as HTMLIonInputElement).value as string || item.title)"
                      @keydown.escape="cancelInlineTitleEdit"
                    />
                    <h4
                      v-else
                      class="group-header-title"
                      :class="{ 'editable': isEditing }"
                      @click="isEditing && startInlineTitleEdit(item.id)"
                    >
                      {{ item.title }}
                    </h4>
                  </div>
                  <div class="group-header-actions">
                    <ion-button
                      v-if="isEditing"
                      fill="clear"
                      size="small"
                      color="danger"
                      @click.stop="deleteItem(item.id)"
                    >
                      <ion-icon :icon="trashOutline" slot="icon-only" />
                    </ion-button>
                    <ion-button
                      fill="clear"
                      size="small"
                      @click.stop="toggleGroupCollapse(item.id)"
                    >
                      <ion-icon :icon="collapsedGroupIds.has(item.id) ? chevronForwardOutline : chevronDownOutline" slot="icon-only" />
                    </ion-button>
                  </div>
                </div>

                <!-- Regular item rendering -->
                <div v-else class="item-layout">
                  <!-- Order Number -->
                  <div class="item-column item-order-column">
                    <div class="item-order">{{ getItemDisplayNumber(index) }}</div>
                  </div>

                  <!-- Details -->
                  <div class="item-column item-details-column">

                    <ion-input
                      v-if="editingTitleItemId === item.id"
                      :value="item.title"
                      class="inline-title-input"
                      autofocus
                      @ionBlur="inlineUpdateTitle(item.id, ($event.target as HTMLIonInputElement).value as string || item.title)"
                      @keydown.enter="inlineUpdateTitle(item.id, ($event.target as HTMLIonInputElement).value as string || item.title)"
                      @keydown.escape="cancelInlineTitleEdit"
                    />
                    <h4
                      v-else
                      class="item-title"
                      :class="{ 'editable': isEditing }"
                      @click="isEditing && startInlineTitleEdit(item.id)"
                    >
                      {{ item.resourceId && getLinkedResource(item.resourceId) ? getLinkedResource(item.resourceId)?.title : item.title }}
                    </h4>
                    <!-- Subtitle: inline edit or display -->
                    <div v-if="inlineSubtitleItemId === item.id" class="inline-field-row">
                      <ion-input
                        :value="item.subtitle || ''"
                        placeholder="Sous-titre..."
                        class="inline-field-input"
                        autofocus
                        @ionBlur="saveInlineSubtitle(item.id, ($event.target as HTMLIonInputElement).value as string)"
                        @keydown.enter="saveInlineSubtitle(item.id, ($event.target as HTMLIonInputElement).value as string)"
                        @keydown.escape="inlineSubtitleItemId = null"
                      />
                    </div>
                    <p v-else-if="item.subtitle" class="item-subtitle" :class="{ 'editable': isEditing }" @click="isEditing && toggleInlineSubtitle(item.id)">{{ item.subtitle }}</p>

                    <p v-if="item.resourceId && getLinkedResource(item.resourceId)?.reference" class="item-reference">{{ getLinkedResource(item.resourceId)?.reference }}</p>

                    <!-- Inline meta chips (duration + participants) -->
                    <div v-if="item.duration || (item.participants && item.participants.length > 0) || item.participant" class="item-meta-chips">
                      <span
                        v-if="item.duration"
                        class="meta-chip"
                        :class="{ 'interactive': isEditing }"
                        @click="isEditing && openDurationPopover($event, item)"
                      >
                        <ion-icon :icon="timeOutline" />
                        {{ item.duration }}min
                      </span>
                      <span
                        v-for="participant in (item.participants || [])"
                        :key="participant.id"
                        class="meta-chip participant-chip"
                        :class="{ 'interactive': isEditing }"
                        @click="isEditing && openParticipantsPopover($event, item)"
                      >
                        <ion-avatar v-if="participant.avatar && !failedAvatars.has('p-' + participant.id)" class="participant-avatar-sm">
                          <img :src="participant.avatar" :alt="participant.name" @error="failedAvatars.add('p-' + participant.id)" />
                        </ion-avatar>
                        <span v-else class="participant-initials-sm">{{ getParticipantInitials(participant.name) }}</span>
                        {{ participant.name }}
                      </span>
                      <!-- Legacy single participant -->
                      <span
                        v-if="!item.participants?.length && item.participant"
                        class="meta-chip participant-chip"
                      >
                        <span class="participant-initials-sm">{{ getParticipantInitials(item.participant.name) }}</span>
                        {{ item.participant.name }}
                      </span>
                    </div>

                    <!-- Notes: inline edit or display -->
                    <div v-if="inlineNotesItemId === item.id" class="inline-field-row">
                      <textarea
                        :value="item.notes || ''"
                        placeholder="Note..."
                        class="inline-notes-textarea"
                        rows="2"
                        @blur="saveInlineNotes(item.id, ($event.target as HTMLTextAreaElement).value)"
                        @keydown.escape="inlineNotesItemId = null"
                        ref="inlineNotesRef"
                      ></textarea>
                    </div>
                    <div v-else-if="item.notes" class="item-notes" :class="{ 'editable': isEditing }" @click="isEditing && toggleInlineNotes(item.id)">
                      <ion-icon :icon="documentTextOutline" />
                      {{ item.notes }}
                    </div>

                    <!-- Quick Action Buttons (Edit mode only) -->
                    <div v-if="isEditing && !item.isGroup" class="item-quick-actions">
                      <button
                        class="quick-action-btn"
                        :class="{ 'has-value': item.participants && item.participants.length > 0 }"
                        @click.stop="openParticipantsPopover($event, item)"
                        title="Participant"
                      >
                        <ion-icon :icon="personAddOutline" />
                      </button>
                      <button
                        class="quick-action-btn"
                        :class="{ 'has-value': item.duration }"
                        @click.stop="openDurationPopover($event, item)"
                        title="Durée"
                      >
                        <ion-icon :icon="timeOutline" />
                      </button>
                      <button
                        class="quick-action-btn"
                        :class="{ 'has-value': item.subtitle }"
                        @click.stop="toggleInlineSubtitle(item.id)"
                        title="Sous-titre"
                      >
                        <ion-icon :icon="textOutline" />
                      </button>
                      <button
                        class="quick-action-btn"
                        :class="{ 'has-value': item.notes }"
                        @click.stop="toggleInlineNotes(item.id)"
                        title="Note"
                      >
                        <ion-icon :icon="chatbubbleOutline" />
                      </button>
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
                        <!-- Quick Unlink (Edit Mode) -->
                        <button
                          v-if="isEditing"
                          @click.stop="quickUnlinkResource(item.id)"
                          class="media-chip-button unlink-btn"
                          title="Délier la ressource"
                        >
                          <ion-icon :icon="closeCircleOutline" />
                        </button>
                      </div>
                      <!-- Music Properties -->
                      <div class="music-props-row">
                        <div v-if="getResourceMusicProps(item.resourceId)" class="music-props">
                          <span v-for="prop in getResourceMusicProps(item.resourceId)" :key="prop" class="music-prop">{{ prop }}</span>
                        </div>
                        <button
                          v-if="isEditing && item.resourceId"
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

                  </div>

                </div>

                <!-- Expanded Edit Card (inline editing of all fields) -->
                <div v-if="isEditing && isEditExpanded(item.id) && !item.isGroup" class="expanded-edit-card">
                  <!-- Title -->
                  <div class="expanded-field">
                    <label class="expanded-field-label">Titre</label>
                    <ion-input
                      :value="item.resourceId && getLinkedResource(item.resourceId) ? getLinkedResource(item.resourceId)?.title : item.title"
                      placeholder="Titre..."
                      class="expanded-field-input"
                      @ionBlur="inlineUpdateTitle(item.id, ($event.target as HTMLIonInputElement).value as string || item.title)"
                    />
                  </div>

                  <!-- Subtitle -->
                  <div class="expanded-field">
                    <label class="expanded-field-label">Sous-titre</label>
                    <ion-input
                      :value="item.subtitle || ''"
                      placeholder="Sous-titre..."
                      class="expanded-field-input"
                      @ionBlur="saveInlineSubtitle(item.id, ($event.target as HTMLIonInputElement).value as string)"
                    />
                  </div>

                  <!-- Participants -->
                  <div class="expanded-field">
                    <label class="expanded-field-label">Participants</label>
                    <ParticipantSelector
                      :participants="item.participants || []"
                      @update:participants="(val) => inlineUpdateParticipants(item.id, val)"
                      :service-id="serviceId"
                      :multiple="true"
                    />
                  </div>

                  <!-- Duration -->
                  <div class="expanded-field">
                    <label class="expanded-field-label">Durée (min)</label>
                    <DurationStepper
                      :model-value="item.duration || 0"
                      @update:model-value="(val) => inlineUpdateDuration(item.id, val)"
                    />
                  </div>

                  <!-- Resource Link -->
                  <div class="expanded-field expanded-field-full">
                    <label class="expanded-field-label">Ressource</label>
                    <div v-if="item.resourceId && getLinkedResource(item.resourceId)" class="expanded-resource-card">
                      <span class="expanded-resource-title">{{ getLinkedResource(item.resourceId)?.title }}</span>
                      <div class="expanded-resource-actions">
                        <ion-button size="small" fill="outline" @click="openExpandedResourceSelector(item.id)">Changer</ion-button>
                        <ion-button size="small" fill="outline" color="danger" @click="quickUnlinkResource(item.id)">Délier</ion-button>
                      </div>
                    </div>
                    <ion-button v-else fill="outline" size="small" @click="openExpandedResourceSelector(item.id)">
                      <ion-icon :icon="addOutline" slot="start" />
                      Lier une ressource
                    </ion-button>
                  </div>

                  <!-- Scripture (tucked) -->
                  <div class="expanded-field tucked-section">
                    <button class="tucked-toggle" @click="toggleTuckedSection(item.id, 'scripture')">
                      <ion-icon :icon="isTuckedOpen(item.id, 'scripture') ? chevronDownOutline : chevronForwardOutline" />
                      <span>Passage biblique</span>
                      <span v-if="item.scriptureReference" class="tucked-badge">{{ item.scriptureReference }}</span>
                    </button>
                    <div v-if="isTuckedOpen(item.id, 'scripture')" class="tucked-content">
                      <div class="scripture-input-row">
                        <ion-input
                          :value="item.scriptureReference || ''"
                          placeholder="Ex: Jean 3:16-18"
                          class="expanded-field-input"
                          @ionBlur="inlineUpdateField(item.id, 'scriptureReference', ($event.target as HTMLIonInputElement).value as string)"
                        />
                        <ion-button
                          size="small"
                          fill="outline"
                          @click="fetchScriptureForItem(item.id, item.scriptureReference || '')"
                          :disabled="!item.scriptureReference"
                        >
                          <ion-icon :icon="searchOutline" slot="icon-only" />
                        </ion-button>
                      </div>
                      <div v-if="item.scriptureText" class="expanded-scripture-preview">
                        <div class="expanded-scripture-header">
                          <span class="expanded-scripture-ref">{{ item.scriptureReference }}</span>
                          <span class="expanded-scripture-version">{{ item.scriptureVersion || 'LSG' }}</span>
                        </div>
                        <div class="expanded-scripture-text" v-html="formatScriptureWithSuperscript(item.scriptureText)"></div>
                      </div>
                    </div>
                  </div>

                  <!-- Notes -->
                  <div class="expanded-field expanded-field-full">
                    <label class="expanded-field-label">Notes</label>
                    <textarea
                      :value="item.notes || ''"
                      placeholder="Notes..."
                      class="expanded-notes-textarea"
                      rows="2"
                      @blur="saveInlineNotes(item.id, ($event.target as HTMLTextAreaElement).value)"
                    ></textarea>
                  </div>

                  <!-- Actions row -->
                  <div class="expanded-actions-row">
                    <div></div>
                    <ion-button
                      fill="outline"
                      size="small"
                      color="danger"
                      @click="deleteItem(item.id)"
                    >
                      <ion-icon :icon="trashOutline" slot="start" />
                      Supprimer
                    </ion-button>
                  </div>
                </div>

              </div>
              <!-- Start Slot: Reorder Handle -->
              <ion-reorder slot="start">
                <ion-icon :icon="reorderThreeOutline" class="drag-handle-icon" />
              </ion-reorder>
              <!-- End Slot: Expand/Collapse Chevron (not for group headers) -->
              <ion-button
                v-if="isEditing && !item.isGroup"
                slot="end"
                fill="clear"
                size="small"
                class="item-expand-btn"
                @click.stop="toggleEditExpansion(item.id)"
              >
                <ion-icon :icon="isEditExpanded(item.id) ? chevronUpOutline : chevronDownOutline" slot="icon-only" />
              </ion-button>
              </ion-item>
              </template>
            </ion-reorder-group>
          </div>

        </div>

        <!-- Inline Add Bar (always visible when program exists) -->
        <InlineAddBar
          v-if="isEditing && program"
          ref="mainAddBarRef"
          :all-resources="allResources"
          :service-id="serviceId"
          @add="handleInlineAdd"
          @link-resource="handleInlineLinkResource"
        />
      </div>

      <!-- Duration Popover -->
      <ion-popover
        :is-open="durationPopoverOpen"
        :event="durationPopoverEvent"
        @didDismiss="durationPopoverOpen = false"
      >
        <DurationStepper
          :model-value="durationPopoverValue"
          @update:model-value="handleDurationChange"
        />
      </ion-popover>

      <!-- Participants Popover -->
      <ion-popover
        :is-open="participantsPopoverOpen"
        :event="participantsPopoverEvent"
        @didDismiss="handleParticipantsPopoverDismiss"
        class="participants-popover"
      >
        <div class="popover-participants-content">
          <ParticipantSelector
            :participants="participantsPopoverValue"
            @update:participants="participantsPopoverValue = $event"
            :service-id="serviceId"
            :multiple="true"
          />
        </div>
      </ion-popover>

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

      <!-- Media Modal (for displaying lyrics, videos, etc.) -->
      <MediaDisplayModal
        :is-open="showMediaModalState"
        :content="selectedMediaContent"
        :title="selectedMediaTitle"
        @close="closeMediaModal"
      />


      <!-- YouTube Playlist Modal -->
      <YouTubePlaylistModal
        :is-open="showYouTubePlaylistModalState"
        :videos="youtubeVideos"
        @close="closeYouTubePlaylist"
      />

      <!-- Presentation Modal (PowerPoint-style 16:9 Fullscreen) -->
      <PresentationModal
        :is-open="showPresentationModalState"
        :slides="presentationSlides"
        :linked-resources="linkedResources"
        @close="closePresentation"
      />

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
      <MusicPropertiesModal
        :is-open="showMusicPropsModalState"
        :resource-id="editingResourceId"
        :initial-form="musicPropsForm"
        :music-keys="musicKeys"
        :music-beats="musicBeats"
        :music-tempos="musicTempos"
        :music-styles="musicStyles"
        @close="closeMusicPropsModal"
        @save="handleMusicPropsSave"
      />

      <!-- Draft Viewers Modal -->
      <DraftViewersModal
        :is-open="showDraftViewersModal"
        :initial-viewer-ids="draftViewerIds"
        :members="allMembers"
        :loading-members="loadingMembers"
        :failed-avatars="failedAvatars"
        @close="showDraftViewersModal = false"
        @save="handleDraftViewersSave"
      />

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

      <!-- Expanded Card Resource Selector -->
      <ResourceSelector
        :modal-only="true"
        :is-open="showExpandedResourceSelector"
        @update:is-open="(val) => { if (!val) { showExpandedResourceSelector = false; expandedResourceSelectorItemId = null; } }"
        @update:model-value="handleExpandedResourceSelect"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonCard, IonCardContent, IonLoading, IonModal, IonAvatar,
  IonItem, IonLabel, IonInput,
  IonReorderGroup, IonReorder, toastController, alertController,
  IonPopover
} from '@ionic/vue';
import {
  calendarOutline, createOutline, timeOutline,
  personOutline, documentTextOutline,
  closeOutline, musicalNoteOutline,
  reorderThreeOutline, addOutline, trashOutline,
  playCircleOutline, volumeHighOutline, documentOutline,
  chatboxEllipsesOutline, chevronDownOutline, chevronForwardOutline,
  logoYoutube,
  removeOutline, bookOutline, copyOutline,
  lockClosedOutline, chevronUpOutline,
  easelOutline, downloadOutline,
  closeCircleOutline,
  searchOutline,
  personAddOutline,
  textOutline,
  chatbubbleOutline
} from 'ionicons/icons';
import ResourceSelector from '@/components/ResourceSelector.vue';
import ResourceBottomSheet from '@/components/ResourceBottomSheet.vue';
import ParticipantSelector from '@/components/ParticipantSelector.vue';
import SendProgramSMSModal from '@/components/SendProgramSMSModal.vue';
import InlineAddBar from '@/components/InlineAddBar.vue';
import DurationStepper from '@/components/DurationStepper.vue';
import PresentationModal from '@/components/program/PresentationModal.vue';
import YouTubePlaylistModal from '@/components/program/YouTubePlaylistModal.vue';
import MediaDisplayModal from '@/components/program/MediaDisplayModal.vue';
import MusicPropertiesModal from '@/components/program/MusicPropertiesModal.vue';
import DraftViewersModal from '@/components/program/DraftViewersModal.vue';
import ProgramSummary from '@/components/program/ProgramSummary.vue';
import EditModeControls from '@/components/program/EditModeControls.vue';
import EditLockIndicator from '@/components/program/EditLockIndicator.vue';
import DraftModeControls from '@/components/program/DraftModeControls.vue';
import { useEditLock } from '@/composables/useEditLock';
import { useProgramItems } from '@/composables/useProgramItems';
import { serviceService } from '@/services/serviceService';
import { timezoneUtils } from '@/utils/timezone';
import { useUser } from '@/composables/useUser';
import {
  subscribeToProgramByServiceId,
  createProgram,
  updateProgram,
  updateItemInProgram,
  addItemToProgram,
  publishProgram,
  updateDraftViewers,
  canUserViewProgram
} from '@/firebase/programs';
import type { Service } from '@/types/service';
import type { ServiceProgram, ProgramItem, ProgramParticipant } from '@/types/program';
import type { Member } from '@/types/member';
import { membersService } from '@/firebase/members';
import type { Resource, ResourceOption } from '@/types/resource';
import { getAllResourceOptions, updateResource, subscribeToResource, getResources } from '@/firebase/resources';
import { deleteField, type Unsubscribe } from 'firebase/firestore';
import { isYouTubeUrl, getYouTubeEmbedUrl } from '@/utils/resource-utils';
import { bibleService } from '@/services/bibleService';

const route = useRoute();
const { user, isAdmin } = useUser();

// Reactive State
const failedAvatars = reactive(new Set<string>());
const loading = ref(true);
const service = ref<Service | null>(null);
const program = ref<ServiceProgram | null>(null);
const linkedResources = ref<Map<string, Resource>>(new Map());
const isReorderMode = ref(true);
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

const expandedItems = ref<Set<string>>(new Set());

// Group collapse state (default all expanded)
const collapsedGroupIds = reactive(new Set<string>());

const toggleGroupCollapse = (groupId: string) => {
  if (collapsedGroupIds.has(groupId)) {
    collapsedGroupIds.delete(groupId);
  } else {
    collapsedGroupIds.add(groupId);
  }
};

// Expand/collapse for inline editing (expandable item cards)
const expandedEditItemIds = ref<Set<string>>(new Set());

const isMobileScreen = () => window.innerWidth < 768;

const toggleEditExpansion = (itemId: string) => {
  if (expandedEditItemIds.value.has(itemId)) {
    expandedEditItemIds.value.delete(itemId);
  } else {
    // On mobile: auto-collapse others (single expand)
    if (isMobileScreen()) {
      expandedEditItemIds.value.clear();
    }
    expandedEditItemIds.value.add(itemId);
  }
  // Trigger reactivity
  expandedEditItemIds.value = new Set(expandedEditItemIds.value);
};

const isEditExpanded = (itemId: string) => expandedEditItemIds.value.has(itemId);

const collapseAllEditExpanded = () => {
  expandedEditItemIds.value = new Set();
};

// Tucked sections state (scripture, type within expanded cards)
const tuckedSections = ref<Map<string, Set<string>>>(new Map());

const toggleTuckedSection = (itemId: string, section: string) => {
  if (!tuckedSections.value.has(itemId)) {
    tuckedSections.value.set(itemId, new Set());
  }
  const sections = tuckedSections.value.get(itemId)!;
  if (sections.has(section)) {
    sections.delete(section);
  } else {
    sections.add(section);
  }
  tuckedSections.value = new Map(tuckedSections.value);
};

const isTuckedOpen = (itemId: string, section: string) => {
  return tuckedSections.value.get(itemId)?.has(section) ?? false;
};

// Scripture fetch for expanded card
const fetchScriptureForItem = async (itemId: string, reference: string) => {
  if (!reference) return;
  try {
    const result = await bibleService.getScripture(reference);
    if (!result) {
      showToast('Référence biblique non reconnue', 'warning');
      return;
    }
    await inlineUpdateField(itemId, 'scriptureReference', result.reference);
    await inlineUpdateField(itemId, 'scriptureText', result.text);
    await inlineUpdateField(itemId, 'scriptureVersion', result.version);
  } catch (error) {
    console.error('Error fetching scripture:', error);
    showToast('Erreur lors de la récupération des versets', 'danger');
  }
};

// Resource selector for expanded card
const expandedResourceSelectorItemId = ref<string | null>(null);
const showExpandedResourceSelector = ref(false);

const openExpandedResourceSelector = (itemId: string) => {
  expandedResourceSelectorItemId.value = itemId;
  showExpandedResourceSelector.value = true;
};

const handleExpandedResourceSelect = async (resourceId: string | null) => {
  if (expandedResourceSelectorItemId.value && resourceId) {
    await inlineUpdateField(expandedResourceSelectorItemId.value, 'resourceId', resourceId);
    subscribeToLinkedResource(resourceId);
  }
  showExpandedResourceSelector.value = false;
  expandedResourceSelectorItemId.value = null;
};

// Inter-item add zone
const activeAddZoneIndex = ref<number | null>(null);

const toggleAddZone = (index: number) => {
  activeAddZoneIndex.value = activeAddZoneIndex.value === index ? null : index;
};

const addItemAtPosition = async (index: number) => {
  activeAddZoneIndex.value = null;
  if (!program.value || !user.value) return;
  const sorted = sortedItems.value;
  const insertOrder = sorted[index] ? sorted[index].order : sorted[sorted.length - 1].order + 1;
  // Bump order of items at and after this position
  for (const item of program.value.items) {
    if (item.order >= insertOrder) {
      item.order += 1;
    }
  }
  try {
    await addItemToProgram(program.value.id, { order: insertOrder, title: 'Nouvel élément' } as any, user.value.uid);
  } catch (error) {
    console.error('Error adding item at position:', error);
  }
};

const addGroupAtPosition = async (index: number) => {
  activeAddZoneIndex.value = null;
  if (!program.value || !user.value) return;
  const sorted = sortedItems.value;
  const insertOrder = sorted[index] ? sorted[index].order : sorted[sorted.length - 1].order + 1;
  for (const item of program.value.items) {
    if (item.order >= insertOrder) {
      item.order += 1;
    }
  }
  try {
    const createdId = await createGroup('Nouveau groupe', insertOrder);
    if (createdId) {
      setTimeout(() => startInlineTitleEdit(createdId), 500);
    }
  } catch (error) {
    console.error('Error adding group at position:', error);
  }
};

// Title Autocomplete State (needed by composable)
const allResources = ref<Resource[]>([]);
const loadingResources = ref(false);

// Program Items composable (unified form modal + CRUD + reorder)
const {
  deleteItem,
  createGroup,
  handleItemReorder,
  editingTitleItemId, startInlineTitleEdit, cancelInlineTitleEdit, inlineUpdateTitle,
  inlineUpdateDuration, inlineUpdateParticipants,
  quickAddItem,
  inlineUpdateField,
  quickUnlinkResource
} = useProgramItems({
  program, user, expandedItems, loading,
  loadProgram: async () => { await loadProgram(); }
});

// Inline subtitle / notes editing
const inlineSubtitleItemId = ref<string | null>(null);
const inlineNotesItemId = ref<string | null>(null);

const toggleInlineSubtitle = (itemId: string) => {
  inlineSubtitleItemId.value = inlineSubtitleItemId.value === itemId ? null : itemId;
};

const toggleInlineNotes = (itemId: string) => {
  inlineNotesItemId.value = inlineNotesItemId.value === itemId ? null : itemId;
  if (inlineNotesItemId.value) {
    nextTick(() => {
      const textarea = document.querySelector('.inline-notes-textarea') as HTMLTextAreaElement | null;
      textarea?.focus();
    });
  }
};

const saveInlineSubtitle = async (itemId: string, value: string) => {
  inlineSubtitleItemId.value = null;
  await inlineUpdateField(itemId, 'subtitle', value.trim());
};

const saveInlineNotes = async (itemId: string, value: string) => {
  inlineNotesItemId.value = null;
  await inlineUpdateField(itemId, 'notes', value.trim());
};

// Media Modal
const showMediaModalState = ref(false);
const selectedMediaContent = ref<any>(null);
const selectedMediaTitle = ref('');

// SMS Modal
const showSMSModalState = ref(false);


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

// Presentation Modal (PowerPoint-style 16:9)
const showPresentationModalState = ref(false);
const presentationSlides = ref<Array<{
  type?: string;
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
  isLyricsSlide?: boolean;
  parentTitle?: string;
}>>([]);
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

// (ItemDetailSheet removed - all editing is now inline via expandable cards)

// InlineAddBar refs
const mainAddBarRef = ref<InstanceType<typeof InlineAddBar> | null>(null);

// Inline Resource Selector State
const showInlineResourceSelector = ref(false);
const showFullResourceSelector = ref(false);
const inlineResourceItemId = ref<string | null>(null);
const inlineResourceItemType = ref('');
const inlineResourceItemTitle = ref('');

// Computed Properties
const serviceId = computed(() => route.params.id as string);

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
  return program.value?.status === 'draft';
});

const isPublished = computed(() => {
  return program.value?.status === 'published';
});

// Edit Mode (via composable)
const {
  isEditing, isLockedByOther, lockHolder,
  formattedLockTime, isTimerWarning,
  enterEditMode, exitEditMode, forceEnterEditMode, extendEditMode
} = useEditLock(program, user, isAdmin, isDraft, isPublished);

const hasYouTubeVideos = computed(() => {
  if (!program.value) return false;

  // Check all items for YouTube videos
  for (const item of program.value.items) {
    if (item.resourceId) {
      const resource = getLinkedResource(item.resourceId);
      if (resource?.contents?.some(c => (c.type === 'video' || c.type === 'youtube') && c.url && isYouTubeUrl(c.url))) {
        return true;
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

// Get the display number for an item, excluding group headers from the count
const getItemDisplayNumber = (index: number): number => {
  if (!program.value) return index + 1;

  const sorted = sortedItems.value;
  let count = 0;
  for (let i = 0; i <= index; i++) {
    if (!sorted[i].isGroup) {
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

// Inline Duration Popover
const durationPopoverOpen = ref(false);
const durationPopoverEvent = ref<Event | null>(null);
const durationPopoverItemId = ref<string | null>(null);
const durationPopoverValue = ref(0);

const openDurationPopover = (event: Event, item: any) => {
  durationPopoverEvent.value = event;
  durationPopoverItemId.value = item.id;
  durationPopoverValue.value = item.duration || 0;
  durationPopoverOpen.value = true;
};

const handleDurationChange = (value: number) => {
  durationPopoverValue.value = value;
  if (durationPopoverItemId.value) {
    inlineUpdateDuration(durationPopoverItemId.value, value);
  }
};

// Inline Participants Popover
const participantsPopoverOpen = ref(false);
const participantsPopoverEvent = ref<Event | null>(null);
const participantsPopoverItemId = ref<string | null>(null);
const participantsPopoverValue = ref<ProgramParticipant[]>([]);

const openParticipantsPopover = (event: Event, item: any) => {
  participantsPopoverEvent.value = event;
  participantsPopoverItemId.value = item.id;
  participantsPopoverValue.value = [...(item.participants || [])];
  participantsPopoverOpen.value = true;
};

const handleParticipantsPopoverDismiss = () => {
  participantsPopoverOpen.value = false;
  if (participantsPopoverItemId.value && participantsPopoverValue.value) {
    inlineUpdateParticipants(participantsPopoverItemId.value, participantsPopoverValue.value);
  }
};

// Inline Add Handlers
const handleInlineAdd = async (data: { title: string, resourceId?: string }) => {
  const itemId = await quickAddItem(data.title, data.resourceId);
  if (itemId && data.resourceId) {
    subscribeToLinkedResource(data.resourceId);
  }
  if (itemId && mainAddBarRef.value) {
    mainAddBarRef.value.setLastCreatedItemId(itemId);
  }
};

const handleInlineLinkResource = async (itemId: string, resourceId: string) => {
  if (!itemId || !resourceId) return;
  await inlineUpdateField(itemId, 'resourceId', resourceId);
  subscribeToLinkedResource(resourceId);
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

  try {
    allMembers.value = await membersService.getAllMembers();
  } catch (error) {
    console.error('Error loading members:', error);
    await showToast('Erreur lors du chargement des membres', 'danger');
  } finally {
    loadingMembers.value = false;
  }
};

const handleDraftViewersSave = async (viewerIds: string[]) => {
  if (!program.value || !user.value) return;
  try {
    await updateDraftViewers(program.value.id, viewerIds, user.value.uid);
    showDraftViewersModal.value = false;
    await showToast('Accès mis à jour', 'success');
  } catch (error) {
    console.error('Error saving draft viewers:', error);
    await showToast('Erreur lors de la mise à jour des accès', 'danger');
  }
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

  }

  return videos;
};

const showYouTubePlaylist = () => {
  youtubeVideos.value = collectYouTubeVideos();
  showYouTubePlaylistModalState.value = true;
};

const closeYouTubePlaylist = () => {
  showYouTubePlaylistModalState.value = false;
};

// Presentation Functions (PowerPoint-style 16:9)

// Helper function to split lyrics into pages
// Max 8 lines per page to fit on presentation screen without scrolling
const splitLyricsIntoPages = (lyrics: string, maxLinesPerPage: number = 8): string[] => {
  if (!lyrics || lyrics.trim() === '') return [];

  // Split by double newlines (paragraphs/verses) first
  const paragraphs = lyrics.split(/\n\s*\n/).filter(p => p.trim());

  const pages: string[] = [];
  let currentPage: string[] = [];
  let currentLineCount = 0;

  for (const paragraph of paragraphs) {
    const paragraphLines = paragraph.split('\n').filter(l => l.trim());
    const paragraphLineCount = paragraphLines.length;

    // If this single paragraph exceeds maxLines, split it further
    if (paragraphLineCount > maxLinesPerPage) {
      // First, push any accumulated content
      if (currentPage.length > 0) {
        pages.push(currentPage.join('\n\n'));
        currentPage = [];
        currentLineCount = 0;
      }
      // Split large paragraph into chunks
      for (let i = 0; i < paragraphLines.length; i += maxLinesPerPage) {
        const chunk = paragraphLines.slice(i, i + maxLinesPerPage).join('\n');
        pages.push(chunk);
      }
      continue;
    }

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

// Split scripture text into individual verses
// Detects verse patterns like "1 Text..." "2 Text..." etc.
const splitScriptureIntoVerses = (text: string): string[] => {
  if (!text || text.trim() === '') return [];

  // Split on verse number patterns (number at start or after space/punctuation followed by number and space)
  // This regex looks for patterns where a number is followed by text
  const versePattern = /(?:^|\s)(\d{1,3})\s+(?=[A-ZÀ-ÿa-z])/g;

  const verses: string[] = [];
  let match;
  const matches: { index: number; verseNum: string }[] = [];

  // Find all verse number positions
  while ((match = versePattern.exec(text)) !== null) {
    matches.push({
      index: match.index === 0 ? 0 : match.index + 1, // +1 to skip the leading space
      verseNum: match[1]
    });
  }

  // If no verse numbers found, return the whole text as one verse
  if (matches.length === 0) {
    return [text.trim()];
  }

  // Extract each verse
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i < matches.length - 1 ? matches[i + 1].index : text.length;
    const verseText = text.substring(start, end).trim();
    if (verseText) {
      verses.push(verseText);
    }
  }

  return verses;
};

// Split scripture into pages (1 verse per page by default)
const splitScriptureIntoPages = (text: string, maxVersesPerPage: number = 1): string[] => {
  const verses = splitScriptureIntoVerses(text);

  if (verses.length === 0) return [text.trim()];

  const pages: string[] = [];

  for (let i = 0; i < verses.length; i += maxVersesPerPage) {
    const pageVerses = verses.slice(i, i + maxVersesPerPage);
    pages.push(pageVerses.join(' '));
  }

  return pages;
};

// Format scripture for presentation - just clean up the text
const formatScriptureForPresentation = (text: string): string => {
  if (!text) return '';
  return text.trim();
};

const collectPresentationSlides = () => {
  const slides: typeof presentationSlides.value = [];

  if (!program.value) return slides;

  let itemNumber = 0;

  for (const item of sortedItems.value) {
    const isSection = !!item.isGroup;

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

    {
      // Regular item (flat, no sub-items)
      // For items with lyrics, split into pages
      if (lyrics) {
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
      } else if (item.scriptureText) {
        // Scripture or sermon with scripture text - split into pages
        const scripturePages = splitScriptureIntoPages(item.scriptureText, 1);

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
  showPresentationModalState.value = true;
};

// Export program lyrics and scripture to text file
const exportProgramText = async () => {
  if (!program.value || !service.value) return;

  const lines: string[] = [];

  // Header
  lines.push('═'.repeat(50));
  lines.push(service.value.title.toUpperCase());
  lines.push(formatDateTime(service.value.date, service.value.time));
  lines.push('═'.repeat(50));
  lines.push('');

  // Process each item
  let itemNumber = 0;
  for (const item of sortedItems.value) {
    const isGroupHeader = !!item.isGroup;

    if (isGroupHeader) {
      // Group header
      lines.push('');
      lines.push('─'.repeat(40));
      lines.push(item.title.toUpperCase());
      lines.push('─'.repeat(40));
      lines.push('');
    } else {
      itemNumber++;

      // Get resource info if available
      let resourceTitle = '';
      let lyrics = '';
      if (item.resourceId) {
        const resource = getLinkedResource(item.resourceId);
        if (resource) {
          resourceTitle = resource.title;
          const lyricsContent = resource.contents?.find(c => c.type === 'lyrics');
          if (lyricsContent?.content) {
            lyrics = lyricsContent.content;
          }
        }
      }

      const title = resourceTitle || item.title;
      const hasContent = lyrics || item.scriptureText;

      if (hasContent) {
        lines.push(`${itemNumber}. ${title}`);
        if (item.subtitle) lines.push(`   ${item.subtitle}`);
        lines.push('');

        // Scripture passage
        if (item.scriptureReference && item.scriptureText) {
          lines.push(`   📖 ${item.scriptureReference}`);
          lines.push('');
          lines.push(item.scriptureText.split('\n').map(l => `   ${l}`).join('\n'));
          lines.push('');
        }

        // Lyrics
        if (lyrics) {
          lines.push('   🎵 Paroles:');
          lines.push('');
          lines.push(lyrics.split('\n').map(l => `   ${l}`).join('\n'));
          lines.push('');
        }

        lines.push('');
      }
    }
  }

  // Create and download the file
  const content = lines.join('\n');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  // Create filename from service title and date
  const dateStr = service.value.date ? new Date(service.value.date).toISOString().split('T')[0] : 'programme';
  const filename = `${service.value.title.replace(/[^a-zA-Z0-9À-ÿ]/g, '_')}_${dateStr}.txt`;

  // Create download link and click it
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  await showToast('Programme exporté', 'success');
};

const closePresentation = () => {
  showPresentationModalState.value = false;
  presentationSlides.value = [];
};


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

// Handle music properties save from modal
const handleMusicPropsSave = async (form: { musicKey: string; musicBeat: string; musicTempo: string; musicStyle: string }) => {
  if (!editingResourceId.value) return;
  try {
    await updateResource(editingResourceId.value, {
      musicKey: form.musicKey || undefined,
      musicBeat: form.musicBeat || undefined,
      musicTempo: form.musicTempo || undefined,
      musicStyle: form.musicStyle || undefined
    });
    await showToast('Propriétés musicales mises à jour', 'success');
    closeMusicPropsModal();
  } catch (error) {
    console.error('Error saving music properties:', error);
    await showToast('Erreur lors de la mise à jour', 'danger');
  }
};

// Lifecycle
onMounted(async () => {
  loading.value = true;
  await Promise.all([loadService(), loadMusicOptions()]);
  await loadProgram();
  loading.value = false;
  // Load resources for InlineAddBar autocomplete (non-blocking)
  loadResourcesForAutocomplete();
  // Auto-acquire lock for draft programs
  if (isAdmin.value && program.value && isDraft.value) {
    enterEditMode();
  }
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
/* Mobile Spacing Tokens */
:host,
.program-content {
  --program-item-padding-v: 1rem;
  --program-item-padding-h: 1rem;
  --program-item-gap: 1rem;
  --program-touch-target: 44px;
}

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

/* (Program Summary / Conductor styles moved to ProgramSummary component) */

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

.add-item-row {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

.add-item-button {
  min-width: 180px;
}

.add-section-button {
  --border-color: var(--ion-color-medium);
}

.reorder-button {
  --border-color: var(--ion-color-medium);
}

.done-reorder-button {
  min-width: 150px;
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
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.program-item-wrapper.expanded {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* Group Header Styles */
.program-item-wrapper.is-group-header {
  --background: var(--ion-color-primary);
  --background-hover: var(--ion-color-primary);
  margin-left: -1rem;
  margin-right: -1rem;
  border-radius: 0 !important;
  box-shadow: none !important;
  border-left: none !important;
  overflow: visible;
}

.program-item-wrapper.is-group-header::part(native) {
  background: var(--ion-color-primary);
  padding: 0;
}

.program-item-wrapper.is-group-header .program-item {
  background: var(--ion-color-primary);
  border-radius: 0;
  padding: 0.5rem 1rem;
  width: 100%;
}

.group-header-layout {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.group-header-content {
  flex: 1;
  min-width: 0;
}

.group-header-title {
  color: white;
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin: 0;
}

.group-header-title.editable {
  cursor: pointer;
}

.group-header-title-input {
  color: white;
  --color: white;
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  --placeholder-color: rgba(255, 255, 255, 0.6);
  --padding-start: 0;
  --padding-end: 0;
  --padding-top: 0;
  --padding-bottom: 0;
}

.group-header-actions {
  display: flex;
  align-items: center;
  gap: 0;
  flex-shrink: 0;
}

.group-header-actions ion-button {
  --color: rgba(255, 255, 255, 0.85);
  color: rgba(255, 255, 255, 0.85);
}

/* Grouped Item Styles (indented) */
.program-item-wrapper.is-grouped-item {
  padding-left: 1rem;
  border-left: 3px solid var(--ion-color-primary);
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
  margin: 0 0 4px 0;
  color: var(--ion-color-dark);
  line-height: 1.4;
}

.item-title.editable {
  cursor: pointer;
}

.item-title.editable:hover {
  text-decoration: underline;
  text-decoration-style: dashed;
  text-underline-offset: 2px;
  text-decoration-color: var(--ion-color-medium);
}

.inline-title-input {
  font-size: 1.1rem;
  font-weight: 600;
  --padding-start: 0;
  --padding-end: 0;
  --padding-top: 0;
  --padding-bottom: 0;
  margin: 0 0 0.25rem 0;
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

/* (Music props form styles moved to MusicPropertiesModal component) */

/* Resource Link Section (Modals) */
.resource-link-section {
  padding: 0.75rem 1rem;
}

.linked-resource-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--ion-color-light);
  border-radius: 8px;
  border: 1px solid var(--ion-color-light-shade);
}

.linked-resource-info {
  flex: 1;
  min-width: 0;
}

.linked-resource-title {
  font-weight: 600;
  font-size: 0.95rem;
  display: block;
  margin-bottom: 0.25rem;
}

.linked-resource-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
  margin-bottom: 0.25rem;
}

/* Quick Unlink Button */
.media-chip-button.unlink-btn {
  color: var(--ion-color-danger);
  opacity: 0.7;
}

.media-chip-button.unlink-btn:hover {
  opacity: 1;
  background: rgba(var(--ion-color-danger-rgb), 0.1);
}

/* Quick Action Buttons */
.item-quick-actions {
  display: flex;
  gap: 2px;
  margin-top: 6px;
}

.quick-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  color: var(--ion-color-medium);
  transition: all 0.15s;
}

.quick-action-btn:hover {
  background: var(--ion-color-light);
  color: var(--ion-color-primary);
}

.quick-action-btn:active {
  background: var(--ion-color-light-shade);
}

.quick-action-btn.has-value {
  color: var(--ion-color-primary);
}

.quick-action-btn ion-icon {
  font-size: 16px;
}

/* Inline Field Inputs */
.inline-field-row {
  margin-top: 4px;
}

.inline-field-input {
  --padding-start: 8px;
  --padding-end: 8px;
  font-size: 13px;
  border: 1px solid var(--ion-color-primary);
  border-radius: 6px;
  --background: var(--ion-background-color, #fff);
}

.inline-notes-textarea {
  width: 100%;
  padding: 6px 8px;
  font-size: 13px;
  border: 1px solid var(--ion-color-primary);
  border-radius: 6px;
  background: var(--ion-background-color, #fff);
  font-family: inherit;
  resize: vertical;
  outline: none;
  color: var(--ion-text-color);
}

.inline-notes-textarea:focus {
  border-color: var(--ion-color-primary-shade);
  box-shadow: 0 0 0 2px rgba(var(--ion-color-primary-rgb), 0.15);
}

.item-subtitle.editable,
.item-notes.editable {
  cursor: pointer;
  border-radius: 4px;
  padding: 1px 4px;
  margin: -1px -4px;
  transition: background 0.15s;
}

.item-subtitle.editable:hover,
.item-notes.editable:hover {
  background: var(--ion-color-light);
}

/* Inline Meta Chips (duration + participants inside content column) */
.item-meta-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: var(--ion-color-medium-shade);
  background: var(--ion-color-light);
  border-radius: 12px;
  padding: 2px 8px;
}

.meta-chip ion-icon {
  font-size: 14px;
}

.meta-chip.interactive {
  cursor: pointer;
  transition: background 0.15s;
}

.meta-chip.interactive:hover {
  background: var(--ion-color-light-shade);
}

.meta-chip.interactive:active {
  background: var(--ion-color-light-shade);
}

.participant-chip {
  gap: 4px;
}

.participant-avatar-sm {
  width: 18px;
  height: 18px;
}

.participant-initials-sm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--ion-color-primary-tint);
  color: var(--ion-color-primary);
  font-size: 0.6rem;
  font-weight: 600;
  flex-shrink: 0;
}

.popover-participants-content {
  padding: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.participants-popover {
  --width: 320px;
}

.action-popover {
  --width: 260px;
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

/* Program Items */
.program-item-wrapper {
  --padding-start: 0;
  --padding-end: 0;
  --inner-padding-end: 0;
  --inner-padding-start: 0;
  --background: transparent;
  --min-height: auto;
  width: 100%;
}

.program-item-wrapper::part(native) {
  padding: 0;
  align-items: center;
}

/* 3-dot action menu button */
.item-action-menu-btn {
  --padding-start: 4px;
  --padding-end: 4px;
  margin: 0;
  color: var(--ion-color-medium);
}

/* (Media Modal, Lyrics View Modal, Fullscreen Modal styles moved to child components) */

/* (Lyrics view styles moved to child components) */

/* (Scripture/Lyrics content display styles moved to child components) */

/* (YouTube Playlist Modal CSS moved to YouTubePlaylistModal component) */

/* Responsive Design */
@media (max-width: 768px) {
  /* Task 1.3 & 2.1: Override spacing tokens for mobile */
  .program-content {
    --program-item-padding-v: 12px;
    --program-item-padding-h: 16px;
    --program-item-gap: 12px;
  }

  /* Task 2.1: Item card padding using tokens */
  .program-item {
    padding: var(--program-item-padding-v) var(--program-item-padding-h);
  }

  /* Task 2.4: Ensure minimum 12px gap between item elements */
  .item-layout {
    gap: var(--program-item-gap);
  }

  .item-order-column {
    min-width: unset;
  }

  /* Task 2.4: Order badge sizing */
  .item-order {
    width: 28px;
    height: 28px;
    font-size: 0.75rem;
  }

  /* Task 2.3: Content area readability */
  .item-title {
    font-size: 0.95rem;
    line-height: 1.4;
  }

  .item-subtitle {
    line-height: 1.4;
  }

  .item-details-column {
    line-height: 1.4;
  }

  /* Task 3.1 & 3.2 & 3.3: Quick action buttons touch targets */
  .item-quick-actions {
    gap: 4px;
    flex-wrap: wrap;
  }

  .quick-action-btn {
    position: relative;
    width: 28px;
    height: 28px;
  }

  /* Expand tap target to 44px without changing visual size */
  .quick-action-btn::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: var(--program-touch-target);
    height: var(--program-touch-target);
  }

  /* Task 3.4: Metadata chip touch targets */
  .meta-chip {
    min-height: 32px;
    padding: 6px 10px;
    font-size: 0.8rem;
  }

  .meta-chip.interactive {
    /* Expand tappable area to 44px using padding trick */
    position: relative;
  }

  .meta-chip.interactive::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: var(--program-touch-target);
    min-width: 100%;
  }

  /* Task 4.1: Metadata chips horizontal scroll */
  .item-meta-chips {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    gap: 8px;
    padding-bottom: 2px;
  }

  .item-meta-chips::-webkit-scrollbar {
    display: none;
  }

  .item-meta-chips .meta-chip {
    flex-shrink: 0;
  }

  /* Task 4.2: Chip text minimum font-size */
  .meta-chip {
    font-size: 13px;
  }

  /* Task 3.5: 3-dot menu and reorder handle touch targets */
  .item-action-menu-btn {
    min-width: var(--program-touch-target);
    min-height: var(--program-touch-target);
  }

  /* Task 7.4: Expand/collapse toggle touch target */
  .expand-button {
    min-width: var(--program-touch-target);
    min-height: var(--program-touch-target);
  }

}

/* Task 1.2: Small phone breakpoint */
@media (max-width: 480px) {
  .program-content {
    --program-item-padding-v: 10px;
    --program-item-padding-h: 12px;
    --program-item-gap: 10px;
  }

  .item-order {
    width: 26px;
    height: 26px;
    font-size: 0.7rem;
  }

  .item-title {
    font-size: 0.9rem;
  }

  .item-type span {
    font-size: 0.75rem;
  }
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

/* (Edit Mode Controls, Lock Indicator, Draft Controls styles moved to child components) */

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

/* (Draft Viewers Modal styles moved to DraftViewersModal component) */

/* (Presentation Modal styles moved to PresentationModal component) */

/* (YouTube Playlist Modal styles moved to YouTubePlaylistModal component) */

/* (Slide/Presentation/YouTube CSS moved to child components) */

/* ========================================
   Expanded Edit Card
   ======================================== */
.expanded-edit-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid var(--ion-color-light-shade);
  margin-top: 8px;
}

.expanded-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.expanded-field-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--ion-color-medium-shade);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.expanded-field-input {
  --background: var(--ion-color-light);
  --border-radius: 8px;
  --padding-start: 10px;
  --padding-end: 10px;
  font-size: 14px;
}

.expanded-notes-textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--ion-color-light-shade);
  border-radius: 8px;
  background: var(--ion-color-light);
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 48px;
}

.expanded-notes-textarea:focus {
  outline: none;
  border-color: var(--ion-color-primary);
}

/* Resource card in expanded view */
.expanded-resource-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: var(--ion-color-light);
  border-radius: 8px;
  border: 1px solid var(--ion-color-light-shade);
}

.expanded-resource-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--ion-color-dark);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.expanded-resource-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

/* Tucked sections */
.tucked-section {
  gap: 0;
}

.tucked-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 0;
  border: none;
  background: none;
  color: var(--ion-color-medium-shade);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  width: 100%;
  text-align: left;
}

.tucked-toggle ion-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.tucked-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: var(--ion-color-medium);
  background: var(--ion-color-light);
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: auto;
}

.tucked-badge ion-icon {
  font-size: 12px;
}

.tucked-content {
  padding: 8px 0 4px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Scripture in expanded card */
.scripture-input-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.scripture-input-row ion-input {
  flex: 1;
}

.expanded-scripture-preview {
  padding: 10px;
  background: var(--ion-color-light);
  border-radius: 8px;
  border-left: 3px solid var(--ion-color-primary);
}

.expanded-scripture-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.expanded-scripture-ref {
  font-weight: 600;
  font-size: 12px;
  color: var(--ion-color-dark);
}

.expanded-scripture-version {
  font-size: 10px;
  color: var(--ion-color-medium);
  background: var(--ion-color-light-shade);
  padding: 1px 5px;
  border-radius: 4px;
}

.expanded-scripture-text {
  font-size: 13px;
  line-height: 1.5;
  color: var(--ion-color-dark);
}

.expanded-scripture-text :deep(sup) {
  color: var(--ion-color-primary);
  font-weight: 600;
  font-size: 10px;
  margin-right: 2px;
}

/* Type grid in expanded card */
.expanded-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 6px;
}

.expanded-type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 4px;
  border: 1px solid var(--ion-color-light-shade);
  border-radius: 8px;
  background: var(--ion-color-light);
  cursor: pointer;
  font-size: 10px;
  color: var(--ion-color-dark);
  transition: all 0.15s;
}

.expanded-type-btn ion-icon {
  font-size: 16px;
  color: var(--ion-color-medium);
}

.expanded-type-btn.active {
  border-color: var(--ion-color-primary);
  background: var(--ion-color-primary-tint);
}

.expanded-type-btn.active ion-icon {
  color: var(--ion-color-primary);
}

/* Actions row */
.expanded-actions-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding-top: 4px;
}

/* Expand button */
.item-expand-btn {
  --color: var(--ion-color-medium);
  --padding-start: 4px;
  --padding-end: 4px;
  min-width: 32px;
}

/* Inter-item add zone */
.inter-item-add-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 8px;
  margin: 0 16px;
  position: relative;
  cursor: pointer;
  transition: height 0.2s;
}

.inter-item-add-zone:hover,
.inter-item-add-zone.active {
  height: 36px;
}

.add-zone-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px dashed var(--ion-color-medium-tint);
  background: var(--ion-background-color, #fff);
  color: var(--ion-color-medium);
  font-size: 14px;
  opacity: 0.4;
  transition: all 0.2s;
}

.inter-item-add-zone:hover .add-zone-trigger {
  opacity: 1;
  border-color: var(--ion-color-primary);
  color: var(--ion-color-primary);
}

.add-zone-options {
  display: flex;
  gap: 8px;
}

.add-zone-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 16px;
  border: 1px solid var(--ion-color-light-shade);
  background: var(--ion-background-color, #fff);
  font-size: 12px;
  color: var(--ion-color-dark);
  cursor: pointer;
  transition: all 0.15s;
}

.add-zone-btn:hover {
  background: var(--ion-color-primary-tint);
  border-color: var(--ion-color-primary);
}

.add-zone-btn ion-icon {
  font-size: 14px;
}

/* Desktop 2-column layout for expanded cards */
@media (min-width: 768px) {
  .expanded-edit-card {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .expanded-edit-card .expanded-actions-row {
    grid-column: 1 / -1;
  }

  .expanded-edit-card .tucked-section {
    grid-column: 1 / -1;
  }

  .expanded-edit-card > .expanded-field-full {
    grid-column: 1 / -1;
  }
}

</style>
