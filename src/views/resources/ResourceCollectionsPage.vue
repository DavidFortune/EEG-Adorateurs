<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/resources"></ion-back-button>
        </ion-buttons>
        <ion-title>Collections de ressources</ion-title>
        <ion-buttons slot="end" v-if="isAdmin">
          <ion-button @click="createCollection" fill="clear">
            <ion-icon :icon="addOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content :fullscreen="true">
      <ion-loading :is-open="loading" message="Chargement..."></ion-loading>
      
      <div class="ion-padding">
        <div v-if="!loading && collections.length === 0" class="empty-state ion-text-center">
          <ion-icon :icon="folderOutline" size="large" color="medium" />
          <h2>Aucune collection</h2>
          <p>Les collections permettent d'organiser vos ressources par thème.</p>
          <ion-button v-if="isAdmin" @click="createCollection" fill="outline">
            <ion-icon :icon="addOutline" slot="start" />
            Créer une collection
          </ion-button>
        </div>
        
        <ion-list v-else>
          <ion-item
            v-for="collection in collections"
            :key="collection.id"
            button
            @click="viewCollection(collection)"
          >
            <ion-icon :icon="folderOutline" slot="start" />
            <ion-label>
              <h2>{{ collection.name }}</h2>
              <p v-if="collection.description">{{ collection.description }}</p>
              <p class="collection-count">{{ getResourceCount(collection.id) }} ressource{{ getResourceCount(collection.id) !== 1 ? 's' : '' }}</p>
            </ion-label>
            <ion-buttons slot="end" v-if="isAdmin">
              <ion-button @click.stop="editCollection(collection)" fill="clear">
                <ion-icon :icon="pencilOutline" slot="icon-only" />
              </ion-button>
            </ion-buttons>
          </ion-item>
        </ion-list>

        </div>

      <!-- Collection Form Modal -->
      <ion-modal :is-open="showModal" @didDismiss="showModal = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ editingCollection ? 'Modifier' : 'Créer' }} une collection</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showModal = false">Annuler</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-list>
            <ion-item>
              <ion-label position="stacked">Nom *</ion-label>
              <ion-input 
                v-model="form.name" 
                placeholder="Nom de la collection"
                @ionInput="onNameInput"
                required
              ></ion-input>
            </ion-item>
            
            <ion-item>
              <ion-label position="stacked">Symbole *</ion-label>
              <ion-input 
                v-model="form.symbol" 
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
                  :class="{ selected: form.color === color }"
                  :style="{ backgroundColor: color }"
                  @click="form.color = color"
                >
                  <ion-icon v-if="form.color === color" :icon="checkmarkOutline" class="check-icon" />
                </div>
              </div>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Type</ion-label>
              <ion-select
                :value="form.type"
                @ionChange="onTypeChange"
                interface="popover"
              >
                <ion-select-option
                  v-for="option in collectionTypeOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </ion-select-option>
              </ion-select>
            </ion-item>

            <!-- Owner display/selection button for non-core types -->
            <ion-item v-if="form.type !== CollectionType.CORE" button @click="form.type === CollectionType.TEAM ? openTeamSelector() : form.type === CollectionType.SERVICE ? openServiceSelector() : openUserSelector()">
              <ion-icon
                :icon="form.type === CollectionType.TEAM ? peopleOutline : form.type === CollectionType.SERVICE ? calendarOutline : personOutline"
                slot="start"
              />
              <ion-label>
                <p>{{ form.type === CollectionType.TEAM ? 'Équipe' : form.type === CollectionType.SERVICE ? 'Service' : 'Utilisateur' }}</p>
                <h2 v-if="form.ownerName">{{ form.ownerName }}</h2>
                <h2 v-else class="placeholder-text">Sélectionner...</h2>
              </ion-label>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Description</ion-label>
              <ion-textarea
                v-model="form.description"
                placeholder="Description de la collection"
                :rows="3"
              ></ion-textarea>
            </ion-item>
          </ion-list>
          
          <div class="modal-actions">
            <ion-button @click="saveCollection" expand="block" :disabled="!form.name?.trim() || !form.symbol?.trim() || !form.color">
              {{ editingCollection ? 'Modifier' : 'Créer' }}
            </ion-button>
            
            <ion-button 
              v-if="editingCollection" 
              @click="confirmDelete" 
              expand="block" 
              color="danger" 
              fill="outline"
            >
              Supprimer
            </ion-button>
          </div>
        </ion-content>
      </ion-modal>

      <!-- Team Selector Modal -->
      <ion-modal :is-open="showTeamSelector" @didDismiss="cancelTeamSelection">
        <ion-header>
          <ion-toolbar>
            <ion-title>Sélectionner une équipe</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="cancelTeamSelection">Annuler</ion-button>
            </ion-buttons>
          </ion-toolbar>
          <ion-toolbar>
            <ion-searchbar
              v-model="teamSearchQuery"
              placeholder="Rechercher..."
              :debounce="300"
            ></ion-searchbar>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <p class="selector-instruction">Cliquez sur l'équipe à associer avec cette collection</p>
          <ion-list>
            <ion-item v-for="team in filteredTeams" :key="team.id" button @click="selectTeam(team)">
              <ion-icon :icon="peopleOutline" slot="start" />
              <ion-label>
                <h2>{{ team.name }}</h2>
                <p v-if="team.description">{{ team.description }}</p>
              </ion-label>
            </ion-item>
            <ion-item v-if="filteredTeams.length === 0">
              <ion-label class="ion-text-center">
                <p>Aucune équipe trouvée</p>
              </ion-label>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>

      <!-- Service Selector Modal -->
      <ion-modal :is-open="showServiceSelector" @didDismiss="cancelServiceSelection">
        <ion-header>
          <ion-toolbar>
            <ion-title>Sélectionner un service</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="cancelServiceSelection">Annuler</ion-button>
            </ion-buttons>
          </ion-toolbar>
          <ion-toolbar>
            <ion-searchbar
              v-model="serviceSearchQuery"
              placeholder="Rechercher..."
              :debounce="300"
            ></ion-searchbar>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <p class="selector-instruction">Cliquez sur le service à associer avec cette collection</p>
          <ion-list>
            <ion-item v-for="service in filteredServices" :key="service.id" button @click="selectService(service)">
              <ion-icon :icon="calendarOutline" slot="start" />
              <ion-label>
                <h2>{{ service.title }}</h2>
                <p>{{ service.date }} à {{ service.time }}</p>
              </ion-label>
            </ion-item>
            <ion-item v-if="filteredServices.length === 0">
              <ion-label class="ion-text-center">
                <p>Aucun service trouvé</p>
              </ion-label>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>

      <!-- User Selector Modal -->
      <ion-modal :is-open="showUserSelector" @didDismiss="cancelUserSelection">
        <ion-header>
          <ion-toolbar>
            <ion-title>Sélectionner un utilisateur</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="cancelUserSelection">Annuler</ion-button>
            </ion-buttons>
          </ion-toolbar>
          <ion-toolbar>
            <ion-searchbar
              v-model="userSearchQuery"
              placeholder="Rechercher..."
              :debounce="300"
            ></ion-searchbar>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <p class="selector-instruction">Cliquez sur l'utilisateur à associer avec cette collection</p>
          <ion-list>
            <ion-item v-for="member in filteredMembers" :key="member.id" button @click="selectUser(member)">
              <ion-icon :icon="personOutline" slot="start" />
              <ion-label>
                <h2>{{ member.fullName }}</h2>
                <p>{{ member.email }}</p>
              </ion-label>
            </ion-item>
            <ion-item v-if="filteredMembers.length === 0">
              <ion-label class="ion-text-center">
                <p>Aucun utilisateur trouvé</p>
              </ion-label>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonList, IonItem, IonLabel, IonInput, IonTextarea,
  IonModal, IonLoading, IonNote, IonSelect, IonSelectOption, IonSearchbar,
  toastController, alertController
} from '@ionic/vue';
import {
  addOutline, folderOutline, pencilOutline, checkmarkOutline, peopleOutline,
  calendarOutline, personOutline
} from 'ionicons/icons';
import { ResourceCollection, CollectionType } from '@/types/resource';
import {
  getResourceCollections,
  createResourceCollection as createCollectionService,
  updateResourceCollection,
  deleteResourceCollection,
  getResourcesByCollection,
  generateUniqueSymbol,
  COLLECTION_COLORS,
  getRandomColor
} from '@/firebase/resources';
import { teamsService } from '@/firebase/teams';
import { firestoreService } from '@/firebase/firestore';
import { membersService } from '@/firebase/members';
import { useUser } from '@/composables/useUser';
import type { Team } from '@/types/team';
import type { Service } from '@/types/service';
import type { Member } from '@/types/member';

const router = useRouter();
const { isAdmin } = useUser();

const loading = ref(false);
const showModal = ref(false);
const collections = ref<ResourceCollection[]>([]);
const resourceCounts = ref<Record<string, number>>({});
const editingCollection = ref<ResourceCollection | null>(null);

const form = ref<Partial<ResourceCollection>>({
  name: '',
  symbol: '',
  color: '#b5121b',
  type: CollectionType.CORE,
  description: '',
  ownerId: undefined,
  ownerName: undefined
});

// Entity selector modals
const showTeamSelector = ref(false);
const showServiceSelector = ref(false);
const showUserSelector = ref(false);

// Entity data
const teams = ref<Team[]>([]);
const services = ref<Service[]>([]);
const members = ref<Member[]>([]);

// Search filters
const teamSearchQuery = ref('');
const serviceSearchQuery = ref('');
const userSearchQuery = ref('');

// Selected entities
const selectedTeamId = ref<string | null>(null);
const selectedServiceId = ref<string | null>(null);
const selectedUserId = ref<string | null>(null);

// Collection type options
const collectionTypeOptions = [
  { value: CollectionType.CORE, label: 'Principal' },
  { value: CollectionType.TEAM, label: 'Équipe' },
  { value: CollectionType.SERVICE, label: 'Service' },
  { value: CollectionType.USER, label: 'Utilisateur' }
];


const loadCollections = async () => {
  loading.value = true;
  try {
    collections.value = await getResourceCollections();
    
    // Load resource counts for each collection
    for (const collection of collections.value) {
      const resources = await getResourcesByCollection(collection.id);
      resourceCounts.value[collection.id] = resources.length;
    }
  } catch (error) {
    console.error('Error loading collections:', error);
  } finally {
    loading.value = false;
  }
};

const getResourceCount = (collectionId: string) => {
  return resourceCounts.value[collectionId] || 0;
};

const createCollection = () => {
  editingCollection.value = null;
  form.value = {
    name: '',
    symbol: '',
    color: getRandomColor(),
    type: CollectionType.CORE,
    description: '',
    ownerId: undefined,
    ownerName: undefined
  };
  selectedTeamId.value = null;
  selectedServiceId.value = null;
  selectedUserId.value = null;
  showModal.value = true;
};

const editCollection = (collection: ResourceCollection) => {
  editingCollection.value = collection;
  form.value = {
    name: collection.name,
    symbol: collection.symbol,
    color: collection.color,
    type: collection.type || CollectionType.CORE,
    description: collection.description,
    ownerId: collection.ownerId,
    ownerName: collection.ownerName
  };
  // Set the selected entity based on type
  selectedTeamId.value = collection.type === CollectionType.TEAM ? collection.ownerId || null : null;
  selectedServiceId.value = collection.type === CollectionType.SERVICE ? collection.ownerId || null : null;
  selectedUserId.value = collection.type === CollectionType.USER ? collection.ownerId || null : null;
  showModal.value = true;
};

const viewCollection = (collection: ResourceCollection) => {
  router.push({
    path: '/resources',
    query: { collection: collection.id }
  });
};

const saveCollection = async () => {
  if (!form.value.name?.trim() || !form.value.symbol?.trim() || !form.value.color) return;

  // Validate that owner is selected for non-core types
  const collectionType = form.value.type || CollectionType.CORE;
  if (collectionType !== CollectionType.CORE && !form.value.ownerId) {
    const toast = await toastController.create({
      message: 'Veuillez sélectionner un propriétaire pour ce type de collection',
      duration: 2000,
      color: 'warning'
    });
    await toast.present();
    return;
  }

  try {
    if (editingCollection.value) {
      const updateData: any = {
        name: form.value.name.trim(),
        symbol: form.value.symbol.trim(),
        color: form.value.color,
        type: collectionType
      };

      // Only add description if it has a value
      if (form.value.description?.trim()) {
        updateData.description = form.value.description.trim();
      }

      // Add owner info for non-core types
      if (collectionType !== CollectionType.CORE) {
        updateData.ownerId = form.value.ownerId;
        updateData.ownerName = form.value.ownerName;
      } else {
        // Remove owner info if switching to core type
        updateData.ownerId = null;
        updateData.ownerName = null;
      }

      await updateResourceCollection(editingCollection.value.id, updateData);
    } else {
      const collectionData: any = {
        name: form.value.name.trim(),
        symbol: form.value.symbol.trim(),
        color: form.value.color,
        type: collectionType
      };

      // Only add description if it has a value
      if (form.value.description?.trim()) {
        collectionData.description = form.value.description.trim();
      }

      // Add owner info for non-core types
      if (collectionType !== CollectionType.CORE && form.value.ownerId) {
        collectionData.ownerId = form.value.ownerId;
        collectionData.ownerName = form.value.ownerName;
      }

      await createCollectionService(collectionData);
    }
    
    const toast = await toastController.create({
      message: editingCollection.value ? 'Collection modifiée' : 'Collection créée',
      duration: 2000,
      color: 'success'
    });
    await toast.present();
    
    showModal.value = false;
    loadCollections();
  } catch (error) {
    console.error('Error saving collection:', error);
    const toast = await toastController.create({
      message: 'Erreur lors de la sauvegarde',
      duration: 2000,
      color: 'danger'
    });
    await toast.present();
  }
};

const confirmDelete = async () => {
  if (!editingCollection.value) return;
  
  const resourceCount = getResourceCount(editingCollection.value.id);
  
  const alert = await alertController.create({
    header: 'Confirmer la suppression',
    message: resourceCount > 0 
      ? `Cette collection contient ${resourceCount} ressource${resourceCount > 1 ? 's' : ''}. Vous ne pouvez pas la supprimer.`
      : 'Êtes-vous sûr de vouloir supprimer cette collection ?',
    buttons: resourceCount > 0 
      ? [{ text: 'OK', role: 'cancel' }]
      : [
          { text: 'Annuler', role: 'cancel' },
          {
            text: 'Supprimer',
            role: 'destructive',
            handler: async () => {
              try {
                await deleteResourceCollection(editingCollection.value!.id);
                const toast = await toastController.create({
                  message: 'Collection supprimée',
                  duration: 2000,
                  color: 'success'
                });
                await toast.present();
                showModal.value = false;
                loadCollections();
              } catch (error) {
                console.error('Error deleting collection:', error);
                const toast = await toastController.create({
                  message: 'Erreur lors de la suppression',
                  duration: 2000,
                  color: 'danger'
                });
                await toast.present();
              }
            }
          }
        ]
  });
  
  await alert.present();
};

const onNameInput = async (event: any) => {
  const name = event.target.value;
  if (name && name.trim().length > 0) {
    try {
      const uniqueSymbol = await generateUniqueSymbol(name, editingCollection.value?.id);
      form.value.symbol = uniqueSymbol;
    } catch (error) {
      console.error('Error generating symbol:', error);
    }
  } else {
    form.value.symbol = '';
  }
};

// Handle collection type change
const onTypeChange = async (event: any) => {
  const newType = event.detail.value as CollectionType;
  form.value.type = newType;

  // Reset owner info when type changes
  form.value.ownerId = undefined;
  form.value.ownerName = undefined;
  selectedTeamId.value = null;
  selectedServiceId.value = null;
  selectedUserId.value = null;

  // Open appropriate selector modal
  if (newType === CollectionType.TEAM) {
    await loadTeams();
    showTeamSelector.value = true;
  } else if (newType === CollectionType.SERVICE) {
    await loadServices();
    showServiceSelector.value = true;
  } else if (newType === CollectionType.USER) {
    await loadMembers();
    showUserSelector.value = true;
  }
};

// Load entities
const loadTeams = async () => {
  try {
    teams.value = await teamsService.getAllTeams();
  } catch (error) {
    console.error('Error loading teams:', error);
  }
};

const loadServices = async () => {
  try {
    services.value = await firestoreService.getAllServices();
  } catch (error) {
    console.error('Error loading services:', error);
  }
};

const loadMembers = async () => {
  try {
    members.value = await membersService.getAllMembers();
  } catch (error) {
    console.error('Error loading members:', error);
  }
};

// Filtered entities based on search
const filteredTeams = computed(() => {
  if (!teamSearchQuery.value.trim()) return teams.value;
  const query = teamSearchQuery.value.toLowerCase();
  return teams.value.filter(team =>
    team.name.toLowerCase().includes(query)
  );
});

const filteredServices = computed(() => {
  if (!serviceSearchQuery.value.trim()) return services.value;
  const query = serviceSearchQuery.value.toLowerCase();
  return services.value.filter(service =>
    service.title.toLowerCase().includes(query) ||
    service.date.includes(query)
  );
});

const filteredMembers = computed(() => {
  if (!userSearchQuery.value.trim()) return members.value;
  const query = userSearchQuery.value.toLowerCase();
  return members.value.filter(member =>
    member.fullName.toLowerCase().includes(query) ||
    member.email.toLowerCase().includes(query)
  );
});

// Open selector modals (for button click)
const openTeamSelector = async () => {
  await loadTeams();
  teamSearchQuery.value = '';
  showTeamSelector.value = true;
};

const openServiceSelector = async () => {
  await loadServices();
  serviceSearchQuery.value = '';
  showServiceSelector.value = true;
};

const openUserSelector = async () => {
  await loadMembers();
  userSearchQuery.value = '';
  showUserSelector.value = true;
};

// Direct entity selection (click to select and close)
const selectTeam = (team: Team) => {
  form.value.ownerId = team.id;
  form.value.ownerName = team.name;
  selectedTeamId.value = team.id;
  showTeamSelector.value = false;
};

const selectService = (service: Service) => {
  form.value.ownerId = service.id;
  form.value.ownerName = `${service.title} (${service.date})`;
  selectedServiceId.value = service.id;
  showServiceSelector.value = false;
};

const selectUser = (member: Member) => {
  form.value.ownerId = member.id;
  form.value.ownerName = member.fullName;
  selectedUserId.value = member.id;
  showUserSelector.value = false;
};

// Cancel entity selection
const cancelTeamSelection = () => {
  // If no owner was selected, reset type to core
  if (!form.value.ownerId) {
    form.value.type = CollectionType.CORE;
  }
  showTeamSelector.value = false;
};

const cancelServiceSelection = () => {
  if (!form.value.ownerId) {
    form.value.type = CollectionType.CORE;
  }
  showServiceSelector.value = false;
};

const cancelUserSelection = () => {
  if (!form.value.ownerId) {
    form.value.type = CollectionType.CORE;
  }
  showUserSelector.value = false;
};

onMounted(() => {
  loadCollections();
});
</script>

<style scoped>
.empty-state {
  padding: 2rem;
}

.empty-state ion-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h2 {
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--ion-color-medium);
  margin-bottom: 1.5rem;
}

.collection-count {
  color: var(--ion-color-medium);
  font-size: 0.875rem;
}

.modal-actions {
  padding: 1rem;
}

.modal-actions ion-button {
  margin-bottom: 0.5rem;
}

ion-item {
  --padding-start: 0;
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

.placeholder-text {
  color: var(--ion-color-medium);
  font-style: italic;
}

.selector-instruction {
  padding: 12px 16px;
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 0.875rem;
  background: var(--ion-color-light);
  border-bottom: 1px solid var(--ion-color-light-shade);
}
</style>