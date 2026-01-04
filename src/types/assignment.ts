export interface ServiceAssignment {
  id: string;
  serviceId: string;
  teamId: string;
  teamName: string;
  memberId: string;
  memberName: string;
  positionId?: string;   // Position for this specific assignment (can override default)
  positionName?: string; // Denormalized for display
  assignedAt: string;    // ISO timestamp
  assignedBy: string;    // Admin member ID who made the assignment
}

export interface CreateAssignmentRequest {
  serviceId: string;
  teamId: string;
  memberId: string;
  assignedBy: string;
  positionId?: string;   // Optional position override
  positionName?: string; // Denormalized for display
}

export interface ServiceTeamAssignments {
  serviceId: string;
  teamId: string;
  teamName: string;
  requiredCount: number;
  assignments: ServiceAssignment[];
  assignedCount: number;
}