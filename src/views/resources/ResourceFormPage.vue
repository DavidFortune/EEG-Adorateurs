<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="isEditMode ? `/resource-detail/${route.params.id}` : '/resources'"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ isEditMode ? 'Modifier la ressource' : 'Nouvelle ressource' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="saveResource" :disabled="!isFormValid">
            <ion-icon :icon="checkmarkOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content :fullscreen="true" class="ion-padding">
      <ion-loading :is-open="loading" message="Chargement..."></ion-loading>
      
      <div class="form-container">
        <!-- Basic Information -->
        <ion-list>
          <ion-item>
            <ion-label position="stacked">Titre *</ion-label>
            <ion-input
              v-model="form.title"
              placeholder="Titre de la ressource"
              required
            ></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Référence</ion-label>
            <ion-input
              v-model="form.reference"
              placeholder="Ex: Psaume 23, #145, etc."
            ></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Collection</ion-label>
            <ion-button
              @click="showCollectionSelector = true"
              fill="outline"
              expand="block"
              class="collection-selector-btn"
            >
              <ion-icon :icon="folderOutline" slot="start" />
              <span v-if="!form.collectionId">Sélectionner une collection</span>
              <span v-else>{{ getCollectionName(form.collectionId) }}</span>
            </ion-button>
          </ion-item>

          <!-- Music Properties -->
          <div class="music-properties-form">
            <ion-item>
              <ion-select
                v-model="form.musicKey"
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
                v-model="form.musicBeat"
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
                v-model="form.musicTempo"
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
                v-model="form.musicStyle"
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
          </div>

          <!-- Tags - Hidden for now, will be re-enabled later
          <ion-item>
            <ion-label position="stacked">Tags</ion-label>
            <div class="tags-input-container">
              <div class="tags-chips">
                <ion-chip
                  v-for="(tag, index) in form.tags"
                  :key="index"
                  color="primary"
                  outline
                >
                  <ion-label>{{ tag }}</ion-label>
                  <ion-icon :icon="closeCircleOutline" @click="removeTag(index)" />
                </ion-chip>
              </div>
              <ion-input
                v-model="newTagInput"
                placeholder="Ajouter un tag..."
                @keydown.enter.prevent="addTag"
                @keydown.tab.prevent="addTag"
                @keydown.,="addTag"
              ></ion-input>
            </div>
          </ion-item>
          -->
        </ion-list>
        
        <!-- Content Items -->
        <div class="content-section">
          <div class="section-header">
            <h3>Médias</h3>
            <ion-button @click="addContent" size="small" fill="outline">
              <ion-icon :icon="addOutline" slot="start" />
              Ajouter
            </ion-button>
          </div>
          
          <ion-list v-if="form.contents.length > 0">
            <ion-item-sliding v-for="(content, index) in form.contents" :key="index">
              <ion-item>
                <ion-label>
                  <h3>{{ getContentLabel(content.type) }}</h3>
                  
                  <!-- Video Preview -->
                  <div v-if="content.type === ResourceTypeEnum.VIDEO && content.url" class="media-preview">
                    <!-- YouTube video -->
                    <iframe 
                      v-if="isYouTubeUrl(content.url)"
                      :src="getYouTubeEmbedUrl(content.url) || ''"
                      frameborder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowfullscreen
                      class="preview-video"
                    ></iframe>
                    <!-- Regular video file -->
                    <video 
                      v-else
                      :src="content.url" 
                      controls 
                      class="preview-video" 
                      :poster="content.thumbnailUrl"
                    ></video>
                  </div>
                  
                  <!-- Audio Preview -->
                  <div v-if="content.type === ResourceTypeEnum.AUDIO && content.url" class="media-preview">
                    <audio :src="content.url" controls class="preview-audio"></audio>
                  </div>

                  <!-- Spotify Preview -->
                  <div v-if="content.type === ResourceTypeEnum.SPOTIFY && content.url" class="media-preview">
                    <iframe
                      :src="getSpotifyEmbedUrl(content.url) || ''"
                      width="100%"
                      height="152"
                      frameborder="0"
                      allowtransparency="true"
                      allow="encrypted-media"
                      class="preview-spotify"
                    ></iframe>
                  </div>

                  <!-- Music Sheet Preview -->
                  <div v-if="content.type === ResourceTypeEnum.MUSIC_SHEET && content.url" class="media-preview">
                    <div class="file-preview">
                      <ion-icon :icon="musicalNotesOutline" />
                      <span class="file-name">{{ getFileName(content.url) }}</span>
                      <ion-button size="small" fill="clear" @click="editContent(index)">
                        <ion-icon :icon="pencilOutline" slot="icon-only" />
                      </ion-button>
                    </div>
                  </div>
                  
                  <!-- Lyrics Preview -->
                  <div v-if="content.type === ResourceTypeEnum.LYRICS && content.content" class="media-preview">
                    <div class="lyrics-preview">
                      <span class="lyrics-text">{{ getPreviewText(content.content) }}</span>
                      <ion-button size="small" fill="clear" @click="editContent(index)">
                        <ion-icon :icon="pencilOutline" slot="icon-only" />
                      </ion-button>
                    </div>
                  </div>
                  
                  <!-- Fallback for content without preview -->
                  <div v-if="!hasPreview(content)" class="media-preview">
                    <div v-if="content.url" class="fallback-preview">
                      <span class="fallback-url">{{ content.url }}</span>
                      <ion-button size="small" fill="clear" @click="editContent(index)">
                        <ion-icon :icon="pencilOutline" slot="icon-only" />
                      </ion-button>
                    </div>
                    <div v-else-if="content.content" class="fallback-preview">
                      <span class="fallback-content">{{ content.content.substring(0, 50) }}...</span>
                      <ion-button size="small" fill="clear" @click="editContent(index)">
                        <ion-icon :icon="pencilOutline" slot="icon-only" />
                      </ion-button>
                    </div>
                  </div>
                  
                  <p v-if="content.notes" class="content-notes">
                    <ion-icon :icon="documentTextOutline" /> {{ content.notes }}
                  </p>
                </ion-label>
                <ion-icon :icon="getContentIcon(content.type)" slot="start" />
              </ion-item>
              
              <ion-item-options side="end">
                <ion-item-option @click="editContent(index)" color="primary">
                  <ion-icon :icon="pencilOutline" />
                </ion-item-option>
                <ion-item-option @click="removeContent(index)" color="danger">
                  <ion-icon :icon="trashOutline" />
                </ion-item-option>
              </ion-item-options>
            </ion-item-sliding>
          </ion-list>
          
          <div v-else class="empty-content">
            <p>Aucun contenu ajouté</p>
          </div>
        </div>
      </div>
      
      <!-- Content Modal -->
      <ion-modal :is-open="showContentModal" @didDismiss="showContentModal = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ editingContentIndex >= 0 ? 'Modifier' : 'Ajouter' }} un média</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showContentModal = false">Annuler</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-list>
            <ion-item>
              <ion-label position="stacked">Type de média</ion-label>
              <div class="media-type-buttons">
                <ion-button 
                  @click="contentForm.type = ResourceTypeEnum.LYRICS"
                  :fill="contentForm.type === ResourceTypeEnum.LYRICS ? 'solid' : 'outline'"
                  :color="contentForm.type === ResourceTypeEnum.LYRICS ? 'primary' : 'medium'"
                  class="media-type-button"
                >
                  <div class="button-content">
                    <ion-icon :icon="documentTextOutline" />
                    <span>Paroles</span>
                  </div>
                </ion-button>
                
                <ion-button 
                  @click="contentForm.type = ResourceTypeEnum.VIDEO"
                  :fill="contentForm.type === ResourceTypeEnum.VIDEO ? 'solid' : 'outline'"
                  :color="contentForm.type === ResourceTypeEnum.VIDEO ? 'primary' : 'medium'"
                  class="media-type-button"
                >
                  <div class="button-content">
                    <ion-icon :icon="videocamOutline" />
                    <span>Vidéo</span>
                  </div>
                </ion-button>
                
                <ion-button 
                  @click="contentForm.type = ResourceTypeEnum.AUDIO"
                  :fill="contentForm.type === ResourceTypeEnum.AUDIO ? 'solid' : 'outline'"
                  :color="contentForm.type === ResourceTypeEnum.AUDIO ? 'primary' : 'medium'"
                  class="media-type-button"
                >
                  <div class="button-content">
                    <ion-icon :icon="volumeHighOutline" />
                    <span>Audio</span>
                  </div>
                </ion-button>
                
                <ion-button
                  @click="contentForm.type = ResourceTypeEnum.MUSIC_SHEET"
                  :fill="contentForm.type === ResourceTypeEnum.MUSIC_SHEET ? 'solid' : 'outline'"
                  :color="contentForm.type === ResourceTypeEnum.MUSIC_SHEET ? 'primary' : 'medium'"
                  class="media-type-button"
                >
                  <div class="button-content">
                    <ion-icon :icon="musicalNotesOutline" />
                    <span>Partition</span>
                  </div>
                </ion-button>

                <ion-button
                  @click="contentForm.type = ResourceTypeEnum.SPOTIFY"
                  :fill="contentForm.type === ResourceTypeEnum.SPOTIFY ? 'solid' : 'outline'"
                  :color="contentForm.type === ResourceTypeEnum.SPOTIFY ? 'primary' : 'medium'"
                  class="media-type-button"
                >
                  <div class="button-content">
                    <ion-icon :icon="musicalNoteOutline" />
                    <span>Spotify</span>
                  </div>
                </ion-button>

              </div>
            </ion-item>
            
            <!-- Audio File Upload -->
            <div v-if="contentForm.type === ResourceTypeEnum.AUDIO">
              <ion-item>
                <ion-label position="stacked">Fichier Audio</ion-label>
                <input 
                  type="file" 
                  accept="audio/*" 
                  @change="onFileSelected" 
                  style="margin-top: 8px;"
                />
              </ion-item>
              
              <ion-item v-if="selectedFile">
                <ion-label>
                  <h3>{{ selectedFile.name }}</h3>
                  <p>{{ formatFileSize(selectedFile.size) }}</p>
                </ion-label>
                <ion-button slot="end" fill="clear" color="danger" @click="clearFile">
                  <ion-icon :icon="trashOutline" />
                </ion-button>
              </ion-item>
              
              <ion-item>
                <ion-label position="stacked">ou URL Audio</ion-label>
                <ion-input 
                  v-model="contentForm.url" 
                  placeholder="URL du fichier audio"
                  :disabled="!!selectedFile"
                ></ion-input>
              </ion-item>
            </div>
            
            <!-- Video File Upload -->
            <div v-if="contentForm.type === ResourceTypeEnum.VIDEO">
              <!-- YouTube Search Toggle Button -->
              <ion-item lines="none" class="youtube-search-toggle">
                <ion-button
                  @click="toggleYouTubeSearch"
                  :fill="showYouTubeSearch ? 'solid' : 'outline'"
                  :color="showYouTubeSearch ? 'danger' : 'danger'"
                  expand="block"
                  class="youtube-btn"
                >
                  <ion-icon :icon="logoYoutube" slot="start" />
                  {{ showYouTubeSearch ? 'Masquer la recherche YouTube' : 'Rechercher sur YouTube' }}
                </ion-button>
              </ion-item>

              <!-- YouTube Search Section -->
              <div v-if="showYouTubeSearch" class="youtube-search-section">
                <ion-item>
                  <ion-label position="stacked">Rechercher une vidéo</ion-label>
                  <ion-input
                    v-model="youtubeSearchQuery"
                    placeholder="Ex: Amazing Grace worship"
                    @keyup.enter="searchYouTube"
                  ></ion-input>
                  <ion-button
                    slot="end"
                    @click="searchYouTube"
                    :disabled="!youtubeSearchQuery || youtubeSearchLoading"
                    fill="solid"
                    size="small"
                  >
                    <ion-icon :icon="searchOutline" slot="icon-only" v-if="!youtubeSearchLoading" />
                    <ion-spinner v-if="youtubeSearchLoading" name="crescent"></ion-spinner>
                  </ion-button>
                </ion-item>

                <!-- YouTube Search Results -->
                <div v-if="youtubeSearchResults.length > 0" class="youtube-results">
                  <h4>Résultats YouTube</h4>
                  <div
                    v-for="result in youtubeSearchResults"
                    :key="result.id"
                    class="youtube-result-item"
                    :class="{ selected: selectedYouTubeResult?.id === result.id }"
                  >
                    <div class="result-thumbnail" @click="selectYouTubeResult(result)">
                      <img :src="result.thumbnail" :alt="result.title" />
                      <div class="play-overlay">
                        <ion-icon :icon="playCircleOutline" />
                      </div>
                    </div>
                    <div class="result-info" @click="selectYouTubeResult(result)">
                      <h5 class="result-title">{{ result.title }}</h5>
                      <p class="result-channel">{{ result.channel }}</p>
                    </div>
                    <div class="result-actions">
                      <ion-button
                        @click="previewYouTubeVideo(result)"
                        fill="clear"
                        size="small"
                        color="primary"
                      >
                        <ion-icon :icon="playCircleOutline" slot="icon-only" />
                      </ion-button>
                      <ion-icon
                        :icon="selectedYouTubeResult?.id === result.id ? checkmarkCircle : ellipseOutline"
                        :color="selectedYouTubeResult?.id === result.id ? 'primary' : 'medium'"
                        class="selection-icon"
                        @click="selectYouTubeResult(result)"
                      />
                    </div>
                  </div>
                </div>

                <!-- No Results -->
                <div v-if="youtubeSearchPerformed && youtubeSearchResults.length === 0 && !youtubeSearchLoading" class="no-results">
                  <ion-icon :icon="searchOutline" />
                  <p>Aucun résultat trouvé</p>
                </div>

                <!-- Use Selected Video Button -->
                <div v-if="selectedYouTubeResult" class="youtube-action-buttons">
                  <ion-button @click="addYouTubeVideoAsContent()" expand="block" color="primary">
                    <ion-icon :icon="checkmarkOutline" slot="start" />
                    Utiliser cette vidéo
                  </ion-button>
                </div>
              </div>

              <!-- Regular File/URL input (shown when not searching YouTube) -->
              <div v-if="!showYouTubeSearch">
                <ion-item>
                  <ion-label position="stacked">Fichier Vidéo</ion-label>
                  <input
                    type="file"
                    accept="video/*"
                    @change="onFileSelected"
                    style="margin-top: 8px;"
                  />
                </ion-item>

                <ion-item v-if="selectedFile">
                  <ion-label>
                    <h3>{{ selectedFile.name }}</h3>
                    <p>{{ formatFileSize(selectedFile.size) }}</p>
                  </ion-label>
                  <ion-button slot="end" fill="clear" color="danger" @click="clearFile">
                    <ion-icon :icon="trashOutline" />
                  </ion-button>
                </ion-item>

                <ion-item>
                  <ion-label position="stacked">ou URL Vidéo</ion-label>
                  <ion-input
                    v-model="contentForm.url"
                    placeholder="URL du fichier vidéo ou YouTube"
                    :disabled="!!selectedFile"
                  ></ion-input>
                </ion-item>
              </div>

              <!-- Show selected YouTube video URL -->
              <div v-if="contentForm.url && isYouTubeUrl(contentForm.url)" class="selected-youtube-preview">
                <ion-item lines="none">
                  <ion-label>
                    <p class="youtube-url-label">Vidéo YouTube sélectionnée:</p>
                    <div class="youtube-preview-frame">
                      <iframe
                        :src="getYouTubeEmbedUrl(contentForm.url) || ''"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen
                        class="youtube-preview-iframe"
                      ></iframe>
                    </div>
                  </ion-label>
                </ion-item>
              </div>
            </div>
            
            <!-- Music Sheet File Upload -->
            <div v-if="contentForm.type === ResourceTypeEnum.MUSIC_SHEET">
              <ion-item>
                <ion-label position="stacked">Fichier Partition</ion-label>
                <input 
                  type="file" 
                  accept="application/pdf,image/*" 
                  @change="onFileSelected" 
                  style="margin-top: 8px;"
                />
              </ion-item>
              
              <ion-item v-if="selectedFile">
                <ion-label>
                  <h3>{{ selectedFile.name }}</h3>
                  <p>{{ formatFileSize(selectedFile.size) }}</p>
                </ion-label>
                <ion-button slot="end" fill="clear" color="danger" @click="clearFile">
                  <ion-icon :icon="trashOutline" />
                </ion-button>
              </ion-item>
              
              <ion-item>
                <ion-label position="stacked">ou URL Partition</ion-label>
                <ion-input 
                  v-model="contentForm.url" 
                  placeholder="URL du fichier PDF ou image"
                  :disabled="!!selectedFile"
                ></ion-input>
              </ion-item>
            </div>

            <!-- Spotify Link -->
            <div v-if="contentForm.type === ResourceTypeEnum.SPOTIFY">
              <ion-item>
                <ion-label position="stacked">Lien Spotify *</ion-label>
                <ion-input
                  v-model="contentForm.url"
                  placeholder="Ex: https://open.spotify.com/track/..."
                ></ion-input>
              </ion-item>
              <ion-note class="spotify-note">
                <ion-icon :icon="informationCircleOutline" />
                Collez le lien Spotify d'une chanson, playlist, album ou podcast
              </ion-note>
            </div>

            <!-- Text Content for lyrics -->
            <ion-item v-if="contentForm.type === ResourceTypeEnum.LYRICS">
              <ion-label position="stacked">Contenu</ion-label>
              <ion-textarea 
                v-model="contentForm.content" 
                :placeholder="getContentPlaceholder()"
                :rows="10"
              ></ion-textarea>
            </ion-item>
            
            <!-- Notes field for all content types -->
            <ion-item>
              <ion-label position="stacked">Notes (optionnel)</ion-label>
              <ion-textarea 
                v-model="contentForm.notes" 
                placeholder="Instructions, remarques ou informations supplémentaires..."
                :rows="3"
              ></ion-textarea>
            </ion-item>
          </ion-list>
          
          <div class="modal-actions">
            <ion-button @click="saveContent" expand="block" :disabled="!isContentValid || uploading">
              <ion-spinner v-if="uploading" name="crescent" />
              <span v-else>{{ editingContentIndex >= 0 ? 'Modifier' : 'Ajouter' }}</span>
            </ion-button>
          </div>
        </ion-content>
      </ion-modal>
      
      <!-- Create Collection Modal -->
      <ion-modal :is-open="showCreateCollectionModal" @didDismiss="showCreateCollectionModal = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Créer une collection</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showCreateCollectionModal = false">Annuler</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-list>
            <ion-item>
              <ion-label position="stacked">Nom de la collection *</ion-label>
              <ion-input 
                v-model="collectionForm.name" 
                placeholder="Nom de la collection"
                @ionInput="onCollectionNameInput"
                required
              ></ion-input>
            </ion-item>
            
            <ion-item>
              <ion-label position="stacked">Symbole *</ion-label>
              <ion-input 
                v-model="collectionForm.symbol" 
                placeholder="ABC"
                :maxlength="3"
                style="text-transform: uppercase"
                required
              ></ion-input>
              <ion-note slot="helper">2-3 caractères, généré automatiquement</ion-note>
            </ion-item>
            
            <ion-item>
              <ion-label position="stacked">Couleur *</ion-label>
              <div class="color-picker">
                <div 
                  v-for="color in COLLECTION_COLORS" 
                  :key="color"
                  class="color-option"
                  :class="{ selected: collectionForm.color === color }"
                  :style="{ backgroundColor: color }"
                  @click="collectionForm.color = color"
                >
                  <ion-icon v-if="collectionForm.color === color" :icon="checkmarkOutline" class="check-icon" />
                </div>
              </div>
            </ion-item>
            
            <ion-item>
              <ion-label position="stacked">Description</ion-label>
              <ion-textarea 
                v-model="collectionForm.description" 
                placeholder="Description de la collection"
                :rows="3"
              ></ion-textarea>
            </ion-item>
          </ion-list>
          
          <div class="modal-actions">
            <ion-button @click="createNewCollection" expand="block" :disabled="!collectionForm.name?.trim() || !collectionForm.symbol?.trim() || !collectionForm.color">
              Créer la collection
            </ion-button>
          </div>
        </ion-content>
      </ion-modal>
      
      <!-- Collection Selector Modal -->
      <ion-modal :is-open="showCollectionSelector" @didDismiss="showCollectionSelector = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Sélectionner une collection</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showCollectionSelector = false">Fermer</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-button
            v-if="isAdmin"
            @click="openCreateCollectionModal"
            expand="block"
            fill="outline"
            class="create-collection-btn"
          >
            <ion-icon :icon="addOutline" slot="start" />
            Créer une collection
          </ion-button>

          <ion-list>
            <ion-item
              v-for="collection in collections"
              :key="collection.id"
              button
              @click="selectCollection(collection.id)"
              :class="{ 'selected-collection': form.collectionId === collection.id }"
            >
              <ion-icon
                v-if="form.collectionId === collection.id"
                :icon="checkmarkCircle"
                slot="start"
                color="primary"
              />
              <ion-icon
                v-else
                :icon="ellipseOutline"
                slot="start"
                color="medium"
              />
              <ion-label>
                <h3>{{ collection.name }}</h3>
                <p v-if="collection.description">{{ collection.description }}</p>
              </ion-label>
              <div slot="end" class="collection-badge" :style="{ backgroundColor: collection.color }">
                {{ collection.symbol }}
              </div>
            </ion-item>
          </ion-list>

          <div v-if="collections.length === 0 && !isAdmin" class="empty-state ion-text-center">
            <ion-icon :icon="folderOutline" size="large" color="medium" />
            <h2>Aucune collection</h2>
            <p>Aucune collection disponible.</p>
          </div>

          <div v-if="collections.length === 0 && isAdmin" class="empty-state ion-text-center">
            <ion-icon :icon="folderOutline" size="large" color="medium" />
            <h2>Aucune collection</h2>
            <p>Créez votre première collection pour organiser vos ressources.</p>
            <ion-button @click="openCreateCollectionModal" fill="outline">
              <ion-icon :icon="addOutline" slot="start" />
              Créer une collection
            </ion-button>
          </div>
        </ion-content>
      </ion-modal>

      <!-- YouTube Video Preview Modal -->
      <ion-modal :is-open="showYouTubePreviewModal" @will-dismiss="closeYouTubePreview">
        <ion-header>
          <ion-toolbar>
            <ion-title>Aperçu vidéo</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeYouTubePreview">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <div class="video-preview-container" v-if="previewingYouTubeVideo">
            <iframe
              :src="`https://www.youtube.com/embed/${previewingYouTubeVideo.id}`"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              class="video-iframe"
            ></iframe>
            <div class="video-info">
              <h3>{{ previewingYouTubeVideo.title }}</h3>
              <p class="channel-name">{{ previewingYouTubeVideo.channel }}</p>
            </div>
          </div>
        </ion-content>
        <ion-footer>
          <ion-toolbar>
            <div class="preview-actions">
              <ion-button @click="closeYouTubePreview" fill="outline" color="medium">
                Fermer
              </ion-button>
              <ion-button @click="addYouTubeVideoAsContent(previewingYouTubeVideo ?? undefined)" color="primary">
                <ion-icon :icon="addOutline" slot="start" />
                Utiliser cette vidéo
              </ion-button>
            </div>
          </ion-toolbar>
        </ion-footer>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonList, IonItem, IonLabel, IonInput, IonTextarea,
  IonItemSliding, IonItemOptions, IonItemOption, IonCheckbox, IonChip,
  IonModal, IonLoading, IonNote, IonSpinner, IonFooter, IonSelect, IonSelectOption,
  toastController
} from '@ionic/vue';
import {
  checkmarkOutline, addOutline, pencilOutline, trashOutline,
  folderOutline, documentTextOutline, videocamOutline, volumeHighOutline,
  musicalNotesOutline, musicalNoteOutline, informationCircleOutline,
  searchOutline, logoYoutube, playCircleOutline, closeOutline, checkmarkCircle, ellipseOutline,
  closeCircleOutline
} from 'ionicons/icons';
import { getContentIcon, getContentLabel, formatFileSize, isYouTubeUrl, getYouTubeEmbedUrl, getFileName, getPreviewText, getSpotifyEmbedUrl } from '@/utils/resource-utils';
import { Resource, ResourceMedia, ResourceType, ResourceCollection, CollectionType, ResourceOption } from '@/types/resource';
import {
  createResource,
  updateResource,
  getResourceById,
  getResourceCollections,
  createResourceCollection as createCollectionService,
  generateUniqueSymbol,
  COLLECTION_COLORS,
  getRandomColor,
  getAllResourceOptions
} from '@/firebase/resources';
import { useUser } from '@/composables/useUser';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/firebase/config';

const route = useRoute();
const router = useRouter();
const { user, isAdmin } = useUser();

const loading = ref(false);
const collections = ref<ResourceCollection[]>([]);
const showContentModal = ref(false);
const showCreateCollectionModal = ref(false);
const showCollectionSelector = ref(false);
const editingContentIndex = ref(-1);
const uploading = ref(false);
const selectedFile = ref<File | null>(null);
const newTagInput = ref('');

// YouTube search state
interface YouTubeSearchResult {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  videoUrl: string;
}
const showYouTubeSearch = ref(false);
const youtubeSearchQuery = ref('');
const youtubeSearchResults = ref<YouTubeSearchResult[]>([]);
const youtubeSearchLoading = ref(false);
const youtubeSearchPerformed = ref(false);
const selectedYouTubeResult = ref<YouTubeSearchResult | null>(null);
const showYouTubePreviewModal = ref(false);
const previewingYouTubeVideo = ref<YouTubeSearchResult | null>(null);

// Music options state
const musicKeys = ref<ResourceOption[]>([]);
const musicBeats = ref<ResourceOption[]>([]);
const musicTempos = ref<ResourceOption[]>([]);
const musicStyles = ref<ResourceOption[]>([]);

// Make enum available in template
const ResourceTypeEnum = ResourceType;

const form = ref({
  title: '',
  reference: '',
  collectionId: '',
  contents: [] as ResourceMedia[],
  tags: [] as string[],
  musicKey: '' as string,
  musicBeat: '' as string,
  musicTempo: '' as string,
  musicStyle: '' as string
});

const contentForm = ref<Partial<ResourceMedia>>({
  type: ResourceType.LYRICS,
  content: '',
  url: '',
  thumbnailUrl: '',
  notes: ''
});

const collectionForm = ref<Partial<ResourceCollection>>({
  name: '',
  symbol: '',
  color: '#b5121b',
  description: ''
});

const isEditMode = computed(() => !!route.params.id);

const isFormValid = computed(() => {
  return form.value.title && form.value.title.trim().length > 0;
});

const addTag = () => {
  const tag = newTagInput.value.trim().replace(/,/g, '');
  if (tag && !form.value.tags.includes(tag)) {
    form.value.tags.push(tag);
  }
  newTagInput.value = '';
};

const removeTag = (index: number) => {
  form.value.tags.splice(index, 1);
};

const isContentValid = computed(() => {
  const type = contentForm.value.type;
  if (!type) return false;

  if (type === ResourceTypeEnum.AUDIO || type === ResourceTypeEnum.VIDEO || type === ResourceTypeEnum.MUSIC_SHEET) {
    // For audio, video, and music sheet, either a file is selected or a URL is provided
    return !!selectedFile.value || (!!contentForm.value.url && contentForm.value.url.trim().length > 0);
  }

  if (type === ResourceTypeEnum.SPOTIFY) {
    // For Spotify, a URL is required
    return !!contentForm.value.url && contentForm.value.url.trim().length > 0;
  }

  if (type === ResourceTypeEnum.LYRICS) {
    return !!contentForm.value.content && contentForm.value.content.trim().length > 0;
  }

  return false;
});

const loadResourceCollections = async () => {
  try {
    collections.value = await getResourceCollections();
  } catch (error) {
    console.error('Error loading collections:', error);
  }
};

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

const loadResource = async () => {
  if (!isEditMode.value) return;

  const id = route.params.id as string;
  loading.value = true;

  try {
    const resource = await getResourceById(id);
    if (resource) {
      form.value = {
        title: resource.title,
        reference: resource.reference || '',
        collectionId: resource.collectionId || '',
        contents: [...resource.contents],
        tags: resource.tags || [],
        musicKey: resource.musicKey || '',
        musicBeat: resource.musicBeat || '',
        musicTempo: resource.musicTempo || '',
        musicStyle: resource.musicStyle || ''
      };
    }
  } catch (error) {
    console.error('Error loading resource:', error);
  } finally {
    loading.value = false;
  }
};

const addContent = () => {
  editingContentIndex.value = -1;
  selectedFile.value = null;
  contentForm.value = {
    type: ResourceTypeEnum.LYRICS,
    content: '',
    url: '',
    thumbnailUrl: '',
    notes: ''
  };
  // Reset YouTube search state
  showYouTubeSearch.value = false;
  youtubeSearchQuery.value = '';
  youtubeSearchResults.value = [];
  selectedYouTubeResult.value = null;
  youtubeSearchPerformed.value = false;
  showContentModal.value = true;
};

const editContent = (index: number) => {
  editingContentIndex.value = index;
  const content = form.value.contents[index];
  contentForm.value = { ...content };
  showContentModal.value = true;
};

const removeContent = (index: number) => {
  form.value.contents.splice(index, 1);
};

const saveContent = async () => {
  if (!isContentValid.value) return;
  
  uploading.value = true;
  
  try {
    let mediaUrl = contentForm.value.url;
    
    console.log('Starting save content process');
    console.log('User authenticated:', !!user.value?.uid, user.value?.uid);
    console.log('Content type:', contentForm.value.type);
    console.log('Selected file:', selectedFile.value?.name, selectedFile.value?.type);
    
    // Handle file upload for audio, video, and music sheet content
    if ((contentForm.value.type === ResourceType.AUDIO || contentForm.value.type === ResourceType.VIDEO || contentForm.value.type === ResourceType.MUSIC_SHEET) && selectedFile.value) {
      console.log('Starting file upload...');
      mediaUrl = await uploadFileToStorage(selectedFile.value, contentForm.value.type);
      console.log('File upload completed, URL:', mediaUrl);
    }
    
    const newContent: ResourceMedia = {
      type: contentForm.value.type!
    };
    
    // Only add properties that have values to avoid undefined fields
    if (contentForm.value.content && contentForm.value.content.trim()) {
      newContent.content = contentForm.value.content.trim();
    }
    if (mediaUrl) {
      newContent.url = mediaUrl;
    }
    if (contentForm.value.thumbnailUrl && contentForm.value.thumbnailUrl.trim()) {
      newContent.thumbnailUrl = contentForm.value.thumbnailUrl.trim();
    }
    if (selectedFile.value?.size) {
      newContent.fileSize = selectedFile.value.size;
    }
    if (selectedFile.value?.type) {
      newContent.mimeType = selectedFile.value.type;
    }
    if (contentForm.value.notes && contentForm.value.notes.trim()) {
      newContent.notes = contentForm.value.notes.trim();
    }
    
    if (editingContentIndex.value >= 0) {
      form.value.contents[editingContentIndex.value] = newContent;
    } else {
      form.value.contents.push(newContent);
    }
    
    // Reset form
    selectedFile.value = null;
    contentForm.value = {
      type: ResourceType.LYRICS,
      content: '',
      url: '',
      thumbnailUrl: '',
      notes: ''
    };
    
    showContentModal.value = false;
    
    const toast = await toastController.create({
      message: 'Média ajouté avec succès',
      duration: 2000,
      color: 'success'
    });
    await toast.present();
    
  } catch (error) {
    console.error('Error uploading file:', error);
    const toast = await toastController.create({
      message: 'Erreur lors du téléchargement du fichier',
      duration: 3000,
      color: 'danger'
    });
    await toast.present();
  } finally {
    uploading.value = false;
  }
};

const saveResource = async () => {
  if (!isFormValid.value) return;
  
  loading.value = true;
  
  try {
    console.log('Starting saveResource...');
    console.log('User:', user.value?.uid, user.value?.email);
    console.log('Form data:', JSON.parse(JSON.stringify(form.value)));

    // Build resource data, filtering out undefined values
    const resourceData: any = {
      title: form.value.title,
      collectionId: form.value.collectionId,
      contents: form.value.contents,
      tags: form.value.tags,
      createdBy: user.value?.uid || '',
      updatedBy: user.value?.uid || ''
    };

    // Add reference if provided
    if (form.value.reference?.trim()) {
      resourceData.reference = form.value.reference.trim();
    }

    // Add music properties if provided
    if (form.value.musicKey) {
      resourceData.musicKey = form.value.musicKey;
    }
    if (form.value.musicBeat) {
      resourceData.musicBeat = form.value.musicBeat;
    }
    if (form.value.musicTempo) {
      resourceData.musicTempo = form.value.musicTempo;
    }
    if (form.value.musicStyle) {
      resourceData.musicStyle = form.value.musicStyle;
    }
    
    console.log('Resource data to save:', JSON.parse(JSON.stringify(resourceData)));
    
    if (isEditMode.value) {
      const id = route.params.id as string;
      console.log('Updating resource with ID:', id);
      await updateResource(id, resourceData);
    } else {
      console.log('Creating new resource...');
      const resourceId = await createResource(resourceData as Omit<Resource, 'id' | 'createdAt' | 'updatedAt' | 'viewCount'>);
      console.log('Resource created with ID:', resourceId);
    }

    const toast = await toastController.create({
      message: isEditMode.value ? 'Ressource modifiée' : 'Ressource créée',
      duration: 2000,
      color: 'success'
    });
    await toast.present();

    // Clear form after creating a new resource
    if (!isEditMode.value) {
      form.value = {
        title: '',
        reference: '',
        collectionId: '',
        contents: [],
        tags: [],
        musicKey: '',
        musicBeat: '',
        musicTempo: '',
        musicStyle: ''
      };
      newTagInput.value = '';
      selectedFile.value = null;
    }

    router.push('/resources');
  } catch (error) {
    console.error('Error saving resource:', error);
    const toast = await toastController.create({
      message: 'Erreur lors de la sauvegarde',
      duration: 2000,
      color: 'danger'
    });
    await toast.present();
  } finally {
    loading.value = false;
  }
};

const onCollectionNameInput = async (event: any) => {
  const name = event.target.value;
  if (name && name.trim().length > 0) {
    try {
      const uniqueSymbol = await generateUniqueSymbol(name);
      collectionForm.value.symbol = uniqueSymbol;
    } catch (error) {
      console.error('Error generating symbol:', error);
    }
  } else {
    collectionForm.value.symbol = '';
  }
};

const onFileSelected = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    selectedFile.value = input.files[0];
    contentForm.value.url = ''; // Clear URL when file is selected
  }
};

const clearFile = () => {
  selectedFile.value = null;
  // Reset file input
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
  if (fileInput) {
    fileInput.value = '';
  }
};

// YouTube search functions
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
  } catch (error: any) {
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

const selectYouTubeResult = (result: YouTubeSearchResult) => {
  selectedYouTubeResult.value = result;
};

const previewYouTubeVideo = (result: YouTubeSearchResult) => {
  previewingYouTubeVideo.value = result;
  showYouTubePreviewModal.value = true;
};

const closeYouTubePreview = () => {
  showYouTubePreviewModal.value = false;
  previewingYouTubeVideo.value = null;
};

const addYouTubeVideoAsContent = (result?: YouTubeSearchResult) => {
  const video = result || selectedYouTubeResult.value;
  if (!video) return;

  // Set the URL in the content form
  contentForm.value.url = video.videoUrl;
  contentForm.value.thumbnailUrl = video.thumbnail;

  // Reset YouTube search state
  showYouTubeSearch.value = false;
  youtubeSearchQuery.value = '';
  youtubeSearchResults.value = [];
  selectedYouTubeResult.value = null;
  youtubeSearchPerformed.value = false;
  closeYouTubePreview();
};

const toggleYouTubeSearch = () => {
  showYouTubeSearch.value = !showYouTubeSearch.value;
  if (!showYouTubeSearch.value) {
    // Reset search state when closing
    youtubeSearchQuery.value = '';
    youtubeSearchResults.value = [];
    selectedYouTubeResult.value = null;
    youtubeSearchPerformed.value = false;
  }
};

const uploadFileToStorage = async (file: File, contentType?: ResourceType): Promise<string> => {
  // Check if user is authenticated
  if (!user.value?.uid) {
    throw new Error('User must be authenticated to upload files');
  }
  
  const storage = getStorage();
  // Determine folder based on content type
  let folder = 'files'; // default
  if (contentType === ResourceType.AUDIO) {
    folder = 'audio';
  } else if (contentType === ResourceType.VIDEO) {
    folder = 'media'; // videos go to media folder
  } else if (contentType === ResourceType.MUSIC_SHEET) {
    folder = 'files'; // music sheets go to files folder
  }
  const filename = `${folder}/${Date.now()}_${file.name}`;
  const fileRef = storageRef(storage, filename);
  
  // Add metadata including who uploaded the file
  const metadata = {
    customMetadata: {
      uploadedBy: user.value.uid,
      originalName: file.name,
      uploadDate: new Date().toISOString()
    }
  };
  
  console.log('Uploading file:', filename, 'by user:', user.value.uid);
  
  try {
    const snapshot = await uploadBytes(fileRef, file, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Upload successful, download URL:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};

const createNewCollection = async () => {
  if (!collectionForm.value.name?.trim() || !collectionForm.value.symbol?.trim() || !collectionForm.value.color) return;
  
  try {
    const newCollectionId = await createCollectionService({
      name: collectionForm.value.name.trim(),
      symbol: collectionForm.value.symbol.trim(),
      color: collectionForm.value.color,
      type: CollectionType.CORE,
      description: collectionForm.value.description?.trim() || undefined
    });
    
    // Reload collections to include the new one
    await loadResourceCollections();
    
    // Auto-select the newly created collection
    form.value.collectionId = newCollectionId;
    
    const toast = await toastController.create({
      message: 'Collection créée avec succès',
      duration: 2000,
      color: 'success'
    });
    await toast.present();
    
    // Reset form and close modal
    collectionForm.value = {
      name: '',
      symbol: '',
      color: getRandomColor(),
      description: ''
    };
    showCreateCollectionModal.value = false;
  } catch (error) {
    console.error('Error creating collection:', error);
    const toast = await toastController.create({
      message: 'Erreur lors de la création de la collection',
      duration: 2000,
      color: 'danger'
    });
    await toast.present();
  }
};



const getContentPlaceholder = () => {
  switch (contentForm.value.type) {
    case ResourceType.LYRICS:
      return 'Entrez les paroles ici...';
    case ResourceType.MUSIC_SHEET:
      return 'Entrez les accords ou la notation (optionnel si URL fournie)';
    default:
      return 'Entrez le contenu...';
  }
};


const hasPreview = (content: any): boolean => {
  const hasVideoPreview = content.type === ResourceType.VIDEO && content.url;
  const hasAudioPreview = content.type === ResourceType.AUDIO && content.url;
  const hasMusicSheetPreview = content.type === ResourceType.MUSIC_SHEET && content.url;
  const hasLyricsPreview = content.type === ResourceType.LYRICS && content.content;
  
  return hasVideoPreview || hasAudioPreview || hasMusicSheetPreview || hasLyricsPreview;
};

const getCollectionName = (collectionId: string): string => {
  const collection = collections.value.find(c => c.id === collectionId);
  return collection ? collection.name : 'Collection inconnue';
};

const selectCollection = (collectionId: string) => {
  form.value.collectionId = collectionId;
  showCollectionSelector.value = false;
};

const openCreateCollectionModal = () => {
  showCollectionSelector.value = false;
  showCreateCollectionModal.value = true;
};

onMounted(() => {
  loadResourceCollections();
  loadMusicOptions();
  loadResource();
});
</script>

<style scoped>
.form-container {
  padding: 1rem;
}

.tags-input-container {
  width: 100%;
  padding: 8px 0;
}

.tags-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.tags-chips ion-chip {
  margin: 0;
  height: 28px;
}

.tags-chips ion-chip ion-icon {
  cursor: pointer;
  margin-left: 4px;
}

.tags-input-container ion-input {
  --padding-start: 0;
  --padding-end: 0;
}

.create-collection-btn {
  margin-bottom: 16px;
}

/* Music properties form */
.music-properties-form {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0;
  margin-top: 0.5rem;
}

.music-properties-form ion-item {
  --padding-start: 16px;
}

@media (max-width: 480px) {
  .music-properties-form {
    grid-template-columns: 1fr;
  }
}

.content-section {
  margin-top: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h3 {
  margin: 0;
}

.empty-content {
  text-align: center;
  padding: 2rem;
  color: var(--ion-color-medium);
}

.modal-actions {
  padding: 1rem;
}

ion-item {
  --padding-start: 0;
}

.create-collection-btn {
  float: right;
  margin-top: -0.25rem;
  font-size: 0.8rem;
}

.color-picker {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  padding: 8px 0;
}

.color-option {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  position: relative;
}

.color-option:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.color-option.selected {
  border-color: var(--ion-color-primary);
  box-shadow: 0 0 0 2px rgba(var(--ion-color-primary-rgb), 0.3);
}

.check-icon {
  font-size: 20px;
  color: white;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
}

@media (max-width: 768px) {
  .form-container {
    padding: 0.5rem;
  }
  
  .create-collection-btn {
    float: none;
    display: block;
    margin-top: 0.5rem;
  }
  
  .color-picker {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* File input styling */
input[type="file"] {
  width: 100%;
  padding: 8px 0;
  border: 2px dashed var(--ion-color-medium);
  border-radius: 8px;
  background: var(--ion-color-light);
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

input[type="file"]:hover {
  border-color: var(--ion-color-primary);
  background: var(--ion-color-primary-tint);
}

.content-notes {
  color: var(--ion-color-medium);
  font-style: italic;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.content-notes ion-icon {
  font-size: 0.875rem;
  vertical-align: middle;
  margin-right: 0.25rem;
}

/* Media type buttons */
.media-type-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-top: 8px;
}

.media-type-button {
  --border-radius: 8px;
  font-size: 0.75rem;
  height: 60px;
  min-width: 0;
  flex: 1;
}

.button-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  pointer-events: none;
}

.button-content ion-icon {
  font-size: 1.5rem;
}

.button-content span {
  font-size: 0.7rem;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
}

@media (max-width: 600px) {
  .media-type-buttons {
    grid-template-columns: repeat(4, 1fr);
    gap: 3px;
  }
  
  .media-type-button {
    font-size: 0.6rem;
    height: 50px;
    min-width: 0;
  }
  
  .button-content span {
    font-size: 0.6rem;
  }
  
  .button-content ion-icon {
    font-size: 1.3rem;
  }
}

@media (max-width: 480px) {
  .media-type-buttons {
    grid-template-columns: repeat(4, 1fr);
    gap: 2px;
  }
  
  .media-type-button {
    height: 45px;
    font-size: 0.55rem;
    min-width: 0;
  }
  
  .button-content {
    gap: 2px;
  }
  
  .button-content span {
    font-size: 0.55rem;
    line-height: 0.9;
  }
  
  .button-content ion-icon {
    font-size: 1.1rem;
  }
}

@media (max-width: 360px) {
  .media-type-buttons {
    gap: 1px;
  }
  
  .media-type-button {
    height: 42px;
    font-size: 0.5rem;
  }
  
  .button-content span {
    font-size: 0.5rem;
    line-height: 0.8;
  }
  
  .button-content ion-icon {
    font-size: 1rem;
  }
}

/* Media preview styles */
.media-preview {
  margin: 8px 0;
  max-width: 100%;
}

.preview-video {
  width: 100%;
  max-width: 300px;
  height: auto;
  border-radius: 8px;
  background: var(--ion-color-light);
}

.preview-video[src*="youtube.com"] {
  aspect-ratio: 16/9;
  height: auto;
}

.preview-audio {
  width: 100%;
  max-width: 300px;
  height: 40px;
}

.preview-spotify {
  width: 100%;
  max-width: 100%;
  border-radius: 12px;
}

.file-preview, .lyrics-preview, .fallback-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: var(--ion-color-light);
  border-radius: 8px;
}

.file-name {
  flex: 1;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--ion-color-dark);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lyrics-text {
  flex: 1;
  font-size: 0.9rem;
  color: var(--ion-color-medium);
  font-style: italic;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fallback-url, .fallback-content {
  flex: 1;
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  word-break: break-all;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-preview ion-icon {
  font-size: 1.2rem;
  color: var(--ion-color-primary);
  flex-shrink: 0;
}

.lyrics-preview ion-icon {
  font-size: 1rem;
  color: var(--ion-color-medium);
}

.spotify-note {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  margin-top: 8px;
  font-size: 0.875rem;
  color: var(--ion-color-medium);
}

.spotify-note ion-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

@media (max-width: 480px) {
  .preview-video {
    max-width: 250px;
  }
  
  .preview-audio {
    max-width: 250px;
  }
  
  .file-name, .lyrics-text {
    font-size: 0.8rem;
  }
}

/* Collection selector styles */
.collection-selector-btn {
  margin-top: 8px;
  --border-radius: 8px;
  justify-content: flex-start;
  text-align: left;
}

.collection-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: white;
  font-weight: bold;
  font-size: 0.75rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.empty-state {
  padding: 2rem;
  margin: 2rem 0;
}

.empty-state ion-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state h2 {
  margin-bottom: 0.5rem;
  color: var(--ion-color-medium);
}

.empty-state p {
  color: var(--ion-color-medium);
  margin-bottom: 1.5rem;
}

/* YouTube Search Styles */
.youtube-search-toggle {
  --padding-start: 0;
  --inner-padding-end: 0;
  margin-bottom: 1rem;
}

.youtube-btn {
  width: 100%;
  --border-radius: 8px;
}

.youtube-search-section {
  padding: 0.5rem 0;
  border: 1px solid var(--ion-color-light);
  border-radius: 8px;
  margin-bottom: 1rem;
  background: var(--ion-color-light-tint);
}

.youtube-results {
  margin-top: 1rem;
  padding: 0 0.5rem;
}

.youtube-results h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--ion-color-medium);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.youtube-result-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid var(--ion-color-light);
  border-radius: 8px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--ion-background-color);
}

.youtube-result-item:hover {
  background: var(--ion-color-light-tint);
}

.youtube-result-item.selected {
  background: var(--ion-color-primary-tint);
  border-color: var(--ion-color-primary);
}

.result-thumbnail {
  position: relative;
  flex-shrink: 0;
  width: 80px;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
}

.result-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  opacity: 0;
  transition: opacity 0.2s;
}

.result-thumbnail:hover .play-overlay {
  opacity: 1;
}

.play-overlay ion-icon {
  font-size: 2rem;
  color: white;
}

.result-info {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.result-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.result-title {
  margin: 0 0 0.25rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--ion-color-dark);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.result-channel {
  margin: 0;
  font-size: 0.85rem;
  color: var(--ion-color-medium);
}

.selection-icon {
  flex-shrink: 0;
  font-size: 1.5rem;
  cursor: pointer;
}

.no-results {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--ion-color-medium);
}

.no-results ion-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  display: block;
}

.youtube-action-buttons {
  margin-top: 1rem;
  padding: 0 0.5rem;
}

/* YouTube Preview in form */
.selected-youtube-preview {
  margin-top: 1rem;
}

.youtube-url-label {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  margin-bottom: 0.5rem;
}

.youtube-preview-frame {
  width: 100%;
  max-width: 300px;
  border-radius: 8px;
  overflow: hidden;
}

.youtube-preview-iframe {
  width: 100%;
  aspect-ratio: 16/9;
  border: none;
}

/* YouTube Video Preview Modal */
.video-preview-container {
  padding: 1rem;
}

.video-iframe {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.video-info {
  padding: 0 0.5rem;
}

.video-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--ion-color-dark);
}

.channel-name {
  margin: 0;
  font-size: 0.9rem;
  color: var(--ion-color-medium);
}

.preview-actions {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 0.75rem 1rem;
}

@media (max-width: 480px) {
  .result-thumbnail {
    width: 60px;
    height: 45px;
  }

  .result-title {
    font-size: 0.85rem;
  }

  .result-channel {
    font-size: 0.75rem;
  }

  .youtube-preview-frame {
    max-width: 100%;
  }
}
</style>