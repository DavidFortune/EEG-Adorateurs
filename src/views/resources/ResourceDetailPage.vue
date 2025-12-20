<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/resources"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ resource?.title || 'Détail de la ressource' }}</ion-title>
        <ion-buttons slot="end" v-if="isAdmin && resource">
          <ion-button @click="editResource" fill="clear">
            <ion-icon :icon="pencilOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content :fullscreen="true">
      <ion-loading :is-open="loading" message="Chargement..."></ion-loading>
      
      <div v-if="resource" class="resource-detail">
        <!-- Resource Header -->
        <div class="resource-header">
          <h1>{{ resource.title }}</h1>

          <!-- Resource Collection -->
          <div v-if="resourceCollection" class="collections">
            <ion-chip color="primary">
              <ion-icon :icon="folderOutline" />
              <ion-label>{{ resourceCollection.name }}</ion-label>
            </ion-chip>
          </div>
          
          <!-- Tags -->
          <div v-if="resource.tags && resource.tags.length > 0" class="tags">
            <ion-chip v-for="tag in resource.tags" :key="tag" color="medium" outline>
              <ion-label>{{ tag }}</ion-label>
            </ion-chip>
          </div>
          
          <!-- Metadata -->
          <div class="metadata">
            <span class="meta-item">
              <ion-icon :icon="calendarOutline" />
              Créé le {{ formatDate(resource.createdAt) }}
            </span>
            <span v-if="resource.viewCount" class="meta-item">
              <ion-icon :icon="eyeOutline" />
              {{ resource.viewCount }} vue{{ resource.viewCount > 1 ? 's' : '' }}
            </span>
          </div>

          <!-- Notes -->
          <div v-if="resource.notes" class="resource-notes">
            <ion-card>
              <ion-card-header>
                <ion-card-subtitle>
                  <ion-icon :icon="documentTextOutline" />
                  Notes
                </ion-card-subtitle>
              </ion-card-header>
              <ion-card-content>
                <p class="notes-text">{{ resource.notes }}</p>
              </ion-card-content>
            </ion-card>
          </div>

          <!-- Music Properties Display (for all users) -->
          <div v-if="hasMusicProperties" class="music-properties-display">
            <ion-chip v-if="resource.musicKey" color="tertiary" outline>
              <ion-label>{{ getMusicOptionName(resource.musicKey, musicKeys) }}</ion-label>
            </ion-chip>
            <ion-chip v-if="resource.musicBeat" color="tertiary" outline>
              <ion-label>{{ getMusicOptionName(resource.musicBeat, musicBeats) }}</ion-label>
            </ion-chip>
            <ion-chip v-if="resource.musicTempo" color="tertiary" outline>
              <ion-label>{{ getMusicOptionName(resource.musicTempo, musicTempos) }}</ion-label>
            </ion-chip>
            <ion-chip v-if="resource.musicStyle" color="tertiary" outline>
              <ion-label>{{ getMusicOptionName(resource.musicStyle, musicStyles) }}</ion-label>
            </ion-chip>
          </div>
        </div>

        <!-- Add Media Actions (Admin only) -->
        <div v-if="isAdmin" class="add-media-section">
          <h4>Ajouter un média</h4>
          <div class="add-media-buttons">
            <ion-button fill="outline" size="small" @click="addMediaFromUrl">
              <ion-icon :icon="linkOutline" slot="start" />
              Lien URL
            </ion-button>
            <ion-button fill="outline" size="small" @click="addMediaFromFile">
              <ion-icon :icon="cloudUploadOutline" slot="start" />
              Téléverser
            </ion-button>
            <ion-button fill="outline" size="small" @click="addMediaFromAudioRecording">
              <ion-icon :icon="micOutline" slot="start" />
              Enregistrer audio
            </ion-button>
            <ion-button fill="outline" size="small" @click="addMediaFromVideoRecording">
              <ion-icon :icon="videocamOutline" slot="start" />
              Enregistrer vidéo
            </ion-button>
          </div>
        </div>

        <!-- Resource Contents - Media List -->
        <div class="resource-contents">
          <!-- Media Items (excluding lyrics) -->
          <div v-if="mediaContents.length > 0" class="media-list">
            <div v-for="(content, index) in mediaContents" :key="`media-${index}`" class="media-list-item">

              <!-- Video: YouTube -->
              <template v-if="(content.type === ResourceTypeEnum.VIDEO || content.type === ResourceTypeEnum.YOUTUBE) && content.url && isYouTubeUrl(content.url)">
                <div class="youtube-card">
                  <div class="card-main" @click="openYouTubePlayer(content.url!, content.notes || 'Vidéo YouTube')">
                    <div class="youtube-icon">
                      <ion-icon :icon="logoYoutube" />
                    </div>
                    <div class="youtube-info">
                      <span class="youtube-title">{{ content.notes || 'Vidéo YouTube' }}</span>
                      <div class="media-meta">
                        <span v-if="content.createdAt">{{ formatShortDate(content.createdAt) }}</span>
                        <span class="meta-separator">•</span>
                        <span>YouTube</span>
                      </div>
                    </div>
                    <ion-icon :icon="playCircleOutline" class="youtube-play-icon" />
                  </div>
                  <div v-if="isAdmin" class="media-actions">
                    <ion-button fill="clear" color="primary" size="small" @click.stop="openEditMediaModal(index)">
                      <ion-icon :icon="pencilOutline" slot="icon-only" />
                    </ion-button>
                    <ion-button fill="clear" color="danger" size="small" @click.stop="confirmDeleteMedia(index)">
                      <ion-icon :icon="trashOutline" slot="icon-only" />
                    </ion-button>
                  </div>
                </div>
              </template>

              <!-- Video: Recorded -->
              <template v-else-if="content.type === ResourceTypeEnum.VIDEO && content.url">
                <div class="video-card">
                  <div class="card-main" @click="openVideoPlayer(content.url!, getVideoTitle(content, index))">
                    <div class="video-icon">
                      <ion-icon :icon="filmOutline" />
                    </div>
                    <div class="video-info">
                      <span class="video-title">{{ getVideoTitle(content, index) }}</span>
                      <div class="media-meta">
                        <span v-if="content.createdAt">{{ formatShortDate(content.createdAt) }}</span>
                        <span class="meta-separator">•</span>
                        <span>{{ getMediaTypeLabel(content) }}</span>
                        <template v-if="content.duration">
                          <span class="meta-separator">•</span>
                          <span>{{ formatDuration(content.duration) }}</span>
                        </template>
                        <template v-else-if="content.fileSize">
                          <span class="meta-separator">•</span>
                          <span>{{ formatFileSize(content.fileSize) }}</span>
                        </template>
                      </div>
                    </div>
                  </div>
                  <div v-if="isAdmin" class="media-actions">
                    <ion-button fill="clear" color="primary" size="small" @click.stop="openEditMediaModal(index)">
                      <ion-icon :icon="pencilOutline" slot="icon-only" />
                    </ion-button>
                    <ion-button fill="clear" color="danger" size="small" @click.stop="confirmDeleteMedia(index)">
                      <ion-icon :icon="trashOutline" slot="icon-only" />
                    </ion-button>
                  </div>
                </div>
              </template>

              <!-- Audio -->
              <template v-else-if="content.type === ResourceTypeEnum.AUDIO && content.url">
                <div class="audio-card">
                  <div class="card-main" @click="openAudioPlayer(content.url!, getAudioTitle(content, index))">
                    <div class="audio-icon">
                      <ion-icon :icon="playCircleOutline" />
                    </div>
                    <div class="audio-info">
                      <span class="audio-title">{{ getAudioTitle(content, index) }}</span>
                      <div class="media-meta">
                        <span v-if="content.createdAt">{{ formatShortDate(content.createdAt) }}</span>
                        <span class="meta-separator">•</span>
                        <span>{{ getMediaTypeLabel(content) }}</span>
                        <template v-if="content.duration">
                          <span class="meta-separator">•</span>
                          <span>{{ formatDuration(content.duration) }}</span>
                        </template>
                        <template v-else-if="content.fileSize">
                          <span class="meta-separator">•</span>
                          <span>{{ formatFileSize(content.fileSize) }}</span>
                        </template>
                      </div>
                    </div>
                  </div>
                  <div v-if="isAdmin" class="media-actions">
                    <ion-button fill="clear" color="primary" size="small" @click.stop="openEditMediaModal(index)">
                      <ion-icon :icon="pencilOutline" slot="icon-only" />
                    </ion-button>
                    <ion-button fill="clear" color="danger" size="small" @click.stop="confirmDeleteMedia(index)">
                      <ion-icon :icon="trashOutline" slot="icon-only" />
                    </ion-button>
                  </div>
                </div>
              </template>

              <!-- Spotify -->
              <template v-else-if="content.type === ResourceTypeEnum.SPOTIFY && content.url">
                <div class="spotify-card">
                  <div class="media-item-content">
                    <iframe
                      :src="getSpotifyEmbedUrl(content.url) || ''"
                      width="100%"
                      height="152"
                      frameborder="0"
                      allowtransparency="true"
                      allow="encrypted-media"
                      class="spotify-player"
                    ></iframe>
                  </div>
                  <div v-if="isAdmin" class="media-actions spotify-actions">
                    <ion-button fill="clear" color="primary" size="small" @click.stop="openEditMediaModal(index)">
                      <ion-icon :icon="pencilOutline" slot="icon-only" />
                    </ion-button>
                    <ion-button fill="clear" color="danger" size="small" @click.stop="confirmDeleteMedia(index)">
                      <ion-icon :icon="trashOutline" slot="icon-only" />
                    </ion-button>
                  </div>
                </div>
              </template>

              <!-- Music Sheet -->
              <template v-else-if="content.type === ResourceTypeEnum.MUSIC_SHEET">
                <div class="music-sheet-card">
                  <div class="music-sheet-icon">
                    <ion-icon :icon="musicalNotesOutline" />
                  </div>
                  <div class="music-sheet-info">
                    <span class="music-sheet-title">{{ content.notes || 'Partition' }}</span>
                    <div class="media-meta">
                      <span v-if="content.createdAt">{{ formatShortDate(content.createdAt) }}</span>
                      <span class="meta-separator">•</span>
                      <span>{{ getMediaTypeLabel(content) }}</span>
                      <template v-if="content.fileSize">
                        <span class="meta-separator">•</span>
                        <span>{{ formatFileSize(content.fileSize) }}</span>
                      </template>
                    </div>
                  </div>
                  <div class="music-sheet-actions-inline">
                    <ion-button
                      v-if="content.url && isPdfFile(content.url)"
                      @click="openPdfViewer(content.url)"
                      fill="clear"
                      size="small"
                    >
                      <ion-icon :icon="eyeOutline" slot="icon-only" />
                    </ion-button>
                    <ion-button
                      v-if="content.url"
                      :href="content.url"
                      target="_blank"
                      fill="clear"
                      size="small"
                      download=""
                    >
                      <ion-icon :icon="downloadOutline" slot="icon-only" />
                    </ion-button>
                    <ion-button v-if="isAdmin" fill="clear" color="primary" size="small" @click.stop="openEditMediaModal(index)">
                      <ion-icon :icon="pencilOutline" slot="icon-only" />
                    </ion-button>
                    <ion-button v-if="isAdmin" fill="clear" color="danger" size="small" @click.stop="confirmDeleteMedia(index)">
                      <ion-icon :icon="trashOutline" slot="icon-only" />
                    </ion-button>
                  </div>
                </div>
              </template>

              <!-- File (downloadable) -->
              <template v-else-if="content.type === ResourceTypeEnum.FILE && content.url && isDownloadableUrl(content.url)">
                <div class="file-card">
                  <div class="file-icon">
                    <ion-icon :icon="documentOutline" />
                  </div>
                  <div class="file-info">
                    <span class="file-title">{{ content.notes || 'Fichier' }}</span>
                    <div class="media-meta">
                      <span v-if="content.createdAt">{{ formatShortDate(content.createdAt) }}</span>
                      <span class="meta-separator">•</span>
                      <span>{{ getMediaTypeLabel(content) }}</span>
                      <template v-if="content.fileSize">
                        <span class="meta-separator">•</span>
                        <span>{{ formatFileSize(content.fileSize) }}</span>
                      </template>
                    </div>
                  </div>
                  <div class="file-actions-inline">
                    <ion-button
                      :href="content.url"
                      target="_blank"
                      fill="clear"
                      size="small"
                      download=""
                    >
                      <ion-icon :icon="downloadOutline" slot="icon-only" />
                    </ion-button>
                    <ion-button v-if="isAdmin" fill="clear" color="primary" size="small" @click.stop="openEditMediaModal(index)">
                      <ion-icon :icon="pencilOutline" slot="icon-only" />
                    </ion-button>
                    <ion-button v-if="isAdmin" fill="clear" color="danger" size="small" @click.stop="confirmDeleteMedia(index)">
                      <ion-icon :icon="trashOutline" slot="icon-only" />
                    </ion-button>
                  </div>
                </div>
              </template>

              <!-- External Link -->
              <template v-else-if="content.type === ResourceTypeEnum.FILE && content.url">
                <div class="link-card-wrapper">
                  <a :href="content.url" target="_blank" rel="noopener noreferrer" class="link-card">
                    <div class="link-icon">
                      <ion-icon :icon="globeOutline" />
                    </div>
                    <div class="link-info">
                      <span class="link-title">{{ content.notes || 'Lien externe' }}</span>
                      <div class="media-meta">
                        <span v-if="content.createdAt">{{ formatShortDate(content.createdAt) }}</span>
                        <span class="meta-separator">•</span>
                        <span>{{ getDisplayUrl(content.url) }}</span>
                      </div>
                    </div>
                    <ion-icon :icon="openOutline" class="link-open-icon" />
                  </a>
                  <div v-if="isAdmin" class="media-actions link-actions">
                    <ion-button fill="clear" color="primary" size="small" @click.stop="openEditMediaModal(index)">
                      <ion-icon :icon="pencilOutline" slot="icon-only" />
                    </ion-button>
                    <ion-button fill="clear" color="danger" size="small" @click.stop="confirmDeleteMedia(index)">
                      <ion-icon :icon="trashOutline" slot="icon-only" />
                    </ion-button>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- Lyrics Section (at the end) -->
          <div class="lyrics-section">
            <div class="lyrics-header-row">
              <h3 class="lyrics-header">
                <ion-icon :icon="documentTextOutline" />
                Paroles
              </h3>
              <div v-if="isAdmin && lyricsContents.length > 0" class="lyrics-header-actions">
                <ion-button fill="clear" color="primary" size="small" @click.stop="openEditLyricsModal(0)">
                  <ion-icon :icon="pencilOutline" slot="icon-only" />
                </ion-button>
                <ion-button fill="clear" color="danger" size="small" @click.stop="confirmDeleteLyrics(0)">
                  <ion-icon :icon="trashOutline" slot="icon-only" />
                </ion-button>
              </div>
            </div>
            <template v-if="lyricsContents.length > 0">
              <div v-for="(content, index) in lyricsContents" :key="`lyrics-${index}`" class="lyrics-item">
                <div v-if="content.notes" class="lyrics-notes">
                  <ion-chip color="medium" outline>
                    <ion-label>{{ content.notes }}</ion-label>
                  </ion-chip>
                </div>
                <pre class="lyrics-text">{{ content.content }}</pre>
              </div>
            </template>
            <template v-else>
              <div v-if="isAdmin" class="add-lyrics-container">
                <ion-button fill="outline" color="primary" @click="openAddLyricsModal">
                  <ion-icon :icon="addOutline" slot="start" />
                  Ajouter des paroles
                </ion-button>
              </div>
              <p v-else class="no-lyrics-text">Aucune parole ajoutée</p>
            </template>
          </div>
        </div>

        <!-- Admin Actions -->
        <div v-if="isAdmin" class="admin-actions">
          <ion-button @click="editResource" expand="block" color="primary">
            <ion-icon :icon="pencilOutline" slot="start" />
            Modifier cette ressource
          </ion-button>
          
          <ion-button @click="confirmDelete" expand="block" color="danger" fill="outline">
            <ion-icon :icon="trashOutline" slot="start" />
            Supprimer cette ressource
          </ion-button>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-else-if="!loading" class="empty-state ion-text-center ion-padding">
        <ion-icon :icon="alertCircleOutline" size="large" color="warning" />
        <h2>Ressource non trouvée</h2>
        <p>La ressource demandée n'existe pas ou a été supprimée.</p>
        <ion-button @click="goBack" fill="outline">
          Retour aux ressources
        </ion-button>
      </div>
    </ion-content>

    <!-- PDF Viewer Modal -->
    <PdfViewer
      :is-open="!!currentPdfUrl"
      :pdf-url="currentPdfUrl"
      :title="resource?.title || 'Partition'"
      @close="closePdfViewer"
    />

    <!-- Audio Recorder Modal -->
    <AudioRecorderModal
      :is-open="showAudioRecorder"
      :resource-id="resource?.id || ''"
      :resource-title="resource?.title || ''"
      @close="showAudioRecorder = false"
      @saved="handleAudioSaved"
    />

    <!-- Audio Player Modal -->
    <AudioPlayerModal
      :is-open="showAudioPlayer"
      :audio-url="currentAudioUrl"
      :title="currentAudioTitle"
      @close="closeAudioPlayer"
    />

    <!-- Video Recorder Modal -->
    <VideoRecorderModal
      :is-open="showVideoRecorder"
      :resource-id="resource?.id || ''"
      :resource-title="resource?.title || ''"
      @close="showVideoRecorder = false"
      @saved="handleVideoSaved"
    />

    <!-- Video Player Modal -->
    <VideoPlayerModal
      :is-open="showVideoPlayer"
      :video-url="currentVideoUrl"
      :title="currentVideoTitle"
      @close="closeVideoPlayer"
    />

    <!-- YouTube Player Modal -->
    <ion-modal :is-open="showYouTubePlayer" @didDismiss="closeYouTubePlayer">
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button @click="closeYouTubePlayer">
              <ion-icon :icon="closeOutline" />
            </ion-button>
          </ion-buttons>
          <ion-title>{{ currentYouTubeTitle }}</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content class="youtube-modal-content">
        <div class="youtube-player-container">
          <iframe
            v-if="showYouTubePlayer && currentYouTubeUrl"
            :src="getYouTubeEmbedUrl(currentYouTubeUrl) || ''"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            class="youtube-player-frame"
          ></iframe>
        </div>
      </ion-content>
    </ion-modal>

    <!-- Add Media Modal -->
    <ion-modal :is-open="showAddMediaModal" @didDismiss="closeAddMediaModal">
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button @click="closeAddMediaModal">
              <ion-icon :icon="closeOutline" />
            </ion-button>
          </ion-buttons>
          <ion-title>Ajouter un média</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <!-- Mode Selector -->
        <ion-segment :value="addMediaMode" @ionChange="(e: CustomEvent) => addMediaMode = e.detail.value">
          <ion-segment-button value="url">
            <ion-icon :icon="linkOutline" />
            <ion-label>Lien URL</ion-label>
          </ion-segment-button>
          <ion-segment-button value="youtube">
            <ion-icon :icon="logoYoutube" />
            <ion-label>YouTube</ion-label>
          </ion-segment-button>
        </ion-segment>

        <!-- URL Mode -->
        <div v-if="addMediaMode === 'url'" class="add-media-form">
          <ion-item>
            <ion-label position="stacked">URL</ion-label>
            <ion-input
              v-model="mediaUrlInput"
              type="url"
              placeholder="https://..."
              @keyup.enter="handleUrlSubmit"
            ></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Nom (optionnel)</ion-label>
            <ion-input
              v-model="mediaNameInput"
              type="text"
              placeholder="Laisser vide pour auto-détecter"
            ></ion-input>
          </ion-item>
          <ion-button expand="block" @click="handleUrlSubmit" :disabled="!mediaUrlInput.trim()" class="ion-margin-top">
            Ajouter
          </ion-button>
        </div>

        <!-- YouTube Mode -->
        <div v-if="addMediaMode === 'youtube'" class="youtube-search-form">
          <ion-item>
            <ion-label position="stacked">Rechercher sur YouTube</ion-label>
            <ion-input
              v-model="youtubeSearchQuery"
              type="text"
              placeholder="Ex: Amazing Grace worship"
              @keyup.enter="searchYouTube"
            ></ion-input>
            <ion-button slot="end" @click="searchYouTube" :disabled="!youtubeSearchQuery.trim() || youtubeSearchLoading" fill="clear">
              <ion-icon :icon="searchOutline" v-if="!youtubeSearchLoading" />
              <ion-spinner v-if="youtubeSearchLoading" name="crescent" />
            </ion-button>
          </ion-item>

          <!-- YouTube Results -->
          <div v-if="youtubeSearchResults.length > 0" class="youtube-results">
            <div
              v-for="result in youtubeSearchResults"
              :key="result.id"
              class="youtube-result-item"
              :class="{ selected: selectedYouTubeResult?.id === result.id }"
              @click="selectYouTubeResult(result)"
            >
              <div class="result-thumbnail">
                <img :src="result.thumbnail" :alt="result.title" />
                <div class="play-overlay">
                  <ion-icon :icon="playCircleOutline" />
                </div>
              </div>
              <div class="result-info">
                <span class="result-title">{{ result.title }}</span>
                <span class="result-channel">{{ result.channel }}</span>
              </div>
              <ion-icon
                v-if="selectedYouTubeResult?.id === result.id"
                :icon="checkmarkCircle"
                color="primary"
                class="selection-icon"
              />
            </div>
          </div>

          <!-- No Results -->
          <div v-if="youtubeSearchPerformed && youtubeSearchResults.length === 0 && !youtubeSearchLoading" class="no-results">
            <ion-icon :icon="searchOutline" />
            <p>Aucun résultat trouvé</p>
          </div>

          <!-- Selected Video Actions -->
          <div v-if="selectedYouTubeResult" class="youtube-selected-section">
            <ion-item>
              <ion-label position="stacked">Nom (optionnel)</ion-label>
              <ion-input
                v-model="mediaNameInput"
                type="text"
                :placeholder="selectedYouTubeResult.title"
              ></ion-input>
            </ion-item>
            <ion-button expand="block" @click="addSelectedYouTubeVideo" color="primary" class="ion-margin-top">
              <ion-icon :icon="checkmarkCircle" slot="start" />
              Ajouter cette vidéo
            </ion-button>
          </div>
        </div>
      </ion-content>
    </ion-modal>

    <!-- Upload File Modal -->
    <ion-modal :is-open="showUploadModal" @didDismiss="closeUploadModal">
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button @click="closeUploadModal">
              <ion-icon :icon="closeOutline" />
            </ion-button>
          </ion-buttons>
          <ion-title>Téléverser un fichier</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <div class="upload-form">
          <!-- File Input -->
          <div class="file-input-section">
            <label class="file-input-label">
              <ion-icon :icon="cloudUploadOutline" />
              <span v-if="!selectedUploadFile">Sélectionner un fichier</span>
              <span v-else>{{ selectedUploadFile.name }}</span>
              <input
                type="file"
                accept="audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                @change="onUploadFileSelected"
                class="hidden-file-input"
              />
            </label>
            <p class="file-hint">Audio, vidéo, PDF, documents...</p>
          </div>

          <!-- File Preview -->
          <div v-if="selectedUploadFile" class="file-preview">
            <ion-card>
              <ion-card-content>
                <div class="preview-info">
                  <ion-icon :icon="documentOutline" class="preview-icon" />
                  <div class="preview-details">
                    <span class="preview-name">{{ selectedUploadFile.name }}</span>
                    <span class="preview-size">{{ formatFileSize(selectedUploadFile.size) }}</span>
                    <ion-chip :color="getMediaTypeColor(detectMediaTypeFromFile(selectedUploadFile))" outline>
                      <ion-label>{{ getContentLabel(detectMediaTypeFromFile(selectedUploadFile)) }}</ion-label>
                    </ion-chip>
                  </div>
                </div>
              </ion-card-content>
            </ion-card>
          </div>

          <!-- Name Input -->
          <ion-item v-if="selectedUploadFile">
            <ion-label position="stacked">Nom (optionnel)</ion-label>
            <ion-input
              v-model="uploadFileName"
              type="text"
              :placeholder="selectedUploadFile?.name.replace(/\.[^/.]+$/, '') || 'Nom du fichier'"
            ></ion-input>
          </ion-item>

          <!-- Upload Button -->
          <ion-button
            expand="block"
            @click="handleFileUpload"
            :disabled="!selectedUploadFile || uploadProgress"
            class="ion-margin-top"
          >
            <ion-spinner v-if="uploadProgress" name="crescent" slot="start" />
            <ion-icon v-else :icon="cloudUploadOutline" slot="start" />
            {{ uploadProgress ? 'Téléversement...' : 'Téléverser' }}
          </ion-button>
        </div>
      </ion-content>
    </ion-modal>

    <!-- Edit Media Modal (for notes/name) -->
    <ion-modal :is-open="showEditMediaModal" @didDismiss="closeEditMediaModal">
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button @click="closeEditMediaModal">
              <ion-icon :icon="closeOutline" />
            </ion-button>
          </ion-buttons>
          <ion-title>Modifier le média</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="saveEditMedia" :disabled="savingMedia" color="primary">
              <ion-spinner v-if="savingMedia" name="crescent" />
              <span v-else>Enregistrer</span>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <ion-item>
          <ion-label position="stacked">Nom / Notes</ion-label>
          <ion-input
            v-model="editMediaForm.notes"
            type="text"
            placeholder="Nom ou description du média"
          ></ion-input>
        </ion-item>
      </ion-content>
    </ion-modal>

    <!-- Edit/Add Lyrics Modal -->
    <ion-modal :is-open="showEditLyricsModal" @didDismiss="closeEditLyricsModal">
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button @click="closeEditLyricsModal">
              <ion-icon :icon="closeOutline" />
            </ion-button>
          </ion-buttons>
          <ion-title>{{ isAddingLyrics ? 'Ajouter des paroles' : 'Modifier les paroles' }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="saveEditLyrics" :disabled="savingLyrics" color="primary">
              <ion-spinner v-if="savingLyrics" name="crescent" />
              <span v-else>Enregistrer</span>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <ion-item>
          <ion-label position="stacked">Titre / Notes</ion-label>
          <ion-input
            v-model="editLyricsForm.notes"
            type="text"
            placeholder="Titre des paroles (optionnel)"
          ></ion-input>
        </ion-item>
        <ion-item class="lyrics-textarea-item">
          <ion-label position="stacked">Paroles</ion-label>
          <textarea
            v-model="editLyricsForm.content"
            class="lyrics-textarea"
            rows="15"
            placeholder="Contenu des paroles..."
          ></textarea>
        </ion-item>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonChip, IonLabel, IonLoading, IonModal, IonInput, IonSpinner,
  IonCard, IonCardHeader, IonCardSubtitle, IonCardContent, IonItem,
  IonSegment, IonSegmentButton,
  alertController, toastController
} from '@ionic/vue';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '@/firebase/config';
import PdfViewer from '@/components/PdfViewer.vue';
import AudioRecorderModal from '@/components/AudioRecorderModal.vue';
import AudioPlayerModal from '@/components/AudioPlayerModal.vue';
import VideoRecorderModal from '@/components/VideoRecorderModal.vue';
import VideoPlayerModal from '@/components/VideoPlayerModal.vue';
import {
  pencilOutline, folderOutline, calendarOutline, eyeOutline,
  downloadOutline, trashOutline, alertCircleOutline,
  musicalNotesOutline, linkOutline, cloudUploadOutline, micOutline, videocamOutline,
  playCircleOutline, filmOutline, closeOutline, documentTextOutline, documentOutline,
  globeOutline, openOutline, searchOutline, logoYoutube, checkmarkCircle, addOutline
} from 'ionicons/icons';
import { formatFileSize, isYouTubeUrl, getYouTubeEmbedUrl, isPdfFile, getSpotifyEmbedUrl, detectMediaTypeFromUrl, getSuggestedNameFromUrl, getContentLabel } from '@/utils/resource-utils';
import { Resource, ResourceCollection, ResourceType, ResourceMedia, ResourceOption } from '@/types/resource';
import { getResourceById, deleteResource, getResourceCollections, updateResource, subscribeToResource, getAllResourceOptions } from '@/firebase/resources';
import { useUser } from '@/composables/useUser';

const route = useRoute();
const router = useRouter();
const { isAdmin } = useUser();

const resource = ref<Resource | null>(null);
const collections = ref<ResourceCollection[]>([]);
const loading = ref(true);
const currentPdfUrl = ref<string>('');

// Real-time subscription unsubscribe function
let unsubscribeResource: (() => void) | null = null;

// Audio recorder modal state
const showAudioRecorder = ref(false);

// Audio player modal state
const showAudioPlayer = ref(false);
const currentAudioUrl = ref('');
const currentAudioTitle = ref('');

// Video recorder modal state
const showVideoRecorder = ref(false);

// Video player modal state
const showVideoPlayer = ref(false);
const currentVideoUrl = ref('');
const currentVideoTitle = ref('');

// YouTube player modal state
const showYouTubePlayer = ref(false);
const currentYouTubeUrl = ref('');
const currentYouTubeTitle = ref('');

// Add media URL modal state
const showAddMediaModal = ref(false);
const addMediaMode = ref<'url' | 'youtube'>('url');
const mediaUrlInput = ref('');
const mediaNameInput = ref('');

// YouTube search state
interface YouTubeSearchResult {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  videoUrl: string;
}
const youtubeSearchQuery = ref('');
const youtubeSearchResults = ref<YouTubeSearchResult[]>([]);
const youtubeSearchLoading = ref(false);
const youtubeSearchPerformed = ref(false);
const selectedYouTubeResult = ref<YouTubeSearchResult | null>(null);

// File upload modal state
const showUploadModal = ref(false);
const selectedUploadFile = ref<File | null>(null);
const uploadFileName = ref('');
const uploadProgress = ref(false);

// Edit media modal state
const showEditMediaModal = ref(false);
const editingMediaIndex = ref<number | null>(null);
const editMediaForm = ref({ notes: '' });
const savingMedia = ref(false);

// Edit/Add lyrics modal state
const showEditLyricsModal = ref(false);
const editingLyricsIndex = ref<number | null>(null);
const isAddingLyrics = ref(false);
const editLyricsForm = ref({ notes: '', content: '' });
const savingLyrics = ref(false);

// Make enum available in template
const ResourceTypeEnum = ResourceType;

// Music options state
const musicKeys = ref<ResourceOption[]>([]);
const musicBeats = ref<ResourceOption[]>([]);
const musicTempos = ref<ResourceOption[]>([]);
const musicStyles = ref<ResourceOption[]>([]);
const loadingOptions = ref(false);

// Check if resource has any music properties set
const hasMusicProperties = computed(() => {
  if (!resource.value) return false;
  return !!(resource.value.musicKey || resource.value.musicBeat || resource.value.musicTempo || resource.value.musicStyle);
});

const resourceCollection = computed(() => {
  if (!resource.value || !collections.value.length || !resource.value.collectionId) return null;
  return collections.value.find(c => c.id === resource.value!.collectionId) || null;
});

// Media contents (everything except lyrics)
const mediaContents = computed(() => {
  if (!resource.value) return [];
  return resource.value.contents
    .filter(content => content.type !== ResourceType.LYRICS)
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA; // Newest first
    });
});

// Lyrics contents (shown separately at the end)
const lyricsContents = computed(() => {
  if (!resource.value) return [];
  return resource.value.contents.filter(content => content.type === ResourceType.LYRICS);
});

const setupResourceSubscription = (resourceId: string) => {
  // Clean up previous subscription if exists
  if (unsubscribeResource) {
    unsubscribeResource();
    unsubscribeResource = null;
  }

  // Set up real-time subscription
  unsubscribeResource = subscribeToResource(
    resourceId,
    (updatedResource) => {
      resource.value = updatedResource;
      loading.value = false;
    },
    (error) => {
      console.error('Error in resource subscription:', error);
      loading.value = false;
    }
  );
};

const loadResourceOptions = async () => {
  loadingOptions.value = true;
  try {
    const options = await getAllResourceOptions();
    musicKeys.value = options.musicKeys;
    musicBeats.value = options.musicBeats;
    musicTempos.value = options.musicTempos;
    musicStyles.value = options.musicStyles;
  } catch (error) {
    console.error('Error loading resource options:', error);
  } finally {
    loadingOptions.value = false;
  }
};

const loadResource = async () => {
  const id = route.params.id as string;
  loading.value = true;

  try {
    // Load collections and resource options in parallel
    const [collectionsData] = await Promise.all([
      getResourceCollections(),
      loadResourceOptions()
    ]);
    collections.value = collectionsData;

    // Initial fetch to increment view count
    await getResourceById(id);

    // Set up real-time subscription for the resource
    setupResourceSubscription(id);
  } catch (error) {
    console.error('Error loading resource:', error);
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};


const editResource = () => {
  router.push(`/resource-form/${resource.value?.id}`);
};

const confirmDelete = async () => {
  const alert = await alertController.create({
    header: 'Confirmer la suppression',
    message: 'Êtes-vous sûr de vouloir supprimer cette ressource ? Cette action est irréversible.',
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel'
      },
      {
        text: 'Supprimer',
        role: 'destructive',
        handler: async () => {
          if (resource.value) {
            try {
              await deleteResource(resource.value.id);
              router.push('/resources');
            } catch (error) {
              console.error('Error deleting resource:', error);
            }
          }
        }
      }
    ]
  });
  
  await alert.present();
};


const openPdfViewer = (url: string) => {
  currentPdfUrl.value = url;
};

const closePdfViewer = () => {
  currentPdfUrl.value = '';
};


const goBack = () => {
  router.push('/resources');
};

// Get display name for music option
const getMusicOptionName = (optionId: string | undefined, options: ResourceOption[]): string => {
  if (!optionId) return '';
  const option = options.find(o => o.id === optionId);
  return option?.name || optionId;
};

// Add media from URL - opens modal
const addMediaFromUrl = () => {
  // Reset modal state
  addMediaMode.value = 'url';
  mediaUrlInput.value = '';
  mediaNameInput.value = '';
  youtubeSearchQuery.value = '';
  youtubeSearchResults.value = [];
  youtubeSearchPerformed.value = false;
  selectedYouTubeResult.value = null;
  showAddMediaModal.value = true;
};

// Close add media modal
const closeAddMediaModal = () => {
  showAddMediaModal.value = false;
};

// Handle URL submission from modal
const handleUrlSubmit = async () => {
  if (!mediaUrlInput.value.trim()) {
    const toast = await toastController.create({
      message: 'Veuillez entrer une URL',
      duration: 2000,
      color: 'warning'
    });
    await toast.present();
    return;
  }

  const url = mediaUrlInput.value.trim();

  // Validate URL format
  try {
    new URL(url);
  } catch {
    const toast = await toastController.create({
      message: 'URL invalide',
      duration: 2000,
      color: 'danger'
    });
    await toast.present();
    return;
  }

  // Detect media type
  const mediaType = detectMediaTypeFromUrl(url);

  // Get name or suggest one
  const name = mediaNameInput.value.trim() || getSuggestedNameFromUrl(url, mediaType);

  // Save the media
  await saveMediaFromUrl(url, mediaType, name);
  closeAddMediaModal();
};

// YouTube search function
const searchYouTube = async () => {
  if (!youtubeSearchQuery.value.trim()) return;

  youtubeSearchLoading.value = true;
  youtubeSearchPerformed.value = true;

  try {
    const functions = getFunctions(app);
    const searchYouTubeFn = httpsCallable(functions, 'searchYouTube');
    const result = await searchYouTubeFn({ query: youtubeSearchQuery.value });
    const data = result.data as { results: YouTubeSearchResult[] };
    youtubeSearchResults.value = data.results || [];
  } catch (error) {
    console.error('Error searching YouTube:', error);
    const toast = await toastController.create({
      message: 'Erreur lors de la recherche YouTube',
      duration: 3000,
      color: 'danger'
    });
    await toast.present();
    youtubeSearchResults.value = [];
  } finally {
    youtubeSearchLoading.value = false;
  }
};

// Select YouTube result
const selectYouTubeResult = (result: YouTubeSearchResult) => {
  if (selectedYouTubeResult.value?.id === result.id) {
    selectedYouTubeResult.value = null;
  } else {
    selectedYouTubeResult.value = result;
  }
};

// Add selected YouTube video
const addSelectedYouTubeVideo = async () => {
  if (!selectedYouTubeResult.value) return;

  const video = selectedYouTubeResult.value;
  const name = mediaNameInput.value.trim() || video.title;

  await saveMediaFromUrl(video.videoUrl, ResourceType.YOUTUBE, name);
  closeAddMediaModal();
};

// Save media from URL to resource
const saveMediaFromUrl = async (url: string, type: ResourceType, name: string) => {
  if (!resource.value) return;

  try {
    // Create new media entry
    const newMedia: ResourceMedia = {
      type: type,
      url: url,
      notes: name,
      createdAt: new Date().toISOString()
    };

    // Add to existing contents
    const updatedContents = [...resource.value.contents, newMedia];

    // Update resource in Firebase
    await updateResource(resource.value.id, { contents: updatedContents });

    // Show success toast with detected type
    const typeLabel = getContentLabel(type);
    const toast = await toastController.create({
      message: `${typeLabel} ajouté avec succès`,
      duration: 2000,
      color: 'success'
    });
    await toast.present();
  } catch (error) {
    console.error('Error saving media from URL:', error);
    const toast = await toastController.create({
      message: 'Erreur lors de l\'ajout du média',
      duration: 2000,
      color: 'danger'
    });
    await toast.present();
  }
};

// Open file upload modal
const addMediaFromFile = () => {
  selectedUploadFile.value = null;
  uploadFileName.value = '';
  uploadProgress.value = false;
  showUploadModal.value = true;
};

// Close upload modal
const closeUploadModal = () => {
  showUploadModal.value = false;
  selectedUploadFile.value = null;
  uploadFileName.value = '';
};

// Handle file selection
const onUploadFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    selectedUploadFile.value = target.files[0];
    // Suggest name from filename (without extension)
    const fileName = target.files[0].name;
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    uploadFileName.value = nameWithoutExt;
  }
};

// Get color for media type
const getMediaTypeColor = (type: ResourceType): string => {
  switch (type) {
    case ResourceType.AUDIO:
      return 'primary';
    case ResourceType.VIDEO:
    case ResourceType.YOUTUBE:
      return 'danger';
    case ResourceType.MUSIC_SHEET:
      return 'tertiary';
    case ResourceType.SPOTIFY:
      return 'success';
    default:
      return 'medium';
  }
};

// Detect media type from file
const detectMediaTypeFromFile = (file: File): ResourceType => {
  const mimeType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  // Check by MIME type first
  if (mimeType.startsWith('audio/')) {
    return ResourceType.AUDIO;
  }
  if (mimeType.startsWith('video/')) {
    return ResourceType.VIDEO;
  }
  if (mimeType === 'application/pdf') {
    return ResourceType.MUSIC_SHEET;
  }

  // Fallback to extension check
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.wma'];
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.wmv', '.flv', '.m4v'];
  const pdfExtensions = ['.pdf'];

  if (audioExtensions.some(ext => fileName.endsWith(ext))) {
    return ResourceType.AUDIO;
  }
  if (videoExtensions.some(ext => fileName.endsWith(ext))) {
    return ResourceType.VIDEO;
  }
  if (pdfExtensions.some(ext => fileName.endsWith(ext))) {
    return ResourceType.MUSIC_SHEET;
  }

  // Default to FILE
  return ResourceType.FILE;
};

// Upload file to Firebase Storage
const uploadFileToStorage = async (file: File, mediaType: ResourceType): Promise<string> => {
  const { user } = useUser();

  if (!user.value?.uid) {
    throw new Error('User must be authenticated to upload files');
  }

  const storage = getStorage();

  // Determine folder based on content type
  let folder = 'files';
  if (mediaType === ResourceType.AUDIO) {
    folder = 'audio';
  } else if (mediaType === ResourceType.VIDEO) {
    folder = 'media';
  } else if (mediaType === ResourceType.MUSIC_SHEET) {
    folder = 'files';
  }

  const filename = `${folder}/${Date.now()}_${file.name}`;
  const fileRef = storageRef(storage, filename);

  // Add metadata
  const metadata = {
    customMetadata: {
      uploadedBy: user.value.uid,
      originalName: file.name,
      uploadDate: new Date().toISOString()
    }
  };

  const snapshot = await uploadBytes(fileRef, file, metadata);
  return await getDownloadURL(snapshot.ref);
};

// Handle file upload submission
const handleFileUpload = async () => {
  if (!selectedUploadFile.value || !resource.value) return;

  uploadProgress.value = true;

  try {
    const file = selectedUploadFile.value;
    const mediaType = detectMediaTypeFromFile(file);

    // Upload to storage
    const downloadUrl = await uploadFileToStorage(file, mediaType);

    // Get name
    const name = uploadFileName.value.trim() || file.name.replace(/\.[^/.]+$/, '');

    // Create new media entry
    const newMedia: ResourceMedia = {
      type: mediaType,
      url: downloadUrl,
      notes: name,
      mimeType: file.type,
      fileSize: file.size,
      createdAt: new Date().toISOString()
    };

    // Add to existing contents
    const updatedContents = [...resource.value.contents, newMedia];

    // Update resource in Firebase
    await updateResource(resource.value.id, { contents: updatedContents });

    // Show success toast
    const typeLabel = getContentLabel(mediaType);
    const toast = await toastController.create({
      message: `${typeLabel} téléversé avec succès`,
      duration: 2000,
      color: 'success'
    });
    await toast.present();

    closeUploadModal();
  } catch (error) {
    console.error('Error uploading file:', error);
    const toast = await toastController.create({
      message: 'Erreur lors du téléversement',
      duration: 2000,
      color: 'danger'
    });
    await toast.present();
  } finally {
    uploadProgress.value = false;
  }
};

const addMediaFromAudioRecording = () => {
  showAudioRecorder.value = true;
};

const addMediaFromVideoRecording = () => {
  showVideoRecorder.value = true;
};

// Handle audio recording saved
const handleAudioSaved = async (data: { url: string; name: string; duration: number; mimeType: string; createdAt: string }) => {
  if (!resource.value) return;

  try {
    // Create new audio media with timestamp
    const newAudioMedia: ResourceMedia = {
      type: ResourceType.AUDIO,
      url: data.url,
      notes: data.name,
      duration: data.duration,
      mimeType: data.mimeType,
      createdAt: data.createdAt
    };

    // Add to existing contents
    const updatedContents = [...resource.value.contents, newAudioMedia];

    // Update resource in Firebase - real-time subscription will auto-update the UI
    await updateResource(resource.value.id, { contents: updatedContents });
  } catch (error) {
    console.error('Error saving audio to resource:', error);
  }
};

// Audio player functions
const openAudioPlayer = (url: string, title: string) => {
  currentAudioUrl.value = url;
  currentAudioTitle.value = title;
  showAudioPlayer.value = true;
};

const closeAudioPlayer = () => {
  showAudioPlayer.value = false;
  currentAudioUrl.value = '';
  currentAudioTitle.value = '';
};

// Handle video recording saved
const handleVideoSaved = async (data: { url: string; name: string; duration: number; mimeType: string; createdAt: string }) => {
  if (!resource.value) return;

  try {
    // Create new video media with timestamp
    const newVideoMedia: ResourceMedia = {
      type: ResourceType.VIDEO,
      url: data.url,
      notes: data.name,
      duration: data.duration,
      mimeType: data.mimeType,
      createdAt: data.createdAt
    };

    // Add to existing contents
    const updatedContents = [...resource.value.contents, newVideoMedia];

    // Update resource in Firebase - real-time subscription will auto-update the UI
    await updateResource(resource.value.id, { contents: updatedContents });
  } catch (error) {
    console.error('Error saving video to resource:', error);
  }
};

// Video player functions
const openVideoPlayer = (url: string, title: string) => {
  currentVideoUrl.value = url;
  currentVideoTitle.value = title;
  showVideoPlayer.value = true;
};

const closeVideoPlayer = () => {
  showVideoPlayer.value = false;
  currentVideoUrl.value = '';
  currentVideoTitle.value = '';
};

// YouTube player functions
const openYouTubePlayer = (url: string, title: string) => {
  currentYouTubeUrl.value = url;
  currentYouTubeTitle.value = title;
  showYouTubePlayer.value = true;
};

const closeYouTubePlayer = () => {
  showYouTubePlayer.value = false;
  currentYouTubeUrl.value = '';
  currentYouTubeTitle.value = '';
};

// Get video title from notes or generate default
const getVideoTitle = (content: ResourceMedia, index: number): string => {
  if (content.notes) return content.notes;
  return `Vidéo ${index + 1}`;
};

// Get audio title from notes or generate default
const getAudioTitle = (content: ResourceMedia, index: number): string => {
  if (content.notes) return content.notes;
  return `Audio ${index + 1}`;
};

// Format duration for display
const formatDuration = (seconds?: number): string => {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Check if URL is a downloadable file (has a file extension)
const isDownloadableUrl = (url: string): boolean => {
  const fileExtensions = [
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.zip', '.rar', '.7z', '.tar', '.gz',
    '.mp3', '.wav', '.ogg', '.m4a', '.flac',
    '.mp4', '.mov', '.avi', '.mkv', '.webm',
    '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp',
    '.txt', '.csv', '.json', '.xml'
  ];
  const lowerUrl = url.toLowerCase();
  return fileExtensions.some(ext => lowerUrl.includes(ext));
};

// Get a display-friendly version of URL
const getDisplayUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    // Return just the hostname for cleaner display
    return urlObj.hostname.replace('www.', '');
  } catch {
    // If URL is invalid, return truncated version
    return url.length > 40 ? url.substring(0, 40) + '...' : url;
  }
};

// Get media type label for display
const getMediaTypeLabel = (content: ResourceMedia): string => {
  // First try to get extension from URL
  if (content.url) {
    try {
      const urlObj = new URL(content.url);
      const pathname = urlObj.pathname;
      const match = pathname.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
      if (match && match[1]) {
        return match[1].toUpperCase();
      }
    } catch {
      // Ignore URL parsing errors
    }
  }

  // Fall back to MIME type
  if (content.mimeType) {
    const mimeMap: Record<string, string> = {
      'audio/mpeg': 'MP3',
      'audio/mp3': 'MP3',
      'audio/wav': 'WAV',
      'audio/ogg': 'OGG',
      'audio/webm': 'WEBM',
      'audio/m4a': 'M4A',
      'audio/x-m4a': 'M4A',
      'video/mp4': 'MP4',
      'video/webm': 'WEBM',
      'video/quicktime': 'MOV',
      'application/pdf': 'PDF',
    };
    if (mimeMap[content.mimeType]) {
      return mimeMap[content.mimeType];
    }
    // Extract subtype from mime (e.g., "audio/mpeg" -> "MPEG")
    const parts = content.mimeType.split('/');
    if (parts[1]) {
      return parts[1].toUpperCase();
    }
  }

  // Fall back to type label
  return getContentLabel(content.type);
};

// Format short date for metadata display
const formatShortDate = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  // Check if date is valid
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('fr-CA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

// Edit media modal functions
const openEditMediaModal = (mediaIndex: number) => {
  const media = mediaContents.value[mediaIndex];
  editingMediaIndex.value = mediaIndex;
  editMediaForm.value.notes = media.notes || '';
  showEditMediaModal.value = true;
};

const closeEditMediaModal = () => {
  showEditMediaModal.value = false;
  editingMediaIndex.value = null;
  editMediaForm.value.notes = '';
};

const saveEditMedia = async () => {
  if (!resource.value || editingMediaIndex.value === null) return;

  savingMedia.value = true;
  try {
    // Get the actual media item from the sorted/filtered mediaContents
    const mediaToEdit = mediaContents.value[editingMediaIndex.value];

    // Find its index in the original contents array
    const originalIndex = resource.value.contents.findIndex(
      (c) => c === mediaToEdit || (c.url === mediaToEdit.url && c.type === mediaToEdit.type && c.createdAt === mediaToEdit.createdAt)
    );

    if (originalIndex === -1) {
      throw new Error('Media not found in contents');
    }

    // Create new contents array with the updated media
    const updatedContents = [...resource.value.contents];
    updatedContents[originalIndex] = {
      ...updatedContents[originalIndex],
      notes: editMediaForm.value.notes
    };

    // Update resource in Firebase
    await updateResource(resource.value.id, { contents: updatedContents });

    const toast = await toastController.create({
      message: 'Média modifié',
      duration: 2000,
      color: 'success'
    });
    await toast.present();
    closeEditMediaModal();
  } catch (error) {
    console.error('Error updating media:', error);
    const toast = await toastController.create({
      message: 'Erreur lors de la modification',
      duration: 2000,
      color: 'danger'
    });
    await toast.present();
  } finally {
    savingMedia.value = false;
  }
};

// Edit/Add lyrics modal functions
const openEditLyricsModal = (lyricsIndex: number) => {
  const lyrics = lyricsContents.value[lyricsIndex];
  editingLyricsIndex.value = lyricsIndex;
  isAddingLyrics.value = false;
  editLyricsForm.value.notes = lyrics.notes || '';
  editLyricsForm.value.content = lyrics.content || '';
  showEditLyricsModal.value = true;
};

const openAddLyricsModal = () => {
  editingLyricsIndex.value = null;
  isAddingLyrics.value = true;
  editLyricsForm.value.notes = '';
  editLyricsForm.value.content = '';
  showEditLyricsModal.value = true;
};

const closeEditLyricsModal = () => {
  showEditLyricsModal.value = false;
  editingLyricsIndex.value = null;
  isAddingLyrics.value = false;
  editLyricsForm.value.notes = '';
  editLyricsForm.value.content = '';
};

const saveEditLyrics = async () => {
  if (!resource.value) return;
  if (!isAddingLyrics.value && editingLyricsIndex.value === null) return;

  savingLyrics.value = true;
  try {
    const updatedContents = [...resource.value.contents];

    if (isAddingLyrics.value) {
      // Adding new lyrics
      const newLyrics: ResourceMedia = {
        type: ResourceType.LYRICS,
        notes: editLyricsForm.value.notes,
        content: editLyricsForm.value.content,
        createdAt: new Date().toISOString()
      };
      updatedContents.push(newLyrics);
    } else {
      // Editing existing lyrics
      const lyricsToEdit = lyricsContents.value[editingLyricsIndex.value!];

      // Find its index in the original contents array
      const originalIndex = resource.value.contents.findIndex(
        (c) => c === lyricsToEdit || (c.content === lyricsToEdit.content && c.type === lyricsToEdit.type)
      );

      if (originalIndex === -1) {
        throw new Error('Lyrics not found in contents');
      }

      updatedContents[originalIndex] = {
        ...updatedContents[originalIndex],
        notes: editLyricsForm.value.notes,
        content: editLyricsForm.value.content
      };
    }

    // Update resource in Firebase
    await updateResource(resource.value.id, { contents: updatedContents });

    const toast = await toastController.create({
      message: isAddingLyrics.value ? 'Paroles ajoutées' : 'Paroles modifiées',
      duration: 2000,
      color: 'success'
    });
    await toast.present();
    closeEditLyricsModal();
  } catch (error) {
    console.error('Error saving lyrics:', error);
    const toast = await toastController.create({
      message: isAddingLyrics.value ? 'Erreur lors de l\'ajout' : 'Erreur lors de la modification',
      duration: 2000,
      color: 'danger'
    });
    await toast.present();
  } finally {
    savingLyrics.value = false;
  }
};

// Delete media - uses mediaContents index which is sorted/filtered from original contents
const confirmDeleteMedia = async (mediaIndex: number) => {
  const media = mediaContents.value[mediaIndex];
  const mediaName = media.notes || getContentLabel(media.type);

  const alert = await alertController.create({
    header: 'Supprimer le média',
    message: `Êtes-vous sûr de vouloir supprimer "${mediaName}" ?`,
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel'
      },
      {
        text: 'Supprimer',
        role: 'destructive',
        handler: () => deleteMedia(mediaIndex)
      }
    ]
  });

  await alert.present();
};

const deleteMedia = async (mediaIndex: number) => {
  if (!resource.value) return;

  try {
    // Get the actual media item from the sorted/filtered mediaContents
    const mediaToDelete = mediaContents.value[mediaIndex];

    // Find its index in the original contents array
    const originalIndex = resource.value.contents.findIndex(
      (c) => c === mediaToDelete || (c.url === mediaToDelete.url && c.type === mediaToDelete.type && c.createdAt === mediaToDelete.createdAt)
    );

    if (originalIndex === -1) {
      throw new Error('Media not found in contents');
    }

    // Create new contents array without the deleted media
    const updatedContents = [...resource.value.contents];
    updatedContents.splice(originalIndex, 1);

    // Update resource in Firebase
    await updateResource(resource.value.id, { contents: updatedContents });

    const toast = await toastController.create({
      message: 'Média supprimé',
      duration: 2000,
      color: 'success'
    });
    await toast.present();
  } catch (error) {
    console.error('Error deleting media:', error);
    const toast = await toastController.create({
      message: 'Erreur lors de la suppression',
      duration: 2000,
      color: 'danger'
    });
    await toast.present();
  }
};

// Delete lyrics - uses lyricsContents index
const confirmDeleteLyrics = async (lyricsIndex: number) => {
  const lyrics = lyricsContents.value[lyricsIndex];
  const lyricsName = lyrics.notes || 'Paroles';

  const alert = await alertController.create({
    header: 'Supprimer les paroles',
    message: `Êtes-vous sûr de vouloir supprimer "${lyricsName}" ?`,
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel'
      },
      {
        text: 'Supprimer',
        role: 'destructive',
        handler: () => deleteLyrics(lyricsIndex)
      }
    ]
  });

  await alert.present();
};

const deleteLyrics = async (lyricsIndex: number) => {
  if (!resource.value) return;

  try {
    // Get the actual lyrics item from the filtered lyricsContents
    const lyricsToDelete = lyricsContents.value[lyricsIndex];

    // Find its index in the original contents array
    const originalIndex = resource.value.contents.findIndex(
      (c) => c === lyricsToDelete || (c.content === lyricsToDelete.content && c.type === lyricsToDelete.type)
    );

    if (originalIndex === -1) {
      throw new Error('Lyrics not found in contents');
    }

    // Create new contents array without the deleted lyrics
    const updatedContents = [...resource.value.contents];
    updatedContents.splice(originalIndex, 1);

    // Update resource in Firebase
    await updateResource(resource.value.id, { contents: updatedContents });

    const toast = await toastController.create({
      message: 'Paroles supprimées',
      duration: 2000,
      color: 'success'
    });
    await toast.present();
  } catch (error) {
    console.error('Error deleting lyrics:', error);
    const toast = await toastController.create({
      message: 'Erreur lors de la suppression',
      duration: 2000,
      color: 'danger'
    });
    await toast.present();
  }
};

// Initialize on mount
onMounted(() => {
  loadResource();
});

// Clean up subscription on unmount
onUnmounted(() => {
  if (unsubscribeResource) {
    unsubscribeResource();
    unsubscribeResource = null;
  }
});
</script>

<style scoped>
.resource-detail {
  padding: 1rem;
}

.resource-header {
  margin-bottom: 2rem;
}

.resource-header h1 {
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
}

.description {
  color: var(--ion-color-medium);
  margin-bottom: 1rem;
}

.collections, .tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--ion-color-medium);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.resource-contents {
  margin-bottom: 2rem;
}

.content-display {
  margin-top: 1rem;
  min-height: 200px;
}

.content-item {
  margin-bottom: 1.5rem;
}

.lyrics-content pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
  background: var(--ion-color-light);
  padding: 1rem;
  border-radius: 8px;
}

.video-player {
  width: 100%;
  max-width: 100%;
  border-radius: 8px;
}

/* Audio card styles */
.audio-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.audio-item {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.audio-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--ion-color-light);
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

.audio-card:hover {
  background: var(--ion-color-light-shade);
}

.audio-card:active {
  transform: scale(0.98);
}

.audio-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--ion-color-primary);
  border-radius: 50%;
  flex-shrink: 0;
}

.audio-icon ion-icon {
  font-size: 1.75rem;
  color: white;
}

.audio-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.audio-title {
  font-size: 1rem;
  font-weight: 500;
  color: var(--ion-color-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Video card styles */
.video-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.video-item {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.video-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--ion-color-light);
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

.video-card:hover {
  background: var(--ion-color-light-shade);
}

.video-card:active {
  transform: scale(0.98);
}

.video-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--ion-color-danger);
  border-radius: 50%;
  flex-shrink: 0;
}

.video-icon ion-icon {
  font-size: 1.75rem;
  color: white;
}

.video-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.video-title {
  font-size: 1rem;
  font-weight: 500;
  color: var(--ion-color-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* YouTube card */
.youtube-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--ion-color-light);
  border-radius: 12px;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

.youtube-card:hover {
  background: var(--ion-color-light-shade);
}

.youtube-card:active {
  transform: scale(0.98);
}

.youtube-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: #ff0000;
  border-radius: 50%;
  flex-shrink: 0;
}

.youtube-icon ion-icon {
  font-size: 1.75rem;
  color: white;
}

.youtube-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.youtube-title {
  font-size: 1rem;
  font-weight: 500;
  color: var(--ion-color-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.youtube-play-icon {
  font-size: 1.5rem;
  color: var(--ion-color-medium);
  flex-shrink: 0;
}

/* YouTube Modal */
.youtube-modal-content {
  --background: #000;
}

.youtube-player-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.youtube-player-frame {
  width: 100%;
  max-width: 100%;
  aspect-ratio: 16/9;
}

.spotify-player {
  width: 100%;
  max-width: 100%;
  border-radius: 12px;
  margin-top: 1rem;
}

.chart-preview {
  margin-top: 1rem;
  background: var(--ion-color-light);
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
}

.admin-actions {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--ion-color-light-shade);
}

.admin-actions ion-button {
  margin-bottom: 0.5rem;
}

.empty-state {
  margin-top: 2rem;
}

.empty-state ion-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.content-notes {
  margin-bottom: 1rem;
}

.content-notes ion-card {
  background: var(--ion-color-light);
  border-left: 4px solid var(--ion-color-primary);
}

.content-item {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--ion-color-light-shade);
}

.content-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.music-sheet-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.add-media-section {
  margin-bottom: 1.5rem;
}

.add-media-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: var(--ion-color-medium-shade);
}

.add-media-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.add-media-buttons ion-button {
  --border-radius: 8px;
}

/* Music properties styles */
.music-properties-display {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

/* Resource notes styles */
.resource-notes {
  margin-top: 1rem;
}

.resource-notes ion-card {
  margin: 0;
  background: var(--ion-color-light);
  border-left: 4px solid var(--ion-color-primary);
}

.resource-notes ion-card-subtitle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.resource-notes ion-card-subtitle ion-icon {
  font-size: 1rem;
}

.resource-notes .notes-text {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.6;
}

/* Media list styles */
.media-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.media-list-item {
  width: 100%;
}

.media-item-content {
  width: 100%;
}

/* Unified media metadata row */
.media-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  margin-top: 0.25rem;
}

.meta-separator {
  color: var(--ion-color-medium-tint);
}

/* Music sheet card */
.music-sheet-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--ion-color-light);
  border-radius: 12px;
}

.music-sheet-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--ion-color-tertiary);
  border-radius: 50%;
  flex-shrink: 0;
}

.music-sheet-icon ion-icon {
  font-size: 1.75rem;
  color: white;
}

.music-sheet-info {
  flex: 1;
  min-width: 0;
}

.music-sheet-title {
  font-size: 1rem;
  font-weight: 500;
  color: var(--ion-color-dark);
}

.music-sheet-actions-inline {
  display: flex;
  gap: 0.25rem;
}

/* File card */
.file-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--ion-color-light);
  border-radius: 12px;
}

.file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--ion-color-medium);
  border-radius: 50%;
  flex-shrink: 0;
}

.file-icon ion-icon {
  font-size: 1.75rem;
  color: white;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-title {
  font-size: 1rem;
  font-weight: 500;
  color: var(--ion-color-dark);
}

/* Link card */
.link-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--ion-color-light);
  border-radius: 12px;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

.link-card:hover {
  background: var(--ion-color-light-shade);
}

.link-card:active {
  transform: scale(0.98);
}

.link-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--ion-color-secondary);
  border-radius: 50%;
  flex-shrink: 0;
}

.link-icon ion-icon {
  font-size: 1.75rem;
  color: white;
}

.link-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.link-title {
  font-size: 1rem;
  font-weight: 500;
  color: var(--ion-color-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.link-open-icon {
  font-size: 1.25rem;
  color: var(--ion-color-medium);
  flex-shrink: 0;
}

/* Lyrics section */
.lyrics-section {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--ion-color-light-shade);
}

.lyrics-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.lyrics-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1.25rem;
  color: var(--ion-color-dark);
}

.lyrics-header ion-icon {
  font-size: 1.25rem;
  color: var(--ion-color-primary);
}

.lyrics-header-actions {
  display: flex;
  gap: 0.25rem;
}

.lyrics-header-actions ion-button {
  --padding-start: 8px;
  --padding-end: 8px;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.lyrics-header-actions ion-button:hover {
  opacity: 1;
}

.no-lyrics-text {
  color: var(--ion-color-medium);
  font-style: italic;
  margin: 0;
}

.add-lyrics-container {
  text-align: center;
  padding: 1rem 0;
}

.lyrics-item {
  margin-bottom: 1.5rem;
}

.lyrics-item:last-child {
  margin-bottom: 0;
}

.lyrics-notes {
  margin-bottom: 0.75rem;
}

.lyrics-text {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
  background: var(--ion-color-light);
  padding: 1rem;
  border-radius: 8px;
  margin: 0;
  line-height: 1.8;
  font-size: 1rem;
}

/* Add Media Modal Styles */
.add-media-form,
.youtube-search-form {
  margin-top: 1rem;
}

.youtube-results {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
}

.youtube-result-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: var(--ion-color-light);
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
  border: 2px solid transparent;
}

.youtube-result-item:hover {
  background: var(--ion-color-light-shade);
}

.youtube-result-item:active {
  transform: scale(0.98);
}

.youtube-result-item.selected {
  border-color: var(--ion-color-primary);
  background: var(--ion-color-primary-tint);
}

.result-thumbnail {
  position: relative;
  width: 100px;
  height: 56px;
  flex-shrink: 0;
  border-radius: 4px;
  overflow: hidden;
}

.result-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-overlay ion-icon {
  color: white;
  font-size: 1.25rem;
}

.result-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.result-title {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--ion-color-dark);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-channel {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
}

.selection-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: var(--ion-color-medium);
}

.no-results ion-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.youtube-selected-section {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--ion-color-light-shade);
}

/* Upload Modal Styles */
.upload-form {
  margin-top: 1rem;
}

.file-input-section {
  margin-bottom: 1.5rem;
}

.file-input-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  background: var(--ion-color-light);
  border: 2px dashed var(--ion-color-medium);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.file-input-label:hover {
  background: var(--ion-color-light-shade);
  border-color: var(--ion-color-primary);
}

.file-input-label ion-icon {
  font-size: 2.5rem;
  color: var(--ion-color-primary);
}

.file-input-label span {
  font-size: 1rem;
  font-weight: 500;
  color: var(--ion-color-dark);
  text-align: center;
}

.hidden-file-input {
  display: none;
}

.file-hint {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  text-align: center;
}

.file-preview {
  margin-bottom: 1rem;
}

.file-preview ion-card {
  margin: 0;
  background: var(--ion-color-light);
}

.preview-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.preview-icon {
  font-size: 2rem;
  color: var(--ion-color-primary);
  flex-shrink: 0;
}

.preview-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.preview-name {
  font-size: 1rem;
  font-weight: 500;
  color: var(--ion-color-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-size {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
}

@media (max-width: 768px) {
  .resource-header h1 {
    font-size: 1.5rem;
  }

  .metadata {
    flex-direction: column;
    gap: 0.5rem;
  }
}

/* Media card with delete button */
.youtube-card,
.video-card,
.audio-card {
  display: flex;
  align-items: center;
  gap: 0;
  background: var(--ion-color-light);
  border-radius: 12px;
  overflow: hidden;
}

.card-main {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  flex: 1;
  min-width: 0;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.card-main:hover {
  background: var(--ion-color-light-shade);
}

.card-main:active {
  background: var(--ion-color-light-tint);
}

/* Media actions container */
.media-actions {
  display: flex;
  gap: 0.25rem;
  margin-left: auto;
}

.media-actions ion-button {
  --padding-start: 8px;
  --padding-end: 8px;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.media-actions ion-button:hover {
  opacity: 1;
}

.delete-media-btn {
  --padding-start: 8px;
  --padding-end: 8px;
  margin-right: 8px;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.delete-media-btn:hover {
  opacity: 1;
}

/* Spotify card with actions */
.spotify-card {
  position: relative;
  background: var(--ion-color-light);
  border-radius: 12px;
  padding: 1rem;
}

.spotify-card .media-actions.spotify-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  background: var(--ion-color-light);
  border-radius: 20px;
  padding: 2px;
}

/* Link card wrapper with actions */
.link-card-wrapper {
  display: flex;
  align-items: center;
  gap: 0;
  background: var(--ion-color-light);
  border-radius: 12px;
  overflow: hidden;
}

.link-card-wrapper .link-card {
  flex: 1;
  border-radius: 0;
}

.link-card-wrapper .media-actions.link-actions {
  padding-right: 8px;
}

/* File actions inline */
.file-actions-inline {
  display: flex;
  gap: 0.25rem;
}

/* Lyrics textarea in edit modal */
.lyrics-textarea-item {
  --inner-padding-end: 0;
}

.lyrics-textarea {
  width: 100%;
  min-height: 300px;
  padding: 12px;
  border: 1px solid var(--ion-color-medium);
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  background: var(--ion-background-color);
  color: var(--ion-text-color);
}

.lyrics-textarea:focus {
  outline: none;
  border-color: var(--ion-color-primary);
}
</style>