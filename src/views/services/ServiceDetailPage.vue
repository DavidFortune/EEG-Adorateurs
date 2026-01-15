<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="goBack">
            <ion-icon slot="icon-only" :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Détail du Service</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="shareService" fill="clear">
            <ion-icon :icon="shareOutline" />
          </ion-button>
          <ion-button v-if="isAdmin" @click="openAdminActions" fill="clear">
            <ion-icon :icon="ellipsisVertical" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-loading :is-open="loading" message="Chargement..."></ion-loading>

      <div v-if="service">
        <!-- Service Info Header -->
        <ServiceInfoHeader :service="service" />

        <!-- Segment Tabs -->
        <ion-segment v-model="selectedSegment" class="segment-tabs">
          <ion-segment-button value="programme">
            <ion-icon :icon="listOutline" class="segment-icon" />
            <ion-label class="segment-label">Programme</ion-label>
          </ion-segment-button>
          <ion-segment-button value="ressources">
            <ion-icon :icon="musicalNotesOutline" class="segment-icon" />
            <ion-label class="segment-label">Ressources</ion-label>
          </ion-segment-button>
          <ion-segment-button value="members">
            <ion-icon :icon="peopleOutline" class="segment-icon" />
            <ion-label class="segment-label">Membres</ion-label>
          </ion-segment-button>
        </ion-segment>

        <!-- Tab Content -->
        <div class="tab-content">
          <!-- Programme Tab -->
          <ProgramOverview
            v-if="selectedSegment === 'programme'"
            :program="program"
            :loading="loadingProgram"
            :is-admin="isAdmin"
            :can-view="canViewProgram"
            @view-full="goToProgram"
          />

          <!-- Ressources Tab -->
          <ResourcesOverview
            v-if="selectedSegment === 'ressources'"
            :resources="resources"
            :loading="loadingResources"
            :service-id="service?.id || ''"
            :is-admin="isAdmin"
            :existing-resource-ids="existingResourceIds"
            @add-resources="handleAddResources"
          />

          <!-- Members Tab -->
          <MembersOverview
            v-if="selectedSegment === 'members'"
            :team-assignments="teamAssignments"
            :guest-members="guestMembers"
            :loading="loadingMembers"
          />
        </div>
      </div>

      <div v-else-if="!loading" class="ion-text-center ion-padding">
        <ion-icon :icon="alertCircleOutline" size="large" color="warning" />
        <h2>Service non trouvé</h2>
        <p>Le service demandé n'existe pas ou a été supprimé.</p>
        <ion-button @click="goBack" fill="outline">
          Retour aux services
        </ion-button>
      </div>

      <!-- Guest Management Modal -->
      <ion-modal :is-open="showGuestModal" @didDismiss="showGuestModal = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Gérer les invités</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showGuestModal = false">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
          <ion-toolbar>
            <ion-searchbar
              v-model="guestSearchQuery"
              placeholder="Rechercher un membre..."
              :debounce="300"
            ></ion-searchbar>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <div v-if="loadingAllMembers" class="modal-loading">
            <ion-spinner name="crescent" />
            <p>Chargement des membres...</p>
          </div>

          <ion-list v-else>
            <ion-item
              v-for="member in filteredMembers"
              :key="member.id"
              :button="true"
              @click="toggleGuestMember(member)"
              :disabled="savingGuests"
            >
              <ion-avatar slot="start">
                <img v-if="member.avatar" :src="member.avatar" :alt="member.fullName" />
                <div v-else class="avatar-initials">{{ getInitials(member.fullName) }}</div>
              </ion-avatar>
              <ion-label>
                <h3>{{ member.fullName }}</h3>
                <p>{{ member.email }}</p>
              </ion-label>
              <ion-chip v-if="isGuestMember(member.id)" color="success" slot="end">
                <ion-icon :icon="checkmarkCircle" />
                <ion-label>Invité</ion-label>
              </ion-chip>
            </ion-item>
          </ion-list>

          <div v-if="!loadingAllMembers && filteredMembers.length === 0" class="no-results">
            <p>Aucun membre trouvé</p>
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonButton, IonIcon, IonLoading, IonModal, IonSearchbar, IonAvatar,
  IonSpinner, IonList, IonItem, IonLabel, IonChip, IonSegment, IonSegmentButton,
  alertController, toastController, actionSheetController
} from '@ionic/vue';
import {
  arrowBackOutline, ellipsisVertical, checkmarkCircle, alertCircleOutline,
  closeOutline, pencilOutline, personAddOutline, eyeOutline, eyeOffOutline,
  trashOutline, shareOutline, listOutline, musicalNotesOutline, peopleOutline
} from 'ionicons/icons';
import { invitationService } from '@/services/invitationService';
import { Service } from '@/types/service';
import { serviceService } from '@/services/serviceService';
import { db } from '@/firebase/config';
import { doc, onSnapshot, Timestamp, collection, query, where } from 'firebase/firestore';
import { membersService } from '@/firebase/members';
import { teamsService } from '@/firebase/teams';
import { getProgramByServiceId, canUserViewProgram } from '@/firebase/programs';
import { getResourceById, getResourceCollectionById } from '@/firebase/resources';
import { useUser } from '@/composables/useUser';
import type { ServiceProgram } from '@/types/program';
import type { Member } from '@/types/member';
import type { Resource } from '@/types/resource';
import type { ServiceAssignment } from '@/types/assignment';

// Components
import ServiceInfoHeader from '@/components/service-detail/ServiceInfoHeader.vue';
import ProgramOverview from '@/components/service-detail/ProgramOverview.vue';
import ResourcesOverview from '@/components/service-detail/ResourcesOverview.vue';
import MembersOverview from '@/components/service-detail/MembersOverview.vue';

interface ResourceWithCollection extends Resource {
  collectionName?: string;
  isDirect?: boolean; // true if directly associated with service, false if from program
}

interface TeamAssignmentGroup {
  teamId: string;
  teamName: string;
  members: Array<ServiceAssignment & { avatar?: string; position?: string }>;
  requiredMembers?: number;
}

const route = useRoute();
const router = useRouter();
const { user, isAdmin } = useUser();

// Core state
const service = ref<Service | null>(null);
const loading = ref(true);
const updating = ref(false);
const selectedSegment = ref<'programme' | 'ressources' | 'members'>('programme');

// Program state
const program = ref<ServiceProgram | null>(null);
const loadingProgram = ref(false);

// Resources state
const resources = ref<ResourceWithCollection[]>([]);
const loadingResources = ref(false);

// Members state
const teamAssignments = ref<TeamAssignmentGroup[]>([]);
const loadingMembers = ref(false);

// Guest management
const showGuestModal = ref(false);
const guestMembers = ref<Member[]>([]);
const allMembers = ref<Member[]>([]);
const loadingAllMembers = ref(false);
const guestSearchQuery = ref('');
const savingGuests = ref(false);

// Realtime subscription cleanup
let unsubscribeService: (() => void) | null = null;
let unsubscribeAssignments: (() => void) | null = null;

// Computed property for all existing resource IDs (to exclude from add modal)
const existingResourceIds = computed(() => {
  return resources.value.map(r => r.id);
});

// Computed property for program visibility
const canViewProgram = computed(() => {
  return canUserViewProgram(program.value, user.value?.uid, isAdmin.value);
});

// Convert Firestore document to Service type
const convertFirestoreDoc = (id: string, data: any): Service => {
  return {
    id,
    title: data.title,
    date: data.date,
    time: data.time,
    endDate: data.endDate,
    endTime: data.endTime,
    category: data.category,
    isPublished: data.isPublished,
    availabilityDeadline: data.availabilityDeadline,
    teamRequirements: data.teamRequirements,
    guestMemberIds: data.guestMemberIds,
    resourceIds: data.resourceIds,
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toDate().toISOString()
      : data.createdAt,
    modifiedAt: data.modifiedAt instanceof Timestamp
      ? data.modifiedAt.toDate().toISOString()
      : data.modifiedAt
  };
};

// Convert Firestore assignment document
const convertAssignmentDoc = (id: string, data: any): ServiceAssignment => {
  return {
    id,
    serviceId: data.serviceId,
    memberId: data.memberId,
    memberName: data.memberName,
    teamId: data.teamId,
    teamName: data.teamName,
    assignedAt: data.assignedAt instanceof Timestamp
      ? data.assignedAt.toDate().toISOString()
      : data.assignedAt,
    assignedBy: data.assignedBy
  };
};

// Subscribe to realtime updates for the service
const subscribeToService = () => {
  const id = route.params.id as string;
  const serviceRef = doc(db, 'services', id);

  unsubscribeService = onSnapshot(
    serviceRef,
    async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const previousGuestIds = service.value?.guestMemberIds;
        service.value = convertFirestoreDoc(docSnapshot.id, docSnapshot.data());

        // Reload guest members if guest list changed
        const currentGuestIds = service.value?.guestMemberIds;
        if (JSON.stringify(previousGuestIds) !== JSON.stringify(currentGuestIds)) {
          await loadGuestMembers();
        }

        // Load data on first load
        if (loading.value) {
          await Promise.allSettled([
            loadProgram(),
            loadGuestMembers()
          ]);
        }
      } else {
        service.value = null;
      }
      loading.value = false;
    },
    async (error) => {
      console.error('Error in service realtime listener:', error);
      loading.value = false;
      const toast = await toastController.create({
        message: 'Erreur lors du chargement du service',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  );
};

// Subscribe to realtime updates for assignments
const subscribeToAssignments = () => {
  const id = route.params.id as string;
  const assignmentsRef = collection(db, 'assignments');
  const q = query(assignmentsRef, where('serviceId', '==', id));

  unsubscribeAssignments = onSnapshot(
    q,
    async (querySnapshot) => {
      const assignments: ServiceAssignment[] = [];
      querySnapshot.forEach((doc) => {
        assignments.push(convertAssignmentDoc(doc.id, doc.data()));
      });

      // Process assignments into team groups
      await processAssignments(assignments);
      loadingMembers.value = false;
    },
    (error) => {
      console.error('Error in assignments realtime listener:', error);
      loadingMembers.value = false;
    }
  );
};

// Process assignments into grouped team structure
const processAssignments = async (assignments: ServiceAssignment[]) => {
  if (assignments.length === 0) {
    teamAssignments.value = [];
    return;
  }

  // Get team requirements from service
  const teamRequirements = new Map<string, number>();
  if (service.value?.teamRequirements) {
    service.value.teamRequirements.forEach(req => {
      teamRequirements.set(req.teamName, req.membersNeeded);
    });
  }

  // Get member details for avatars
  const memberIds = [...new Set(assignments.map(a => a.memberId))];
  const memberDetails = new Map<string, Member>();

  await Promise.all(
    memberIds.map(async (memberId) => {
      try {
        const member = await membersService.getMemberById(memberId);
        if (member) {
          memberDetails.set(memberId, member);
        }
      } catch (error) {
        console.error(`Error loading member ${memberId}:`, error);
      }
    })
  );

  // Get team details for default positions
  const teamIds = [...new Set(assignments.map(a => a.teamId))];
  const teamDetails = new Map<string, Awaited<ReturnType<typeof teamsService.getTeamById>>>();

  await Promise.all(
    teamIds.map(async (teamId) => {
      try {
        const team = await teamsService.getTeamById(teamId);
        if (team) {
          teamDetails.set(teamId, team);
        }
      } catch (error) {
        console.error(`Error loading team ${teamId}:`, error);
      }
    })
  );

  // Helper to resolve position for an assignment
  const resolvePosition = (assignment: ServiceAssignment): string | undefined => {
    // Priority 1: Service-specific position
    if (assignment.positionName) {
      return assignment.positionName;
    }

    // Priority 2: Default position from team membership
    const team = teamDetails.get(assignment.teamId);
    if (team) {
      const teamMember = team.members.find(m => m.memberId === assignment.memberId);
      if (teamMember?.positionId) {
        return teamsService.getPositionName(team, teamMember.positionId);
      }
    }

    // Priority 3: Nothing
    return undefined;
  };

  // Group assignments by team
  const groupedByTeam = assignments.reduce((acc, assignment) => {
    if (!acc[assignment.teamId]) {
      acc[assignment.teamId] = {
        teamId: assignment.teamId,
        teamName: assignment.teamName,
        members: [],
        requiredMembers: teamRequirements.get(assignment.teamName)
      };
    }

    const member = memberDetails.get(assignment.memberId);
    acc[assignment.teamId].members.push({
      ...assignment,
      avatar: member?.avatar,
      position: resolvePosition(assignment)
    });

    return acc;
  }, {} as Record<string, TeamAssignmentGroup>);

  // Sort teams alphabetically and members within each team
  teamAssignments.value = Object.values(groupedByTeam)
    .sort((a, b) => a.teamName.localeCompare(b.teamName))
    .map(team => ({
      ...team,
      members: team.members.sort((a, b) => a.memberName.localeCompare(b.memberName))
    }));
};

// Load program
const loadProgram = async () => {
  const id = route.params.id as string;
  loadingProgram.value = true;
  try {
    program.value = await getProgramByServiceId(id);
  } catch (error) {
    console.error('Error loading program:', error);
    program.value = null;
  } finally {
    loadingProgram.value = false;
  }
};

// Extract and load resources from program AND direct service association
const loadResources = async () => {
  loadingResources.value = true;
  try {
    const loadedResources: ResourceWithCollection[] = [];
    const loadedIds = new Set<string>();

    // 1. First, load directly associated resources (from service.resourceIds)
    const directResourceIds = service.value?.resourceIds || [];
    for (const id of directResourceIds) {
      if (loadedIds.has(id)) continue;
      try {
        const resource = await getResourceById(id);
        if (resource) {
          const resourceCollection = await getResourceCollectionById(resource.collectionId);
          loadedResources.push({
            ...resource,
            collectionName: resourceCollection?.name,
            isDirect: true
          });
          loadedIds.add(id);
        }
      } catch (error) {
        console.error(`Error loading direct resource ${id}:`, error);
      }
    }

    // 2. Then, load resources from program items
    if (program.value && program.value.items.length > 0) {
      const programResourceIds: string[] = [];
      program.value.items.forEach(item => {
        if (item.resourceId) programResourceIds.push(item.resourceId);
        item.subItems?.forEach(sub => {
          if (sub.resourceId) programResourceIds.push(sub.resourceId);
        });
      });

      for (const id of programResourceIds) {
        if (loadedIds.has(id)) continue; // Skip if already loaded as direct
        try {
          const resource = await getResourceById(id);
          if (resource) {
            const resourceCollection = await getResourceCollectionById(resource.collectionId);
            loadedResources.push({
              ...resource,
              collectionName: resourceCollection?.name,
              isDirect: false
            });
            loadedIds.add(id);
          }
        } catch (error) {
          console.error(`Error loading program resource ${id}:`, error);
        }
      }
    }

    resources.value = loadedResources;
  } catch (error) {
    console.error('Error loading resources:', error);
    resources.value = [];
  } finally {
    loadingResources.value = false;
  }
};

// Handle adding resources to the service
const handleAddResources = async (resourceIds: string[]) => {
  if (!service.value || resourceIds.length === 0) return;

  try {
    const currentResourceIds = service.value.resourceIds || [];
    const newResourceIds = [...new Set([...currentResourceIds, ...resourceIds])];

    await serviceService.updateService({
      ...service.value,
      resourceIds: newResourceIds
    });

    const toast = await toastController.create({
      message: `${resourceIds.length} ressource${resourceIds.length > 1 ? 's' : ''} ajoutée${resourceIds.length > 1 ? 's' : ''}`,
      duration: 2000,
      color: 'success'
    });
    await toast.present();

    // Reload resources to show the new ones
    await loadResources();
  } catch (error) {
    console.error('Error adding resources:', error);
    const toast = await toastController.create({
      message: 'Erreur lors de l\'ajout des ressources',
      duration: 3000,
      color: 'danger'
    });
    await toast.present();
  }
};

// Watch program and service changes to reload resources
watch([program, () => service.value?.resourceIds], () => {
  loadResources();
});

// Guest management functions
const loadGuestMembers = async () => {
  if (!service.value?.guestMemberIds?.length) {
    guestMembers.value = [];
    return;
  }

  try {
    const members = await Promise.all(
      service.value.guestMemberIds.map(id => membersService.getMemberById(id))
    );
    guestMembers.value = members.filter((m): m is Member => m !== null);
  } catch (error) {
    console.error('Error loading guest members:', error);
    guestMembers.value = [];
  }
};

const openGuestModal = async () => {
  showGuestModal.value = true;
  guestSearchQuery.value = '';

  if (allMembers.value.length === 0) {
    loadingAllMembers.value = true;
    try {
      allMembers.value = await membersService.getAllMembers();
    } catch (error) {
      console.error('Error loading all members:', error);
    } finally {
      loadingAllMembers.value = false;
    }
  }
};

const filteredMembers = computed(() => {
  if (!guestSearchQuery.value.trim()) {
    return allMembers.value;
  }

  const searchQuery = guestSearchQuery.value.toLowerCase();
  return allMembers.value.filter(member =>
    member.fullName.toLowerCase().includes(searchQuery) ||
    member.email.toLowerCase().includes(searchQuery)
  );
});

const isGuestMember = (memberId: string) => {
  return service.value?.guestMemberIds?.includes(memberId) || false;
};

const toggleGuestMember = async (member: Member) => {
  if (!service.value) return;

  const currentGuests = service.value.guestMemberIds || [];
  const isRemoving = currentGuests.includes(member.id);
  let newGuests: string[];

  if (isRemoving) {
    newGuests = currentGuests.filter(id => id !== member.id);
  } else {
    newGuests = [...currentGuests, member.id];
  }

  savingGuests.value = true;
  try {
    await serviceService.updateService({
      ...service.value,
      guestMemberIds: newGuests
    });

    const toast = await toastController.create({
      message: isRemoving
        ? `${member.fullName} retiré des invités`
        : `${member.fullName} ajouté comme invité`,
      duration: 2000,
      color: 'success'
    });
    await toast.present();
  } catch (error) {
    console.error('Error updating guests:', error);
    const toast = await toastController.create({
      message: 'Erreur lors de la mise à jour des invités',
      duration: 3000,
      color: 'danger'
    });
    await toast.present();
  } finally {
    savingGuests.value = false;
  }
};

const getInitials = (name: string): string => {
  const names = name.split(' ').filter(n => n.length > 0);
  if (names.length === 0) return '?';
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
};

// Share service
const shareService = async () => {
  if (!service.value) return;

  try {
    await invitationService.shareServiceInvite(service.value);
  } catch (error: any) {
    // If share was cancelled or failed, fallback to clipboard
    if (error?.message !== 'Share canceled') {
      try {
        const link = invitationService.generateInviteLink(service.value.id);
        await navigator.clipboard.writeText(link);
        const toast = await toastController.create({
          message: 'Lien copié dans le presse-papiers',
          duration: 2000,
          color: 'success'
        });
        await toast.present();
      } catch (clipboardError) {
        console.error('Error copying to clipboard:', clipboardError);
        const toast = await toastController.create({
          message: 'Erreur lors du partage',
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      }
    }
  }
};

// Navigation
const goBack = () => {
  router.push('/services');
};

const goToEdit = () => {
  router.push(`/service-form/${service.value?.id}`);
};

const goToProgram = () => {
  router.push(`/service-program/${service.value?.id}`);
};

// Admin actions
const openAdminActions = async () => {
  const buttons = [
    {
      text: 'Modifier le service',
      icon: pencilOutline,
      handler: () => goToEdit()
    },
    {
      text: 'Gérer les invités',
      icon: personAddOutline,
      handler: () => openGuestModal()
    },
    {
      text: service.value?.isPublished ? 'Dépublier' : 'Publier',
      icon: service.value?.isPublished ? eyeOffOutline : eyeOutline,
      handler: () => togglePublishStatus()
    },
    {
      text: 'Supprimer',
      icon: trashOutline,
      role: 'destructive' as const,
      handler: () => confirmDelete()
    },
    {
      text: 'Annuler',
      role: 'cancel' as const
    }
  ];

  const actionSheet = await actionSheetController.create({
    header: 'Actions',
    buttons
  });

  await actionSheet.present();
};

const togglePublishStatus = async () => {
  if (!service.value || updating.value) return;

  updating.value = true;

  try {
    await serviceService.updateService({
      ...service.value,
      isPublished: !service.value.isPublished
    });

    const toast = await toastController.create({
      message: service.value.isPublished ? 'Service dépublié' : 'Service publié',
      duration: 2000,
      color: 'success'
    });
    await toast.present();
  } catch (error) {
    console.error('Error updating publish status:', error);
    const toast = await toastController.create({
      message: 'Erreur lors de la mise à jour du statut',
      duration: 3000,
      color: 'danger'
    });
    await toast.present();
  } finally {
    updating.value = false;
  }
};

const confirmDelete = async () => {
  const alert = await alertController.create({
    header: 'Confirmer la suppression',
    message: 'Êtes-vous sûr de vouloir supprimer ce service ? Cette action est irréversible.',
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel'
      },
      {
        text: 'Supprimer',
        role: 'destructive',
        handler: async () => {
          if (service.value) {
            await serviceService.deleteService(service.value.id);
            router.push('/services');
          }
        }
      }
    ]
  });

  await alert.present();
};

onMounted(() => {
  subscribeToService();
  subscribeToAssignments();
  loadingMembers.value = true;
});

onUnmounted(() => {
  if (unsubscribeService) {
    unsubscribeService();
    unsubscribeService = null;
  }
  if (unsubscribeAssignments) {
    unsubscribeAssignments();
    unsubscribeAssignments = null;
  }
});
</script>

<style scoped>
.segment-tabs {
  margin: 0 16px;
  --background: var(--ion-color-light);
  border-radius: 8px;
}

.segment-tabs ion-segment-button {
  --indicator-color: var(--ion-color-primary);
  --color: var(--ion-color-medium);
  --color-checked: white;
  --background-checked: var(--ion-color-primary);
  font-weight: 500;
  text-transform: none;
  min-height: 44px;
}

.segment-icon {
  font-size: 1.2rem;
}

.segment-label {
  margin-left: 6px;
}

/* Mobile: show only icons */
@media (max-width: 576px) {
  .segment-label {
    display: none;
  }

  .segment-icon {
    font-size: 1.3rem;
  }
}

.tab-content {
  min-height: 200px;
}

/* Modal Styles */
.modal-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  color: var(--ion-color-medium);
}

.modal-loading p {
  margin-top: 16px;
}

.no-results {
  text-align: center;
  padding: 32px 16px;
  color: var(--ion-color-medium);
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
</style>
