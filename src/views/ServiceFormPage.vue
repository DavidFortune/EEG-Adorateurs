<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="backUrl"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ isEditing ? 'Modifier' : 'Créer' }} un Service</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="saveService" :disabled="!isFormValid || loading">
            <ion-icon :icon="checkmark" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content :fullscreen="true">
      <ion-loading :is-open="loading" message="Sauvegarde..."></ion-loading>
      
      <form @submit.prevent="saveService" class="ion-padding">
        <ion-list>
          <ion-item>
            <ion-input 
              v-model="formData.title"
              label="Titre du service"
              label-placement="stacked"
              placeholder="Entrez le titre"
              :counter="true"
              :maxlength="100"
              required
            />
          </ion-item>
          
          <ion-item>
            <ion-datetime 
              v-model="formData.date"
              display-format="DD/MM/YYYY"
              picker-format="DD/MM/YYYY"
              :min="minDate"
              presentation="date"
              locale="fr-FR"
            >
              <ion-label slot="title">Date du service</ion-label>
            </ion-datetime>
          </ion-item>
          
          <ion-item>
            <ion-datetime
              v-model="formData.time"
              display-format="HH:mm"
              picker-format="HH:mm"
              presentation="time"
              locale="fr-FR"
            >
              <ion-label slot="title">Heure du service</ion-label>
            </ion-datetime>
          </ion-item>
          
          <ion-item>
            <ion-select 
              v-model="formData.category"
              label="Catégorie"
              label-placement="stacked"
              placeholder="Sélectionnez une catégorie"
              interface="popover"
            >
              <ion-select-option 
                v-for="category in categories" 
                :key="category.value" 
                :value="category.value"
              >
                {{ category.label }}
              </ion-select-option>
            </ion-select>
          </ion-item>
          
          <ion-item>
            <ion-toggle v-model="formData.isPublished" />
            <ion-label class="ion-margin-start">
              <h3>Publier immédiatement</h3>
              <p>Le service sera visible publiquement</p>
            </ion-label>
          </ion-item>
        </ion-list>
        
        <div class="ion-padding-top">
          <ion-button 
            expand="block" 
            type="submit" 
            :disabled="!isFormValid || loading"
            color="primary"
          >
            <ion-icon :icon="checkmark" slot="start" />
            {{ isEditing ? 'Mettre à jour' : 'Créer' }} le service
          </ion-button>
          
          <ion-button 
            expand="block" 
            fill="outline" 
            @click="cancel"
            class="ion-margin-top"
          >
            <ion-icon :icon="closeOutline" slot="start" />
            Annuler
          </ion-button>
        </div>
      </form>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonList, IonItem, IonInput, IonDatetime, IonSelect,
  IonSelectOption, IonToggle, IonLabel, IonLoading, toastController
} from '@ionic/vue';
import { checkmark, closeOutline } from 'ionicons/icons';
import { Service, ServiceCategory, CreateServiceRequest, UpdateServiceRequest } from '@/types/service';
import { serviceService } from '@/services/serviceService';
import { timezoneUtils } from '@/utils/timezone';

const route = useRoute();
const router = useRouter();
const loading = ref(false);

const isEditing = computed(() => !!route.params.id);
const backUrl = computed(() => 
  isEditing.value ? `/service-detail/${route.params.id}` : '/tabs/services'
);

const categories = Object.values(ServiceCategory).map(category => ({
  value: category,
  label: category
}));

const minDate = computed(() => {
  return timezoneUtils.getMinDate();
});

const formData = reactive({
  title: '',
  date: minDate.value,
  time: '10:00',
  category: ServiceCategory.SERVICE,
  isPublished: false
});

const isFormValid = computed(() => {
  return formData.title.trim().length > 0 &&
         formData.date &&
         formData.time &&
         formData.category;
});

const loadService = async () => {
  if (!isEditing.value) return;
  
  const id = route.params.id as string;
  loading.value = true;
  
  try {
    const service = await serviceService.getServiceById(id);
    if (service) {
      formData.title = service.title;
      formData.date = service.date;
      formData.time = service.time;
      formData.category = service.category;
      formData.isPublished = service.isPublished;
    }
  } catch (error) {
    console.error('Error loading service:', error);
    await showToast('Erreur lors du chargement du service', 'danger');
  } finally {
    loading.value = false;
  }
};

const saveService = async () => {
  if (!isFormValid.value) return;
  
  loading.value = true;
  
  try {
    if (isEditing.value) {
      const updateRequest: UpdateServiceRequest = {
        id: route.params.id as string,
        title: formData.title.trim(),
        date: formData.date,
        time: formData.time,
        category: formData.category,
        isPublished: formData.isPublished
      };
      
      const updated = await serviceService.updateService(updateRequest);
      if (updated) {
        await showToast('Service mis à jour avec succès', 'success');
        router.push(`/service-detail/${updated.id}`);
      }
    } else {
      const createRequest: CreateServiceRequest = {
        title: formData.title.trim(),
        date: formData.date,
        time: formData.time,
        category: formData.category,
        isPublished: formData.isPublished
      };
      
      const created = await serviceService.createService(createRequest);
      await showToast('Service créé avec succès', 'success');
      router.push(`/service-detail/${created.id}`);
    }
  } catch (error) {
    console.error('Error saving service:', error);
    await showToast('Erreur lors de la sauvegarde', 'danger');
  } finally {
    loading.value = false;
  }
};

const cancel = () => {
  router.push(backUrl.value);
};

const showToast = async (message: string, color: string) => {
  const toast = await toastController.create({
    message,
    duration: 2000,
    color
  });
  
  await toast.present();
};

onMounted(() => {
  loadService();
});
</script>