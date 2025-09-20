<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/accueil"></ion-back-button>
        </ion-buttons>
        <ion-title>Mon compte</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="account-content">
      <div class="account-container">
        <!-- Loading State -->
        <div v-if="loading" class="loading-container">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p>Chargement...</p>
        </div>

        <!-- Account Form -->
        <div v-else class="account-form">
          <!-- Profile Section -->
          <div class="profile-section">
            <div class="avatar-container">
              <div class="avatar">
                <img v-if="member?.avatar" :src="member.avatar" :alt="member.fullName" />
                <div v-else class="initials-avatar">
                  <span class="initials">{{ initials }}</span>
                </div>
              </div>
            </div>
            <h2>{{ member?.fullName || 'Utilisateur' }}</h2>
            <p class="email">{{ member?.email }}</p>
          </div>

          <!-- Full Name Section -->
          <div class="form-section">
            <ion-item>
              <ion-label position="stacked">Nom complet *</ion-label>
              <ion-input
                v-model="formData.fullName"
                type="text"
                placeholder="Entrez votre nom complet"
                :class="{ 'ion-invalid': !isFullNameValid }"
              ></ion-input>
              <ion-note slot="error" v-if="!isFullNameValid">Le nom complet est requis</ion-note>
            </ion-item>
          </div>

          <!-- Phone Section -->
          <div class="form-section">
            <ion-item>
              <ion-label position="stacked">Numéro de téléphone</ion-label>
              <ion-input
                v-model="formData.phone"
                type="tel"
                placeholder="(438) 123-4567"
                :class="{ 'ion-invalid': !isPhoneValid && formData.phone.trim() }"
                @ionInput="handlePhoneInput"
              ></ion-input>
              <ion-note slot="error" v-if="!isPhoneValid && formData.phone.trim()">Veuillez entrer un numéro de téléphone valide</ion-note>
              <ion-note>Format: +1 (438) 123-4567 ou 438-123-4567</ion-note>
            </ion-item>
          </div>

          <!-- Ministries Section -->
          <div class="form-section">
            <div class="section-header">
              <h3>Mes ministères</h3>
              <p class="section-description">Sélectionnez les ministères dans lesquels vous servez</p>
            </div>

            <!-- Available Ministries -->
            <div class="ministries-list" v-if="availableMinistries.length > 0">
              <ion-item v-for="ministry in availableMinistries" :key="ministry.id">
                <ion-checkbox
                  slot="start"
                  :checked="selectedMinistries.includes(ministry.name)"
                  @ionChange="toggleMinistry(ministry.name)"
                ></ion-checkbox>
                <ion-label class="ministry-label">{{ ministry.name }}</ion-label>
              </ion-item>
            </div>

            <!-- Custom Ministry -->
            <div class="custom-ministry">
              <ion-item>
                <ion-label position="stacked">Autre ministère</ion-label>
                <ion-input
                  v-model="formData.customMinistry"
                  type="text"
                  placeholder="Ajoutez un nouveau ministère"
                ></ion-input>
              </ion-item>
            </div>

            <!-- Selected Count -->
            <div class="ministry-count">
              <ion-note>
                {{ selectedMinistriesCount }} ministère{{ selectedMinistriesCount !== 1 ? 's' : '' }} sélectionné{{ selectedMinistriesCount !== 1 ? 's' : '' }}
              </ion-note>
            </div>
          </div>

          <!-- Save Button -->
          <div class="save-section">
            <ion-button
              expand="block"
              color="primary"
              size="large"
              @click="saveChanges"
              :disabled="!canSave || saving"
            >
              <ion-spinner v-if="saving" name="crescent" slot="start"></ion-spinner>
              {{ saving ? 'Sauvegarde...' : 'Enregistrer les modifications' }}
            </ion-button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonItem, IonLabel, IonInput, IonNote, IonCheckbox, IonButton, IonSpinner,
  toastController, alertController
} from '@ionic/vue';
import { authService } from '@/firebase/auth';
import { membersService } from '@/firebase/members';
import { ministriesService } from '@/firebase/ministries';
import type { Member, Ministry } from '@/types/member';

const router = useRouter();

// State
const loading = ref(true);
const saving = ref(false);
const member = ref<Member | null>(null);
const availableMinistries = ref<Ministry[]>([]);

// Form Data
const formData = ref({
  fullName: '',
  phone: '',
  customMinistry: ''
});

const selectedMinistries = ref<string[]>([]);

// Computed
const initials = computed(() => {
  if (!member.value?.fullName) return '??';
  const names = member.value.fullName.trim().split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
});

const isFullNameValid = computed(() => {
  return formData.value.fullName.trim().length > 0;
});

const isPhoneValid = computed(() => {
  const trimmed = formData.value.phone.trim();
  if (trimmed === '') return true; // Phone is optional

  // Basic phone validation - accepts various formats
  const phoneRegex = /^(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
  return phoneRegex.test(trimmed);
});

const selectedMinistriesCount = computed(() => {
  const ministries = selectedMinistries.value.length;
  const customMinistryName = formData.value.customMinistry.trim();
  const custom = (customMinistryName && !selectedMinistries.value.includes(customMinistryName)) ? 1 : 0;
  return ministries + custom;
});

const canSave = computed(() => {
  return isFullNameValid.value && selectedMinistriesCount.value > 0 && isPhoneValid.value;
});

const hasChanges = computed(() => {
  if (!member.value) return false;
  
  // Check if full name changed
  const fullNameChanged = formData.value.fullName.trim() !== member.value.fullName;

  // Check if phone changed
  const phoneChanged = formData.value.phone.trim() !== (member.value.phone || '');
  
  // Check if ministries changed
  const currentMinistries = [...selectedMinistries.value];
  const customMinistryName = formData.value.customMinistry.trim();
  
  // Only add custom ministry if it's not empty and not already in the list
  if (customMinistryName && !currentMinistries.includes(customMinistryName)) {
    currentMinistries.push(customMinistryName);
  }
  
  const originalMinistries = member.value.ministries || [];
  const ministriesChanged = 
    currentMinistries.length !== originalMinistries.length ||
    currentMinistries.some(ministry => !originalMinistries.includes(ministry)) ||
    originalMinistries.some(ministry => !currentMinistries.includes(ministry));
  
  return fullNameChanged || phoneChanged || ministriesChanged;
});

// Methods
const showToast = async (message: string, color: 'success' | 'danger' = 'success') => {
  const toast = await toastController.create({
    message,
    duration: 3000,
    position: 'top',
    color
  });
  await toast.present();
};

const applyPhoneMask = (value: string): string => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');

  // Apply mask based on number of digits
  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  } else if (digits.length <= 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
  } else {
    // Limit to 10 digits for local format
    const limitedDigits = digits.slice(0, 10);
    return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`;
  }
};

const handlePhoneInput = (event: any) => {
  const inputValue = event.target.value;
  const maskedValue = applyPhoneMask(inputValue);
  formData.value.phone = maskedValue;
};

const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');

  // Handle different cases
  if (digits.length === 10) {
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return phoneNumber; // Return as-is if it doesn't match expected patterns
};

const toggleMinistry = (ministryName: string) => {
  const index = selectedMinistries.value.indexOf(ministryName);
  if (index > -1) {
    selectedMinistries.value.splice(index, 1);
  } else {
    selectedMinistries.value.push(ministryName);
  }
};

const loadUserData = async () => {
  try {
    const user = authService.getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // Load member data
    const memberData = await membersService.getMemberByFirebaseUserId(user.uid);
    if (!memberData) {
      await showToast('Impossible de charger les données du profil', 'danger');
      return;
    }

    member.value = memberData;
    
    // Populate form
    formData.value.fullName = memberData.fullName || '';
    formData.value.phone = memberData.phone ? applyPhoneMask(memberData.phone) : '';
    selectedMinistries.value = [...(memberData.ministries || [])];

    // Load available ministries
    availableMinistries.value = await ministriesService.getAllMinistries();
  } catch (error) {
    console.error('Error loading user data:', error);
    await showToast('Erreur lors du chargement des données', 'danger');
  } finally {
    loading.value = false;
  }
};

const saveChanges = async () => {
  if (!member.value || !canSave.value) return;

  // Check if there are changes
  if (!hasChanges.value) {
    await showToast('Aucune modification à enregistrer');
    return;
  }

  saving.value = true;

  try {
    // Prepare ministries array
    const ministries = [...selectedMinistries.value];
    const customMinistryName = formData.value.customMinistry.trim();
    
    // Only add custom ministry if it's not empty and not already in the list
    if (customMinistryName && !ministries.includes(customMinistryName)) {
      ministries.push(customMinistryName);
    }

    // Extract firstName and lastName from fullName
    const nameParts = formData.value.fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Format phone number if provided
    const formattedPhone = formData.value.phone.trim() ? formatPhoneNumber(formData.value.phone.trim()) : '';

    // Update member
    await membersService.updateMember(member.value.id, {
      firstName,
      lastName,
      fullName: formData.value.fullName.trim(),
      phone: formattedPhone,
      ministries
    });

    // Update local member data
    member.value = {
      ...member.value,
      firstName,
      lastName,
      fullName: formData.value.fullName.trim(),
      phone: formattedPhone,
      ministries
    };

    // Update form data with formatted phone
    formData.value.phone = formattedPhone;

    // Clear custom ministry field after saving
    formData.value.customMinistry = '';

    await showToast('Profil mis à jour avec succès !');
  } catch (error) {
    console.error('Error saving changes:', error);
    await showToast('Erreur lors de la sauvegarde', 'danger');
  } finally {
    saving.value = false;
  }
};

const confirmNavigation = async () => {
  if (hasChanges.value) {
    const alert = await alertController.create({
      header: 'Modifications non sauvegardées',
      message: 'Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter sans sauvegarder ?',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Quitter sans sauvegarder',
          handler: () => {
            router.back();
          }
        }
      ]
    });
    await alert.present();
  } else {
    router.back();
  }
};

// Lifecycle
onMounted(() => {
  loadUserData();
});
</script>

<style scoped>
.account-content {
  --background: #F9FAFB;
}

.account-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 1rem;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
  gap: 1rem;
}

.loading-container ion-spinner {
  --color: #b5121b;
  width: 3rem;
  height: 3rem;
}

.loading-container p {
  color: #6B7280;
  font-weight: 500;
}

.account-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.profile-section {
  text-align: center;
  padding: 2rem 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.avatar-container {
  margin-bottom: 1rem;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin: 0 auto;
  overflow: hidden;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.initials-avatar {
  background: #b5121b;
  color: white;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.initials {
  font-size: 2rem;
  font-weight: 600;
}

.profile-section h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.email {
  color: #6B7280;
  font-size: 0.875rem;
  margin: 0.5rem 0 0 0;
}

.form-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-header {
  margin-bottom: 1.5rem;
}

.section-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.section-description {
  color: #6B7280;
  font-size: 0.875rem;
  margin: 0;
}

.ministries-list {
  margin-bottom: 1rem;
}

.ministry-label {
  margin-left: 0.75rem;
}

.custom-ministry {
  border-top: 1px solid #E5E7EB;
  padding-top: 1rem;
  margin-top: 1rem;
}

.ministry-count {
  text-align: center;
  padding-top: 1rem;
}

.save-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

ion-button {
  --background: #b5121b;
  --background-hover: #9f1018;
  height: 3rem;
  font-weight: 600;
}

ion-button[disabled] {
  --background: #D1D5DB;
  --color: #9CA3AF;
}

ion-item {
  --background: transparent;
  --border-color: #E5E7EB;
}

ion-input {
  --color: #111827;
}

ion-input.ion-invalid {
  --color: #EF4444;
}

ion-checkbox {
  --color: #b5121b;
  --color-checked: #b5121b;
}

@media (max-width: 768px) {
  .account-container {
    padding: 0.5rem;
  }
  
  .form-section {
    padding: 1rem;
  }
  
  .save-section {
    padding: 1rem;
  }
}
</style>