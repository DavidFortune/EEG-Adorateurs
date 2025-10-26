<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="isEditing ? `/team-detail/${teamId}` : '/teams'"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ isEditing ? 'Modifier l\'équipe' : 'Nouvelle équipe' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div v-if="loading" class="loading-container">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
        <p>{{ isEditing ? 'Chargement de l\'équipe...' : 'Initialisation...' }}</p>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="form-container">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Informations de l'équipe</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <!-- Team Icon -->
            <ion-item>
              <ion-label position="stacked">Icône de l'équipe</ion-label>
              <div class="icon-selector">
                <div class="selected-icon" @click="showIconPicker = true">
                  <ion-icon :icon="formData.icon || peopleOutline" class="preview-icon"></ion-icon>
                  <span>Choisir une icône</span>
                </div>
              </div>
            </ion-item>

            <!-- Team Name -->
            <ion-item>
              <ion-label position="stacked">Nom de l'équipe *</ion-label>
              <ion-input
                v-model="formData.name"
                type="text"
                placeholder="Ex: Musiciens"
                :class="{ 'ion-invalid': errors.name }"
                @ionBlur="validateField('name')"
              ></ion-input>
              <ion-note v-if="errors.name" slot="error">{{ errors.name }}</ion-note>
            </ion-item>

            <!-- Team Description -->
            <ion-item>
              <ion-label position="stacked">Description *</ion-label>
              <ion-textarea
                v-model="formData.description"
                placeholder="Décrivez le rôle et les responsabilités de cette équipe..."
                :rows="3"
                :class="{ 'ion-invalid': errors.description }"
                @ionBlur="validateField('description')"
              ></ion-textarea>
              <ion-note v-if="errors.description" slot="error">{{ errors.description }}</ion-note>
            </ion-item>
          </ion-card-content>
        </ion-card>

        <!-- Form Actions -->
        <div class="form-actions">
          <ion-button 
            expand="block" 
            type="submit" 
            :disabled="!isFormValid || submitting"
          >
            <ion-spinner v-if="submitting" name="crescent"></ion-spinner>
            <span v-else>{{ isEditing ? 'Mettre à jour' : 'Créer l\'équipe' }}</span>
          </ion-button>
          
          <ion-button 
            expand="block" 
            fill="outline" 
            @click="handleCancel"
            :disabled="submitting"
          >
            Annuler
          </ion-button>
        </div>
      </form>

      <!-- Icon Picker Modal -->
      <ion-modal :is-open="showIconPicker" @did-dismiss="showIconPicker = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Choisir une icône</ion-title>
            <ion-buttons slot="end">
              <ion-button fill="clear" @click="showIconPicker = false">
                <ion-icon :icon="closeOutline"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <div class="icon-grid">
            <div 
              v-for="icon in availableIcons" 
              :key="icon.name"
              class="icon-option"
              :class="{ 'selected': formData.icon === icon.icon }"
              @click="selectIcon(icon.icon)"
            >
              <ion-icon :icon="icon.icon" class="icon-preview"></ion-icon>
              <span class="icon-name">{{ icon.name }}</span>
            </div>
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, 
  IonButton, IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
  IonItem, IonLabel, IonInput, IonTextarea, IonNote, IonSpinner, IonModal,
  toastController
} from '@ionic/vue';
import {
  peopleOutline, musicalNotesOutline, micOutline, videocamOutline, 
  libraryOutline, peopleCircleOutline, heartOutline, handLeftOutline,
  constructOutline, leafOutline, starOutline, flashOutline, closeOutline,
  homeOutline, cafeOutline, balloonOutline, personOutline, megaphoneOutline,
  musicalNoteOutline, colorPaletteOutline, bookOutline, shieldCheckmarkOutline,
  businessOutline
} from 'ionicons/icons';
import { teamsService } from '@/firebase/teams';
import { useUser } from '@/composables/useUser';
import type { TeamFormData } from '@/types/team';

const router = useRouter();
const route = useRoute();
const { member: currentUser } = useUser();

const teamId = route.params.id as string;
const isEditing = !!teamId;

const loading = ref(true);
const submitting = ref(false);
const showIconPicker = ref(false);

const formData = reactive<TeamFormData>({
  name: '',
  description: '',
  icon: peopleOutline
});

const errors = reactive({
  name: '',
  description: ''
});

const availableIcons = [
  { name: 'Accueil', icon: homeOutline },
  { name: 'Audiovisuel', icon: videocamOutline },
  { name: 'Café', icon: cafeOutline },
  { name: 'Enfants', icon: balloonOutline },
  { name: 'Diacre', icon: personOutline },
  { name: 'Dirigeant (MC)', icon: megaphoneOutline },
  { name: 'Chorale', icon: peopleCircleOutline },
  { name: 'Louange', icon: musicalNotesOutline },
  { name: 'Musicien', icon: musicalNoteOutline },
  { name: 'Danse', icon: colorPaletteOutline },
  { name: 'Prédicateur', icon: bookOutline },
  { name: 'Sécurité', icon: shieldCheckmarkOutline },
  { name: 'Comité', icon: businessOutline },
  { name: 'Équipe', icon: peopleOutline },
  { name: 'Micro', icon: micOutline },
  { name: 'Lecture', icon: libraryOutline },
  { name: 'Cœur', icon: heartOutline },
  { name: 'Service', icon: handLeftOutline },
  { name: 'Technique', icon: constructOutline },
  { name: 'Croissance', icon: leafOutline },
  { name: 'Excellence', icon: starOutline },
  { name: 'Énergie', icon: flashOutline }
];

const isFormValid = computed(() => {
  return formData.name.trim() && 
         formData.description.trim() && 
         !errors.name && 
         !errors.description;
});

const validateField = (field: keyof typeof errors) => {
  errors[field] = '';
  
  switch (field) {
    case 'name':
      if (!formData.name.trim()) {
        errors.name = 'Le nom de l\'équipe est requis';
      } else if (formData.name.length < 2) {
        errors.name = 'Le nom doit contenir au moins 2 caractères';
      } else if (formData.name.length > 50) {
        errors.name = 'Le nom ne peut pas dépasser 50 caractères';
      }
      break;
      
    case 'description':
      if (!formData.description.trim()) {
        errors.description = 'La description est requise';
      } else if (formData.description.length < 10) {
        errors.description = 'La description doit contenir au moins 10 caractères';
      } else if (formData.description.length > 500) {
        errors.description = 'La description ne peut pas dépasser 500 caractères';
      }
      break;
  }
};

const validateForm = () => {
  validateField('name');
  validateField('description');
  return isFormValid.value;
};

const selectIcon = (icon: string) => {
  formData.icon = icon;
  showIconPicker.value = false;
};

const loadTeam = async () => {
  if (!isEditing) {
    loading.value = false;
    return;
  }
  
  try {
    const team = await teamsService.getTeamById(teamId);
    if (team) {
      formData.name = team.name;
      formData.description = team.description;
      formData.icon = team.icon;
    } else {
      throw new Error('Équipe non trouvée');
    }
  } catch (error) {
    console.error('Error loading team:', error);
    const toast = await toastController.create({
      message: 'Erreur lors du chargement de l\'équipe',
      duration: 3000,
      color: 'danger'
    });
    toast.present();
    router.back();
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  if (!validateForm() || !currentUser.value) return;
  
  submitting.value = true;
  
  try {
    if (isEditing) {
      await teamsService.updateTeam(teamId, formData);
      const toast = await toastController.create({
        message: 'Équipe mise à jour avec succès',
        duration: 3000,
        color: 'success'
      });
      toast.present();
      router.push(`/team-detail/${teamId}`);
    } else {
      const newTeam = await teamsService.createTeam(currentUser.value.id, formData);
      const toast = await toastController.create({
        message: 'Équipe créée avec succès',
        duration: 3000,
        color: 'success'
      });
      toast.present();
      router.push(`/team-detail/${newTeam.id}`);
    }
  } catch (error) {
    console.error('Error saving team:', error);
    const toast = await toastController.create({
      message: 'Erreur lors de la sauvegarde',
      duration: 3000,
      color: 'danger'
    });
    toast.present();
  } finally {
    submitting.value = false;
  }
};

const handleCancel = () => {
  if (isEditing) {
    router.push(`/team-detail/${teamId}`);
  } else {
    router.push('/teams');
  }
};

onMounted(() => {
  loadTeam();
});
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 1rem;
}

.loading-container ion-spinner {
  --color: var(--ion-color-primary);
  width: 3rem;
  height: 3rem;
}

.form-container {
  padding: 1rem;
}

.icon-selector {
  width: 100%;
  margin-top: 0.5rem;
}

.selected-icon {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px dashed #D1D5DB;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #F9FAFB;
}

.selected-icon:hover {
  border-color: var(--ion-color-primary);
  background: #F0F9FF;
}

.preview-icon {
  font-size: 2rem;
  color: var(--ion-color-primary);
}

.selected-icon span {
  color: #6B7280;
  font-weight: 500;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  padding: 1rem;
}

.icon-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border: 2px solid #E5E7EB;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.icon-option:hover {
  border-color: var(--ion-color-primary-tint);
  background: #F0F9FF;
}

.icon-option.selected {
  border-color: var(--ion-color-primary);
  background: #F0F9FF;
}

.icon-preview {
  font-size: 1.5rem;
  color: var(--ion-color-primary);
}

.icon-name {
  font-size: 0.75rem;
  color: #6B7280;
  text-align: center;
  font-weight: 500;
}

.ion-invalid {
  --border-color: var(--ion-color-danger);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .form-container {
    padding: 0.75rem;
  }
  
  .icon-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    padding: 0.75rem;
  }
  
  .icon-option {
    padding: 0.75rem;
  }
  
  .preview-icon {
    font-size: 1.75rem;
  }
}

@media (max-width: 480px) {
  .icon-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .selected-icon {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }
  
  .form-actions {
    margin-top: 1.5rem;
    gap: 0.75rem;
  }
}
</style>