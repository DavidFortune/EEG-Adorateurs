export interface SchedulingEvent {
  id: string;
  title: string;
  date: string;           // "Dim 7 sept"
  time: string;           // "11h00"
  datetime: string;       // ISO date
  status: 'brouillon' | 'confirmé' | 'annulé';
}

export interface MemberAssignment {
  id: string;
  name: string;
  availability: 'available' | 'unavailable' | 'maybe' | null;
  isAssigned: boolean;
  isAssignedToOtherTeam: boolean;
  assignedTeamName?: string;
  avatar?: string;
  positionId?: string;                    // Default position from team membership
  positionName?: string;                  // For display
  assignedPositionId?: string | null;     // Override position for this service if assigned
  assignedPositionName?: string | null;
}

export interface TeamAssignment {
  id: string;
  name: string;           // "Louange", "Band", etc.
  required: number;       // Minimum requis
  assigned: number;       // Actuellement assignés
  members: MemberAssignment[];
}

export interface SchedulingState {
  activeEventIndex: number;
  events: SchedulingEvent[];
  viewMode: 'teams' | 'overview';
  selectedTeam: string;
  editingTeam: string | null;
  teams: Record<string, TeamAssignment>;
}

export type ViewMode = 'teams' | 'overview';
export type EventStatus = 'brouillon' | 'confirmé' | 'annulé';
export type AvailabilityStatus = 'available' | 'unavailable' | null;