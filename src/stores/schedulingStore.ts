import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { 
  SchedulingEvent, 
  TeamAssignment, 
  MemberAssignment, 
  ViewMode 
} from '@/types/scheduling';
import type { Service } from '@/types/service';
import type { Team } from '@/types/team';
import type { MemberAvailability } from '@/types/availability';
import type { ServiceAssignment } from '@/types/assignment';
import { firestoreService } from '@/firebase/firestore';
import { teamsService } from '@/firebase/teams';
import { assignmentsService } from '@/firebase/assignments';
import { membersService } from '@/firebase/members';
import { timezoneUtils } from '@/utils/timezone';

function convertServiceToSchedulingEvent(service: Service): SchedulingEvent {
  // Format date for display (e.g., "Dim 14 sept")
  const displayDate = timezoneUtils.formatDateForDisplay(service.date)
    .replace(/^\w/, c => c.toUpperCase())
    .replace(/\s+\d{4}$/, '') // Remove year
    .substring(0, 12); // Truncate if too long

  return {
    id: service.id,
    title: service.title,
    date: displayDate,
    time: service.time,
    datetime: `${service.date}T${service.time}:00`,
    status: service.isPublished ? 'confirmé' : 'brouillon'
  };
}

export const useSchedulingStore = defineStore('scheduling', () => {
  // State
  const activeEventIndex = ref(0);
  const viewMode = ref<ViewMode>('teams');
  const selectedTeam = ref('all');
  const editingTeam = ref<string | null>(null);
  const events = ref<SchedulingEvent[]>([]);
  const teams = ref<Record<string, TeamAssignment>>({});
  const loading = ref(false);
  const currentUserId = ref<string | null>(null);

  // Getters
  const currentEvent = computed(() => events.value[activeEventIndex.value]);
  
  const filteredTeams = computed(() => {
    const allTeams = Object.values(teams.value);
    return selectedTeam.value === 'all' 
      ? allTeams 
      : allTeams.filter(t => t.id === selectedTeam.value);
  });

  const globalStats = computed(() => {
    const allTeams = Object.values(teams.value);
    const totalRequired = allTeams.reduce((sum, team) => sum + team.required, 0);
    const totalAssigned = allTeams.reduce((sum, team) => sum + team.assigned, 0);
    const completionPercentage = totalRequired > 0 ? Math.round((totalAssigned / totalRequired) * 100) : 0;
    
    return {
      totalRequired,
      totalAssigned,
      completionPercentage,
      isComplete: totalAssigned >= totalRequired
    };
  });

  const teamOptions = computed(() => [
    { value: 'all', label: 'Toutes les équipes' },
    ...Object.values(teams.value).map(team => ({
      value: team.id,
      label: `${team.name} (${team.assigned}/${team.required})`
    }))
  ]);

  // Actions
  function setActiveEvent(index: number) {
    if (index >= 0 && index < events.value.length) {
      activeEventIndex.value = index;
      editingTeam.value = null; // Reset edit mode
    }
  }

  function setViewMode(mode: ViewMode) {
    viewMode.value = mode;
    editingTeam.value = null; // Reset edit mode when changing view
  }

  function setSelectedTeam(teamId: string) {
    selectedTeam.value = teamId;
    editingTeam.value = null; // Reset edit mode when changing filter
  }


  function enterEditMode(teamId: string) {
    editingTeam.value = teamId;
  }

  function saveAndExitEditMode() {
    // Here you would typically save to backend
    console.log('Saving team assignments...');
    editingTeam.value = null;
  }

  function cancelEditMode() {
    // Here you would typically revert unsaved changes
    editingTeam.value = null;
  }

  function getTeamStatus(team: TeamAssignment): 'complete' | 'partial' | 'empty' {
    if (team.assigned === 0) return 'empty';
    if (team.assigned >= team.required) return 'complete';
    return 'partial';
  }

  function getTeamStatusColor(team: TeamAssignment): string {
    const status = getTeamStatus(team);
    switch (status) {
      case 'complete': return 'success';
      case 'partial': return 'warning';
      case 'empty': return 'danger';
      default: return 'medium';
    }
  }

  function getTeamStatusLabel(team: TeamAssignment): string {
    const status = getTeamStatus(team);
    switch (status) {
      case 'complete': return 'Complet';
      case 'partial': return 'Partiel';
      case 'empty': return 'Vide';
      default: return 'Inconnu';
    }
  }


  function saveDraft() {
    if (currentEvent.value) {
      console.log('Brouillon sauvé pour:', currentEvent.value.title);
    }
  }

  function cancelService() {
    if (currentEvent.value) {
      // Update event status to cancelled
      const event = events.value[activeEventIndex.value];
      event.status = 'annulé';
      console.log('Service annulé:', event.title);
    }
  }

  // New real data functions
  async function loadServices() {
    try {
      loading.value = true;
      const services = await firestoreService.getAllServices();
      
      // Convert services to scheduling events and sort by date
      events.value = services
        .map(convertServiceToSchedulingEvent)
        .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
      
      // Load the current event's team data if events exist
      if (events.value.length > 0) {
        await loadCurrentEventTeams();
      }
    } catch (error) {
      console.error('Error loading services:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function loadCurrentEventTeams() {
    const event = currentEvent.value;
    if (!event) return;

    try {
      loading.value = true;
      
      // Get the service details to access team requirements
      const service = await firestoreService.getServiceById(event.id);
      if (!service || !service.teamRequirements) {
        teams.value = {};
        return;
      }

      // Get all teams from Firestore
      const allTeams = await teamsService.getAllTeams();
      const teamMap = new Map(allTeams.map(team => [team.name, team]));

      // Get assignments for this service
      const assignments = await assignmentsService.getServiceAssignments(event.id);


      // Get all members to build a member map (refresh this too)
      const allMembers = await membersService.getAllMembers();
      const memberMap = new Map(allMembers.map(member => [member.id, member]));

      const newTeams: Record<string, TeamAssignment> = {};

      // Process each team requirement
      for (const requirement of service.teamRequirements) {
        if (!requirement.isActive) continue;
        
        const team = teamMap.get(requirement.teamName);
        if (!team) continue;

        // Get team assignments for this service
        const teamAssignments = assignments.filter(a => a.teamId === team.id);
        const assignedMemberIds = new Set(teamAssignments.map(a => a.memberId));

        // Build member list with availability and assignment status
        const members: MemberAssignment[] = [];
        
        for (const teamMember of team.members) {
          const memberDetails = memberMap.get(teamMember.memberId);
          if (!memberDetails) {
            console.warn(`Member not found in memberMap:`, teamMember.memberId);
            continue;
          }

          // Get availability from member.availabilities object
          // The availabilities are stored as { [serviceId]: 'available' | 'unavailable' | null }
          const memberAvailability = memberDetails.availabilities?.[event.id] || null;

          members.push({
            id: teamMember.memberId,
            name: memberDetails.fullName,
            availability: memberAvailability,
            isAssigned: assignedMemberIds.has(teamMember.memberId),
            avatar: memberDetails.avatar
          });
        }

        newTeams[team.id] = {
          id: team.id,
          name: team.name,
          required: requirement.membersNeeded,
          assigned: teamAssignments.length,
          members
        };
      }

      teams.value = newTeams;
    } catch (error) {
      console.error('Error loading current event teams:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function toggleMemberAssignmentReal(teamId: string, memberId: string) {
    const team = teams.value[teamId];
    const event = currentEvent.value;
    
    if (!team || !event || !currentUserId.value) return;
    
    const member = team.members.find(m => m.id === memberId);
    if (!member || (member.availability !== 'available' && member.availability !== 'maybe')) return;

    try {
      if (member.isAssigned) {
        // Remove assignment
        await assignmentsService.removeAssignment(event.id, teamId, memberId);
        member.isAssigned = false;
        team.assigned--;
      } else {
        // Create assignment
        const allMembers = await membersService.getAllMembers();
        const memberDetails = allMembers.find(m => m.id === memberId);
        if (memberDetails) {
          await assignmentsService.createAssignment(
            {
              serviceId: event.id,
              teamId: teamId,
              memberId: memberId,
              assignedBy: currentUserId.value
            },
            memberDetails.fullName,
            team.name
          );
          member.isAssigned = true;
          team.assigned++;
        }
      }
    } catch (error) {
      console.error('Error toggling member assignment:', error);
      throw error;
    }
  }

  async function confirmSchedulingReal() {
    const event = currentEvent.value;
    if (!event) return;

    try {
      // Update service status to published
      const service = await firestoreService.getServiceById(event.id);
      if (service) {
        await firestoreService.updateService({
          id: service.id,
          title: service.title,
          date: service.date,
          time: service.time,
          category: service.category,
          isPublished: true,
          availabilityDeadline: service.availabilityDeadline,
          teamRequirements: service.teamRequirements
        });
        
        // Update local state
        event.status = 'confirmé';
      }
    } catch (error) {
      console.error('Error confirming scheduling:', error);
      throw error;
    }
  }

  function setCurrentUserId(userId: string) {
    currentUserId.value = userId;
  }

  // Function to refresh data when availability changes
  async function refreshCurrentEventData() {
    if (currentEvent.value) {
      await loadCurrentEventTeams();
    }
  }

  return {
    // State
    activeEventIndex,
    viewMode,
    selectedTeam,
    editingTeam,
    events,
    teams,
    loading,
    // Getters
    currentEvent,
    filteredTeams,
    globalStats,
    teamOptions,
    // Actions
    setActiveEvent,
    setViewMode,
    setSelectedTeam,
    toggleMemberAssignment: toggleMemberAssignmentReal,
    enterEditMode,
    saveAndExitEditMode,
    cancelEditMode,
    getTeamStatus,
    getTeamStatusColor,
    getTeamStatusLabel,
    confirmScheduling: confirmSchedulingReal,
    saveDraft,
    cancelService,
    // New real data actions
    loadServices,
    loadCurrentEventTeams,
    setCurrentUserId,
    refreshCurrentEventData
  };
});